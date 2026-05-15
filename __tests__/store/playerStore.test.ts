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

  it('removeFromQueue removes item and adjusts index', () => {
    usePlayerStore.setState({
      queue: [track('1'), track('2'), track('3')],
      currentIndex: 2,
    });
    usePlayerStore.getState().removeFromQueue(0);
    expect(usePlayerStore.getState().queue.map((t) => t.id)).toEqual(['2', '3']);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
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
  });
});
