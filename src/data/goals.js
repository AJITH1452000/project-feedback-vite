/** Goal workflow rules and helpers, shared by the demo API and the UI (the backend must match). */
import { GOAL_PERIOD_RANGES, GOAL_RULES, TRACKING_STATUSES } from './constants.js';
import { formatDate } from './selectors.js';

export const planId = (u, period) => `${u}|${period}`;

/* ------------------------------- Statuses -------------------------------- */
export const ACTIVE_STATUSES = ['Approved', ...TRACKING_STATUSES];
export const EMPLOYEE_EDITABLE = ['Draft', 'Changes Requested'];
export const EMPLOYEE_DELETABLE = ['Draft', 'Changes Requested', 'Rejected'];
export const isActive = (g) => ACTIVE_STATUSES.includes(g.status);
/** Rejected goals drop out of the plan's weightage. */
export const countsTowardWeight = (g) => g.status !== 'Rejected';

export const STATUS_TONE = {
  Draft: 'neutral', 'Pending Approval': 'warning', Approved: 'primary', 'Changes Requested': 'secondary', Rejected: 'error',
  'Not Started': 'neutral', 'In Progress': 'info', 'On Hold': 'warning', Completed: 'success',
};
export const PRIORITY_TONE = { High: 'error', Medium: 'warning', Low: 'neutral' };

/* ------------------------------- Plans ---------------------------------- */
export function getPlan(plans, u, period) {
  return plans.find((p) => p.u === u && p.period === period) || { id: planId(u, period), u, period, stage: 'Goal setting', history: [] };
}

export const goalsFor = (goals, u, period) => goals
  .filter((x) => x.u === u && x.period === period)
  .sort((a, b) => Number(b.status !== 'Rejected') - Number(a.status !== 'Rejected') || b.weight - a.weight || a.id - b.id);

export const totalWeight = (list) => list.filter(countsTowardWeight).reduce((sum, x) => sum + Number(x.weight || 0), 0);

export function weightedProgress(list) {
  const active = list.filter(countsTowardWeight);
  const w = active.reduce((sum, x) => sum + x.weight, 0);
  return w ? Math.round(active.reduce((sum, x) => sum + x.progress * x.weight, 0) / w) : 0;
}

/** Weighted rating (1–5, 2 decimals) over active goals. Null until every active goal has a rating under `key`. */
export function weightedScore(list, key) {
  const active = list.filter(isActive);
  const w = active.reduce((sum, x) => sum + x.weight, 0);
  if (!active.length || !w || active.some((x) => !x[key])) return null;
  return Math.round((active.reduce((sum, x) => sum + x[key] * x.weight, 0) / w) * 100) / 100;
}

/** The score that counts: HR-finalized, or the manager's score when HR review is off. */
export function effectiveScore(plan, hrReview) {
  if (typeof plan.finalScore === 'number') return plan.finalScore;
  if (!hrReview && typeof plan.managerScore === 'number' && ['Evaluated', 'Acknowledged'].includes(plan.stage)) return plan.managerScore;
  return null;
}

export function periodRangeText(period) {
  const r = GOAL_PERIOD_RANGES[period];
  return r ? `${formatDate(r.start)} – ${formatDate(r.end)}` : '';
}

/** Workflow steps — the HR step only exists when the company enables HR final review. */
export function planSteps(hrReview) {
  return ['Goal setting', 'Manager approval', 'Progress & self assessment', 'Manager evaluation', ...(hrReview ? ['HR final review'] : []), 'Acknowledge'];
}

/**
 * Where a plan is right now: { phase, step, tone, waitingOn }.
 * Goal-setting and approval are derived from goal statuses; later phases come from plan.stage.
 */
