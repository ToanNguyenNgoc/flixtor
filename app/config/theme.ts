// ============================================================
// DESIGN SYSTEM — Netflix Clone Theme
// ============================================================

import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Colors ──────────────────────────────────────────────────
export const Colors = {
  // Backgrounds
  background: '#080808',
  backgroundCard: '#141414',
  backgroundElevated: '#1E1E1E',
  backgroundOverlay: 'rgba(8, 8, 8, 0.85)',
  backgroundTransparent:'transparent',
  backgroundOverlayLight:'#0808082d',

  // Primary
  primary: '#E50914',
  primaryLight: '#FF3040',
  primaryDark: '#B0060E',

  // Text
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#6B6B6B',
  textDisabled: '#404040',

  // UI Elements
  border: '#2A2A2A',
  divider: '#1F1F1F',
  icon: '#B3B3B3',
  iconActive: '#FFFFFF',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayDark: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Status
  success: '#46D369',
  warning: '#F5A623',
  error: '#E50914',
  info: '#0489C5',

  // Gradients (used as color stops)
  gradientStart: 'transparent',
  gradientEnd: '#080808',

  // Skeleton
  skeletonBase: '#1E1E1E',
  skeletonHighlight: '#2A2A2A',

  // Tab Bar
  tabActive: '#FFFFFF',
  tabInactive: '#666666',
  tabBackground: '#000000',

  // Profile colors
  profileColors: [
    '#E50914', '#0489C5', '#46D369',
    '#F5A623', '#9B59B6', '#E67E22',
  ],

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─── Typography ───────────────────────────────────────────────
export const Typography = {
  fontFamily: {
    regular: Platform.select({ ios: 'System', android: 'sans-serif' }),
    medium: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
    bold: Platform.select({ ios: 'System', android: 'sans-serif' }),
    light: Platform.select({ ios: 'System', android: 'sans-serif-light' }),
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────
export const Shadows = {
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    android: { elevation: 4 },
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    android: { elevation: 8 },
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16 },
    android: { elevation: 16 },
  }),
} as const;

// ─── Screen Dimensions ────────────────────────────────────────
export const Screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
} as const;

// ─── Card Dimensions ──────────────────────────────────────────
export const CardSize = {
  // Portrait poster cards
  poster: {
    width: SCREEN_WIDTH * 0.28,
    height: SCREEN_WIDTH * 0.28 * 1.5,
  },
  // Landscape backdrop cards
  backdrop: {
    width: SCREEN_WIDTH * 0.42,
    height: SCREEN_WIDTH * 0.42 * 0.56,
  },
  // Top 10 cards
  topTen: {
    width: SCREEN_WIDTH * 0.38,
    height: SCREEN_WIDTH * 0.38 * 1.5,
  },
  // Continue watching
  continueWatching: {
    width: SCREEN_WIDTH * 0.42,
    height: SCREEN_WIDTH * 0.42 * 0.56,
  },
  // Hero banner
  hero: {
    height: SCREEN_HEIGHT * 0.65,
  },
} as const;

// ─── Animation ────────────────────────────────────────────────
export const Animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
} as const;

// ─── Z-Index ──────────────────────────────────────────────────
export const ZIndex = {
  base: 0,
  card: 10,
  header: 100,
  modal: 1000,
  overlay: 900,
  toast: 1100,
} as const;

// ─── Common Styles ────────────────────────────────────────────
export const CommonStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
});

// ─── Theme object (combined) ──────────────────────────────────
const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  screen: Screen,
  cardSize: CardSize,
  animation: Animation,
  zIndex: ZIndex,
  commonStyles: CommonStyles,
};

export default theme;
