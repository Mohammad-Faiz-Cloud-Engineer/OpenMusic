import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, type AppTheme } from './tokens';
import { useSettingsStore } from '../store/settingsStore';

export function useTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  return useMemo(() => {
    if (themeMode === 'light') return getTheme('light');
    if (themeMode === 'dark') return getTheme('dark');
    // 'system' — fall back to the OS preference
    return getTheme(systemScheme);
  }, [themeMode, systemScheme]);
}
