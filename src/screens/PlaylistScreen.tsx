import React, { useMemo } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getPlaylist } from '../api/jiosaavn';
import { useTheme } from '../theme';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
import { shuffleArray } from '../utils/playerUtils';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

type PlaylistScreenProps = StackScreenProps<RootStackParamList, 'Playlist'>;

const placeholder = require('../../assets/placeholder.png');

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { id } = route.params;
  const playQueue = usePlayerStore((s) => s.playQueue);
  const { colors, isDark } = useTheme();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => getPlaylist(id),
    staleTime: 10 * 60 * 1000,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        centered: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
        errorText: { fontSize: 15, color: colors.textSecondary },
        glassBtn: {
          overflow: 'hidden', borderRadius: 24, borderWidth: 1,
          borderColor: colors.glassBorder, paddingHorizontal: 28, paddingVertical: 12,
        },
        glassBtnFill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        glassBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
        hero: { minHeight: 400, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
        heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, opacity: 0.65 },
        backBtn: {
          position: 'absolute', top: 52, left: 16,
          width: 38, height: 38, borderRadius: 19, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center', zIndex: 10,
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        backBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        artworkWrap: {
          alignItems: 'center', marginTop: 88, marginBottom: 20,
          shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.65, shadowRadius: 28, elevation: 20,
        },
        artwork: {
          width: 180, height: 180, borderRadius: 20,
          backgroundColor: colors.surface2,
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        heroInfo: { paddingHorizontal: 20, marginBottom: 20 },
        playlistTitle: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginBottom: 6 },
        playlistOwner: { fontSize: 13, color: colors.textSecondary, marginBottom: 3 },
        playlistMeta: { fontSize: 12, color: colors.textMuted },
        heroActions: {
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, gap: 14, justifyContent: 'flex-end',
        },
        shuffleBtn: {
          width: 50, height: 50, borderRadius: 25, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        shuffleBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        playBtn: {
          width: 58, height: 58, borderRadius: 29,
          backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
          shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
        },
        tracksHeader: { paddingHorizontal: 16, paddingVertical: 10 },
        tracksHeaderText: {
          fontSize: 11, fontWeight: '700', color: colors.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.2,
        },
      }),
    [colors]
  );

  const heroFade = isDark
    ? (['rgba(0,0,0,0.15)', colors.bg] as const)
    : (['rgba(255,255,255,0.4)', colors.bg] as const);

  const totalDuration = data?.tracks?.reduce((sum, tr) => sum + tr.duration_seconds, 0) ?? 0;
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0
    ? t('playlist.durationHoursMinutes', { hours, minutes })
    : t('playlist.durationMinutes', { minutes });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={colors.textMuted} />
        <Text style={styles.errorText}>{t('playlist.error')}</Text>
        <TouchableOpacity style={styles.glassBtn} onPress={() => refetch()}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
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
        keyExtractor={(track, i) => `${track.id}-${i}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Image source={imageSource} style={styles.heroBg} blurRadius={50} />
              <LinearGradient colors={heroFade} style={StyleSheet.absoluteFill} />

              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.backBtnGlass} />
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.artworkWrap}>
                <Image source={imageSource} style={styles.artwork} />
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.playlistTitle} numberOfLines={2}>{data.title}</Text>
                <Text style={styles.playlistOwner}>{t('playlist.by', { owner: data.owner })}</Text>
                <Text style={styles.playlistMeta}>{t('playlist.meta', { count: data.song_count, duration: durationStr })}</Text>
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={() => playQueue(shuffleArray(data.tracks), 0)}
                >
                  <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                  <View style={styles.shuffleBtnGlass} />
                  <Ionicons name="shuffle" size={20} color={colors.text} />
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
