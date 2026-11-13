/** Page-specific styles (dashboard, projects, feedback, people, reports, profile). Theme references only. */
import { alpha } from '@mui/material/styles';

const r = (key) => (theme) => theme.tokens.radius[key];

export const dashboard = {
  hero: (theme) => ({
    position: 'relative', overflow: 'hidden', borderRadius: theme.tokens.radius.xl,
    background: theme.palette.brand.heroGradient, color: theme.palette.brand.heroText,
    p: { xs: 2.5, sm: 3, md: 4 }, mb: { xs: 2.5, md: 3 },
    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2.5, md: 4 },
    alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between',
    boxShadow: theme.palette.shadow.md, border: `1px solid ${theme.palette.brand.heroBorder}`,
  }),
  heroOrb: (theme) => ({
    position: 'absolute', width: 300, height: 300, borderRadius: '50%', right: -80, top: -140,
    bgcolor: theme.palette.brand.orbA, filter: 'blur(70px)', pointerEvents: 'none',
  }),
  heroOrb2: (theme) => ({
    position: 'absolute', width: 220, height: 220, borderRadius: '50%', left: '30%', bottom: -150,
    bgcolor: theme.palette.brand.orbB, filter: 'blur(70px)', pointerEvents: 'none',
  }),
  heroBody: { position: 'relative', zIndex: 1, minWidth: 0 },
  heroEyebrow: { color: 'brand.heroMuted' },
  heroTitle: { color: 'brand.heroText', mt: 0.75 },
  heroText: { color: 'brand.heroMuted', mt: 1, maxWidth: 620 },
  heroActions: {
    position: 'relative', zIndex: 1, display: 'flex', gap: 1.25, flexShrink: 0,
    flexDirection: { xs: 'column', sm: 'row' }, '& > *': { width: { xs: '100%', sm: 'auto' } },
  },
  heroGhostBtn: (theme) => ({
    color: theme.palette.brand.heroText, borderColor: theme.palette.brand.heroBorder, bgcolor: theme.palette.brand.heroCard,
    '&:hover': { borderColor: theme.palette.brand.heroText, bgcolor: theme.palette.brand.heroCard, color: theme.palette.brand.heroText },
  }),
  distRow: { display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr) 36px', alignItems: 'center', gap: 1.5 },
  distBar: (tone) => (theme) => ({ height: 10, '& .MuiLinearProgress-bar': { bgcolor: theme.palette[tone].main } }),
  dimRow: { display: 'flex', flexDirection: 'column', gap: 0.75 },
  dimHead: { display: 'flex', justifyContent: 'space-between', gap: 1 },

  // Dashboard list rows — compact: title + one info line.
  row: { alignItems: 'center', py: { xs: 1, sm: 1.1 }, gap: 1.25 },
  itemBody: { flex: 1, minWidth: 0 },
  itemTitle: { color: 'text.primary', lineHeight: 1.35, wordBreak: 'break-word' },
  itemSub: { color: 'text.secondary', display: 'block', lineHeight: 1.4 },
  status: (tone) => ({ color: `${tone}.main`, fontWeight: 600 }),
  rateBtn: { minHeight: 30, px: 1.75, flexShrink: 0 },
};

export const projects = {
  toolbar: (theme) => ({
    display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5,
    alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between',
    p: { xs: 1.5, sm: 2 }, mb: { xs: 2, md: 2.5 }, borderRadius: theme.tokens.radius.lg,
    bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.surface.border}`,
  }),
  search: { width: { xs: '100%', md: 320 } },
  card: (theme) => ({
    bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.surface.border}`,
    borderRadius: theme.tokens.radius.lg, p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2,
    boxShadow: theme.palette.shadow.sm, transition: `all ${theme.tokens.motion.base}`, minWidth: 0,
    '&:hover': { transform: 'translateY(-3px)', boxShadow: theme.palette.shadow.lg, borderColor: theme.palette.primary.light },
  }),
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 },
  projectIcon: (index) => (theme) => {
    const color = theme.palette.avatar[index % theme.palette.avatar.length];
    return {
      width: 44, height: 44, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center', flexShrink: 0,
      bgcolor: alpha(color, 0.14), color,
    };
  },
  meta: { display: 'flex', flexWrap: 'wrap', gap: 1, color: 'text.secondary' },
  metaItem: (theme) => ({
    display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.5, borderRadius: theme.tokens.radius.sm,
    bgcolor: theme.palette.surface.subtle, border: `1px solid ${theme.palette.surface.border}`, fontSize: '0.74rem',
  }),
  progressHead: { display: 'flex', justifyContent: 'space-between', mb: 0.75 },
  progress: { height: 8 },
  rosterTitle: { color: 'text.secondary' },
  roster: { display: 'flex', flexDirection: 'column', gap: 1 },
  member: (theme) => ({
    display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: theme.tokens.radius.md,
    border: `1px solid ${theme.palette.surface.border}`, bgcolor: theme.palette.surface.subtle, minWidth: 0,
  }),
  memberText: { flex: 1, minWidth: 0 },
  memberActions: { display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, '& > span': { display: { xs: 'none', sm: 'inline-flex' } } },
  reviewBtn: { minHeight: 30, px: 1.25, fontSize: '0.74rem' },
};

