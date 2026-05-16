import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Track } from '../api/jiosaavn';
import { sanitizeTrackForStorage } from '../utils/storageTrack';

const STORAGE_KEY = '@openmusic/recent';
const MAX_RECENT = 50;

interface RecentState {
  tracks: Track[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addRecent: (track: Track) => Promise<void>;
  clearRecent: () => Promise<void>;
}

export const useRecentStore = create<RecentState>((set, get) => ({
  tracks: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Track[]) : [];
      const fromDisk = Array.isArray(parsed)
        ? parsed.map(sanitizeTrackForStorage).slice(0, MAX_RECENT)
        : [];
      const mem = get().tracks;
      const memIds = new Set(mem.map((t) => t.id));
      const merged = [...mem, ...fromDisk.filter((t) => !memIds.has(t.id))].slice(0, MAX_RECENT);
      set({ tracks: merged, hydrated: true });
    } catch {
      set((s) => ({ ...s, hydrated: true }));
    }
  },

  addRecent: async (track) => {
    const persisted = sanitizeTrackForStorage(track);
    const withoutDup = get().tracks.filter((t) => t.id !== persisted.id);
    const tracks = [persisted, ...withoutDup].slice(0, MAX_RECENT);
    set({ tracks });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch {
      // Non-fatal: in-memory recent still works this session
    }
  },

  clearRecent: async () => {
    set({ tracks: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
