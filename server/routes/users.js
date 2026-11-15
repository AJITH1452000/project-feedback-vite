import { Router } from 'express';
import { DEPARTMENT_OPTIONS, PASSWORD_MIN, TRACKS } from '../../src/data/constants.js';
import { destroyUserSessions, hashPassword, publicUser, requireAuth, requireRole } from '../auth.js';
import { getDb, nextId, persist } from '../db.js';
import { HttpError, isEmail, requireText, route, text } from '../http.js';
import { endUser, toAll } from '../realtime.js';

export const usersRouter = Router();

/** Employees (active). Everyone signed in can see names/titles — needed for projects and reviews. */
usersRouter.get('/', requireAuth, route((_req, res) => {
  res.json(getDb().users.filter((u) => u.role === 'employee' && u.active !== false).map(publicUser));
}));

/** Full directory incl. managers, HR and deactivated accounts — for user management. */
usersRouter.get('/directory', requireRole('manager', 'hr'), route((_req, res) => {
  res.json(getDb().users.map(publicUser));
}));

function validateProfile(input, { creator, existing }) {
  const db = getDb();
  const role = creator.role === 'hr' ? (input.role ?? existing?.role ?? 'employee') : (existing?.role ?? 'employee');
  if (!['employee', 'manager', 'hr'].includes(role)) throw new HttpError(400, 'Choose a valid role.');
  const managerId = input.managerId === undefined ? existing?.managerId ?? null : (input.managerId === null || input.managerId === '' ? null : Number(input.managerId));
  if (role === 'employee') {
    const manager = db.users.find((u) => u.id === managerId && u.role === 'manager' && u.active !== false);
    if (!manager) throw new HttpError(400, 'Employees need a reporting manager.');
  }
  const track = input.track ?? existing?.track ?? 'Member';
  if (!TRACKS.includes(track)) throw new HttpError(400, 'Choose Member or Lead.');
  const dept = text(input.dept ?? existing?.dept ?? '', 60);
  if (!dept) throw new HttpError(400, `Choose a department (e.g. ${DEPARTMENT_OPTIONS.slice(0, 3).join(', ')}).`);
  return {
    name: input.name === undefined ? existing.name : requireText(input.name, 2, 'Enter the full name', 80),
    title: input.title === undefined ? existing.title : requireText(input.title, 2, 'Enter a job title', 80),
    role, track, dept, managerId: role === 'employee' ? managerId : null,
  };
}

/** Manager: adds employees (reporting to themselves by default). HR: adds anyone. */
usersRouter.post('/', requireRole('manager', 'hr'), route((req, res) => {
  const db = getDb();
  const input = req.body || {};
  if (req.user.role === 'manager' && input.role && input.role !== 'employee') throw new HttpError(403, 'Managers can add employees only. Ask HR to add managers.');
  const email = String(input.email || '').trim().toLowerCase();
  if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (db.users.some((u) => u.email === email)) throw new HttpError(409, 'Someone already uses this email address.');
  if (String(input.password || '').length < PASSWORD_MIN) throw new HttpError(400, `Temporary password must be at least ${PASSWORD_MIN} characters.`);
  const profile = validateProfile({ ...input, managerId: input.managerId ?? (req.user.role === 'manager' ? req.user.id : undefined) }, { creator: req.user });
  const user = {
    id: nextId('users'), email, ...profile, passwordHash: hashPassword(input.password), active: true,
    createdAt: new Date().toISOString(), createdBy: req.user.id,
  };
  db.users.push(user);
  persist();
  toAll('user:updated', publicUser(user));
  res.status(201).json(publicUser(user));
}));

/** Edit profile, deactivate/reactivate, or reset password. */
usersRouter.patch('/:id', requireRole('manager', 'hr'), route((req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === Number(req.params.id));
  if (!user) throw new HttpError(404, 'User not found.');
  if (req.user.role === 'manager' && !(user.role === 'employee' && user.managerId === req.user.id)) {
    throw new HttpError(403, 'Managers can only edit their own team members.');
  }
  const input = req.body || {};
  if (input.active === false && user.id === req.user.id) throw new HttpError(400, 'You cannot deactivate your own account.');
  if (input.email !== undefined) {
    const email = String(input.email).trim().toLowerCase();
    if (!isEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
    if (db.users.some((u) => u.email === email && u.id !== user.id)) throw new HttpError(409, 'Someone already uses this email address.');
    user.email = email;
  }
  Object.assign(user, validateProfile(input, { creator: req.user, existing: user }));
  if (input.password !== undefined) {
    if (String(input.password).length < PASSWORD_MIN) throw new HttpError(400, `Password must be at least ${PASSWORD_MIN} characters.`);
    user.passwordHash = hashPassword(input.password);
    destroyUserSessions(user.id);
    endUser(user.id);
  }
  if (input.active !== undefined) {
    user.active = Boolean(input.active);
    if (!user.active) { destroyUserSessions(user.id); endUser(user.id); }
  }
  user.updatedAt = new Date().toISOString();
  persist();
  toAll('user:updated', publicUser(user));
  res.json(publicUser(user));
}));
