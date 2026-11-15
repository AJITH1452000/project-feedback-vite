/**
 * Goal setting workflow: Employee → Manager → (optional) HR. Every write is role-checked,
 * recorded in a history log, pushed live to the people involved, and raises notifications.
 * Validation rules are imported from src/data/goals.js so browser and server agree exactly.
 */
import { Router } from 'express';
import { GOAL_CATEGORIES, GOAL_PRIORITIES, GOAL_RULES, TRACKING_STATUSES } from '../../src/data/constants.js';
import {
  EMPLOYEE_DELETABLE, EMPLOYEE_EDITABLE, countsTowardWeight, goalProblems, goalsFor, isActive, planChecks, planId, selfAssessmentBlocker, weightedScore,
} from '../../src/data/goals.js';
import { requireAuth } from '../auth.js';
import { getDb, nextId, persist, remove, save } from '../db.js';
import { HttpError, requireText, route, text, todayIso } from '../http.js';
import { notify, toUsers } from '../realtime.js';

export const goalsRouter = Router();
goalsRouter.use(requireAuth);

/* ------------------------------- Helpers -------------------------------- */
const userById = (id) => getDb().users.find((u) => u.id === id);
const hrIds = () => getDb().users.filter((u) => u.role === 'hr' && u.active !== false).map((u) => u.id);
const firstName = (id) => (userById(id)?.name || 'Employee').split(' ')[0];

/** Who may see employee `u`'s goals: the employee, their reporting manager, HR. */
function canSee(user, u) {
  if (user.role === 'hr') return true;
  if (user.role === 'manager') return userById(u)?.managerId === user.id;
  return user.id === u;
}
function assertAccess(user, u) {
  if (user.role === 'hr') throw new HttpError(403, 'HR can monitor goals but not edit them.');
  if (!canSee(user, u)) {
    throw new HttpError(403, user.role === 'manager' ? 'You can only review employees who report to you.' : 'You can only work on your own goals.');
  }
}
function assertRole(user, role) {
  if (user.role !== role) throw new HttpError(403, `Only the ${role === 'hr' ? 'HR/Admin' : role} can do this.`);
}

const entry = (user, action, note = '') => ({ id: nextId('history_entries'), d: todayIso(), by: user.role, actor: user.name, action, note: text(note) });
const withHistory = (record, user, action, note) => ({ ...record, history: [...(record.history || []), entry(user, action, note)] });

function getPlan(u, period) {
  return getDb().goalPlans.find((p) => p.u === u && p.period === period) || { id: planId(u, period), u, period, stage: 'Goal setting', history: [] };
}
function findGoal(id) {
  const goal = getDb().goals.find((x) => x.id === Number(id));
  if (!goal) throw new HttpError(404, 'Goal not found.');
  return goal;
}
const audience = (u) => [u, userById(u)?.managerId, ...hrIds()];

/** Push goal/plan changes to the employee, their manager and HR. */
function publish(u, { goals = [], plan = null, deleted = null }) {
  const to = audience(u);
  goals.forEach((g) => toUsers(to, 'goal:updated', g));
  if (plan) toUsers(to, 'goalPlan:updated', plan);
  if (deleted) toUsers(to, 'goal:deleted', { id: deleted });
}

const GOAL_FIELDS = ['title', 'category', 'desc', 'metric', 'target', 'priority', 'weight', 'start', 'due', 'notes'];
function cleanFields(input) {
  const out = {};
  GOAL_FIELDS.forEach((key) => {
    if (input[key] === undefined) return;
    out[key] = key === 'weight' ? Math.round(Number(input[key])) : text(input[key], key === 'desc' || key === 'notes' ? 600 : 160);
  });
  return out;
}

function validateGoal(goal, { isNew = false } = {}) {
  const problems = goalProblems(goal);
  const [field] = Object.keys(problems);
  if (field) throw new HttpError(400, `${field === 'metric' ? 'KPI' : field[0].toUpperCase() + field.slice(1)}: ${problems[field]}`);
  if (!GOAL_CATEGORIES.includes(goal.category)) throw new HttpError(400, 'Choose a valid goal category.');
  if (!GOAL_PRIORITIES.includes(goal.priority)) throw new HttpError(400, 'Choose a priority.');
  const others = getDb().goals.filter((x) => x.u === goal.u && x.period === goal.period && x.id !== goal.id && countsTowardWeight(x));
  if (isNew && others.length >= GOAL_RULES.maxGoals) throw new HttpError(400, `A plan can have at most ${GOAL_RULES.maxGoals} goals.`);
  const used = others.reduce((sum, x) => sum + x.weight, 0);
  if (used + goal.weight > GOAL_RULES.totalWeight) throw new HttpError(400, `Total weightage would be ${used + goal.weight}%. Only ${GOAL_RULES.totalWeight - used}% is left.`);
}

