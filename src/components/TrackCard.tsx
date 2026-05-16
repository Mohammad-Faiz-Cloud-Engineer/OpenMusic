import React, { type ReactNode, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme';
import type { Track } from '../api/jiosaavn';
import { formatDuration } from '../api/jiosaavn';
import { usePlayerStore } from '../store/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { a11yButton } from '../utils/a11y';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const placeholder = require('../../assets/placeholder.png');

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  variant?: 'grid' | 'list' | 'horizontal';
  showIndex?: number;
  onPress?: () => void;
  trailing?: ReactNode;
}

const EqualizerBars: React.FC<{ small?: boolean }> = ({ small }) => {
  const { colors } = useTheme();
  const w = small ? 2 : 3;
  const heights = [10, 16, 8, 14, 6];
  return (
    <View style={[stylesStatic.equalizer, small && stylesStatic.equalizerSmall]}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            height: h * (small ? 0.65 : 1),
            width: w,
            marginHorizontal: 1,
            backgroundColor: colors.accent,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
};

const stylesStatic = StyleSheet.create({
  equalizer: { flexDirection: 'row', alignItems: 'flex-end', height: 20 },
  equalizerSmall: { height: 14 },
});

export const TrackCard: React.FC<TrackCardProps> = ({
  track, queue, variant = 'list', showIndex, onPress, trailing,
}) => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { colors } = useTheme();
  const isActive = currentTrack?.id === track.id;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        gridCard: { marginBottom: 16 },
        gridImageWrap: {
          borderRadius: 16,
          overflow: 'hidden',
          aspectRatio: 1,
          backgroundColor: colors.surface2,
        },
        gridImage: { width: '100%', height: '100%' },
        gridActiveOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        gridTitle: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 8 },
        gridArtist: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
        horizontalCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glass,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          padding: 10,
          marginRight: 12,
          width: 220,
        },
        horizontalImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.surface2 },
        horizontalInfo: { flex: 1, marginLeft: 10 },
        horizontalTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
        horizontalArtist: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
        listWithTrailing: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 8,
          marginVertical: 2,
        },
        listCardFlex: { flex: 1, marginHorizontal: 0, marginVertical: 0 },
        trailingSlot: { paddingLeft: 4, paddingRight: 4, justifyContent: 'center' },
        listCard: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          marginHorizontal: 8,
          marginVertical: 2,
          borderRadius: 16,
        },
        listCardActive: {
          backgroundColor: colors.accentOverlay,
          borderWidth: 1,
          borderColor: 'rgba(29,185,84,0.2)',
        },
        indexWrap: { width: 28, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
        indexText: { fontSize: 14, color: colors.textSecondary, fontWeight: '400' },
        listImageWrap: { position: 'relative', marginRight: 12 },
        listImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.surface2 },
        listActiveOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        listInfo: { flex: 1 },
        listTitle: { fontSize: 14, fontWeight: '400', color: colors.text },
        listMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
        explicitBadge: {
          backgroundColor: colors.surface3,
          borderRadius: 4,
          paddingHorizontal: 4,
          paddingVertical: 1,
          marginRight: 5,
        },
        explicitText: { fontSize: 9, fontWeight: '700', color: colors.textMuted },
        listArtist: { fontSize: 12, color: colors.textSecondary, flex: 1 },
        listRight: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
        listDuration: { fontSize: 12, color: colors.textMuted },
        activeText: { color: colors.accent },
      }),
    [colors]
  );

  const handlePress = () => {
    if (onPress) onPress();
    else playTrack(track, queue);
  };

  const imageSource = track.thumbnail ? { uri: track.thumbnail } : placeholder;

  if (variant === 'grid') {
    return (
      <TouchableOpacity
        style={[styles.gridCard, { width: GRID_CARD_WIDTH }]}
        onPress={handlePress}
        activeOpacity={0.75}
        {...a11yButton(`${track.title} by ${track.artist}`)}
      >
        <View style={styles.gridImageWrap}>
          <Image source={imageSource} style={styles.gridImage} />
          {isActive && (
            <View style={styles.gridActiveOverlay}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
            </View>
          )}
        </View>
        <Text style={[styles.gridTitle, isActive && styles.activeText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.gridArtist} numberOfLines={1}>{track.artist}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.75}
        {...a11yButton(`${track.title} by ${track.artist}`)}
      >
        <Image source={imageSource} style={styles.horizontalImage} />
        <View style={styles.horizontalInfo}>
          <Text style={[styles.horizontalTitle, isActive && styles.activeText]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.horizontalArtist} numberOfLines={1}>{track.artist}</Text>
        </View>
        {isActive && isPlaying && <EqualizerBars />}
      </TouchableOpacity>
    );
  }

  const listCard = (
    <TouchableOpacity
      style={[
        styles.listCard,
        isActive && styles.listCardActive,
        trailing ? styles.listCardFlex : null,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      {...a11yButton(`${track.title} by ${track.artist}`)}
    >
      {showIndex !== undefined && (
        <View style={styles.indexWrap}>
          {isActive && isPlaying
            ? <EqualizerBars small />
            : <Text style={[styles.indexText, isActive && styles.activeText]}>{showIndex + 1}</Text>
          }
        </View>
      )}

      <View style={styles.listImageWrap}>
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
          <Text style={styles.listArtist} numberOfLines={1}>{track.artist}</Text>
        </View>
      </View>

      <View style={styles.listRight}>
        <Text style={styles.listDuration}>{formatDuration(track.duration_seconds)}</Text>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
      </View>
    </TouchableOpacity>
  );

  if (trailing !== undefined) {
    return (
      <View style={styles.listWithTrailing}>
        {listCard}
        <View style={styles.trailingSlot}>{trailing}</View>
      </View>
    );
  }

  return listCard;
};
