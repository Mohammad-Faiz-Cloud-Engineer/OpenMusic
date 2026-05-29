import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { useQuery } from '@tanstack/react-query';
import { SearchScreen } from '../../src/screens/SearchScreen';
import type { SearchResult, SuggestionsResult, Track } from '../../src/api/jiosaavn';
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

const queryState = (overrides: Record<string, unknown>) => ({
  data: undefined,
  isLoading: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn().mockResolvedValue({}),
  ...overrides,
});

const useQueryResult = (overrides: Record<string, unknown> = {}) =>
  queryState(overrides) as unknown as ReturnType<typeof useQuery>;

type QueryKey = readonly [string, string];

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseQuery.mockImplementation((options) => {
      const [key, query] = options.queryKey as QueryKey;
      if (!options.enabled) return useQueryResult();
      if (key === 'suggestions') {
        const data: SuggestionsResult = {
          source: 'jiosaavn',
          query,
          suggestions: [`${query} acoustic`, `${query} remix`],
        };
        return useQueryResult({ data });
      }
      if (key === 'search') {
        const data: SearchResult = {
          source: 'jiosaavn',
          query,
          results: [track('1', `${query} Song`)],
        };
        return useQueryResult({ data });
      }
      return useQueryResult();
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    mockUseQuery.mockReset();
  });

  const renderSearch = () =>
    render(<SearchScreen navigation={{} as never} route={{} as never} />);

  const debounceSearch = () => {
    act(() => {
      jest.advanceTimersByTime(400);
    });
  };

  it('renders the idle state before a query is entered', () => {
    renderSearch();

    expect(screen.getByText('Find your next favourite')).toBeTruthy();
    expect(screen.getByText('Search songs, artists, albums')).toBeTruthy();
  });

  it('shows suggestions while the input is focused', () => {
    renderSearch();

    const input = screen.getByPlaceholderText('Songs, artists, albums...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'love');
    debounceSearch();

    expect(screen.getByText('love acoustic')).toBeTruthy();
    expect(screen.getByLabelText('Search for love remix')).toBeTruthy();
  });

  it('uses a suggestion as the submitted search query', () => {
    renderSearch();

    const input = screen.getByPlaceholderText('Songs, artists, albums...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'lofi');
    debounceSearch();
    fireEvent.press(screen.getByLabelText('Search for lofi acoustic'));

    expect(screen.getByText('Results for "lofi acoustic"')).toBeTruthy();
    expect(screen.getByText('lofi acoustic Song')).toBeTruthy();
  });

  it('shows search results after submit', () => {
    renderSearch();

    const input = screen.getByPlaceholderText('Songs, artists, albums...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'party');
    debounceSearch();
    fireEvent(input, 'submitEditing');

    expect(screen.getByText('Results for "party"')).toBeTruthy();
    expect(screen.getByText('party Song')).toBeTruthy();
  });

  it('shows retry when the search query fails', () => {
    const refetch = jest.fn().mockResolvedValue({});
    mockUseQuery.mockImplementation((options) => {
      const [key] = options.queryKey as QueryKey;
      if (key === 'search' && options.enabled) {
        return useQueryResult({ isError: true, refetch });
      }
      return useQueryResult();
    });

    renderSearch();

    const input = screen.getByPlaceholderText('Songs, artists, albums...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'broken');
    debounceSearch();
    fireEvent(input, 'submitEditing');

    fireEvent.press(screen.getByLabelText('Retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('clears the query and returns to idle state', () => {
    renderSearch();

    const input = screen.getByPlaceholderText('Songs, artists, albums...');
    fireEvent.changeText(input, 'clear me');
    fireEvent.press(screen.getByLabelText('Clear search'));
    debounceSearch();

    expect(screen.getByText('Find your next favourite')).toBeTruthy();
    expect(screen.queryByText('Results for "clear me"')).toBeNull();
  });
});
