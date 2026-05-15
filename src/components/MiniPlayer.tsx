import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { Colors } from '../theme/colors';
import { a11yButton } from '../utils/a11y';
import { useTranslation } from 'react-i18next';

export const MINI_PLAYER_HEIGHT = 64;

interface MiniPlayerProps {
  onPress: () => void;
  bottomOffset?: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress, bottomOffset = 0 }) => {
  const { t } = useTranslation();
  const { currentTrack, isPlaying, isLoading, togglePlay, next, position, duration } =
    usePlayerStore();

  const slideAnim = useRef(new Animated.Value(MINI_PLAYER_HEIGHT + 16)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentTrack ? 0 : MINI_PLAYER_HEIGHT + 16,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [!!currentTrack]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;
  const placeholder = require('../../assets/placeholder.png');
  const imageSource = currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: bottomOffset + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Thin progress line at top */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <TouchableOpacity
        style={styles.inner}
        onPress={onPress}
        activeOpacity={0.95}
        {...a11yButton(`${currentTrack.title} — ${t('player.nowPlaying')}`)}
      >
        {/* Artwork */}
        <Image source={imageSource} style={styles.art} />

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
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={(e) => { e.stopPropagation(); togglePlay(); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          {...a11yButton(isPlaying ? t('common.pause') : t('common.play'))}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={24} color={Colors.text} />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={Colors.text} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={(e) => { e.stopPropagation(); next(); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="play-skip-forward" size={22} color={Colors.text} />
        </TouchableOpacity>
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
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },
  progressTrack: {
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
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 2,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 2,
    backgroundColor: Colors.surface3,
  },
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  artist: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
