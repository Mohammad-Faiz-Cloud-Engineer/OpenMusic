import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyPlaylistsScreen } from '../../src/screens/MyPlaylistsScreen';
import { SettingsScreen } from '../../src/screens/SettingsScreen';
import { useRecentStore } from '../../src/store/recentStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useUserPlaylistStore } from '../../src/store/userPlaylistStore';
import '../../src/i18n';

const navigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
});

const resetSettings = () => {
  useSettingsStore.setState({
    themeMode: 'system',
    hydrated: true,
    homeSections: {
      featuredBanner: true,
      quickPicks: true,
      topCharts: true,
      trendingNow: true,
      loveSongs: true,
      punjabiHits: true,
    },
  });
};

describe('settings and playlist screens', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    resetSettings();
    useRecentStore.setState({ tracks: [], hydrated: true });
    useUserPlaylistStore.setState({ playlists: [], hydrated: true });
  });

  it('MyPlaylistsScreen creates a playlist from the empty state', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    render(<MyPlaylistsScreen navigation={navigation() as never} route={{} as never} />);

    fireEvent.press(screen.getByText('New playlist'));
    fireEvent.changeText(screen.getByPlaceholderText('Playlist name'), 'Focus');
    await act(async () => {
      fireEvent.press(screen.getByText('Create'));
    });

    expect(useUserPlaylistStore.getState().playlists[0]?.name).toBe('Focus');
    expect(screen.getByText('Focus')).toBeTruthy();

    jest.restoreAllMocks();
  });

  it('MyPlaylistsScreen asks before deleting a playlist', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useUserPlaylistStore.setState({
      playlists: [{ id: 'pl1', name: 'Focus', tracks: [], updatedAt: 1 }],
      hydrated: true,
    });

    render(<MyPlaylistsScreen navigation={navigation() as never} route={{} as never} />);

    fireEvent.press(screen.getByLabelText('Delete Focus'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete playlist?',
      'Remove "Focus" and all songs in it?',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });

  it('SettingsScreen changes theme and opens the source link', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    render(<SettingsScreen navigation={navigation() as never} route={{} as never} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Dark'));
    });
    expect(useSettingsStore.getState().themeMode).toBe('dark');

    fireEvent.press(screen.getByLabelText('Source Code'));
    expect(openURL).toHaveBeenCalledWith(
      'https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic'
    );
    openURL.mockRestore();
  });

  it('SettingsScreen confirms recent history clearing', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<SettingsScreen navigation={navigation() as never} route={{} as never} />);

    fireEvent.press(screen.getByLabelText('Clear Recent Plays'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Clear recent plays?',
      'This will remove all tracks from your recent history. This cannot be undone.',
      expect.any(Array)
    );
    alertSpy.mockRestore();
  });
});
