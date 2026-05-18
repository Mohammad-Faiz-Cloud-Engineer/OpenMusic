import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devWarn } from '../utils/devLog';

const STORAGE_KEY = '@openmusic/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  themeMode: ThemeMode;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const DEFAULT_SETTINGS = {
  themeMode: 'system' as ThemeMode,
};

const persist = async (
  state: Pick<SettingsState, 'themeMode'>
) => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      themeMode: state.themeMode,
    })
  );
};

const isValidThemeMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark';

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
      await persist({ themeMode: mode });
    } catch (err) {
      devWarn('[settingsStore] setThemeMode persist failed', err);
    }
  },
}));
