/**
 * `npm run db:sample` — a small, easy-to-check example: 1 manager, 1 project, 3 team members,
 * one rating per member and approved goals with progress. Goes through the REAL API.
 *
 *   stop the server → npm run db:reset → npm run dev → npm run db:sample
 *
 * Every account uses the password Welcome@123.
 */
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const BASE = (args.url || `http://127.0.0.1:${process.env.API_PORT || 4000}`).replace(/\/+$/, '');
const PASSWORD = 'Welcome@123';
const PERIOD = 'Q4 2026';

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
  return { get: (p) => call('GET', p), post: (p, b) => call('POST', p, b || {}), login: (email) => call('POST', '/auth/login', { email, password: PASSWORD }) };
}

/* ------------------------------ the example ----------------------------- */
const MANAGER = { name: 'Ravi Kumar', email: 'ravi.kumar@profeed.test', title: 'Engineering manager', role: 'manager' };

const PROJECT = { n: 'Customer Portal Revamp', c: 'Orrin Bank', pr: 'High', s: '2026-10-01', e: '2027-01-29' };

const TEAM = [
  {
    key: 'anita', name: 'Anita Rao', email: 'anita.rao@profeed.test', title: 'Frontend developer', dept: 'Engineering', track: 'Member',
    // Rating: Delivery, Problem solving, Collaboration, Impact (1–5)
    scores: [5, 4, 5, 4], flags: [],
    note: 'Rebuilt the account dashboard in React and created 10 reusable components. The client approved the new design in the first review.',
    growth: 'Lead the next client demo.',
    goals: [
      { title: 'Build a shared component library', category: 'Delivery', priority: 'High', weight: 50, metric: 'Reusable components documented', target: '12 components', due: '2026-12-18', progress: 80, status: 'In Progress', update: '10 of 12 components done and documented.' },
      { title: 'Improve page accessibility', category: 'Quality', priority: 'Medium', weight: 30, metric: 'Lighthouse accessibility score', target: '95 or higher on 5 pages', due: '2026-12-12', progress: 100, status: 'Completed', update: 'All 5 pages now score 96+.' },
      { title: 'Finish advanced TypeScript course', category: 'Learning & growth', priority: 'Low', weight: 20, metric: 'Course certificate', target: '1 certificate', due: '2026-11-30', progress: 60, status: 'In Progress', update: '6 of 10 modules complete.' },
    ],
  },
  {
    key: 'vikram', name: 'Vikram Shah', email: 'vikram.shah@profeed.test', title: 'Backend developer', dept: 'Engineering', track: 'Member',
    scores: [4, 4, 3, 4], flags: ['Miscommunication'],
    note: 'Built the new login and payments APIs on time with good test coverage. One API change was not shared with the frontend team early.',
    growth: 'Post API changes in the team channel before merging.',
    goals: [
      { title: 'Deliver the payments API', category: 'Delivery', priority: 'High', weight: 60, metric: 'Payment endpoints live', target: '6 endpoints in production', due: '2026-12-20', progress: 50, status: 'In Progress', update: '3 of 6 endpoints live in production.' },
      { title: 'Raise API test coverage', category: 'Quality', priority: 'Medium', weight: 40, metric: 'Automated test coverage', target: '60% → 80%', due: '2026-12-15', progress: 25, status: 'In Progress', update: 'Coverage now 65%.' },
    ],
  },
  {
    key: 'kavya', name: 'Kavya Menon', email: 'kavya.menon@profeed.test', title: 'QA engineer', dept: 'Quality Assurance', track: 'Member',
    scores: [3, 4, 4, 3], flags: [],
    note: 'Wrote clear test cases for every sprint and found 2 release-blocking bugs before go-live. Automation work has started but is behind plan.',
    growth: 'Spend two days a week on test automation.',
    goals: [
      { title: 'Automate regression tests', category: 'Quality', priority: 'High', weight: 40, metric: 'Regression cases automated', target: '70% of cases', due: '2026-12-18', progress: 30, status: 'In Progress', update: '30% of cases automated.' },
      { title: 'Zero critical bugs in production', category: 'Client impact', priority: 'High', weight: 30, metric: 'Critical bugs found by the client', target: '0 this quarter', due: '2026-12-31', progress: 0, status: 'Not Started', update: '' },
      { title: 'Pair with developers on test design', category: 'Collaboration', priority: 'Medium', weight: 30, metric: 'Pairing sessions held', target: '6 sessions', due: '2026-12-10', progress: 0, status: 'On Hold', update: 'Paused until the sprint 8 release is out.' },
    ],
  },
];

