/**
 * Socket.IO real-time layer. Sockets authenticate with the same session cookie as the REST API
 * and join rooms: `user:<id>`, `role:<role>`, `session:<hash>` and `all`.
 * Routes call emit helpers after every successful write; notifications are stored and pushed.
 */
import { Server } from 'socket.io';
import { COOKIE, parseCookies, resolveSession } from './auth.js';
import { getDb, nextId, persist } from './db.js';

let io = null;

export function attachRealtime(httpServer) {
  io = new Server(httpServer, { path: '/socket.io', cors: { origin: false } });
  io.use((socket, next) => {
    const resolved = resolveSession(parseCookies(socket.handshake.headers.cookie)[COOKIE]);
    if (!resolved) return next(new Error('unauthorized'));
    socket.data.user = resolved.user;
    socket.join([`user:${resolved.user.id}`, `role:${resolved.user.role}`, `session:${resolved.tokenHash}`, 'all']);
    return next();
  });
  return io;
}

const ids = (list) => [...new Set(list.filter((x) => x !== null && x !== undefined))];

/** Emit to specific users (by id). */
export function toUsers(userIds, event, payload) {
  if (!io) return;
  const rooms = ids(userIds).map((id) => `user:${id}`);
  if (rooms.length) io.to(rooms).emit(event, payload);
}
export function toRoles(roles, event, payload) {
  if (io) io.to(roles.map((r) => `role:${r}`)).emit(event, payload);
}
export function toAll(event, payload) {
  if (io) io.to('all').emit(event, payload);
}
/** Force sockets of one session (logout) or one user (deactivated) to disconnect. */
export function endSession(tokenHash) {
  if (io) io.in(`session:${tokenHash}`).disconnectSockets(true);
}
export function endUser(userId) {
  if (io) io.in(`user:${userId}`).disconnectSockets(true);
}

/** Store a notification for each recipient and push it live. */
export function notify(userIds, { title, detail = '', tone = 'info', link = null }) {
  const db = getDb();
  const now = new Date().toISOString();
  ids(userIds).forEach((userId) => {
    const n = { id: nextId('notifications'), userId, title, detail, tone, link, time: now, unread: true };
    db.notifications.push(n);
    toUsers([userId], 'notification:new', n);
  });
  persist();
}
