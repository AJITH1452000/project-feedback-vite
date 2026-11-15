import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MessageSquarePlus, Send } from 'lucide-react';
import { FilterChips } from '../common/index.jsx';
import { useGoalAction } from '../../hooks/queries/goals.js';
import { useToast } from '../../context/ToastContext.jsx';
import { TRACKING_STATUSES } from '../../data/constants.js';
import { dialog, text } from '../../styles/common.js';
import ProgressHistory from './ProgressHistory.jsx';

/**
 * mode "progress" → employee: completion %, status, description, evidence (sent to the manager)
 * mode "feedback" → manager: feedback on the goal's progress
 */
export default function ProgressDialog({ open, onClose, goal, mode = 'progress' }) {
  const goalAction = useGoalAction();
  const { notify } = useToast();
  const isFeedback = mode === 'feedback';
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('In Progress');
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');
  const saving = goalAction.isPending;

  useEffect(() => {
    if (!open || !goal) return;
    setProgress(goal.progress);
    setStatus(TRACKING_STATUSES.includes(goal.status) ? goal.status : 'In Progress');
    setNote('');
    setEvidence('');
    setError('');
  }, [open, goal]);

  const changeStatus = (value) => {
    setStatus(value);
    if (value === 'Completed') setProgress(100);
    if (value === 'Not Started') setProgress(0);
  };

  async function save() {
    if (note.trim().length < 3) { setError(isFeedback ? 'Write your feedback.' : 'Describe the progress made.'); return; }
    if (!isFeedback && status === 'Not Started' && progress > 0) { setError('A goal with progress cannot be "Not Started".'); return; }
    setError('');
    const variables = isFeedback
      ? { id: goal.id, action: 'feedback', payload: { note } }
      : { id: goal.id, action: 'progress', payload: { progress: status === 'Completed' ? 100 : progress, status, note, evidence } };
    goalAction.mutate(variables, {
      onSuccess: () => { notify(isFeedback ? 'Feedback shared with the employee.' : 'Progress update sent to your manager.'); onClose(); },
      onError: (err) => setError(err.message),
    });
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="progress-title">
      <DialogTitle id="progress-title" sx={dialog.title} component="div">
        <Box>
          <Typography variant="h3">{isFeedback ? 'Manager feedback' : 'Update progress'}</Typography>
          <Typography variant="body2" sx={dialog.subtitle}>{goal?.title} · target {goal?.target}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={dialog.content}>
        {!isFeedback && (
          <>
            <Box>
              <Typography variant="caption" sx={text.label}>Status</Typography>
              <FilterChips label="Goal status" value={status} onChange={changeStatus} options={TRACKING_STATUSES} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Completion — {progress}% (was {goal?.progress}%)</Typography>
              <Slider value={progress} onChange={(_, v) => setProgress(v)} step={5} min={0} max={100} disabled={status === 'Completed'}
                valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}%`} aria-label="Completion percentage" />
            </Box>
          </>
        )}
        <TextField label={isFeedback ? 'Feedback for the employee' : 'Progress description'} required multiline minRows={3} autoFocus fullWidth
          value={note} onChange={(e) => setNote(e.target.value.slice(0, 600))}
          placeholder={isFeedback ? 'Recognition, guidance or a course correction.' : 'What was achieved since the last update? Any blockers?'} />
        {!isFeedback && (
          <TextField label="Achievement evidence" value={evidence} onChange={(e) => setEvidence(e.target.value.slice(0, 300))} fullWidth
            placeholder="Link, document name, metric screenshot, ticket number…" helperText="Optional, but it makes the evaluation much easier." />
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {goal?.updates?.length > 0 && <ProgressHistory updates={goal.updates} />}
      </DialogContent>
      <DialogActions sx={dialog.actions}>
        <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : isFeedback ? <MessageSquarePlus size={16} /> : <Send size={16} />}>
          {isFeedback ? 'Share feedback' : 'Submit update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