/** Tone for a 1–5 rating: 4+ success, 3+ info, 2+ warning, below error. */
export const ratingTone = (score) => (!score ? 'primary' : score >= 4 ? 'success' : score >= 3 ? 'info' : score >= 2 ? 'warning' : 'error');

/** "Submit project feedback" dialog. */
export const submitFeedback = {
  sectionLabel: { color: 'text.secondary', display: 'block', mb: 1.25 },
  ratingCard: (tone) => (theme) => ({
    borderRadius: theme.tokens.radius.lg, border: `1px solid ${alpha(theme.palette[tone].main, 0.3)}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.08)} 0%, ${theme.palette.background.paper} 70%)`,
    p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 2,
    transition: `border-color ${theme.tokens.motion.base}, background ${theme.tokens.motion.base}`,
  }),
  ratingHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' },
  ratingBody: { display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } },
  valueBox: (tone) => (theme) => ({
    width: { xs: 84, sm: 96 }, height: { xs: 84, sm: 96 }, borderRadius: theme.tokens.radius.lg, flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: alpha(theme.palette[tone].main, 0.12),
    border: `1.5px solid ${alpha(theme.palette[tone].main, 0.35)}`, color: theme.palette[tone].main,
  }),
  valueNumber: (theme) => ({ fontFamily: theme.tokens.fonts.heading, fontWeight: 800, fontSize: { xs: '2rem', sm: '2.4rem' }, lineHeight: 1 }),
  valueScale: { color: 'text.secondary', fontWeight: 600, mt: 0.25 },
  ratingMain: { display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0, flex: 1 },
  ratingLabel: (tone) => ({ color: `${tone}.main` }),
  stars: { fontSize: { xs: '2rem', sm: '2.25rem' } },
  aiLine: { display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', color: 'text.secondary' },
  aiNote: (theme) => ({
    display: 'flex', gap: 1, alignItems: 'flex-start', p: 1.5, borderRadius: theme.tokens.radius.md,
    bgcolor: theme.palette.secondary.soft, color: theme.palette.text.secondary, fontSize: '0.8rem',
  }),
  aiNoteIcon: { color: 'secondary.main', display: 'inline-flex', mt: 0.15, flexShrink: 0 },
  aiChip: (state) => (theme) => {
    const tone = state === 'edited' ? 'warning' : state === 'error' ? 'error' : 'secondary';
    return {
      display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35, borderRadius: theme.tokens.radius.pill,
      fontSize: '0.72rem', fontWeight: 700, color: theme.palette[tone].main, bgcolor: theme.palette[tone].soft,
    };
  },
  fieldTag: (theme) => ({
    ml: 0.75, px: 0.6, py: 0.1, borderRadius: theme.tokens.radius.xs, fontSize: '0.65rem', fontWeight: 700,
    color: theme.palette.secondary.main, bgcolor: theme.palette.secondary.soft, verticalAlign: 'middle',
  }),
  linkBtn: { minHeight: 28, px: 1, fontSize: '0.75rem' },
  workflow: (theme) => ({
    display: 'flex', gap: 1.25, alignItems: 'flex-start', p: 2, borderRadius: theme.tokens.radius.md,
    bgcolor: theme.palette.info.soft, border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`, color: theme.palette.text.secondary,
  }),
  workflowIcon: { color: 'info.main', display: 'inline-flex', mt: 0.25, flexShrink: 0 },
};

export const projectDialog = {
  icon: (theme) => ({
    width: 42, height: 42, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center', flexShrink: 0,
    background: theme.palette.brand.gradient, color: theme.palette.primary.contrastText, boxShadow: theme.palette.shadow.brand,
  }),
  option: { display: 'flex', alignItems: 'center', gap: 1.25 },
};

export const feedback = {
  tabs: (theme) => ({
    mb: { xs: 2, md: 2.5 }, borderBottom: `1px solid ${theme.palette.surface.border}`,
    '& .MuiTabs-flexContainer': { gap: { xs: 0, sm: 1 } },
  }),
  banner: (theme) => ({
    display: 'flex', gap: 1.5, alignItems: 'flex-start', p: { xs: 1.75, sm: 2 }, mb: { xs: 2, md: 2.5 },
    borderRadius: theme.tokens.radius.lg, bgcolor: theme.palette.info.soft,
    border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
  }),
  bannerIcon: { color: 'info.main', display: 'inline-flex', mt: 0.25, flexShrink: 0 },
  dimension: (theme) => ({
    display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' },
    justifyContent: 'space-between', gap: { xs: 1, sm: 2 }, p: { xs: 1.5, sm: 1.75 },
    borderRadius: theme.tokens.radius.md, border: `1px solid ${theme.palette.surface.border}`, bgcolor: theme.palette.surface.subtle,
  }),
  dimensionText: { minWidth: 0 },
  dimensionScore: { display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0, flexWrap: 'wrap' },
  dimensionValue: { color: 'text.secondary', minWidth: 64, fontWeight: 600 },
  suggestion: (theme) => ({
    fontSize: '0.7rem', minHeight: 26, px: 1, borderRadius: theme.tokens.radius.pill,
    bgcolor: theme.palette.secondary.soft, color: theme.palette.secondary.main,
    '&:hover': { bgcolor: theme.palette.secondary.soft, filter: 'brightness(0.97)' },
  }),
  overall: (filled) => (theme) => ({
    display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: theme.tokens.radius.md,
    background: filled ? theme.palette.brand.gradientSoft : theme.palette.surface.subtle,
    border: `1px solid ${filled ? alpha(theme.palette.primary.main, 0.3) : theme.palette.surface.border}`,
  }),
  overallBadge: (theme) => ({
    width: 56, height: 56, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center', flexShrink: 0,
    background: theme.palette.brand.gradient, color: theme.palette.primary.contrastText,
    fontFamily: theme.tokens.fonts.heading, fontWeight: 800, fontSize: '1.15rem',
  }),
  flagGrid: { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 },
  aiBox: (theme) => ({
    p: 2, borderRadius: theme.tokens.radius.md, border: `1px dashed ${alpha(theme.palette.secondary.main, 0.5)}`,
    bgcolor: theme.palette.secondary.soft, display: 'flex', flexDirection: 'column', gap: 1.25,
  }),
  aiHead: { display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.25, flexDirection: { xs: 'column', sm: 'row' } },
  signalGroupLabel: { color: 'text.secondary', mt: 1, mb: 1 },
  signal: (tone) => (theme) => ({
    p: 1.75, borderRadius: theme.tokens.radius.md, mb: 1.25,
    border: `1px solid ${theme.palette.surface.border}`, borderLeft: `3px solid ${theme.palette[tone].main}`,
    bgcolor: theme.palette.surface.subtle,
  }),
  signalHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 },
  signalActions: { display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 },
  signalBtn: (state) => (theme) => {
    const tone = state === 'verified' ? 'success' : state === 'flagged' ? 'warning' : null;
    return {
      minHeight: 30, px: 1.25, fontSize: '0.74rem', borderRadius: theme.tokens.radius.sm,
      border: `1px solid ${tone ? theme.palette[tone].main : theme.palette.surface.borderStrong}`,
      color: tone ? theme.palette[tone].main : theme.palette.text.secondary,
      bgcolor: tone ? theme.palette[tone].soft : theme.palette.background.paper,
      '&:hover': { borderColor: theme.palette.primary.main, color: theme.palette.primary.main, bgcolor: theme.palette.primary.soft },
    };
  },
  safeguard: (theme) => ({
    display: 'flex', gap: 1.25, p: 1.75, borderRadius: theme.tokens.radius.md, mt: 1,
    bgcolor: theme.palette.warning.soft, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
  }),
  safeguardIcon: { color: 'warning.main', display: 'inline-flex', mt: 0.25, flexShrink: 0 },
  step: { display: 'flex', gap: 1.5, position: 'relative', pb: 2.25, '&:last-of-type': { pb: 0 } },
  stepLine: (theme) => ({
    position: 'absolute', left: 15, top: 34, bottom: 2, width: 2, bgcolor: theme.palette.surface.border,
  }),
  stepNum: (active) => (theme) => ({
    width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
    fontWeight: 700, fontSize: '0.8rem', position: 'relative', zIndex: 1,
    background: active ? theme.palette.brand.gradient : theme.palette.surface.muted,
    color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
    boxShadow: active ? theme.palette.shadow.brand : 'none',
  }),
  principle: (level) => (theme) => {
    const tone = level >= 4 ? 'success' : level === 3 ? 'info' : level === 2 ? 'warning' : 'error';
    return {
      display: 'flex', gap: 2, alignItems: 'flex-start', p: { xs: 2, sm: 2.5 }, borderRadius: theme.tokens.radius.lg,
      bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.surface.border}`,
      borderLeft: `4px solid ${theme.palette[tone].main}`,
    };
  },
  principleLevel: (level) => (theme) => {
    const tone = level >= 4 ? 'success' : level === 3 ? 'info' : level === 2 ? 'warning' : 'error';
    return {
      width: 44, height: 44, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center', flexShrink: 0,
      bgcolor: theme.palette[tone].soft, color: theme.palette[tone].main, fontFamily: theme.tokens.fonts.heading, fontWeight: 800, fontSize: '1.1rem',
    };
  },
};

