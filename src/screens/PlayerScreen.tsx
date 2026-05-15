import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore, RepeatMode } from '../store/playerStore';
import { Colors } from '../theme/colors';
import { formatDuration } from '../api/jiosaavn';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 64;

interface PlayerScreenProps {
  navigation: any;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation }) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    repeatMode,
    isShuffle,
    queue,
    currentIndex,
    togglePlay,
    next,
    prev,
    seekTo,
    setRepeat,
    toggleShuffle,
    setIsSeeking,
    setPosition,
  } = usePlayerStore();

  const artworkScale = useRef(new Animated.Value(isPlaying ? 1 : 0.85)).current;
  const seekBarWidth = useRef(0);

  // Animate artwork on play/pause
  React.useEffect(() => {
    Animated.spring(artworkScale, {
      toValue: isPlaying ? 1 : 0.85,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [isPlaying]);

  const handleSeekBarPress = useCallback(
    (evt: any) => {
      if (seekBarWidth.current <= 0 || duration <= 0) return;
      const x = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / seekBarWidth.current));
      const newPosition = ratio * duration;
      setIsSeeking(true);
      setPosition(newPosition);
      seekTo(newPosition);
    },
    [duration, seekTo]
  );

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = modes.indexOf(repeatMode);
    setRepeat(modes[(current + 1) % modes.length]);
  };

  const repeatIcon = () => {
    if (repeatMode === 'one') return 'repeat-outline';
    return 'repeat';
  };

  const repeatColor = repeatMode !== 'off' ? Colors.accent : Colors.textSecondary;

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={['#1A0A2E', '#0A0A1A', '#0A0A0F']} style={StyleSheet.absoluteFill} />
        <Ionicons name="musical-notes" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyText}>Nothing playing</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;
  const placeholder = require('../../assets/placeholder.png');
  const imageSource = currentTrack.thumbnail
    ? { uri: currentTrack.thumbnail }
    : placeholder;

  return (
    <View style={styles.container}>
      {/* Background blur artwork */}
      <Image source={imageSource} style={styles.bgArtwork} blurRadius={40} />
      <LinearGradient
        colors={['rgba(10,10,15,0.5)', 'rgba(10,10,15,0.85)', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>NOW PLAYING</Text>
            <Text style={styles.topQueue}>
              {currentIndex + 1} / {queue.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.topBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Animated.View
            style={[
              styles.artworkWrapper,
              { transform: [{ scale: artworkScale }] },
            ]}
          >
            <Image source={imageSource} style={styles.artwork} />
            <LinearGradient
              colors={['transparent', 'rgba(168,85,247,0.15)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackInfoLeft}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity style={styles.likeBtn}>
            <Ionicons name="heart-outline" size={26} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Seek Bar */}
        <View style={styles.seekSection}>
          <TouchableOpacity
            style={styles.seekBarContainer}
            onPress={handleSeekBarPress}
            activeOpacity={1}
            onLayout={(e) => {
              seekBarWidth.current = e.nativeEvent.layout.width;
            }}
          >
            <View style={styles.seekBarTrack}>
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={[styles.seekBarFill, { width: `${progress * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View
                style={[
                  styles.seekBarThumb,
                  { left: `${progress * 100}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.seekTimes}>
            <Text style={styles.seekTime}>{formatDuration(position / 1000)}</Text>
            <Text style={styles.seekTime}>{formatDuration(duration / 1000)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Shuffle */}
          <TouchableOpacity
            style={styles.sideControl}
            onPress={toggleShuffle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffle ? Colors.accent : Colors.textSecondary}
            />
            {isShuffle && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Prev */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={prev}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-back" size={30} color={Colors.text} />
          </TouchableOpacity>

          {/* Play/Pause */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={togglePlay}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#A855F7', '#7C3AED', '#EC4899']}
              style={styles.playBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <Ionicons name="hourglass-outline" size={32} color="#fff" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#fff"
                  style={!isPlaying ? { marginLeft: 4 } : undefined}
                />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={next}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={30} color={Colors.text} />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            style={styles.sideControl}
            onPress={cycleRepeat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={repeatIcon()} size={22} color={repeatColor} />
            {repeatMode === 'one' && (
              <Text style={styles.repeatOneLabel}>1</Text>
            )}
            {repeatMode !== 'off' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Extra Controls */}
        <View style={styles.extraControls}>
          <TouchableOpacity style={styles.extraBtn}>
            <Ionicons name="list" size={20} color={Colors.textSecondary} />
            <Text style={styles.extraBtnText}>Queue</Text>
          </TouchableOpacity>
          <View style={styles.qualityBadge}>
            <Ionicons name="musical-note" size={12} color={Colors.accent} />
            <Text style={styles.qualityText}>320kbps</Text>
          </View>
          <TouchableOpacity style={styles.extraBtn}>
            <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.extraBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Up Next */}
        {queue.length > 1 && (
          <View style={styles.upNext}>
            <Text style={styles.upNextTitle}>Up Next</Text>
            {queue.slice(currentIndex + 1, currentIndex + 4).map((track, i) => (
              <View key={track.id} style={styles.upNextItem}>
                <Image
                  source={track.thumbnail ? { uri: track.thumbnail } : placeholder}
                  style={styles.upNextImage}
                />
                <View style={styles.upNextInfo}>
                  <Text style={styles.upNextTrackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.upNextArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
                <Text style={styles.upNextDuration}>
                  {formatDuration(track.duration_seconds)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bgArtwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.6,
    opacity: 0.4,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  backBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backBtnText: {
    color: Colors.text,
    fontWeight: '600',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  topBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    alignItems: 'center',
  },
  topLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  topQueue: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Artwork
  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 16,
    marginBottom: 32,
  },
  artworkWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  artwork: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface2,
  },

  // Track Info
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  trackInfoLeft: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  trackArtist: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  likeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Seek Bar
  seekSection: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  seekBarContainer: {
    height: 20,
    justifyContent: 'center',
  },
  seekBarTrack: {
    height: 4,
    backgroundColor: Colors.surface3,
    borderRadius: 2,
    position: 'relative',
  },
  seekBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  seekTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  seekTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  sideControl: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  repeatOneLabel: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 8,
    fontWeight: '800',
    color: Colors.accent,
  },
  skipBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  playBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Extra Controls
  extraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  extraBtn: {
    alignItems: 'center',
    gap: 4,
  },
  extraBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentOverlay,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.accentOverlayStrong,
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },

  // Up Next
  upNext: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upNextTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  upNextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upNextImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  upNextInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  upNextTrackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  upNextArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upNextDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
