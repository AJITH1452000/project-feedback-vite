import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ArrowRight, Briefcase, Eye, EyeOff, Info, Moon, Quote, Sparkles, Star, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useThemeMode } from '../../context/ThemeModeContext.jsx';
import { homePathFor } from '../../config/navigation.js';
import { MANAGER, PROJECTS, SEED_REVIEWS, USERS } from '../../data/seed.js';
import { isDemoMode } from '../../services/api.js';
import { UserAvatar } from '../../components/common/index.jsx';
import { login as s } from '../../styles/login.js';
import { sidebar } from '../../styles/layout.js';
import { text } from '../../styles/common.js';

const PERSONAS = [
  { role: 'manager', userId: null, name: MANAGER.n, title: 'Project manager · full access' },
  { role: 'employee', userId: 3, name: 'Priya Sharma', title: 'Delivery lead' },
  { role: 'employee', userId: 1, name: 'Karthik R.', title: 'Tech lead' },
  { role: 'employee', userId: 4, name: 'Arun Kumar', title: 'Backend developer' },
];

const ROLES = [
  { value: 'manager', label: 'Manager', hint: 'Full access to teams & reviews', icon: Briefcase },
  { value: 'employee', label: 'Employee', hint: 'View your own feedback', icon: UserRound },
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
          <Typography variant="caption" sx={s.heroMuted}>Project feedback system</Typography>
        </Box>
      </Box>

      <Box sx={s.heroCopy}>
        <Typography variant="overline" component="div" sx={s.kicker}><Sparkles size={14} /> Better teams start here</Typography>
        <Typography variant="display" sx={s.heroTitle}>
          Make every review <Box component="span" sx={s.heroAccent}>count.</Box>
        </Typography>
        <Typography sx={s.heroText}>
          Continuous, work-based ratings and delivery feedback for developers across every client project — transparent, fair and evidence-led.
        </Typography>
        <Box sx={s.heroQuote}>
          <Box sx={s.heroStars}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</Box>
          <Typography sx={s.heroQuoteText}><Quote size={14} /> {SEED_REVIEWS[4].note}</Typography>
          <Typography variant="caption" sx={s.heroMuted}>Project manager · Customer Portal</Typography>
        </Box>
      </Box>

      <Box sx={s.heroStats}>
        {(isDemoMode
          ? [[PROJECTS.length, 'Active projects'], [USERS.length, 'Team members'], [SEED_REVIEWS.length, 'Reviews logged']]
          : [['4', 'Rubric dimensions'], ['1–5', 'Rating scale'], ['Live', 'Real-time updates']]
        ).map(([value, label]) => (
          <Box key={label} sx={s.heroStat}>
            <Typography variant="kpi" sx={s.heroStatValue}>{value}</Typography>
            <Typography variant="caption" component="div" sx={s.heroMuted}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('manager');
  const [userId, setUserId] = useState(4);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function signIn(credentials, key) {
    setBusy(key);
    setError('');
    try {
      const user = await login(credentials);
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : homePathFor(user), { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
      setBusy(null);
    }
  }

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
              <Typography variant="caption" color="text.secondary">Project feedback system</Typography>
            </Box>
          </Box>

          <Box sx={s.cardHead}>
            <Typography variant="h2" sx={s.cardTitle}>Welcome back 👋</Typography>
            <Typography variant="body2" sx={s.cardSub}>Sign in to your feedback workspace.</Typography>
          </Box>

          {!isDemoMode ? (
            <Box component="form" noValidate onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
              signIn({ email: email.trim(), password }, 'form');
            }}>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Work email" type="email" autoComplete="username" autoFocus fullWidth value={email}
                  onChange={(e) => setEmail(e.target.value)} />
                <TextField label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" fullWidth value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ) }} />
              </Box>
              <Button
                type="submit" fullWidth size="large" variant="contained" sx={s.submit} disabled={Boolean(busy)}
                endIcon={busy === 'form' ? <CircularProgress size={18} color="inherit" /> : <ArrowRight size={18} />}
              >
                {busy === 'form' ? 'Signing in…' : 'Sign in'}
              </Button>
            </Box>
          ) : (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); signIn({ role, userId: role === 'employee' ? userId : null }, 'form'); }}>
            <Typography variant="subtitle2" component="div" sx={text.label}>Access level</Typography>
            <Box sx={s.roleGrid} role="radiogroup" aria-label="Access level">
              {ROLES.map(({ value, label, hint, icon: Icon }) => {
                const active = role === value;
                return (
                  <Box key={value} component="button" type="button" role="radio" aria-checked={active} sx={s.roleOption(active)} onClick={() => setRole(value)}>
                    <Box sx={s.roleIcon(active)}><Icon size={17} /></Box>
                    <Box>
                      <Typography variant="subtitle2">{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{hint}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {role === 'employee' && (
              <TextField select fullWidth label="Employee profile" value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
                {USERS.map((u) => <MenuItem key={u.id} value={u.id}>{u.n} — {u.t} ({u.r})</MenuItem>)}
              </TextField>
            )}

            <Button
              type="submit" fullWidth size="large" variant="contained" sx={s.submit} disabled={Boolean(busy)}
              endIcon={busy === 'form' ? <CircularProgress size={18} color="inherit" /> : <ArrowRight size={18} />}
            >
              {busy === 'form' ? 'Signing in…' : 'Enter workspace'}
            </Button>
          </Box>
          )}

          {error && <Alert severity="error" sx={s.submit}>{error}</Alert>}

          {isDemoMode && (
            <>
              <Typography variant="overline" component="div" sx={s.dividerRow}>Quick demo sign in</Typography>
              <Box sx={s.personaGrid}>
                {PERSONAS.map((p) => {
                  const key = `${p.role}-${p.userId}`;
                  return (
                    <Button key={key} sx={s.persona} disabled={Boolean(busy)} onClick={() => signIn({ role: p.role, userId: p.userId }, key)}>
                      {busy === key ? <CircularProgress size={28} /> : <UserAvatar name={p.name} size={32} />}
                      <Box sx={s.personaText}>
                        <Typography variant="subtitle2" noWrap>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap component="div">{p.title}</Typography>
                      </Box>
                    </Button>
                  );
                })}
              </Box>
              <Box sx={s.notice}>
                <Box sx={s.noticeIcon}><Info size={16} /></Box>
                <Typography variant="caption">
                  <strong>Demo mode:</strong> sample data in this browser tab. Set <Box component="code" sx={text.code}>VITE_API_URL</Box> to connect the real backend.
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
