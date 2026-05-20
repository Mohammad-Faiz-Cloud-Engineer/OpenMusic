import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Track } from '../api/jiosaavn';
import { normalizeStoredTrack, sanitizeTrackForStorage } from '../utils/storageTrack';
import { devWarn } from '../utils/devLog';

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function normalizeStoredPlaylist(value: unknown): UserPlaylistStored | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || !value.id.trim()) return null;

  const name =
    typeof value.name === 'string' && value.name.trim()
      ? normalizePlaylistName(value.name)
      : 'Playlist';

  const tracks = Array.isArray(value.tracks)
    ? value.tracks
        .map(normalizeStoredTrack)
        .filter((track): track is Track => track !== null)
    : [];

  const updatedAt =
    typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : Date.now();

  return {
    id: value.id.trim(),
    name,
    tracks,
    updatedAt,
  };
}

export type AddTrackResult = 'added' | 'duplicate' | 'missing';

interface UserPlaylistState {
  playlists: UserPlaylistStored[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createPlaylist: (name: string) => Promise<string>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, name: string) => Promise<void>;
  /** `missing` when playlist id is unknown */
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<AddTrackResult>;
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
      const fromDisk = Array.isArray(parsed)
        ? parsed
            .map(normalizeStoredPlaylist)
            .filter((playlist): playlist is UserPlaylistStored => playlist !== null)
        : [];
      const inMemory = get().playlists;
      const mergedById = new Map<string, UserPlaylistStored>();
      for (const p of fromDisk) mergedById.set(p.id, p);
      // In-session edits win when ids collide (handles hydrate finishing after offline edits).
      for (const p of inMemory) mergedById.set(p.id, p);
      const playlists = [...mergedById.values()].sort((a, b) => b.updatedAt - a.updatedAt);
      set({ playlists, hydrated: true });
    } catch (err) {
      devWarn('[userPlaylistStore] hydrate failed', err);
      set((s) => ({ ...s, hydrated: true }));
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
    } catch (err) {
      devWarn('[userPlaylistStore] create persist failed', err);
    }
    return pl.id;
  },

  deletePlaylist: async (playlistId) => {
    const next = get().playlists.filter((p) => p.id !== playlistId);
    set({ playlists: next });
    try {
      await persist(next);
    } catch (err) {
      devWarn('[userPlaylistStore] delete persist failed', err);
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
    } catch (err) {
      devWarn('[userPlaylistStore] rename persist failed', err);
    }
  },

  addTrackToPlaylist: async (playlistId, track) => {
    const persisted = sanitizeTrackForStorage(track);
    const playlists = get().playlists;
    const targetIdx = playlists.findIndex((p) => p.id === playlistId);
    if (targetIdx < 0) return 'missing';
    const target = playlists[targetIdx];
    if (target.tracks.some((t) => t.id === persisted.id)) return 'duplicate';

    const nextPlaylists = playlists.map((p) =>
      p.id === playlistId
        ? { ...p, tracks: [...p.tracks, persisted], updatedAt: Date.now() }
        : p
    );
    nextPlaylists.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ playlists: nextPlaylists });
    try {
      await persist(nextPlaylists);
    } catch (err) {
      devWarn('[userPlaylistStore] add track persist failed', err);
    }
    return 'added';
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
    } catch (err) {
      devWarn('[userPlaylistStore] remove track persist failed', err);
    }
  },

  getPlaylist: (playlistId) => get().playlists.find((p) => p.id === playlistId),
}));
