/**
 * `npm run db:seed` — fills the workspace with realistic test data through the REAL API
 * (same validation, history, notifications as the UI). The API server must be running.
 *
 *   npm run db:reset   # optional: start from an empty workspace (deletes everything!)
 *   npm run dev        # in another terminal
 *   npm run db:seed
 *
 * Empty workspace → creates everything, including the HR admin account.
 * Existing workspace → pass an HR/Admin login to add the test data alongside your data:
 *   npm run db:seed -- --email you@company.com --password yourpass
 */
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const BASE = (args.url || `http://127.0.0.1:${process.env.API_PORT || 4000}`).replace(/\/+$/, '');
const PASSWORD = 'Welcome@123';
const P = 'Q4 2026';
const PREV = 'Q3 2026';

/* --------------------------- tiny API client --------------------------- */
function client(label) {
  let cookie = '';
  async function call(method, path, body) {
    const res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new Error(`[${label}] ${method} ${path} → ${res.status}: ${data?.message || 'error'}`);
    return data;
  }
  return {
    get: (p) => call('GET', p), post: (p, b) => call('POST', p, b || {}), patch: (p, b) => call('PATCH', p, b),
    login: (email, password = PASSWORD) => call('POST', '/auth/login', { email, password }),
  };
}

const step = (msg) => console.log(`  • ${msg}`);

/* -------------------------------- data --------------------------------- */
const HR = { name: 'Lakshmi Iyer', email: 'lakshmi.iyer@profeed.test', title: 'HR business partner' };
const MANAGERS = [
  { key: 'priya', name: 'Priya Menon', email: 'priya.menon@profeed.test', title: 'Engineering manager', dept: 'Engineering', track: 'Lead' },
  { key: 'arjun', name: 'Arjun Nair', email: 'arjun.nair@profeed.test', title: 'QA & data manager', dept: 'Quality Assurance', track: 'Lead' },
];
const EMPLOYEES = [
  { key: 'karthik', name: 'Karthik Raman', email: 'karthik.raman@profeed.test', title: 'Tech lead', dept: 'Engineering', track: 'Lead', manager: 'priya' },
  { key: 'sneha', name: 'Sneha Rao', email: 'sneha.rao@profeed.test', title: 'Frontend developer', dept: 'Engineering', track: 'Member', manager: 'priya' },
  { key: 'arun', name: 'Arun Kumar', email: 'arun.kumar@profeed.test', title: 'Backend developer', dept: 'Engineering', track: 'Member', manager: 'priya' },
  { key: 'divya', name: 'Divya Shankar', email: 'divya.shankar@profeed.test', title: 'Business analyst', dept: 'Business Analysis', track: 'Member', manager: 'priya' },
  { key: 'meera', name: 'Meera Nair', email: 'meera.nair@profeed.test', title: 'QA engineer', dept: 'Quality Assurance', track: 'Member', manager: 'arjun' },
  { key: 'joseph', name: 'Joseph Paul', email: 'joseph.paul@profeed.test', title: 'Data engineer', dept: 'Data', track: 'Member', manager: 'arjun' },
];

const goal = (title, category, priority, weight, metric, target, start, due, desc = '') => ({ title, category, priority, weight, metric, target, start, due, desc, period: start < '2026-10-01' ? PREV : P });

