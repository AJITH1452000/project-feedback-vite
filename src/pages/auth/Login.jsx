import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ArrowRight, BadgeCheck, Briefcase, Eye, EyeOff, Info, MessageSquareText, Moon, Radio, Sparkles, Sun, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useThemeMode } from '../../context/ThemeModeContext.jsx';
import { homePathFor } from '../../config/navigation.js';
import { PASSWORD_MIN } from '../../data/constants.js';
import { getSetupStatus } from '../../services/api.js';
import { login as s } from '../../styles/login.js';
import { sidebar } from '../../styles/layout.js';
import { text } from '../../styles/common.js';

const FEATURES = [
  { icon: Target, title: 'Goal setting', desc: 'Employees set goals, managers approve' },
  { icon: MessageSquareText, title: 'Continuous feedback', desc: 'Evidence-based project reviews' },
  { icon: Radio, title: 'Live updates', desc: 'Changes appear instantly for everyone' },
];

function Hero() {
  return (
    <Box component="section" sx={s.hero} aria-label="About ProFeed">
      <Box sx={s.orb('a')} />
      <Box sx={s.orb('b')} />
      <Box sx={s.heroBrand}>
        <Box sx={s.heroMark}><Sparkles size={22} /></Box>
        <Box>
          <Typography variant="h3" sx={s.heroTitle}>ProFeed</Typography>
          <Typography variant="caption" sx={s.heroMuted}>Performance & project feedback</Typography>
        </Box>
      </Box>

      <Box sx={s.heroCopy}>
        <Typography variant="overline" component="div" sx={s.kicker}><Sparkles size={14} /> Better teams start here</Typography>
        <Typography variant="display" sx={s.heroTitle}>
          Make every review <Box component="span" sx={s.heroAccent}>count.</Box>
        </Typography>
        <Typography sx={s.heroText}>
          Set goals, track progress and share fair, evidence-led feedback — from goal approval to the final appraisal.
        </Typography>
      </Box>

      <Box sx={s.heroStats}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <Box key={title} sx={s.heroStat}>
            <Box sx={s.heroFeatureIcon}><Icon size={18} /></Box>
            <Typography variant="subtitle2" sx={s.heroStatValue}>{title}</Typography>
            <Typography variant="caption" component="div" sx={s.heroMuted}>{desc}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function PasswordField({ label, value, onChange, autoComplete, helperText, error }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      label={label} type={show ? 'text' : 'password'} autoComplete={autoComplete} fullWidth value={value} onChange={onChange}
      helperText={helperText} error={error}
      InputProps={{ endAdornment: (
        <InputAdornment position="end">
          <IconButton onClick={() => setShow((v) => !v)} edge="end" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </IconButton>
        </InputAdornment>
      ) }}
    />
  );
}

/** Sign in with email + password. */
function SignInForm({ onDone }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusy(true);
    setError('');
    try {
      onDone(await login({ email: email.trim(), password }));
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Box component="form" noValidate onSubmit={submit}>
      <Box sx={s.cardHead}>
        <Typography variant="h2" sx={s.cardTitle}>Welcome back</Typography>
        <Typography variant="body2" sx={s.cardSub}>Sign in with your work email.</Typography>
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="Work email" type="email" autoComplete="username" autoFocus fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Box>
      {error && <Alert severity="error" sx={s.submit}>{error}</Alert>}
      <Button type="submit" fullWidth size="large" variant="contained" sx={s.submit} disabled={busy}
        endIcon={busy ? <CircularProgress size={18} color="inherit" /> : <ArrowRight size={18} />}>
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
      <Box sx={[s.notice, { mt: 2.5 }]}>
        <Box sx={s.noticeIcon}><Info size={16} /></Box>
        <Typography variant="caption">
          No account yet, or forgot your password? Your manager or HR administrator can create your account and reset your password.
        </Typography>
      </Box>
    </Box>
  );
}

/** First run only: create the first administrator account. */
function SetupForm({ onDone }) {
  const { setup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', title: '', role: 'manager', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((cur) => ({ ...cur, [key]: e.target.value }));

  const problems = {
    name: form.name.trim().length < 2 ? 'Enter your full name.' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? 'Enter a valid email.' : '',
    password: form.password.length < PASSWORD_MIN ? `At least ${PASSWORD_MIN} characters.` : '',
    confirm: form.confirm !== form.password ? 'Passwords do not match.' : '',
  };
  const show = (key) => (touched ? problems[key] : '');

  async function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (Object.values(problems).some(Boolean)) return;
    setBusy(true);
    setError('');
    try {
      onDone(await setup({ name: form.name.trim(), email: form.email.trim(), title: form.title.trim(), role: form.role, password: form.password }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Box component="form" noValidate onSubmit={submit}>
      <Box sx={s.cardHead}>
        <Typography variant="h2" sx={s.cardTitle}>Set up your workspace</Typography>
        <Typography variant="body2" sx={s.cardSub}>No accounts exist yet. Create the first administrator account — you can add your team after signing in.</Typography>
      </Box>
      <Typography variant="subtitle2" component="div" sx={text.label}>Your role</Typography>
      <Box sx={s.roleGrid} role="radiogroup" aria-label="Your role">
        {[{ value: 'manager', label: 'Manager', hint: 'Lead a team and review work', icon: Briefcase }, { value: 'hr', label: 'HR / Admin', hint: 'Oversee everyone’s reviews', icon: BadgeCheck }].map(({ value, label, hint, icon: Icon }) => {
          const active = form.role === value;
          return (
            <Box key={value} component="button" type="button" role="radio" aria-checked={active} sx={s.roleOption(active)} onClick={() => setForm((cur) => ({ ...cur, role: value }))}>
              <Box sx={s.roleIcon(active)}><Icon size={17} /></Box>
              <Box>
                <Typography variant="subtitle2">{label}</Typography>
                <Typography variant="caption" color="text.secondary">{hint}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField label="Full name" autoFocus fullWidth value={form.name} onChange={set('name')} error={Boolean(show('name'))} helperText={show('name')} autoComplete="name" />
        <TextField label="Work email" type="email" fullWidth value={form.email} onChange={set('email')} error={Boolean(show('email'))} helperText={show('email')} autoComplete="username" />
        <TextField label="Job title (optional)" fullWidth value={form.title} onChange={set('title')} placeholder={form.role === 'hr' ? 'HR business partner' : 'Engineering manager'} />
        <PasswordField label="Password" autoComplete="new-password" value={form.password} onChange={set('password')} error={Boolean(show('password'))} helperText={show('password') || `At least ${PASSWORD_MIN} characters`} />
        <PasswordField label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={Boolean(show('confirm'))} helperText={show('confirm')} />
      </Box>
      {error && <Alert severity="error" sx={s.submit}>{error}</Alert>}
      <Button type="submit" fullWidth size="large" variant="contained" sx={s.submit} disabled={busy}
        endIcon={busy ? <CircularProgress size={18} color="inherit" /> : <ArrowRight size={18} />}>
        {busy ? 'Creating account…' : 'Create account & continue'}
      </Button>
    </Box>
  );
}

export default function Login() {
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('loading'); // loading | setup | login | error
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSetupStatus()
      .then((res) => { if (active) setView(res?.needsSetup ? 'setup' : 'login'); })
      .catch((err) => { if (active) { setError(err.message); setView('error'); } });
    return () => { active = false; };
  }, []);

  const done = (user) => {
    const from = location.state?.from;
    navigate(from && from !== '/login' ? from : homePathFor(user), { replace: true });
  };

  return (
    <Box component="main" sx={s.root}>
      <Hero />
      <Box sx={s.panel}>
        <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
          <IconButton sx={s.themeToggle} onClick={toggleMode} aria-label="Toggle color theme">
            {mode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>
        </Tooltip>

        <Box sx={s.card}>
          <Box sx={s.mobileBrand}>
            <Box sx={sidebar.brandMark}><Sparkles size={20} /></Box>
            <Box>
              <Typography variant="h3" sx={text.gradient}>ProFeed</Typography>
              <Typography variant="caption" color="text.secondary">Performance & project feedback</Typography>
            </Box>
          </Box>

          {view === 'loading' && <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}><CircularProgress /></Box>}
          {view === 'setup' && <SetupForm onDone={done} />}
          {view === 'login' && <SignInForm onDone={done} />}
          {view === 'error' && <Alert severity="error">{error}</Alert>}
        </Box>
      </Box>
    </Box>
  );
}
