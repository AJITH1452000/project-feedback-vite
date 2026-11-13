/**
 * Demo seed data — identical shape and values to the shared backend contract
 * (Avigna Feedback System). Used only while VITE_API_URL is empty.
 *
 * Project  { id, n: name, c: client, pr: priority, s: start, e: end, t: [userIds] }
 * User     { id, n: name, r: track (Lead|Member), t: title }
 * Review   { id, p: projectId, u: userId, by: reviewer, s: [4 dimension scores], f: [flags], note, d: date }
 */

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

export const PROJECTS = [
  { id: 1, n: 'Beacon LMS rollout', c: 'Northfield University', pr: 'High', s: '2026-03-02', e: '2026-12-18', t: [1, 2, 5] },
  { id: 2, n: 'ERP Modernization', c: 'Halden Logistics', pr: 'High', s: '2026-01-12', e: '2026-11-30', t: [3, 4, 6] },
  { id: 3, n: 'Customer Portal', c: 'Orrin Bank', pr: 'Medium', s: '2026-05-04', e: '2027-02-26', t: [1, 7, 8] },
  { id: 4, n: 'Data Migration', c: 'Kestrel Health', pr: 'Medium', s: '2026-06-15', e: '2026-12-04', t: [2, 4, 8] },
  { id: 5, n: 'Mobile Banking App', c: 'Apex Financial', pr: 'High', s: '2026-04-10', e: '2026-12-30', t: [3, 6, 7] },
  { id: 6, n: 'HRMS Enhancement', c: 'Vanguard Retail', pr: 'Medium', s: '2026-07-01', e: '2027-01-15', t: [4, 8] },
  { id: 7, n: 'Cloud Cost Optimization', c: 'SaaS Systems', pr: 'Low', s: '2026-08-01', e: '2026-11-15', t: [1, 3] },
  { id: 8, n: 'Dolphin AI assistant', c: 'Cognitive Tech', pr: 'High', s: '2026-02-15', e: '2026-10-31', t: [4, 5] },
];

export const USERS = [
  { id: 1, n: 'Karthik R.', r: 'Lead', t: 'Tech lead' },
  { id: 2, n: 'Dachu M.', r: 'Member', t: 'Business analyst' },
  { id: 3, n: 'Priya Sharma', r: 'Lead', t: 'Delivery lead' },
  { id: 4, n: 'Arun Kumar', r: 'Member', t: 'Backend developer' },
  { id: 5, n: 'Meera Nair', r: 'Member', t: 'QA engineer' },
  { id: 6, n: 'Ravi Menon', r: 'Member', t: 'Integration developer' },
  { id: 7, n: 'Sneha Rao', r: 'Member', t: 'Frontend developer' },
  { id: 8, n: 'Joseph Paul', r: 'Member', t: 'Data engineer' },
];

export const MANAGER = { id: 0, n: 'R. Kumar', t: 'Project manager' };

export const INITIAL_AI_SIGNALS = [
  { id: 'sig-1', type: 'positive', badge: 'Positive', title: 'Proactive issue resolution', source: 'Project channel', date: 'Oct 14', confidence: 'Medium', quote: 'I found the issue in the course assignment flow and pushed a fix before the client walkthrough.', verified: false, flagged: false },
  { id: 'sig-2', type: 'positive', badge: 'Positive', title: 'Positive stakeholder feedback', source: 'Email summary', date: 'Oct 9', confidence: 'High', quote: 'The walkthrough was clear and the team responded quickly to our questions.', verified: false, flagged: false },
  { id: 'sig-3', type: 'concern', badge: 'Concern', title: 'Deadline communication', source: 'Project channel', date: 'Oct 17', confidence: 'Medium', quote: 'The revised delivery date was shared after the original milestone had passed.', verified: false, flagged: false },
  { id: 'sig-4', type: 'context', badge: 'Needs context', title: 'Repeated clarification needed', source: 'Email thread', date: 'Oct 20', confidence: 'Low', quote: 'The acceptance criteria needed clarification across two follow-up discussions.', verified: false, flagged: false },
];

