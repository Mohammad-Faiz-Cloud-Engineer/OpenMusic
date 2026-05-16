import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track, getStreamUrl, getProxyPlayUrl } from '../api/jiosaavn';
import { useRecentStore } from './recentStore';
import { devError, devWarn } from '../utils/devLog';
import { isCacheExpired, pickShuffleIndex, type CachedStream } from '../utils/playerUtils';

export type RepeatMode = 'off' | 'all' | 'one';

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

  // Stream URL cache — avoids re-fetching signed CDN URLs that are still valid
  streamCache: Record<string, CachedStream>;
  /** Bumped on each playTrack to ignore stale async completions */
  playGeneration: number;

  // Actions
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
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

  playTrack: async (track, queue) => {
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

    const previousSound = state.sound;

    try {
      if (previousSound) {
        await previousSound.unloadAsync();
      }
      if (isStale()) return;

      // Step 1: resolve the signed CDN URL.
      // Use the client-side cache if the URL is still valid — avoids a round
      // trip to the API for every track play and prevents hammering the HF
      // rate limiter (120 req/60s).
      let streamUrl: string;
      const cached = state.streamCache[track.id];

      if (cached && !isCacheExpired(cached)) {
        // Cache hit — use the existing signed URL directly
        streamUrl = cached.url;
      } else {
        // Cache miss or expired — fetch a fresh signed URL from the backend
        try {
          const streamData = await getStreamUrl(track.id);
          if (!streamData.stream_url) {
            throw new Error('No stream URL returned');
          }
          // web.saavncdn.com needs Referer headers expo-av does not send (403).
          streamUrl = streamData.stream_url.replace('web.saavncdn.com', 'aac.saavncdn.com');
          if (isStale()) return;
          // Cache it for the duration of its validity
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

      // Step 2: configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Step 3: load and play — expo-av uses range requests against the
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
          if (!s.isSeeking) {
            set({ position: status.positionMillis, duration: status.durationMillis ?? 0 });
          }
          if (status.didJustFinish) {
            get().next();
          }
        }
      );

      if (isStale()) {
        await sound.unloadAsync();
        return;
      }

      set({ sound, isPlaying: true, isLoading: false, position: 0 });
      void useRecentStore.getState().addRecent(track);
    } catch (err) {
      if (!isStale()) {
        devError('[player] playTrack error:', err);
        set({ isLoading: false, isPlaying: false });
      }
    }
  },

  playQueue: async (tracks, startIndex = 0) => {
    if (!tracks.length) return;
    const track = tracks[startIndex];
    await get().playTrack(track, tracks);
  },

  togglePlay: async () => {
    const { sound, isPlaying } = get();
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    } else {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },

  next: async () => {
    const { queue, currentIndex, repeatMode, isShuffle } = get();
    if (!queue.length) return;

    if (repeatMode === 'one') {
      const track = queue[currentIndex];
      if (track) await get().playTrack(track, queue);
      return;
    }

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = pickShuffleIndex(queue.length, currentIndex);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else return;
      }
    }

    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      set({ currentIndex: nextIndex });
      await get().playTrack(nextTrack, queue);
    }
  },

  prev: async () => {
    const { queue, currentIndex, position } = get();
    if (!queue.length) return;

    // If more than 3s in, restart current track
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
      await get().playTrack(prevTrack, queue);
    }
  },

  seekTo: async (positionMs) => {
    const { sound } = get();
    if (!sound) return;
    await sound.setPositionAsync(positionMs);
    set({ position: positionMs, isSeeking: false });
  },

  setRepeat: (mode) => set({ repeatMode: mode }),

  toggleShuffle: () => set((s) => ({ isShuffle: !s.isShuffle })),

  addToQueue: (track) =>
    set((s) => ({ queue: [...s.queue, track] })),

  removeFromQueue: (index) =>
    set((s) => {
      const newQueue = s.queue.filter((_, i) => i !== index);
      const newIndex = index < s.currentIndex
        ? s.currentIndex - 1
        : s.currentIndex;
      return { queue: newQueue, currentIndex: newIndex };
    }),

  clearQueue: () => {
    const { sound } = get();
    if (sound) {
      sound.unloadAsync().catch(() => undefined);
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
      playGeneration: 0,
    });
  },
}));
