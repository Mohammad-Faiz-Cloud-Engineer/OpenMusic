import { usePlayerStore } from '../../src/store/playerStore';
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
});
