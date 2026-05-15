import axios from 'axios';
import { searchSongs, getStreamUrl, formatDuration } from '../../src/api/jiosaavn';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('jiosaavn API', () => {
  beforeEach(() => {
    mockedAxios.create.mockReturnValue({
      get: jest.fn(),
    } as unknown as ReturnType<typeof axios.create>);
  });

  it('formatDuration formats seconds', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(0)).toBe('0:00');
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
});
