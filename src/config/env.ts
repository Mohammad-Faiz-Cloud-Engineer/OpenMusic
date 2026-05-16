const DEFAULT_API_BASE_URL = 'https://LocalFind-OpenMusic-API.hf.space';

const normalizePublicUrl = (value: string, label: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('unsupported protocol');
    }
    return trimmed;
  } catch {
    throw new Error(`${label} must be a valid http(s) URL`);
  }
};

/** Public API base URL (set EXPO_PUBLIC_API_BASE_URL in .env). */
export const API_BASE_URL =
  normalizePublicUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL,
    'EXPO_PUBLIC_API_BASE_URL'
  );

/** Optional Sentry DSN. Crash reporting is disabled when unset. */
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || '';