function assertGoalSetting(goal) {
  if (getPlan(goal.u, goal.period).stage !== 'Goal setting') throw new HttpError(409, 'Goals are locked once the self-assessment has been submitted.');
}

function assertPlanReady(u, period, replace) {
  const existing = goalsFor(getDb().goals, u, period);
  const list = replace && !existing.some((x) => x.id === replace.id) ? [...existing, replace] : existing.map((x) => (replace && x.id === replace.id ? replace : x));
  const failed = planChecks(list, period).filter((c) => !c.ok);
  if (failed.length) throw new HttpError(400, `Cannot submit yet: ${failed.map((c) => `${c.label} — ${c.detail}`).join('; ')}. Save as draft for now.`);
}

/* -------------------------------- Reads --------------------------------- */
goalsRouter.get('/goals', route((req, res) => res.json(getDb().goals.filter((g) => canSee(req.user, g.u)))));
goalsRouter.get('/goal-plans', route((req, res) => res.json(getDb().goalPlans.filter((p) => canSee(req.user, p.u)))));

/* ---------------------------- Create / edit ----------------------------- */
goalsRouter.post('/goals', route((req, res) => {
  assertRole(req.user, 'employee');
  const input = req.body || {};
  const u = req.user.id;
  if (getPlan(u, input.period).stage !== 'Goal setting') throw new HttpError(409, 'Goal setting is closed for this period.');
  let goal = {
    id: nextId('goals'), u, period: input.period, title: '', category: GOAL_CATEGORIES[0], desc: '', metric: '', target: '', priority: 'Medium',
    weight: 0, start: '', due: '', notes: '', ...cleanFields(input),
    status: 'Draft', progress: 0, updates: [], reviewNote: '', change: null,
    selfRating: null, selfComment: '', managerRating: null, managerComment: '', improvement: '', history: [], d: todayIso(),
  };
  validateGoal(goal, { isNew: true });
  goal = withHistory(goal, req.user, 'Created as draft');
  if (input.submit) {
    assertPlanReady(u, goal.period, goal);
    goal = withHistory({ ...goal, status: 'Pending Approval' }, req.user, 'Submitted for approval');
  }
  save('goals', goal);
  persist();
  publish(u, { goals: [goal] });
  if (input.submit) notify([req.user.managerId], { title: 'Goal submitted for approval', detail: `${req.user.name} · ${goal.title}`, tone: 'warning', link: `/goals/${u}?period=${encodeURIComponent(goal.period)}` });
  res.status(201).json({ goal });
}));

goalsRouter.patch('/goals/:id', route((req, res) => {
  assertRole(req.user, 'employee');
  const current = findGoal(req.params.id);
  assertAccess(req.user, current.u);
  if (!EMPLOYEE_EDITABLE.includes(current.status)) {
    throw new HttpError(409, isActive(current) ? 'Approved goals cannot be edited directly — raise a change request.' : 'This goal is waiting for your manager.');
  }
  let goal = { ...current, ...cleanFields(req.body || {}) };
  validateGoal(goal);
  goal = withHistory(goal, req.user, 'Edited');
  if (req.body?.submit) {
    assertPlanReady(goal.u, goal.period, goal);
    goal = withHistory({ ...goal, status: 'Pending Approval' }, req.user, current.status === 'Changes Requested' ? 'Resubmitted for approval' : 'Submitted for approval');
    notify([req.user.managerId], { title: 'Goal submitted for approval', detail: `${req.user.name} · ${goal.title}`, tone: 'warning', link: `/goals/${goal.u}?period=${encodeURIComponent(goal.period)}` });
  }
  save('goals', goal);
  persist();
  publish(goal.u, { goals: [goal] });
  res.json({ goal });
}));

goalsRouter.delete('/goals/:id', route((req, res) => {
  assertRole(req.user, 'employee');
  const current = findGoal(req.params.id);
  assertAccess(req.user, current.u);
  if (!EMPLOYEE_DELETABLE.includes(current.status)) throw new HttpError(409, 'Only draft, returned or rejected goals can be deleted.');
  remove('goals', current.id);
  const plan = withHistory(getPlan(current.u, current.period), req.user, 'Deleted goal', current.title);
  save('goalPlans', plan);
  persist();
  publish(current.u, { plan, deleted: current.id });
  res.json({ id: current.id, plan });
}));

