import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserPlaylistStore } from '../../src/store/userPlaylistStore';
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

describe('userPlaylistStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useUserPlaylistStore.setState({ playlists: [], hydrated: false });
  });

  it('createPlaylist creates a playlist with the given name', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('My Faves');
    const pl = useUserPlaylistStore.getState().getPlaylist(id);
    expect(pl).toBeDefined();
    expect(pl!.name).toBe('My Faves');
    expect(pl!.tracks).toEqual([]);
  });

  it('createPlaylist normalizes whitespace and truncates long names', async () => {
    const long = 'A'.repeat(100);
    const id = await useUserPlaylistStore.getState().createPlaylist(`  ${long}  `);
    const pl = useUserPlaylistStore.getState().getPlaylist(id);
    expect(pl!.name.length).toBeLessThanOrEqual(72);
    expect(pl!.name).not.toMatch(/^\s|\s$/);
  });

  it('createPlaylist uses fallback name when given empty string', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('');
    const pl = useUserPlaylistStore.getState().getPlaylist(id);
    expect(pl!.name).toBe('Playlist');
  });

  it('deletePlaylist removes a playlist', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Test');
    await useUserPlaylistStore.getState().deletePlaylist(id);
    expect(useUserPlaylistStore.getState().getPlaylist(id)).toBeUndefined();
  });

  it('deletePlaylist is idempotent for unknown ids', async () => {
    await useUserPlaylistStore.getState().deletePlaylist('nonexistent');
    expect(useUserPlaylistStore.getState().playlists).toEqual([]);
  });

  it('renamePlaylist updates the name', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Old');
    await useUserPlaylistStore.getState().renamePlaylist(id, 'New Name');
    expect(useUserPlaylistStore.getState().getPlaylist(id)!.name).toBe('New Name');
  });

  it('renamePlaylist normalizes the new name', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Test');
    await useUserPlaylistStore.getState().renamePlaylist(id, '  Spaced  ');
    expect(useUserPlaylistStore.getState().getPlaylist(id)!.name).toBe('Spaced');
  });

  it('addTrackToPlaylist adds a track and returns added', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Songs');
    const result = await useUserPlaylistStore.getState().addTrackToPlaylist(id, mockTrack('1'));
    expect(result).toBe('added');
    expect(useUserPlaylistStore.getState().getPlaylist(id)!.tracks).toHaveLength(1);
  });

  it('addTrackToPlaylist returns duplicate for existing track', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Songs');
    await useUserPlaylistStore.getState().addTrackToPlaylist(id, mockTrack('1'));
    const result = await useUserPlaylistStore.getState().addTrackToPlaylist(id, mockTrack('1'));
    expect(result).toBe('duplicate');
    expect(useUserPlaylistStore.getState().getPlaylist(id)!.tracks).toHaveLength(1);
  });

  it('addTrackToPlaylist returns missing for unknown playlist', async () => {
    const result = await useUserPlaylistStore.getState().addTrackToPlaylist('bad-id', mockTrack('1'));
    expect(result).toBe('missing');
  });

  it('removeTrackFromPlaylist removes a track by id', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Songs');
    await useUserPlaylistStore.getState().addTrackToPlaylist(id, mockTrack('1'));
    await useUserPlaylistStore.getState().addTrackToPlaylist(id, mockTrack('2'));
    await useUserPlaylistStore.getState().removeTrackFromPlaylist(id, '1');
    const remaining = useUserPlaylistStore.getState().getPlaylist(id)!.tracks;
    expect(remaining.map((t) => t.id)).toEqual(['2']);
  });

  it('removeTrackFromPlaylist does nothing for unknown track', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Songs');
    await useUserPlaylistStore.getState().addTrackToPlaylist(id, mockTrack('1'));
    await useUserPlaylistStore.getState().removeTrackFromPlaylist(id, 'nonexistent');
    expect(useUserPlaylistStore.getState().getPlaylist(id)!.tracks).toHaveLength(1);
  });

  it('playlists are sorted by updatedAt descending', async () => {
    const id1 = await useUserPlaylistStore.getState().createPlaylist('First');
    await new Promise((r) => setTimeout(r, 5));
    const id2 = await useUserPlaylistStore.getState().createPlaylist('Second');
    const ids = useUserPlaylistStore.getState().playlists.map((p) => p.id);
    expect(ids).toEqual([id2, id1]);
  });

  it('hydrate loads from AsyncStorage', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Saved');
    const raw = await AsyncStorage.getItem('@openmusic/user-playlists');
    useUserPlaylistStore.setState({ playlists: [], hydrated: false });
    await useUserPlaylistStore.getState().hydrate();
    expect(useUserPlaylistStore.getState().getPlaylist(id)).toBeDefined();
    expect(useUserPlaylistStore.getState().hydrated).toBe(true);
  });

  it('persists to AsyncStorage on mutations', async () => {
    const id = await useUserPlaylistStore.getState().createPlaylist('Persist');
    const raw = await AsyncStorage.getItem('@openmusic/user-playlists');
    expect(raw).toContain('Persist');
  });
});
