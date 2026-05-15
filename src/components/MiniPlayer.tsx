import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { Colors } from '../theme/colors';

export const MINI_PLAYER_HEIGHT = 72;

interface MiniPlayerProps {
  onPress: () => void;
  /** Height of the tab bar — MiniPlayer sits directly on top of it */
  bottomOffset?: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress, bottomOffset = 0 }) => {
  const { currentTrack, isPlaying, isLoading, togglePlay, next, position, duration } =
    usePlayerStore();

  const slideAnim = useRef(new Animated.Value(MINI_PLAYER_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentTrack) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: MINI_PLAYER_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;
  const placeholder = require('../../assets/placeholder.png');
  const imageSource = currentTrack.thumbnail
    ? { uri: currentTrack.thumbnail }
    : placeholder;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset + 8, // 8px gap above the tab bar
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(168,85,247,0.15)', 'rgba(0,0,0,0.4)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Progress bar at top edge */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.9}>
        {/* Artwork */}
        <Animated.View style={[styles.artContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Image source={imageSource} style={styles.art} />
        </Animated.View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={(e) => { e.stopPropagation(); togglePlay(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={22} color={Colors.accent} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color={Colors.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={(e) => { e.stopPropagation(); next(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: MINI_PLAYER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.surface3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 2,
  },
  artContainer: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  art: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  artist: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
