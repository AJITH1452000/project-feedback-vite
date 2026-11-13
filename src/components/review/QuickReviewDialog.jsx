/**
 * "Submit project feedback" — opened by "Rate developer" / "Rate" buttons.
 *
 * Flow: write the evidence → AI analyses it and fills the overall rating plus delivery/collaboration
 * ratings → the manager reviews and edits anything → submit. Manual edits are never overwritten;
 * the AI suggestion is stored alongside the final rating for transparency.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Info, PencilLine, RefreshCw, Send, Sparkles, Star, X } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FEEDBACK_VISIBILITY, QUALITY_LEVELS, RATING_PRINCIPLES, REVIEW_TYPES } from '../../data/seed.js';
import { f1, findUser } from '../../data/selectors.js';
import { analyzeFeedback } from '../../services/api.js';
import { dialog, grid } from '../../styles/common.js';
import { ratingTone, submitFeedback as s } from '../../styles/pages.js';

const MIN_TEXT = 20; // characters of evidence before AI analyses automatically
const PRIVATE = 'Private draft (manager only)';

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const qualityFor = (score) => (score >= 4 ? 'Exceeds expectations' : score >= 3 ? 'Meets expectations' : 'Needs improvement');
/** 4 → "Exceeds expectations", 3.5 → "Meets expectations +" (half steps never round up a label). */
const labelFor = (score) => {
  const label = RATING_PRINCIPLES.find((r) => r.level === Math.max(1, Math.floor(score)))?.label;
  return score % 1 ? `${label} +` : label;
};

const emptyForm = (userId, projectId) => ({
  u: userId || '', p: projectId || '', type: REVIEW_TYPES[0], period: '',
  overall: 0, delivery: 'Meets expectations', collaboration: 'Meets expectations',
  strengths: '', development: '', comment: '', nextDate: '', visibility: FEEDBACK_VISIBILITY[0],
});
const NO_EDITS = { overall: false, delivery: false, collaboration: false };

