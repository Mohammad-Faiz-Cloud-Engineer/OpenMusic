import { usePlayerStore } from '../../src/store/playerStore';
import type { Track } from '../../src/api/jiosaavn';

jest.mock('../../src/api/jiosaavn', () => ({
  ...jest.requireActual('../../src/api/jiosaavn'),
  getStreamUrl: jest.fn().mockRejectedValue(new Error('mocked')),
  getProxyPlayUrl: jest.fn().mockReturnValue('https://proxy.example/play'),
}));

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
    expect(playTrack).toHaveBeenCalledWith(tracks[1], tracks, { openFullPlayer: false, index: 1 });
    usePlayerStore.setState({ playTrack: originalPlayTrack });
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
    expect(playTrack).toHaveBeenCalledWith(tracks[2], nextQueue, { openFullPlayer: false, index: 1 });
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

  it('playGeneration bumps atomically on playTrack', async () => {
    const gen0 = usePlayerStore.getState().playGeneration;
    // The generation bump happens synchronously in the first set() call,
    // before any async I/O. The function will reject later due to missing
    // stream URL, but the generation is already incremented.
    await expect(
      usePlayerStore.getState().playTrack(track('1'), undefined, { openFullPlayer: false })
    ).resolves.toBeUndefined();
    expect(usePlayerStore.getState().playGeneration).toBe(gen0 + 1);
  });

  it('playGeneration bumps on removeFromQueue when clearing last item', () => {
    usePlayerStore.setState({
      queue: [track('1')],
      currentIndex: 0,
      currentTrack: track('1'),
      sound: null,
      playGeneration: 5,
    });
    usePlayerStore.getState().removeFromQueue(0);
    expect(usePlayerStore.getState().playGeneration).toBe(6);
  });

  it('playGeneration bumps on clearQueue', () => {
    usePlayerStore.setState({ playGeneration: 10, queue: [track('1')] });
    usePlayerStore.getState().clearQueue();
    expect(usePlayerStore.getState().playGeneration).toBe(11);
  });

  it('toggleShuffle preserves current track at index 0', () => {
    const t1 = track('1');
    const t2 = track('2');
    const t3 = track('3');
    usePlayerStore.setState({
      queue: [t1, t2, t3],
      currentIndex: 1,
      currentTrack: t2,
      isShuffle: false,
      originalQueue: [],
    });
    usePlayerStore.getState().toggleShuffle();
    const s = usePlayerStore.getState();
    expect(s.isShuffle).toBe(true);
    expect(s.queue[0].id).toBe('2');
    expect(s.currentIndex).toBe(0);
    expect(s.originalQueue).toEqual([t1, t2, t3]);
  });

  it('toggleShuffle restores original order when turning off', () => {
    const t1 = track('1');
    const t2 = track('2');
    const t3 = track('3');
    usePlayerStore.setState({
      queue: [t2, t3, t1],
      currentIndex: 0,
      currentTrack: t2,
      isShuffle: true,
      originalQueue: [t1, t2, t3],
    });
    usePlayerStore.getState().toggleShuffle();
    const s = usePlayerStore.getState();
    expect(s.isShuffle).toBe(false);
    expect(s.queue.map((t) => t.id)).toEqual(['1', '2', '3']);
    expect(s.originalQueue).toEqual([]);
  });

  it('addToQueue appends to originalQueue when shuffled', () => {
    const t1 = track('1');
    const t2 = track('2');
    usePlayerStore.setState({
      queue: [t1],
      originalQueue: [t1],
      isShuffle: true,
    });
    usePlayerStore.getState().addToQueue(t2);
    expect(usePlayerStore.getState().originalQueue).toHaveLength(2);
  });

  it('prev restarts track if past 3 seconds', async () => {
    const setPositionAsync = jest.fn().mockResolvedValue(undefined);
    usePlayerStore.setState({
      queue: [track('1')],
      currentIndex: 0,
      currentTrack: track('1'),
      position: 5000,
      duration: 10000,
      sound: { setPositionAsync, unloadAsync: jest.fn() } as never,
    });
    await usePlayerStore.getState().prev();
    expect(setPositionAsync).toHaveBeenCalledWith(0);
    expect(usePlayerStore.getState().position).toBe(0);
  });

  it('next wraps to start when repeatMode is all at end of queue', async () => {
    const t1 = track('1');
    const t2 = track('2');
    const originalPlayTrack = usePlayerStore.getState().playTrack;
    const playTrack = jest.fn().mockResolvedValue(undefined);
    usePlayerStore.setState({
      queue: [t1, t2],
      currentIndex: 1,
      currentTrack: t2,
      repeatMode: 'all',
      playTrack,
    });
    await usePlayerStore.getState().next();
    expect(playTrack).toHaveBeenCalledWith(t1, [t1, t2], { openFullPlayer: false, index: 0 });
    usePlayerStore.setState({ playTrack: originalPlayTrack });
  });

  it('removeFromQueue adjusts index when removing before current', () => {
    usePlayerStore.setState({
      queue: [track('1'), track('2'), track('3')],
      currentIndex: 2,
    });
    usePlayerStore.getState().removeFromQueue(0);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });
});
