const mockGet = jest.fn();

jest.mock('axios', () => {
  class AxiosError extends Error {
    isAxiosError = true;
    code?: string;
    response?: { status: number };
  }
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => ({ get: mockGet })),
      isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean }).isAxiosError),
    },
    AxiosError,
  };
});

describe('jiosaavn API (HTTP)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    jest.resetModules();
  });

  const loadApi = () => require('../../src/api/jiosaavn') as typeof import('../../src/api/jiosaavn');

  it('searchSongs returns API data on success', async () => {
    const payload = { source: 'jiosaavn', query: 'test', results: [] };
    mockGet.mockResolvedValueOnce({ data: payload });

    const { searchSongs } = loadApi();
    const result = await searchSongs('test');
    expect(result).toEqual(payload);
    expect(mockGet).toHaveBeenCalledWith('/jiosaavn/search', { params: { q: 'test' } });
  });

  it('getProxyPlayUrl builds encoded play URL', () => {
    const { getProxyPlayUrl, BASE_URL } = loadApi();
    expect(getProxyPlayUrl('abc123')).toBe(`${BASE_URL}/jiosaavn/track/abc123/play`);
  });

  it('getCharts fetches charts endpoint', async () => {
    mockGet.mockResolvedValueOnce({ data: { source: 'jiosaavn', charts: [] } });
    const { getCharts } = loadApi();
    const result = await getCharts();
    expect(mockGet).toHaveBeenCalledWith('/jiosaavn/charts');
    expect(result.charts).toEqual([]);
  });

  it('getAlbum fetches the encoded album endpoint', async () => {
    const payload = {
      source: 'jiosaavn',
      id: 'album_1',
      title: 'Album',
      artist: 'Artist',
      year: 2026,
      song_count: 0,
      duration_seconds: 0,
      thumbnail: null,
      language: null,
      tracks: [],
    };
    mockGet.mockResolvedValueOnce({ data: payload });

    const { getAlbum } = loadApi();
    const result = await getAlbum(' album_1 ');

    expect(mockGet).toHaveBeenCalledWith('/jiosaavn/album/album_1');
    expect(result).toEqual(payload);
  });

  it('getPlaylist fetches the encoded playlist endpoint', async () => {
    const payload = {
      source: 'jiosaavn',
      id: 'playlist-1',
      title: 'Playlist',
      owner: 'Owner',
      song_count: 0,
      duration_seconds: 0,
      thumbnail: null,
      tracks: [],
    };
    mockGet.mockResolvedValueOnce({ data: payload });

    const { getPlaylist } = loadApi();
    const result = await getPlaylist('playlist-1');

    expect(mockGet).toHaveBeenCalledWith('/jiosaavn/playlist/playlist-1');
    expect(result).toEqual(payload);
  });

  it('getStreamUrl fetches the encoded track endpoint', async () => {
    const payload = {
      id: 'track-1',
      source: 'jiosaavn',
      quality: '320kbps',
      format: 'm4a',
      stream_url: 'https://cdn.example/track.m4a',
      expires_at: null,
    };
    mockGet.mockResolvedValueOnce({ data: payload });

    const { getStreamUrl } = loadApi();
    const result = await getStreamUrl('track-1');

    expect(mockGet).toHaveBeenCalledWith('/jiosaavn/track/track-1');
    expect(result).toEqual(payload);
  });

  it('maps network errors to friendly message', async () => {
    const { AxiosError } = require('axios');
    const err = new AxiosError('Network');
    // No err.response means the request never reached the server (network down)
    err.response = undefined;
    mockGet.mockRejectedValueOnce(err);

    const { searchSongs } = loadApi();
    await expect(searchSongs('hello')).rejects.toThrow('Network unavailable');
  });

  it('maps request timeouts to friendly message', async () => {
    const { AxiosError } = require('axios');
    const err = new AxiosError('Timeout');
    err.code = 'ECONNABORTED';
    mockGet.mockRejectedValueOnce(err);

    const { getCharts } = loadApi();
    await expect(getCharts()).rejects.toThrow('Request timed out');
  });

  it('maps API status errors without leaking response bodies', async () => {
    const { AxiosError } = require('axios');
    const err = new AxiosError('Server');
    err.response = { status: 503 };
    mockGet.mockRejectedValueOnce(err);

    const { searchSongs } = loadApi();
    await expect(searchSongs('hello')).rejects.toThrow('API error (503)');
  });
});
