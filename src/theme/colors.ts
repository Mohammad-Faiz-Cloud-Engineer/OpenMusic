/**
 * OpenMusic Design Tokens — Spotify-inspired professional dark theme
 *
 * Philosophy (same as Spotify):
 *  - UI chrome is near-black and neutral so album art owns the color
 *  - One accent color (#1DB954 green) used sparingly for interactive states
 *  - No decorative gradients on UI elements — gradients only on artwork overlays
 *  - Text hierarchy: white → #B3B3B3 → #6A6A6A
 */

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: '#121212',          // Spotify's exact base background
  surface: '#181818',     // Cards, sheets, bottom bar
  surface2: '#242424',    // Elevated surfaces, inputs
  surface3: '#2A2A2A',    // Hover / pressed states
  card: '#181818',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: '#282828',
  borderLight: '#3E3E3E',

  // ── Text ──────────────────────────────────────────────────────────────────
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',   // Spotify's secondary text
  textMuted: '#6A6A6A',       // Disabled / placeholder

  // ── Accent — Spotify green ────────────────────────────────────────────────
  accent: '#1DB954',          // Spotify's brand green
  accentDark: '#158A3E',      // Pressed / darker variant
  accentLight: '#1ED760',     // Hover / lighter variant

  // ── Status ────────────────────────────────────────────────────────────────
  green: '#1DB954',
  red: '#E22134',
  yellow: '#F59B23',

  // ── Gradient stops (artwork overlays only) ────────────────────────────────
  gradientStart: '#1DB954',
  gradientMid: '#158A3E',
  gradientEnd: '#1DB954',

  // ── Player ────────────────────────────────────────────────────────────────
  playerBg: '#121212',
  playerSurface: '#181818',

  // ── Overlays ──────────────────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
  accentOverlay: 'rgba(29,185,84,0.12)',
  accentOverlayStrong: 'rgba(29,185,84,0.22)',
};

export const Gradients = {
  // Used only on artwork/image overlays — never on UI chrome
  artworkBottom: ['transparent', 'rgba(0,0,0,0.9)'] as const,
  artworkFull: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'] as const,
  dark: ['#121212', '#181818'] as const,
  playerBg: ['#1A1A1A', '#121212', '#0A0A0A'] as const,
  transparent: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.9)'] as const,
  // Accent gradient — used only on the play button
  accent: ['#1DB954', '#158A3E'] as const,
};
