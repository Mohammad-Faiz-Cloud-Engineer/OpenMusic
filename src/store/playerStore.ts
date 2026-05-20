import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track, getStreamUrl, getProxyPlayUrl } from '../api/jiosaavn';
import { useRecentStore } from './recentStore';
import { devError, devWarn } from '../utils/devLog';
import { isCacheExpired, pickShuffleIndex, type CachedStream } from '../utils/playerUtils';

import { requestOpenFullPlayer } from '../navigation/rootNavigation';

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayTrackOptions = {
  /**
   * When true (default), opens the stack Player modal after a user taps a song.
   * When false, skips navigation (next/prev/auto-advance).
   */
  openFullPlayer?: boolean;
};

interface PlayerState {
  // Queue
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;

  // Playback
  sound: Audio.Sound | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;       // ms
  duration: number;       // ms
  isSeeking: boolean;

  // Modes
  repeatMode: RepeatMode;
  isShuffle: boolean;

  streamCache: Record<string, CachedStream>;
  /** Bumped on each playTrack to ignore stale async completions */
  playGeneration: number;

  // Actions
  playTrack: (track: Track, queue?: Track[], options?: PlayTrackOptions) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number, options?: PlayTrackOptions) => Promise<void>;
  togglePlay: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setIsSeeking: (v: boolean) => void;
  setPosition: (v: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  sound: null,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  isSeeking: false,
  repeatMode: 'off',
  isShuffle: false,
  streamCache: {},
  playGeneration: 0,

  setIsSeeking: (v) => set({ isSeeking: v }),
  setPosition: (v) => set({ position: v }),

  playTrack: async (track, queue, options) => {
    const openFullPlayer = options?.openFullPlayer !== false;
    const state = get();
    const generation = state.playGeneration + 1;
    const isStale = () => get().playGeneration !== generation;

    const explicitQueue = queue;
    const baseQueue = explicitQueue ?? state.queue;
    const foundIndex = baseQueue.findIndex((t) => t.id === track.id);
    const finalQueue =
      foundIndex >= 0
        ? baseQueue
        : explicitQueue !== undefined
          ? [track, ...baseQueue]
          : [track];
    const finalIndex = foundIndex >= 0 ? foundIndex : 0;

    set({
      isLoading: true,
      currentTrack: track,
      queue: finalQueue,
      currentIndex: finalIndex,
      playGeneration: generation,
    });

    if (openFullPlayer) {
      requestOpenFullPlayer();
    }

    const previousSound = state.sound;

    try {
      if (previousSound) {
        await previousSound.unloadAsync();
      }
      if (isStale()) return;

      let streamUrl: string;
      const cached = state.streamCache[track.id];

      if (cached && !isCacheExpired(cached)) {
        streamUrl = cached.url;
      } else {
        try {
          const streamData = await getStreamUrl(track.id);
          if (!streamData.stream_url) {
            throw new Error('No stream URL returned');
          }
          streamUrl = streamData.stream_url.replace('web.saavncdn.com', 'aac.saavncdn.com');
          if (isStale()) return;
          set((s) => ({
            streamCache: {
              ...s.streamCache,
              [track.id]: { url: streamUrl, expiresAt: streamData.expires_at },
            },
          }));
        } catch (fetchErr) {
          devWarn('[player] stream URL fetch failed, falling back to proxy:', fetchErr);
          streamUrl = getProxyPlayUrl(track.id);
        }
      }

      if (isStale()) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
        (status: AVPlaybackStatus) => {
          if (get().playGeneration !== generation) return;
          if (!status.isLoaded) {
            if ('error' in status && status.error) {
              devError('[player] playback error:', status.error);
            }
            return;
          }
          const s = get();
          if (!s.isSeeking) {
            set({ position: status.positionMillis, duration: status.durationMillis ?? 0 });
          }
          if (status.didJustFinish) {
            void get().next().catch((err) => devError('[player] auto-advance:', err));
          }
        }
      );

      if (isStale()) {
        await sound.unloadAsync();
        return;
      }

      set({ sound, isPlaying: true, isLoading: false, position: 0 });
      useRecentStore.getState().addRecent(track).catch((err) => devWarn('[player] addRecent failed:', err));
    } catch (err) {
      if (!isStale()) {
        devError('[player] playTrack error:', err);
        set({ isLoading: false, isPlaying: false });
      }
    }
  },

  playQueue: async (tracks, startIndex = 0, options) => {
    if (!tracks.length) return;
    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    const track = tracks[safeIndex];
    if (!track) return;
    await get().playTrack(track, tracks, options);
  },

  togglePlay: async () => {
    const { sound, isPlaying } = get();
    if (!sound) return;
    const wasPlaying = isPlaying;
    set({ isPlaying: !wasPlaying });
    try {
      if (wasPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (err) {
      devError('[player] togglePlay:', err);
      set({ isPlaying: wasPlaying });
    }
  },

  next: async () => {
    const { queue, currentIndex, repeatMode, isShuffle } = get();
    if (!queue.length) return;

    if (repeatMode === 'one') {
      const track = queue[currentIndex];
      if (track) await get().playTrack(track, queue, { openFullPlayer: false });
      return;
    }

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = pickShuffleIndex(queue.length, currentIndex);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else {
          set({ isPlaying: false, position: get().duration });
          return;
        }
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      set({ currentIndex: nextIndex });
      await get().playTrack(nextTrack, queue, { openFullPlayer: false });
    }
  },

  prev: async () => {
    const { queue, currentIndex, position } = get();
    if (!queue.length) return;

    if (position > 3000) {
      const { sound } = get();
      if (sound) {
        await sound.setPositionAsync(0);
        set({ position: 0 });
      }
      return;
    }

    const prevIndex = Math.max(0, currentIndex - 1);
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      set({ currentIndex: prevIndex });
      await get().playTrack(prevTrack, queue, { openFullPlayer: false });
    }
  },

  seekTo: async (positionMs) => {
    const { sound } = get();
    if (!sound) return;
    try {
      await sound.setPositionAsync(positionMs);
      set({ position: positionMs, isSeeking: false });
    } catch (err) {
      devError('[player] seekTo:', err);
      set({ isSeeking: false });
    }
  },

  setRepeat: (mode) => set({ repeatMode: mode }),

  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),

  addToQueue: (track) =>
    set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) =>
    set((s) => {
      const newQueue = s.queue.filter((_, i) => i !== index);
      let newIndex = index < s.currentIndex
        ? s.currentIndex - 1
        : s.currentIndex;
      if (index === s.currentIndex) {
        newIndex = newIndex >= newQueue.length ? newQueue.length - 1 : newIndex;
      }
      return {
        queue: newQueue,
        currentIndex: newIndex,
        currentTrack: index === s.currentIndex
          ? (newQueue[newIndex] ?? null)
          : s.currentTrack,
      };
    }),

  clearQueue: () => {
    const { sound, playGeneration } = get();
    if (sound) {
      sound.unloadAsync().catch((err) => devWarn('[player] clearQueue unload failed:', err));
    }
    set({
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      sound: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      streamCache: {},
      playGeneration: playGeneration + 1,
    });
  },
}));
