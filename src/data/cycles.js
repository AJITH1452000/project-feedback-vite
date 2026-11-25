/**
 * Appraisal cycles — created and published by HR/Admin. Shared by the browser and the server.
 *
 * Cycle { id, period, start, end, goalDeadline, selfStart, selfDeadline, depts: [] (empty = everyone),
 *         status: Draft | Open | Closed, framework: { categories, maxGoals, minWeight, maxWeight, scale[5], instructions } }
 *
 * The workflow rules (goals.js) look the cycle up by period through a small registry, so the
 * server registers db.cycles and the browser registers the cycles it receives.
 */
import { GOAL_CATEGORIES, GOAL_PERIOD_RANGES, GOAL_PERIODS, GOAL_RULES, RATING_PRINCIPLES } from './constants.js';
import { formatDate } from './selectors.js';

export const CYCLE_STATUSES = ['Draft', 'Open', 'Closed'];
export const CYCLE_TONE = { Draft: 'neutral', Open: 'success', Closed: 'secondary' };

export const DEFAULT_FRAMEWORK = {
  categories: GOAL_CATEGORIES,
  maxGoals: GOAL_RULES.maxGoals,
  minWeight: GOAL_RULES.minWeight,
  maxWeight: GOAL_RULES.maxWeight,
  scale: [...RATING_PRINCIPLES].sort((a, b) => a.level - b.level).map((r) => r.label), // index 0 = rating 1
  instructions: 'Set 3–7 measurable goals that together carry 100% weightage. Each goal needs a KPI, a target and dates inside the review period. Discuss them with your manager before submitting.',
};

/** The six stages of the appraisal process, with who owns each. */
export const APPRAISAL_FLOW = [
  { key: 'initiate', owner: 'HR / Admin', title: 'Initiate appraisal cycle', desc: 'Define appraisal period, timelines, eligible employees and workflow', tone: 'info' },
  { key: 'framework', owner: 'HR / Admin', title: 'Configure goal-setting framework', desc: 'Define goal categories, weightages, rating scale and instructions', tone: 'info' },
  { key: 'goals', owner: 'Employee', title: 'Fill goal-setting form', desc: 'Enter goals, KPIs, targets, weightages and expected outcomes', tone: 'success' },
  { key: 'approve', owner: 'Reporting Manager', title: 'Review and approve goals', desc: 'Review goals, suggest changes and approve the final goals', tone: 'warning' },
  { key: 'evaluate', owner: 'Employee + Manager', title: 'Performance evaluation', desc: 'Employee submits achievements and self-rating; manager evaluates performance', tone: 'success' },
  { key: 'close', owner: 'Reporting Manager + HR', title: 'Feedback and appraisal closure', desc: 'HR validates, manager shares feedback, employee acknowledges and the appraisal is closed', tone: 'primary' },
];

/** Every status an appraisal can be in, in order, with the next owner (matches the process document). */
export const APPRAISAL_STATUSES = [
  { status: 'Draft', stage: 'Cycle creation', nextBy: 'HR', step: 0, tone: 'neutral' },
  { status: 'Open', stage: 'Cycle published · goal setting', nextBy: 'Employee', step: 2, tone: 'info' },
  { status: 'Submitted', stage: 'Goal submission', nextBy: 'Manager', step: 3, tone: 'warning' },
  { status: 'Under Review', stage: 'Goal review', nextBy: 'Manager', step: 3, tone: 'warning' },
  { status: 'Approved', stage: 'Goal approval · tracking progress', nextBy: 'Employee', step: 4, tone: 'primary' },
  { status: 'Self-Appraisal Pending', stage: 'Self-evaluation', nextBy: 'Employee', step: 4, tone: 'info' },
  { status: 'Manager Review Pending', stage: 'Self-evaluation submitted · manager evaluation', nextBy: 'Manager', step: 4, tone: 'warning' },
  { status: 'HR Review Pending', stage: 'Manager evaluated · HR validation', nextBy: 'HR', step: 5, tone: 'warning' },
  { status: 'Feedback Pending', stage: 'Feedback discussion', nextBy: 'Manager', step: 5, tone: 'warning' },
  { status: 'Acknowledgement Pending', stage: 'Employee acknowledgement', nextBy: 'Employee', step: 5, tone: 'primary' },
  { status: 'Completed', stage: 'Final closure', nextBy: '—', step: 6, tone: 'success' },
  { status: 'Closed', stage: 'Cycle closed before completion', nextBy: '—', step: 6, tone: 'secondary' },
];
export const statusInfo = (status) => APPRAISAL_STATUSES.find((s) => s.status === status) || APPRAISAL_STATUSES[1];

