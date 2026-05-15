export const Colors = {
  // Backgrounds
  bg: '#0A0A0F',
  surface: '#12121A',
  surface2: '#1A1A26',
  surface3: '#242433',
  card: '#16161F',

  // Borders
  border: '#2A2A3A',
  borderLight: '#3A3A50',

  // Text
  text: '#F0F0FF',
  textSecondary: '#9090B0',
  textMuted: '#5A5A78',

  // Accent — vibrant purple-pink gradient
  accent: '#A855F7',
  accentDark: '#7C3AED',
  accentLight: '#C084FC',
  pink: '#EC4899',
  pinkDark: '#BE185D',

  // Status
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#F59E0B',

  // Gradient stops
  gradientStart: '#A855F7',
  gradientMid: '#7C3AED',
  gradientEnd: '#EC4899',

  // Player
  playerBg: '#0D0D18',
  playerSurface: '#1A1A2E',

  // Transparent
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.3)',
  accentOverlay: 'rgba(168,85,247,0.15)',
  accentOverlayStrong: 'rgba(168,85,247,0.25)',
};

export const Gradients = {
  accent: ['#A855F7', '#7C3AED', '#EC4899'] as const,
  accentHorizontal: ['#A855F7', '#EC4899'] as const,
  dark: ['#0A0A0F', '#12121A'] as const,
  card: ['#1A1A26', '#12121A'] as const,
  playerBg: ['#1A0A2E', '#0A0A1A', '#0A0A0F'] as const,
  transparent: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)'] as const,
};
