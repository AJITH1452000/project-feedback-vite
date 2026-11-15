import { Router } from 'express';
import { PASSWORD_MIN } from '../../src/data/constants.js';
import {
  checkLoginRate, clearLoginFailures, createSession, destroySession, hashPassword, recordLoginFailure, requireAuth, sessionUser, verifyPassword,
} from '../auth.js';
import { getDb, nextId, persist } from '../db.js';
import { HttpError, isEmail, requireText, route, text } from '../http.js';
import { endSession } from '../realtime.js';

export const authRouter = Router();
const DUMMY_HASH = hashPassword('timing-equaliser');

/** First run: is there an account yet? */
authRouter.get('/setup', route((_req, res) => {
  res.json({ needsSetup: getDb().users.length === 0 });
}));

/** First run only: create the first administrator account and sign in. */
authRouter.post('/setup', route((req, res) => {
  const db = getDb();
  if (db.users.length) throw new HttpError(409, 'The workspace is already set up. Please sign in.');
  const { name, email, password, title, role } = req.body || {};
  const user = {
    id: nextId('users'),
    name: requireText(name, 2, 'Enter your full name', 80),
    email: String(email || '').trim().toLowerCase(),
    title: text(title, 80) || (role === 'hr' ? 'HR administrator' : 'Manager'),
    role: role === 'hr' ? 'hr' : 'manager',
    track: 'Lead',
    dept: role === 'hr' ? 'HR' : 'Delivery',
    managerId: null,
    passwordHash: '',
    active: true,
    createdAt: new Date().toISOString(),
  };
  if (!isEmail(user.email)) throw new HttpError(400, 'Enter a valid email address.');
  if (String(password || '').length < PASSWORD_MIN) throw new HttpError(400, `Password must be at least ${PASSWORD_MIN} characters.`);
  user.passwordHash = hashPassword(password);
  db.users.push(user);
  persist();
  createSession(res, user, req);
  res.status(201).json(sessionUser(user));
}));

authRouter.post('/login', route((req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');
  const key = `${req.ip}|${email}`;
  checkLoginRate(key);
  const user = getDb().users.find((u) => u.email === email);
  // Always run a hash comparison so response time doesn't reveal which emails exist.
  const ok = verifyPassword(password, user?.passwordHash || DUMMY_HASH) && Boolean(user);
  if (!ok) {
    recordLoginFailure(key);
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (user.active === false) throw new HttpError(403, 'This account has been deactivated. Contact your administrator.');
  clearLoginFailures(key);
  user.lastLoginAt = new Date().toISOString();
  persist();
  createSession(res, user, req);
  res.json(sessionUser(user));
}));

authRouter.post('/logout', route((req, res) => {
  if (req.sessionHash) {
    endSession(req.sessionHash);
    destroySession(res, req.sessionHash);
  }
  res.status(204).end();
}));

authRouter.get('/me', requireAuth, route((req, res) => {
  res.json(sessionUser(req.user));
}));

authRouter.post('/password', requireAuth, route((req, res) => {
  const { current, next } = req.body || {};
  if (!verifyPassword(current, req.user.passwordHash)) throw new HttpError(400, 'Your current password is incorrect.');
  if (String(next || '').length < PASSWORD_MIN) throw new HttpError(400, `New password must be at least ${PASSWORD_MIN} characters.`);
  req.user.passwordHash = hashPassword(next);
  // Sign out other devices; keep this session.
  const db = getDb();
  db.sessions = db.sessions.filter((s) => s.userId !== req.user.id || s.tokenHash === req.sessionHash);
  persist();
  res.json({ ok: true });
}));