/* ------------------------------- Registry ------------------------------- */
let registry = [];
export function registerCycles(list) { registry = Array.isArray(list) ? list : []; }
export const registeredCycles = () => registry;

/** Default cycles for databases created before cycles existed (keeps their goals working). */
export function legacyCycles() {
  return GOAL_PERIODS.map((period, i) => {
    const r = GOAL_PERIOD_RANGES[period];
    const selfStart = shiftDays(r.end, -21);
    return {
      id: i + 1, period, start: r.start, end: r.end, goalDeadline: shiftDays(r.start, 14), selfStart, selfDeadline: r.end,
      depts: [], status: 'Open', framework: { ...DEFAULT_FRAMEWORK }, createdAt: r.start, publishedAt: r.start,
    };
  });
}

export function cycleFor(period) {
  return registry.find((c) => c.period === period) || null;
}
export const frameworkFor = (period) => ({ ...DEFAULT_FRAMEWORK, ...(cycleFor(period)?.framework || {}) });
export const rangeFor = (period) => {
  const c = cycleFor(period);
  return c ? { start: c.start, end: c.end } : GOAL_PERIOD_RANGES[period] || null;
};
export function rulesFor(period) {
  const f = frameworkFor(period);
  return { ...GOAL_RULES, maxGoals: f.maxGoals, minWeight: f.minWeight, maxWeight: f.maxWeight };
}
/** Rating label for 1–5 using the cycle's configured scale. */
export function scaleLabel(period, rating) {
  const scale = frameworkFor(period).scale;
  return rating ? scale[Math.max(1, Math.min(5, Math.round(rating))) - 1] : '';
}

/* ------------------------------ Visibility ------------------------------ */
export const isEligible = (cycle, user) => !cycle.depts?.length || cycle.depts.includes(user?.dept);

/** Cycles a person may see: HR sees all; managers see published ones; employees see published ones they are eligible for. */
export function visibleCycles(cycles, user) {
  const list = (cycles || []).filter((c) => {
    if (user?.role === 'hr') return true;
    if (c.status === 'Draft') return false;
    return user?.role === 'manager' || isEligible(c, user);
  });
  const rank = { Open: 0, Draft: 1, Closed: 2 };
  return list.sort((a, b) => rank[a.status] - rank[b.status] || b.start.localeCompare(a.start));
}

/** The cycle to show by default: the open one running today, else the soonest open one, else the first. */
export function defaultCycle(list, today = new Date().toISOString().slice(0, 10)) {
  const open = (list || []).filter((c) => c.status === 'Open');
  return open.find((c) => c.start <= today && today <= c.end)
    || [...open].sort((a, b) => a.start.localeCompare(b.start)).find((c) => c.start > today)
    || open[0] || (list || [])[0] || null;
}

/**
 * What a reminder says, per appraisal status, when the next action is the employee's.
 * Returns null when there is nothing for the employee to do.
 */
export function reminderFor(status, cycle) {
  if (!cycle || cycle.status !== 'Open') return null;
  const by = (iso) => (iso ? ` by ${formatDate(iso)}` : '');
  return {
    Open: { title: `Reminder: set your ${cycle.period} goals`, detail: `Fill the goal-setting form and submit it${by(cycle.goalDeadline)}.` },
    Approved: { title: `Reminder: update your ${cycle.period} goal progress`, detail: `Keep progress and evidence up to date; self-appraisal opens ${formatDate(cycle.selfStart)}.` },
    'Self-Appraisal Pending': { title: `Reminder: submit your ${cycle.period} self-appraisal`, detail: `Add your achievements and self-rating${by(cycle.selfDeadline)}.` },
    'Acknowledgement Pending': { title: `Reminder: acknowledge your ${cycle.period} appraisal`, detail: 'Review your final rating and feedback, then acknowledge.' },
  }[status] || null;
}

/* ------------------------------ Validation ------------------------------ */
function shiftDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

