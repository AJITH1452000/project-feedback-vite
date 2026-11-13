/**
 * Design tokens — the ONLY place raw colors, fonts, radii, shadows and
 * breakpoints are written. Components never hardcode these values; they
 * reference them through the MUI theme (see ./theme.js) or the shared
 * sx style maps in src/styles.
 */

export const fonts = {
  body: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  heading: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export const fontWeights = { regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 };

/**
 * Breakpoints cover every common device class:
 *  xs  0     small phones (320–479: iPhone SE, Galaxy Fold, mini)
 *  sm  480   large phones (480–767: Pro Max, Pixel XL, phablets / landscape phones)
 *  md  768   tablets portrait (iPad mini, iPad, Galaxy Tab)
 *  lg  1024  tablets landscape / small laptops (iPad Pro, Surface)
 *  xl  1280  laptops & desktops
 *  xxl 1600  large / ultra-wide desktops
 */
export const breakpoints = { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280, xxl: 1600 };

export const radius = { xs: 6, sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const layout = {
  sidebarWidth: 276,
  topbarHeight: 68,
  contentMaxWidth: 1680,
  loginCardMaxWidth: 468,
};

export const motion = {
  fast: '160ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '240ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '420ms cubic-bezier(0.22, 1, 0.36, 1)',
};

const shared = {
  white: '#FFFFFF',
  black: '#000000',
  star: '#F5A524',
};

export const palettes = {
  light: {
    mode: 'light',
    primary: { main: '#5B4CF0', light: '#8D82FF', dark: '#4033C9', soft: '#EEECFF', contrastText: shared.white },
    secondary: { main: '#0EA5B7', light: '#5ED3DF', dark: '#0B7F8D', soft: '#E3F7F9', contrastText: shared.white },
    success: { main: '#12A27A', light: '#4CC9A0', dark: '#0B7A5B', soft: '#E4F7F0', contrastText: shared.white },
    warning: { main: '#E08A12', light: '#F5B451', dark: '#B26A06', soft: '#FFF4E2', contrastText: shared.white },
    error: { main: '#E0436A', light: '#F27C99', dark: '#B42A4D', soft: '#FDECF1', contrastText: shared.white },
    info: { main: '#2F7CF6', light: '#6EA6FA', dark: '#1D5BC4', soft: '#E8F1FE', contrastText: shared.white },
    background: { default: '#F4F6FB', paper: '#FFFFFF' },
    text: { primary: '#141B34', secondary: '#5A6382', disabled: '#A3AAC2' },
    divider: '#E6E9F2',
    surface: {
      subtle: '#F8F9FD',
      muted: '#F0F2F9',
      hover: '#F3F2FF',
      border: '#E6E9F2',
      borderStrong: '#D5DAE8',
      overlay: 'rgba(244, 246, 251, 0.78)',
    },
    nav: {
      bg: '#FFFFFF',
      bgAlt: '#FAFBFE',
      text: '#5A6382',
      textActive: '#141B34',
      label: '#8A92AD',
      activeBg: '#EEECFF',
      hoverBg: 'rgba(91, 76, 240, 0.06)',
      border: '#E6E9F2',
    },
    brand: {
      gradient: 'linear-gradient(135deg, #7C6BFF 0%, #5B4CF0 45%, #0EA5B7 100%)',
      gradientSoft: 'linear-gradient(135deg, rgba(124,107,255,0.10) 0%, rgba(14,165,183,0.08) 100%)',
      heroGradient: 'linear-gradient(135deg, #F1EFFF 0%, #F6F5FF 45%, #E6F8FA 100%)',
      glow: 'rgba(91, 76, 240, 0.32)',
      orbA: 'rgba(124, 107, 255, 0.28)',
      orbB: 'rgba(14, 165, 183, 0.22)',
      heroText: '#141B34',
      heroMuted: '#5A6382',
      heroCard: 'rgba(255, 255, 255, 0.72)',
      heroBorder: 'rgba(91, 76, 240, 0.18)',
    },
    tooltip: { bg: '#141B34', text: shared.white },
    star: shared.star,
    avatar: ['#5B4CF0', '#0EA5B7', '#12A27A', '#E08A12', '#E0436A', '#2F7CF6', '#9B51E0', '#D9488F'],
    chart: ['#5B4CF0', '#0EA5B7', '#12A27A', '#E08A12', '#E0436A', '#2F7CF6'],
    // Sequential indigo ramp for ordered values (1★ → 5★): light → dark on a light surface.
    sequential: ['#D9D5FF', '#B3AAFF', '#8D82FF', '#5B4CF0', '#3A2DB8'],
    shadow: {
      sm: '0 1px 2px rgba(20, 27, 52, 0.05), 0 1px 3px rgba(20, 27, 52, 0.04)',
      md: '0 6px 20px rgba(20, 27, 52, 0.06), 0 2px 6px rgba(20, 27, 52, 0.04)',
      lg: '0 18px 48px rgba(20, 27, 52, 0.12)',
      brand: '0 10px 26px rgba(91, 76, 240, 0.32)',
    },
    common: shared,
  },
  dark: {
    mode: 'dark',
    primary: { main: '#8D82FF', light: '#B1A9FF', dark: '#6B5EF5', soft: 'rgba(141, 130, 255, 0.14)', contrastText: '#0B0F24' },
    secondary: { main: '#38C6D6', light: '#7ADDE7', dark: '#1597A6', soft: 'rgba(56, 198, 214, 0.14)', contrastText: '#06232A' },
    success: { main: '#34D399', light: '#6EE7B7', dark: '#10B981', soft: 'rgba(52, 211, 153, 0.14)', contrastText: '#052E21' },
    warning: { main: '#FBBF24', light: '#FCD34D', dark: '#D97706', soft: 'rgba(251, 191, 36, 0.14)', contrastText: '#2E1F02' },
    error: { main: '#FB7185', light: '#FDA4AF', dark: '#E11D48', soft: 'rgba(251, 113, 133, 0.15)', contrastText: '#330611' },
    info: { main: '#60A5FA', light: '#93C5FD', dark: '#3B82F6', soft: 'rgba(96, 165, 250, 0.14)', contrastText: '#06173A' },
    background: { default: '#080C1D', paper: '#10152D' },
    text: { primary: '#EEF1FA', secondary: '#A3ACC9', disabled: '#5D6687' },
    divider: '#1F2647',
    surface: {
      subtle: '#141A36',
      muted: '#192043',
      hover: '#1C2350',
      border: '#222A4E',
      borderStrong: '#2E3762',
      overlay: 'rgba(8, 12, 29, 0.78)',
    },
    nav: {
      bg: '#0A0E22',
      bgAlt: '#0F1430',
      text: '#9AA3C4',
      textActive: shared.white,
      label: '#5A6389',
      activeBg: 'rgba(141, 130, 255, 0.18)',
      hoverBg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.06)',
    },
    brand: {
      gradient: 'linear-gradient(135deg, #8D82FF 0%, #6B5EF5 45%, #22B5C6 100%)',
      gradientSoft: 'linear-gradient(135deg, rgba(141,130,255,0.16) 0%, rgba(34,181,198,0.10) 100%)',
      heroGradient: 'radial-gradient(120% 90% at 0% 0%, #241F63 0%, #0F1430 50%, #070A1C 100%)',
      glow: 'rgba(141, 130, 255, 0.30)',
      orbA: 'rgba(141, 130, 255, 0.45)',
      orbB: 'rgba(34, 181, 198, 0.38)',
      heroText: shared.white,
      heroMuted: 'rgba(226, 230, 255, 0.68)',
      heroCard: 'rgba(255, 255, 255, 0.06)',
      heroBorder: 'rgba(255, 255, 255, 0.12)',
    },
    tooltip: { bg: '#1C2350', text: shared.white },
    star: shared.star,
    avatar: ['#8D82FF', '#38C6D6', '#34D399', '#FBBF24', '#FB7185', '#60A5FA', '#C084FC', '#F472B6'],
    chart: ['#8D82FF', '#38C6D6', '#34D399', '#FBBF24', '#FB7185', '#60A5FA'],
    // Dark surface: higher values are brighter (dim → bright).
    sequential: ['#3A3480', '#5248B8', '#6F63E8', '#9A90FF', '#C9C3FF'],
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
      md: '0 8px 24px rgba(0, 0, 0, 0.35)',
      lg: '0 20px 56px rgba(0, 0, 0, 0.5)',
      brand: '0 10px 28px rgba(107, 94, 245, 0.35)',
    },
    common: shared,
  },
};