export default function QuickReviewDialog({ open, onClose, initialUserId, initialProjectId }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { users, projects, addQuickReview } = useData();
  const { notify } = useToast();
  const [form, setForm] = useState(() => emptyForm(initialUserId, initialProjectId));
  const [edited, setEdited] = useState(NO_EDITS);
  const [ai, setAi] = useState({ status: 'idle', result: null, error: '' }); // idle | analyzing | done | error
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editedRef = useRef(edited);
  editedRef.current = edited;

  useEffect(() => {
    if (!open) return;
    const projectId = initialProjectId || (initialUserId ? projects.find((p) => p.t.includes(initialUserId))?.id : '') || '';
    setForm(emptyForm(initialUserId, projectId));
    setEdited(NO_EDITS);
    setAi({ status: 'idle', result: null, error: '' });
    setError('');
  }, [open, initialUserId, initialProjectId, projects]);

  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));
  const memberProjects = useMemo(() => projects.filter((p) => p.t.includes(form.u)), [projects, form.u]);
  const isQuarterly = form.type === 'Quarterly review';
  const changeEmployee = (u) => setForm((cur) => ({ ...cur, u, p: projects.find((p) => p.t.includes(u))?.id || '' }));

  /* ------------------------------ AI analysis ------------------------------ */
  const applyResult = useCallback((result) => {
    const e = editedRef.current;
    setForm((cur) => ({
      ...cur,
      overall: !e.overall && result.overallRating?.score ? result.overallRating.score : cur.overall,
      delivery: !e.delivery && result.delivery?.score ? qualityFor(result.delivery.score) : cur.delivery,
      collaboration: !e.collaboration && result.collaboration?.score ? qualityFor(result.collaboration.score) : cur.collaboration,
    }));
  }, []);

  const runAnalysis = useCallback(async (strengths, development, signal) => {
    setAi((cur) => ({ ...cur, status: 'analyzing', error: '' }));
    try {
      const result = await analyzeFeedback({ strengths: strengths.trim(), developmentAreas: development.trim() }, { signal });
      setAi({ status: 'done', result, error: '' });
      applyResult(result);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setAi({ status: 'error', result: null, error: err.message || 'Analysis failed.' });
    }
  }, [applyResult]);

  // Analyse automatically ~1s after the manager stops typing evidence.
  useEffect(() => {
    if (!open || form.strengths.trim().length < MIN_TEXT) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => runAnalysis(form.strengths, form.development, controller.signal), 1000);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, form.strengths, form.development, runAnalysis]);

  const reanalyze = () => {
    setEdited(NO_EDITS);
    editedRef.current = NO_EDITS;
    runAnalysis(form.strengths, form.development);
  };
  const useAiOverall = () => {
    setEdited((cur) => ({ ...cur, overall: false }));
    set('overall', ai.result.overallRating.score);
  };
  const editField = (key, value) => {
    setEdited((cur) => ({ ...cur, [key]: true }));
    set(key, value);
  };

  const aiScore = ai.result?.overallRating?.score ?? null;
  const tone = ratingTone(form.overall);
  const aiState = ai.status === 'analyzing' ? 'analyzing' : ai.status === 'error' ? 'error'
    : ai.result ? (edited.overall && form.overall !== aiScore ? 'edited' : 'ai') : 'idle';
  const sourceText = ai.result?.source === 'openai' ? 'AI' : 'Built-in analysis';

  /* -------------------------------- Submit -------------------------------- */
  async function submit(event) {
    event.preventDefault();
    if (!form.u) return setError('Select an employee.');
    if (!form.p) return setError('Select a project this employee is assigned to.');
    if (form.period.trim().length < 2) return setError('Enter the review period, e.g. Q3 2026 or Project closure.');
    if (form.strengths.trim().length < 12) return setError('Add strengths / evidence (at least 12 characters) — what went well, with an example.');
    if (!form.overall) return setError('Set an overall rating — let AI suggest one from your evidence, or tap the stars.');
    if (isQuarterly && form.nextDate && form.nextDate < localToday()) return setError('Next review date cannot be in the past.');
    setSaving(true);
    setError('');
    try {
      await addQuickReview({
        ...form,
        period: form.period.trim(), strengths: form.strengths.trim(), development: form.development.trim(), comment: form.comment.trim(),
        nextDate: isQuarterly && form.nextDate ? form.nextDate : null,
        ai: ai.result ? { rating: aiScore, source: ai.result.source || 'heuristic', confidence: ai.result.overallRating?.confidence || 'low' } : null,
      });
      notify(form.visibility === PRIVATE ? 'Saved as a private draft — only managers can see it.' : `Feedback submitted for ${findUser(users, form.u).n}.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const AiTag = ({ field }) => (ai.result && !edited[field] ? <Box component="span" sx={s.fieldTag}>AI</Box> : null);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby="submit-feedback-title">
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle id="submit-feedback-title" sx={dialog.title} component="div">
          <Box>
            <Typography variant="h3">Submit project feedback</Typography>
            <Typography variant="body2" sx={dialog.subtitle}>Write the evidence — AI suggests the ratings — you review and adjust.</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={saving}><X size={18} /></IconButton>
        </DialogTitle>

        <DialogContent sx={dialog.content}>
          {/* 1 · Who and when */}
          <Box sx={grid.form2}>
            <TextField select label="Employee" value={form.u} onChange={(e) => changeEmployee(Number(e.target.value))} fullWidth
              SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
              <MenuItem value="" disabled>Select employee</MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.n} — {u.t}</MenuItem>)}
            </TextField>
            <TextField select label="Project" value={form.p} onChange={(e) => set('p', Number(e.target.value))} fullWidth disabled={!form.u}
              SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}
              helperText={form.u && !memberProjects.length ? 'This employee is not assigned to any project' : undefined}>
              <MenuItem value="" disabled>{form.u ? 'Select project' : 'Select an employee first'}</MenuItem>
              {memberProjects.map((p) => <MenuItem key={p.id} value={p.id}>{p.n} · {p.c}</MenuItem>)}
            </TextField>
            <TextField select label="Review type" value={form.type} onChange={(e) => set('type', e.target.value)} fullWidth>
              {REVIEW_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Review period" value={form.period} onChange={(e) => set('period', e.target.value.slice(0, 80))} fullWidth
              placeholder="e.g. Q3 2026 or Project closure" InputLabelProps={{ shrink: true }} />
          </Box>

          {/* 2 · Evidence (drives the AI) */}
          <TextField label="Strengths / evidence" multiline minRows={3} value={form.strengths} fullWidth required
            onChange={(e) => set('strengths', e.target.value.slice(0, 1600))} InputLabelProps={{ shrink: true }}
            placeholder="What went well? Include examples, outcomes, and impact."
            helperText={form.strengths.trim().length < MIN_TEXT
              ? `AI suggests ratings once you write ${MIN_TEXT}+ characters · ${form.strengths.length}/1600`
              : `${form.strengths.length}/1600`} />
          <TextField label="Development areas / next steps" multiline minRows={2} value={form.development} fullWidth
            onChange={(e) => set('development', e.target.value.slice(0, 1600))} InputLabelProps={{ shrink: true }}
            placeholder="What could be improved? Add a practical action or support needed." />

          {/* 3 · Rating (AI-suggested, manager-editable) */}
          <Box sx={s.ratingCard(tone)}>
            <Box sx={s.ratingHead}>
              <Typography variant="subtitle2">Overall performance rating</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {aiState === 'analyzing' && <Box component="span" sx={s.aiChip('ai')}><CircularProgress size={11} color="inherit" /> Analysing evidence…</Box>}
                {aiState === 'ai' && <Box component="span" sx={s.aiChip('ai')}><Sparkles size={12} /> {sourceText} suggestion</Box>}
                {aiState === 'edited' && <Box component="span" sx={s.aiChip('edited')}><PencilLine size={12} /> Edited by you</Box>}
                {aiState === 'error' && <Box component="span" sx={s.aiChip('error')}>Analysis unavailable</Box>}
                <Button size="small" sx={s.linkBtn} startIcon={<RefreshCw size={13} />} onClick={reanalyze}
                  disabled={form.strengths.trim().length < 12 || ai.status === 'analyzing'}>
                  {ai.result ? 'Re-analyse' : 'Analyse now'}
                </Button>
              </Box>
            </Box>

            <Box sx={s.ratingBody}>
              <Box sx={s.valueBox(tone)} aria-live="polite">
                <Typography component="span" sx={s.valueNumber}>{form.overall ? f1(form.overall) : '–'}</Typography>
                <Typography variant="caption" sx={s.valueScale}>out of 5</Typography>
              </Box>
              <Box sx={s.ratingMain}>
                <Typography variant="h4" sx={s.ratingLabel(tone)}>{form.overall ? labelFor(form.overall) : 'Not rated yet'}</Typography>
                <Rating
                  name="overall-rating" value={form.overall || null} precision={0.5} sx={s.stars}
                  icon={<Star fill="currentColor" size="1em" />} emptyIcon={<Star size="1em" />}
                  onChange={(_, value) => editField('overall', value || 0)}
                  getLabelText={(v) => `${v} of 5`}
                />
                <Box sx={s.aiLine}>
                  {aiScore !== null && edited.overall && form.overall !== aiScore ? (
                    <>
                      <Typography variant="caption">{sourceText} suggested <b>{f1(aiScore)}</b> ({ai.result.overallRating.confidence} confidence)</Typography>
                      <Button size="small" sx={s.linkBtn} onClick={useAiOverall}>Use suggestion</Button>
                    </>
                  ) : (
                    <Typography variant="caption">
                      {ai.result ? `${ai.result.overallRating.confidence} confidence · tap the stars to adjust (half stars allowed)`
                        : 'Write the evidence above and a rating is suggested automatically — or tap the stars yourself.'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {ai.result && (
              <Box sx={s.aiNote}>
                <Box sx={s.aiNoteIcon}><Sparkles size={14} /></Box>
                <Box>
                  <Typography variant="caption" display="block">{ai.result.overallRating?.rationale}</Typography>
                  <Typography variant="caption" display="block" mt={0.5}>{ai.result.summary} Suggestions are advisory — you make the final call.</Typography>
                </Box>
              </Box>
            )}
            {ai.status === 'error' && <Alert severity="warning">{ai.error} You can still rate manually.</Alert>}

            <Box sx={grid.form2}>
              <TextField select value={form.delivery} onChange={(e) => editField('delivery', e.target.value)} fullWidth
                label={<>Delivery & quality<AiTag field="delivery" /></>}
                helperText={ai.result && !edited.delivery ? ai.result.delivery?.rationale : undefined}>
                {QUALITY_LEVELS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
              </TextField>
              <TextField select value={form.collaboration} onChange={(e) => editField('collaboration', e.target.value)} fullWidth
                label={<>Collaboration & communication<AiTag field="collaboration" /></>}
                helperText={ai.result && !edited.collaboration ? ai.result.collaboration?.rationale : undefined}>
                {QUALITY_LEVELS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
              </TextField>
            </Box>
          </Box>

          {/* 4 · Follow-up */}
          <TextField label="Employee comments (optional)" multiline minRows={2} value={form.comment} fullWidth
            onChange={(e) => set('comment', e.target.value.slice(0, 1000))} InputLabelProps={{ shrink: true }}
            placeholder="Employee perspective, context, or response to feedback." />
          <Box sx={grid.form2}>
            <TextField label="Next review date (for quarterly reviews)" type="date" value={isQuarterly ? form.nextDate : ''} fullWidth
              onChange={(e) => set('nextDate', e.target.value)} disabled={!isQuarterly} InputLabelProps={{ shrink: true }}
              inputProps={{ min: localToday() }} helperText={isQuarterly ? undefined : 'Only used for quarterly reviews'} />
            <TextField select label="Feedback visibility" value={form.visibility} onChange={(e) => set('visibility', e.target.value)} fullWidth
              helperText={form.visibility === PRIVATE ? 'The employee will not see this or be notified' : undefined}>
              {FEEDBACK_VISIBILITY.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
            </TextField>
          </Box>

          <Box sx={s.workflow}>
            <Box sx={s.workflowIcon}><Info size={17} /></Box>
            <Typography variant="body2">
              Suggested workflow: manager submits feedback → employee acknowledges and adds comments → discussion if needed → HR can view the review history.
              Ratings should be evidence-based and not the sole input to annual decisions.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>

        <DialogActions sx={dialog.actions}>
          <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}>
            {saving ? 'Submitting…' : 'Submit feedback'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
