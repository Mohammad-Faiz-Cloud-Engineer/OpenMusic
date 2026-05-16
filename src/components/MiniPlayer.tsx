import React, { useEffect, useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { useTheme } from '../theme';
import { a11yButton } from '../utils/a11y';
import { useTranslation } from 'react-i18next';

export const MINI_PLAYER_HEIGHT = 68;

const placeholder = require('../../assets/placeholder.png');

const MiniPlayerProgress = memo(function MiniPlayerProgress({
  trackStyle,
  fillStyle,
}: {
  trackStyle: ViewStyle;
  fillStyle: ViewStyle;
}) {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={trackStyle}>
      <View style={[fillStyle, { width: `${progress * 100}%` }]} />
    </View>
  );
});

interface MiniPlayerProps {
  onPress: () => void;
  bottomOffset?: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress, bottomOffset = 0 }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);

  const slideAnim = useRef(new Animated.Value(MINI_PLAYER_HEIGHT + 24)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: 'absolute',
          left: 12,
          right: 12,
          height: MINI_PLAYER_HEIGHT,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.5 : 0.12,
          shadowRadius: 20,
          elevation: 20,
        },
        glassTint: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(15,15,25,0.72)' : 'rgba(255,255,255,0.82)',
        },
        progressTrack: {
          height: 2,
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
        },
        progressFill: {
          height: '100%',
          backgroundColor: colors.accent,
          borderRadius: 1,
        },
        inner: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingTop: 2,
        },
        art: {
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.surface3,
        },
        info: {
          flex: 1,
          marginHorizontal: 12,
        },
        title: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
        },
        artist: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 2,
        },
        controlBtn: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, isDark]
  );

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentTrack ? 0 : MINI_PLAYER_HEIGHT + 24,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
  }, [currentTrack, slideAnim]);

  if (!currentTrack) return null;

  const imageSource = currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomOffset + 10, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={styles.glassTint} />
      <MiniPlayerProgress trackStyle={styles.progressTrack} fillStyle={styles.progressFill} />

      <TouchableOpacity
        style={styles.inner}
        onPress={onPress}
        activeOpacity={0.9}
        {...a11yButton(`${currentTrack.title} - ${t('player.nowPlaying')}`)}
      >
        <Image source={imageSource} style={styles.art} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={(e) => { e.stopPropagation(); void togglePlay(); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          {...a11yButton(isPlaying ? t('common.pause') : t('common.play'))}
        >
          {isLoading
            ? <Ionicons name="hourglass-outline" size={24} color={colors.text} />
            : <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.text} />
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={(e) => { e.stopPropagation(); void next(); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          {...a11yButton(t('player.controls.next'))}
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};
