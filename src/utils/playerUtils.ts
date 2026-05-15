export interface CachedStream {
  url: string;
  expiresAt: string | null;
}

/** Returns true if the cached URL is expired or within 3 min of expiring */
export const isCacheExpired = (cached: CachedStream): boolean => {
  if (!cached.expiresAt) return false;
  const exp = new Date(cached.expiresAt).getTime();
  if (Number.isNaN(exp)) return true;
  return exp - Date.now() <= 3 * 60 * 1000;
};

/** Pick a shuffle index different from current when possible */
export const pickShuffleIndex = (queueLength: number, currentIndex: number): number => {
  if (queueLength <= 0) return 0;
  if (queueLength === 1) return 0;
  let nextIndex = currentIndex;
  do {
    nextIndex = Math.floor(Math.random() * queueLength);
  } while (nextIndex === currentIndex);
  return nextIndex;
};
