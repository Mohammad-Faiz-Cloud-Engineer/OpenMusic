import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { Track, formatDuration } from '../api/jiosaavn';
import { usePlayerStore } from '../store/playerStore';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  variant?: 'grid' | 'list' | 'horizontal';
  showIndex?: number;
  onPress?: () => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  queue,
  variant = 'list',
  showIndex,
  onPress,
}) => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      playTrack(track, queue);
    }
  };

  const placeholder = require('../../assets/placeholder.png');
  const imageSource = track.thumbnail ? { uri: track.thumbnail } : placeholder;

  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: CARD_WIDTH }]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={styles.gridImageContainer}>
          <Image source={imageSource} style={styles.gridImage} />
          {isActive && (
            <LinearGradient
              colors={['transparent', 'rgba(168,85,247,0.7)']}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={[styles.gridPlayBtn, isActive && styles.gridPlayBtnActive]}>
            <Ionicons
              name={isActive && isPlaying ? 'pause' : 'play'}
              size={16}
              color="#fff"
            />
          </View>
          {isActive && (
            <View style={styles.nowPlayingDot} />
          )}
        </View>
        <View style={styles.gridInfo}>
          <Text style={[styles.gridTitle, isActive && styles.activeText]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.gridArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <Image source={imageSource} style={styles.horizontalImage} />
        <View style={styles.horizontalInfo}>
          <Text style={[styles.horizontalTitle, isActive && styles.activeText]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.horizontalArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
        {isActive && isPlaying && (
          <View style={styles.equalizerContainer}>
            <EqualizerBars />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // List variant (default)
  return (
    <TouchableOpacity
      style={[styles.listCard, isActive && styles.listCardActive]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.listLeft}>
        {showIndex !== undefined ? (
          <View style={styles.indexContainer}>
            {isActive && isPlaying ? (
              <EqualizerBars small />
            ) : (
              <Text style={[styles.indexText, isActive && styles.activeText]}>
                {showIndex + 1}
              </Text>
            )}
          </View>
        ) : null}
        <View style={styles.listImageContainer}>
          <Image source={imageSource} style={styles.listImage} />
          {isActive && (
            <View style={styles.listActiveOverlay}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.listInfo}>
          <Text style={[styles.listTitle, isActive && styles.activeText]} numberOfLines={1}>
            {track.title}
          </Text>
          <View style={styles.listMeta}>
            {track.explicit && (
              <View style={styles.explicitBadge}>
                <Text style={styles.explicitText}>E</Text>
              </View>
            )}
            <Text style={styles.listArtist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.listRight}>
        <Text style={styles.listDuration}>{formatDuration(track.duration_seconds)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Simple animated equalizer bars (CSS-style, static for now)
const EqualizerBars: React.FC<{ small?: boolean }> = ({ small }) => {
  const size = small ? 3 : 4;
  const heights = [10, 16, 8, 14, 6];
  return (
    <View style={[styles.equalizer, small && styles.equalizerSmall]}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={[
            styles.equalizerBar,
            { height: h * (small ? 0.7 : 1), width: size, marginHorizontal: 1 },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    marginBottom: 16,
  },
  gridImageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 1,
    backgroundColor: Colors.surface2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPlayBtnActive: {
    backgroundColor: Colors.accent,
  },
  nowPlayingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  gridInfo: {
    marginTop: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  gridArtist: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Horizontal
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    marginRight: 12,
    width: 220,
  },
  horizontalImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 10,
  },
  horizontalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  horizontalArtist: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  equalizerContainer: {
    marginLeft: 8,
  },

  // List
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  listCardActive: {
    backgroundColor: Colors.accentOverlay,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indexContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  listImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  listImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  listActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(168,85,247,0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  explicitBadge: {
    backgroundColor: Colors.surface3,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 5,
  },
  explicitText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  listArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  listRight: {
    marginLeft: 8,
  },
  listDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Shared
  activeText: {
    color: Colors.accent,
  },
  equalizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
  },
  equalizerSmall: {
    height: 14,
  },
  equalizerBar: {
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});
