import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Track } from '../api/jiosaavn';

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Collection: undefined;
  Library: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Player: undefined;
  Playlist: { id: string; title?: string };
  TrackList: { title: string; tracks: Track[] };
  Charts: undefined;
  /** Locally saved playlists (user-created) */
  MyPlaylists: undefined;
  UserPlaylist: { playlistId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
