/**
 * Authentication: scrypt password hashes, opaque session tokens in an HttpOnly cookie
 * (only a SHA-256 of the token is stored), CSRF header check and role guards.
 */
import crypto from 'node:crypto';
import { getDb, nextId, persist } from './db.js';
import { HttpError } from './http.js';

export const COOKIE = 'profeed_session';
const SESSION_DAYS = 7;
const IS_PROD = process.env.NODE_ENV === 'production';

/* ------------------------------ Passwords ------------------------------ */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/* ------------------------------- Shapes -------------------------------- */
/** What the browser gets for the signed-in user. */
export const sessionUser = (u) => ({
  id: u.id, userId: u.id, role: u.role, name: u.name, title: u.title, email: u.email,
  track: u.track, dept: u.dept, managerId: u.managerId ?? null,
});

/** What the browser gets in user lists (frontend short keys: n, r, t). */
export const publicUser = (u) => ({
  id: u.id, n: u.name, r: u.track, t: u.title, role: u.role, email: u.email, dept: u.dept,
  managerId: u.managerId ?? null, active: u.active !== false, createdAt: u.createdAt,
});

/* ------------------------------ Sessions ------------------------------- */
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => part.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}

export function createSession(res, user, req) {
  const token = crypto.randomBytes(32).toString('base64url');
  const db = getDb();
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => s.expiresAt > now); // prune expired
  db.sessions.push({
    id: nextId('sessions'), tokenHash: sha256(token), userId: user.id,
    createdAt: new Date(now).toISOString(), expiresAt: now + SESSION_DAYS * 86_400_000,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
  });
  persist();
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: IS_PROD, path: '/', maxAge: SESSION_DAYS * 86_400_000,
  });
  return sha256(token);
}

/** Resolve a raw cookie token to { user, tokenHash } or null. */
export function resolveSession(token) {
  if (!token) return null;
  const db = getDb();
  const tokenHash = sha256(token);
  const session = db.sessions.find((s) => s.tokenHash === tokenHash && s.expiresAt > Date.now());
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId && u.active !== false);
  return user ? { user, tokenHash } : null;
}

export function destroySession(res, tokenHash) {
  const db = getDb();
  db.sessions = db.sessions.filter((s) => s.tokenHash !== tokenHash);
  persist();
  res.clearCookie(COOKIE, { path: '/' });
}

export function destroyUserSessions(userId) {
  const db = getDb();
  db.sessions = db.sessions.filter((s) => s.userId !== userId);
  persist();
}

/* ----------------------------- Middleware ------------------------------ */
export function authenticate(req, _res, next) {
  const resolved = resolveSession(parseCookies(req.headers.cookie)[COOKIE]);
  req.user = resolved?.user || null;
  req.sessionHash = resolved?.tokenHash || null;
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Your session has expired. Please sign in again.'));
  return next();
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please sign in.'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to do this.'));
  return next();
};

/** CSRF: browsers cannot send this custom header cross-site without a CORS preflight. */
export function csrfGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') return next(new HttpError(403, 'Missing X-Requested-With header.'));
  return next();
}

/* ---------------------------- Rate limiting ---------------------------- */
const attempts = new Map();
const WINDOW_MS = 10 * 60_000;
const MAX_FAILS = 8;

export function checkLoginRate(key) {
  const entry = attempts.get(key);
  if (entry && Date.now() - entry.first < WINDOW_MS && entry.count >= MAX_FAILS) {
    const mins = Math.ceil((WINDOW_MS - (Date.now() - entry.first)) / 60_000);
    throw new HttpError(429, `Too many failed sign-in attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`);
  }
}
export function recordLoginFailure(key) {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.first >= WINDOW_MS) attempts.set(key, { first: Date.now(), count: 1 });
  else entry.count += 1;
}
export const clearLoginFailures = (key) => attempts.delete(key);
