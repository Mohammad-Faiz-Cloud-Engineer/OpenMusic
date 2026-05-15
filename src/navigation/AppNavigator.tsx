import React from 'react';
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
import { PlayerScreen } from '../screens/PlayerScreen';
import { PlaylistScreen } from '../screens/PlaylistScreen';
import { TrackListScreen } from '../screens/TrackListScreen';
import { ChartsScreen } from '../screens/ChartsScreen';
import { MiniPlayer } from '../components/MiniPlayer';
import { Colors } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { linking } from './linking';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TAB_BAR_HEIGHT = 60;

type TabNavigatorProps = StackScreenProps<RootStackParamList, 'Tabs'>;

function TabNavigator({ navigation }: TabNavigatorProps) {
  const { t } = useTranslation();
  const { currentTrack } = usePlayerStore();
  const insets = useSafeAreaInsets();

  const tabBarTotalHeight = TAB_BAR_HEIGHT + insets.bottom;

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
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.tabBarGlass} />
              <View style={styles.tabBarTopBorder} />
            </View>
          ),
          tabBarActiveTintColor: Colors.text,
          tabBarInactiveTintColor: Colors.textMuted,
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
            else if (route.name === 'Library')
              iconName = focused ? 'library' : 'library-outline';
            return <Ionicons name={iconName} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: t('tabs.search') }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: t('tabs.library') }} />
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
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: true,
            cardOverlayEnabled: false,
            cardStyle: { backgroundColor: Colors.bg },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                backgroundColor: Colors.bg,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabRoot: { flex: 1 },
  tabBarGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,25,0.72)',
  },
  tabBarTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
});
