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

  it('maps network errors to friendly message', async () => {
    const { AxiosError } = require('axios');
    const err = new AxiosError('Network');
    err.response = undefined;
    mockGet.mockRejectedValueOnce(err);

    const { searchSongs } = loadApi();
    await expect(searchSongs('hello')).rejects.toThrow('Network unavailable');
  });
});
