import axios from 'axios';
import { API_BASE_URL } from '../config/env';

export const BASE_URL = API_BASE_URL;

export const MAX_QUERY_LENGTH = 200;
const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

const assertQuery = (q: string): string => {
  const trimmed = q.trim();
  if (!trimmed) throw new Error('Search query cannot be empty');
  if (trimmed.length > MAX_QUERY_LENGTH) {
    throw new Error(`Search query must be at most ${MAX_QUERY_LENGTH} characters`);
  }
  return trimmed;
};

const assertId = (id: string, label: string): string => {
  const trimmed = id.trim();
  if (!trimmed || !ID_PATTERN.test(trimmed)) {
    throw new Error(`Invalid ${label}`);
  }
  return trimmed;
};

const handleApiError = (err: unknown): never => {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') throw new Error('Request timed out');
    if (!err.response) throw new Error('Network unavailable');
    throw new Error(`API error (${err.response.status})`);
  }
  throw err;
};

// Types

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

// API calls

export const searchSongs = async (q: string): Promise<SearchResult> => {
  const query = assertQuery(q);
  try {
    const { data } = await api.get<SearchResult>('/jiosaavn/search', { params: { q: query } });
    return data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getSuggestions = async (q: string): Promise<SuggestionsResult> => {
  const query = assertQuery(q);
  try {
    const { data } = await api.get<SuggestionsResult>('/jiosaavn/suggestions', {
      params: { q: query },
    });
    return data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getAlbum = async (id: string): Promise<Album> => {
  const albumId = assertId(id, 'album id');
  try {
    const { data } = await api.get<Album>(`/jiosaavn/album/${encodeURIComponent(albumId)}`);
    return data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getPlaylist = async (id: string): Promise<Playlist> => {
  const playlistId = assertId(id, 'playlist id');
  try {
    const { data } = await api.get<Playlist>(
      `/jiosaavn/playlist/${encodeURIComponent(playlistId)}`
    );
    return data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getCharts = async (): Promise<ChartsResult> => {
  try {
    const { data } = await api.get<ChartsResult>('/jiosaavn/charts');
    return data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getStreamUrl = async (id: string): Promise<StreamData> => {
  const trackId = assertId(id, 'track id');
  try {
    const { data } = await api.get<StreamData>(
      `/jiosaavn/track/${encodeURIComponent(trackId)}`
    );
    return data;
  } catch (err) {
    return handleApiError(err);
  }
};

export const getProxyPlayUrl = (id: string): string => {
  const trackId = assertId(id, 'track id');
  return `${BASE_URL}/jiosaavn/track/${encodeURIComponent(trackId)}/play`;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
