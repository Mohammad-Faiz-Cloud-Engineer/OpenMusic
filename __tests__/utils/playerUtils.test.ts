import { isCacheExpired, pickShuffleIndex } from '../../src/utils/playerUtils';

describe('isCacheExpired', () => {
  it('returns false when no expiry', () => {
    expect(isCacheExpired({ url: 'https://x', expiresAt: null })).toBe(false);
  });

  it('returns true when expiry is invalid', () => {
    expect(isCacheExpired({ url: 'https://x', expiresAt: 'not-a-date' })).toBe(true);
  });

  it('returns true when expiry is within 3 minutes', () => {
    const soon = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    expect(isCacheExpired({ url: 'https://x', expiresAt: soon })).toBe(true);
  });

  it('returns false when expiry is far in the future', () => {
    const later = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isCacheExpired({ url: 'https://x', expiresAt: later })).toBe(false);
  });
});

describe('pickShuffleIndex', () => {
  it('returns 0 for single-item queue', () => {
    expect(pickShuffleIndex(1, 0)).toBe(0);
  });

  it('never returns current index when length > 1', () => {
    for (let i = 0; i < 50; i++) {
      const next = pickShuffleIndex(5, 2);
      expect(next).not.toBe(2);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(5);
    }
  });
});
