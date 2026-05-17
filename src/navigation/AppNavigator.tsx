import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen';
import { TrackListScreen } from '../screens/TrackListScreen';
import { ChartsScreen } from '../screens/ChartsScreen';
import { MyPlaylistsScreen } from '../screens/MyPlaylistsScreen';
import { UserPlaylistDetailScreen } from '../screens/UserPlaylistDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { useTheme } from '../theme';
import { usePlayerStore } from '../store/playerStore';
import { linking } from './linking';
import type { RootStackParamList, TabParamList } from './types';
import { rootNavigationRef } from './rootNavigation';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TAB_BAR_HEIGHT = 60;

type TabNavigatorProps = StackScreenProps<RootStackParamList, 'Tabs'>;

function TabNavigator({ navigation }: TabNavigatorProps) {
  const { t } = useTranslation();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const tabBarTotalHeight = TAB_BAR_HEIGHT + insets.bottom;

  const tabStyles = useMemo(
    () =>
      StyleSheet.create({
        tabBarGlass: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(15,15,25,0.82)' : 'rgba(252,252,254,0.92)',
        },
        tabBarTopBorder: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: colors.glassBorder,
        },
      }),
    [colors.glassBorder, isDark]
  );

  return (
    <View style={styles.tabRoot}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: tabBarTotalHeight,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <View style={tabStyles.tabBarGlass} />
              <View style={tabStyles.tabBarTopBorder} />
            </View>
          ),
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.3,
            marginBottom: 4,
          },
          tabBarItemStyle: { paddingTop: 6 },
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Home')
              iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Search')
              iconName = focused ? 'search' : 'search-outline';
            else if (route.name === 'Collection')
              iconName = focused ? 'albums' : 'albums-outline';
            else if (route.name === 'Library')
              iconName = focused ? 'library' : 'library-outline';
            else if (route.name === 'Settings')
              iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: t('tabs.search') }} />
        <Tab.Screen name="Collection" component={CollectionScreen} options={{ tabBarLabel: t('tabs.collection') }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: t('tabs.library') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('tabs.settings') }} />
      </Tab.Navigator>

      {currentTrack && (
        <MiniPlayer
          onPress={() => navigation.navigate('Player')}
          bottomOffset={tabBarTotalHeight}
        />
      )}
    </View>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer ref={rootNavigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
            cardOverlayEnabled: false,
            cardStyle: { backgroundColor: colors.bg },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                backgroundColor: colors.bg,
                transform: [{
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height, 0],
                  }),
                }],
              },
            }),
          }}
        />
        <Stack.Screen name="Playlist" component={PlaylistScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="TrackList" component={TrackListScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="Charts" component={ChartsScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="MyPlaylists" component={MyPlaylistsScreen} options={{ presentation: 'card' }} />
        <Stack.Screen name="UserPlaylist" component={UserPlaylistDetailScreen} options={{ presentation: 'card' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabRoot: { flex: 1 },
});
