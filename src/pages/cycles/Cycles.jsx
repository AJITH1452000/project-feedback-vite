/**
 * HR / Admin — Appraisal cycles.
 * Shows the overall process flow, who is responsible for each stage, and lets HR
 * initiate, configure, publish and close appraisal cycles.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { ArrowRight, BellRing, CalendarRange, Lock, Pencil, Plus, Rocket, Trash2, Users, Workflow } from 'lucide-react';
import CycleDialog from '../../components/cycles/CycleDialog.jsx';
import NoteDialog from '../../components/goals/NoteDialog.jsx';
import ResponsiveTable from '../../components/common/ResponsiveTable.jsx';
import { EmptyState, PageHeader, Pill, SectionCard } from '../../components/common/index.jsx';
import { useCycleAction, useDeleteCycle, useRemindCycle } from '../../hooks/queries/cycles.js';
import { useGoalData } from '../../hooks/queries/workspace.js';
import { useToast } from '../../context/ToastContext.jsx';
import { APPRAISAL_FLOW, CYCLE_TONE, defaultCycle, isEligible, reminderFor } from '../../data/cycles.js';
import { getPlan, goalsFor, planPhase } from '../../data/goals.js';
import { formatDate } from '../../data/selectors.js';
import { page } from '../../styles/common.js';
import { cycles as s } from '../../styles/pages.js';

/** Who does what, and what each step produces (process document, section 2). */
const RESPONSIBILITIES = [
  { id: 1, who: 'HR / Admin', what: 'Initiates appraisal cycle', output: 'Appraisal cycle created' },
  { id: 2, who: 'HR / Admin', what: 'Configures goal framework', output: 'Goal form published' },
  { id: 3, who: 'Employee', what: 'Fills goal-setting form', output: 'Goals submitted' },
  { id: 4, who: 'Reporting Manager', what: 'Reviews employee goals', output: 'Goals approved / sent back' },
  { id: 5, who: 'Employee', what: 'Updates achievements and self-rating', output: 'Self-appraisal submitted' },
  { id: 6, who: 'Reporting Manager', what: 'Evaluates employee performance', output: 'Manager appraisal completed' },
  { id: 7, who: 'HR', what: 'Reviews appraisal and ratings', output: 'Final appraisal validated' },
  { id: 8, who: 'Manager', what: 'Conducts feedback discussion', output: 'Feedback shared' },
  { id: 9, who: 'Employee', what: 'Acknowledges the appraisal', output: 'Appraisal completed' },
];

