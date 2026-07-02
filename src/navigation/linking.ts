import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['openmusic://', 'https://openmusic.app'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'home',
          Search: 'search',
          Collection: 'collection',
          Library: 'library',
          Settings: 'settings',
        },
      },
      Player: 'player',
      Playlist: 'playlist/:id',
      TrackList: 'tracks',
      Charts: 'charts',
      MyPlaylists: 'my-playlists',
      UserPlaylist: 'playlist/user/:playlistId',
    },
  },
};
