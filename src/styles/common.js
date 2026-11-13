/**
 * Shared sx style maps. Every color, font, radius and shadow is read from the
 * theme (palette paths like 'text.secondary' or theme callbacks) — no raw values.
 * Responsive objects ({ xs, sm, md, lg, xl, xxl }) compile to media queries.
 */
import { alpha, keyframes } from '@mui/material/styles';

const r = (key) => (theme) => theme.tokens.radius[key];

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;
const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 var(--pulse-color); }
  50% { transform: scale(1.06); box-shadow: 0 0 0 14px transparent; }
`;
const spin = keyframes`to { transform: rotate(360deg); }`;

/* ------------------------------- Layout -------------------------------- */

export const page = {
  root: { animation: `${fadeUp} 380ms cubic-bezier(0.22, 1, 0.36, 1) both`, minWidth: 0 },
  stack: { display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5, xl: 3 } },
};

export const grid = {
  kpis: {
    display: 'grid',
    gap: { xs: 1.25, sm: 1.5, xl: 2 },
    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
  },
  kpis3: {
    display: 'grid',
    gap: { xs: 1.5, sm: 2, xl: 2.5 },
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
  },
  two: {
    display: 'grid',
    gap: { xs: 2, md: 2.5, xl: 3 },
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
    alignItems: 'stretch',
  },
  mainAside: {
    display: 'grid',
    gap: { xs: 2, md: 2.5, xl: 3 },
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', xl: 'minmax(0, 1.55fr) minmax(0, 1fr)' },
    alignItems: 'start',
  },
  cards: {
    display: 'grid',
    gap: { xs: 2, md: 2.5 },
    gridTemplateColumns: {
      xs: 'minmax(0, 1fr)',
      md: 'repeat(2, minmax(0, 1fr))',
      xl: 'repeat(3, minmax(0, 1fr))',
      xxl: 'repeat(4, minmax(0, 1fr))',
    },
  },
  form2: {
    display: 'grid',
    gap: { xs: 2, sm: 2.25 },
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
  },
};

/* -------------------------------- Cards -------------------------------- */

export const card = {
  root: {
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'surface.border',
    borderRadius: r('lg'),
    boxShadow: (theme) => theme.palette.shadow.sm,
    p: { xs: 2, sm: 2.5, xl: 3 },
    minWidth: 0,
    transition: (theme) => `box-shadow ${theme.tokens.motion.base}, border-color ${theme.tokens.motion.base}`,
  },
  fill: { height: '100%', display: 'flex', flexDirection: 'column' },
  // Wraps the action (pill/button) under the title when the card is narrow.
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: 1.5,
    rowGap: 1,
    mb: { xs: 2, md: 2.5 },
  },
  headerTitleRow: { display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: '1 1 240px' },
  headerIcon: {
    width: 38, height: 38, flexShrink: 0, display: 'grid', placeItems: 'center',
    borderRadius: r('md'), bgcolor: 'primary.soft', color: 'primary.main',
  },
  title: { color: 'text.primary' },
  subtitle: { color: 'text.secondary', mt: 0.25 },
  footer: {
    mt: 'auto', pt: 2, borderTop: 1, borderColor: 'surface.border', borderTopStyle: 'dashed',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap',
  },
  body: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25 },
  listItem: {
    display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 1.25, sm: 1.5 },
    borderRadius: r('md'), border: 1, borderColor: 'surface.border', bgcolor: 'surface.subtle',
    transition: (theme) => `all ${theme.tokens.motion.fast}`,
    '&:hover': { borderColor: 'primary.light', bgcolor: 'background.paper', transform: 'translateY(-1px)', boxShadow: (theme) => theme.palette.shadow.md },
  },
  listItemDanger: { borderLeft: 3, borderLeftColor: 'error.main' },
  muted: { bgcolor: 'surface.subtle', border: 1, borderColor: 'surface.border', borderRadius: r('md'), p: { xs: 1.5, sm: 2 } },
};

/* ----------------------------- Page header ----------------------------- */

export const pageHeader = {
  root: {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: { xs: 'stretch', md: 'flex-end' },
    justifyContent: 'space-between',
    gap: { xs: 2, md: 3 },
    mb: { xs: 2.5, md: 3 },
  },
  eyebrow: { color: 'primary.main', display: 'inline-flex', alignItems: 'center', gap: 0.75 },
  eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: (theme) => theme.palette.brand.gradient },
  title: { color: 'text.primary', mt: 0.5 },
  description: { color: 'text.secondary', mt: 0.75, maxWidth: 720 },
  actions: {
    display: 'flex', gap: 1.25, flexShrink: 0,
    flexDirection: { xs: 'column', sm: 'row' },
    '& > *': { width: { xs: '100%', sm: 'auto' } },
  },
};

/* ------------------------------- KPI card ------------------------------ */

export const kpi = {
  root: (tone) => ({
    ...card.root,
    // Compact horizontal card: [icon] label / value / one-line note.
    p: { xs: 1.25, sm: 1.5 },
    containerType: 'inline-size',
    containerName: 'kpi',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 1, sm: 1.5 },
    minWidth: 0,
    borderLeft: 3,
    borderLeftColor: `${tone}.main`,
    transition: (theme) => `all ${theme.tokens.motion.fast}`,
    '&:hover': { boxShadow: (theme) => theme.palette.shadow.md, transform: 'translateY(-2px)' },
  }),
  body: { flex: 1, minWidth: 0 },
  icon: (tone) => ({
    width: { sm: 40, xl: 44 }, height: { sm: 40, xl: 44 }, borderRadius: r('md'),
    // Hidden on small phones, and whenever the card itself is too narrow (container query).
    display: { xs: 'none', sm: 'grid' }, placeItems: 'center',
    bgcolor: `${tone}.soft`, color: `${tone}.main`, flexShrink: 0,
    '& svg': { width: 19, height: 19 },
    '@container kpi (max-width: 170px)': { display: 'none' },
  }),
  oneLine: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', minWidth: 0 },
  label: { color: 'text.secondary', fontWeight: 600, lineHeight: 1.3 },
  valueRow: { display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap', my: 0.25 },
  value: { color: 'text.primary' },
  scale: { color: 'text.secondary', fontWeight: 600 },
  footer: { color: 'text.secondary', lineHeight: 1.35 },
  trend: (tone) => (theme) => ({
    ml: 0.5, px: 0.75, py: 0.1, borderRadius: theme.tokens.radius.pill, fontSize: '0.68rem', fontWeight: 700,
    color: theme.palette[tone].main, bgcolor: theme.palette[tone].soft, alignSelf: 'center', whiteSpace: 'nowrap',
  }),
};

/* --------------------------------- Pill -------------------------------- */

export const pill = (tone = 'neutral') => (theme) => {
  const isNeutral = tone === 'neutral';
  return {
    display: 'inline-flex', alignItems: 'center', gap: 0.5,
    px: 1.1, py: 0.35, borderRadius: theme.tokens.radius.pill,
    fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.5, whiteSpace: 'nowrap',
    color: isNeutral ? theme.palette.text.secondary : theme.palette[tone].main,
    bgcolor: isNeutral ? theme.palette.surface.muted : theme.palette[tone].soft,
    border: `1px solid ${isNeutral ? theme.palette.surface.border : alpha(theme.palette[tone].main, 0.22)}`,
  };
};

export const pillDot = { width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' };

/* -------------------------------- Avatar ------------------------------- */

export const avatar = (size, colorIndex) => (theme) => {
  const color = theme.palette.avatar[colorIndex % theme.palette.avatar.length];
  return {
    width: size, height: size, fontSize: size * 0.38, fontWeight: 700,
    fontFamily: theme.tokens.fonts.heading,
    color, bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.2 : 0.13),
    border: `1px solid ${alpha(color, 0.25)}`,
  };
};

/* ------------------------------ Typography ----------------------------- */

export const text = {
  strong: { color: 'text.primary', fontWeight: 600 },
  muted: { color: 'text.secondary' },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  quote: {
    color: 'text.primary', fontStyle: 'italic', borderLeft: 3, borderColor: 'primary.light',
    pl: 1.5, py: 0.25, my: 1.25,
  },
  label: { color: 'text.secondary', display: 'block', mb: 0.75, fontWeight: 600 },
  gradient: {
    background: (theme) => theme.palette.brand.gradient,
    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  star: { color: 'star', display: 'inline-flex' },
  error: { color: 'error.main', fontWeight: 600 },
  success: { color: 'success.main', fontWeight: 600 },
  code: (theme) => ({
    fontFamily: theme.tokens.fonts.mono, fontSize: '0.78em', px: 0.75, py: 0.15,
    borderRadius: theme.tokens.radius.xs, bgcolor: theme.palette.surface.muted, color: theme.palette.primary.main,
  }),
};

/* ------------------------------ Score badge ---------------------------- */

export const score = {
  root: (theme) => ({
    display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.35,
    borderRadius: theme.tokens.radius.pill, bgcolor: alpha(theme.palette.star, 0.14),
    color: theme.palette.text.primary, fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap',
  }),
  icon: { color: 'star', display: 'inline-flex' },
};

/* ---------------------------- Filter chips ----------------------------- */

export const filterChips = {
  row: { display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' },
  chip: (active) => (theme) => ({
    borderRadius: theme.tokens.radius.pill,
    minHeight: 34,
    px: 1.75,
    fontWeight: 600,
    fontSize: '0.8rem',
    border: `1px solid ${active ? theme.palette.primary.main : theme.palette.surface.borderStrong}`,
    color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
    background: active ? theme.palette.brand.gradient : theme.palette.background.paper,
    boxShadow: active ? theme.palette.shadow.brand : 'none',
    '&:hover': { borderColor: theme.palette.primary.main, color: active ? theme.palette.primary.contrastText : theme.palette.primary.main, background: active ? theme.palette.brand.gradient : theme.palette.primary.soft },
  }),
};

/* ------------------------------ Empty state ---------------------------- */

export const empty = {
  root: {
    textAlign: 'center', py: { xs: 4, md: 6 }, px: 2, borderRadius: r('lg'),
    border: 1, borderStyle: 'dashed', borderColor: 'surface.borderStrong', bgcolor: 'surface.subtle',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
  },
  icon: { width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'primary.soft', color: 'primary.main', mb: 0.5 },
};

/* ------------------------------- Loaders ------------------------------- */

export const loader = {
  screen: {
    minHeight: '100dvh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 3,
  },
  page: { minHeight: { xs: '50vh', md: '60vh' }, display: 'grid', placeItems: 'center', p: 3 },
  inner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.25, textAlign: 'center' },
  ringWrap: { position: 'relative', width: 72, height: 72, display: 'grid', placeItems: 'center' },
  ring: (theme) => ({
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: `conic-gradient(from 0deg, transparent 0deg, ${theme.palette.primary.main} 260deg, ${theme.palette.secondary.main} 360deg)`,
    WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - 4px), ${theme.palette.common.black} calc(100% - 3px))`,
    mask: `radial-gradient(farthest-side, transparent calc(100% - 4px), ${theme.palette.common.black} calc(100% - 3px))`,
    animation: `${spin} 0.9s linear infinite`,
  }),
  mark: (theme) => ({
    '--pulse-color': theme.palette.brand.glow,
    width: 46, height: 46, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center',
    background: theme.palette.brand.gradient, color: theme.palette.primary.contrastText,
    animation: `${pulse} 1.6s ease-in-out infinite`,
  }),
  title: { color: 'text.primary' },
  caption: { color: 'text.secondary' },
  bar: { width: 180 },
};

