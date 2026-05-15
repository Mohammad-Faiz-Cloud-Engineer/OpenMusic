describe('env config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses default API URL when env is unset', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    const { API_BASE_URL } = require('../../src/config/env');
    expect(API_BASE_URL).toBe('https://LocalFind-OpenMusic-API.hf.space');
  });

  it('strips trailing slash from custom API URL', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com/';
    const { API_BASE_URL } = require('../../src/config/env');
    expect(API_BASE_URL).toBe('https://api.example.com');
  });

  it('returns empty SENTRY_DSN when unset', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    const { SENTRY_DSN } = require('../../src/config/env');
    expect(SENTRY_DSN).toBe('');
  });
});
