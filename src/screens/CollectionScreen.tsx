import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useLikeStore } from '../store/likeStore';
import { useUserPlaylistStore } from '../store/userPlaylistStore';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { a11yButton } from '../utils/a11y';

type CollectionScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Collection'>,
  StackScreenProps<RootStackParamList>
>;

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors, gradients, isDark } = useTheme();
  const likedTracks = useLikeStore((s) => s.tracksByIdOrder);
  const userPlaylists = useUserPlaylistStore((s) => s.playlists);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
        headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
        likedRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 20,
          borderRadius: 20,
          overflow: 'hidden',
          padding: 14,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        likedRowGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        likedIconWrap: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.accentOverlay,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(29,185,84,0.25)',
        },
        likedTextCol: { flex: 1 },
        likedTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
        likedSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        playlistHeadRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginBottom: 10,
        },
        sectionLabel: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        seeAllText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.accent,
        },
        emptyPlaylistsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        emptyPlaylistsGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        emptyPlaylistsText: { fontSize: 14, fontWeight: '600', color: colors.text },
        playlistCarousel: {
          paddingHorizontal: 16,
          paddingBottom: 4,
          paddingRight: 8,
          alignItems: 'stretch',
        },
        playlistChip: {
          width: 132,
          minHeight: 102,
          borderRadius: 18,
          marginRight: 10,
          padding: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          justifyContent: 'space-between',
        },
        playlistChipGlass: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(18,18,28,0.55)' : 'rgba(255,255,255,0.65)',
        },
        playlistChipTitle: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
          marginTop: 8,
          lineHeight: 17,
          minHeight: 34,
        },
        playlistChipMeta: {
          fontSize: 11,
          color: colors.textMuted,
          marginTop: 6,
        },
        playlistChipAdd: {
          width: 72,
          minHeight: 102,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
        },
      }),
    [colors, isDark]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t('collection.title')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.likedRow}
          onPress={() =>
            navigation.navigate('TrackList', {
              title: t('library.likedSongs'),
              tracks: likedTracks,
            })
          }
          activeOpacity={0.85}
          {...a11yButton(t('library.likedSongs'))}
        >
          <BlurView intensity={48} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.likedRowGlass} />
          <View style={styles.likedIconWrap}>
            <Ionicons name="heart" size={22} color={colors.accent} />
          </View>
          <View style={styles.likedTextCol}>
            <Text style={styles.likedTitle}>{t('library.likedSongs')}</Text>
            <Text style={styles.likedSub}>
              {t('library.likedSubtitle', { count: likedTracks.length })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.playlistHeadRow}>
          <Text style={styles.sectionLabel}>{t('library.yourPlaylists')}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyPlaylists')}
            {...a11yButton(t('common.seeAll'))}
          >
            <Text style={styles.seeAllText}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {userPlaylists.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyPlaylistsRow}
            onPress={() => navigation.navigate('MyPlaylists')}
            activeOpacity={0.8}
          >
            <BlurView intensity={32} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.emptyPlaylistsGlass} />
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
            <Text style={styles.emptyPlaylistsText}>{t('library.createPlaylist')}</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.playlistCarousel}
          >
            {userPlaylists.map((pl) => (
              <TouchableOpacity
                key={pl.id}
                style={styles.playlistChip}
                onPress={() => navigation.navigate('UserPlaylist', { playlistId: pl.id })}
                activeOpacity={0.82}
                {...a11yButton(pl.name)}
              >
                <BlurView intensity={36} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.playlistChipGlass} />
                <Ionicons name="musical-notes" size={18} color={colors.text} />
                <Text style={styles.playlistChipTitle} numberOfLines={2}>
                  {pl.name}
                </Text>
                <Text style={styles.playlistChipMeta}>
                  {t('common.songs', { count: pl.tracks.length })}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.playlistChipAdd}
              onPress={() => navigation.navigate('MyPlaylists')}
              {...a11yButton(t('library.createPlaylist'))}
            >
              <Ionicons name="add" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
