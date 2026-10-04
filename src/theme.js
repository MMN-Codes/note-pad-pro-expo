import { Platform } from 'react-native';

// Tokens mirror res/values/dimens.xml + colors.xml of the Android app.
export const C = {
  bg: '#0F1015',
  gold: '#FFD700',
  blue: '#93C5FD',
  danger: '#EF4444',
  success: '#4CAF50',
  textPrimary: '#F2F2F7',
  textSecondary: '#8E8E93',
  glassFill: 'rgba(28,28,30,0.55)',
  glassFillSubtle: 'rgba(28,28,30,0.40)',
  hairline: 'rgba(255,255,255,0.10)',
};
export const PRISM = [
  'rgba(255,255,255,0.38)', 'rgba(147,197,253,0.20)',
  'rgba(255,215,0,0.26)', 'rgba(255,255,255,0.07)',
];
export const T = { micro: 11, caption: 13, body: 15, title: 17, headline: 22, display: 28 };
export const R = { xs: 8, s: 12, m: 16, l: 24, sheet: 28, pill: 999 };
export const S = { xxs: 2, xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, x3: 32, x4: 48 };

// System font on every platform (no binary font files, so Snack import works)
const SYS = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui, -apple-system, sans-serif' });
export const F = { regular: SYS, medium: SYS, bold: SYS };

// NoteBackgroundDrawable dark-mode presets: [fill, stroke, text]
export const BG_STYLES = {
  none:  null,
  blue:  { fill: '#17222E', stroke: '#2A4360', text: '#BFDBFE' },
  peach: { fill: '#241C13', stroke: '#423121', text: '#FFD9A8' },
  mint:  { fill: '#14211A', stroke: '#264533', text: '#BBF7D0' },
  lilac: { fill: '#201A29', stroke: '#362A45', text: '#E9D5FF' },
  rose:  { fill: '#261821', stroke: '#432735', text: '#FECDD3' },
};