/* ----------------------------- Goal actions ----------------------------- */
const GOAL_ACTIONS = {
  submit: 'employee', withdraw: 'employee', progress: 'employee', requestChange: 'employee', cancelChange: 'employee',
  approve: 'manager', requestChanges: 'manager', reject: 'manager', approveChange: 'manager', declineChange: 'manager', feedback: 'manager',
};

goalsRouter.post('/goals/:id/:action', route((req, res) => {
  const { action } = req.params;
  const role = GOAL_ACTIONS[action];
  if (!role) throw new HttpError(404, 'Unknown action.');
  assertRole(req.user, role);
  const current = findGoal(req.params.id);
  assertAccess(req.user, current.u);
  assertGoalSetting(current);
  const payload = req.body || {};
  const user = req.user;
  const need = (statuses) => { if (!statuses.includes(current.status)) throw new HttpError(409, `Not available while the goal is "${current.status}".`); };
  const link = `/goals/${current.u}?period=${encodeURIComponent(current.period)}`;
  const toManager = (title, tone = 'info') => notify([userById(current.u)?.managerId], { title, detail: `${userById(current.u)?.name} · ${current.title}`, tone, link });
  const toEmployee = (title, tone = 'info', note = '') => notify([current.u], { title, detail: `${current.title}${note ? ` — ${note}` : ''}`, tone, link: '/goals' });
  let goal = current;

  switch (action) {
    case 'submit':
      need(EMPLOYEE_EDITABLE);
      assertPlanReady(current.u, current.period);
      goal = withHistory({ ...current, status: 'Pending Approval' }, user, 'Submitted for approval');
      toManager('Goal submitted for approval', 'warning');
      break;
    case 'withdraw':
      need(['Pending Approval']);
      goal = withHistory({ ...current, status: 'Draft' }, user, 'Withdrawn to draft');
      break;
    case 'approve': {
      need(['Pending Approval']);
      const note = text(payload.note);
      goal = withHistory({ ...current, status: 'Approved', reviewNote: note }, user, 'Approved', note);
      toEmployee('Goal approved', 'success', note);
      break;
    }
    case 'requestChanges': {
      need(['Pending Approval']);
      const note = requireText(payload.note, 5, 'Explain what should change');
      goal = withHistory({ ...current, status: 'Changes Requested', reviewNote: note }, user, 'Changes requested', note);
      toEmployee('Changes requested on your goal', 'warning', note);
      break;
    }
    case 'reject': {
      need(['Pending Approval']);
      const note = requireText(payload.note, 5, 'Give a reason for rejecting');
      goal = withHistory({ ...current, status: 'Rejected', reviewNote: note }, user, 'Rejected', note);
      toEmployee('Goal rejected', 'error', note);
      break;
    }
    case 'progress': {
      if (!isActive(current)) throw new HttpError(409, 'Progress can only be tracked on approved goals.');
      const status = payload.status;
      if (!TRACKING_STATUSES.includes(status)) throw new HttpError(400, 'Choose Not Started, In Progress, On Hold or Completed.');
      let progress = Math.round(Number(payload.progress));
      if (!(progress >= 0 && progress <= 100)) throw new HttpError(400, 'Completion must be between 0% and 100%.');
      if (status === 'Completed') progress = 100;
      if (status === 'Not Started' && progress > 0) throw new HttpError(400, 'A goal with progress cannot be "Not Started".');
      const note = requireText(payload.note, 3, 'Describe the progress');
      const update = { id: nextId('goal_updates'), d: todayIso(), by: 'employee', progress, status, note, evidence: text(payload.evidence, 300) };
      goal = withHistory({ ...current, status, progress, updates: [...current.updates, update] }, user, `Progress ${progress}% · ${status}`, note);
      toManager(`Progress update · ${progress}% ${status}`);
      break;
    }
    case 'feedback': {
      if (!isActive(current)) throw new HttpError(409, 'Feedback can be added to approved goals.');
      const note = requireText(payload.note, 3, 'Write your feedback');
      const update = { id: nextId('goal_updates'), d: todayIso(), by: 'manager', progress: current.progress, status: current.status, note, evidence: '' };
      goal = withHistory({ ...current, updates: [...current.updates, update] }, user, 'Manager feedback', note);
      toEmployee('New feedback on your goal', 'info', note);
      break;
    }
    case 'requestChange': {
      if (!isActive(current)) throw new HttpError(409, 'Change requests are for approved goals — edit drafts directly.');
      if (current.change) throw new HttpError(409, 'A change request is already waiting for approval.');
      const fields = cleanFields(payload.fields || {});
      const changed = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== current[k]));
      if (!Object.keys(changed).length) throw new HttpError(400, 'Change at least one field.');
      const reason = requireText(payload.reason, 5, 'Explain why the change is needed');
      validateGoal({ ...current, ...changed });
      goal = withHistory({ ...current, change: { fields: changed, reason, d: todayIso() } }, user, 'Change requested', `${Object.keys(changed).join(', ')} — ${reason}`);
      toManager('Goal change requested', 'warning');
      break;
    }
    case 'cancelChange':
      if (!current.change) throw new HttpError(409, 'No change request to cancel.');
      goal = withHistory({ ...current, change: null }, user, 'Change request withdrawn');
      break;
    case 'approveChange': {
      if (!current.change) throw new HttpError(409, 'No change request to approve.');
      const applied = { ...current, ...current.change.fields, change: null };
      validateGoal(applied);
      goal = withHistory(applied, user, 'Change approved', text(payload.note));
      toEmployee('Goal change approved', 'success');
      break;
    }
    case 'declineChange': {
      if (!current.change) throw new HttpError(409, 'No change request to decline.');
      const note = requireText(payload.note, 5, 'Explain why the change is declined');
      goal = withHistory({ ...current, change: null }, user, 'Change declined', note);
      toEmployee('Goal change declined', 'warning', note);
      break;
    }
    default: break;
  }
  save('goals', goal);
  persist();
  publish(goal.u, { goals: [goal] });
  res.json({ goal });
}));

