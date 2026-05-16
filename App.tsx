import React, { useEffect } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { useRecentStore } from './src/store/recentStore';
import { useLikeStore } from './src/store/likeStore';
import { useUserPlaylistStore } from './src/store/userPlaylistStore';
import { useTheme } from './src/theme';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  })
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const message = error instanceof Error ? error.message : '';
        if (message === 'Network unavailable') return false;
        return failureCount < 2;
      },
      retryDelay: 1000,
      staleTime: 60_000,
      networkMode: 'offlineFirst',
    },
  },
});

function ThemedShell() {
  const { colors, isDark } = useTheme();
  const hydrateRecent = useRecentStore((s) => s.hydrate);
  const hydrateLikes = useLikeStore((s) => s.hydrate);
  const hydratePlaylists = useUserPlaylistStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateRecent();
    void hydrateLikes();
    void hydratePlaylists();
  }, [hydrateRecent, hydrateLikes, hydratePlaylists]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} translucent={false} />
      <OfflineBanner />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const fallbackBg = scheme === 'light' ? '#F5F5F7' : '#0A0A0F';

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: fallbackBg }]}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemedShell />
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
