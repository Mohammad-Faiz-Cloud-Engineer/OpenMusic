import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devWarn } from '../utils/devLog';

const STORAGE_KEY = '@openmusic/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

export type HomeSectionId = 
  | 'featuredBanner'
  | 'quickPicks'
  | 'topCharts'
  | 'trendingNow'
  | 'loveSongs'
  | 'punjabiHits';

export const HOME_SECTIONS: HomeSectionId[] = [
  'featuredBanner',
  'quickPicks',
  'topCharts',
  'trendingNow',
  'loveSongs',
  'punjabiHits',
];

type HomeSections = Record<HomeSectionId, boolean>;

interface SettingsState {
  themeMode: ThemeMode;
  homeSections: HomeSections;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setHomeSection: (section: HomeSectionId, visible: boolean) => Promise<void>;
}

const DEFAULT_HOME_SECTIONS: HomeSections = {
  featuredBanner: true,
  quickPicks: true,
  topCharts: true,
  trendingNow: true,
  loveSongs: true,
  punjabiHits: true,
};

const DEFAULT_SETTINGS = {
  themeMode: 'system' as ThemeMode,
  homeSections: DEFAULT_HOME_SECTIONS,
};

const persist = async (
  state: Pick<SettingsState, 'themeMode' | 'homeSections'>
) => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      themeMode: state.themeMode,
      homeSections: state.homeSections,
    })
  );
};

const isValidThemeMode = (v: unknown): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark';

const isValidHomeSections = (v: unknown): v is HomeSections => {
  if (typeof v !== 'object' || v === null) return false;
  return HOME_SECTIONS.every((id) => typeof (v as Record<string, unknown>)[id] === 'boolean');
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const next: Partial<SettingsState> = { hydrated: true };
        if (isValidThemeMode(parsed.themeMode)) {
          next.themeMode = parsed.themeMode;
        }
        if (isValidHomeSections(parsed.homeSections)) {
          next.homeSections = { ...DEFAULT_HOME_SECTIONS, ...(parsed.homeSections as HomeSections) };
        }
        set(next as SettingsState);
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
      await persist({ themeMode: mode, homeSections: get().homeSections });
    } catch (err) {
      devWarn('[settingsStore] setThemeMode persist failed', err);
    }
  },

  setHomeSection: async (section, visible) => {
    set((s) => ({ homeSections: { ...s.homeSections, [section]: visible } }));
    try {
      await persist({ themeMode: get().themeMode, homeSections: get().homeSections });
    } catch (err) {
      devWarn('[settingsStore] setHomeSection persist failed', err);
    }
  },
}));
