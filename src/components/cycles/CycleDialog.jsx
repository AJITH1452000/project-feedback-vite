/**
 * Create / edit an appraisal cycle (HR/Admin).
 * Step 1 of the process: period, timelines and eligible employees.
 * Step 2: goal-setting framework — categories, weightages, rating scale and instructions.
 * Once a cycle is published, the name, start date and framework rules are locked (goals exist against them).
 */
import { useEffect, useMemo, useState } from 'react';
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
import { CalendarRange, Save, SlidersHorizontal, X } from 'lucide-react';
import { useSaveCycle } from '../../hooks/queries/cycles.js';
import { useToast } from '../../context/ToastContext.jsx';
import { DEPARTMENT_OPTIONS } from '../../data/constants.js';
import { cleanCycle, cycleProblems, newCycleTemplate } from '../../data/cycles.js';
import { dialog, grid } from '../../styles/common.js';
import { cycles as s } from '../../styles/pages.js';

const copy = (c) => JSON.parse(JSON.stringify(c));

export default function CycleDialog({ open, cycle, existing, departments, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const save = useSaveCycle();
  const { notify } = useToast();
  const [form, setForm] = useState(() => copy(cycle || newCycleTemplate(existing)));
  const [touched, setTouched] = useState(false);
  const locked = cycle?.status === 'Open';

  useEffect(() => {
    if (open) { setForm(copy(cycle || newCycleTemplate(existing))); setTouched(false); save.reset(); }
  }, [open, cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const deptOptions = useMemo(() => [...new Set([...DEPARTMENT_OPTIONS, ...departments])].sort(), [departments]);
  const problems = cycleProblems({ ...cleanCycle(form), id: cycle?.id }, existing);
  const err = (k) => (touched && problems[k]) || '';
  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));
  const setF = (key, value) => setForm((cur) => ({ ...cur, framework: { ...cur.framework, [key]: value } }));
  const setScale = (i, value) => setF('scale', form.framework.scale.map((x, j) => (j === i ? value : x)));
  const num = (v) => (v === '' ? '' : Number(v));

  function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(problems).length) return;
    save.mutate({ id: cycle?.id, input: cleanCycle(form) }, {
      onSuccess: () => { notify(cycle ? 'Cycle updated.' : 'Cycle created as a draft. Publish it to open goal setting.'); onClose(); },
    });
  }

  const dateField = (key, label, extra = {}) => (
    <TextField type="date" label={label} value={form[key] || ''} onChange={(e) => set(key, e.target.value)} fullWidth
      InputLabelProps={{ shrink: true }} error={Boolean(err(key))} helperText={err(key) || extra.helper} disabled={extra.disabled} />
  );

  return (
    <Dialog open={open} onClose={save.isPending ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby="cycle-title">
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle id="cycle-title" sx={dialog.title} component="div">
          <Box>
            <Typography variant="h3">{cycle ? `Edit ${cycle.period}` : 'Initiate appraisal cycle'}</Typography>
            <Typography variant="body2" sx={dialog.subtitle}>
              {locked ? 'This cycle is open: you can adjust timelines, eligibility and instructions.' : 'Saved as a draft — employees see it only after you publish.'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={save.isPending}><X size={18} /></IconButton>
        </DialogTitle>

        <DialogContent sx={dialog.content}>
          {/* 1 · Initiate */}
          <Box sx={s.formSection}>
            <Typography variant="subtitle2" display="flex" alignItems="center" gap={1}><CalendarRange size={16} /> 1 · Appraisal period, timelines and eligible employees</Typography>
            <Box sx={grid.form2}>
              <TextField label="Appraisal period name" value={form.period} onChange={(e) => set('period', e.target.value)} fullWidth disabled={locked}
                placeholder="e.g. Q1 2027 or Annual 2027" error={Boolean(err('period'))} helperText={err('period')} />
              <Autocomplete multiple options={deptOptions} value={form.depts} onChange={(_, v) => set('depts', v)} disableCloseOnSelect
                renderTags={(value, getTagProps) => value.map((d, i) => { const { key, ...p } = getTagProps({ index: i }); return <Chip key={key} {...p} size="small" label={d} />; })}
                renderInput={(params) => <TextField {...params} label="Eligible departments" placeholder={form.depts.length ? '' : 'All departments'}
                  helperText={form.depts.length ? undefined : 'Leave empty to include every employee'} />} />
            </Box>
            <Box sx={grid.form2}>
              {dateField('start', 'Period starts', { disabled: locked })}
              {dateField('end', 'Period ends')}
              {dateField('goalDeadline', 'Goal-setting deadline', { helper: 'Employees submit goals by this date' })}
              {dateField('selfStart', 'Self-appraisal opens')}
              {dateField('selfDeadline', 'Self-appraisal deadline')}
            </Box>
          </Box>

          {/* 2 · Framework */}
          <Box sx={s.formSection}>
            <Typography variant="subtitle2" display="flex" alignItems="center" gap={1}><SlidersHorizontal size={16} /> 2 · Goal-setting framework</Typography>
            {locked && <Alert severity="info">Categories, weightage rules and the rating scale are locked once the cycle is published. Instructions can still change.</Alert>}
            <Autocomplete multiple freeSolo options={[]} value={form.framework.categories} onChange={(_, v) => setF('categories', v)} disabled={locked}
              renderTags={(value, getTagProps) => value.map((c, i) => { const { key, ...p } = getTagProps({ index: i }); return <Chip key={key} {...p} size="small" label={c} />; })}
              renderInput={(params) => <TextField {...params} label="Goal categories" placeholder="Type a category and press Enter"
                error={Boolean(err('categories'))} helperText={err('categories') || 'Employees pick one category per goal'} />} />
            <Box sx={s.formGrid3}>
              <TextField type="number" label="Min weight per goal (%)" value={form.framework.minWeight} onChange={(e) => setF('minWeight', num(e.target.value))}
                disabled={locked} error={Boolean(err('minWeight'))} helperText={err('minWeight')} inputProps={{ min: 1, max: 50 }} />
              <TextField type="number" label="Max weight per goal (%)" value={form.framework.maxWeight} onChange={(e) => setF('maxWeight', num(e.target.value))}
                disabled={locked} error={Boolean(err('maxWeight'))} helperText={err('maxWeight')} inputProps={{ min: 1, max: 100 }} />
              <TextField type="number" label="Max goals per employee" value={form.framework.maxGoals} onChange={(e) => setF('maxGoals', num(e.target.value))}
                disabled={locked} error={Boolean(err('maxGoals'))} helperText={err('maxGoals') || 'Total weightage is always 100%'} inputProps={{ min: 1, max: 15 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>Rating scale (1 = lowest, 5 = highest)</Typography>
              <Box sx={s.scaleGrid}>
                {form.framework.scale.map((label, i) => (
                  <TextField key={i} size="small" label={`${i + 1}`} value={label} onChange={(e) => setScale(i, e.target.value)} disabled={locked}
                    error={touched && !String(label).trim()} />
                ))}
              </Box>
              {err('scale') && <Typography variant="caption" color="error">{err('scale')}</Typography>}
            </Box>
            <TextField label="Instructions for employees" multiline minRows={3} value={form.framework.instructions} fullWidth
              onChange={(e) => setF('instructions', e.target.value.slice(0, 1200))} helperText={`${form.framework.instructions.length}/1200 · shown on the goal-setting form`} />
          </Box>

          {touched && Object.keys(problems).length > 0 && <Alert severity="error">Fix the highlighted fields to save.</Alert>}
          {save.error && <Alert severity="error">{save.error.message}</Alert>}
        </DialogContent>

        <DialogActions sx={dialog.actions}>
          <Button variant="outlined" onClick={onClose} disabled={save.isPending}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={save.isPending}
            startIcon={save.isPending ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}>
            {cycle ? 'Save changes' : 'Save as draft'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
