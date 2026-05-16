import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
import { useUserPlaylistStore } from '../store/userPlaylistStore';
import { shuffleArray } from '../utils/playerUtils';
import type { RootStackParamList } from '../navigation/types';
import { a11yButton } from '../utils/a11y';

type Props = StackScreenProps<RootStackParamList, 'UserPlaylist'>;

export const UserPlaylistDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { playlistId } = route.params;
  const { t } = useTranslation();
  const { colors, gradients, isDark } = useTheme();
  const playlists = useUserPlaylistStore((s) => s.playlists);
  const removeTrack = useUserPlaylistStore((s) => s.removeTrackFromPlaylist);

  const playlist = useMemo(
    () => playlists.find((p) => p.id === playlistId),
    [playlists, playlistId]
  );
  const { playQueue } = usePlayerStore();
  const tracks = playlist?.tracks ?? [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
        },
        backBtn: {
          width: 38,
          height: 38,
          borderRadius: 19,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        backBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        headerTitle: {
          flex: 1,
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginHorizontal: 8,
        },
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 12,
        },
        trackCount: { fontSize: 13, color: colors.textSecondary },
        actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        shuffleBtn: {
          width: 46,
          height: 46,
          borderRadius: 23,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        shuffleBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        playBtn: {
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        },
        empty: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 12,
        },
        emptyText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
      }),
    [colors]
  );

  const confirmRemove = (trackId: string, title: string) => {
    Alert.alert(
      t('library.removeFromPlaylistTitle'),
      t('library.removeFromPlaylistMessage', { title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('library.removeTrack'),
          style: 'destructive',
          onPress: () => void removeTrack(playlistId, trackId),
        },
      ]
    );
  };

  const headerBack = (
    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
      <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={styles.backBtnGlass} />
      <Ionicons name="chevron-back" size={22} color={colors.text} />
    </TouchableOpacity>
  );

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          {headerBack}
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('library.playlistMissing')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        {headerBack}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {playlist.name}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.actions}>
        <Text style={styles.trackCount}>{t('common.songs', { count: tracks.length })}</Text>
        {tracks.length > 0 ? (
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.shuffleBtn}
              onPress={() => playQueue(shuffleArray(tracks), 0)}
              {...a11yButton(t('common.shuffle'))}
            >
              <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <View style={styles.shuffleBtnGlass} />
              <Ionicons name="shuffle" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => playQueue(tracks, 0)}
              {...a11yButton(t('common.play'))}
            >
              <Ionicons name="play" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ height: 50 }} />
        )}
      </View>

      {tracks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="musical-note" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('library.userPlaylistEmpty')}</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(track, i) => `${track.id}-${i}`}
          renderItem={({ item, index }) => (
            <TrackCard
              track={item}
              queue={tracks}
              showIndex={index}
              trailing={
                <TouchableOpacity
                  onPress={() => confirmRemove(item.id, item.title)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  {...a11yButton(t('library.removeFromPlaylistA11y', { title: item.title }))}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        />
      )}
    </SafeAreaView>
  );
};