async function main() {
  console.log(`Loading the example data via ${BASE}/api …`);
  try { await fetch(`${BASE}/api/health`); } catch {
    console.error(`\n✖ Cannot reach the API at ${BASE}. Start it first with:  npm run dev\n`);
    process.exit(1);
  }

  const manager = client('manager');
  const { needsSetup } = await manager.get('/auth/setup');
  if (!needsSetup) {
    console.error(`
✖ This workspace already has data. The example needs an empty workspace:
      stop the server (Ctrl + C) → npm run db:reset → npm run dev → npm run db:sample
`);
    process.exit(1);
  }

  // 1. Manager account (first account of the workspace)
  await manager.post('/auth/setup', { ...MANAGER, password: PASSWORD });
  console.log(`  • Manager: ${MANAGER.name}`);

  // 2. Team members (report to the manager)
  const ids = {};
  for (const m of TEAM) {
    const created = await manager.post('/users', { name: m.name, email: m.email, title: m.title, dept: m.dept, track: m.track, password: PASSWORD });
    ids[m.key] = created.id;
  }
  console.log(`  • Team: ${TEAM.map((m) => m.name).join(', ')}`);

  // 3. One project with all three on the team
  const project = await manager.post('/projects', { ...PROJECT, t: TEAM.map((m) => ids[m.key]) });
  console.log(`  • Project: ${project.n} (${project.c})`);

  // 4. One rating per member (4 areas, 1–5)
  for (const m of TEAM) {
    await manager.post('/reviews', {
      review: { p: project.id, u: ids[m.key], by: 'Project manager', s: m.scores, f: m.flags, note: `${m.note}\n\nGrowth actions: ${m.growth}` },
      meta: { period: PERIOD, role: m.title },
    });
  }
  console.log('  • Ratings: one review for each member');

  // 5. Goals: employee creates → submits → manager approves → employee updates progress
  for (const m of TEAM) {
    const me = client(m.key);
    await me.login(m.email);
    const created = [];
    for (const g of m.goals) {
      const { goal } = await me.post('/goals', { period: PERIOD, title: g.title, category: g.category, priority: g.priority, weight: g.weight, metric: g.metric, target: g.target, start: '2026-10-01', due: g.due });
      created.push({ ...g, id: goal.id });
    }
    await me.post(`/goal-plans/${ids[m.key]}/${encodeURIComponent(PERIOD)}/submitAll`);
    await manager.post(`/goal-plans/${ids[m.key]}/${encodeURIComponent(PERIOD)}/approveAll`);
    for (const g of created) {
      if (g.update) await me.post(`/goals/${g.id}/progress`, { progress: g.progress, status: g.status, note: g.update });
    }
  }
  console.log('  • Goals: submitted by each member, approved by Ravi, progress updated');

  console.log(`
✔ Done. Open http://127.0.0.1:5173 — password for every account: ${PASSWORD}

  Manager   ravi.kumar@profeed.test
  Employee  anita.rao@profeed.test · vikram.shah@profeed.test · kavya.menon@profeed.test
`);
}

main().catch((err) => {
  console.error(`\n✖ Stopped: ${err.message}\n`);
  process.exit(1);
});