/* ----------------------------- Plan actions ----------------------------- */
const PLAN_ACTIONS = {
  submitAll: { role: 'employee', from: ['Goal setting'] },
  approveAll: { role: 'manager', from: ['Goal setting'] },
  selfAssess: { role: 'employee', from: ['Goal setting'], to: 'Self-assessed' },
  evaluate: { role: 'manager', from: ['Self-assessed'], to: 'Evaluated' },
  hrFinalize: { role: 'hr', from: ['Evaluated'], to: 'Finalized' },
  hrReturn: { role: 'hr', from: ['Evaluated'], to: 'Self-assessed' },
  acknowledge: { role: 'employee', from: ['Evaluated', 'Finalized'], to: 'Acknowledged' },
};

function readRatings(list, ratings, label, withImprovement) {
  return list.map((goal) => {
    const raw = ratings?.[goal.id] || {};
    const rating = Number(raw.rating);
    if (!(Number.isInteger(rating) && rating >= 1 && rating <= 5)) throw new HttpError(400, `Give every goal a ${label} from 1 to 5.`);
    return { id: goal.id, rating, comment: text(raw.comment), improvement: withImprovement ? text(raw.improvement) : undefined };
  });
}

goalsRouter.post('/goal-plans/:u/:period/:action', route((req, res) => {
  const u = Number(req.params.u);
  const { period, action } = req.params;
  const rule = PLAN_ACTIONS[action];
  if (!rule) throw new HttpError(404, 'Unknown action.');
  const user = req.user;
  assertRole(user, rule.role);
  if (user.role !== 'hr') assertAccess(user, u);
  const db = getDb();
  const hrReview = Boolean(db.settings?.hrReview);
  if (rule.role === 'hr' && !hrReview) throw new HttpError(409, 'HR final review is turned off in Settings.');
  let plan = getPlan(u, period);
  if (!rule.from.includes(plan.stage)) throw new HttpError(409, `Not available — this review is at "${plan.stage}".`);
  if (action === 'acknowledge' && hrReview && plan.stage !== 'Finalized') throw new HttpError(409, 'Waiting for HR final review.');
  const list = goalsFor(db.goals, u, period);
  const active = list.filter(isActive);
  const today = todayIso();
  const payload = req.body || {};
  const employee = userById(u);
  const managerId = employee?.managerId;
  const link = `/goals/${u}?period=${encodeURIComponent(period)}`;
  const changedGoals = [];

  if (action === 'submitAll') {
    const drafts = list.filter((g) => EMPLOYEE_EDITABLE.includes(g.status));
    if (!drafts.length) throw new HttpError(400, 'There are no draft goals to submit.');
    assertPlanReady(u, period);
    drafts.forEach((g) => changedGoals.push(save('goals', withHistory({ ...g, status: 'Pending Approval' }, user, 'Submitted for approval'))));
    plan = withHistory(plan, user, `Submitted ${drafts.length} goal(s) for approval`);
    notify([managerId], { title: `${employee.name} submitted ${drafts.length} goal(s)`, detail: `${period} goal plan is ready for approval`, tone: 'warning', link });
  }
  if (action === 'approveAll') {
    const pending = list.filter((g) => g.status === 'Pending Approval');
    if (!pending.length) throw new HttpError(400, 'No goals are waiting for approval.');
    pending.forEach((g) => changedGoals.push(save('goals', withHistory({ ...g, status: 'Approved' }, user, 'Approved'))));
    plan = withHistory(plan, user, `Approved ${pending.length} goal(s)`);
    notify([u], { title: `${pending.length} goal(s) approved`, detail: `${period} — you can start tracking progress`, tone: 'success', link: '/goals' });
  }
  if (action === 'selfAssess' || action === 'evaluate') {
    const isSelf = action === 'selfAssess';
    if (isSelf) {
      const blocker = selfAssessmentBlocker(list);
      if (blocker) throw new HttpError(409, blocker);
    }
    const rated = readRatings(active, payload.ratings, isSelf ? 'self-rating' : 'rating', !isSelf);
    const summary = requireText(payload.summary, 10, isSelf ? 'Add an overall self-assessment' : 'Add overall manager feedback', 1000);
    rated.forEach((r) => {
      const goal = findGoal(r.id);
      changedGoals.push(save('goals', isSelf
        ? { ...goal, selfRating: r.rating, selfComment: r.comment }
        : { ...goal, managerRating: r.rating, managerComment: r.comment, improvement: r.improvement }));
    });
    const updated = goalsFor(db.goals, u, period);
    if (isSelf) {
      plan = withHistory({ ...plan, stage: rule.to, selfAt: today, selfSummary: summary }, user, 'Self-assessment submitted', `Self score ${weightedScore(updated, 'selfRating')}`);
      notify([managerId], { title: `${employee.name} submitted a self assessment`, detail: `${period} · ready for your evaluation`, tone: 'warning', link });
    } else {
      const score = weightedScore(updated, 'managerRating');
      plan = withHistory({
        ...plan, stage: rule.to, evaluatedAt: today, managerSummary: summary, managerImprovement: text(payload.improvement),
        managerScore: score, finalScore: hrReview ? null : score,
      }, user, 'Manager evaluation completed', `Score ${score?.toFixed(2)}${hrReview ? ' · sent to HR' : ' · final'}`);
      if (hrReview) notify(hrIds(), { title: 'Evaluation ready for HR final review', detail: `${employee.name} · ${period}`, tone: 'warning', link: '/hr-review' });
      else notify([u], { title: 'Your appraisal is ready', detail: `${period} · review and acknowledge`, tone: 'success', link: '/goals' });
    }
  }
  if (action === 'hrFinalize') {
    const score = payload.score === undefined || payload.score === '' ? plan.managerScore : Math.round(Number(payload.score) * 100) / 100;
    if (!(score >= 1 && score <= 5)) throw new HttpError(400, 'Final score must be between 1 and 5.');
    const calibrated = score !== plan.managerScore;
    const note = calibrated ? requireText(payload.note, 10, 'Explain the calibration') : text(payload.note);
    plan = withHistory({ ...plan, stage: rule.to, finalScore: score, hrNote: note, finalizedAt: today }, user,
      calibrated ? `Finalized with calibration ${plan.managerScore?.toFixed(2)} → ${score.toFixed(2)}` : 'Finalized', note);
    notify([u], { title: 'Your appraisal is finalized', detail: `${period} · review and acknowledge`, tone: 'success', link: '/goals' });
    notify([managerId], { title: 'HR finalized an appraisal', detail: `${employee.name} · ${period}`, tone: 'info', link });
  }
  if (action === 'hrReturn') {
    const note = requireText(payload.note, 5, 'Explain what the manager should revisit');
    plan = withHistory({ ...plan, stage: rule.to, hrNote: note, managerScore: null, finalScore: null }, user, 'Returned to manager by HR', note);
    notify([managerId], { title: 'HR returned an evaluation', detail: `${employee.name} · ${note}`, tone: 'warning', link });
  }
  if (action === 'acknowledge') {
    plan = withHistory({ ...plan, stage: rule.to, ackAt: today, ackComment: text(payload.comment), finalScore: plan.finalScore ?? plan.managerScore }, user, 'Acknowledged final rating', payload.comment);
    notify([managerId], { title: `${firstName(u)} acknowledged the appraisal`, detail: `${period}${payload.comment ? ` — ${text(payload.comment, 120)}` : ''}`, tone: 'success', link });
  }

  save('goalPlans', plan);
  persist();
  publish(u, { goals: changedGoals, plan });
  res.json({ plan, goals: goalsFor(db.goals, u, period) });
}));