export default function Cycles() {
  const navigate = useNavigate();
  const { cycles, users, people, goals, goalPlans } = useGoalData();
  const action = useCycleAction();
  const remove = useDeleteCycle();
  const remind = useRemindCycle();
  const { notify } = useToast();
  const [editing, setEditing] = useState(null); // { cycle } | { cycle: null } for new
  const [confirm, setConfirm] = useState(null); // { kind, cycle }

  const departments = useMemo(() => [...new Set((people.length ? people : users).map((u) => u.dept).filter(Boolean))], [people, users]);

  /** Per cycle: eligible employees and how many sit at each process step. */
  const stats = useMemo(() => Object.fromEntries(cycles.map((c) => {
    const eligible = users.filter((u) => isEligible(c, u));
    const steps = APPRAISAL_FLOW.map(() => 0);
    let completed = 0;
    let toRemind = 0;
    eligible.forEach((u) => {
      const phase = planPhase(getPlan(goalPlans, u.id, c.period), goalsFor(goals, u.id, c.period));
      if (reminderFor(phase.status, c)) toRemind += 1;
      if (phase.status === 'Completed') completed += 1;
      else if (phase.step < steps.length) steps[phase.step] += 1;
    });
    return [c.id, { eligible: eligible.length, steps, completed, toRemind }];
  })), [cycles, users, goals, goalPlans]);

  const current = defaultCycle(cycles);
  const currentStats = current ? stats[current.id] : null;

  const run = (cycle, kind, message) => action.mutateAsync({ id: cycle.id, action: kind }).then(() => notify(message));
  const CONFIRM = {
    publish: { title: 'Publish appraisal cycle', confirm: 'Publish', info: (c) => `Goal setting opens for ${stats[c.id]?.eligible ?? 0} eligible employee(s), who are notified now. Categories, weightage rules and the rating scale lock after publishing.`, run: (c) => run(c, 'publish', `${c.period} is open — employees can set goals.`) },
    close: { title: 'Close appraisal cycle', confirm: 'Close cycle', color: 'warning', info: (c) => `${c.period} becomes read-only. ${stats[c.id] ? `${stats[c.id].eligible - stats[c.id].completed} appraisal(s) are not completed yet.` : ''}`, run: (c) => run(c, 'close', `${c.period} is closed.`) },
    remind: {
      title: 'Send reminder', confirm: 'Send reminder',
      info: (c) => `Notifies the ${stats[c.id]?.toRemind ?? 0} employee(s) in ${c.period} who still have a step to do — setting goals, updating progress, submitting the self-appraisal or acknowledging. Each gets a message for their own step with a link to the form.`,
      run: (c) => remind.mutateAsync(c.id).then((r) => notify(r.sent ? `Reminder sent to ${r.sent} employee${r.sent === 1 ? '' : 's'}.` : 'Nobody has a pending step right now.')),
    },
    delete: { title: 'Delete draft cycle', confirm: 'Delete', color: 'error', info: () => 'This draft has not been published, so no one has seen it.', run: (c) => remove.mutateAsync(c.id).then(() => notify('Draft deleted.')) },
  };
  const cfg = confirm ? CONFIRM[confirm.kind] : null;

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="HR / Admin" title="Appraisal cycles"
        description="Initiate the appraisal cycle, configure the goal-setting framework and follow every appraisal from goal setting to closure."
        actions={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setEditing({ cycle: null })}>New appraisal cycle</Button>} />

      <Box sx={page.stack}>
        <SectionCard title="Overall process flow" icon={Workflow}
          subtitle={current ? `Live counts for ${current.period} (${currentStats.eligible} eligible · ${currentStats.completed} completed)` : 'Create a cycle to start the process.'}>
          <Box sx={s.flow}>
            {APPRAISAL_FLOW.map((step, i) => {
              const count = currentStats?.steps[i] ?? 0;
              const done = i < 2 ? current && current.status !== 'Draft' : false;
              return (
                <Box key={step.key} sx={s.flowStep(step.tone, count > 0)}>
                  <Box sx={s.flowNum(step.tone)}>{i + 1}</Box>
                  <Typography variant="overline" sx={s.flowOwner}>{step.owner}</Typography>
                  <Typography variant="subtitle2" sx={s.flowTitle}>{step.title}</Typography>
                  <Typography variant="caption" sx={s.flowDesc}>{step.desc}</Typography>
                  {current && (
                    <Typography variant="caption" sx={s.flowCount(step.tone)}>
                      {i < 2 ? (done ? '✓ Done' : current.status === 'Draft' && i === 0 ? 'Draft — publish to open' : 'Pending') : `${count} employee${count === 1 ? '' : 's'} here`}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </SectionCard>

        <SectionCard title="Appraisal cycles" subtitle="Draft → Open (published) → Closed." icon={CalendarRange}>
          {cycles.length ? (
            <Box sx={s.list}>
              {cycles.map((c) => {
                const st = stats[c.id];
                const pct = st?.eligible ? Math.round((st.completed / st.eligible) * 100) : 0;
                return (
                  <Box key={c.id} sx={s.card}>
                    <Box sx={s.cardHead}>
                      <Box minWidth={0}>
                        <Typography variant="h4">{c.period}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(c.start)} – {formatDate(c.end)} · {c.depts?.length ? c.depts.join(', ') : 'All departments'} · {st?.eligible ?? 0} eligible
                        </Typography>
                      </Box>
                      <Pill tone={CYCLE_TONE[c.status]} dot>{c.status}</Pill>
                    </Box>
                    <Box sx={s.dates}>
                      {[['Goal setting by', c.goalDeadline], ['Self-appraisal opens', c.selfStart], ['Self-appraisal due', c.selfDeadline], ['Cycle ends', c.end]].map(([label, d]) => (
                        <Box key={label} sx={s.dateCell}>
                          <Typography variant="caption" color="text.secondary" component="div">{label}</Typography>
                          <Typography variant="subtitle2">{formatDate(d)}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={s.chips}>
                      {c.framework.categories.map((cat) => <Pill key={cat}>{cat}</Pill>)}
                      <Pill tone="info">{c.framework.minWeight}–{c.framework.maxWeight}% per goal · max {c.framework.maxGoals} goals</Pill>
                    </Box>
                    {c.status !== 'Draft' && (
                      <Box sx={s.progressRow}>
                        <LinearProgress variant="determinate" value={pct} color="success" sx={s.progressBar} />
                        <Typography variant="caption" fontWeight={700}>{st?.completed ?? 0} / {st?.eligible ?? 0} completed</Typography>
                      </Box>
                    )}
                    <Box sx={s.actions}>
                      {c.status === 'Draft' && <Button size="small" color="error" startIcon={<Trash2 size={15} />} onClick={() => setConfirm({ kind: 'delete', cycle: c })}>Delete</Button>}
                      {c.status !== 'Closed' && <Button size="small" variant="outlined" startIcon={<Pencil size={15} />} onClick={() => setEditing({ cycle: c })}>Edit</Button>}
                      {c.status !== 'Draft' && (
                        <Button size="small" variant="outlined" endIcon={<ArrowRight size={15} />} onClick={() => navigate(`/hr-review?period=${encodeURIComponent(c.period)}`)}>Track appraisals</Button>
                      )}
                      {c.status === 'Open' && (
                        <Button size="small" variant="contained" startIcon={<BellRing size={15} />} disabled={!st?.toRemind} onClick={() => setConfirm({ kind: 'remind', cycle: c })}>
                          Send reminder{st?.toRemind ? ` (${st.toRemind})` : ''}
                        </Button>
                      )}
                      {c.status === 'Open' && <Button size="small" variant="outlined" color="warning" startIcon={<Lock size={15} />} onClick={() => setConfirm({ kind: 'close', cycle: c })}>Close cycle</Button>}
                      {c.status === 'Draft' && <Button size="small" variant="contained" startIcon={<Rocket size={15} />} onClick={() => setConfirm({ kind: 'publish', cycle: c })}>Publish</Button>}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <EmptyState icon={CalendarRange} title="No appraisal cycles yet" description="Initiate the first cycle: define the period, timelines, eligible employees and the goal framework."
              action={<Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setEditing({ cycle: null })}>New appraisal cycle</Button>} />
          )}
        </SectionCard>

        <SectionCard title="How it flows between stakeholders" subtitle="Responsibility and output of each step." icon={Users}>
          <ResponsiveTable rows={RESPONSIBILITIES} columns={[
            { key: 'who', label: 'Stakeholder', primary: true, render: (r) => <Typography variant="subtitle2">{r.who}</Typography> },
            { key: 'what', label: 'Responsibility', render: (r) => r.what },
            { key: 'output', label: 'Output', render: (r) => r.output },
          ]} />
        </SectionCard>
      </Box>

      {editing && (
        <CycleDialog open cycle={editing.cycle} existing={cycles} departments={departments} onClose={() => setEditing(null)} />
      )}
      {cfg && (
        <NoteDialog open onClose={() => setConfirm(null)} title={cfg.title} subtitle={confirm.cycle.period}
          info={cfg.info(confirm.cycle)} confirmLabel={cfg.confirm} confirmColor={cfg.color || 'primary'}
          onSubmit={() => cfg.run(confirm.cycle)} />
      )}
    </Box>
  );
}
