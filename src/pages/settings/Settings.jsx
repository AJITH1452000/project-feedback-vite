import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Database, Moon, Palette, Settings2, Sun, UserRound } from 'lucide-react';
import { PageHeader, Pill, SectionCard, UserAvatar } from '../../components/common/index.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useThemeMode } from '../../context/ThemeModeContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { API_URL, isDemoMode } from '../../services/api.js';
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
    <SectionCard title="Review workflow" subtitle="Cadence, visibility and AI evidence safeguards." icon={Settings2} action={<Pill tone="primary">Manager only</Pill>}>
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

export default function Settings() {
  const { user, isManager } = useAuth();
  const { mode, setMode } = useThemeMode();
  const { resetDemo } = useData();
  const { notify } = useToast();

  return (
    <Box sx={page.root}>
      <PageHeader eyebrow="Workspace preferences" title="Settings" description="Manage review workflow, appearance and your workspace connection." />
      <Box sx={grid.mainAside}>
        <Box sx={page.stack}>
          {isManager && <ReviewSettingsCard />}
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
                <Typography variant="caption" color="text.secondary">{user.title} · {isManager ? 'Manager (full access)' : 'Employee (own feedback)'}</Typography>
              </Box>
            </Box>
          </SectionCard>
          <SectionCard title="Backend connection" subtitle="Where workspace data comes from." icon={Database}
            action={<Pill tone={isDemoMode ? 'warning' : 'success'} dot>{isDemoMode ? 'Demo mode' : 'Connected'}</Pill>}>
            <Typography variant="body2" color="text.secondary">
              {isDemoMode
                ? <>Sample data stored in this browser tab. Set <Box component="code" sx={text.code}>VITE_API_URL</Box> in <Box component="code" sx={text.code}>.env</Box> to use the live backend.</>
                : <>Using <Box component="code" sx={text.code}>{API_URL}</Box> with secure cookie sessions.</>}
            </Typography>
            {isDemoMode && (
              <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => { resetDemo(); notify('Demo data restored to the original seed.', 'info'); }}>
                Reset demo data
              </Button>
            )}
          </SectionCard>
        </Box>
      </Box>
    </Box>
  );
}
