import type { ColorSchemeName } from 'react-native';

export type ThemeColors = {
  bg: string;
  glass: string;
  glassBorder: string;
  glassBorderStrong: string;
  surface2: string;
  surface3: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentOverlay: string;
};

export type ThemeGradients = {
  ambientBg: readonly [string, string, string];
};

export const darkColors: ThemeColors = {
  bg: '#0A0A0F',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderStrong: 'rgba(255,255,255,0.25)',
  surface2: '#1C1C2A',
  surface3: '#242434',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#5A5A72',
  accent: '#1DB954',
  accentOverlay: 'rgba(29,185,84,0.15)',
};

export const lightColors: ThemeColors = {
  bg: '#F5F5F7',
  glass: 'rgba(0,0,0,0.05)',
  glassBorder: 'rgba(0,0,0,0.1)',
  glassBorderStrong: 'rgba(0,0,0,0.18)',
  surface2: '#E8E8EE',
  surface3: '#DCDCE4',
  border: 'rgba(0,0,0,0.08)',
  text: '#121218',
  textSecondary: '#4A4A5C',
  textMuted: '#7A7A8C',
  accent: '#1DB954',
  accentOverlay: 'rgba(29,185,84,0.14)',
};

const darkGradients: ThemeGradients = {
  ambientBg: ['#0A0A0F', '#0F0A1A', '#0A0F14'],
};

const lightGradients: ThemeGradients = {
  ambientBg: ['#F5F5F7', '#EEF0F5', '#E8ECF2'],
};

export type AppTheme = {
  colors: ThemeColors;
  gradients: ThemeGradients;
  isDark: boolean;
};

export function getTheme(scheme: ColorSchemeName | null | undefined): AppTheme {
  const isDark = scheme !== 'light';
  return {
    colors: isDark ? darkColors : lightColors,
    gradients: isDark ? darkGradients : lightGradients,
    isDark,
  };
}
