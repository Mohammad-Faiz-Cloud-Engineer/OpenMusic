import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLikeStore } from '../../src/store/likeStore';
import type { Track } from '../../src/api/jiosaavn';

const track = (id: string): Track => ({
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

describe('likeStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLikeStore.setState({
      tracksByIdOrder: [],
      likedIds: new Set(),
      hydrated: false,
    });
  });

  it('toggles liked tracks and keeps ids in sync', async () => {
    await useLikeStore.getState().toggleLike(track('1'));
    expect(useLikeStore.getState().isLiked('1')).toBe(true);
    expect(useLikeStore.getState().getTracks().map((t) => t.id)).toEqual(['1']);

    await useLikeStore.getState().toggleLike(track('1'));
    expect(useLikeStore.getState().isLiked('1')).toBe(false);
    expect(useLikeStore.getState().getTracks()).toEqual([]);
  });

  it('stores newest liked track first and strips stream URLs', async () => {
    await useLikeStore.getState().toggleLike(track('1'));
    await useLikeStore.getState().toggleLike({
      ...track('2'),
      stream_url: 'https://signed.example/private',
    });

    const tracks = useLikeStore.getState().getTracks();
    expect(tracks.map((t) => t.id)).toEqual(['2', '1']);
    expect(tracks[0]?.stream_url).toBeNull();

    const raw = await AsyncStorage.getItem('@openmusic/liked');
    expect(raw).not.toContain('signed.example');
  });

  it('hydrates valid rows and drops malformed rows', async () => {
    await AsyncStorage.setItem(
      '@openmusic/liked',
      JSON.stringify([
        { id: 'ok', title: 'Ok', artist: 'Artist' },
        { id: '', title: 'Bad', artist: 'Artist' },
        null,
      ])
    );

    await useLikeStore.getState().hydrate();

    expect(useLikeStore.getState().hydrated).toBe(true);
    expect(useLikeStore.getState().getTracks().map((t) => t.id)).toEqual(['ok']);
    expect(useLikeStore.getState().isLiked('ok')).toBe(true);
  });
});
