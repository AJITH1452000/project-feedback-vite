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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Send, X } from 'lucide-react';
import { FilterChips, Pill, ScoreBadge } from '../common/index.jsx';
import { useGoalPlanAction } from '../../hooks/queries/goals.js';
import { useToast } from '../../context/ToastContext.jsx';
import { RATING_PRINCIPLES } from '../../data/constants.js';
import { STATUS_TONE, isActive, weightedScore } from '../../data/goals.js';
import { ratingLabel } from '../../data/selectors.js';
import { dialog, grid } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';
import ProgressHistory from './ProgressHistory.jsx';

const SCALE = [...RATING_PRINCIPLES].sort((a, b) => a.level - b.level).map((r) => ({ value: r.level, label: `${r.level}` }));

/**
 * mode "self"    → employee self-assessment (plan action selfAssess)
 * mode "manager" → manager performance evaluation with improvement suggestions (plan action evaluate)
 */
export default function RatingDialog({ open, onClose, mode, plan, goals, ownerName, hrReview }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const planAction = useGoalPlanAction();
  const { notify } = useToast();
  const isSelf = mode === 'self';
  const active = useMemo(() => goals.filter(isActive), [goals]);
  const [ratings, setRatings] = useState({});
  const [summary, setSummary] = useState('');
  const [improvement, setImprovement] = useState('');
  const [error, setError] = useState('');
  const saving = planAction.isPending;

  useEffect(() => {
    if (!open) return;
    setRatings(Object.fromEntries(active.map((g) => [g.id, isSelf
      ? { rating: g.selfRating || null, comment: g.selfComment || '' }
      // Start the manager from the employee's self-rating so they only adjust what differs.
      : { rating: g.managerRating || g.selfRating || null, comment: g.managerComment || '', improvement: g.improvement || '' }])));
    setSummary((isSelf ? plan.selfSummary : plan.managerSummary) || '');
    setImprovement(plan.managerImprovement || '');
    setError('');
  }, [open, active, plan, isSelf]);

  const setGoal = (id, key, value) => setRatings((cur) => ({ ...cur, [id]: { ...cur[id], [key]: value } }));
  const preview = useMemo(() => weightedScore(active.map((g) => ({ ...g, r: ratings[g.id]?.rating || null })), 'r'), [active, ratings]);

  async function submit() {
    const missing = active.filter((g) => !ratings[g.id]?.rating).length;
    if (missing) { setError(`Rate every goal — ${missing} still missing.`); return; }
    if (summary.trim().length < 10) { setError('Add overall comments (at least 10 characters).'); return; }
    setError('');
    planAction.mutate({ u: plan.u, period: plan.period, action: isSelf ? 'selfAssess' : 'evaluate', payload: { ratings, summary, improvement } }, {
      onSuccess: () => {
        notify(isSelf ? 'Self-assessment submitted to your manager.' : hrReview ? 'Evaluation completed and sent for HR final review.' : 'Evaluation completed and shared with the employee.');
        onClose();
      },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby="rating-title">
      <DialogTitle id="rating-title" sx={dialog.title} component="div">
        <Box>
          <Typography variant="h3">{isSelf ? 'Self assessment' : `Performance evaluation · ${ownerName}`}</Typography>
          <Typography variant="body2" sx={dialog.subtitle}>
            {plan.period} · rate each goal 1–5 against its KPI and target. The overall score is weighted by goal weightage.
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close" disabled={saving}><X size={18} /></IconButton>
      </DialogTitle>

      <DialogContent sx={dialog.content}>
        {!isSelf && plan.selfSummary && <Alert severity="info"><b>Employee self-assessment:</b> {plan.selfSummary}</Alert>}
        {!isSelf && plan.hrNote && <Alert severity="warning"><b>Returned by HR:</b> {plan.hrNote}</Alert>}

        {active.map((g) => {
          const value = ratings[g.id]?.rating;
          return (
            <Box key={g.id} sx={s.item}>
              <Box sx={s.itemHead}>
                <Box minWidth={0} flex="1 1 240px">
                  <Typography variant="subtitle1" sx={s.itemTitle}>{g.title}</Typography>
                  <Typography variant="caption" color="text.secondary">KPI: {g.metric} · Target: {g.target} · {g.progress}% complete</Typography>
                </Box>
                <Box sx={s.pills}>
                  <Pill tone={STATUS_TONE[g.status]}>{g.status}</Pill>
                  <Pill tone="primary">{g.weight}%</Pill>
                </Box>
              </Box>
              {!isSelf && g.selfRating && (
                <Typography variant="body2" sx={s.selfNote}><b>Self-rating {g.selfRating}/5</b>{g.selfComment ? ` — ${g.selfComment}` : ''}</Typography>
              )}
              {!isSelf && g.updates.length > 0 && <Box mt={1.25}><ProgressHistory updates={g.updates} max={2} /></Box>}
              <Box sx={s.rateRow}>
                <FilterChips label={`Rating for ${g.title}`} value={value} onChange={(v) => setGoal(g.id, 'rating', v)} options={SCALE} />
                <Typography variant="caption" color="text.secondary">{value ? ratingLabel(value) : 'Not rated'}</Typography>
              </Box>
              <Box sx={isSelf ? undefined : grid.form2} mt={1.25}>
                <TextField size="small" label={isSelf ? 'Achievement / evidence' : 'Feedback'} value={ratings[g.id]?.comment || ''} fullWidth
                  onChange={(e) => setGoal(g.id, 'comment', e.target.value.slice(0, 600))} />
                {!isSelf && (
                  <TextField size="small" label="Improvement suggestion" value={ratings[g.id]?.improvement || ''} fullWidth
                    onChange={(e) => setGoal(g.id, 'improvement', e.target.value.slice(0, 600))} />
                )}
              </Box>
            </Box>
          );
        })}

        <TextField label={isSelf ? 'Overall self-assessment' : 'Overall manager feedback'} required multiline minRows={3} value={summary}
          onChange={(e) => setSummary(e.target.value.slice(0, 1000))} fullWidth
          placeholder={isSelf ? 'Key achievements, challenges and the support you need next period.' : 'Overall performance and key strengths this period.'} />
        {!isSelf && (
          <TextField label="Improvement suggestions & development plan" multiline minRows={2} value={improvement}
            onChange={(e) => setImprovement(e.target.value.slice(0, 600))} fullWidth placeholder="Skills to build, training, stretch assignments for next period." />
        )}

        <Box sx={s.scorePreview}>
          <Typography variant="subtitle2">Weighted {isSelf ? 'self' : 'manager'} score</Typography>
          {preview
            ? <Box display="flex" gap={1} alignItems="center"><ScoreBadge value={preview} suffix=" / 5" /><Typography variant="caption" color="text.secondary">{ratingLabel(preview)}</Typography></Box>
            : <Typography variant="caption" color="text.secondary">Rate every goal to see the score</Typography>}
        </Box>
        {!isSelf && hrReview && <Alert severity="info">HR final review is enabled — HR will confirm or calibrate this score before it reaches the employee.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>

      <DialogActions sx={dialog.actions}>
        <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}>
          {isSelf ? 'Submit self assessment' : 'Complete evaluation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
