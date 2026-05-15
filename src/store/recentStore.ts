import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Track } from '../api/jiosaavn';

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
      const tracks = raw ? (JSON.parse(raw) as Track[]) : [];
      set({ tracks: Array.isArray(tracks) ? tracks : [], hydrated: true });
    } catch {
      set({ tracks: [], hydrated: true });
    }
  },

  addRecent: async (track) => {
    const withoutDup = get().tracks.filter((t) => t.id !== track.id);
    const tracks = [track, ...withoutDup].slice(0, MAX_RECENT);
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
