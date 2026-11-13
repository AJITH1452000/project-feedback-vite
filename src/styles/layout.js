/** App shell styles: sidebar, top bar, content area. Theme references only. */
import { alpha } from '@mui/material/styles';
import { layout as L } from '../theme/tokens.js';

export const shell = {
  root: { display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' },
  main: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
  },
  sidebarSlot: { width: L.sidebarWidth, flexShrink: 0 },
  liveStatus: { display: 'inline-flex', alignItems: 'center', gap: 0.75 },
  liveDot: (tone) => (theme) => ({
    width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette[tone].main,
    boxShadow: `0 0 0 3px ${alpha(theme.palette[tone].main, 0.2)}`,
  }),
  content: {
    flex: 1, width: '100%', maxWidth: L.contentMaxWidth, mx: 'auto',
    px: { xs: 2, sm: 2.5, md: 3, xl: 4 },
    py: { xs: 2.5, md: 3, xl: 4 },
  },
  footer: {
    width: '100%', maxWidth: L.contentMaxWidth, mx: 'auto',
    px: { xs: 2, sm: 2.5, md: 3, xl: 4 }, pb: { xs: 3, md: 3.5 },
    display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 0.75,
    alignItems: 'center', justifyContent: 'space-between', color: 'text.secondary',
  },
};

