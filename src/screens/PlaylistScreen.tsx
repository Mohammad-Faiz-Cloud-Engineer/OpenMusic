import React from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getPlaylist, formatDuration } from '../api/jiosaavn';
import { Colors } from '../theme/colors';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { pickShuffleIndex } from '../utils/playerUtils';

type PlaylistScreenProps = StackScreenProps<RootStackParamList, 'Playlist'>;

// Resolved once at module load — avoids repeated require() calls inside render
const placeholder = require('../../assets/placeholder.png');

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { id } = route.params;
  const { playQueue } = usePlayerStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => getPlaylist(id),
    staleTime: 10 * 60 * 1000,
  });

  const totalDuration = data?.tracks?.reduce((sum, t) => sum + t.duration_seconds, 0) ?? 0;
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={Colors.textMuted} />
        <Text style={styles.errorText}>{t('playlist.error')}</Text>
        <TouchableOpacity style={styles.glassBtn} onPress={() => refetch()}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.glassBtnFill} />
          <Text style={styles.glassBtnText}>{t('common.retry')}</Text>
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
              <Image source={imageSource} style={styles.heroBg} blurRadius={50} />
              <LinearGradient colors={['rgba(0,0,0,0.15)', Colors.bg]} style={StyleSheet.absoluteFill} />

              {/* Back button — glass */}
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.backBtnGlass} />
                <Ionicons name="chevron-back" size={22} color={Colors.text} />
              </TouchableOpacity>

              {/* Artwork */}
              <View style={styles.artworkWrap}>
                <Image source={imageSource} style={styles.artwork} />
                {/* Glass sheen */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              {/* Info */}
              <View style={styles.heroInfo}>
                <Text style={styles.playlistTitle} numberOfLines={2}>{data.title}</Text>
                <Text style={styles.playlistOwner}>{t('playlist.by', { owner: data.owner })}</Text>
                <Text style={styles.playlistMeta}>{data.song_count} songs · {durationStr}</Text>
              </View>

              {/* Actions */}
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={() => {
                    const shuffled = [...data.tracks];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    playQueue(shuffled, 0);
                  }}
                >
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.shuffleBtnGlass} />
                  <Ionicons name="shuffle" size={20} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={() => playQueue(data.tracks, 0)}>
                  <Ionicons name="play" size={22} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tracksHeader}>
              <Text style={styles.tracksHeaderText}>{t('common.tracks', { count: data.tracks.length })}</Text>
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
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 15, color: Colors.textSecondary },
  glassBtn: {
    overflow: 'hidden', borderRadius: 24, borderWidth: 1,
    borderColor: Colors.glassBorder, paddingHorizontal: 28, paddingVertical: 12,
  },
  glassBtnFill: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  glassBtnText: { color: Colors.text, fontWeight: '700', fontSize: 13 },

  hero: { minHeight: 400, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, opacity: 0.65 },

  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 38, height: 38, borderRadius: 19, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  backBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },

  artworkWrap: {
    alignItems: 'center', marginTop: 88, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.65, shadowRadius: 28, elevation: 20,
  },
  artwork: {
    width: 180, height: 180, borderRadius: 20,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },

  heroInfo: { paddingHorizontal: 20, marginBottom: 20 },
  playlistTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, letterSpacing: -0.3, marginBottom: 6 },
  playlistOwner: { fontSize: 13, color: Colors.textSecondary, marginBottom: 3 },
  playlistMeta: { fontSize: 12, color: Colors.textMuted },

  heroActions: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 14, justifyContent: 'flex-end',
  },
  shuffleBtn: {
    width: 50, height: 50, borderRadius: 25, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  shuffleBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  playBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },

  tracksHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  tracksHeaderText: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
});
