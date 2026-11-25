import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { GitPullRequestArrow, Save, Send, Target, X } from 'lucide-react';
import { FilterChips } from '../common/index.jsx';
import { useCreateGoal, useGoalAction, useUpdateGoal } from '../../hooks/queries/goals.js';
import { useGoalData } from '../../hooks/queries/workspace.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GOAL_PRIORITIES } from '../../data/constants.js';
import { frameworkFor, rangeFor, rulesFor } from '../../data/cycles.js';
import { countsTowardWeight, goalProblems, goalsFor, periodRangeText } from '../../data/goals.js';
import { dialog, form as formStyles, grid, text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';

const FIELDS = ['title', 'category', 'desc', 'metric', 'target', 'priority', 'weight', 'start', 'due', 'notes'];
const blank = (period) => {
  const range = rangeFor(period) || {};
  return { title: '', category: frameworkFor(period).categories[0], desc: '', metric: '', target: '', priority: 'Medium', weight: 20, start: range.start || '', due: range.end || '', notes: '' };
};
const LABELS = { title: 'Title', category: 'Category', desc: 'Description', metric: 'KPI', target: 'Target value', priority: 'Priority', weight: 'Weightage', start: 'Start date', due: 'Target date', notes: 'Comments' };

/**
 * Employee goal form.
 * mode "create" | "edit" → Save as draft / Submit for approval
 * mode "change"          → change request on an approved goal (manager must approve)
 */
export default function GoalDialog({ open, onClose, mode = 'create', goal, userId, period }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { goals } = useGoalData();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const goalAction = useGoalAction();
  const { notify } = useToast();
  const [form, setForm] = useState(() => blank(period));
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [button, setButton] = useState(''); // which button started the save: 'draft' | 'submit'
  const range = rangeFor(period) || {};
  const { minWeight, maxWeight, totalWeight: target } = rulesFor(period);
  const isChange = mode === 'change';

  useEffect(() => {
    if (!open) return;
    setForm(goal ? Object.fromEntries(FIELDS.map((k) => [k, goal[k] ?? ''])) : blank(period));
    setReason('');
    setTouched(false);
    setError('');
  }, [open, goal, period]);

  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));
  const others = useMemo(() => goalsFor(goals, userId, period).filter((x) => x.id !== goal?.id && countsTowardWeight(x)), [goals, userId, period, goal]);
  const available = target - others.reduce((sum, x) => sum + x.weight, 0);
  const planTotalWithThis = target - available + (Number(form.weight) || 0);
  const problems = goalProblems({ ...form, period });
  if (!problems.weight && Number(form.weight) > available) problems.weight = `Only ${available}% is left.`;
  const show = (key) => (touched ? problems[key] : '');
  const canSubmit = planTotalWithThis === target;

  async function save(submit) {
    setTouched(true);
    if (Object.keys(problems).length) { setError('Fix the highlighted fields.'); return; }
    if (isChange && reason.trim().length < 5) { setError('Explain why the change is needed (at least 5 characters).'); return; }
    setButton(submit ? 'submit' : 'draft');
    setError('');
    const payload = { ...form, weight: Number(form.weight), period };
    const handlers = (message) => ({ onSuccess: () => { notify(message); onClose(); }, onError: (err) => setError(err.message) });
    if (isChange) {
      goalAction.mutate({ id: goal.id, action: 'requestChange', payload: { fields: payload, reason } }, handlers('Change request sent to your manager.'));
    } else if (goal) {
      updateGoal.mutate({ id: goal.id, changes: { ...payload, submit } }, handlers(submit ? 'Goal submitted for approval.' : 'Draft saved.'));
    } else {
      createGoal.mutate({ ...payload, submit }, handlers(submit ? 'Goal submitted for manager approval.' : 'Goal saved as draft.'));
    }
  }

  const changed = isChange && goal ? FIELDS.filter((k) => String(form[k]) !== String(goal[k] ?? '')) : [];
  const busy = createGoal.isPending || updateGoal.isPending || goalAction.isPending;
  const saving = busy ? button : '';

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby="goal-dialog-title">
      <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); save(true); }}>
        <DialogTitle id="goal-dialog-title" sx={dialog.title} component="div">
          <Box display="flex" gap={1.5} alignItems="center">
            <Box sx={s.dialogIcon}>{isChange ? <GitPullRequestArrow size={20} /> : <Target size={20} />}</Box>
            <Box>
              <Typography variant="h3">{isChange ? 'Request a goal change' : goal ? 'Edit goal' : 'Add new goal'}</Typography>
              <Typography variant="body2" sx={dialog.subtitle}>{period} · {periodRangeText(period)}</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></IconButton>
        </DialogTitle>

        <DialogContent sx={dialog.content}>
          {isChange && <Alert severity="info">This goal is approved. Your changes apply only after your manager approves the request.</Alert>}
          {goal?.status === 'Changes Requested' && goal.reviewNote && <Alert severity="warning"><b>Manager requested changes:</b> {goal.reviewNote}</Alert>}

          <TextField label="Goal title" required autoFocus value={form.title} onChange={(e) => set('title', e.target.value.slice(0, 120))}
            error={Boolean(show('title'))} helperText={show('title')} placeholder="e.g. Automate the release regression suite" fullWidth />
          <Box sx={grid.form2}>
            <TextField select label="Goal category" required value={form.category} onChange={(e) => set('category', e.target.value)} fullWidth>
              {frameworkFor(period).categories.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <Box>
              <Typography variant="caption" sx={text.label}>Priority</Typography>
              <FilterChips label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={GOAL_PRIORITIES} />
            </Box>
          </Box>
          <TextField label="Goal description" multiline minRows={2} value={form.desc} onChange={(e) => set('desc', e.target.value.slice(0, 600))}
            placeholder="What will be done and why it matters for the team or client." fullWidth />
          <Box sx={grid.form2}>
            <TextField label="Success measurement / KPI" required value={form.metric} onChange={(e) => set('metric', e.target.value.slice(0, 160))}
              error={Boolean(show('metric'))} helperText={show('metric') || 'What will be measured'} placeholder="e.g. Regression cases automated" fullWidth />
            <TextField label="Target value" required value={form.target} onChange={(e) => set('target', e.target.value.slice(0, 160))}
              error={Boolean(show('target'))} helperText={show('target') || 'The number or result to reach'} placeholder="e.g. 80%" fullWidth />
          </Box>
          <Box sx={s.formGrid3}>
            <TextField label="Weightage" type="number" required value={form.weight} onChange={(e) => set('weight', e.target.value)} fullWidth
              inputProps={{ min: minWeight, max: maxWeight, step: 5 }} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              error={Boolean(show('weight') || (Number(form.weight) > available))}
              helperText={show('weight') || `${Math.max(0, available)}% available · plan total ${planTotalWithThis}%`} />
            <TextField label="Start date" type="date" required value={form.start} onChange={(e) => set('start', e.target.value)}
              InputLabelProps={{ shrink: true }} inputProps={{ min: range.start, max: range.end }} error={Boolean(show('start'))} helperText={show('start')} fullWidth />
            <TextField label="Target completion date" type="date" required value={form.due} onChange={(e) => set('due', e.target.value)}
              InputLabelProps={{ shrink: true }} inputProps={{ min: form.start || range.start, max: range.end }} error={Boolean(show('due'))} helperText={show('due')} fullWidth />
          </Box>
          <TextField label="Additional comments" multiline minRows={2} value={form.notes} onChange={(e) => set('notes', e.target.value.slice(0, 600))}
            placeholder="Dependencies, support needed, context for your manager." fullWidth />

          {isChange && (
            <>
              <TextField label="Reason for change" required multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value.slice(0, 600))}
                placeholder="e.g. Client moved the release; target date needs two more weeks." fullWidth />
              <Typography variant="caption" color="text.secondary">
                {changed.length ? `Changing: ${changed.map((k) => LABELS[k]).join(', ')}` : 'Change at least one field.'}
              </Typography>
            </>
          )}
          {!isChange && !canSubmit && (
            <Alert severity="info">Total weightage must equal {target}% to submit — the plan would be at {planTotalWithThis}%. You can save as a draft and add the remaining goals.</Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={dialog.actions}>
          <Button variant="outlined" onClick={onClose} disabled={busy}>Cancel</Button>
          <Box sx={formStyles.actionGroup}>
            {!isChange && (
              <Button variant="outlined" disabled={busy} onClick={() => save(false)}
                startIcon={saving === 'draft' ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}>
                Save as draft
              </Button>
            )}
            <Button type="submit" variant="contained" disabled={busy || (!isChange && !canSubmit) || (isChange && !changed.length)}
              startIcon={saving === 'submit' ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}>
              {isChange ? 'Send change request' : 'Submit for approval'}
            </Button>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
