import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import { FolderPlus, X } from 'lucide-react';
import { FilterChips, UserAvatar } from '../common/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { dialog, grid, text } from '../../styles/common.js';
import { projectDialog as s } from '../../styles/pages.js';

// Local calendar date (toISOString would use UTC and can show yesterday in IST).
const localIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => localIso(new Date());
const plusMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return localIso(d);
};
const emptyForm = () => ({ n: '', c: '', pr: 'Medium', s: today(), e: plusMonths(3), t: [] });

export default function ProjectDialog({ open, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { users, addProject } = useData();
  const { notify } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setForm(emptyForm()); setError(''); }
  }, [open]);

  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));
  const selected = users.filter((u) => form.t.includes(u.id));

  async function submit(event) {
    event.preventDefault();
    if (form.n.trim().length < 3) return setError('Project name must be at least 3 characters.');
    if (!form.c.trim()) return setError('Enter the client name.');
    if (!form.s || !form.e || form.e < form.s) return setError('End date must be on or after the start date.');
    if (!form.t.length) return setError('Assign at least one team member.');
    setSaving(true);
    setError('');
    try {
      const project = await addProject({ ...form, n: form.n.trim(), c: form.c.trim() });
      notify(`Project “${project.n}” created with ${project.t.length} team member${project.t.length === 1 ? '' : 's'}.`);
      onCreated?.(project);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby="project-dialog-title">
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle id="project-dialog-title" sx={dialog.title} component="div">
          <Box display="flex" gap={1.5} alignItems="center">
            <Box sx={s.icon}><FolderPlus size={20} /></Box>
            <Box>
              <Typography variant="h3">New project</Typography>
              <Typography variant="body2" sx={dialog.subtitle}>Set up the engagement and assign its delivery team.</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={saving}><X size={18} /></IconButton>
        </DialogTitle>

        <DialogContent sx={dialog.content}>
          <Box sx={grid.form2}>
            <TextField label="Project name" required autoFocus value={form.n} onChange={(e) => set('n', e.target.value.slice(0, 80))}
              placeholder="e.g. Partner Onboarding Portal" fullWidth />
            <TextField label="Client" required value={form.c} onChange={(e) => set('c', e.target.value.slice(0, 80))}
              placeholder="e.g. Northwind Traders" fullWidth />
            <TextField label="Start date" type="date" required value={form.s} onChange={(e) => set('s', e.target.value)}
              InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End date" type="date" required value={form.e} onChange={(e) => set('e', e.target.value)}
              InputLabelProps={{ shrink: true }} inputProps={{ min: form.s }} fullWidth />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={text.label}>Priority</Typography>
            <FilterChips label="Priority" value={form.pr} onChange={(v) => set('pr', v)} options={['High', 'Medium', 'Low']} />
          </Box>

          <Autocomplete
            multiple
            options={users}
            value={selected}
            onChange={(_, value) => set('t', value.map((u) => u.id))}
            getOptionLabel={(u) => u.n}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            disableCloseOnSelect
            renderOption={({ key, ...props }, u) => (
              <Box component="li" key={key} {...props} sx={s.option}>
                <UserAvatar name={u.n} size={30} />
                <Box minWidth={0}>
                  <Typography variant="body2" fontWeight={600}>{u.n}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.t} · {u.r}</Typography>
                </Box>
              </Box>
            )}
            renderTags={(value, getTagProps) => value.map((u, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip key={key} {...tagProps} size="small" label={u.n} avatar={<UserAvatar name={u.n} size={20} />} />;
            })}
            renderInput={(params) => (
              <TextField {...params} label="Team members" required placeholder={selected.length ? '' : 'Search people…'}
                helperText="The first member is shown as the project lead." />
            )}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={dialog.actions}>
          <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <FolderPlus size={16} />}>
            {saving ? 'Creating…' : 'Create project'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
