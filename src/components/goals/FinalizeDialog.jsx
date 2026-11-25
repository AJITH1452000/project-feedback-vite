import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { BadgeCheck } from 'lucide-react';
import { useGoalPlanAction } from '../../hooks/queries/goals.js';
import { useToast } from '../../context/ToastContext.jsx';
import { scaleLabel } from '../../data/cycles.js';
import { dialog, grid } from '../../styles/common.js';

/** HR/Admin: confirm the manager's score, or calibrate it with a written reason. */
export default function FinalizeDialog({ open, onClose, plan, ownerName }) {
  const finalize = useGoalPlanAction();
  const { notify } = useToast();
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const saving = finalize.isPending;

  useEffect(() => {
    if (open && plan) { setScore(plan.managerScore?.toFixed(2) ?? ''); setNote(''); setError(''); }
  }, [open, plan]);

  if (!plan) return null;
  const value = Math.round(Number(score) * 100) / 100;
  const calibrated = Number.isFinite(value) && value !== plan.managerScore;

  async function confirm() {
    if (!(value >= 1 && value <= 5)) { setError('Final score must be between 1.00 and 5.00.'); return; }
    if (calibrated && note.trim().length < 10) { setError('Explain the calibration (at least 10 characters).'); return; }
    setError('');
    finalize.mutate({ u: plan.u, period: plan.period, action: 'hrFinalize', payload: { score: value, note } }, {
      onSuccess: () => { notify(`${ownerName}'s appraisal is finalized.`); onClose(); },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="finalize-title">
      <DialogTitle id="finalize-title" sx={dialog.title} component="div">
        <Box>
          <Typography variant="h3">Finalize appraisal</Typography>
          <Typography variant="body2" sx={dialog.subtitle}>{ownerName} · {plan.period} · manager score {plan.managerScore?.toFixed(2)} ({scaleLabel(plan.period, plan.managerScore)})</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={dialog.content}>
        {plan.managerSummary && <Alert severity="info"><b>Manager feedback:</b> {plan.managerSummary}</Alert>}
        <Box sx={grid.form2}>
          <TextField label="Final score" type="number" value={score} onChange={(e) => setScore(e.target.value)} inputProps={{ min: 1, max: 5, step: 0.05 }}
            helperText={Number.isFinite(value) && value >= 1 ? scaleLabel(plan.period, value) : '1.00 – 5.00'} fullWidth />
          <Box display="flex" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {calibrated ? `Calibrating ${plan.managerScore?.toFixed(2)} → ${value.toFixed(2)}. A reason is required and is recorded in the history.` : 'Keeping the manager score.'}
            </Typography>
          </Box>
        </Box>
        <TextField label={calibrated ? 'Calibration reason' : 'HR comment (optional)'} required={calibrated} multiline minRows={3} value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 600))} placeholder="e.g. Aligned with department calibration session." fullWidth />
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={dialog.actions}>
        <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={confirm} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <BadgeCheck size={16} />}>
          Finalize
        </Button>
      </DialogActions>
    </Dialog>
  );
}
