import type { Track } from '../api/jiosaavn';

/** Strip ephemeral CDN URLs from persisted track rows */
export function sanitizeTrackForStorage(track: Track): Track {
  return { ...track, stream_url: null };
}
