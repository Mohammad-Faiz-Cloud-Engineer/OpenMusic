import type { Track } from '../api/jiosaavn';

/** Strip ephemeral CDN URLs from persisted track rows */
export function sanitizeTrackForStorage(track: Track): Track {
  return {
    ...track,
    id: track.id.trim(),
    title: track.title.trim() || 'Unknown title',
    artist: track.artist.trim() || 'Unknown artist',
    album: track.album.trim() || 'Unknown album',
    duration_seconds: Number.isFinite(track.duration_seconds)
      ? Math.max(0, track.duration_seconds)
      : 0,
    thumbnail: typeof track.thumbnail === 'string' && track.thumbnail.trim()
      ? track.thumbnail.trim()
      : null,
    language: typeof track.language === 'string' && track.language.trim()
      ? track.language.trim()
      : null,
    has_lyrics: Boolean(track.has_lyrics),
    explicit: Boolean(track.explicit),
    stream_url: null,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export function normalizeStoredTrack(value: unknown): Track | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const title = asString(value.title);
  const artist = asString(value.artist);
  if (!id || !title || !artist) return null;

  const duration =
    typeof value.duration_seconds === 'number' && Number.isFinite(value.duration_seconds)
      ? value.duration_seconds
      : 0;

  return sanitizeTrackForStorage({
    id,
    title,
    artist,
    album: asString(value.album) ?? 'Unknown album',
    duration_seconds: duration,
    thumbnail: asString(value.thumbnail),
    language: asString(value.language),
    has_lyrics: Boolean(value.has_lyrics),
    explicit: Boolean(value.explicit),
    stream_url: null,
    track_number:
      typeof value.track_number === 'number' && Number.isFinite(value.track_number)
        ? value.track_number
        : undefined,
  });
}