export const people = {
  memberCell: { display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 },
  incident: (theme) => ({
    p: { xs: 1.75, sm: 2 }, borderRadius: theme.tokens.radius.md, border: `1px solid ${theme.palette.surface.border}`,
    borderLeft: `3px solid ${theme.palette.error.main}`, bgcolor: theme.palette.surface.subtle,
  }),
  incidentHead: { display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1.25, alignItems: { xs: 'flex-start', sm: 'center' } },
  flags: { display: 'flex', flexWrap: 'wrap', gap: 0.75 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: 1, color: 'text.secondary' },
};

export const reports = {
  // Horizontal bar chart: height comes from the row count, not a fixed box.
  barBox: { width: '100%' },
  unrated: (theme) => ({
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 1.5, pt: 1.5,
    borderTop: `1px dashed ${theme.palette.surface.border}`,
  }),
  // Donut + legend side by side; stacked on phones.
  donutWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 2, sm: 3 },
    flexDirection: { xs: 'column', sm: 'row' }, flex: 1,
  },
  donutBox: { position: 'relative', width: 200, height: 200, flexShrink: 0 },
  donutCenter: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
  },
  legend: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: { sm: 150 }, width: { xs: '100%', sm: 'auto' } },
  legendItem: { display: 'grid', gridTemplateColumns: '12px 1fr auto', alignItems: 'center', gap: 1.25 },
  swatch: (index) => (theme) => ({ width: 12, height: 12, borderRadius: theme.tokens.radius.xs, bgcolor: theme.palette.sequential[index] }),
  legendValue: { color: 'text.secondary', fontWeight: 600 },
};

