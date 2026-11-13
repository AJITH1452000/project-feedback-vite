import { alpha, createTheme } from '@mui/material/styles';
import { breakpoints, fonts, fontWeights, motion, palettes, radius } from './tokens.js';

const up = (key) => `@media (min-width:${breakpoints[key]}px)`;

/** Fluid type scale: small phones → tablets → desktops. */
function buildTypography() {
  const heading = { fontFamily: fonts.heading, letterSpacing: '-0.02em' };
  return {
    fontFamily: fonts.body,
    htmlFontSize: 16,
    h1: { ...heading, fontWeight: fontWeights.heavy, fontSize: '1.5rem', lineHeight: 1.2, [up('md')]: { fontSize: '1.85rem' }, [up('xl')]: { fontSize: '2.1rem' } },
    h2: { ...heading, fontWeight: fontWeights.bold, fontSize: '1.3rem', lineHeight: 1.25, [up('md')]: { fontSize: '1.5rem' } },
    h3: { ...heading, fontWeight: fontWeights.bold, fontSize: '1.05rem', lineHeight: 1.3, [up('md')]: { fontSize: '1.125rem' } },
    h4: { ...heading, fontWeight: fontWeights.bold, fontSize: '0.98rem', lineHeight: 1.35 },
    h5: { ...heading, fontWeight: fontWeights.semibold, fontSize: '0.92rem' },
    h6: { ...heading, fontWeight: fontWeights.semibold, fontSize: '0.875rem' },
    subtitle1: { fontWeight: fontWeights.semibold, fontSize: '0.9rem', lineHeight: 1.4 },
    subtitle2: { fontWeight: fontWeights.semibold, fontSize: '0.82rem', lineHeight: 1.4 },
    body1: { fontSize: '0.9rem', lineHeight: 1.6, [up('md')]: { fontSize: '0.94rem' } },
    body2: { fontSize: '0.84rem', lineHeight: 1.55 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45 },
    overline: { fontSize: '0.68rem', fontWeight: fontWeights.bold, letterSpacing: '0.12em', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: fontWeights.semibold, letterSpacing: 0 },
    // Custom variants
    display: { ...heading, fontWeight: fontWeights.heavy, fontSize: '2rem', lineHeight: 1.08, letterSpacing: '-0.035em', [up('sm')]: { fontSize: '2.4rem' }, [up('xl')]: { fontSize: '3.1rem' } },
    kpi: { ...heading, fontWeight: fontWeights.heavy, fontSize: '1.35rem', lineHeight: 1.15, letterSpacing: '-0.03em', [up('md')]: { fontSize: '1.5rem' }, [up('xl')]: { fontSize: '1.65rem' } },
    mono: { fontFamily: fonts.mono, fontSize: '0.8rem' },
  };
}

export function createAppTheme(mode = 'light') {
  const p = palettes[mode] || palettes.light;

  const theme = createTheme({
    breakpoints: { values: breakpoints },
    palette: {
      ...p,
      action: { hover: p.surface.hover, selected: p.primary.soft },
    },
    typography: buildTypography(),
    shape: { borderRadius: radius.md },
    // sx multiplies numeric borderRadius by shape.borderRadius, so sx-facing radii are px strings.
    tokens: { radius: Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, `${v}px`])), motion, fonts, fontWeights },
  });

  theme.components = {
    MuiCssBaseline: {
      styleOverrides: {
        html: { WebkitTextSizeAdjust: '100%', scrollBehavior: 'smooth' },
        body: {
          backgroundColor: p.background.default,
          color: p.text.primary,
          fontFamily: fonts.body,
          minWidth: 320,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          transition: `background-color ${motion.base}, color ${motion.base}`,
          overflowX: 'hidden',
        },
        '::selection': { backgroundColor: alpha(p.primary.main, 0.22) },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: p.surface.borderStrong, borderRadius: radius.pill },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        'a': { color: 'inherit', textDecoration: 'none' },
        'img': { maxWidth: '100%' },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
        },
      },
    },
    MuiTypography: {
      defaultProps: { variantMapping: { display: 'h1', kpi: 'span', mono: 'code' } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.sm + 2,
          paddingInline: 16,
          minHeight: 40,
          transition: `all ${motion.fast}`,
        },
        sizeSmall: { minHeight: 34, paddingInline: 12, fontSize: '0.8rem' },
        sizeLarge: { minHeight: 48, fontSize: '0.95rem' },
        containedPrimary: {
          background: p.brand.gradient,
          boxShadow: p.shadow.brand,
          '&:hover': { boxShadow: p.shadow.brand, filter: 'brightness(1.06)' },
          '&.Mui-disabled': { background: p.surface.muted, boxShadow: 'none' },
        },
        outlined: {
          borderColor: p.surface.borderStrong,
          color: p.text.primary,
          backgroundColor: p.background.paper,
          '&:hover': { borderColor: p.primary.main, backgroundColor: p.primary.soft, color: p.primary.main },
        },
        text: { '&:hover': { backgroundColor: p.primary.soft } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: radius.sm + 2, transition: `all ${motion.fast}` } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm + 2,
          backgroundColor: p.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: p.surface.borderStrong },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: p.primary.light },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: p.primary.main, borderWidth: 1.5 },
          '&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(p.primary.main, 0.12)}` },
        },
        input: { fontSize: '0.9rem' },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.88rem' } } },
    MuiFormLabel: { styleOverrides: { root: { color: p.text.secondary } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.pill, fontWeight: fontWeights.semibold, fontSize: '0.72rem' },
        sizeSmall: { height: 24 },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { backgroundColor: p.tooltip.bg, color: p.tooltip.text, fontSize: '0.75rem', borderRadius: radius.sm, padding: '6px 10px' },
        arrow: { color: p.tooltip.bg },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: radius.lg, boxShadow: p.shadow.lg, border: `1px solid ${p.surface.border}` },
        paperFullScreen: { borderRadius: 0, border: 0 },
      },
    },
    MuiDialogTitle: { styleOverrides: { root: { fontFamily: fonts.heading, fontWeight: fontWeights.bold } } },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: radius.md, border: `1px solid ${p.surface.border}`, boxShadow: p.shadow.lg } },
    },
    MuiPopover: {
      styleOverrides: { paper: { borderRadius: radius.lg, border: `1px solid ${p.surface.border}`, boxShadow: p.shadow.lg } },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: '0.86rem', borderRadius: radius.sm, marginInline: 6, minHeight: 38 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: p.surface.border, fontSize: '0.84rem', paddingBlock: 14 },
        head: { fontSize: '0.7rem', fontWeight: fontWeights.bold, letterSpacing: '0.08em', textTransform: 'uppercase', color: p.text.secondary, backgroundColor: p.surface.subtle },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { transition: `background-color ${motion.fast}`, '&:hover': { backgroundColor: p.surface.subtle } } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: fontWeights.semibold, minHeight: 44, fontSize: '0.86rem' } },
    },
    MuiTabs: {
      styleOverrides: { indicator: { height: 3, borderRadius: radius.pill, background: p.brand.gradient } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: radius.pill, backgroundColor: p.surface.muted }, bar: { borderRadius: radius.pill } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: radius.md, fontSize: '0.85rem', alignItems: 'center' } },
    },
    MuiSwitch: {
      styleOverrides: { switchBase: { '&.Mui-checked + .MuiSwitch-track': { opacity: 1 } } },
    },
    MuiRating: {
      styleOverrides: { iconFilled: { color: p.star }, iconHover: { color: p.star } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: 0 } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: p.surface.muted } },
    },
  };

  return theme;
}
