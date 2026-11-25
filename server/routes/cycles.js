/**
 * Appraisal cycles — HR/Admin initiates a cycle (Draft), configures the goal framework,
 * publishes it (Open) and closes it when done (Closed). Employees and managers only see
 * published cycles; employees only those they are eligible for.
 */
import { Router } from 'express';
import { cleanCycle, cycleProblems, isEligible, registerCycles, reminderFor, visibleCycles } from '../../src/data/cycles.js';
import { appraisalStatus, getPlan, goalsFor } from '../../src/data/goals.js';
import { requireAuth, requireRole } from '../auth.js';
import { getDb, nextId, persist, remove, save } from '../db.js';
import { HttpError, route, todayIso } from '../http.js';
import { notify, toAll, toRoles } from '../realtime.js';

export const cyclesRouter = Router();
cyclesRouter.use(requireAuth);

function findCycle(id) {
  const cycle = getDb().cycles.find((c) => c.id === Number(id));
  if (!cycle) throw new HttpError(404, 'Appraisal cycle not found.');
  return cycle;
}

function validate(cycle) {
  const problems = cycleProblems(cycle, getDb().cycles);
  const [field] = Object.keys(problems);
  if (field) throw new HttpError(400, `${field}: ${problems[field]}`);
}

/** Saves, re-registers the rules, persists and pushes the change to everyone (each client filters by role). */
function commit(cycle) {
  save('cycles', cycle);
  registerCycles(getDb().cycles);
  persist();
  // Drafts are HR-only; published cycles go to everyone (each client still filters by eligibility).
  if (cycle.status === 'Draft') toRoles(['hr'], 'cycle:updated', cycle);
  else toAll('cycle:updated', cycle);
  return cycle;
}

const eligibleUsers = (cycle) => getDb().users.filter((u) => u.active !== false && (
  u.role === 'manager' || (u.role === 'employee' && isEligible(cycle, u))));

cyclesRouter.get('/cycles', route((req, res) => res.json(visibleCycles(getDb().cycles, req.user))));

cyclesRouter.post('/cycles', requireRole('hr'), route((req, res) => {
  const cycle = { id: nextId('cycles'), ...cleanCycle(req.body || {}), status: 'Draft', createdAt: todayIso(), createdBy: req.user.name };
  validate(cycle);
  res.status(201).json(commit(cycle));
}));

cyclesRouter.patch('/cycles/:id', requireRole('hr'), route((req, res) => {
  const current = findCycle(req.params.id);
  if (current.status === 'Closed') throw new HttpError(409, 'Closed cycles cannot be edited.');
  const input = cleanCycle({ ...current, ...(req.body || {}), framework: { ...current.framework, ...(req.body?.framework || {}) } });
  let next = { ...current, ...input };
  if (current.status === 'Open') {
    // Goals already exist against these rules: the name, start date and framework rules stay fixed.
    next = {
      ...next, period: current.period, start: current.start,
      framework: { ...current.framework, instructions: input.framework.instructions },
    };
  }
  validate(next);
  res.json(commit(next));
}));

cyclesRouter.delete('/cycles/:id', requireRole('hr'), route((req, res) => {
  const cycle = findCycle(req.params.id);
  if (cycle.status !== 'Draft') throw new HttpError(409, 'Only draft cycles can be deleted.');
  remove('cycles', cycle.id);
  registerCycles(getDb().cycles);
  persist();
  toRoles(['hr'], 'cycle:deleted', { id: cycle.id });
  res.json({ id: cycle.id });
}));

cyclesRouter.post('/cycles/:id/publish', requireRole('hr'), route((req, res) => {
  const cycle = findCycle(req.params.id);
  if (cycle.status !== 'Draft') throw new HttpError(409, `This cycle is already ${cycle.status.toLowerCase()}.`);
  validate(cycle);
  const saved = commit({ ...cycle, status: 'Open', publishedAt: todayIso(), publishedBy: req.user.name });
  const people = eligibleUsers(saved);
  notify(people.filter((u) => u.role === 'employee').map((u) => u.id), {
    title: `Appraisal cycle ${saved.period} is open`, detail: `Set your goals by ${saved.goalDeadline}`, tone: 'info',
    link: `/goals?period=${encodeURIComponent(saved.period)}`,
  });
  notify(people.filter((u) => u.role === 'manager').map((u) => u.id), {
    title: `Appraisal cycle ${saved.period} is open`, detail: `Your team sets goals by ${saved.goalDeadline}; approve them as they arrive`, tone: 'info',
    link: `/goals?period=${encodeURIComponent(saved.period)}`,
  });
  res.json(saved);
}));

/** HR reminds every eligible employee who still has something to do in an open cycle. */
cyclesRouter.post('/cycles/:id/remind', requireRole('hr'), route((req, res) => {
  const cycle = findCycle(req.params.id);
  if (cycle.status !== 'Open') throw new HttpError(409, 'Reminders can only be sent for open cycles.');
  const db = getDb();
  const groups = {};
  db.users.filter((u) => u.role === 'employee' && u.active !== false && isEligible(cycle, u)).forEach((u) => {
    const status = appraisalStatus(getPlan(db.goalPlans, u.id, cycle.period), goalsFor(db.goals, u.id, cycle.period));
    const message = reminderFor(status, cycle);
    if (message) (groups[status] ||= { message, ids: [] }).ids.push(u.id);
  });
  const link = `/goals?period=${encodeURIComponent(cycle.period)}`;
  Object.values(groups).forEach(({ message, ids }) => notify(ids, { ...message, tone: 'warning', link }));
  const byStatus = Object.fromEntries(Object.entries(groups).map(([s, g]) => [s, g.ids.length]));
  res.json({ sent: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus });
}));

cyclesRouter.post('/cycles/:id/close', requireRole('hr'), route((req, res) => {
  const cycle = findCycle(req.params.id);
  if (cycle.status !== 'Open') throw new HttpError(409, 'Only open cycles can be closed.');
  const saved = commit({ ...cycle, status: 'Closed', closedAt: todayIso(), closedBy: req.user.name });
  notify(eligibleUsers(saved).map((u) => u.id), {
    title: `Appraisal cycle ${saved.period} is closed`, detail: 'The cycle is now read-only.', tone: 'info',
    link: `/goals?period=${encodeURIComponent(saved.period)}`,
  });
  res.json(saved);
}));
