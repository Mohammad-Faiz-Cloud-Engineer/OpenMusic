import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Track } from '../api/jiosaavn';
import { sanitizeTrackForStorage } from '../utils/storageTrack';

const STORAGE_KEY = '@openmusic/user-playlists';
export const PLAYLIST_NAME_MAX = 72;

export type UserPlaylistStored = {
  id: string;
  name: string;
  tracks: Track[];
  updatedAt: number;
};

function makePlaylistId(): string {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePlaylistName(name: string): string {
  return name.trim().slice(0, PLAYLIST_NAME_MAX);
}

interface UserPlaylistState {
  playlists: UserPlaylistStored[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createPlaylist: (name: string) => Promise<string>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, name: string) => Promise<void>;
  /** Returns false if duplicate track already in playlist */
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylist: (playlistId: string) => UserPlaylistStored | undefined;
}

const persist = async (playlists: UserPlaylistStored[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
};

export const useUserPlaylistStore = create<UserPlaylistState>((set, get) => ({
  playlists: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as UserPlaylistStored[]) : [];
      const playlists = Array.isArray(parsed)
        ? parsed.map((p) => ({
            ...p,
            name:
              typeof p.name === 'string' && p.name.trim()
                ? normalizePlaylistName(p.name)
                : 'Playlist',
            tracks: Array.isArray(p.tracks)
              ? p.tracks.map((t) => sanitizeTrackForStorage(t))
              : [],
            updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
          }))
        : [];
      playlists.sort((a, b) => b.updatedAt - a.updatedAt);
      set({ playlists, hydrated: true });
    } catch {
      set({ playlists: [], hydrated: true });
    }
  },

  createPlaylist: async (name) => {
    const trimmed = normalizePlaylistName(name || 'Playlist') || 'Playlist';
    const pl: UserPlaylistStored = {
      id: makePlaylistId(),
      name: trimmed || 'Playlist',
      tracks: [],
      updatedAt: Date.now(),
    };
    const next = [pl, ...get().playlists];
    set({ playlists: next });
    try {
      await persist(next);
    } catch {
      /* keep memory */
    }
    return pl.id;
  },

  deletePlaylist: async (playlistId) => {
    const next = get().playlists.filter((p) => p.id !== playlistId);
    set({ playlists: next });
    try {
      await persist(next);
    } catch {
      /* */
    }
  },

  renamePlaylist: async (playlistId, name) => {
    const trimmed = normalizePlaylistName(name || 'Playlist') || 'Playlist';
    const next = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, name: trimmed, updatedAt: Date.now() } : p
    );
    set({ playlists: next });
    try {
      await persist(next);
    } catch {
      /* */
    }
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const persisted = sanitizeTrackForStorage(track);
    let added = false;
    const next = get().playlists.map((p) => {
      if (p.id !== playlistId) return p;
      if (p.tracks.some((t) => t.id === persisted.id)) return p;
      added = true;
      return {
        ...p,
        tracks: [...p.tracks, persisted],
        updatedAt: Date.now(),
      };
    });
    if (!added) return false;
    next.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ playlists: next });
    try {
      await persist(next);
    } catch {
      /* */
    }
    return true;
  },

  removeTrackFromPlaylist: async (playlistId, trackId) => {
    const next = get().playlists.map((p) => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: p.tracks.filter((t) => t.id !== trackId),
        updatedAt: Date.now(),
      };
    });
    next.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ playlists: next });
    try {
      await persist(next);
    } catch {
      /* */
    }
  },

  getPlaylist: (playlistId) => get().playlists.find((p) => p.id === playlistId),
}));
