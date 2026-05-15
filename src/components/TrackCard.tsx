import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import type { Track } from '../api/jiosaavn';
import { formatDuration } from '../api/jiosaavn';
import { usePlayerStore } from '../store/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { a11yButton } from '../utils/a11y';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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
    if (onPress) onPress();
    else playTrack(track, queue);
  };

  const placeholder = require('../../assets/placeholder.png');
  const imageSource = track.thumbnail ? { uri: track.thumbnail } : placeholder;

  // ── Grid variant ──────────────────────────────────────────────────────────
  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: GRID_CARD_WIDTH }]}
        onPress={handlePress}
        activeOpacity={0.7}
        {...a11yButton(`${track.title} by ${track.artist}`)}
      >
        <View style={styles.gridImageWrap}>
          <Image source={imageSource} style={styles.gridImage} />
          {isActive && (
            <View style={styles.gridActiveOverlay}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#fff"
              />
            </View>
          )}
        </View>
        <Text style={[styles.gridTitle, isActive && styles.activeText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.gridArtist} numberOfLines={1}>
          {track.artist}
        </Text>
      </TouchableOpacity>
    );
  }

  // ── Horizontal variant ────────────────────────────────────────────────────
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.7}
        {...a11yButton(`${track.title} by ${track.artist}`)}
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
        {isActive && isPlaying && <EqualizerBars />}
      </TouchableOpacity>
    );
  }

  // ── List variant (default) ────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={handlePress}
      activeOpacity={0.7}
      {...a11yButton(`${track.title} by ${track.artist}`)}
    >
      {/* Index or equalizer */}
      {showIndex !== undefined && (
        <View style={styles.indexWrap}>
          {isActive && isPlaying ? (
            <EqualizerBars small />
          ) : (
            <Text style={[styles.indexText, isActive && styles.activeText]}>
              {showIndex + 1}
            </Text>
          )}
        </View>
      )}

      {/* Artwork */}
      <View style={styles.listImageWrap}>
        <Image source={imageSource} style={styles.listImage} />
        {isActive && (
          <View style={styles.listActiveOverlay}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#fff" />
          </View>
        )}
      </View>

      {/* Info */}
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

      {/* Duration + more */}
      <View style={styles.listRight}>
        <Text style={styles.listDuration}>{formatDuration(track.duration_seconds)}</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textMuted} style={styles.moreIcon} />
      </View>
    </TouchableOpacity>
  );
};

// ── Equalizer bars ────────────────────────────────────────────────────────────
const EqualizerBars: React.FC<{ small?: boolean }> = ({ small }) => {
  const barWidth = small ? 2 : 3;
  const heights = [10, 16, 8, 14, 6];
  return (
    <View style={[styles.equalizer, small && styles.equalizerSmall]}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            height: h * (small ? 0.65 : 1),
            width: barWidth,
            marginHorizontal: 1,
            backgroundColor: Colors.accent,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Grid ──────────────────────────────────────────────────────────────────
  gridCard: {
    marginBottom: 16,
  },
  gridImageWrap: {
    borderRadius: 4,
    overflow: 'hidden',
    aspectRatio: 1,
    backgroundColor: Colors.surface2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  gridArtist: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Horizontal ────────────────────────────────────────────────────────────
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 4,
    padding: 10,
    marginRight: 12,
    width: 220,
  },
  horizontalImage: {
    width: 48,
    height: 48,
    borderRadius: 2,
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

  // ── List ──────────────────────────────────────────────────────────────────
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  indexWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  indexText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  listImageWrap: {
    position: 'relative',
    marginRight: 12,
  },
  listImage: {
    width: 48,
    height: 48,
    borderRadius: 2,
    backgroundColor: Colors.surface2,
  },
  listActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  explicitBadge: {
    backgroundColor: Colors.surface3,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 5,
  },
  explicitText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  listArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 6,
  },
  listDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  moreIcon: {
    marginLeft: 4,
  },

  // ── Shared ────────────────────────────────────────────────────────────────
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
});
