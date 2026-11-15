import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ArrowRight, BadgeCheck, Building2, CalendarRange, Download, RotateCcw, Star, Target, Users } from 'lucide-react';
import FinalizeDialog from '../../components/goals/FinalizeDialog.jsx';
import NoteDialog from '../../components/goals/NoteDialog.jsx';
import ResponsiveTable from '../../components/common/ResponsiveTable.jsx';
import { EmptyState, FilterChips, PageHeader, Pill, ScoreBadge, SectionCard, StatCard, UserAvatar } from '../../components/common/index.jsx';
import { useGoalPlanAction } from '../../hooks/queries/goals.js';
import { useGoalData } from '../../hooks/queries/workspace.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GOAL_PERIOD_RANGES, GOAL_PERIODS } from '../../data/constants.js';
import { effectiveScore, getPlan, goalsFor, isActive, planPhase, totalWeight, weightedProgress } from '../../data/goals.js';
import { avg, downloadCsv, f1, formatDate, ratingLabel } from '../../data/selectors.js';
import { card, grid, page, text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';
import usePeriod from '../goals/usePeriod.js';

const progressTone = (p) => (p >= 70 ? 'success' : p >= 40 ? 'info' : 'warning');

/** HR / Admin: monitor every employee and department; final review only when the company enables it. */
export default function HrReview() {
  const navigate = useNavigate();
  const { users, goals, goalPlans, settings } = useGoalData();
  const planMutation = useGoalPlanAction();
  const { notify } = useToast();
  const hrReview = Boolean(settings?.hrReview);
  const [period, setPeriod] = usePeriod();
  const [tabState, setTab] = useState(hrReview ? 'queue' : 'employees');
  const tab = !hrReview && tabState === 'queue' ? 'employees' : tabState;
  const [dept, setDept] = useState('all');
  const [finalizing, setFinalizing] = useState(null);
  const [returning, setReturning] = useState(null);

  const rows = useMemo(() => users.map((u) => {
    const plan = getPlan(goalPlans, u.id, period);
    const list = goalsFor(goals, u.id, period);
    return {
      id: u.id, user: u, dept: u.dept || 'Other', plan, list, phase: planPhase(plan, list, hrReview),
      weight: totalWeight(list), progress: weightedProgress(list), managerScore: plan.managerScore ?? null, score: effectiveScore(plan, hrReview),
    };
  }), [users, goals, goalPlans, period, hrReview]);

  const filtered = rows.filter((r) => dept === 'all' || r.dept === dept);
  const queue = rows.filter((r) => r.plan.stage === 'Evaluated');
  const evaluated = rows.filter((r) => ['Evaluated', 'Finalized', 'Acknowledged'].includes(r.plan.stage));
  const scored = rows.filter((r) => r.score !== null);
  const departments = [...new Set(rows.map((r) => r.dept))].sort();
  const deptStats = departments.map((d) => {
    const inDept = rows.filter((r) => r.dept === d);
    const active = inDept.filter((r) => r.list.some(isActive));
    const rated = inDept.filter((r) => r.score !== null);
    return {
      id: d, dept: d, people: inDept.length, goals: inDept.reduce((n, r) => n + r.list.filter((g) => g.status !== 'Rejected').length, 0),
      progress: active.length ? Math.round(avg(active.map((r) => r.progress))) : null,
      score: rated.length ? avg(rated.map((r) => r.score)) : null,
      completed: inDept.filter((r) => ['Evaluated', 'Finalized', 'Acknowledged'].includes(r.plan.stage)).length,
    };
  });

  const exportCsv = () => {
    downloadCsv([
      ['Employee', 'Title', 'Department', 'Period', 'Workflow stage', 'Goals', 'Weightage %', 'Progress %', 'Manager score', 'Final score', 'Rating'],
      ...filtered.map((r) => [r.user.n, r.user.t, r.dept, period, r.phase.phase, r.list.filter((g) => g.status !== 'Rejected').length, r.weight, r.progress,
        r.managerScore?.toFixed(2) ?? '', r.score?.toFixed(2) ?? '', r.score !== null ? ratingLabel(r.score) : '']),
    ], `performance-${period.replace(/\s+/g, '-').toLowerCase()}.csv`);
    notify('Performance report downloaded.');
  };

  const employeeColumns = [
    {
      key: 'user', label: 'Employee', primary: true, sortValue: (r) => r.user.n,
      render: (r) => (
        <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
          <UserAvatar name={r.user.n} size={32} />
          <Box minWidth={0}><Typography variant="subtitle2" sx={text.ellipsis}>{r.user.n}</Typography><Typography variant="caption" color="text.secondary">{r.user.t}</Typography></Box>
        </Box>
      ),
    },
    { key: 'dept', label: 'Department', sortValue: (r) => r.dept, render: (r) => r.dept },
    { key: 'phase', label: 'Stage', sortValue: (r) => r.phase.step, render: (r) => <Pill tone={r.phase.tone} dot>{r.phase.phase}</Pill> },
    { key: 'weight', label: 'Weightage', sortValue: (r) => r.weight, render: (r) => `${r.weight}%` },
    {
      key: 'progress', label: 'Progress', sortValue: (r) => r.progress,
      render: (r) => (r.list.some(isActive) ? <Box sx={s.miniProgress}><LinearProgress variant="determinate" value={r.progress} sx={s.progressBar(progressTone(r.progress))} /><Typography variant="caption" fontWeight={700}>{r.progress}%</Typography></Box> : '—'),
    },
    { key: 'mgr', label: 'Manager score', sortValue: (r) => r.managerScore ?? -1, render: (r) => (r.managerScore !== null ? r.managerScore.toFixed(2) : '—') },
    { key: 'final', label: 'Final', sortValue: (r) => r.score ?? -1, render: (r) => (r.score !== null ? <ScoreBadge value={r.score} suffix=" / 5" /> : '—') },
    { key: 'open', label: '', align: 'right', render: (r) => <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate(`/goals/${r.id}?period=${encodeURIComponent(period)}`)}>Open</Button> },
  ];

  const deptColumns = [
    { key: 'dept', label: 'Department', primary: true, sortValue: (d) => d.dept, render: (d) => <Typography variant="subtitle2">{d.dept}</Typography> },
    { key: 'people', label: 'Employees', sortValue: (d) => d.people, render: (d) => d.people },
    { key: 'goals', label: 'Goals', sortValue: (d) => d.goals, render: (d) => d.goals },
    {
      key: 'progress', label: 'Avg progress', sortValue: (d) => d.progress ?? -1,
      render: (d) => (d.progress !== null ? <Box sx={s.miniProgress}><LinearProgress variant="determinate" value={d.progress} sx={s.progressBar(progressTone(d.progress))} /><Typography variant="caption" fontWeight={700}>{d.progress}%</Typography></Box> : '—'),
    },
    { key: 'completed', label: 'Evaluated', sortValue: (d) => d.completed, render: (d) => `${d.completed} / ${d.people}` },
    { key: 'score', label: 'Avg rating', sortValue: (d) => d.score ?? -1, render: (d) => (d.score !== null ? <ScoreBadge value={d.score} suffix=" / 5" /> : '—') },
  ];

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="HR / Admin" title="Performance review"
        description="Monitor goals and appraisals across every department, review manager assessments and generate performance reports."
        actions={<Button variant="outlined" startIcon={<Download size={16} />} onClick={exportCsv}>Export report</Button>} />

      <Box sx={page.stack}>
        <FilterChips label="Review period" value={period} onChange={setPeriod} options={GOAL_PERIODS} />

        {!hrReview && (
          <Alert severity="info" action={<Button component={RouterLink} to="/settings" size="small" color="inherit">Settings</Button>}>
            HR final review is <b>off</b> for this company — manager evaluations are final. You can still monitor progress and export reports.
          </Alert>
        )}

        <Box sx={grid.kpis}>
          <StatCard label="Employees" value={rows.length} icon={Users} tone="primary" footer={`${departments.length} departments`} />
          <StatCard label="Goals approved" value={rows.reduce((n, r) => n + r.list.filter(isActive).length, 0)} icon={Target} tone="info"
            footer={`${goals.filter((g) => g.period === period && g.status === 'Pending Approval').length} awaiting manager approval`} />
          <StatCard label={hrReview ? 'Awaiting HR review' : 'Evaluations done'} value={hrReview ? queue.length : evaluated.length} icon={BadgeCheck}
            tone={hrReview && queue.length ? 'warning' : 'success'} footer={hrReview ? `${evaluated.length} evaluated by managers` : `of ${rows.length} employees`} />
          <StatCard label="Average final rating" value={scored.length ? f1(avg(scored.map((r) => r.score))) : '—'} scale="/ 5" icon={Star} tone="success"
            footer={scored.length ? ratingLabel(avg(scored.map((r) => r.score))) : 'No final ratings yet'} />
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={s.tabs}>
          {hrReview && <Tab value="queue" label={`Final review (${queue.length})`} />}
          <Tab value="employees" label="Employee performance" />
          <Tab value="departments" label="Department performance" />
          <Tab value="cycles" label="Review cycles" />
        </Tabs>

        {tab === 'queue' && hrReview && (
          <SectionCard title="Final review & approval" subtitle="Manager assessments waiting for HR. Confirm the score, calibrate it with a reason, or return it." icon={BadgeCheck}>
            {queue.length ? (
              <Box sx={card.body}>
                {queue.map((r) => (
                  <Box key={r.id} sx={[card.listItem, s.queueItem]}>
                    <UserAvatar name={r.user.n} size={36} />
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle2">{r.user.n} · {r.dept}</Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        Manager score {r.managerScore?.toFixed(2)} ({ratingLabel(r.managerScore)}) · evaluated {formatDate(r.plan.evaluatedAt)}
                      </Typography>
                      {r.plan.managerSummary && <Typography variant="body2" color="text.secondary" sx={s.wrap}>{r.plan.managerSummary}</Typography>}
                    </Box>
                    <Box sx={s.queueActions}>
                      <Button size="small" onClick={() => navigate(`/goals/${r.id}?period=${encodeURIComponent(period)}`)}>View</Button>
                      <Button size="small" variant="outlined" color="warning" startIcon={<RotateCcw size={14} />} onClick={() => setReturning(r)}>Return</Button>
                      <Button size="small" variant="contained" startIcon={<BadgeCheck size={14} />} onClick={() => setFinalizing(r)}>Finalize</Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : <EmptyState icon={BadgeCheck} title="Nothing to finalize" description="Completed manager evaluations will appear here." />}
          </SectionCard>
        )}

        {tab === 'employees' && (
          <SectionCard title="Employee performance overview" subtitle={`${period} · all employees`} icon={Users}
            action={(
              <TextField select size="small" label="Department" value={dept} onChange={(e) => setDept(e.target.value)} sx={s.ownerSelect}>
                <MenuItem value="all">All departments</MenuItem>
                {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            )}>
            <ResponsiveTable columns={employeeColumns} rows={filtered} pageSize={10} defaultSort={{ key: 'dept', dir: 'asc' }} />
          </SectionCard>
        )}

        {tab === 'departments' && (
          <SectionCard title="Department performance" subtitle={`${period} · averages across each department`} icon={Building2}>
            <ResponsiveTable columns={deptColumns} rows={deptStats} defaultSort={{ key: 'dept', dir: 'asc' }} />
          </SectionCard>
        )}

        {tab === 'cycles' && (
          <SectionCard title="Review cycle management" subtitle="Review periods and how far each one has progressed." icon={CalendarRange}>
            <Box sx={s.list}>
              {GOAL_PERIODS.map((p) => {
                const plans = goalPlans.filter((x) => x.period === p);
                const closed = plans.filter((x) => x.stage === 'Acknowledged').length;
                const withGoals = new Set(goals.filter((g) => g.period === p).map((g) => g.u)).size;
                return (
                  <Box key={p} sx={s.pastRow}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle1">{p}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(GOAL_PERIOD_RANGES[p].start)} – {formatDate(GOAL_PERIOD_RANGES[p].end)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{withGoals} with goals · {closed} closed</Typography>
                    <Pill tone={p === period ? 'primary' : closed && closed === withGoals ? 'success' : 'neutral'}>{p === period ? 'Viewing' : closed && closed === withGoals ? 'Closed' : 'Open'}</Pill>
                    <Button size="small" variant="outlined" onClick={() => setPeriod(p)}>View</Button>
                  </Box>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              HR final review: <b>{hrReview ? 'On' : 'Off'}</b> — change it in Settings → Review workflow.
            </Typography>
          </SectionCard>
        )}
      </Box>

      {finalizing && <FinalizeDialog open plan={finalizing.plan} ownerName={finalizing.user.n} onClose={() => setFinalizing(null)} />}
      {returning && (
        <NoteDialog open onClose={() => setReturning(null)} title="Return to manager" subtitle={`${returning.user.n} · ${period}`}
          info="The manager re-evaluates the goals; the employee's self assessment is kept." label="What should the manager revisit?" minLength={5}
          confirmLabel="Return" confirmColor="warning"
          onSubmit={async (t) => { await planMutation.mutateAsync({ u: returning.id, period, action: 'hrReturn', payload: { note: t } }); notify('Returned to the manager.'); }} />
      )}
    </Box>
  );
}
