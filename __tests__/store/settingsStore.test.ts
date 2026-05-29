import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOME_SECTIONS, useSettingsStore } from '../../src/store/settingsStore';

const allHomeSections = (value: boolean) =>
  Object.fromEntries(HOME_SECTIONS.map((id) => [id, value])) as Record<
    (typeof HOME_SECTIONS)[number],
    boolean
  >;

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.setState({
      themeMode: 'system',
      homeSections: allHomeSections(true),
      hydrated: false,
    });
  });

  it('hydrates valid stored settings', async () => {
    const homeSections = {
      ...allHomeSections(true),
      quickPicks: false,
      topCharts: false,
    };
    await AsyncStorage.setItem(
      '@openmusic/settings',
      JSON.stringify({ themeMode: 'dark', homeSections })
    );

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useSettingsStore.getState().themeMode).toBe('dark');
    expect(useSettingsStore.getState().homeSections.quickPicks).toBe(false);
    expect(useSettingsStore.getState().homeSections.topCharts).toBe(false);
  });

  it('ignores invalid persisted settings while marking hydration complete', async () => {
    await AsyncStorage.setItem(
      '@openmusic/settings',
      JSON.stringify({ themeMode: 'blue', homeSections: { quickPicks: false } })
    );

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().hydrated).toBe(true);
    expect(useSettingsStore.getState().themeMode).toBe('system');
    expect(useSettingsStore.getState().homeSections).toEqual(allHomeSections(true));
  });

  it('persists theme and home section changes', async () => {
    await useSettingsStore.getState().setThemeMode('light');
    await useSettingsStore.getState().setHomeSection('featuredBanner', false);

    const raw = await AsyncStorage.getItem('@openmusic/settings');
    expect(JSON.parse(raw ?? '{}')).toEqual({
      themeMode: 'light',
      homeSections: {
        ...allHomeSections(true),
        featuredBanner: false,
      },
    });
  });
});
