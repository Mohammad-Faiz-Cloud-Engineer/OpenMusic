import axios from 'axios';

export const BASE_URL = 'https://LocalFind-OpenMusic-API.hf.space';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ── Types ─────────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration_seconds: number;
  thumbnail: string | null;
  language: string | null;
  has_lyrics: boolean;
  explicit: boolean;
  stream_url: string | null;
  track_number?: number;
}

export interface SearchResult {
  source: string;
  query: string;
  results: Track[];
}

export interface StreamData {
  id: string;
  source: string;
  quality: string;
  format: string;
  stream_url: string;
  expires_at: string | null;
}

export interface Album {
  source: string;
  id: string;
  title: string;
  artist: string;
  year: number;
  song_count: number;
  duration_seconds: number;
  thumbnail: string | null;
  language: string | null;
  tracks: Track[];
}

export interface Playlist {
  source: string;
  id: string;
  title: string;
  owner: string;
  song_count: number;
  duration_seconds: number;
  thumbnail: string | null;
  tracks: Track[];
}

export interface Chart {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
}

export interface ChartsResult {
  source: string;
  charts: Chart[];
}

export interface SuggestionsResult {
  source: string;
  query: string;
  suggestions: string[];
}

// ── API calls ─────────────────────────────────────────────────────────────

export const searchSongs = async (q: string): Promise<SearchResult> => {
  const { data } = await api.get('/jiosaavn/search', { params: { q } });
  return data;
};

export const getSuggestions = async (q: string): Promise<SuggestionsResult> => {
  const { data } = await api.get('/jiosaavn/suggestions', { params: { q } });
  return data;
};

export const getAlbum = async (id: string): Promise<Album> => {
  const { data } = await api.get(`/jiosaavn/album/${id}`);
  return data;
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
  const { data } = await api.get(`/jiosaavn/playlist/${id}`);
  return data;
};

export const getCharts = async (): Promise<ChartsResult> => {
  const { data } = await api.get('/jiosaavn/charts');
  return data;
};

export const getStreamUrl = async (id: string): Promise<StreamData> => {
  const { data } = await api.get(`/jiosaavn/track/${id}`);
  return data;
};

export const getProxyPlayUrl = (id: string): string =>
  `${BASE_URL}/jiosaavn/track/${id}/play`;

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
