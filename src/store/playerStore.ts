import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track, getStreamUrl, getProxyPlayUrl } from '../api/jiosaavn';
import { useRecentStore } from './recentStore';
import { devError, devWarn } from '../utils/devLog';
import { isCacheExpired, shuffleArray, type CachedStream } from '../utils/playerUtils';

import { requestOpenFullPlayer } from '../navigation/rootNavigation';

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayTrackOptions = {
  /**
   * When true (default), opens the stack Player modal after a user taps a song.
   * When false, skips navigation (next/prev/auto-advance).
   */
  openFullPlayer?: boolean;
  /**
   * Explicit index of the track in the queue, to avoid finding the wrong instance 
   * of a duplicate track.
   */
  index?: number;
};

interface PlayerState {
  // Queue
  queue: Track[];
  originalQueue: Track[];
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

  // Stream URL cache avoids re-fetching signed CDN URLs that are still valid.
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
  originalQueue: [],
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

    // Atomic generation bump — prevents stale concurrent playTrack calls
    // from both computing the same generation value.
    let generation: number;
    set((s) => {
      generation = s.playGeneration + 1;
      return { playGeneration: generation };
    });
    const isStale = () => get().playGeneration !== generation;

    const explicitQueue = queue;
    const baseQueue = explicitQueue ?? state.queue;
    
    let foundIndex = options?.index;
    if (foundIndex === undefined || foundIndex < 0 || foundIndex >= baseQueue.length || baseQueue[foundIndex].id !== track.id) {
      foundIndex = baseQueue.findIndex((t) => t.id === track.id);
    }
    
    const finalQueue =
      foundIndex >= 0
        ? baseQueue
        : explicitQueue !== undefined
          ? [track, ...baseQueue]
          : [track];
    const finalIndex = foundIndex >= 0 ? foundIndex : 0;

    let appliedQueue = finalQueue;
    let appliedIndex = finalIndex;
    let newOriginalQueue = state.originalQueue;

    const isNewContext =
      (explicitQueue !== undefined && explicitQueue !== state.queue) ||
      (explicitQueue === undefined && foundIndex < 0);

    if (isNewContext) {
      if (state.isShuffle) {
        newOriginalQueue = finalQueue;
        const remaining = finalQueue.filter((_, i) => i !== finalIndex);
        appliedQueue = [track, ...shuffleArray(remaining)];
        appliedIndex = 0;
      } else {
        newOriginalQueue = [];
      }
    }

    set({
      isLoading: true,
      currentTrack: track,
      queue: appliedQueue,
      originalQueue: newOriginalQueue,
      currentIndex: appliedIndex,
    });

    if (openFullPlayer) {
      requestOpenFullPlayer();
    }

    const previousSound = state.sound;

    try {
      if (previousSound) {
        try {
          await previousSound.unloadAsync();
        } catch (unloadErr) {
          devWarn('[player] failed to unload previous sound:', unloadErr);
        }
      }
      if (isStale()) return;

      // Step 1: resolve the signed CDN URL.
      // Use the client-side cache if the URL is still valid. This avoids a round
      // trip to the API for every track play and prevents hammering the HF
      // rate limiter (120 req/60s).
      let streamUrl: string;
      const cached = state.streamCache[track.id];

      if (cached && !isCacheExpired(cached)) {
        // Cache hit: use the existing signed URL directly.
        streamUrl = cached.url;
      } else {
        // Cache miss or expired: fetch a fresh signed URL from the backend.
        try {
          const streamData = await getStreamUrl(track.id);
          if (!streamData.stream_url) {
            throw new Error('No stream URL returned');
          }
          // web.saavncdn.com needs Referer headers expo-av does not send (403).
          streamUrl = streamData.stream_url.replace('web.saavncdn.com', 'aac.saavncdn.com');
          if (isStale()) return;
          // Cache it for the duration of its validity (LRU, max ~100 entries).
          set((s) => {
            const next = {
              ...s.streamCache,
              [track.id]: { url: streamUrl, expiresAt: streamData.expires_at },
            };
            const keys = Object.keys(next);
            if (keys.length > 100) {
              const toRemove = new Set(keys.slice(0, keys.length - 100));
              return { streamCache: Object.fromEntries(Object.entries(next).filter(([k]) => !toRemove.has(k))) };
            }
            return { streamCache: next };
          });
        } catch (fetchErr) {
          devWarn('[player] stream URL fetch failed, falling back to proxy:', fetchErr);
          streamUrl = getProxyPlayUrl(track.id);
        }
      }

      if (isStale()) return;

      // Step 2: configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Step 3: load and play. expo-av uses range requests against the
      // signed CDN URL directly, no proxy in the hot path.
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
          // Sync play/pause with OS-level audio interuptions (calls, alarms, etc.)
          set((state) => ({
            ...(state.isPlaying !== status.isPlaying ? { isPlaying: status.isPlaying } : {}),
            ...(!state.isSeeking ? { position: status.positionMillis, duration: status.durationMillis ?? 0 } : {}),
          }));
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
      void useRecentStore.getState().addRecent(track).catch((err) => devError('[player] addRecent failed:', err));
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
    await get().playTrack(track, tracks, { ...options, index: safeIndex });
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
      if (track) await get().playTrack(track, queue, { openFullPlayer: false, index: currentIndex });
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') nextIndex = 0;
      else {
        set({ isPlaying: false, position: get().duration });
        return;
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      set({ currentIndex: nextIndex });
      await get().playTrack(nextTrack, queue, { openFullPlayer: false, index: nextIndex });
    }
  },