export const profile = {
  hero: (theme) => ({
    display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2.5,
    p: { xs: 2.5, md: 3 }, mb: { xs: 2.5, md: 3 }, borderRadius: theme.tokens.radius.xl,
    background: theme.palette.brand.gradientSoft, border: `1px solid ${theme.palette.surface.border}`,
  }),
  stream: { display: 'flex', flexDirection: 'column', gap: 1.5 },
  item: (theme) => ({
    p: { xs: 1.75, sm: 2.25 }, borderRadius: theme.tokens.radius.md, border: `1px solid ${theme.palette.surface.border}`,
    bgcolor: theme.palette.surface.subtle,
  }),
  itemHead: { display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1, alignItems: { xs: 'flex-start', sm: 'center' } },
  note: { whiteSpace: 'pre-line', mt: 1 },
  dims: { display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1, mt: 1.5 },
  dim: (theme) => ({ p: 1.25, borderRadius: theme.tokens.radius.sm, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.surface.border}` }),
};

export const settings = {
  row: (theme) => ({
    display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2,
    flexDirection: { xs: 'column', sm: 'row' }, p: 2, borderRadius: theme.tokens.radius.md,
    border: `1px solid ${theme.palette.surface.border}`, bgcolor: theme.palette.surface.subtle,
  }),
  modeGrid: { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 },
  modeOption: (active) => (theme) => ({
    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.75, borderRadius: theme.tokens.radius.md, cursor: 'pointer',
    border: `1.5px solid ${active ? theme.palette.primary.main : theme.palette.surface.border}`,
    bgcolor: active ? theme.palette.primary.soft : theme.palette.surface.subtle, color: theme.palette.text.primary,
    font: 'inherit', textAlign: 'left', width: '100%',
    '&:hover': { borderColor: theme.palette.primary.light },
  }),
};

export const notFound = {
  root: { minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 },
  code: (theme) => ({ fontFamily: theme.tokens.fonts.heading, fontWeight: 800, fontSize: { xs: '4rem', md: '6rem' }, lineHeight: 1, background: theme.palette.brand.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }),
};
