import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PLAYLIST_NAME_MAX,
  useUserPlaylistStore,
  type UserPlaylistStored,
} from '../../src/store/userPlaylistStore';
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

describe('userPlaylistStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    useUserPlaylistStore.setState({ playlists: [], hydrated: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates playlists with trimmed capped names', async () => {
    const longName = `  ${'A'.repeat(PLAYLIST_NAME_MAX + 10)}  `;
    const id = await useUserPlaylistStore.getState().createPlaylist(longName);

    const playlist = useUserPlaylistStore.getState().getPlaylist(id);
    expect(playlist?.name).toHaveLength(PLAYLIST_NAME_MAX);
    expect(playlist?.tracks).toEqual([]);
    expect(playlist?.updatedAt).toBe(1_700_000_000_000);
  });

  it('adds sanitized tracks, rejects duplicates, and reports missing playlists', async () => {
    const playlistId = await useUserPlaylistStore.getState().createPlaylist('Road trip');

    const added = await useUserPlaylistStore.getState().addTrackToPlaylist(playlistId, {
      ...track('1'),
      stream_url: 'https://signed.example/private',
    });
    const duplicate = await useUserPlaylistStore.getState().addTrackToPlaylist(
      playlistId,
      track('1')
    );
    const missing = await useUserPlaylistStore.getState().addTrackToPlaylist(
      'missing',
      track('2')
    );

    const playlist = useUserPlaylistStore.getState().getPlaylist(playlistId);
    expect(added).toBe('added');
    expect(duplicate).toBe('duplicate');
    expect(missing).toBe('missing');
    expect(playlist?.tracks.map((t) => t.id)).toEqual(['1']);
    expect(playlist?.tracks[0]?.stream_url).toBeNull();
  });

  it('renames, removes tracks, and deletes playlists', async () => {
    const playlistId = await useUserPlaylistStore.getState().createPlaylist('Old');
    await useUserPlaylistStore.getState().addTrackToPlaylist(playlistId, track('1'));
    await useUserPlaylistStore.getState().renamePlaylist(playlistId, 'New');
    await useUserPlaylistStore.getState().removeTrackFromPlaylist(playlistId, '1');

    expect(useUserPlaylistStore.getState().getPlaylist(playlistId)?.name).toBe('New');
    expect(useUserPlaylistStore.getState().getPlaylist(playlistId)?.tracks).toEqual([]);

    await useUserPlaylistStore.getState().deletePlaylist(playlistId);
    expect(useUserPlaylistStore.getState().playlists).toEqual([]);
  });

  it('hydrates valid playlists and lets in-memory edits win on id collisions', async () => {
    const disk: UserPlaylistStored = {
      id: 'same',
      name: 'Disk',
      tracks: [track('disk')],
      updatedAt: 1,
    };
    await AsyncStorage.setItem(
      '@openmusic/user-playlists',
      JSON.stringify([disk, { id: '', name: 'Bad' }, null])
    );
    useUserPlaylistStore.setState({
      playlists: [{ id: 'same', name: 'Memory', tracks: [track('mem')], updatedAt: 2 }],
      hydrated: false,
    });

    await useUserPlaylistStore.getState().hydrate();

    expect(useUserPlaylistStore.getState().hydrated).toBe(true);
    expect(useUserPlaylistStore.getState().playlists).toHaveLength(1);
    expect(useUserPlaylistStore.getState().playlists[0]?.name).toBe('Memory');
    expect(useUserPlaylistStore.getState().playlists[0]?.tracks[0]?.id).toBe('mem');
  });
});