/** Field problems for a cycle form; same rules on the server. */
export function cycleProblems(c, existing = []) {
  const p = {};
  const period = String(c.period || '').trim();
  if (period.length < 2) p.period = 'Name the period, e.g. “Q1 2027” or “Annual 2027”.';
  else if (existing.some((x) => x.id !== c.id && x.period.toLowerCase() === period.toLowerCase())) p.period = 'A cycle with this name already exists.';
  ['start', 'end', 'goalDeadline', 'selfStart', 'selfDeadline'].forEach((k) => { if (!isDate(c[k])) p[k] = 'Choose a date.'; });
  if (!Object.keys(p).some((k) => k !== 'period')) {
    if (c.end <= c.start) p.end = 'Must be after the start date.';
    if (c.goalDeadline < c.start || c.goalDeadline > c.end) p.goalDeadline = 'Must fall inside the period.';
    if (c.selfStart < c.goalDeadline) p.selfStart = 'Must be after the goal-setting deadline.';
    if (c.selfDeadline < c.selfStart) p.selfDeadline = 'Must be on or after self-appraisal opens.';
  }
  const f = c.framework || {};
  const cats = (f.categories || []).map((x) => String(x).trim()).filter(Boolean);
  if (!cats.length) p.categories = 'Add at least one goal category.';
  if (!(f.minWeight >= 1 && f.minWeight <= 50)) p.minWeight = '1–50%.';
  if (!(f.maxWeight >= f.minWeight && f.maxWeight <= 100)) p.maxWeight = `Between min (${f.minWeight}%) and 100%.`;
  if (!(f.maxGoals >= 1 && f.maxGoals <= 15)) p.maxGoals = '1–15 goals.';
  if (f.maxGoals * f.maxWeight < 100) p.maxGoals = 'Max goals × max weight must reach 100%.';
  if (!Array.isArray(f.scale) || f.scale.length !== 5 || f.scale.some((s) => !String(s || '').trim())) p.scale = 'Name all five rating levels.';
  return p;
}

/** Normalises a cycle payload (trimmed text, numbers, unique categories). */
export function cleanCycle(input) {
  const f = input.framework || {};
  return {
    period: String(input.period || '').trim().slice(0, 40),
    start: input.start, end: input.end, goalDeadline: input.goalDeadline, selfStart: input.selfStart, selfDeadline: input.selfDeadline,
    depts: [...new Set((input.depts || []).map((d) => String(d).trim()).filter(Boolean))],
    framework: {
      categories: [...new Set((f.categories || []).map((x) => String(x).trim().slice(0, 40)).filter(Boolean))].slice(0, 12),
      maxGoals: Math.round(Number(f.maxGoals)), minWeight: Math.round(Number(f.minWeight)), maxWeight: Math.round(Number(f.maxWeight)),
      scale: (f.scale || []).slice(0, 5).map((s) => String(s || '').trim().slice(0, 40)),
      instructions: String(f.instructions || '').trim().slice(0, 1200),
    },
  };
}

/** A sensible starting point for a new cycle: the next quarter whose name is not taken yet. */
export function newCycleTemplate(existing = [], today = new Date().toISOString().slice(0, 10)) {
  const taken = new Set(existing.map((c) => c.period.toLowerCase()));
  let [y, m] = today.split('-').map(Number);
  let q = Math.floor((m - 1) / 3) + 1;
  let nq; let ny;
  for (let i = 0; i < 12; i += 1) {
    nq = q === 4 ? 1 : q + 1;
    ny = q === 4 ? y + 1 : y;
    if (!taken.has(`q${nq} ${ny}`)) break;
    q = nq; y = ny;
  }
  const start = `${ny}-${String((nq - 1) * 3 + 1).padStart(2, '0')}-01`;
  const end = shiftDays(`${nq === 4 ? ny + 1 : ny}-${String(nq === 4 ? 1 : nq * 3 + 1).padStart(2, '0')}-01`, -1);
  return {
    period: `Q${nq} ${ny}`, start, end, goalDeadline: shiftDays(start, 14), selfStart: shiftDays(end, -21), selfDeadline: end,
    depts: [], framework: { ...DEFAULT_FRAMEWORK, scale: [...DEFAULT_FRAMEWORK.scale], categories: [...DEFAULT_FRAMEWORK.categories] },
  };
}
