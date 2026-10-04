import { Platform } from 'react-native';

// ============================================================================
// Theme system — port of ThemeHelper + styles.xml (values/ + values-night/)
// 3 packs (Ocean, Classic, Noir Gold) x 3 modes (Light, Dark, System).
// `C`, `PRISM` and `BG_STYLES` are mutated in place by applyPalette(), and the
// app tree is re-mounted (key) when the theme changes, so every file can keep
// importing `C` directly.
// ============================================================================
export const PACK = { OCEAN: 'ocean', CLASSIC: 'classic', NOIR: 'noir' };
export const MODE = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };

// Android #AARRGGBB -> rgba()
export function argb(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#') return hex;
  if (hex.length === 9) {
    const a = parseInt(hex.slice(1, 3), 16) / 255;
    return `rgba(${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${parseInt(hex.slice(7, 9), 16)},${+a.toFixed(3)})`;
  }
  return hex;
}
export function alpha(hex, a) {
  const h = hex.startsWith('#') ? hex : '#FFFFFF';
  const v = h.length === 9 ? h.slice(3) : h.slice(1);
  return `rgba(${parseInt(v.slice(0, 2), 16)},${parseInt(v.slice(2, 4), 16)},${parseInt(v.slice(4, 6), 16)},${a})`;
}

// Values copied 1:1 from styles.xml / values-night/styles.xml / bg_*.xml
const P = {
  ocean: {
    light: { accent: '#0A84FF', onAccent: '#FFFFFF', bg: '#D2E5FB', bgGradient: ['#F0F7FF', '#D2E5FB', '#9EC7F2'],
      glowTop: ['#80FFFFFF', 'right'], glowBottom: ['#40818CF8', 'left'],
      card: '#80FFFFFF', cardBorder: '#330B1D3A', text: '#0B1D3A', textSec: '#4A6488', pill: '#99FFFFFF', icon: '#0B1D3A',
      premium: '#FFD700', blur: '#59EAF3FF', sheet: '#F5F4F9FF', sheetBorder: '#1F0B1D3A', section: '#2563EB',
      btn: ['#3B82F6', '#6366F1'], hl: ['#E6FFFFFF', '#33FFFFFF'] },
    dark: { accent: '#2E93FA', onAccent: '#FFFFFF', bg: '#0B1D3A', bgGradient: ['#051026', '#0B1D3A', '#1E4475'],
      glowTop: ['#402E93FA', 'left'], glowBottom: ['#336366F1', 'right'],
      card: '#1A7FB2FF', cardBorder: '#24A9C8FF', text: '#F5F5F7', textSec: '#BFD0E8', pill: '#1F7FB2FF', icon: '#FFFFFF',
      premium: '#FFD700', blur: '#660B1D3A', sheet: '#F2101D36', sheetBorder: '#33FFFFFF', section: '#93C5FD',
      btn: ['#3B82F6', '#6366F1'], hl: ['#2E9CC8FF', '#0A9CC8FF'] },
  },
  classic: {
    light: { accent: '#0A84FF', onAccent: '#FFFFFF', bg: '#F1F4F9', bgGradient: null, glowTop: null, glowBottom: null,
      card: '#F2FFFFFF', cardBorder: '#E1E6EF', text: '#0F172A', textSec: '#64748B', pill: '#E9EFFA', icon: '#0F172A',
      premium: '#D9A400', blur: '#A6F1F4F9', sheet: '#FFFFFFFF', sheetBorder: '#14000000', section: '#64748B',
      btn: ['#3B82F6', '#6366F1'], hl: ['#5CB4C2D8', '#1FB4C2D8'] },
    dark: { accent: '#0A84FF', onAccent: '#FFFFFF', bg: '#121317', bgGradient: null, glowTop: null, glowBottom: null,
      card: '#CC1B1D22', cardBorder: '#26282E', text: '#F5F6F8', textSec: '#8A8F98', pill: '#1E2025', icon: '#F5F6F8',
      premium: '#FFCC33', blur: '#66000000', sheet: '#FF1B1D22', sheetBorder: '#26FFFFFF', section: '#8A8F98',
      btn: ['#3B82F6', '#6366F1'], hl: ['#66FFFFFF', '#00FFFFFF'] },
  },
  noir: {
    light: { accent: '#B8941F', onAccent: '#1A1A1A', bg: '#FBF6E8', bgGradient: ['#FBF6E8', '#F5ECD2', '#EDE0C0'],
      glowTop: ['#40D4AF37', 'center'], glowBottom: null,
      card: '#8CFFFDF8', cardBorder: '#38B8941F', text: '#231F1A', textSec: '#6B6355', pill: '#2EB8941F', icon: '#231F1A',
      premium: '#B8941F', blur: '#59FBF3DE', sheet: '#D9FFFDF8', sheetBorder: '#33B8941F', section: '#7A705E',
      btn: ['#E5C158', '#9C7D1A'], hl: ['#80FFFFFF', '#00FFFFFF'] },
    dark: { accent: '#E5C158', onAccent: '#1A1A1A', bg: '#0A0A0C', bgGradient: ['#0A0A0C', '#131210', '#1C1A14'],
      glowTop: ['#33D4AF37', 'center'], glowBottom: null,
      card: '#8C141417', cardBorder: '#38E5C158', text: '#F7F4EB', textSec: '#ABA496', pill: '#26E5C158', icon: '#F7F4EB',
      premium: '#FFD700', blur: '#59120F0A', sheet: '#D20E0E12', sheetBorder: '#40E5C158', section: '#8F887A',
      btn: ['#F2CE6B', '#B8941F'], hl: ['#38FFFFFF', '#00FFFFFF'] },
  },
};