export const RATING_PRINCIPLES = [
  { level: 5, label: 'Exceptional', desc: 'Consistently exceeds agreed outcomes; clear evidence of impact beyond role expectations.' },
  { level: 4, label: 'Exceeds expectations', desc: 'Often delivers above expectations and proactively improves outcomes.' },
  { level: 3, label: 'Meets expectations', desc: 'Reliably delivers the agreed scope and expected quality.' },
  { level: 2, label: 'Partially meets expectations', desc: 'Some important outcomes are inconsistent; clear examples and support actions are required.' },
  { level: 1, label: 'Does not meet expectations', desc: 'Material gaps against agreed expectations, supported by specific and contextualized examples.' },
];

export const INITIAL_REVIEW_HISTORY = [
  { id: 1, employee: 'Priya Sharma', project: 'Beacon LMS rollout', period: 'Q3 2026', rating: 4.2, status: 'Acknowledged', role: 'Delivery Lead', date: '2026-09-30' },
  { id: 2, employee: 'Arun Kumar', project: 'Dolphin AI assistant', period: 'Q3 2026', rating: 3.8, status: 'Employee response pending', role: 'Backend Developer', date: '2026-10-04' },
  { id: 3, employee: 'Meera Nair', project: 'ERP Modernization', period: 'Completion review', rating: 4.5, status: 'Manager draft', role: 'QA Engineer', date: '2026-10-18' },
  { id: 4, employee: 'Karthik R.', project: 'Beacon LMS rollout', period: 'Q3 2026', rating: 4.8, status: 'Acknowledged', role: 'Tech Lead', date: '2026-10-15' },
  { id: 5, employee: 'Sneha Rao', project: 'Customer Portal', period: 'Q3 2026', rating: 4.6, status: 'Acknowledged', role: 'Frontend Developer', date: '2026-10-20' },
];

export const SEED_REVIEWS = [
  { id: 1, p: 1, u: 2, by: 'Project manager', s: [4, 4, 4, 3], f: [], note: 'Found and fixed the assignment-flow bug before the client walkthrough.', d: '2026-10-14' },
  { id: 2, p: 1, u: 5, by: 'Program manager', s: [4, 5, 5, 4], f: [], note: 'Test coverage caught two release blockers early.', d: '2026-10-12' },
  { id: 3, p: 2, u: 4, by: 'Project manager', s: [3, 3, 2, 2], f: ['Missed checklist or process', 'Miscommunication'], note: 'Revised delivery date shared after the milestone passed.', d: '2026-10-17' },
  { id: 4, p: 2, u: 6, by: 'Level 2 manager', s: [4, 3, 4, 4], f: [], note: 'Solid integration work; improve estimates.', d: '2026-10-09' },
  { id: 5, p: 3, u: 7, by: 'Project manager', s: [5, 4, 5, 4], f: [], note: 'Clean components, quick turnaround on review feedback.', d: '2026-10-20' },
  { id: 6, p: 4, u: 8, by: 'Program manager', s: [3, 4, 3, 3], f: ['Deviation from plan'], note: 'Migration scripts needed rework after validation.', d: '2026-10-21' },
  { id: 7, p: 2, u: 3, by: 'Level 2 manager', s: [4, 4, 3, 4], f: ['Miscommunication'], note: 'Stakeholder updates arrived late twice in the quarter.', d: '2026-10-22' },
  { id: 8, p: 1, u: 1, by: 'Program manager', s: [5, 4, 5, 4], f: [], note: 'Strong technical direction, clear ownership.', d: '2026-10-23' },
];

export const DEFAULT_REVIEW_SETTINGS = {
  cycle: 'quarterly',
  visibility: 'Manager and employee',
  safeguardRequired: true,
  reminders: true,
};

export const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Quarterly review due soon', detail: 'Mobile Banking App · Ravi Menon · due in 2 days', time: 'Today', unread: true, tone: 'warning' },
  { id: 2, title: 'Closure review overdue', detail: 'Data Migration · Sneha Rao · overdue by 3 days', time: 'Today', unread: true, tone: 'error' },
  { id: 3, title: 'Employee responded', detail: 'Arun Kumar added comments on Dolphin AI assistant', time: 'Yesterday', unread: true, tone: 'info' },
  { id: 4, title: 'Review acknowledged', detail: 'Sneha Rao acknowledged the Customer Portal review', time: 'Oct 20', unread: false, tone: 'success' },
];
