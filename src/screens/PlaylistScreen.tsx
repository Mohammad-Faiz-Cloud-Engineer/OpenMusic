import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getPlaylist, formatDuration } from '../api/jiosaavn';
import { Colors } from '../theme/colors';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

type PlaylistScreenProps = StackScreenProps<RootStackParamList, 'Playlist'>;

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { id } = route.params;
  const { playQueue } = usePlayerStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => getPlaylist(id),
    staleTime: 10 * 60 * 1000,
  });

  const placeholder = require('../../assets/placeholder.png');

  const totalDuration = data?.tracks?.reduce((sum, t) => sum + t.duration_seconds, 0) ?? 0;
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={Colors.textMuted} />
        <Text style={styles.errorText}>{t('playlist.error')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageSource = data.thumbnail ? { uri: data.thumbnail } : placeholder;

  return (
    <View style={styles.container}>
      <FlatList
        data={data.tracks}
        keyExtractor={(t, i) => `${t.id}-${i}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        ListHeaderComponent={
          <View>
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <View style={styles.hero}>
              <Image source={imageSource} style={styles.heroBg} blurRadius={40} />
              <LinearGradient
                colors={['rgba(0,0,0,0.2)', Colors.bg]}
                style={StyleSheet.absoluteFill}
              />

              {/* Back */}
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={22} color={Colors.text} />
              </TouchableOpacity>

              {/* Artwork */}
              <View style={styles.artworkWrap}>
                <Image source={imageSource} style={styles.artwork} />
              </View>

              {/* Info */}
              <View style={styles.heroInfo}>
                <Text style={styles.playlistTitle} numberOfLines={2}>
                  {data.title}
                </Text>
                <Text style={styles.playlistOwner}>{t('playlist.by', { owner: data.owner })}</Text>
                <Text style={styles.playlistMeta}>
                  {data.song_count} songs · {durationStr}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={() => {
                    const shuffled = [...data.tracks].sort(() => Math.random() - 0.5);
                    playQueue(shuffled, 0);
                  }}
                >
                  <Ionicons name="shuffle" size={20} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => playQueue(data.tracks, 0)}
                >
                  <Ionicons name="play" size={22} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Track count */}
            <View style={styles.tracksHeader}>
              <Text style={styles.tracksHeaderText}>
                {t('common.tracks', { count: data.tracks.length })}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <TrackCard track={item} queue={data.tracks} showIndex={index} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    minHeight: 380,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    opacity: 0.6,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  artworkWrap: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  artwork: {
    width: 180,
    height: 180,
    borderRadius: 4,
    backgroundColor: Colors.surface2,
  },
  heroInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  playlistTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  playlistOwner: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  playlistMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    justifyContent: 'flex-end',
  },
  shuffleBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // ── Tracks header ─────────────────────────────────────────────────────────
  tracksHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tracksHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