/* -------------------------------- Toast -------------------------------- */

export const toastStyles = {
  snackbar: { bottom: { xs: 16, md: 24 }, left: { xs: 16, sm: '50%' }, right: { xs: 16, sm: 'auto' } },
  alert: { width: '100%', boxShadow: (theme) => theme.palette.shadow.lg, fontWeight: 500 },
};

/* ---------------------------- Responsive table ------------------------- */

export const table = {
  wrap: { borderRadius: r('md'), border: 1, borderColor: 'surface.border', overflowX: 'auto' },
  table: { minWidth: 640 },
  mobileList: { display: 'flex', flexDirection: 'column', gap: 1.25 },
  mobileCard: {
    border: 1, borderColor: 'surface.border', borderRadius: r('md'), p: 1.75, bgcolor: 'surface.subtle',
    display: 'flex', flexDirection: 'column', gap: 1,
  },
  mobileRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 },
  mobileLabel: { color: 'text.secondary', fontWeight: 600, flexShrink: 0 },
  emptyCell: { textAlign: 'center', color: 'text.secondary', py: 5 },
};

/* ------------------------------ Form bits ------------------------------ */

export const form = {
  section: { display: 'flex', flexDirection: 'column', gap: 2.25 },
  fieldHint: { color: 'text.secondary', mt: 0.75, display: 'block' },
  checkRow: (theme) => ({
    display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25, borderRadius: theme.tokens.radius.md,
    bgcolor: theme.palette.surface.subtle, border: `1px solid ${theme.palette.surface.border}`,
    '& .MuiCheckbox-root': { p: 0.5, mt: -0.25 },
  }),
  actions: {
    display: 'flex', gap: 1.25, alignItems: { xs: 'stretch', sm: 'center' },
    justifyContent: 'space-between', flexDirection: { xs: 'column-reverse', sm: 'row' },
    '& > *': { width: { xs: '100%', sm: 'auto' } },
  },
  actionGroup: {
    display: 'flex', gap: 1.25, flexDirection: { xs: 'column-reverse', sm: 'row' },
    '& > *': { width: { xs: '100%', sm: 'auto' } },
  },
};

export const dialog = {
  title: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, pb: 1 },
  subtitle: { color: 'text.secondary', fontWeight: 400, mt: 0.5 },
  content: { display: 'flex', flexDirection: 'column', gap: 2.25, pt: '8px !important' },
  actions: { px: 3, pb: 3, pt: 1, gap: 1, flexDirection: { xs: 'column-reverse', sm: 'row' }, '& > *': { width: { xs: '100%', sm: 'auto' }, ml: '0 !important' } },
};

export const divider = { borderColor: 'surface.border' };
