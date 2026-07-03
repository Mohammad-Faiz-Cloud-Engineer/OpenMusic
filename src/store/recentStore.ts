import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Track } from '../api/jiosaavn';
import { normalizeStoredTrack, sanitizeTrackForStorage } from '../utils/storageTrack';
import { devWarn } from '../utils/devLog';

const STORAGE_KEY = '@openmusic/recent';
const MAX_RECENT = 50;

interface RecentState {
  tracks: Track[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addRecent: (track: Track) => Promise<void>;
  clearRecent: () => Promise<void>;
}

let hydrationPromise: Promise<void> | null = null;

export const useRecentStore = create<RecentState>((set, get) => ({
  tracks: [],
  hydrated: false,

  hydrate: async () => {
    hydrationPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Track[]) : [];
        const fromDisk = Array.isArray(parsed)
          ? parsed
              .map(normalizeStoredTrack)
              .filter((track): track is Track => track !== null)
              .slice(0, MAX_RECENT)
          : [];
        const mem = get().tracks;
        const memIds = new Set(mem.map((t) => t.id));
        const merged = [...mem, ...fromDisk.filter((t) => !memIds.has(t.id))].slice(0, MAX_RECENT);
        set({ tracks: merged, hydrated: true });
      } catch (err) {
        devWarn('[recentStore] hydrate failed', err);
        set((s) => ({ ...s, hydrated: true }));
      } finally {
        hydrationPromise = null;
      }
    })();
    await hydrationPromise;
  },

  addRecent: async (track) => {
    if (!get().hydrated && hydrationPromise) {
      await hydrationPromise;
    }
    const persisted = sanitizeTrackForStorage(track);
    const withoutDup = get().tracks.filter((t) => t.id !== persisted.id);
    const tracks = [persisted, ...withoutDup].slice(0, MAX_RECENT);
    set({ tracks });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch (err) {
      devWarn('[recentStore] persist failed', err);
    }
  },

  clearRecent: async () => {
    set({ tracks: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      devWarn('[recentStore] clear failed', err);
    }
  },
}));
