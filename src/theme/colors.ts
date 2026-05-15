/**
 * OpenMusic Design Tokens — Glassmorphic dark theme
 *
 * Philosophy:
 *  - Deep near-black base so frosted glass has contrast to blur against
 *  - Glass surfaces: semi-transparent rgba + BlurView + white-tinted 1px border
 *  - One accent: #1DB954 (Spotify green) — used only on interactive elements
 *  - Text: white → #B3B3B3 → #6A6A6A
 *  - All corners rounded: cards 20, list rows 16, pills 28, sheets 24
 */

export const Colors = {
  // ── Base backgrounds ──────────────────────────────────────────────────────
  bg: '#0A0A0F',           // Deepest base — gives glass layers depth

  // ── Glass surfaces (use with BlurView) ────────────────────────────────────
  glass: 'rgba(255,255,255,0.06)',        // Primary glass fill
  glassBorder: 'rgba(255,255,255,0.12)', // Glass border (1px)
  glassBorderStrong: 'rgba(255,255,255,0.25)',

  // ── Solid surfaces (fallback / non-blurred) ───────────────────────────────
  surface2: '#1C1C2A',
  surface3: '#242434',

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(255,255,255,0.08)',

  // ── Text ──────────────────────────────────────────────────────────────────
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#5A5A72',

  // ── Accent ────────────────────────────────────────────────────────────────
  accent: '#1DB954',
  accentOverlay: 'rgba(29,185,84,0.15)',
};

export const Gradients = {
  // Ambient background glow — gives glass something to blur against
  ambientBg: ['#0A0A0F', '#0F0A1A', '#0A0F14'] as const,
};
