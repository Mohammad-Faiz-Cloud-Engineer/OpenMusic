import type { AccessibilityRole } from 'react-native';

export const a11yButton = (label: string, hint?: string) => ({
  accessible: true,
  accessibilityRole: 'button' as AccessibilityRole,
  accessibilityLabel: label,
  ...(hint ? { accessibilityHint: hint } : {}),
});

export const a11yHeader = (label: string) => ({
  accessible: true,
  accessibilityRole: 'header' as AccessibilityRole,
  accessibilityLabel: label,
});

export const a11yImage = (label: string) => ({
  accessible: true,
  accessibilityRole: 'image' as AccessibilityRole,
  accessibilityLabel: label,
});
