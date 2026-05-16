import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, type AppTheme } from './tokens';

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return useMemo(() => getTheme(scheme), [scheme]);
}