  prev: async () => {
    const { queue, currentIndex, position } = get();
    if (!queue.length) return;

    // If more than 3s in, restart current track
    if (position > 3000) {
      const { sound } = get();
      if (sound) {
        try {
          await sound.setPositionAsync(0);
          set({ position: 0 });
        } catch {
          devWarn('[player] prev: sound was unloaded, restarting track');
          await get().playTrack(queue[currentIndex], queue, { openFullPlayer: false, index: currentIndex });
        }
      }
      return;
    }

    const prevIndex = Math.max(0, currentIndex - 1);
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      set({ currentIndex: prevIndex });
      await get().playTrack(prevTrack, queue, { openFullPlayer: false, index: prevIndex });
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

  toggleShuffle: () => set((s) => {
    const isNowShuffle = !s.isShuffle;
    if (isNowShuffle) {
      const currentTrack = s.queue[s.currentIndex];
      const remainingTracks = s.queue.filter((_, i) => i !== s.currentIndex);
      const shuffled = shuffleArray(remainingTracks);
      return { 
        isShuffle: true, 
        originalQueue: s.queue, 
        queue: currentTrack ? [currentTrack, ...shuffled] : shuffled, 
        currentIndex: currentTrack ? 0 : -1 
      };
    } else {
      const currentTrack = s.queue[s.currentIndex];
      const newQueue = s.originalQueue.length > 0 ? s.originalQueue : s.queue;
      const newIndex = newQueue.findIndex((t) => t.id === currentTrack?.id);
      return { 
        isShuffle: false, 
        originalQueue: [], 
        queue: newQueue, 
        currentIndex: Math.max(0, newIndex) 
      };
    }
  }),

  addToQueue: (track) =>
    set((s) => ({
      queue: [...s.queue, track],
      originalQueue: s.originalQueue.length > 0 ? [...s.originalQueue, track] : [],
    })),

  removeFromQueue: (index) => {
    const { queue, currentIndex, sound } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);
    const removedTrack = queue[index];
    let newOriginalQueue = get().originalQueue;
    if (newOriginalQueue.length > 0 && removedTrack) {
      const origIdx = newOriginalQueue.findIndex((t) => t.id === removedTrack.id);
      if (origIdx >= 0) {
        newOriginalQueue = [...newOriginalQueue];
        newOriginalQueue.splice(origIdx, 1);
      }
    }

    if (index === currentIndex) {
      if (!newQueue.length) {
        if (sound) {
          sound.unloadAsync().catch((err) => devWarn('[player] removeFromQueue unload failed:', err));
        }
        set((s) => ({
          queue: [],
          originalQueue: [],
          currentIndex: -1,
          currentTrack: null,
          sound: null,
          isPlaying: false,
          isLoading: false,
          position: 0,
          duration: 0,
          playGeneration: s.playGeneration + 1,
        }));
        return;
      }

      const nextIndex = Math.min(index, newQueue.length - 1);
      const nextTrack = newQueue[nextIndex];
      set({ queue: newQueue, originalQueue: newOriginalQueue, currentIndex: nextIndex });
      void get()
        .playTrack(nextTrack, newQueue, { openFullPlayer: false, index: nextIndex })
        .catch((err) => devError('[player] removeFromQueue advance failed:', err));
      return;
    }

    const newIndex = index < currentIndex ? currentIndex - 1 : currentIndex;
    set({ queue: newQueue, originalQueue: newOriginalQueue, currentIndex: newIndex });
  },

  clearQueue: () => {
    const { sound } = get();
    if (sound) {
      sound.unloadAsync().catch((err) => devWarn('[player] clearQueue unload failed:', err));
    }
    set((s) => ({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      currentTrack: null,
      sound: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      streamCache: {},
      playGeneration: s.playGeneration + 1,
    }));
  },
}));
