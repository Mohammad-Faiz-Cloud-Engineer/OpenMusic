import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRecentStore } from '../../src/store/recentStore';
import type { Track } from '../../src/api/jiosaavn';

const mockTrack = (id: string): Track => ({
  id,
  title: `Track ${id}`,
  artist: 'Artist',
  album: 'Album',
  duration_seconds: 180,
  thumbnail: null,
  language: null,
  has_lyrics: false,
  explicit: false,
  stream_url: null,
});

describe('recentStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useRecentStore.setState({ tracks: [], hydrated: false });
  });

  it('adds tracks with most recent first and dedupes', async () => {
    await useRecentStore.getState().addRecent(mockTrack('1'));
    await useRecentStore.getState().addRecent(mockTrack('2'));
    await useRecentStore.getState().addRecent(mockTrack('1'));

    const { tracks } = useRecentStore.getState();
    expect(tracks.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('hydrates from storage', async () => {
    await useRecentStore.getState().addRecent(mockTrack('a'));
    useRecentStore.setState({ tracks: [], hydrated: false });

    await useRecentStore.getState().hydrate();
    expect(useRecentStore.getState().tracks[0]?.id).toBe('a');
    expect(useRecentStore.getState().hydrated).toBe(true);
  });
});
