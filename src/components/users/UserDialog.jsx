import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Copy, KeyRound, RefreshCw, UserPlus, X } from 'lucide-react';
import { FilterChips } from '../common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DEPARTMENT_OPTIONS, PASSWORD_MIN, ROLES, TRACKS } from '../../data/constants.js';
import { useCreateUser, useUpdateUser } from '../../hooks/queries/users.js';
import { dialog, grid, text } from '../../styles/common.js';
import { goals as s } from '../../styles/pages.js';

/** Readable temporary password, e.g. "maple-river-4821". */
export function generatePassword() {
  const words = ['maple', 'river', 'cedar', 'harbor', 'summit', 'meadow', 'falcon', 'amber', 'willow', 'orbit', 'cobalt', 'lumen'];
  const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const digits = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, '0');
  return `${pick()}-${pick()}-${digits}`;
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/**
 * mode "create" → add a person with a temporary password
 * mode "edit"   → change profile details
 * mode "password" → set a new temporary password (signs them out everywhere)
 */
export default function UserDialog({ open, onClose, mode = 'create', person, people }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isHr } = useAuth();
  const { notify } = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const managers = useMemo(() => people.filter((p) => p.role === 'manager' && p.active), [people]);
  const [form, setForm] = useState({});
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null); // { person, password } after create — show credentials once

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setError('');
    setCreated(null);
    if (mode === 'create') {
      setForm({
        name: '', email: '', title: '', role: 'employee', track: 'Member', dept: '',
        managerId: user.role === 'manager' ? user.userId : managers[0]?.id ?? '', password: generatePassword(),
      });
    } else if (person) {
      setForm({ name: person.n, email: person.email, title: person.t, role: person.role, track: person.r || 'Member', dept: person.dept || '', managerId: person.managerId ?? '', password: generatePassword() });
    }
  }, [open, mode, person, user, managers]);

  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));
  const problems = mode === 'password'
    ? { password: (form.password || '').length < PASSWORD_MIN ? `At least ${PASSWORD_MIN} characters.` : '' }
    : {
      name: (form.name || '').trim().length < 2 ? 'Enter the full name.' : '',
      email: !isEmail(form.email || '') ? 'Enter a valid email.' : '',
      title: (form.title || '').trim().length < 2 ? 'Enter a job title.' : '',
      dept: !(form.dept || '').trim() ? 'Choose or type a department.' : '',
      managerId: form.role === 'employee' && !form.managerId ? 'Employees need a reporting manager.' : '',
      password: mode === 'create' && (form.password || '').length < PASSWORD_MIN ? `At least ${PASSWORD_MIN} characters.` : '',
    };
  const show = (key) => (touched ? problems[key] : '');
  const busy = createUser.isPending || updateUser.isPending;

  function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (Object.values(problems).some(Boolean)) { setError('Fix the highlighted fields.'); return; }
    setError('');
    const onError = (err) => setError(err.message);
    if (mode === 'create') {
      const input = { ...form, name: form.name.trim(), email: form.email.trim(), title: form.title.trim(), dept: form.dept.trim(), managerId: form.role === 'employee' ? form.managerId : null };
      createUser.mutate(input, { onSuccess: (p) => { setCreated({ person: p, password: form.password }); notify(`${p.n} can now sign in.`); }, onError });
    } else if (mode === 'password') {
      updateUser.mutate({ id: person.id, changes: { password: form.password } }, { onSuccess: () => { setCreated({ person, password: form.password }); notify('Password reset. They were signed out everywhere.'); }, onError });
    } else {
      const changes = { name: form.name.trim(), email: form.email.trim(), title: form.title.trim(), track: form.track, dept: form.dept.trim(), managerId: form.role === 'employee' ? form.managerId : null };
      if (isHr) changes.role = form.role;
      updateUser.mutate({ id: person.id, changes }, { onSuccess: () => { notify('Profile updated.'); onClose(); }, onError });
    }
  }

  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value); notify('Copied to clipboard.', 'info'); } catch { notify('Copy failed — select and copy it manually.', 'warning'); }
  };

  const roleOptions = ROLES.filter((r) => isHr || r.value === 'employee');
  const title = mode === 'create' ? 'Add a person' : mode === 'password' ? `Reset password · ${person?.n}` : `Edit ${person?.n}`;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth={mode === 'password' ? 'sm' : 'md'} aria-labelledby="user-dialog-title">
      <Box component="form" noValidate onSubmit={submit}>
        <DialogTitle id="user-dialog-title" sx={dialog.title} component="div">
          <Box display="flex" gap={1.5} alignItems="center">
            <Box sx={s.dialogIcon}>{mode === 'password' ? <KeyRound size={20} /> : <UserPlus size={20} />}</Box>
            <Box>
              <Typography variant="h3">{title}</Typography>
              <Typography variant="body2" sx={dialog.subtitle}>
                {mode === 'create' ? 'They sign in with this email and the temporary password, then change it in Settings.' : mode === 'password' ? 'Share the new password privately. Their current sessions end immediately.' : 'Update profile, team and reporting line.'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={busy}><X size={18} /></IconButton>
        </DialogTitle>

        <DialogContent sx={dialog.content}>
          {created ? (
            <Alert severity="success">
              <Typography variant="subtitle2" gutterBottom>Share these sign-in details with {created.person.n} privately:</Typography>
              <Box sx={s.credentials}>
                <Typography variant="body2"><b>Email:</b> {created.person.email}</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2"><b>Temporary password:</b> <Box component="code" sx={text.code}>{created.password}</Box></Typography>
                  <Tooltip title="Copy password"><IconButton size="small" onClick={() => copy(created.password)} aria-label="Copy password"><Copy size={15} /></IconButton></Tooltip>
                </Box>
              </Box>
              <Typography variant="caption" display="block" mt={1}>This password is not shown again.</Typography>
            </Alert>
          ) : mode === 'password' ? (
            <PasswordInput value={form.password || ''} onChange={(v) => set('password', v)} error={show('password')} />
          ) : (
            <>
              <Box sx={grid.form2}>
                <TextField label="Full name" required autoFocus value={form.name || ''} onChange={(e) => set('name', e.target.value.slice(0, 80))} error={Boolean(show('name'))} helperText={show('name')} fullWidth />
                <TextField label="Work email" type="email" required value={form.email || ''} onChange={(e) => set('email', e.target.value.slice(0, 120))} error={Boolean(show('email'))} helperText={show('email') || 'Used to sign in'} fullWidth />
                <TextField label="Job title" required value={form.title || ''} onChange={(e) => set('title', e.target.value.slice(0, 80))} error={Boolean(show('title'))} helperText={show('title')} placeholder="e.g. Backend developer" fullWidth />
                <Autocomplete freeSolo options={DEPARTMENT_OPTIONS} value={form.dept || ''} onInputChange={(_, v) => set('dept', v.slice(0, 60))}
                  renderInput={(params) => <TextField {...params} label="Department" required error={Boolean(show('dept'))} helperText={show('dept')} />} />
              </Box>
              <Box sx={grid.form2}>
                <Box>
                  <Typography variant="caption" sx={text.label}>Role</Typography>
                  <FilterChips label="Role" value={form.role} onChange={(v) => set('role', v)} options={roleOptions.map((r) => ({ value: r.value, label: r.label }))} />
                  {!isHr && <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>Managers can add employees. HR adds managers and HR accounts.</Typography>}
                </Box>
                <Box>
                  <Typography variant="caption" sx={text.label}>Track</Typography>
                  <FilterChips label="Track" value={form.track} onChange={(v) => set('track', v)} options={TRACKS} />
                </Box>
              </Box>
              {form.role === 'employee' && (
                <TextField select label="Reports to" required value={form.managerId ?? ''} onChange={(e) => set('managerId', Number(e.target.value))}
                  error={Boolean(show('managerId'))} helperText={show('managerId') || 'Their manager approves goals and evaluates performance.'} fullWidth
                  disabled={!isHr && mode === 'edit'}>
                  {managers.map((m) => <MenuItem key={m.id} value={m.id}>{m.n} · {m.t}</MenuItem>)}
                </TextField>
              )}
              {mode === 'create' && <PasswordInput value={form.password || ''} onChange={(v) => set('password', v)} error={show('password')} />}
            </>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={dialog.actions}>
          {created ? (
            <Button variant="contained" onClick={onClose}>Done</Button>
          ) : (
            <>
              <Button variant="outlined" onClick={onClose} disabled={busy}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}>
                {mode === 'create' ? 'Add person' : mode === 'password' ? 'Reset password' : 'Save changes'}
              </Button>
            </>
          )}
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function PasswordInput({ value, onChange, error }) {
  return (
    <TextField label="Temporary password" required value={value} onChange={(e) => onChange(e.target.value)} fullWidth
      error={Boolean(error)} helperText={error || `At least ${PASSWORD_MIN} characters. Shown once — share it privately.`}
      InputProps={{ endAdornment: (
        <InputAdornment position="end">
          <Tooltip title="Generate a new password">
            <IconButton onClick={() => onChange(generatePassword())} edge="end" aria-label="Generate password"><RefreshCw size={16} /></IconButton>
          </Tooltip>
        </InputAdornment>
      ) }} />
  );
}
