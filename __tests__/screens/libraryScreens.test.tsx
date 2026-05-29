import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CollectionScreen } from '../../src/screens/CollectionScreen';
import { LibraryScreen } from '../../src/screens/LibraryScreen';
import { PlayerScreen } from '../../src/screens/PlayerScreen';
import { TrackListScreen } from '../../src/screens/TrackListScreen';
import { UserPlaylistDetailScreen } from '../../src/screens/UserPlaylistDetailScreen';
import { useLikeStore } from '../../src/store/likeStore';
import { usePlayerStore } from '../../src/store/playerStore';
import { useRecentStore } from '../../src/store/recentStore';
import { useUserPlaylistStore } from '../../src/store/userPlaylistStore';
import type { Track } from '../../src/api/jiosaavn';
import '../../src/i18n';

const track = (id: string, title = `Track ${id}`): Track => ({
  id,
  title,
  artist: 'Artist',
  album: 'Album',
  duration_seconds: 180,
  thumbnail: null,
  language: null,
  has_lyrics: false,
  explicit: false,
  stream_url: null,
});

const navigation = () =>
  ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  });

const resetStores = () => {
  useLikeStore.setState({ tracksByIdOrder: [], likedIds: new Set(), hydrated: true });
  useRecentStore.setState({ tracks: [], hydrated: true });
  useUserPlaylistStore.setState({ playlists: [], hydrated: true });
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
    playQueue: jest.fn().mockResolvedValue(undefined),
    playTrack: jest.fn().mockResolvedValue(undefined),
    togglePlay: jest.fn().mockResolvedValue(undefined),
    next: jest.fn().mockResolvedValue(undefined),
    prev: jest.fn().mockResolvedValue(undefined),
    setRepeat: jest.fn(),
    toggleShuffle: jest.fn(),
  });
};

describe('library-related screens', () => {
  beforeEach(() => {
    resetStores();
  });

  it('TrackListScreen renders tracks and plays the queue', () => {
    const nav = navigation();
    const tracks = [track('1', 'One'), track('2', 'Two')];

    render(
      <TrackListScreen
        navigation={nav as never}
        route={{ params: { title: 'Liked songs', tracks } } as never}
      />
    );

    expect(screen.getByText('Liked songs')).toBeTruthy();
    expect(screen.getByText('2 songs')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Play'));
    expect(usePlayerStore.getState().playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('CollectionScreen opens liked songs and playlists', () => {
    const nav = navigation();
    const liked = [track('liked', 'Liked One')];
    useLikeStore.setState({ tracksByIdOrder: liked, likedIds: new Set(['liked']) });
    useUserPlaylistStore.setState({
      playlists: [{ id: 'pl1', name: 'Road trip', tracks: [], updatedAt: 1 }],
    });

    render(<CollectionScreen navigation={nav as never} route={{} as never} />);

    fireEvent.press(screen.getByLabelText('Liked songs'));
    expect(nav.navigate).toHaveBeenCalledWith('TrackList', {
      title: 'Liked songs',
      tracks: liked,
    });

    fireEvent.press(screen.getByLabelText('Road trip'));
    expect(nav.navigate).toHaveBeenCalledWith('UserPlaylist', { playlistId: 'pl1' });
  });

  it('LibraryScreen shows queue and recent tracks', () => {
    const nav = navigation();
    const queued = [track('q1', 'Queued Song')];
    usePlayerStore.setState({
      queue: queued,
      currentIndex: 0,
      currentTrack: queued[0],
    });
    useRecentStore.setState({ tracks: [track('r1', 'Recent Song')] });

    render(<LibraryScreen navigation={nav as never} route={{} as never} />);

    expect(screen.getAllByText('Queued Song').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText('Recent'));
    expect(screen.getByText('Recent Song')).toBeTruthy();
  });

  it('UserPlaylistDetailScreen handles missing and populated playlists', () => {
    const nav = navigation();
    const playlistTrack = track('1', 'Saved Song');
    useUserPlaylistStore.setState({
      playlists: [{ id: 'pl1', name: 'Road trip', tracks: [playlistTrack], updatedAt: 1 }],
    });

    const { rerender } = render(
      <UserPlaylistDetailScreen
        navigation={nav as never}
        route={{ params: { playlistId: 'missing' } } as never}
      />
    );
    expect(screen.getByText('This playlist could not be found.')).toBeTruthy();

    rerender(
      <UserPlaylistDetailScreen
        navigation={nav as never}
        route={{ params: { playlistId: 'pl1' } } as never}
      />
    );
    expect(screen.getByText('Road trip')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Play'));
    expect(usePlayerStore.getState().playQueue).toHaveBeenCalledWith([playlistTrack], 0);
  });

  it('UserPlaylistDetailScreen confirms track removal', () => {
    const nav = navigation();
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useUserPlaylistStore.setState({
      playlists: [{ id: 'pl1', name: 'Road trip', tracks: [track('1', 'Saved Song')], updatedAt: 1 }],
    });

    render(
      <UserPlaylistDetailScreen
        navigation={nav as never}
        route={{ params: { playlistId: 'pl1' } } as never}
      />
    );

    fireEvent.press(screen.getByLabelText('Remove Saved Song from playlist'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Remove song?',
      'Remove "Saved Song" from this playlist?',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it('PlayerScreen renders empty and active player states', () => {
    const nav = navigation();
    const queue = [track('1', 'Current Song'), track('2', 'Next Song')];

    const { rerender } = render(<PlayerScreen navigation={nav as never} route={{} as never} />);
    expect(screen.getByText('Nothing playing')).toBeTruthy();

    act(() => {
      usePlayerStore.setState({
        currentTrack: queue[0],
        queue,
        currentIndex: 0,
        duration: 180_000,
        position: 30_000,
      });
    });

    rerender(<PlayerScreen navigation={nav as never} route={{} as never} />);
    expect(screen.getByText('Current Song')).toBeTruthy();
    expect(screen.getByText('Next Song')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Play'));
    fireEvent.press(screen.getByLabelText('Next'));
    expect(usePlayerStore.getState().togglePlay).toHaveBeenCalled();
    expect(usePlayerStore.getState().next).toHaveBeenCalled();
  });
});
