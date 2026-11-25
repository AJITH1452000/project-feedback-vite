import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ArrowRight, BadgeCheck, BellRing, CalendarRange, ClipboardCheck, GitPullRequestArrow, Handshake, Search, Star, Target, TrendingUp, Users } from 'lucide-react';
import ResponsiveTable from '../../components/common/ResponsiveTable.jsx';
import { EmptyState, FilterChips, PageHeader, Pill, ScoreBadge, SectionCard, StatCard, UserAvatar } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGoalData } from '../../hooks/queries/workspace.js';
import { cycleFor, isEligible, reminderFor } from '../../data/cycles.js';
import { useRemindEmployee } from '../../hooks/queries/cycles.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  PRIORITY_TONE, STATUS_TONE, effectiveScore, getPlan, goalsFor, isActive, planPhase, totalWeight, weightedProgress,
} from '../../data/goals.js';
import { avg, f1, findUser, formatDate } from '../../data/selectors.js';
import { card, grid, page, text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';
import usePeriod from './usePeriod.js';

const STATUS_FILTERS = ['All', 'Pending Approval', 'Active', 'Changes Requested', 'Rejected', 'Completed', 'Draft'];
const matchesStatus = (g, f) => f === 'All' || (f === 'Active' ? isActive(g) && g.status !== 'Completed' : g.status === f);
const progressTone = (p) => (p >= 70 ? 'success' : p >= 40 ? 'info' : 'warning');

export default function TeamGoals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, people, goals, goalPlans } = useGoalData();
  const isHr = user.role === 'hr';
  const hrReview = true;
  const [period, setPeriod, cycles] = usePeriod();
  const [tab, setTab] = useState('actions');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [owner, setOwner] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all'); // HR only
  const remind = useRemindEmployee();
  const { notify } = useToast();
  const [remindingAll, setRemindingAll] = useState(false);

  // Manager: direct reports (the backend enforces the same reporting lines).
  // HR: every employee eligible for the cycle, optionally narrowed to one manager's team.
  const cycle = cycleFor(period);
  const managers = useMemo(() => people.filter((p) => p.role === 'manager'), [people]);
  const team = useMemo(() => (isHr
    ? users.filter((u) => (!cycle || isEligible(cycle, u)) && (managerFilter === 'all' || u.managerId === managerFilter))
    : users.filter((u) => u.managerId === user.userId)), [users, user.userId, isHr, cycle, managerFilter]);
  const teamIds = useMemo(() => new Set(team.map((u) => u.id)), [team]);
  const rows = useMemo(() => team.map((u) => {
    const plan = getPlan(goalPlans, u.id, period);
    const list = goalsFor(goals, u.id, period);
    return { id: u.id, user: u, plan, list, phase: planPhase(plan, list), weight: totalWeight(list), progress: weightedProgress(list), score: effectiveScore(plan, hrReview) };
  }), [team, goals, goalPlans, period, hrReview]);

  const open = (u) => navigate(`/goals/${u}?period=${encodeURIComponent(period)}`);
  const periodGoals = goals.filter((g) => g.period === period && teamIds.has(g.u));
  const pendingGoals = periodGoals.filter((g) => g.status === 'Pending Approval');
  const changeRequests = periodGoals.filter((g) => g.change);
  const toEvaluate = rows.filter((r) => r.plan.stage === 'Self-assessed');
  const toDiscuss = rows.filter((r) => r.plan.stage === 'Finalized');
  const toValidate = rows.filter((r) => r.plan.stage === 'Evaluated');
  const actionCount = isHr ? toValidate.length
    : new Set([...pendingGoals.map((g) => g.u), ...changeRequests.map((g) => g.u)]).size + toEvaluate.length + toDiscuss.length;
  const managerName = (id) => findUser(people, id).n;

  // Employees with a step of their own to do (set goals, progress, self-appraisal, acknowledge).
  const remindable = rows.filter((r) => reminderFor(r.phase.status, cycle));
  const remindOne = (r) => remind.mutate({ u: r.id, period }, {
    onSuccess: () => notify(`Reminder sent to ${r.user.n}.`),
    onError: (err) => notify(err.message, 'error'),
  });
  async function remindAll() {
    setRemindingAll(true);
    const results = await Promise.allSettled(remindable.map((r) => remind.mutateAsync({ u: r.id, period })));
    setRemindingAll(false);
    const sent = results.filter((x) => x.status === 'fulfilled').length;
    notify(sent === remindable.length ? `Reminder sent to ${sent} employee${sent === 1 ? '' : 's'}.` : `Sent ${sent} of ${remindable.length} reminders.`, sent === remindable.length ? 'success' : 'warning');
  }
  const sendingTo = (id) => remind.isPending && remind.variables?.u === id;
  const scored = rows.filter((r) => r.score !== null);

  const queue = isHr ? toValidate.map((r) => ({
    key: `v-${r.id}`, r, icon: BadgeCheck, tone: 'warning', label: 'HR validation',
    detail: `Evaluated by ${managerName(r.user.managerId)} ${formatDate(r.plan.evaluatedAt)} · manager score ${r.plan.managerScore?.toFixed(2) ?? '—'}`, cta: 'Validate',
  })) : [
    ...rows.filter((r) => r.list.some((g) => g.status === 'Pending Approval')).map((r) => ({
      key: `a-${r.id}`, r, icon: ClipboardCheck, tone: 'warning', label: 'Goal approval',
      detail: `${r.list.filter((g) => g.status === 'Pending Approval').length} goal(s) submitted · ${r.weight}% weightage`, cta: 'Review goals',
    })),
    ...rows.filter((r) => r.list.some((g) => g.change)).map((r) => ({
      key: `c-${r.id}`, r, icon: GitPullRequestArrow, tone: 'secondary', label: 'Change request',
      detail: r.list.filter((g) => g.change).map((g) => g.title).join(', '), cta: 'Review change',
    })),
    ...toEvaluate.map((r) => ({
      key: `e-${r.id}`, r, icon: Star, tone: 'info', label: 'Performance evaluation',
      detail: `Self assessment submitted ${formatDate(r.plan.selfAt)}`, cta: 'Evaluate',
    })),
    ...toDiscuss.map((r) => ({
      key: `d-${r.id}`, r, icon: Handshake, tone: 'primary', label: 'Feedback discussion',
      detail: `HR validated ${formatDate(r.plan.finalizedAt)} · share the feedback`, cta: 'Record discussion',
    })),
  ];

  const goalRows = periodGoals
    .filter((g) => matchesStatus(g, status))
    .filter((g) => owner === 'all' || g.u === owner)
    .filter((g) => !query.trim() || `${g.title} ${g.metric} ${findUser(users, g.u).n}`.toLowerCase().includes(query.trim().toLowerCase()));

  const goalColumns = [
    {
      key: 'title', label: 'Goal', primary: true, sortValue: (g) => g.title,
      render: (g) => (
        <Box minWidth={0} maxWidth={360}>
          <Typography variant="subtitle2" sx={s.wrap}>{g.title}</Typography>
          <Typography variant="caption" color="text.secondary">{g.metric} · target {g.target}</Typography>
        </Box>
      ),
    },
    {
      key: 'owner', label: 'Employee', sortValue: (g) => findUser(users, g.u).n,
      render: (g) => (
        <Box display="flex" alignItems="center" gap={1} minWidth={0}>
          <UserAvatar name={findUser(users, g.u).n} size={26} />
          <Typography variant="body2" sx={text.ellipsis}>{findUser(users, g.u).n}</Typography>
        </Box>
      ),
    },
    { key: 'status', label: 'Status', sortValue: (g) => g.status, render: (g) => <Pill tone={STATUS_TONE[g.status]} dot>{g.status}</Pill> },
    { key: 'priority', label: 'Priority', sortValue: (g) => ['High', 'Medium', 'Low'].indexOf(g.priority), render: (g) => <Pill tone={PRIORITY_TONE[g.priority]}>{g.priority}</Pill> },
    { key: 'weight', label: 'Weight', sortValue: (g) => g.weight, render: (g) => `${g.weight}%` },
    { key: 'due', label: 'Target date', sortValue: (g) => g.due, render: (g) => formatDate(g.due) },
    {
      key: 'progress', label: 'Progress', sortValue: (g) => g.progress,
      render: (g) => (isActive(g) ? (
        <Box sx={s.miniProgress}><LinearProgress variant="determinate" value={g.progress} sx={s.progressBar(progressTone(g.progress))} /><Typography variant="caption" fontWeight={700}>{g.progress}%</Typography></Box>
      ) : '—'),
    },
    { key: 'open', label: '', align: 'right', render: (g) => <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => open(g.u)}>Open</Button> },
  ];

  const peopleColumns = [
    {
      key: 'user', label: 'Employee', primary: true, sortValue: (r) => r.user.n,
      render: (r) => (
        <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
          <UserAvatar name={r.user.n} size={32} />
          <Box minWidth={0}><Typography variant="subtitle2" sx={text.ellipsis}>{r.user.n}</Typography><Typography variant="caption" color="text.secondary">{r.user.t}</Typography></Box>
        </Box>
      ),
    },
    { key: 'phase', label: 'Appraisal status', sortValue: (r) => r.phase.step, render: (r) => <Pill tone={r.phase.tone} dot>{r.phase.status}</Pill> },
    ...(isHr ? [{ key: 'mgr', label: 'Manager', sortValue: (r) => managerName(r.user.managerId), render: (r) => managerName(r.user.managerId) }] : []),
    { key: 'next', label: 'Next action by', sortValue: (r) => r.phase.nextBy, render: (r) => r.phase.nextBy },
    { key: 'goals', label: 'Goals', sortValue: (r) => r.list.length, render: (r) => `${r.list.filter(isActive).length} / ${r.list.filter((g) => g.status !== 'Rejected').length} approved` },
    { key: 'weight', label: 'Weightage', sortValue: (r) => r.weight, render: (r) => <Pill tone={r.weight === 100 ? 'success' : r.weight ? 'warning' : 'neutral'}>{r.weight}%</Pill> },
    {
      key: 'progress', label: 'Progress', sortValue: (r) => r.progress,
      render: (r) => (r.list.some(isActive)
        ? <Box sx={s.miniProgress}><LinearProgress variant="determinate" value={r.progress} sx={s.progressBar(progressTone(r.progress))} /><Typography variant="caption" fontWeight={700}>{r.progress}%</Typography></Box>
        : '—'),
    },
    { key: 'score', label: 'Rating', sortValue: (r) => r.score ?? -1, render: (r) => (r.score !== null ? <ScoreBadge value={r.score} suffix=" / 5" /> : '—') },
    {
      key: 'open', label: '', align: 'right',
      render: (r) => (
        <Box sx={s.rowActions}>
          {reminderFor(r.phase.status, cycle) && (
            <Button size="small" startIcon={<BellRing size={14} />} disabled={sendingTo(r.id) || remindingAll} onClick={() => remindOne(r)}
              title={r.plan.lastReminderAt ? `Last reminded ${formatDate(r.plan.lastReminderAt)}` : 'Not reminded yet'}>
              Remind
            </Button>
          )}
          <Button size="small" variant="outlined" endIcon={<ArrowRight size={14} />} onClick={() => open(r.id)}>Open</Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow={isHr ? 'HR / Admin · performance management' : 'Performance management'} title={isHr ? 'All goals' : 'Team goals'}
        description={isHr
          ? 'Every employee\'s goals and appraisal status across all managers. Managers approve and evaluate; HR monitors and validates.'
          : 'Approve the goals your team submits, follow their progress, and evaluate performance at the end of the review period.'}
        actions={isHr && (
          <TextField select size="small" label="Reporting manager" value={managerFilter} onChange={(e) => { setManagerFilter(e.target.value === 'all' ? 'all' : Number(e.target.value)); setOwner('all'); }} sx={s.ownerSelect}>
            <MenuItem value="all">All managers</MenuItem>
            {managers.map((m) => <MenuItem key={m.id} value={m.id}>{m.n}</MenuItem>)}
          </TextField>
        )} />

      <Box sx={page.stack}>
        {!period ? (
          <EmptyState icon={CalendarRange} title="No appraisal cycle is open" description="Goal setting opens when HR publishes an appraisal cycle." />
        ) : (
        <FilterChips label="Appraisal cycle" value={period} onChange={setPeriod}
          options={cycles.map((c) => ({ value: c.period, label: c.status === 'Open' ? c.period : `${c.period} · ${c.status}` }))} />
        )}

        <Box sx={grid.kpis}>
          <StatCard label="Needs your action" value={actionCount} icon={ClipboardCheck} tone={actionCount ? 'warning' : 'success'} footer={isHr ? `${rows.filter((r) => r.phase.waitingOn === 'manager').length} waiting on managers` : `${pendingGoals.length} goals · ${changeRequests.length} changes · ${toEvaluate.length} evaluations · ${toDiscuss.length} discussions`} />
          <StatCard label="Active goals" value={periodGoals.filter(isActive).length} icon={Target} tone="primary" footer={`${periodGoals.filter((g) => g.status === 'Rejected').length} rejected this period`} />
          <StatCard label={isHr ? 'Overall progress' : 'Team progress'} value={`${Math.round(avg(rows.filter((r) => r.list.some(isActive)).map((r) => r.progress)))}%`} icon={TrendingUp} tone="info" footer="Weighted, across active plans" />
          <StatCard label="Average rating" value={scored.length ? f1(avg(scored.map((r) => r.score))) : '—'} scale="/ 5" icon={Users} tone="success" footer={`${scored.length} of ${rows.length} rated`} />
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={s.tabs}>
          <Tab value="actions" label={`Pending actions (${queue.length})`} />
          <Tab value="goals" label={`${isHr ? 'All goals' : 'All team goals'} (${periodGoals.length})`} />
          <Tab value="people" label="Employee progress" />
        </Tabs>

        {tab === 'actions' && (
          <SectionCard title="Pending actions" subtitle={isHr ? 'Manager evaluations waiting for HR validation.' : 'Goal approvals, change requests, evaluations and feedback discussions waiting on you.'} icon={ClipboardCheck}>
            {queue.length ? (
              <Box sx={card.body}>
                {queue.map((q) => (
                  <Box key={q.key} sx={card.listItem}>
                    <UserAvatar name={q.r.user.n} size={36} />
                    <Box flex={1} minWidth={0}>
                      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle2">{q.r.user.n}</Typography>
                        <Pill tone={q.tone}>{q.label}</Pill>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={s.wrap} component="div">{q.detail}</Typography>
                    </Box>
                    <Button size="small" variant="contained" onClick={() => open(q.r.id)}>{q.cta}</Button>
                  </Box>
                ))}
              </Box>
            ) : <EmptyState icon={ClipboardCheck} title="You're all caught up" description={isHr ? 'Evaluations completed by managers will appear here for validation.' : 'Submitted goals, change requests and self assessments will appear here.'} />}
          </SectionCard>
        )}

        {tab === 'goals' && (
          <SectionCard title={isHr ? 'All goals' : 'All team goals'} subtitle={`${period} · filter by status to see pending, approved or rejected goals.`} icon={Target}>
            <Box sx={s.toolbar}>
              <TextField size="small" placeholder="Search goals or people" value={query} onChange={(e) => setQuery(e.target.value)} sx={s.search}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }} />
              <TextField select size="small" label="Employee" value={owner} onChange={(e) => setOwner(e.target.value)} sx={s.ownerSelect}>
                <MenuItem value="all">All employees</MenuItem>
                {team.map((u) => <MenuItem key={u.id} value={u.id}>{u.n}</MenuItem>)}
              </TextField>
            </Box>
            <Box mb={2}>
              <FilterChips label="Status" value={status} onChange={setStatus}
                options={STATUS_FILTERS.map((f) => ({ value: f, label: `${f} (${periodGoals.filter((g) => matchesStatus(g, f)).length})` }))} />
            </Box>
            <ResponsiveTable columns={goalColumns} rows={goalRows} pageSize={8} defaultSort={{ key: 'due', dir: 'asc' }} emptyText="No goals match these filters." />
          </SectionCard>
        )}

        {tab === 'people' && (
          <SectionCard title="Employee progress" subtitle="Each employee's plan for the period. Remind anyone whose next step is theirs." icon={Users}
            action={remindable.length > 0 && (
              <Button size="small" variant="contained" startIcon={<BellRing size={15} />} disabled={remindingAll} onClick={remindAll}>
                {remindingAll ? 'Sending…' : `Remind all pending (${remindable.length})`}
              </Button>
            )}>
            <ResponsiveTable columns={peopleColumns} rows={rows} pageSize={10} defaultSort={{ key: 'phase', dir: 'asc' }} />
          </SectionCard>
        )}
      </Box>
    </Box>
  );
}
