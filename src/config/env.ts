const DEFAULT_API_BASE_URL = 'https://LocalFind-OpenMusic-API.hf.space';

/** Public API base URL (set EXPO_PUBLIC_API_BASE_URL in .env). */
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, '');

/** Optional Sentry DSN — crash reporting disabled when unset. */
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || '';
