import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Track } from '../api/jiosaavn';
import { normalizeStoredTrack, sanitizeTrackForStorage } from '../utils/storageTrack';

const STORAGE_KEY = '@openmusic/liked';
const MAX_LIKED = 500;

interface LikeState {
  tracksByIdOrder: Track[];
  likedIds: Set<string>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleLike: (track: Track) => Promise<void>;
  isLiked: (id: string) => boolean;
  getTracks: () => Track[];
}

const idsFromTracks = (tracks: Track[]): Set<string> =>
  new Set(tracks.map((t) => t.id));

export const useLikeStore = create<LikeState>((set, get) => ({
  tracksByIdOrder: [],
  likedIds: new Set(),
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Track[]) : [];
      const fromDisk = Array.isArray(parsed)
        ? parsed
            .map(normalizeStoredTrack)
            .filter((track): track is Track => track !== null)
            .slice(0, MAX_LIKED)
        : [];
      const mem = get().tracksByIdOrder;
      const memIds = new Set(mem.map((t) => t.id));
      const merged = [...mem, ...fromDisk.filter((t) => !memIds.has(t.id))].slice(0, MAX_LIKED);
      set({ tracksByIdOrder: merged, likedIds: idsFromTracks(merged), hydrated: true });
    } catch {
      set((s) => ({ ...s, hydrated: true }));
    }
  },

  toggleLike: async (track) => {
    const persisted = sanitizeTrackForStorage(track);
    const ids = get().likedIds;
    let nextTracks: Track[];
    if (ids.has(persisted.id)) {
      nextTracks = get().tracksByIdOrder.filter((t) => t.id !== persisted.id);
    } else {
      nextTracks = [persisted, ...get().tracksByIdOrder.filter((t) => t.id !== persisted.id)].slice(
        0,
        MAX_LIKED
      );
    }
    set({ tracksByIdOrder: nextTracks, likedIds: idsFromTracks(nextTracks) });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTracks));
    } catch {
      // keep in-memory state
    }
  },

  isLiked: (id) => get().likedIds.has(id),

  getTracks: () => get().tracksByIdOrder,
}));
