import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ArrowRight, ClipboardList, RotateCcw, Save, Sparkles, Star } from 'lucide-react';
import DimensionRating from '../../components/review/DimensionRating.jsx';
import { Pill, SectionCard } from '../../components/common/index.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CORE_DIMENSIONS, FLAGS, PROJECT_DURATIONS, REVIEWERS, REVIEW_PERIODS } from '../../data/seed.js';
import { avg, f1, findUser, ratingLabel } from '../../data/selectors.js';
import { analyzeFeedback } from '../../services/api.js';
import { form, grid, text } from '../../styles/common.js';
import { feedback as s } from '../../styles/pages.js';

const DRAFT_KEY = 'profeed-review-draft';
const EMPTY = [0, 0, 0, 0];
const clampScore = (n) => (typeof n === 'number' ? Math.max(1, Math.min(5, Math.round(n))) : null);

function readDraft() {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}

export default function CreateReviewForm({ preset, injectedQuote, onQuoteConsumed, onSubmitted }) {
  const { users, projects, addReview, settings } = useData();
  const { user } = useAuth();
  const { notify } = useToast();
  const draft = useMemo(readDraft, []);

  const [userId, setUserId] = useState(preset?.userId || draft?.userId || 3);
  const [projectId, setProjectId] = useState(preset?.projectId || draft?.projectId || '');
  const [duration, setDuration] = useState(draft?.duration || PROJECT_DURATIONS[0]);
  const [period, setPeriod] = useState(draft?.period || REVIEW_PERIODS[0]);
  const [by, setBy] = useState(draft?.by || REVIEWERS[0]);
  const [role, setRole] = useState(draft?.role || findUser(users, preset?.userId || 3).t);
  const [scores, setScores] = useState(draft?.scores || EMPTY);
  const [flags, setFlags] = useState(draft?.flags || []);
  const [rationale, setRationale] = useState(draft?.rationale || '');
  const [growth, setGrowth] = useState(draft?.growth || '');
  const [perspective, setPerspective] = useState(draft?.perspective || '');
  const [discussed, setDiscussed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState({ status: 'idle', result: null, error: '' });

  const memberProjects = useMemo(() => projects.filter((p) => p.t.includes(userId)), [projects, userId]);

  useEffect(() => {
    if (preset?.userId) {
      setUserId(preset.userId);
      setRole(findUser(users, preset.userId).t);
      setProjectId(preset.projectId || projects.find((p) => p.t.includes(preset.userId))?.id || '');
    }
  }, [preset, users, projects]);

  useEffect(() => {
    if (!projectId || !memberProjects.some((p) => p.id === projectId)) setProjectId(memberProjects[0]?.id || '');
  }, [memberProjects, projectId]);

  useEffect(() => {
    if (!injectedQuote) return;
    setRationale((cur) => (cur.includes(injectedQuote) ? cur : `${cur ? `${cur}\n` : ''}• “${injectedQuote}”`));
    onQuoteConsumed?.();
  }, [injectedQuote, onQuoteConsumed]);

  const rated = scores.filter(Boolean);
  const overall = rated.length ? avg(rated) : 0;
  const suggestions = ai.result ? [ai.result.delivery, ai.result.overallRating, ai.result.collaboration, ai.result.overallRating]
    .map((x) => (x ? { score: clampScore(x.score), rationale: x.rationale } : null)) : [];

  const changeUser = (id) => { setUserId(id); setRole(findUser(users, id).t); };
  const setScore = (i, v) => setScores((cur) => cur.map((x, j) => (j === i ? v : x)));

  function reset() {
    setScores(EMPTY); setFlags([]); setRationale(''); setGrowth(''); setPerspective(''); setDiscussed(false);
    setError(''); setAi({ status: 'idle', result: null, error: '' });
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    notify('Review form reset.', 'info');
  }

  function saveDraft() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ userId, projectId, duration, period, by, role, scores, flags, rationale, growth, perspective }));
      notify('Draft saved in this browser tab.', 'info');
    } catch {
      notify('Could not save the draft in this browser.', 'warning');
    }
  }

  async function suggest() {
    if (rationale.trim().length < 12 && growth.trim().length < 12) {
      setAi({ status: 'error', result: null, error: 'Write a rationale or growth actions first — AI only reads that text.' });
      return;
    }
    setAi({ status: 'loading', result: null, error: '' });
    try {
      const result = await analyzeFeedback({ strengths: rationale.trim(), developmentAreas: growth.trim() });
      setAi({ status: 'done', result, error: '' });
    } catch (err) {
      setAi({ status: 'error', result: null, error: err.message });
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!projectId) return setError('Choose a project this person is assigned to.');
    if (scores.some((v) => !v)) return setError('Rate all four dimensions before submitting.');
    if (rationale.trim().length < 12) return setError('Add a rationale with at least one concrete example (12+ characters).');
    if (settings?.safeguardRequired && rationale.includes('“') && !discussed) {
      return setError('Review settings require confirming the evidence context and discussion before submitting AI-sourced quotes.');
    }
    setSaving(true);
    setError('');
    try {
      const note = [rationale.trim(), growth.trim() && `Growth actions: ${growth.trim()}`].filter(Boolean).join('\n\n');
      await addReview({
        review: { p: projectId, u: userId, by, s: scores, f: flags, note },
        meta: { period: period.split(' — ')[0], duration, role, reviewer: user?.name, employeeComment: perspective.trim(), discussed },
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      notify(`Review submitted for ${findUser(users, userId).n}. Awaiting employee response.`);
      setScores(EMPTY); setFlags([]); setRationale(''); setGrowth(''); setPerspective(''); setDiscussed(false);
      setAi({ status: 'idle', result: null, error: '' });
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="form" onSubmit={submit} noValidate sx={form.section}>
      <SectionCard title="Review details" subtitle="Choose the person, project and review period." icon={ClipboardList} action={<Pill>Draft review</Pill>}>
        <Box sx={form.section}>
          <Box sx={grid.form2}>
            <TextField select label="Employee" value={userId} onChange={(e) => changeUser(Number(e.target.value))} fullWidth>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.n} — {u.t}</MenuItem>)}
            </TextField>
            <TextField select label="Project" value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} fullWidth
              helperText={memberProjects.length ? `${memberProjects.length} assigned project(s)` : 'Not assigned to any project'}>
              {memberProjects.map((p) => <MenuItem key={p.id} value={p.id}>{p.n} · {p.c}</MenuItem>)}
            </TextField>
            <TextField select label="Project duration" value={duration} onChange={(e) => setDuration(e.target.value)} fullWidth>
              {PROJECT_DURATIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField select label="Review period" value={period} onChange={(e) => setPeriod(e.target.value)} fullWidth>
              {REVIEW_PERIODS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField select label="Reviewer" value={by} onChange={(e) => setBy(e.target.value)} fullWidth>
              {REVIEWERS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
            <TextField label="Role on project" value={role} onChange={(e) => setRole(e.target.value.slice(0, 80))} fullWidth />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {duration === PROJECT_DURATIONS[0] ? 'Long-running project: quarterly reviews plus a final review at completion.' : 'Short engagement: a single closure review is usually enough.'}
          </Typography>
        </Box>
      </SectionCard>

      <SectionCard title="Performance rating" subtitle="Rate demonstrated outcomes for this period." icon={Star} action={<Pill tone="primary">1–5 scale</Pill>}>
        <Box sx={form.section}>
          <Box display="flex" flexDirection="column" gap={1.25}>
            {CORE_DIMENSIONS.map((dim, i) => (
              <DimensionRating key={dim.id} dimension={dim} value={scores[i]} onChange={(v) => setScore(i, v)} suggestion={suggestions[i]} />
            ))}
          </Box>

          <Box sx={s.overall(overall > 0)}>
            <Box sx={s.overallBadge}>{overall ? f1(overall) : '—'}</Box>
            <Box>
              <Typography variant="subtitle2">{overall ? `Overall ${f1(overall)} / 5 · ${ratingLabel(overall)}` : 'Overall rating pending'}</Typography>
              <Typography variant="caption" color="text.secondary">Average of rated dimensions — a structured discussion aid, not an automatic decision.</Typography>
            </Box>
          </Box>

          <TextField label="Manager rationale & examples" multiline minRows={4} value={rationale} onChange={(e) => setRationale(e.target.value.slice(0, 1000))} fullWidth
            placeholder="Describe specific outcomes, examples and the context behind your ratings…"
            helperText={`Use observable behaviours and project outcomes. ${rationale.length}/1000`} />
          <TextField label="Agreed growth actions" multiline minRows={3} value={growth} onChange={(e) => setGrowth(e.target.value.slice(0, 600))} fullWidth
            placeholder="e.g. lead the next client demo; pair with a senior engineer on solution design…" />

          <Box sx={s.aiBox}>
            <Box sx={s.aiHead}>
              <Box>
                <Typography variant="subtitle2" display="flex" alignItems="center" gap={0.75}><Sparkles size={15} /> AI rating suggestions</Typography>
                <Typography variant="caption" color="text.secondary">Reads only the rationale and growth text. Suggestions are advisory — you decide.</Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={suggest} disabled={ai.status === 'loading'}
                startIcon={ai.status === 'loading' ? <CircularProgress size={14} /> : <Sparkles size={14} />}>
                {ai.status === 'loading' ? 'Analyzing…' : 'Suggest ratings'}
              </Button>
            </Box>
            {ai.status === 'done' && <Alert severity="info">{ai.result.summary || 'Suggestions ready — tap an “AI” chip to apply.'}</Alert>}
            {ai.status === 'error' && <Alert severity="warning">{ai.error} Manual rating is still available.</Alert>}
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={text.label}>Delivery flags</Typography>
            <Box sx={s.flagGrid}>
              {FLAGS.map((flag) => (
                <FormControlLabel key={flag} label={<Typography variant="body2">{flag}</Typography>}
                  control={<Checkbox size="small" checked={flags.includes(flag)} onChange={(e) => setFlags((cur) => (e.target.checked ? [...cur, flag] : cur.filter((x) => x !== flag)))} />} />
              ))}
            </Box>
          </Box>

          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={1}>
              <Typography variant="h4">Employee perspective</Typography>
              <Pill tone="success">Recommended</Pill>
            </Box>
            <TextField label="Employee comments / self-reflection" multiline minRows={3} value={perspective} onChange={(e) => setPerspective(e.target.value.slice(0, 1000))} fullWidth
              placeholder="Achievements, constraints, context or disagreement with the feedback…" />
          </Box>

          <Box sx={form.checkRow}>
            <Checkbox size="small" checked={discussed} onChange={(e) => setDiscussed(e.target.checked)} inputProps={{ 'aria-label': 'Feedback discussed' }} />
            <Typography variant="body2" color="text.secondary">Feedback has been discussed with the employee and their perspective considered.</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={form.actions}>
            <Button variant="text" color="inherit" startIcon={<RotateCcw size={16} />} onClick={reset} disabled={saving}>Reset</Button>
            <Box sx={form.actionGroup}>
              <Button variant="outlined" startIcon={<Save size={16} />} onClick={saveDraft} disabled={saving}>Save draft</Button>
              <Button type="submit" variant="contained" disabled={saving}
                endIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}>
                {saving ? 'Submitting…' : 'Submit for employee review'}
              </Button>
            </Box>
          </Box>
        </Box>
      </SectionCard>
    </Box>
  );
}
