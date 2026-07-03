import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLikeStore } from '../../src/store/likeStore';
import type { Track } from '../../src/api/jiosaavn';

const mockTrack = (id: string): Track => ({
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

describe('likeStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLikeStore.setState({
      tracksByIdOrder: [],
      likedIds: new Set(),
      hydrated: false,
    });
  });

  it('toggles a track into liked state', async () => {
    await useLikeStore.getState().toggleLike(mockTrack('1'));
    expect(useLikeStore.getState().isLiked('1')).toBe(true);
    expect(useLikeStore.getState().tracksByIdOrder).toHaveLength(1);
  });

  it('toggles a track out of liked state', async () => {
    await useLikeStore.getState().toggleLike(mockTrack('1'));
    await useLikeStore.getState().toggleLike(mockTrack('1'));
    expect(useLikeStore.getState().isLiked('1')).toBe(false);
    expect(useLikeStore.getState().tracksByIdOrder).toHaveLength(0);
  });

  it('tracks are in reverse-chronological order', async () => {
    const t1 = mockTrack('1');
    const t2 = mockTrack('2');
    await useLikeStore.getState().toggleLike(t1);
    await useLikeStore.getState().toggleLike(t2);
    expect(useLikeStore.getState().tracksByIdOrder.map((t) => t.id)).toEqual(['2', '1']);
  });

  it('getTracks returns all liked tracks', async () => {
    await useLikeStore.getState().toggleLike(mockTrack('a'));
    await useLikeStore.getState().toggleLike(mockTrack('b'));
    expect(useLikeStore.getState().getTracks().map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('strips stream_url before persisting', async () => {
    const withUrl: Track = { ...mockTrack('u'), stream_url: 'https://cdn.example/signed' };
    await useLikeStore.getState().toggleLike(withUrl);
    const stored = useLikeStore.getState().tracksByIdOrder[0];
    expect(stored?.stream_url).toBeNull();
    const raw = await AsyncStorage.getItem('@openmusic/liked');
    expect(raw).not.toContain('cdn.example');
  });

  it('hydrates from AsyncStorage', async () => {
    await useLikeStore.getState().toggleLike(mockTrack('x'));
    useLikeStore.setState({ tracksByIdOrder: [], likedIds: new Set(), hydrated: false });
    await useLikeStore.getState().hydrate();
    expect(useLikeStore.getState().isLiked('x')).toBe(true);
    expect(useLikeStore.getState().hydrated).toBe(true);
  });

  it('persists to AsyncStorage on toggle', async () => {
    await useLikeStore.getState().toggleLike(mockTrack('p'));
    const raw = await AsyncStorage.getItem('@openmusic/liked');
    const parsed = JSON.parse(raw!);
    expect(parsed[0].id).toBe('p');
  });

  it('drops malformed entries during hydrate', async () => {
    await AsyncStorage.setItem(
      '@openmusic/liked',
      JSON.stringify([{ id: 'good', title: 'Good', artist: 'A' }, null, { id: '' }])
    );
    await useLikeStore.getState().hydrate();
    expect(useLikeStore.getState().tracksByIdOrder.map((t) => t.id)).toEqual(['good']);
  });
});