export const sidebar = {
  drawerPaper: (theme) => ({
    width: L.sidebarWidth,
    maxWidth: '86vw',
    background: `linear-gradient(180deg, ${theme.palette.nav.bg} 0%, ${theme.palette.nav.bgAlt} 100%)`,
    color: theme.palette.nav.text,
    borderRight: `1px solid ${theme.palette.nav.border}`,
  }),
  // Brand stays fixed at the top; only the scroll area below it scrolls.
  inner: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  brand: (theme) => ({
    display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0,
    height: L.topbarHeight, px: 3, borderBottom: `1px solid ${theme.palette.nav.border}`,
  }),
  scroll: {
    flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', px: 2, pt: 1, pb: 2.5,
    overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
  },
  brandMark: (theme) => ({
    width: 40, height: 40, borderRadius: theme.tokens.radius.md, display: 'grid', placeItems: 'center',
    background: theme.palette.brand.gradient, color: theme.palette.primary.contrastText, boxShadow: theme.palette.shadow.brand, flexShrink: 0,
  }),
  brandName: { color: 'nav.textActive', lineHeight: 1.1 },
  brandTag: { color: 'nav.label', display: 'block' },
  closeBtn: { ml: 'auto', color: 'nav.text', display: { lg: 'none' } },
  sectionLabel: { color: 'nav.label', px: 1.5, pb: 1, pt: 1.5 },
  navList: { display: 'flex', flexDirection: 'column', gap: 0.5 },
  navItem: (theme) => ({
    display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.15, minHeight: 44,
    borderRadius: theme.tokens.radius.md, color: theme.palette.nav.text,
    fontSize: '0.88rem', fontWeight: 500, position: 'relative',
    transition: `all ${theme.tokens.motion.fast}`,
    '&:hover': { bgcolor: theme.palette.nav.hoverBg, color: theme.palette.nav.textActive },
    '&.active': {
      bgcolor: theme.palette.nav.activeBg, color: theme.palette.nav.textActive, fontWeight: 600,
      '&::before': {
        content: '""', position: 'absolute', left: -16, top: 10, bottom: 10, width: 4,
        borderRadius: theme.tokens.radius.pill, background: theme.palette.brand.gradient,
      },
      '& .nav-icon': { color: theme.palette.primary.main },
    },
  }),
  navIcon: { display: 'inline-flex', flexShrink: 0 },
  bottom: { mt: 'auto', pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 },
  promo: (theme) => ({
    p: 2, borderRadius: theme.tokens.radius.lg, position: 'relative', overflow: 'hidden',
    background: theme.palette.brand.gradientSoft, border: `1px solid ${theme.palette.nav.border}`,
    color: theme.palette.nav.textActive,
  }),
  promoIcon: (theme) => ({
    width: 34, height: 34, borderRadius: theme.tokens.radius.sm, display: 'grid', placeItems: 'center',
    background: theme.palette.brand.gradient, color: theme.palette.primary.contrastText, mb: 1.25,
  }),
  promoText: { color: 'nav.text', mt: 0.5, mb: 1.25 },
  promoLink: { color: 'primary.light', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' },
  status: (theme) => ({
    display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: theme.tokens.radius.md,
    bgcolor: theme.palette.nav.hoverBg, border: `1px solid ${theme.palette.nav.border}`,
  }),
  statusDot: (theme) => ({
    width: 9, height: 9, borderRadius: '50%', bgcolor: theme.palette.success.main, flexShrink: 0,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.success.main, 0.18)}`,
  }),
  statusTitle: { color: 'nav.textActive', fontWeight: 600, lineHeight: 1.3 },
  statusSub: { color: 'nav.label', lineHeight: 1.3 },
};

export const topbar = {
  root: (theme) => ({
    position: 'sticky', top: 0, zIndex: theme.zIndex.appBar,
    minHeight: L.topbarHeight, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 },
    px: { xs: 1.5, sm: 2.5, md: 3, xl: 4 }, py: 1.25,
    bgcolor: theme.palette.surface.overlay, backdropFilter: 'saturate(180%) blur(14px)',
    borderBottom: `1px solid ${theme.palette.surface.border}`,
  }),
  menuBtn: { display: { lg: 'none' }, color: 'text.primary' },
  titleWrap: { minWidth: 0, flex: { xs: 1, md: '0 1 auto' }, mr: { md: 2 } },
  title: { color: 'text.primary', lineHeight: 1.25 },
  subtitle: { color: 'text.secondary', display: { xs: 'none', md: 'block' }, maxWidth: 420 },
  search: (theme) => ({
    display: { xs: 'none', xl: 'flex' }, alignItems: 'center', gap: 1, flex: 1, maxWidth: 440, mx: 'auto',
    px: 1.5, height: 42, borderRadius: theme.tokens.radius.md,
    bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.surface.border}`,
    color: theme.palette.text.secondary, cursor: 'pointer', font: 'inherit', transition: `all ${theme.tokens.motion.fast}`,
    '&:hover': { borderColor: theme.palette.primary.light, boxShadow: theme.palette.shadow.sm },
  }),
  searchText: { flex: 1, textAlign: 'left', color: 'text.secondary' },
  kbd: (theme) => ({
    fontFamily: theme.tokens.fonts.mono, fontSize: '0.7rem', px: 0.75, py: 0.2,
    borderRadius: theme.tokens.radius.xs, border: `1px solid ${theme.palette.surface.borderStrong}`,
    color: theme.palette.text.secondary, display: 'inline-flex',
  }),
  actions: { display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, ml: { xs: 0, md: 'auto', xl: 0 } },
  iconBtn: (theme) => ({
    width: 42, height: 42, color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.surface.border}`, bgcolor: theme.palette.background.paper,
    '&:hover': { color: theme.palette.primary.main, borderColor: theme.palette.primary.light, bgcolor: theme.palette.primary.soft },
  }),
  searchIconBtn: { display: { xl: 'none' } },
  profileBtn: (theme) => ({
    display: 'flex', alignItems: 'center', gap: 1, pl: 0.5, pr: { xs: 0.5, sm: 1.25 }, py: 0.5, minHeight: 42,
    borderRadius: theme.tokens.radius.pill, border: `1px solid ${theme.palette.surface.border}`,
    bgcolor: theme.palette.background.paper, color: theme.palette.text.primary, cursor: 'pointer', font: 'inherit',
    '&:hover': { borderColor: theme.palette.primary.light, bgcolor: theme.palette.primary.soft },
  }),
  profileText: { display: { xs: 'none', sm: 'block' }, textAlign: 'left', lineHeight: 1.2, maxWidth: 140 },
  profileRole: { color: 'text.secondary', display: 'block' },
  menuHeader: { px: 2, py: 1.5, display: 'flex', gap: 1.25, alignItems: 'center' },
  menuPaper: { minWidth: 240, mt: 1 },
};

export const notifications = {
  paper: { width: 'min(360px, calc(100vw - 24px))', mt: 1, overflow: 'hidden' },
  header: (theme) => ({
    px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
    borderBottom: `1px solid ${theme.palette.surface.border}`,
  }),
  headerTitle: { display: 'flex', alignItems: 'center', gap: 1 },
  count: (theme) => ({
    px: 0.875, py: 0.1, borderRadius: theme.tokens.radius.pill, fontSize: '0.7rem', fontWeight: 700,
    bgcolor: theme.palette.primary.soft, color: theme.palette.primary.main,
  }),
  markBtn: { minHeight: 28, px: 1, fontSize: '0.75rem' },
  list: { maxHeight: { xs: '60vh', md: 360 }, overflowY: 'auto' },
  item: (unread) => (theme) => ({
    display: 'flex', gap: 1.25, px: 2, py: 1.25, alignItems: 'flex-start', cursor: 'pointer', position: 'relative',
    bgcolor: unread ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.035) : 'transparent',
    borderBottom: `1px solid ${theme.palette.surface.border}`,
    transition: `background-color ${theme.tokens.motion.fast}`,
    '&:last-of-type': { borderBottom: 0 },
    '&:hover': { bgcolor: theme.palette.surface.subtle },
  }),
  dot: (tone) => (theme) => ({
    width: 30, height: 30, borderRadius: theme.tokens.radius.sm, flexShrink: 0, display: 'grid', placeItems: 'center', mt: 0.25,
    bgcolor: theme.palette[tone]?.soft || theme.palette.surface.muted, color: theme.palette[tone]?.main || theme.palette.text.secondary,
  }),
  body: { flex: 1, minWidth: 0 },
  titleRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 },
  title: (unread) => ({ color: 'text.primary', fontWeight: unread ? 700 : 500, lineHeight: 1.35 }),
  time: { color: 'text.secondary', flexShrink: 0, whiteSpace: 'nowrap' },
  detail: { color: 'text.secondary', display: 'block', mt: 0.25, lineHeight: 1.4 },
  unreadDot: (theme) => ({
    width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.primary.main, flexShrink: 0, mt: 0.75,
  }),
  footer: (theme) => ({
    px: 2, py: 1, display: 'flex', justifyContent: 'center',
    borderTop: `1px solid ${theme.palette.surface.border}`, bgcolor: theme.palette.surface.subtle,
  }),
};

export const searchDialog = {
  paper: { mt: { xs: 0, sm: 8 }, alignSelf: { sm: 'flex-start' } },
  input: { px: 2, py: 1.5 },
  section: { px: 2, pt: 1.5, pb: 0.5, color: 'text.secondary' },
  list: { px: 1, pb: 1.5, maxHeight: { xs: 'none', sm: 420 }, overflowY: 'auto' },
  item: (theme) => ({ borderRadius: theme.tokens.radius.md, gap: 1.5, py: 1 }),
};
