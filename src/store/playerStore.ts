import { create } from 'zustand';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Track, getProxyPlayUrl } from '../api/jiosaavn';

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

  // Stream cache — kept for future use (e.g. pre-fetching next track URL)
  streamCache: Record<string, { url: string; expiresAt: string | null }>;

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

  setIsSeeking: (v) => set({ isSeeking: v }),
  setPosition: (v) => set({ position: v }),

  playTrack: async (track, queue) => {
    const state = get();

    // Build queue if provided
    const newQueue = queue ?? state.queue;
    const idx = newQueue.findIndex((t) => t.id === track.id);
    const finalQueue = newQueue;
    const finalIndex = idx >= 0 ? idx : 0;

    set({ isLoading: true, currentTrack: track, queue: finalQueue, currentIndex: finalIndex });

    try {
      // Unload previous sound
      if (state.sound) {
        await state.sound.unloadAsync();
      }

      // Always use the proxy endpoint — it adds the required Referer/User-Agent
      // headers that JioSaavn's CDN demands. Direct CDN URLs return 403 when
      // requested by expo-av (no browser headers).
      const streamUrl = getProxyPlayUrl(track.id);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          const s = get();
          if (!s.isSeeking) {
            set({ position: status.positionMillis, duration: status.durationMillis ?? 0 });
          }
          if (status.didJustFinish) {
            get().next();
          }
        }
      );

      set({ sound, isPlaying: true, isLoading: false, position: 0 });
    } catch (err) {
      console.error('[player] playTrack error:', err);
      set({ isLoading: false, isPlaying: false });
    }
  },

  playQueue: async (tracks, startIndex = 0) => {
    if (!tracks.length) return;
    const track = tracks[startIndex];
    await get().playTrack(track, tracks);
    set({ currentIndex: startIndex });
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
      nextIndex = Math.floor(Math.random() * queue.length);
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

  clearQueue: () => set({ queue: [], currentIndex: -1 }),
}));
