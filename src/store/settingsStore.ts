import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devWarn } from '../utils/devLog';

const STORAGE_KEY = '@openmusic/settings';

export type ThemeMode = 'system' | 'light' | 'dark';
export type StreamQuality = 'auto' | 'high' | 'normal';

interface SettingsState {
  themeMode: ThemeMode;
  streamQuality: StreamQuality;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setStreamQuality: (quality: StreamQuality) => Promise<void>;
}

const DEFAULT_SETTINGS = {
  themeMode: 'system' as ThemeMode,
  streamQuality: 'auto' as StreamQuality,
};

const persist = async (
  state: Pick<SettingsState, 'themeMode' | 'streamQuality'>
) => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      themeMode: state.themeMode,
      streamQuality: state.streamQuality,
    })
  );
};

const isValidThemeMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark';

const isValidStreamQuality = (v: unknown): v is StreamQuality =>
  v === 'auto' || v === 'high' || v === 'normal';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        set({
          themeMode: isValidThemeMode(parsed.themeMode)
            ? parsed.themeMode
            : DEFAULT_SETTINGS.themeMode,
          streamQuality: isValidStreamQuality(parsed.streamQuality)
            ? parsed.streamQuality
            : DEFAULT_SETTINGS.streamQuality,
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch (err) {
      devWarn('[settingsStore] hydrate failed', err);
      set((s) => ({ ...s, hydrated: true }));
    }
  },

  setThemeMode: async (mode) => {
    set({ themeMode: mode });
    try {
      await persist({
        themeMode: mode,
        streamQuality: get().streamQuality,
      });
    } catch (err) {
      devWarn('[settingsStore] setThemeMode persist failed', err);
    }
  },

  setStreamQuality: async (quality) => {
    set({ streamQuality: quality });
    try {
      await persist({
        themeMode: get().themeMode,
        streamQuality: quality,
      });
    } catch (err) {
      devWarn('[settingsStore] setStreamQuality persist failed', err);
    }
  },
}));
