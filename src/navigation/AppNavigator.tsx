import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { PlayerScreen } from '../screens/PlayerScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen';
import { TrackListScreen } from '../screens/TrackListScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { Colors } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Heights — keep in sync with MiniPlayer container height
const TAB_BAR_HEIGHT = 64;
const MINI_PLAYER_HEIGHT = 72;

// ── Tab Navigator ─────────────────────────────────────────────────────────
function TabNavigator({ navigation }: any) {
  const { currentTrack } = usePlayerStore();

  return (
    <View style={{ flex: 1 }}>
      {/* Screens — pad bottom so content isn't hidden behind tab bar + mini player */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          // Tab bar is always a fixed height at the very bottom
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: TAB_BAR_HEIGHT,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(10,10,15,0)', 'rgba(10,10,15,0.95)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ),
          // Push screen content up by mini player height when it's visible
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 6,
          },
          tabBarItemStyle: {
            paddingTop: 8,
          },
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
            else if (route.name === 'Library') iconName = focused ? 'library' : 'library-outline';
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Library" component={LibraryScreen} />
      </Tab.Navigator>

      {/* MiniPlayer floats directly above the tab bar, never overlapping it */}
      {currentTrack && (
        <MiniPlayer
          onPress={() => navigation.navigate('Player')}
          bottomOffset={TAB_BAR_HEIGHT}
        />
      )}
    </View>
  );
}

// ── Root Stack Navigator ──────────────────────────────────────────────────
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                    }),
                  },
                ],
              },
            }),
          }}
        />
        <Stack.Screen
          name="Playlist"
          component={PlaylistScreen as any}
          options={{ presentation: 'card' }}
        />
        <Stack.Screen
          name="TrackList"
          component={TrackListScreen as any}
          options={{ presentation: 'card' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
