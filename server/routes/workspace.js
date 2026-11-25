/** Projects, reviews, review history, insight signals, notifications and review settings. */
import { Router } from 'express';
import { FEEDBACK_VISIBILITY, QUALITY_LEVELS, REVIEW_TYPES } from '../../src/data/constants.js';
import { requireAuth, requireRole } from '../auth.js';
import { getDb, nextId, persist } from '../db.js';
import { HttpError, route, text, todayIso } from '../http.js';
import { notify, toAll, toRoles, toUsers } from '../realtime.js';

export const workspaceRouter = Router();
workspaceRouter.use(requireAuth);

const activeEmployee = (id) => getDb().users.find((u) => u.id === id && u.role === 'employee' && u.active !== false);
const managers = () => getDb().users.filter((u) => u.role === 'manager' && u.active !== false).map((u) => u.id);

/* ------------------------------- Projects ------------------------------- */
workspaceRouter.get('/projects', route((_req, res) => res.json(getDb().projects)));

workspaceRouter.post('/projects', requireRole('manager'), route((req, res) => {
  const db = getDb();
  const input = req.body || {};
  const n = text(input.n, 80);
  const c = text(input.c, 80);
  if (n.length < 3) throw new HttpError(400, 'Project name must be at least 3 characters.');
  if (!c) throw new HttpError(400, 'Enter the client name.');
  if (!['High', 'Medium', 'Low'].includes(input.pr)) throw new HttpError(400, 'Choose a valid priority.');
  if (!input.s || !input.e || input.e < input.s) throw new HttpError(400, 'End date must be on or after the start date.');
  if (db.projects.some((p) => p.n.toLowerCase() === n.toLowerCase())) throw new HttpError(409, 'A project with this name already exists.');
  const team = [...new Set((input.t || []).map(Number))].filter((id) => activeEmployee(id));
  if (!team.length) throw new HttpError(400, 'Assign at least one team member.');
  const project = { id: nextId('projects'), n, c, pr: input.pr, s: input.s, e: input.e, t: team, createdBy: req.user.id, createdAt: new Date().toISOString() };
  db.projects.push(project);
  persist();
  toAll('project:created', project);
  notify(team, { title: 'Added to a project', detail: `${project.n} · ${project.c}`, tone: 'info', link: '/me' });
  res.status(201).json(project);
}));

/* -------------------------------- Reviews ------------------------------- */
const visibleReviews = (user) => {
  const all = getDb().reviews;
  if (user.role === 'manager' || user.role === 'hr') return all;
  return all.filter((r) => r.u === user.id && r.status !== 'Manager draft');
};

workspaceRouter.get('/reviews', route((req, res) => res.json(visibleReviews(req.user))));
workspaceRouter.get('/reviews/history', requireRole('manager', 'hr'), route((_req, res) => res.json(getDb().history)));

function publishReview(review, historyItem) {
  const db = getDb();
  db.reviews.push(review);
  db.history.unshift(historyItem);
  persist();
  toRoles(['manager', 'hr'], 'review:created', { review, historyItem });
  if (review.status !== 'Manager draft') {
    toUsers([review.u], 'review:created', { review, historyItem: null });
    const project = db.projects.find((p) => p.id === review.p);
    notify([review.u], { title: 'New feedback shared with you', detail: `${project?.n || 'Project'} · from ${review.by}`, tone: review.f?.length ? 'warning' : 'success', link: '/me' });
  }
}

