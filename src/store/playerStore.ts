import { create } from 'zustand';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import { Track, getStreamUrl, getProxyPlayUrl } from '../api/jiosaavn';
import { useRecentStore } from './recentStore';
import { devError, devWarn } from '../utils/devLog';
import { isCacheExpired, pickShuffleIndex, type CachedStream } from '../utils/playerUtils';

import { requestOpenFullPlayer } from '../navigation/rootNavigation';

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayTrackOptions = {
  /**
   * When true (default), opens the stack Player modal — user tapped a song to play.
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
  sound: AudioPlayer | null;
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
        previousSound.remove();
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
          // web.saavncdn.com needs Referer headers expo-audio does not send (403).
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
      // expo-audio uses different field names from expo-av:
      //   playsInSilentMode  (was playsInSilentModeIOS)
      //   shouldPlayInBackground (was staysActiveInBackground)
      //   interruptionMode: 'duckOthers' (was shouldDuckAndroid: true)
      //   shouldRouteThroughEarpiece: false (was playThroughEarpieceAndroid: false)
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });

      // Step 3: create player and subscribe to status updates.
      // expo-audio uses a synchronous createAudioPlayer() instead of
      // the async Audio.Sound.createAsync(). The status callback is
      // registered via addListener rather than passed to the factory.
      // Note: expo-audio reports currentTime/duration in SECONDS, not ms.
      const player = createAudioPlayer(
        { uri: streamUrl },
        { updateInterval: 1000 },
      );

      player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (get().playGeneration !== generation) return;
        if (!status.isLoaded) return;
        const s = get();
        if (!s.isSeeking) {
          // Convert seconds → milliseconds to keep the rest of the app unchanged
          set({
            position: Math.floor(status.currentTime * 1000),
            duration: Math.floor(status.duration * 1000),
          });
        }
        if (status.didJustFinish) {
          void get().next().catch((err) => devError('[player] auto-advance:', err));
        }
      });

      if (isStale()) {
        player.remove();
        return;
      }

      player.play();
      set({ sound: player, isPlaying: true, isLoading: false, position: 0 });
      void useRecentStore.getState().addRecent(track);
    } catch (err) {
      if (!isStale()) {
        devError('[player] playTrack error:', err);
        set({ isLoading: false, isPlaying: false });
      }
    }
  },

  playQueue: async (tracks, startIndex = 0, options) => {
    if (!tracks.length) return;
    const track = tracks[startIndex];
    await get().playTrack(track, tracks, options);
  },

  togglePlay: async () => {
    const { sound, isPlaying } = get();
    if (!sound) return;
    const wasPlaying = isPlaying;
    set({ isPlaying: !wasPlaying });
    try {
      if (wasPlaying) {
        sound.pause();
      } else {
        sound.play();
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
        else return;
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

    // If more than 3s in, restart current track
    if (position > 3000) {
      const { sound } = get();
      if (sound) {
        // expo-audio seekTo takes seconds, position is stored in ms
        sound.seekTo(0);
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
    // expo-audio seekTo takes seconds; positionMs is in milliseconds
    sound.seekTo(positionMs / 1000);
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
      sound.remove();
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
