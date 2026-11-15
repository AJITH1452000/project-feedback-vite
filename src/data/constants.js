/**
 * Application configuration shared by the frontend and the API server (server/ imports this file).
 * No sample data lives here — all people, projects, reviews and goals come from the backend.
 *
 * Shapes returned by the API:
 *   Project { id, n: name, c: client, pr: priority, s: start, e: end, t: [userIds] }
 *   User    { id, n: name, r: track (Lead|Member), t: title, role, email, dept, managerId, active }
 *   Review  { id, p: projectId, u: userId, by: reviewer, s: [4 dimension scores], f: [flags], note, d: date }
 */

/* ------------------------------ Accounts ------------------------------- */
export const ROLES = [
  { value: 'employee', label: 'Employee', hint: 'Sets own goals, sees own feedback' },
  { value: 'manager', label: 'Manager', hint: 'Manages a team, reviews and approves' },
  { value: 'hr', label: 'HR / Admin', hint: 'Monitors everyone, optional final review' },
];
export const TRACKS = ['Member', 'Lead'];
export const DEPARTMENT_OPTIONS = ['Engineering', 'Quality Assurance', 'Business Analysis', 'Delivery', 'Data', 'Design', 'Operations', 'HR'];
export const PASSWORD_MIN = 8;

/* ------------------------------ Reviews -------------------------------- */
export const CRIT = {
  Member: ['Problem solving', 'Collaboration', 'Quality of work', 'Meeting deadlines'],
  Lead: ['Delivery ownership', 'Stakeholder communication', 'Team development', 'Risk management'],
};

export const CORE_DIMENSIONS = [
  { id: 'delivery', name: 'Delivery & ownership', desc: 'Quality, timeliness, accountability and follow through' },
  { id: 'problem_solving', name: 'Problem solving & expertise', desc: 'Judgment, learning agility and practical solutions' },
  { id: 'collaboration', name: 'Collaboration & communication', desc: 'Teamwork, stakeholder updates and constructive conduct' },
  { id: 'impact', name: 'Impact & client value', desc: 'Business impact, risk management and client outcomes' },
];

export const FLAGS = ['Deviation from plan', 'Errors in work', 'Miscommunication', 'Missed checklist or process'];
export const REVIEWERS = ['Project manager', 'Program manager', 'Level 2 manager'];
export const REVIEW_PERIODS = ['Q4 2026 — Quarterly review', 'Q3 2026 — Quarterly review', 'Project closure review', 'Annual review checkpoint'];
export const PROJECT_DURATIONS = ['3 months or longer', '1 - 3 months', 'Less than 1 month'];

/* "Submit project feedback" (quick review) options — must match the backend enums. */
export const REVIEW_TYPES = ['Project closure', 'Quarterly review', 'Mid-project checkpoint', 'Annual checkpoint'];
export const QUALITY_LEVELS = ['Exceeds expectations', 'Meets expectations', 'Needs improvement'];
export const FEEDBACK_VISIBILITY = ['Manager and employee', 'Manager, employee, and HR', 'Private draft (manager only)'];

export const RATING_PRINCIPLES = [
  { level: 5, label: 'Exceptional', desc: 'Consistently exceeds agreed outcomes; clear evidence of impact beyond role expectations.' },
  { level: 4, label: 'Exceeds expectations', desc: 'Often delivers above expectations and proactively improves outcomes.' },
  { level: 3, label: 'Meets expectations', desc: 'Reliably delivers the agreed scope and expected quality.' },
  { level: 2, label: 'Partially meets expectations', desc: 'Some important outcomes are inconsistent; clear examples and support actions are required.' },
  { level: 1, label: 'Does not meet expectations', desc: 'Material gaps against agreed expectations, supported by specific and contextualized examples.' },
];

export const DEFAULT_REVIEW_SETTINGS = {
  cycle: 'quarterly',
  visibility: 'Manager and employee',
  safeguardRequired: true,
  reminders: true,
  // Optional HR/Admin final review of manager evaluations. Off = the manager evaluation is final.
  hrReview: false,
};

/* --------------------------- Goal setting ------------------------------ */
/**
 * Workflow:  Employee sets goals → Manager approves (per goal) → Employee tracks progress
 *            → Employee self-assessment → Manager evaluation → [HR final review — optional] → Employee acknowledges.
 */
export const GOAL_PERIODS = ['Q4 2026', 'Q1 2027', 'H1 2027', 'Q3 2026'];
export const GOAL_PERIOD_RANGES = {
  'Q3 2026': { start: '2026-07-01', end: '2026-09-30' },
  'Q4 2026': { start: '2026-10-01', end: '2026-12-31' },
  'Q1 2027': { start: '2027-01-01', end: '2027-03-31' },
  'H1 2027': { start: '2027-01-01', end: '2027-06-30' },
};
export const GOAL_CATEGORIES = ['Delivery', 'Quality', 'Collaboration', 'Learning & growth', 'Leadership', 'Client impact'];
export const GOAL_PRIORITIES = ['High', 'Medium', 'Low'];
/** Approval statuses, then tracking statuses (after approval). */
export const GOAL_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Changes Requested', 'Rejected', 'Not Started', 'In Progress', 'On Hold', 'Completed'];
export const TRACKING_STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Completed'];
/** Plan rules — the backend enforces the same values (it imports this file). */
export const GOAL_RULES = { minGoals: 1, maxGoals: 7, minWeight: 5, maxWeight: 60, totalWeight: 100 };