workspaceRouter.post('/reviews', requireRole('manager'), route((req, res) => {
  const db = getDb();
  const d = todayIso();
  // Quick "Submit project feedback" form.
  if (req.body?.quick) {
    const input = req.body.quick;
    if (!(input.overall >= 1 && input.overall <= 5)) throw new HttpError(400, 'Select an overall rating from 1 to 5.');
    if (text(input.strengths, 1000).length < 12) throw new HttpError(400, 'Add at least 12 characters of strengths / evidence.');
    if (!REVIEW_TYPES.includes(input.type)) throw new HttpError(400, 'Choose a review type.');
    if (!QUALITY_LEVELS.includes(input.delivery) || !QUALITY_LEVELS.includes(input.collaboration)) throw new HttpError(400, 'Rate delivery and collaboration.');
    if (!FEEDBACK_VISIBILITY.includes(input.visibility)) throw new HttpError(400, 'Choose who can see this feedback.');
    const project = db.projects.find((p) => p.id === Number(input.p));
    if (!project?.t.includes(Number(input.u))) throw new HttpError(400, 'This person is not assigned to the selected project.');
    const isDraft = input.visibility === 'Private draft (manager only)';
    const member = db.users.find((u) => u.id === Number(input.u));
    const review = {
      id: nextId('reviews'), p: project.id, u: member.id, by: req.user.name, byId: req.user.id, kind: 'quick', s: null, o: Number(input.overall), f: [],
      note: text(input.strengths, 1000), d, status: isDraft ? 'Manager draft' : 'Employee response pending',
      q: {
        type: input.type, period: text(input.period, 60), delivery: input.delivery, collaboration: input.collaboration,
        development: text(input.development, 1000), comment: text(input.comment, 1000),
        nextDate: input.type === 'Quarterly review' ? input.nextDate || null : null, visibility: input.visibility, ai: input.ai || null,
      },
    };
    const historyItem = {
      id: review.id, employee: member.name, project: project.n, period: `${input.type} · ${review.q.period}`,
      rating: review.o, status: review.status, role: member.title, date: d,
    };
    publishReview(review, historyItem);
    return res.status(201).json({ review, historyItem });
  }
  // Full rubric review.
  const { review: input, meta } = req.body || {};
  if (!input?.u || !input?.p) throw new HttpError(400, 'Choose an employee and a project.');
  if (!Array.isArray(input.s) || input.s.length !== 4 || input.s.some((v) => !(v >= 1 && v <= 5))) throw new HttpError(400, 'Rate all four dimensions from 1 to 5.');
  const project = db.projects.find((p) => p.id === Number(input.p));
  if (!project?.t.includes(Number(input.u))) throw new HttpError(400, 'This person is not assigned to the selected project.');
  const member = db.users.find((u) => u.id === Number(input.u));
  const review = {
    id: nextId('reviews'), p: project.id, u: member.id, by: text(input.by, 60) || req.user.name, byId: req.user.id,
    s: input.s.map(Number), f: Array.isArray(input.f) ? input.f.map((x) => text(x, 60)) : [], note: text(input.note, 1000), d,
    status: 'Employee response pending',
  };
  const historyItem = {
    id: review.id, employee: member.name, project: project.n, period: text(meta?.period, 60) || 'Current period',
    rating: Number((review.s.reduce((a, b) => a + b, 0) / 4).toFixed(1)), status: review.status, role: text(meta?.role, 60) || member.title, date: d,
  };
  publishReview(review, historyItem);
  return res.status(201).json({ review, historyItem });
}));

/* ------------------------------ AI signals ------------------------------ */
// No mailbox/chat integration is connected, so the signal list starts empty.
workspaceRouter.get('/insights/signals', requireRole('manager'), route((_req, res) => res.json(getDb().signals)));
workspaceRouter.patch('/insights/signals/:id', requireRole('manager'), route((req, res) => {
  const signal = getDb().signals.find((s) => String(s.id) === req.params.id);
  if (!signal) throw new HttpError(404, 'Signal not found.');
  ['verified', 'flagged'].forEach((k) => { if (req.body?.[k] !== undefined) signal[k] = Boolean(req.body[k]); });
  persist();
  toRoles(['manager'], 'signal:updated', signal);
  res.json(signal);
}));

/* ----------------------------- Notifications ---------------------------- */
workspaceRouter.get('/notifications', route((req, res) => {
  res.json(getDb().notifications.filter((n) => n.userId === req.user.id).sort((a, b) => b.id - a.id).slice(0, 50));
}));
workspaceRouter.post('/notifications/read', route((req, res) => {
  const ids = (req.body?.ids || []).map(Number);
  const mine = getDb().notifications.filter((n) => n.userId === req.user.id && ids.includes(n.id));
  mine.forEach((n) => { n.unread = false; });
  persist();
  toUsers([req.user.id], 'notifications:read', { ids: mine.map((n) => n.id) }); // sync other tabs
  res.json({ ok: true });
}));

/* -------------------------------- Settings ------------------------------ */
workspaceRouter.get('/settings/review', route((_req, res) => res.json(getDb().settings)));
workspaceRouter.put('/settings/review', requireRole('manager', 'hr'), route((req, res) => {
  const db = getDb();
  const input = req.body || {};
  db.settings = {
    ...db.settings,
    cycle: ['quarterly', 'monthly', 'closureOnly'].includes(input.cycle) ? input.cycle : db.settings.cycle,
    visibility: text(input.visibility, 60) || db.settings.visibility,
    safeguardRequired: Boolean(input.safeguardRequired),
    reminders: Boolean(input.reminders),
    hrReview: true, // required step of the appraisal workflow
  };
  persist();
  toAll('settings:updated', db.settings);
  res.json(db.settings);
}));

export { managers };
