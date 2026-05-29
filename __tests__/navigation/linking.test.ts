import { linking } from '../../src/navigation/linking';

describe('deep linking config', () => {
  it('registers custom scheme and universal link prefixes', () => {
    expect(linking.prefixes).toContain('openmusic://');
    expect(linking.prefixes).toContain('https://openmusic.app');
  });

  it('maps tab and stack screens', () => {
    const screens = linking.config?.screens as Record<string, unknown>;
    expect(screens).toBeDefined();
    expect(screens.Player).toBe('player');
    expect(screens.Charts).toBe('charts');
    expect(screens.Playlist).toBe('playlist/:id');
    expect(screens.MyPlaylists).toBe('playlists');
    expect(screens.UserPlaylist).toBe('user-playlist/:playlistId');
    expect(screens.TrackList).toBeUndefined();

    const tabs = screens.Tabs as { screens: Record<string, string> };
    expect(tabs.screens.Home).toBe('home');
    expect(tabs.screens.Search).toBe('search');
    expect(tabs.screens.Collection).toBe('collection');
    expect(tabs.screens.Library).toBe('library');
    expect(tabs.screens.Settings).toBe('settings');
  });
});
