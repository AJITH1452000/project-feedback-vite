import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Database, KeyRound, Moon, Palette, Settings2, Sun, UserRound } from 'lucide-react';
import { PageHeader, Pill, SectionCard, UserAvatar } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useThemeMode } from '../../context/ThemeModeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { API_URL, changePassword } from '../../services/api.js';
import { PASSWORD_MIN } from '../../data/constants.js';
import { form, grid, page, text } from '../../styles/common.js';
import { settings as s } from '../../styles/pages.js';

const CYCLES = [
  { value: 'quarterly', label: 'Quarterly checkpoints + project closure' },
  { value: 'monthly', label: 'Monthly checkpoints' },
  { value: 'closureOnly', label: 'Project closure only' },
];
const VISIBILITY = ['Manager and employee', 'Private / HR only', 'Public team visible'];

function ReviewSettingsCard() {
  const { settings, saveSettings } = useData();
  const { notify } = useToast();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  if (!draft) return null;

  const save = async () => {
    setSaving(true);
    try { await saveSettings(draft); notify('Review configuration saved.'); } catch (err) { notify(err.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <SectionCard title="Review workflow" subtitle="Cadence, visibility and AI evidence safeguards." icon={Settings2} action={<Pill tone="primary">Manager / HR</Pill>}>
      <Box sx={form.section}>
        <Box sx={grid.form2}>
          <TextField select label="Evaluation cadence" value={draft.cycle} onChange={(e) => setDraft({ ...draft, cycle: e.target.value })} fullWidth>
            {CYCLES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
          <TextField select label="Default feedback visibility" value={draft.visibility} onChange={(e) => setDraft({ ...draft, visibility: e.target.value })} fullWidth>
            {VISIBILITY.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
        </Box>
        <Box sx={s.row}>
          <Box>
            <Typography variant="subtitle2">Require context review for AI signals</Typography>
            <Typography variant="caption" color="text.secondary">Managers must confirm discussion before submitting AI-sourced quotes.</Typography>
          </Box>
          <Switch checked={draft.safeguardRequired} onChange={(e) => setDraft({ ...draft, safeguardRequired: e.target.checked })} inputProps={{ 'aria-label': 'Require context review' }} />
        </Box>
        <Box sx={s.row}>
          <Box>
            <Typography variant="subtitle2">Automatic checkpoint reminders</Typography>
            <Typography variant="caption" color="text.secondary">Notify reviewers 5 days before quarterly checkpoints.</Typography>
          </Box>
          <Switch checked={draft.reminders} onChange={(e) => setDraft({ ...draft, reminders: e.target.checked })} inputProps={{ 'aria-label': 'Automatic reminders' }} />
        </Box>
        <Box sx={s.row}>
          <Box>
            <Typography variant="subtitle2">HR / Admin final review (optional)</Typography>
            <Typography variant="caption" color="text.secondary">
              On: HR confirms or calibrates each manager evaluation before the employee sees it. Off: the manager evaluation is final — for companies without an HR team.
            </Typography>
          </Box>
          <Switch checked={Boolean(draft.hrReview)} onChange={(e) => setDraft({ ...draft, hrReview: e.target.checked })} inputProps={{ 'aria-label': 'HR final review' }} />
        </Box>
        <Box sx={form.actions}>
          <Box />
          <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </Box>
      </Box>
    </SectionCard>
  );
}

/** Change your own password (signs out your other devices). */
function PasswordCard() {
  const { notify } = useToast();
  const [values, setValues] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setValues((cur) => ({ ...cur, [key]: e.target.value }));

  async function save(event) {
    event.preventDefault();
    if (!values.current) { setError('Enter your current password.'); return; }
    if (values.next.length < PASSWORD_MIN) { setError(`New password must be at least ${PASSWORD_MIN} characters.`); return; }
    if (values.next !== values.confirm) { setError('New passwords do not match.'); return; }
    setSaving(true);
    setError('');
    try {
      await changePassword(values.current, values.next);
      setValues({ current: '', next: '', confirm: '' });
      notify('Password changed. Your other devices were signed out.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Password" subtitle="Change the password you sign in with." icon={KeyRound}>
      <Box component="form" onSubmit={save} noValidate sx={form.section}>
        <TextField label="Current password" type="password" autoComplete="current-password" value={values.current} onChange={set('current')} fullWidth size="small" />
        <TextField label="New password" type="password" autoComplete="new-password" value={values.next} onChange={set('next')} fullWidth size="small"
          helperText={`At least ${PASSWORD_MIN} characters`} />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" value={values.confirm} onChange={set('confirm')} fullWidth size="small" />
        {error && <Typography variant="body2" color="error">{error}</Typography>}
        <Button type="submit" variant="outlined" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>Change password</Button>
      </Box>
    </SectionCard>
  );
}

export default function Settings() {
  const { user, isManager, isHr } = useAuth();
  const { mode, setMode } = useThemeMode();
  const { live } = useData();

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="Workspace preferences" title="Settings" description="Manage review workflow, appearance and your workspace connection." />
      <Box sx={grid.mainAside}>
        <Box sx={page.stack}>
          {(isManager || isHr) && <ReviewSettingsCard />}
          <SectionCard title="Appearance" subtitle="Choose the display that works best for you." icon={Palette}>
            <Box sx={s.modeGrid} role="radiogroup" aria-label="Color theme">
              {[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }].map(({ value, label, icon: Icon }) => (
                <Box key={value} component="button" type="button" role="radio" aria-checked={mode === value} sx={s.modeOption(mode === value)} onClick={() => setMode(value)}>
                  <Icon size={18} />
                  <Box>
                    <Typography variant="subtitle2">{label} mode</Typography>
                    <Typography variant="caption" color="text.secondary">{value === 'light' ? 'Bright, high-contrast surfaces' : 'Easy on the eyes at night'}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </SectionCard>
        </Box>

        <Box sx={page.stack}>
          <SectionCard title="Profile" subtitle="Provided by your sign-in." icon={UserRound}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <UserAvatar name={user.name} size={52} />
              <Box minWidth={0}>
                <Typography variant="subtitle1" sx={text.ellipsis}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.title} · {isManager ? 'Manager (full access)' : isHr ? 'HR / Admin (all employees)' : 'Employee (own feedback)'}</Typography>
              </Box>
            </Box>
          </SectionCard>
          <PasswordCard />
          <SectionCard title="Server connection" subtitle="Where workspace data comes from." icon={Database}
            action={<Pill tone={live === 'live' ? 'success' : 'warning'} dot>{live === 'live' ? 'Live' : live === 'offline' ? 'Offline' : 'Connecting'}</Pill>}>
            <Typography variant="body2" color="text.secondary">
              API <Box component="code" sx={text.code}>{API_URL}</Box> · secure HttpOnly cookie session · real-time updates over WebSocket.
            </Typography>
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}
