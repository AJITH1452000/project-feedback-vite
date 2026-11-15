import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import {
  ArrowLeft, BadgeCheck, CheckCircle2, CircleAlert, ClipboardList, Gauge, GitPullRequestArrow, ListChecks, MessageSquarePlus,
  Pencil, Plus, RotateCcw, Scale, Send, Star, Target, Trash2, TrendingUp, Undo2, XCircle,
} from 'lucide-react';
import FinalizeDialog from '../../components/goals/FinalizeDialog.jsx';
import GoalCard from '../../components/goals/GoalCard.jsx';
import GoalDialog from '../../components/goals/GoalDialog.jsx';
import HistoryList from '../../components/goals/HistoryList.jsx';
import NoteDialog from '../../components/goals/NoteDialog.jsx';
import ProgressDialog from '../../components/goals/ProgressDialog.jsx';
import RatingDialog from '../../components/goals/RatingDialog.jsx';
import { EmptyState, FilterChips, PageHeader, Pill, ScoreBadge, SectionCard, StatCard, UserAvatar } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDeleteGoal, useGoalAction, useGoalPlanAction } from '../../hooks/queries/goals.js';
import { useGoalData } from '../../hooks/queries/workspace.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GOAL_PERIODS, GOAL_RULES } from '../../data/constants.js';
import {
  EMPLOYEE_DELETABLE, EMPLOYEE_EDITABLE, countsTowardWeight, effectiveScore, getPlan, goalsFor, isActive, periodRangeText,
  planChecks, planHistory, planPhase, planReady, planSteps, selfAssessmentBlocker, totalWeight, weightedProgress, weightedScore,
} from '../../data/goals.js';
import { findUser, formatDate, ratingLabel } from '../../data/selectors.js';
import { grid, page, text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';
import usePeriod from './usePeriod.js';

const EVAL_STAGES = ['Self-assessed', 'Evaluated', 'Finalized', 'Acknowledged'];

function guidance(phase, viewer, name, hrReview) {
  const text = {
    employee: {
      'Goal setting': `Create your goals, then submit them for approval. Total weightage must equal ${GOAL_RULES.totalWeight}%.`,
      'Manager approval': 'Waiting for your manager to approve submitted goals or change requests. You can keep updating progress on approved goals.',
      'Progress & self assessment': 'Update progress and add evidence as you go. When the period ends, submit your self assessment.',
      'Manager evaluation': 'Self assessment submitted. Your manager is evaluating your goals.',
      'HR final review': 'Your manager has completed the evaluation. HR is doing the final review.',
      Acknowledge: 'Your appraisal is ready. Review the ratings and feedback, then acknowledge.',
      Closed: 'This review cycle is closed.',
    },
    manager: {
      'Goal setting': `${name} is still setting goals. Nothing to approve yet.`,
      'Manager approval': `Review each submitted goal: approve it, request changes or reject it with a comment.`,
      'Progress & self assessment': `Goals are active. Follow ${name}'s progress and share feedback; ${name} submits a self assessment at the end of the period.`,
      'Manager evaluation': `${name} submitted a self assessment. Rate each goal, add feedback and improvement suggestions.`,
      'HR final review': 'Evaluation completed and sent to HR for final review.',
      Acknowledge: `Appraisal ${hrReview ? 'finalized by HR' : 'completed'}. Waiting for ${name} to acknowledge.`,
      Closed: 'This review cycle is closed.',
    },
    hr: {
      'Goal setting': `${name} is setting goals.`, 'Manager approval': 'Goals are waiting for manager approval.',
      'Progress & self assessment': 'Goals are active and being tracked.', 'Manager evaluation': 'Waiting for the manager evaluation.',
      'HR final review': 'Review the manager assessment, then finalize or return it.', Acknowledge: 'Finalized. Waiting for the employee to acknowledge.',
      Closed: 'This review cycle is closed.',
    },
  };
  return text[viewer][phase];
}

export default function GoalPlan({ userId }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewer = user.role; // employee | manager | hr
  const { users, people, goals, goalPlans, settings } = useGoalData();
  const goalMutation = useGoalAction();
  const planMutation = useGoalPlanAction();
  const deleteMutation = useDeleteGoal();
  const { notify } = useToast();
  const [period, setPeriod] = usePeriod();
  const [tab, setTab] = useState('goals');

  const [goalDialog, setGoalDialog] = useState(null); // { mode, goal }
  const [progress, setProgress] = useState(null); // { goal, mode }
  const [rating, setRating] = useState(false);
  const [note, setNote] = useState(null); // { kind, goal }
  const [finalize, setFinalize] = useState(false);

  const hrReview = Boolean(settings?.hrReview);
  const member = findUser(users, userId);
  const firstName = member.n.split(' ')[0];
  const plan = getPlan(goalPlans, userId, period);
  const list = useMemo(() => goalsFor(goals, userId, period), [goals, userId, period]);
  const phase = planPhase(plan, list, hrReview);
  const steps = planSteps(hrReview);
  const checks = planChecks(list, period);
  const ready = planReady(list, period);
  const settingOpen = plan.stage === 'Goal setting';
  const counted = list.filter(countsTowardWeight);
  const drafts = list.filter((g) => EMPLOYEE_EDITABLE.includes(g.status));
  const pending = list.filter((g) => g.status === 'Pending Approval');
  const blocker = selfAssessmentBlocker(list);
  const score = effectiveScore(plan, hrReview);
  const pastPlans = goalPlans.filter((p) => p.u === userId && p.period !== period && EVAL_STAGES.includes(p.stage));
  const history = useMemo(() => planHistory(plan, list), [plan, list]);

  /* Mutations: mutateAsync for dialogs (they show the error), mutate + toast for one-click buttons. */
  const goalAction = (id, action, payload) => goalMutation.mutateAsync({ id, action, payload });
  const goalPlanAction = (action, payload) => planMutation.mutateAsync({ u: userId, period, action, payload });
  const removeGoal = (id) => deleteMutation.mutateAsync(id);
  const toastOnly = (message) => ({ onSuccess: () => notify(message), onError: (err) => notify(err.message, 'error') });
  const quickGoal = (id, action, message) => goalMutation.mutate({ id, action }, toastOnly(message));
  const quickPlan = (action, message) => planMutation.mutate({ u: userId, period, action }, toastOnly(message));
  // Spinner/disabled state for the exact button whose mutation is in flight.
  const goalBusy = (id, action) => goalMutation.isPending && goalMutation.variables?.id === id && goalMutation.variables?.action === action;
  const planBusy = (action) => planMutation.isPending && planMutation.variables?.action === action;

  /* ------------------------------ Top actions ----------------------------- */
  const top = [];
  if (viewer === 'employee' && settingOpen) {
    top.push(<Button key="add" variant="outlined" startIcon={<Plus size={16} />} disabled={counted.length >= GOAL_RULES.maxGoals} onClick={() => setGoalDialog({ mode: 'create' })}>Add new goal</Button>);
    if (drafts.length) {
      top.push(<Button key="submitAll" variant="contained" startIcon={<Send size={16} />} disabled={!ready || planBusy('submitAll')}
        onClick={() => quickPlan('submitAll', 'Goals submitted for manager approval.')}>
        Submit {drafts.length} goal{drafts.length === 1 ? '' : 's'} for approval
      </Button>);
    }
    if (phase.phase === 'Progress & self assessment') {
      top.push(<Button key="self" variant="contained" startIcon={<Star size={16} />} disabled={Boolean(blocker)} onClick={() => setRating(true)}>Start self assessment</Button>);
    }
  }
  if (viewer === 'employee' && phase.phase === 'Acknowledge') {
    top.push(<Button key="ack" variant="contained" startIcon={<CheckCircle2 size={16} />} onClick={() => setNote({ kind: 'acknowledge' })}>Acknowledge appraisal</Button>);
  }
  if (viewer === 'manager' && settingOpen && pending.length) {
    top.push(<Button key="approveAll" variant="contained" startIcon={<CheckCircle2 size={16} />} disabled={planBusy('approveAll')}
      onClick={() => quickPlan('approveAll', `Approved ${pending.length} goal(s).`)}>
      Approve all {pending.length} pending
    </Button>);
  }
  if (viewer === 'manager' && plan.stage === 'Self-assessed') {
    top.push(<Button key="eval" variant="contained" startIcon={<Star size={16} />} onClick={() => setRating(true)}>Evaluate performance</Button>);
  }
  if (viewer === 'hr' && hrReview && plan.stage === 'Evaluated') {
    top.push(<Button key="ret" variant="outlined" color="warning" startIcon={<RotateCcw size={16} />} onClick={() => setNote({ kind: 'hrReturn' })}>Return to manager</Button>);
    top.push(<Button key="fin" variant="contained" startIcon={<BadgeCheck size={16} />} onClick={() => setFinalize(true)}>Finalize appraisal</Button>);
  }

  /* ------------------------------ Goal actions ---------------------------- */
  function goalActions(g) {
    if (!settingOpen) return null;
    const b = (key, label, Icon, onClick, props = {}) => (
      <Button key={key} size="small" variant="outlined" startIcon={<Icon size={15} />} onClick={onClick} disabled={goalBusy(g.id, key)} {...props}>{label}</Button>
    );
    const out = [];
    if (viewer === 'employee') {
      if (EMPLOYEE_DELETABLE.includes(g.status)) out.push(b('del', 'Delete', Trash2, () => setNote({ kind: 'delete', goal: g }), { color: 'error', variant: 'text' }));
      if (EMPLOYEE_EDITABLE.includes(g.status)) {
        out.push(b('edit', 'Edit', Pencil, () => setGoalDialog({ mode: 'edit', goal: g })));
        out.push(b('submit', 'Submit', Send, () => quickGoal(g.id, 'submit', 'Goal submitted for approval.'), { variant: 'contained', disabled: !ready || goalBusy(g.id, 'submit') }));
      }
      if (g.status === 'Pending Approval') out.push(b('withdraw', 'Withdraw', Undo2, () => quickGoal(g.id, 'withdraw', 'Goal moved back to draft.')));
      if (isActive(g)) {
        out.push(g.change
          ? b('cancelChange', 'Cancel change request', XCircle, () => quickGoal(g.id, 'cancelChange', 'Change request withdrawn.'), { variant: 'text' })
          : b('change', 'Request change', GitPullRequestArrow, () => setGoalDialog({ mode: 'change', goal: g })));
        out.push(b('progress', 'Update progress', Gauge, () => setProgress({ goal: g, mode: 'progress' }), { variant: 'contained' }));
      }
    }
    if (viewer === 'manager') {
      if (g.status === 'Pending Approval') {
        out.push(b('reject', 'Reject', XCircle, () => setNote({ kind: 'reject', goal: g }), { color: 'error', variant: 'text' }));
        out.push(b('changes', 'Request changes', RotateCcw, () => setNote({ kind: 'requestChanges', goal: g }), { color: 'secondary' }));
        out.push(b('approve', 'Approve', CheckCircle2, () => setNote({ kind: 'approve', goal: g }), { variant: 'contained' }));
      }
      if (g.change) {
        out.push(b('decline', 'Decline change', XCircle, () => setNote({ kind: 'declineChange', goal: g }), { color: 'error', variant: 'text' }));
        out.push(b('approveChange', 'Approve change', CheckCircle2, () => setNote({ kind: 'approveChange', goal: g }), { variant: 'contained' }));
      }
      if (isActive(g)) out.push(b('feedback', 'Feedback', MessageSquarePlus, () => setProgress({ goal: g, mode: 'feedback' })));
    }
    return out;
  }

  /* --------------------------- Note dialog config ------------------------- */
  const NOTE = {
    approve: { title: 'Approve goal', label: 'Comment (optional)', confirm: 'Approve', run: (t) => goalAction(note.goal.id, 'approve', { note: t }), done: 'Goal approved — it is now active.' },
    requestChanges: { title: 'Request changes', label: 'What should change?', min: 5, confirm: 'Send back', color: 'secondary', info: `${firstName} can edit the goal and resubmit it.`, run: (t) => goalAction(note.goal.id, 'requestChanges', { note: t }), done: 'Changes requested.' },
    reject: { title: 'Reject goal', label: 'Reason for rejecting', min: 5, confirm: 'Reject goal', color: 'error', info: 'Rejected goals are excluded from the weightage. The employee can add a replacement goal.', run: (t) => goalAction(note.goal.id, 'reject', { note: t }), done: 'Goal rejected.' },
    approveChange: { title: 'Approve change request', label: 'Comment (optional)', confirm: 'Approve change', run: (t) => goalAction(note.goal.id, 'approveChange', { note: t }), done: 'Change approved and applied.' },
    declineChange: { title: 'Decline change request', label: 'Reason', min: 5, confirm: 'Decline', color: 'error', info: 'The goal stays as originally approved.', run: (t) => goalAction(note.goal.id, 'declineChange', { note: t }), done: 'Change request declined.' },
    delete: { title: 'Delete goal?', confirm: 'Delete', color: 'error', info: 'This removes the goal from your plan. The deletion is kept in the activity history.', run: () => removeGoal(note.goal.id), done: 'Goal deleted.' },
    acknowledge: { title: 'Acknowledge appraisal', label: 'Comment (optional)', confirm: 'Acknowledge', info: 'Acknowledging confirms you have seen your ratings and feedback. Add a comment if you want it on record.', run: (t) => goalPlanAction('acknowledge', { comment: t }), done: 'Appraisal acknowledged. Review cycle closed.' },
    hrReturn: { title: 'Return to manager', label: 'What should the manager revisit?', min: 5, confirm: 'Return', color: 'warning', run: (t) => goalPlanAction('hrReturn', { note: t }), done: 'Returned to the manager for re-evaluation.' },
  };
  const cfg = note ? NOTE[note.kind] : null;

  const showSelf = EVAL_STAGES.includes(plan.stage);
  const showManager = viewer !== 'employee' ? ['Evaluated', 'Finalized', 'Acknowledged'].includes(plan.stage) : score !== null;

  return (
    <Box sx={page.root}>
      {viewer !== 'employee' && (
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(viewer === 'hr' ? '/hr-review' : `/goals?period=${encodeURIComponent(period)}`)} sx={s.back}>
          {viewer === 'hr' ? 'Performance review' : 'Team goals'}
        </Button>
      )}
      <PageHeader
        eyebrow={`Performance management · ${period}`}
        title={viewer === 'employee' ? 'My goals' : `${member.n} · goals`}
        description={viewer === 'employee' ? `Review period ${periodRangeText(period)}` : `${member.t} · ${member.dept || '—'} · reports to ${findUser(people, member.managerId).n}`}
        actions={viewer !== 'employee' && <UserAvatar name={member.n} size={52} />}
      />

      <Box sx={page.stack}>
        <FilterChips label="Review period" value={period} onChange={setPeriod} options={GOAL_PERIODS} />

        <SectionCard title="Workflow status" subtitle={guidance(phase.phase, viewer, firstName, hrReview)} icon={ClipboardList}
          action={<Pill tone={phase.tone} dot>{phase.phase}</Pill>}>
          <Stepper activeStep={phase.step} alternativeLabel={!compact} orientation={compact ? 'vertical' : 'horizontal'} sx={s.stepper}>
            {steps.map((label, i) => <Step key={label} completed={phase.step > i}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          {plan.hrNote && plan.stage === 'Self-assessed' && viewer !== 'employee' && <Alert severity="warning" sx={{ mt: 2 }}><b>Returned by HR:</b> {plan.hrNote}</Alert>}
          {top.length > 0 && (
            <Box sx={s.stageActions}>
              {viewer === 'employee' && phase.phase === 'Progress & self assessment' && blocker && (
                <Typography variant="caption" color="text.secondary" mr="auto">{blocker}</Typography>
              )}
              {viewer === 'employee' && drafts.length > 0 && !ready && (
                <Typography variant="caption" color="text.secondary" mr="auto">Complete the checklist to submit.</Typography>
              )}
              {top}
            </Box>
          )}
        </SectionCard>

        <Box sx={grid.kpis}>
          <StatCard label="Total weightage" value={`${totalWeight(list)}%`} scale="/ 100%" icon={Scale} tone={totalWeight(list) === 100 ? 'success' : 'warning'} footer={`${counted.length} goal${counted.length === 1 ? '' : 's'} (excl. rejected)`} />
          <StatCard label="Approved goals" value={counted.filter(isActive).length} scale={`/ ${counted.length}`} icon={Target} tone="primary" footer={pending.length ? `${pending.length} awaiting approval` : 'None waiting'} />
          <StatCard label="Weighted progress" value={`${weightedProgress(list)}%`} icon={TrendingUp} tone="info" footer={`${list.filter((g) => g.status === 'Completed').length} completed`} />
          <StatCard label={score !== null ? 'Final rating' : 'Self score'} value={score !== null ? score.toFixed(2) : showSelf && weightedScore(list, 'selfRating') ? weightedScore(list, 'selfRating').toFixed(2) : '—'}
            scale="/ 5" icon={Star} tone="success" footer={score !== null ? ratingLabel(score) : 'After evaluation'} />
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={s.tabs}>
          <Tab value="goals" label={`Goals (${list.length})`} />
          <Tab value="history" label="Activity history" />
          <Tab value="past" label={`Past reviews (${pastPlans.length})`} />
        </Tabs>

        {tab === 'goals' && (
          <Box sx={grid.mainAside}>
            <SectionCard title="Goals" subtitle={`${period} · ${totalWeight(list)}% weighted`} icon={Target}>
              {list.length ? (
                <Box sx={s.list}>
                  {list.map((g) => <GoalCard key={g.id} goal={g} actions={goalActions(g)} showSelf={showSelf} showManager={showManager} />)}
                </Box>
              ) : (
                <EmptyState icon={Target} title={`No goals for ${period}`}
                  description={viewer === 'employee' ? `Goal setting starts with you. Add goals until the total weightage reaches ${GOAL_RULES.totalWeight}%.` : `${firstName} has not created any goals yet.`}
                  action={viewer === 'employee' && settingOpen && <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setGoalDialog({ mode: 'create' })}>Add first goal</Button>} />
              )}
            </SectionCard>

            <Box sx={page.stack}>
              {settingOpen && (phase.phase === 'Goal setting' || drafts.length > 0) && (
                <SectionCard title="Submission checklist" subtitle="Required before goals can be submitted." icon={ListChecks}>
                  <Box component="ul" sx={s.checks}>
                    {checks.map((c) => (
                      <Box component="li" key={c.id} sx={s.check(c.ok)}>
                        {c.ok ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" color="text.primary">{c.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.detail}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </SectionCard>
              )}

              <SectionCard title="Appraisal" subtitle="Self assessment, manager evaluation and final result." icon={Star}>
                {showSelf || score !== null ? (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Box sx={s.summaryGrid}>
                      <Box sx={s.metaCell}><Typography variant="caption" color="text.secondary" component="div">Self score</Typography><Typography variant="h3" component="div">{weightedScore(list, 'selfRating')?.toFixed(2) || '—'}</Typography></Box>
                      <Box sx={s.metaCell}>
                        <Typography variant="caption" color="text.secondary" component="div">{hrReview ? 'Manager score' : 'Final score'}</Typography>
                        <Typography variant="h3" component="div">{showManager && typeof plan.managerScore === 'number' ? plan.managerScore.toFixed(2) : '—'}</Typography>
                      </Box>
                    </Box>
                    {score !== null && (
                      <Box sx={s.scorePreview}>
                        <Typography variant="subtitle2">Final rating</Typography>
                        <Box display="flex" gap={1} alignItems="center"><ScoreBadge value={score} suffix=" / 5" /><Typography variant="caption" color="text.secondary">{ratingLabel(score)}</Typography></Box>
                      </Box>
                    )}
                    {plan.selfSummary && <Box><Typography variant="subtitle2">Self assessment</Typography><Typography variant="body2" sx={text.quote}>{plan.selfSummary}</Typography></Box>}
                    {showManager && plan.managerSummary && <Box><Typography variant="subtitle2">Manager feedback</Typography><Typography variant="body2" sx={text.quote}>{plan.managerSummary}</Typography></Box>}
                    {showManager && plan.managerImprovement && <Box><Typography variant="subtitle2">Improvement suggestions</Typography><Typography variant="body2" sx={text.quote}>{plan.managerImprovement}</Typography></Box>}
                    {plan.hrNote && ['Finalized', 'Acknowledged'].includes(plan.stage) && <Alert severity="info"><b>HR note:</b> {plan.hrNote}</Alert>}
                    {plan.stage === 'Acknowledged' && <Alert severity="success">Acknowledged {formatDate(plan.ackAt)}{plan.ackComment ? ` — “${plan.ackComment}”` : ''}</Alert>}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Opens once all goals are approved and the period's work is done. The final score is the weighted average of the manager's ratings{hrReview ? ', confirmed by HR' : ''}.
                  </Typography>
                )}
              </SectionCard>
            </Box>
          </Box>
        )}

        {tab === 'history' && (
          <SectionCard title="Activity history" subtitle="Every goal change, approval, progress update and piece of feedback." icon={ClipboardList}>
            <HistoryList entries={history} emptyText="Actions on this plan will be recorded here." />
          </SectionCard>
        )}

        {tab === 'past' && (
          <SectionCard title="Performance review history" subtitle="Completed review cycles." icon={Star}>
            {pastPlans.length ? (
              <Box sx={s.list}>
                {pastPlans.map((p) => {
                  const ps = effectiveScore(p, hrReview);
                  return (
                    <Box key={p.id} sx={s.pastRow}>
                      <Box minWidth={0} flex={1}>
                        <Typography variant="subtitle1">{p.period}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.stage === 'Acknowledged' ? `Closed ${formatDate(p.ackAt)}` : p.stage} · {goalsFor(goals, userId, p.period).length} goals</Typography>
                        {p.managerSummary && <Typography variant="body2" color="text.secondary" mt={0.5}>{p.managerSummary}</Typography>}
                      </Box>
                      {ps !== null ? <ScoreBadge value={ps} suffix=" / 5" /> : <Pill tone="neutral">In review</Pill>}
                      <Button size="small" variant="outlined" onClick={() => { setPeriod(p.period); setTab('goals'); }}>Open</Button>
                    </Box>
                  );
                })}
              </Box>
            ) : <EmptyState icon={Star} title="No past reviews" description="Completed review cycles will be listed here." />}
          </SectionCard>
        )}
      </Box>

      {goalDialog && (
        <GoalDialog open mode={goalDialog.mode} goal={goalDialog.goal} userId={userId} period={period} onClose={() => setGoalDialog(null)} />
      )}
      <ProgressDialog open={Boolean(progress)} goal={progress ? list.find((g) => g.id === progress.goal.id) : null} mode={progress?.mode} onClose={() => setProgress(null)} />
      <RatingDialog open={rating} onClose={() => setRating(false)} mode={viewer === 'manager' ? 'manager' : 'self'} plan={plan} goals={list} ownerName={member.n} hrReview={hrReview} />
      <FinalizeDialog open={finalize} onClose={() => setFinalize(false)} plan={plan} ownerName={member.n} />
      {cfg && (
        <NoteDialog
          open
          onClose={() => setNote(null)}
          title={cfg.title}
          subtitle={note.goal ? note.goal.title : `${member.n} · ${period}`}
          info={cfg.info}
          label={cfg.label}
          minLength={cfg.min || 0}
          confirmLabel={cfg.confirm}
          confirmColor={cfg.color || 'primary'}
          onSubmit={async (t) => { await cfg.run(t); notify(cfg.done); }}
        />
      )}
    </Box>
  );
}