// NoteBackgroundDrawable presets (dark + light), + "ink" text colors
const NOTE_BG = {
  dark: {
    blue:  { fill: '#17222E', stroke: '#2A4360', text: '#BFDBFE' },
    peach: { fill: '#241C13', stroke: '#423121', text: '#FFD9A8' },
    mint:  { fill: '#14211A', stroke: '#264533', text: '#BBF7D0' },
    lilac: { fill: '#201A29', stroke: '#362A45', text: '#E9D5FF' },
    rose:  { fill: '#261821', stroke: '#432735', text: '#FECDD3' },
  },
  light: {
    blue:  { fill: '#EFF6FF', stroke: '#BFDBFE', text: '#1E3A8A' },
    peach: { fill: '#FFF7ED', stroke: '#FED7AA', text: '#9A3412' },
    mint:  { fill: '#F0FDF4', stroke: '#BBF7D0', text: '#14532D' },
    lilac: { fill: '#FAF5FF', stroke: '#E9D5FF', text: '#581C87' },
    rose:  { fill: '#FFF1F2', stroke: '#FECDD3', text: '#9F1239' },
  },
};

export const C = {};
export const PRISM = ['', '', '', ''];
export const BG_STYLES = { none: null, blue: null, peach: null, mint: null, lilac: null, rose: null };

// colors_semantic.xml
const SEMANTIC = { blue: '#93C5FD', danger: '#EF4444', success: '#30D158', warning: '#FF9F0A', cyan: '#64D2FF' };

export function applyPalette(pack = PACK.CLASSIC, isDark = true) {
  const p = (P[pack] || P.classic)[isDark ? 'dark' : 'light'];
  Object.assign(C, SEMANTIC, {
    isDark, pack,
    bg: p.bg, bgGradient: p.bgGradient, glowTop: p.glowTop && { color: argb(p.glowTop[0]), side: p.glowTop[1] },
    glowBottom: p.glowBottom && { color: argb(p.glowBottom[0]), side: p.glowBottom[1] },
    gold: p.accent,                      // theme accent (name kept for existing code)
    onAccent: p.onAccent,
    textPrimary: p.text, textSecondary: p.textSec,
    glassFill: argb(p.card), glassFillSubtle: argb(p.card), hairline: argb(p.cardBorder),
    pill: argb(p.pill), iconTint: p.icon, premium: p.premium,
    blurTint: argb(p.blur), sheet: argb(p.sheet), sheetBorder: argb(p.sheetBorder), section: p.section,
    btnStart: p.btn[0], btnEnd: p.btn[1],
    soft: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',     // neutral hover/chip fill
    scrim: 'rgba(0,0,0,0.55)',
  });
  PRISM[0] = argb(p.hl[0]); PRISM[1] = alpha(p.accent, 0.2); PRISM[2] = alpha(p.accent, 0.26); PRISM[3] = argb(p.cardBorder);
  const table = NOTE_BG[isDark ? 'dark' : 'light'];
  Object.keys(table).forEach((k) => { BG_STYLES[k] = table[k]; });
}
applyPalette(PACK.CLASSIC, true); // safe default before settings load

export const T = { micro: 11, caption: 13, body: 15, title: 17, headline: 22, display: 28 };
export const R = { xs: 8, s: 12, m: 16, l: 24, sheet: 28, pill: 999 };
export const S = { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, x3: 32, x4: 48 };

// System font on every platform (no binary font files, so Snack import works)
const SYS = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, -apple-system, sans-serif' });
export const F = { regular: SYS, medium: SYS, bold: SYS };

// For the Settings theme preview cards
export function previewOf(pack, isDark) {
  const p = P[pack][isDark ? 'dark' : 'light'];
  return { bg: p.bg, gradient: p.bgGradient, card: argb(p.card), border: argb(p.cardBorder), text: p.text, accent: p.accent };
}
