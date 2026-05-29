const mockGetStreamUrl = jest.fn();
const mockGetProxyPlayUrl = jest.fn((id: string) => `https://proxy.example/${id}`);

jest.mock('../../src/api/jiosaavn', () => {
  const actual = jest.requireActual('../../src/api/jiosaavn');
  return {
    ...actual,
    getStreamUrl: (id: string) => mockGetStreamUrl(id),
    getProxyPlayUrl: (id: string) => mockGetProxyPlayUrl(id),
  };
});

import { Audio } from 'expo-av';
import { usePlayerStore } from '../../src/store/playerStore';
import { useRecentStore } from '../../src/store/recentStore';
import type { Track } from '../../src/api/jiosaavn';

const track = (id: string): Track => ({
  id,
  title: `Title ${id}`,
  artist: 'Artist',
  album: 'Album',
  duration_seconds: 180,
  thumbnail: null,
  language: null,
  has_lyrics: false,
  explicit: false,
  stream_url: null,
});

describe('playerStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRecentStore.setState({ tracks: [], hydrated: true });
    mockGetStreamUrl.mockResolvedValue({
      id: '1',
      source: 'jiosaavn',
      quality: '320kbps',
      format: 'm4a',
      stream_url: 'https://web.saavncdn.com/song.m4a',
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    usePlayerStore.setState({
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
    });
  });

  it('setRepeat updates repeat mode', () => {
    usePlayerStore.getState().setRepeat('all');
    expect(usePlayerStore.getState().repeatMode).toBe('all');
  });

  it('toggleShuffle flips shuffle flag', () => {
    expect(usePlayerStore.getState().isShuffle).toBe(false);
    usePlayerStore.getState().toggleShuffle();
    expect(usePlayerStore.getState().isShuffle).toBe(true);
  });

  it('addToQueue appends tracks', () => {
    usePlayerStore.getState().addToQueue(track('1'));
    usePlayerStore.getState().addToQueue(track('2'));
    expect(usePlayerStore.getState().queue).toHaveLength(2);
  });

  it('playQueue clamps an out-of-range start index', async () => {
    const tracks = [track('1'), track('2')];
    const originalPlayTrack = usePlayerStore.getState().playTrack;
    const playTrack = jest.fn().mockResolvedValue(undefined);
    usePlayerStore.setState({ playTrack });
    await usePlayerStore.getState().playQueue(tracks, 99, { openFullPlayer: false });
    expect(playTrack).toHaveBeenCalledWith(tracks[1], tracks, { openFullPlayer: false });
    usePlayerStore.setState({ playTrack: originalPlayTrack });
  });

  it('playTrack fetches a stream URL, rewrites the CDN host, and records recent play', async () => {
    const tracks = [track('1')];

    await usePlayerStore.getState().playTrack(tracks[0], tracks, { openFullPlayer: false });

    expect(mockGetStreamUrl).toHaveBeenCalledWith('1');
    expect(Audio.setAudioModeAsync).toHaveBeenCalled();
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://aac.saavncdn.com/song.m4a' },
      { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
      expect.any(Function)
    );
    expect(usePlayerStore.getState().streamCache['1']?.url).toBe(
      'https://aac.saavncdn.com/song.m4a'
    );
    expect(useRecentStore.getState().tracks[0]?.id).toBe('1');
  });

  it('playTrack uses an unexpired cached stream URL without calling the API', async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const tracks = [track('1')];
    usePlayerStore.setState({
      streamCache: { '1': { url: 'https://cached.example/song.m4a', expiresAt: future } },
    });

    await usePlayerStore.getState().playTrack(tracks[0], tracks, { openFullPlayer: false });

    expect(mockGetStreamUrl).not.toHaveBeenCalled();
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://cached.example/song.m4a' },
      { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
      expect.any(Function)
    );
  });

  it('playTrack falls back to the proxy URL when stream lookup fails', async () => {
    const tracks = [track('1')];
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockGetStreamUrl.mockRejectedValueOnce(new Error('backend down'));

    await usePlayerStore.getState().playTrack(tracks[0], tracks, { openFullPlayer: false });

    expect(warnSpy).toHaveBeenCalledWith(
      '[player] stream URL fetch failed, falling back to proxy:',
      expect.any(Error)
    );
    expect(mockGetProxyPlayUrl).toHaveBeenCalledWith('1');
    expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
      { uri: 'https://proxy.example/1' },
      { shouldPlay: true, progressUpdateIntervalMillis: 1000 },
      expect.any(Function)
    );
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    warnSpy.mockRestore();
  });

  it('next marks playback stopped at end of queue without repeat', async () => {
    usePlayerStore.setState({
      queue: [track('1')],
      currentIndex: 0,
      currentTrack: track('1'),
      isPlaying: true,
      duration: 1000,
    });
    await usePlayerStore.getState().next();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().position).toBe(1000);
  });

  it('removeFromQueue removes item and adjusts index', () => {
    usePlayerStore.setState({
      queue: [track('1'), track('2'), track('3')],
      currentIndex: 2,
    });
    usePlayerStore.getState().removeFromQueue(0);
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual(['2', '3']);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });

  it('removeFromQueue advances playback when removing the current item', () => {
    const tracks = [track('1'), track('2'), track('3')];
    const originalPlayTrack = usePlayerStore.getState().playTrack;
    const playTrack = jest.fn().mockResolvedValue(undefined);
    usePlayerStore.setState({
      queue: tracks,
      currentIndex: 1,
      currentTrack: tracks[1],
      playTrack,
    });

    usePlayerStore.getState().removeFromQueue(1);

    const nextQueue = [tracks[0], tracks[2]];
    expect(usePlayerStore.getState().queue).toEqual(nextQueue);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
    expect(playTrack).toHaveBeenCalledWith(tracks[2], nextQueue, { openFullPlayer: false });
    usePlayerStore.setState({ playTrack: originalPlayTrack });
  });

  it('removeFromQueue clears playback when removing the only current item', () => {
    const unloadAsync = jest.fn().mockResolvedValue(undefined);
    usePlayerStore.setState({
      queue: [track('1')],
      currentIndex: 0,
      currentTrack: track('1'),
      sound: { unloadAsync } as never,
      isPlaying: true,
      position: 5000,
      duration: 10000,
      playGeneration: 3,
    });

    usePlayerStore.getState().removeFromQueue(0);

    const s = usePlayerStore.getState();
    expect(s.queue).toHaveLength(0);
    expect(s.currentIndex).toBe(-1);
    expect(s.currentTrack).toBeNull();
    expect(s.sound).toBeNull();
    expect(s.isPlaying).toBe(false);
    expect(s.position).toBe(0);
    expect(s.duration).toBe(0);
    expect(s.playGeneration).toBe(4);
    expect(unloadAsync).toHaveBeenCalled();
  });

  it('clearQueue resets playback state', () => {
    usePlayerStore.setState({
      queue: [track('1')],
      currentTrack: track('1'),
      isPlaying: true,
      position: 5000,
    });
    usePlayerStore.getState().clearQueue();
    const s = usePlayerStore.getState();
    expect(s.queue).toHaveLength(0);
    expect(s.currentTrack).toBeNull();
    expect(s.isPlaying).toBe(false);
    expect(s.position).toBe(0);
    expect(s.playGeneration).toBe(1);
  });
});
