import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devWarn } from '../utils/devLog';

const STORAGE_KEY = '@openmusic/settings';

export type ThemeMode = 'system' | 'light' | 'dark';
export type StreamQuality = 'auto' | 'high' | 'normal';

/**
 * The active music catalogue source.
 * Only 'jiosaavn' is available right now. When a new source is integrated,
 * add its identifier here and wire it into the API layer — the store,
 * persistence, and settings UI are already structured to support it.
 */
export type MusicSource = 'jiosaavn';

/** All sources that are currently available for selection. */
export const AVAILABLE_MUSIC_SOURCES: MusicSource[] = ['jiosaavn'];

interface SettingsState {
  themeMode: ThemeMode;
  streamQuality: StreamQuality;
  musicSource: MusicSource;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setStreamQuality: (quality: StreamQuality) => Promise<void>;
  setMusicSource: (source: MusicSource) => Promise<void>;
}

const DEFAULT_SETTINGS = {
  themeMode: 'system' as ThemeMode,
  streamQuality: 'auto' as StreamQuality,
  musicSource: 'jiosaavn' as MusicSource,
};

const persist = async (
  state: Pick<SettingsState, 'themeMode' | 'streamQuality' | 'musicSource'>
) => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      themeMode: state.themeMode,
      streamQuality: state.streamQuality,
      musicSource: state.musicSource,
    })
  );
};

const isValidThemeMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark';

const isValidStreamQuality = (v: unknown): v is StreamQuality =>
  v === 'auto' || v === 'high' || v === 'normal';

const isValidMusicSource = (v: unknown): v is MusicSource =>
  AVAILABLE_MUSIC_SOURCES.includes(v as MusicSource);

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
          // If a persisted source is no longer available (e.g. removed),
          // fall back to the default rather than crashing.
          musicSource: isValidMusicSource(parsed.musicSource)
            ? parsed.musicSource
            : DEFAULT_SETTINGS.musicSource,
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
        musicSource: get().musicSource,
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
        musicSource: get().musicSource,
      });
    } catch (err) {
      devWarn('[settingsStore] setStreamQuality persist failed', err);
    }
  },

  setMusicSource: async (source) => {
    set({ musicSource: source });
    try {
      await persist({
        themeMode: get().themeMode,
        streamQuality: get().streamQuality,
        musicSource: source,
      });
    } catch (err) {
      devWarn('[settingsStore] setMusicSource persist failed', err);
    }
  },
}));
