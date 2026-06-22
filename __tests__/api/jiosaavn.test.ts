import axios from 'axios';
import { searchSongs, getStreamUrl, formatDuration } from '../../src/api/jiosaavn';

jest.mock('axios', () => {
  const mockGet = jest.fn();
  return { create: jest.fn(() => ({ get: mockGet })), isAxiosError: jest.fn() };
});

function mockApiGet(): jest.Mock {
  return (axios.create() as unknown as { get: jest.Mock }).get;
}

describe('jiosaavn API', () => {
  beforeEach(() => {
    mockApiGet().mockReset();
  });

  it('formatDuration formats seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
  });

  it('searchSongs rejects empty query', async () => {
    await expect(searchSongs('   ')).rejects.toThrow('empty');
  });

  it('searchSongs rejects overly long query', async () => {
    await expect(searchSongs('a'.repeat(201))).rejects.toThrow('200');
  });

  it('getStreamUrl rejects invalid id', async () => {
    await expect(getStreamUrl('../bad')).rejects.toThrow('Invalid');
  });

  it('searchSongs calls API for valid query', async () => {
    const mockData = { data: { results: [{ id: '1' }] } };
    mockApiGet().mockResolvedValue(mockData);
    const result = await searchSongs('hello');
    expect(mockApiGet()).toHaveBeenCalledWith(
      '/jiosaavn/search',
      expect.objectContaining({ params: { q: 'hello' } }),
    );
    expect(result).toEqual(mockData.data);
  });

  it('getStreamUrl calls API for valid id', async () => {
    const mockData = { data: { url: 'https://stream.example/track' } };
    mockApiGet().mockResolvedValue(mockData);
    const result = await getStreamUrl('valid-id-123');
    expect(mockApiGet()).toHaveBeenCalledWith('/jiosaavn/track/valid-id-123');
    expect(result).toEqual(mockData.data);
  });
});
