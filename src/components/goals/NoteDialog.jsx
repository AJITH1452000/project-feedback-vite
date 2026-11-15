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
import { dialog } from '../../styles/common.js';

/** Small confirm-with-comment dialog (approve, reject, return, acknowledge…). Pass no `label` for a plain confirmation. */
export default function NoteDialog({ open, onClose, onSubmit, title, subtitle, info, label, placeholder, minLength = 0, confirmLabel, confirmColor = 'primary' }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) { setNote(''); setError(''); } }, [open]);

  async function confirm() {
    if (note.trim().length < minLength) { setError(`Please write at least ${minLength} characters.`); return; }
    setSaving(true);
    try {
      await onSubmit(note.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="note-title">
      <DialogTitle id="note-title" sx={dialog.title} component="div">
        <Box>
          <Typography variant="h3">{title}</Typography>
          {subtitle && <Typography variant="body2" sx={dialog.subtitle}>{subtitle}</Typography>}
        </Box>
      </DialogTitle>
      <DialogContent sx={dialog.content}>
        {info && <Alert severity="info">{info}</Alert>}
        {label && (
          <TextField label={label} multiline minRows={3} autoFocus required={minLength > 0} value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 600))} placeholder={placeholder} fullWidth />
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={dialog.actions}>
        <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" color={confirmColor} onClick={confirm} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