async function main() {
  console.log(`Seeding ProFeed via ${BASE}/api …`);
  try { await fetch(`${BASE}/api/health`); } catch {
    console.error(`\n✖ Cannot reach the API at ${BASE}. Start it first with:  npm run dev\n`);
    process.exit(1);
  }

  /* ----------------------------- accounts ----------------------------- */
  const hr = client('hr');
  const { needsSetup } = await hr.get('/auth/setup');
  if (needsSetup) {
    await hr.post('/auth/setup', { ...HR, role: 'hr', password: PASSWORD });
    step(`Created HR admin ${HR.email}`);
  } else if (args.email && args.password) {
    const me = await hr.login(args.email, args.password);
    if (me.role !== 'hr') throw new Error('The --email account must be an HR / Admin account (only HR can create managers).');
    step(`Signed in as HR admin ${me.email}`);
  } else {
    console.error(`
✖ This workspace already has accounts, so the test data would mix with your real data.
  Either start clean (deletes ALL current data):
      stop the server → npm run db:reset → npm run dev → npm run db:seed
  or add the test data alongside your data using an HR / Admin login:
      npm run db:seed -- --email <hr email> --password <hr password>
`);
    process.exit(1);
  }

  const directory = await hr.get('/users/directory');
  const ids = {};
  async function ensureUser(person, extra) {
    const existing = directory.find((u) => u.email === person.email);
    if (existing) { ids[person.key] = existing.id; return; }
    const created = await hr.post('/users', { name: person.name, email: person.email, title: person.title, dept: person.dept, track: person.track, password: PASSWORD, ...extra });
    ids[person.key] = created.id;
  }
  for (const m of MANAGERS) await ensureUser(m, { role: 'manager' });
  for (const e of EMPLOYEES) await ensureUser(e, { role: 'employee', managerId: ids[e.manager] });
  step(`Accounts: ${MANAGERS.length} managers, ${EMPLOYEES.length} employees`);

  const as = {};
  for (const p of [...MANAGERS, ...EMPLOYEES]) {
    as[p.key] = client(p.key);
    await as[p.key].login(p.email);
  }

  /* ----------------------------- projects ----------------------------- */
  const existingProjects = await as.priya.get('/projects');
  async function ensureProject(owner, input) {
    const found = existingProjects.find((p) => p.n === input.n);
    return found || as[owner].post('/projects', input);
  }
  const portal = await ensureProject('priya', { n: 'Customer Portal Revamp', c: 'Orrin Bank', pr: 'High', s: '2026-09-01', e: '2027-01-29', t: [ids.karthik, ids.sneha, ids.arun] });
  const payments = await ensureProject('priya', { n: 'Payments API Migration', c: 'Halden Logistics', pr: 'Medium', s: '2026-10-05', e: '2026-12-18', t: [ids.arun, ids.divya] });
  await ensureProject('arjun', { n: 'Regression Automation', c: 'Kestrel Health', pr: 'Medium', s: '2026-10-01', e: '2027-02-26', t: [ids.meera, ids.joseph] });
  step('Projects: Customer Portal Revamp, Payments API Migration, Regression Automation');

  /* ------------------------------ reviews ----------------------------- */
  const reviews = await as.priya.get('/reviews');
  if (!reviews.length) {
    await as.priya.post('/reviews', {
      review: { p: portal.id, u: ids.sneha, by: 'Project manager', s: [5, 4, 5, 4], f: [], note: 'Rebuilt the account dashboard in React with a shared component library; the client signed off the redesign in one review round.\n\nGrowth actions: Lead the next client demo.' },
      meta: { period: 'Q4 2026', role: 'Frontend developer' },
    });
    await as.priya.post('/reviews', {
      quick: {
        p: payments.id, u: ids.arun, type: 'Mid-project checkpoint', period: 'Q4 2026', overall: 3,
        delivery: 'Meets expectations', collaboration: 'Needs improvement',
        strengths: 'Migrated the invoice endpoints to the new gateway with zero downtime during the cut-over weekend.',
        development: 'Share schedule risks earlier — the revised delivery date reached the client after the milestone.',
        comment: '', nextDate: null, visibility: 'Manager and employee',
      },
    });
    step('Reviews: Sneha (rubric review), Arun (mid-project checkpoint) · Karthik & Divya still need feedback');
  }

  /* ------------------------------- goals ------------------------------ */
  const existingGoals = await hr.get('/goals'); // HR sees every team (a manager only sees their own)
  const hasGoals = (key) => existingGoals.some((g) => g.u === ids[key]);
  const add = async (who, g, submit = false) => (await as[who].post('/goals', { ...g, submit })).goal;
  const plan = (who, period, action, body, by) => (by === 'hr' ? hr : as[by || who]).post(`/goal-plans/${ids[who]}/${encodeURIComponent(period)}/${action}`, body);
  const act = (by, id, action, body) => as[by].post(`/goals/${id}/${action}`, body);
  const rateAll = (goals, values, extra = {}) => Object.fromEntries(goals.map((g, i) => [g.id, { rating: values[i], comment: extra.comments?.[i] || '', improvement: extra.improvements?.[i] || '' }]));

  // Karthik — last quarter fully closed (review history), this quarter waiting for Priya's evaluation.
  if (!hasGoals('karthik')) {
    const q3 = [
      await add('karthik', goal('Ship Customer Portal phase 1', 'Delivery', 'High', 60, 'Phase 1 go-live', 'Live by Sep 20', '2026-07-01', '2026-09-20')),
      await add('karthik', goal('Introduce code review guidelines', 'Leadership', 'Medium', 40, 'Squads following guidelines', 'All 3 squads', '2026-07-01', '2026-09-30')),
    ];
    await plan('karthik', PREV, 'submitAll');
    await plan('karthik', PREV, 'approveAll', {}, 'priya');
    for (const g of q3) await act('karthik', g.id, 'progress', { progress: 100, status: 'Completed', note: 'Done and signed off.', evidence: 'Release notes' });
    await plan('karthik', PREV, 'selfAssess', { ratings: rateAll(q3, [4, 4]), summary: 'Phase 1 shipped on time and the review guidelines are used by every squad.' });
    await plan('karthik', PREV, 'evaluate', { ratings: rateAll(q3, [4, 4], { comments: ['Delivered on schedule.', 'Well adopted.'] }), summary: 'Solid delivery quarter with clear technical ownership.', improvement: 'Delegate more release coordination.' }, 'priya');
    await plan('karthik', PREV, 'hrFinalize', {}, 'hr');
    await plan('karthik', PREV, 'discuss', { notes: 'Walked through both goals; agreed Karthik delegates release coordination next quarter.' }, 'priya');
    await plan('karthik', PREV, 'acknowledge', { comment: 'Thanks — agreed on the delegation point.' });

    const q4 = [
      await add('karthik', goal('Mentor two junior developers', 'Leadership', 'High', 40, 'Mentees shipping independently', '2 mentees', '2026-10-01', '2026-12-31', 'Weekly pairing and code-review coaching for Sneha and Arun.')),
      await add('karthik', goal('Cut release lead time', 'Delivery', 'High', 30, 'Lead time from merge to production', '10 → 5 days', '2026-10-01', '2026-12-15')),
      await add('karthik', goal('Reduce production incidents', 'Quality', 'Medium', 30, 'P1 incidents this quarter', 'Fewer than 2', '2026-10-01', '2026-12-31')),
    ];
    await plan('karthik', P, 'submitAll');
    await plan('karthik', P, 'approveAll', {}, 'priya');
    await act('karthik', q4[0].id, 'progress', { progress: 100, status: 'Completed', note: 'Both mentees shipped features on their own in November.', evidence: 'PR #482, PR #497' });
    await act('karthik', q4[1].id, 'progress', { progress: 80, status: 'In Progress', note: 'Lead time is now 6 days after automating the approval gate.', evidence: 'Deploy dashboard' });
    await act('karthik', q4[2].id, 'progress', { progress: 100, status: 'Completed', note: 'One P1 so far this quarter.', evidence: 'Incident log' });
    await plan('karthik', P, 'selfAssess', { ratings: rateAll(q4, [5, 4, 4], { comments: ['Both mentees independent.', '6 days, target 5.', 'One P1 only.'] }), summary: 'Mentoring went very well; release lead time nearly at target.' });
    step('Goals · Karthik: Q3 closed (history), Q4 self-assessed → waiting for Priya to evaluate');
  }

  // Sneha — full Q4 cycle evaluated → waiting for her to acknowledge.
  if (!hasGoals('sneha')) {
    const g = [
      await add('sneha', goal('Build a shared component library', 'Delivery', 'High', 50, 'Documented components adopted', '12 components · 2 squads', '2026-10-01', '2026-12-18', 'Extract reusable form and table components for the Customer Portal.')),
      await add('sneha', goal('Raise accessibility score to 95', 'Quality', 'Medium', 30, 'Lighthouse accessibility score', '≥ 95 on 5 key pages', '2026-10-01', '2026-12-12')),
      await add('sneha', goal('Complete advanced TypeScript course', 'Learning & growth', 'Low', 20, 'Course certificate', '1 certificate', '2026-10-01', '2026-11-30')),
    ];
    await plan('sneha', P, 'submitAll');
    await plan('sneha', P, 'approveAll', {}, 'priya');
    await act('sneha', g[0].id, 'progress', { progress: 90, status: 'In Progress', note: '11 components documented; second squad onboarded.', evidence: 'Storybook link' });
    await act('sneha', g[1].id, 'progress', { progress: 100, status: 'Completed', note: 'All 5 pages above 95.', evidence: 'Lighthouse report' });
    await act('sneha', g[2].id, 'progress', { progress: 100, status: 'Completed', note: 'Course finished.', evidence: 'Certificate #TS-4471' });
    await act('priya', g[0].id, 'feedback', { note: 'Great adoption — the payments squad is already using the table component.' });
    await plan('sneha', P, 'selfAssess', { ratings: rateAll(g, [4, 5, 4]), summary: 'Library nearly complete and accessibility target met early.' });
    await plan('sneha', P, 'evaluate', {
      ratings: rateAll(g, [5, 4, 4], { comments: ['Excellent adoption across squads.', 'Target met.', 'Done.'], improvements: ['Write a contribution guide.', '', ''] }),
      summary: 'Outstanding quarter — the component library is now a team asset.', improvement: 'Take on a design-system lead role next quarter.',
    }, 'priya');
    await plan('sneha', P, 'hrFinalize', {}, 'hr');
    step('Goals · Sneha: evaluated by Priya, validated by HR → waiting for the feedback discussion by Priya');
  }

  // Arun — one goal approved, one sent back for changes.
  if (!hasGoals('arun')) {
    const a = await add('arun', goal('Share milestone risks early', 'Collaboration', 'High', 60, 'Late delivery-date changes', '0 this quarter', '2026-10-05', '2026-12-18', 'Raise schedule risks in stand-up at least five working days before a milestone.'));
    const b = await add('arun', goal('Raise API test coverage', 'Quality', 'Medium', 40, 'Integration test coverage', '48% → 75%', '2026-10-05', '2026-12-10'), true);
    await act('arun', a.id, 'submit');
    await act('priya', a.id, 'approve', { note: 'Good — let’s review this in every 1:1.' });
    await act('priya', b.id, 'requestChanges', { note: 'Split the target per service (orders, invoices) so progress is measurable.' });
    await act('arun', a.id, 'progress', { progress: 40, status: 'In Progress', note: 'Risks now raised in Monday stand-up.' });
    step('Goals · Arun: 1 approved & in progress, 1 "Changes Requested" → Arun needs to edit and resubmit');
  }

  // Divya — still drafting (70% allocated).
  if (!hasGoals('divya')) {
    await add('divya', goal('Reduce requirement clarification rounds', 'Quality', 'High', 40, 'Clarification rounds per story', '≤ 1 round', '2026-10-05', '2026-12-18', 'Write acceptance criteria with worked examples before sprint planning.'));
    await add('divya', goal('Complete CBAP exam preparation', 'Learning & growth', 'Medium', 30, 'Mock exam score', '≥ 75% on 2 mocks', '2026-10-05', '2026-12-15'));
    step('Goals · Divya: 2 drafts (70%) → she needs one more goal to reach 100% and submit');
  }

  // Meera — submitted, waiting for Arjun's approval.
  if (!hasGoals('meera')) {
    await add('meera', goal('Automate the release regression suite', 'Quality', 'High', 50, 'Regression cases automated', '80%', '2026-10-01', '2026-12-12'));
    await add('meera', goal('Pair with developers on test design', 'Collaboration', 'Medium', 25, 'Pairing sessions', '8 sessions', '2026-10-01', '2026-12-05'));
    await add('meera', goal('ISTQB Advanced Test Analyst', 'Learning & growth', 'Medium', 25, 'Certification', 'Pass', '2026-10-01', '2026-12-20'));
    await plan('meera', P, 'submitAll');
    step('Goals · Meera: 3 goals submitted → waiting for Arjun to approve');
  }
  step('Goals · Joseph: no goals yet (empty state)');

  console.log(`
✔ Done. Sign in at http://127.0.0.1:5173 — every test account uses the password  ${PASSWORD}

  Role        Email                          What to try
  HR / Admin  ${HR.email}      Appraisal cycles (create / publish / close), Performance review → Workflow status
  Manager     priya.menon@profeed.test       Evaluate Karthik · record Sneha's feedback discussion · review Arun's returned goal
  Manager     arjun.nair@profeed.test        Approve Meera's 3 goals
  Employee    sneha.rao@profeed.test         Waiting for the feedback discussion, then acknowledge
  Employee    arun.kumar@profeed.test        Fix the goal with "Changes Requested" and resubmit
  Employee    divya.shankar@profeed.test     Add a 30% goal, then submit the plan
  Employee    karthik.raman@profeed.test     Past reviews (Q3) · waiting for evaluation
  Employee    meera.nair@profeed.test        Waiting for approval (watch it update live when Arjun approves)
  Employee    joseph.paul@profeed.test       Start from an empty goal plan

Tip: open two different browsers (or a private window) to watch live updates between a manager and an employee.
`);
}

main().catch((err) => {
  console.error(`\n✖ Seeding stopped: ${err.message}\n`);
  process.exit(1);
});