export function planPhase(plan, list, hrReview) {
  const steps = planSteps(hrReview);
  const at = (phase, tone, waitingOn) => ({ phase, step: steps.indexOf(phase), tone, waitingOn });
  switch (plan.stage) {
    case 'Self-assessed': return at('Manager evaluation', 'warning', 'manager');
    case 'Evaluated': return hrReview ? at('HR final review', 'warning', 'hr') : at('Acknowledge', 'primary', 'employee');
    case 'Finalized': return at('Acknowledge', 'primary', 'employee');
    case 'Acknowledged': return { phase: 'Closed', step: steps.length, tone: 'success', waitingOn: null };
    default: break;
  }
  const counted = list.filter(countsTowardWeight);
  const drafting = !counted.length || totalWeight(list) !== GOAL_RULES.totalWeight || counted.some((g) => EMPLOYEE_EDITABLE.includes(g.status));
  if (drafting) return at('Goal setting', 'neutral', 'employee');
  if (counted.some((g) => g.status === 'Pending Approval' || g.change)) return at('Manager approval', 'warning', 'manager');
  return at('Progress & self assessment', 'info', 'employee');
}

/* --------------------------- Validation rules --------------------------- */

/** Field-level problems for one goal (used by forms and the API). */
export function goalProblems(goal) {
  const { minWeight, maxWeight } = GOAL_RULES;
  const range = GOAL_PERIOD_RANGES[goal.period];
  const problems = {};
  if (String(goal.title || '').trim().length < 5) problems.title = 'At least 5 characters.';
  if (String(goal.metric || '').trim().length < 3) problems.metric = 'Describe how success is measured.';
  if (String(goal.target || '').trim().length < 1) problems.target = 'Enter the target value.';
  const w = Number(goal.weight);
  if (!(Number.isFinite(w) && w >= minWeight && w <= maxWeight)) problems.weight = `Use ${minWeight}–${maxWeight}%.`;
  if (!range) problems.period = 'Choose a valid review period.';
  if (!goal.start) problems.start = 'Choose a start date.';
  if (!goal.due) problems.due = 'Choose a target date.';
  if (range && goal.start && (goal.start < range.start || goal.start > range.end)) problems.start = `Within ${periodRangeText(goal.period)}.`;
  if (range && goal.due && (goal.due < range.start || goal.due > range.end)) problems.due = `Within ${periodRangeText(goal.period)}.`;
  if (goal.start && goal.due && goal.due < goal.start) problems.due = 'Must be on or after the start date.';
  return problems;
}

/** Plan checklist — all must pass before goals can be submitted for approval. */
export function planChecks(list, period) {
  const { maxGoals, minWeight, maxWeight, totalWeight: target } = GOAL_RULES;
  const counted = list.filter(countsTowardWeight);
  const total = totalWeight(list);
  const invalid = counted.filter((g) => Object.keys(goalProblems({ ...g, period })).length).length;
  const has = counted.length > 0;
  return [
    { id: 'total', ok: total === target, label: `Total weightage must equal ${target}%`, detail: total === target ? `${total}% allocated` : `${total}% allocated · ${total < target ? `${target - total}% left` : `${total - target}% over`}` },
    { id: 'count', ok: has && counted.length <= maxGoals, label: `Up to ${maxGoals} goals`, detail: `${counted.length} goal${counted.length === 1 ? '' : 's'} (rejected goals excluded)` },
    { id: 'valid', ok: has && !invalid, label: `KPI, target, ${minWeight}–${maxWeight}% weight and dates set`, detail: invalid ? `${invalid} goal(s) need fixing` : 'Every goal complete' },
    { id: 'dates', ok: has, label: 'Dates inside the review period', detail: periodRangeText(period) },
  ];
}

export const planReady = (list, period) => planChecks(list, period).every((c) => c.ok);

/** Self-assessment opens once every remaining goal is approved and weightage is 100%. */
export function selfAssessmentBlocker(list) {
  const counted = list.filter(countsTowardWeight);
  if (!counted.length) return 'Add goals first.';
  if (counted.some((g) => !isActive(g))) return 'All goals must be approved first.';
  if (counted.some((g) => g.change)) return 'A change request is still waiting for your manager.';
  if (totalWeight(list) !== GOAL_RULES.totalWeight) return 'Approved goals must total 100%.';
  return '';
}

/** All history entries for a plan and its goals, newest first. */
export function planHistory(plan, list) {
  return [
    ...(plan.history || []).map((e) => ({ ...e, goal: null })),
    ...list.flatMap((g) => (g.history || []).map((e) => ({ ...e, goal: g.title }))),
  ].sort((a, b) => b.d.localeCompare(a.d) || b.id - a.id);
}
