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
          Library: 'library',
        },
      },
      Player: 'player',
      Playlist: 'playlist/:id',
      TrackList: 'tracks',
      Charts: 'charts',
    },
  },
};
