/** Login screen styles. Theme references only. */
import { keyframes } from '@mui/material/styles';
import { layout as L } from '../theme/tokens.js';

const float = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -14px, 0); }
`;

export const login = {
  root: {
    minHeight: '100dvh', display: 'grid', bgcolor: 'background.default',
    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 1fr)' },
  },
  hero: (theme) => ({
    display: { xs: 'none', lg: 'flex' }, position: 'relative', overflow: 'hidden',
    background: theme.palette.brand.heroGradient, color: theme.palette.brand.heroText,
    p: { lg: 6, xl: 8 }, flexDirection: 'column', justifyContent: 'space-between',
  }),
  orb: (variant) => (theme) => ({
    position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
    animation: `${float} ${variant === 'a' ? 9 : 12}s ease-in-out infinite`,
    ...(variant === 'a'
      ? { width: 380, height: 380, top: -120, right: -80, bgcolor: theme.palette.brand.orbA }
      : { width: 320, height: 320, bottom: -100, left: -60, bgcolor: theme.palette.brand.orbB }),
  }),
  heroBrand: { display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 },
  heroMark: (theme) => ({
    width: 46, height: 46, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center',
    background: theme.palette.brand.gradient, color: theme.palette.primary.contrastText, boxShadow: theme.palette.shadow.brand,
  }),
  heroMuted: { color: 'brand.heroMuted' },
  heroCopy: { position: 'relative', zIndex: 1, maxWidth: 560, my: 6 },
  kicker: (theme) => ({
    display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, mb: 3,
    borderRadius: theme.tokens.radius.pill, bgcolor: theme.palette.brand.heroCard,
    border: `1px solid ${theme.palette.brand.heroBorder}`, color: theme.palette.brand.heroText,
  }),
  heroTitle: { color: 'brand.heroText' },
  heroAccent: (theme) => ({
    background: theme.palette.brand.gradient,
    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
  }),
  heroText: { color: 'brand.heroMuted', mt: 2.5, maxWidth: 480, fontSize: '1.02rem' },
  heroStats: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2, position: 'relative', zIndex: 1 },
  heroStat: (theme) => ({
    p: 2.25, borderRadius: theme.tokens.radius.lg, bgcolor: theme.palette.brand.heroCard,
    border: `1px solid ${theme.palette.brand.heroBorder}`, backdropFilter: 'blur(12px)',
  }),
  heroStatValue: { color: 'brand.heroText' },
  heroFeatureIcon: (theme) => ({
    width: 34, height: 34, mb: 1.25, display: 'grid', placeItems: 'center', borderRadius: theme.tokens.radius.md,
    bgcolor: theme.palette.brand.heroBorder, color: theme.palette.brand.heroText,
  }),
  heroQuote: (theme) => ({
    mt: 4, p: 2.5, borderRadius: theme.tokens.radius.lg, bgcolor: theme.palette.brand.heroCard,
    border: `1px solid ${theme.palette.brand.heroBorder}`, backdropFilter: 'blur(12px)', maxWidth: 520,
  }),
  heroQuoteText: { color: 'brand.heroText', fontStyle: 'italic', my: 1.25 },
  heroStars: { color: 'star', display: 'flex', gap: 0.25 },

  panel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, sm: 5 }, position: 'relative',
  },
  themeToggle: { position: 'absolute', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 } },
  card: (theme) => ({
    width: '100%', maxWidth: L.loginCardMaxWidth, bgcolor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.surface.border}`, borderRadius: theme.tokens.radius.xl,
    boxShadow: theme.palette.shadow.lg, p: { xs: 2.5, sm: 4, xl: 4.5 },
  }),
  mobileBrand: { display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.25, mb: 3 },
  cardHead: { mb: 3 },
  cardTitle: { color: 'text.primary' },
  cardSub: { color: 'text.secondary', mt: 0.75 },
  roleGrid: { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(150px, 1fr))' }, gap: 1.25, mb: 2.5 },
  roleOption: (active) => (theme) => ({
    textAlign: 'left', p: 1.75, borderRadius: theme.tokens.radius.md, cursor: 'pointer',
    border: `1.5px solid ${active ? theme.palette.primary.main : theme.palette.surface.border}`,
    bgcolor: active ? theme.palette.primary.soft : theme.palette.surface.subtle,
    color: theme.palette.text.primary, display: 'flex', gap: 1.25, alignItems: 'flex-start',
    transition: `all ${theme.tokens.motion.fast}`, font: 'inherit',
    '&:hover': { borderColor: theme.palette.primary.light },
    '&:focus-visible': { outline: `3px solid ${theme.palette.primary.light}`, outlineOffset: 2 },
  }),
  roleIcon: (active) => (theme) => ({
    width: 34, height: 34, borderRadius: theme.tokens.radius.sm, display: 'grid', placeItems: 'center', flexShrink: 0,
    background: active ? theme.palette.brand.gradient : theme.palette.surface.muted,
    color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary,
  }),
  submit: { mt: 2.5 },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 1.5, my: 3, color: 'text.secondary', '&::before, &::after': { content: '""', flex: 1, borderTop: 1, borderColor: 'surface.border' } },
  personaGrid: { display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 },
  persona: (theme) => ({
    justifyContent: 'flex-start', gap: 1.25, p: 1.25, borderRadius: theme.tokens.radius.md,
    border: `1px solid ${theme.palette.surface.border}`, bgcolor: theme.palette.background.paper,
    color: theme.palette.text.primary, textAlign: 'left',
    '&:hover': { borderColor: theme.palette.primary.light, bgcolor: theme.palette.primary.soft },
  }),
  personaText: { minWidth: 0, lineHeight: 1.25 },
  notice: (theme) => ({
    mt: 3, p: 1.5, borderRadius: theme.tokens.radius.md, display: 'flex', gap: 1.25,
    bgcolor: theme.palette.info.soft, color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.surface.border}`,
  }),
  noticeIcon: { color: 'info.main', display: 'inline-flex', mt: 0.25, flexShrink: 0 },
};
