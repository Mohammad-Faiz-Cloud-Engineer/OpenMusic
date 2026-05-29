import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import { ChartsScreen } from '../../src/screens/ChartsScreen';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { PlaylistScreen } from '../../src/screens/PlaylistScreen';
import { usePlayerStore } from '../../src/store/playerStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import type { Chart, Playlist, SearchResult, Track } from '../../src/api/jiosaavn';
import '../../src/i18n';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);

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

const chart: Chart = {
  id: 'chart1',
  title: 'Top Chart',
  description: 'Fresh hits',
  thumbnail: null,
};

const searchResult = (tracks: Track[]): SearchResult => ({
  source: 'jiosaavn',
  query: 'test',
  results: tracks,
});

const playlist = (tracks: Track[]): Playlist => ({
  source: 'jiosaavn',
  id: 'pl1',
  title: 'Playlist Title',
  owner: 'Owner',
  song_count: tracks.length,
  duration_seconds: tracks.reduce((sum, item) => sum + item.duration_seconds, 0),
  thumbnail: null,
  tracks,
});

const navigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
});

const queryState = (overrides: Record<string, unknown>) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn().mockResolvedValue({}),
  ...overrides,
});

describe('query-driven screens', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    usePlayerStore.setState({
      playQueue: jest.fn().mockResolvedValue(undefined),
      playTrack: jest.fn().mockResolvedValue(undefined),
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      isLoading: false,
    });
    useSettingsStore.setState({
      homeSections: {
        featuredBanner: true,
        quickPicks: true,
        topCharts: true,
        trendingNow: true,
        loveSongs: true,
        punjabiHits: true,
      },
    });
  });

  it('ChartsScreen renders charts and opens a playlist', () => {
    const nav = navigation();
    mockUseQuery.mockReturnValue(
      queryState({ data: { source: 'jiosaavn', charts: [chart] } }) as never
    );

    render(<ChartsScreen navigation={nav as never} route={{} as never} />);

    expect(screen.getByText('Top Charts')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Top Chart'));
    expect(nav.navigate).toHaveBeenCalledWith('Playlist', {
      id: 'chart1',
      title: 'Top Chart',
    });
  });

  it('ChartsScreen shows retry on errors', () => {
    const refetch = jest.fn().mockResolvedValue({});
    mockUseQuery.mockReturnValue(queryState({ isError: true, refetch }) as never);

    render(<ChartsScreen navigation={navigation() as never} route={{} as never} />);

    fireEvent.press(screen.getByLabelText('Retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('PlaylistScreen renders playlist details and plays tracks', () => {
    const tracks = [track('1', 'Playlist Song')];
    mockUseQuery.mockReturnValue(queryState({ data: playlist(tracks) }) as never);

    render(
      <PlaylistScreen
        navigation={navigation() as never}
        route={{ params: { id: 'pl1' } } as never}
      />
    );

    expect(screen.getByText('Playlist Title')).toBeTruthy();
    expect(screen.getByText('Playlist Song')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Play'));
    expect(usePlayerStore.getState().playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('PlaylistScreen shows an error retry state', () => {
    const refetch = jest.fn().mockResolvedValue({});
    mockUseQuery.mockReturnValue(queryState({ isError: true, refetch }) as never);

    render(
      <PlaylistScreen
        navigation={navigation() as never}
        route={{ params: { id: 'pl1' } } as never}
      />
    );

    expect(screen.getByText('Failed to load playlist')).toBeTruthy();
    fireEvent.press(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('HomeScreen renders configured sections and opens search/charts', () => {
    const nav = navigation();
    const trending = [track('t1', 'Trending Song'), track('t2', 'Second Song')];
    mockUseQuery
      .mockReturnValueOnce(
        queryState({ data: { source: 'jiosaavn', charts: [chart] } }) as never
      )
      .mockReturnValueOnce(queryState({ data: searchResult(trending) }) as never)
      .mockReturnValueOnce(queryState({ data: searchResult([track('r1', 'Love Song')]) }) as never)
      .mockReturnValueOnce(queryState({ data: searchResult([track('p1', 'Punjabi Song')]) }) as never);

    render(<HomeScreen navigation={nav as never} route={{} as never} />);

    expect(screen.getByText("What's playing?")).toBeTruthy();
    expect(screen.getAllByText('Trending Song').length).toBeGreaterThan(0);
    expect(screen.getByText('Top Chart')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Search'));
    expect(nav.navigate).toHaveBeenCalledWith('Search');

    fireEvent.press(screen.getByLabelText('Top Chart'));
    expect(nav.navigate).toHaveBeenCalledWith('Playlist', {
      id: 'chart1',
      title: 'Top Chart',
    });
  });
});
