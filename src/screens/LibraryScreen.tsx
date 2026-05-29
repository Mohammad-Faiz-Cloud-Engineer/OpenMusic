import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { usePlayerStore } from '../store/playerStore';
import { useShallow } from 'zustand/react/shallow';
import { useRecentStore } from '../store/recentStore';
import { formatDuration } from '../api/jiosaavn';
import type { Track } from '../api/jiosaavn';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { a11yButton } from '../utils/a11y';
import { TrackCard } from '../components/TrackCard';

const placeholder = require('../../assets/placeholder.png');

type LibraryTab = 'queue' | 'recent';

type LibraryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  StackScreenProps<RootStackParamList>
>;

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors, gradients, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<LibraryTab>('queue');
  const { queue, currentIndex, currentTrack, playTrack, removeFromQueue, clearQueue } =
    usePlayerStore(
      useShallow((s) => ({
        queue: s.queue,
        currentIndex: s.currentIndex,
        currentTrack: s.currentTrack,
        playTrack: s.playTrack,
        removeFromQueue: s.removeFromQueue,
        clearQueue: s.clearQueue,
      }))
    );
  const recentTracks = useRecentStore((s) => s.tracks);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
        headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
        tabs: {
          flexDirection: 'row',
          paddingHorizontal: 16,
          gap: 8,
          marginBottom: 12,
          marginTop: 8,
        },
        tab: {
          paddingHorizontal: 20,
          paddingVertical: 9,
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        tabActive: {
          backgroundColor: colors.text,
          borderColor: colors.text,
        },
        tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
        tabTextActive: { color: colors.bg },
        nowPlayingCard: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: 16,
          marginBottom: 8,
          borderRadius: 20,
          overflow: 'hidden',
          padding: 14,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        nowPlayingGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        nowPlayingArt: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.surface3 },
        nowPlayingInfo: { flex: 1 },
        nowPlayingLabel: {
          fontSize: 10, fontWeight: '700', color: colors.accent,
          letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2,
        },
        nowPlayingTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
        nowPlayingArtist: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        queueHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        queueHeaderTitle: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
        clearBtn: {
          fontSize: 12, fontWeight: '700', color: colors.textSecondary,
          textTransform: 'uppercase', letterSpacing: 0.8,
        },
        queueItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 16,
          gap: 12,
        },
        queueItemActive: {
          backgroundColor: colors.accentOverlay,
          borderWidth: 1,
          borderColor: 'rgba(29,185,84,0.2)',
        },
        queueImageWrap: { position: 'relative' },
        queueImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.surface2 },
        queueActiveOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        queueInfo: { flex: 1 },
        queueTitle: { fontSize: 14, fontWeight: '400', color: colors.text },
        queueArtist: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        queueDuration: { fontSize: 12, color: colors.textMuted },
        removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
        activeText: { color: colors.accent },
        emptyState: {
          flex: 1, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 32, gap: 10,
        },
        emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: 8 },
        emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
        emptyAction: {
          marginTop: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: 28,
          paddingVertical: 12,
          borderRadius: 24,
        },
        emptyActionGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        emptyActionText: { fontSize: 14, fontWeight: '700', color: colors.text },
      }),
    [colors]
  );

  const renderQueueItem = useCallback(({ item, index }: { item: Track; index: number }) => {
    const isActive = index === currentIndex;
    return (
      <TouchableOpacity
        style={[styles.queueItem, isActive && styles.queueItemActive]}
        onPress={() => playTrack(item, queue)}
        activeOpacity={0.75}
        {...a11yButton(`${item.title} by ${item.artist}`)}
      >
        <View style={styles.queueImageWrap}>
          <Image
            source={item.thumbnail ? { uri: item.thumbnail } : placeholder}
            style={styles.queueImage}
          />
          {isActive && (
            <View style={styles.queueActiveOverlay}>
              <Ionicons name="musical-note" size={12} color={colors.accent} />
            </View>
          )}
        </View>
        <View style={styles.queueInfo}>
          <Text style={[styles.queueTitle, isActive && styles.activeText]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.queueArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <Text style={styles.queueDuration}>{formatDuration(item.duration_seconds)}</Text>
        <TouchableOpacity
          onPress={() => removeFromQueue(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.removeBtn}
          {...a11yButton(`${t('library.removeTrack')} ${item.title}`)}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [currentIndex, playTrack, queue, removeFromQueue, t, styles, colors.accent, colors.textMuted]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('library.title')}
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['queue', 'recent'] as LibraryTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            {...a11yButton(tab === 'queue' ? t('library.queue') : t('library.recent'))}
          >
            {activeTab !== tab && (
              <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            )}
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'queue' ? t('library.queue') : t('library.recent')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'queue' && (
        <>
          {queue.length > 0 ? (
            <>
              {currentTrack && (
                <TouchableOpacity
                  style={styles.nowPlayingCard}
                  onPress={() => navigation.navigate('Player')}
                  activeOpacity={0.85}
                  {...a11yButton(`${t('library.nowPlaying')}: ${currentTrack.title}`)}
                >
                  <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                  <View style={styles.nowPlayingGlass} />
                  <Image
                    source={currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder}
                    style={styles.nowPlayingArt}
                  />
                  <View style={styles.nowPlayingInfo}>
                    <Text style={styles.nowPlayingLabel}>{t('library.nowPlaying')}</Text>
                    <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                      {currentTrack.title}
                    </Text>
                    <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                      {currentTrack.artist}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              <View style={styles.queueHeader}>
                <Text style={styles.queueHeaderTitle}>
                  {t('library.nextUp', { count: queue.length })}
                </Text>
                <TouchableOpacity onPress={clearQueue} {...a11yButton(t('library.clear'))}>
                  <Text style={styles.clearBtn}>{t('library.clear')}</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={queue}
                keyExtractor={(track, i) => `${track.id}-${i}`}
                renderItem={renderQueueItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 8 }}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={52} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t('library.queueEmpty')}</Text>
              <Text style={styles.emptySubtitle}>{t('library.queueEmptyHint')}</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => navigation.navigate('Search')}
                {...a11yButton(t('library.findMusic'))}
              >
                <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.emptyActionGlass} />
                <Text style={styles.emptyActionText}>{t('library.findMusic')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {activeTab === 'recent' &&
        (recentTracks.length > 0 ? (
          <FlatList
            data={recentTracks}
            keyExtractor={(track) => track.id}
            renderItem={({ item, index }) => (
              <TrackCard track={item} queue={recentTracks} showIndex={index} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 160 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={52} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('library.recentEmpty')}</Text>
            <Text style={styles.emptySubtitle}>{t('library.recentEmptyHint')}</Text>
          </View>
        ))}
    </SafeAreaView>
  );
};
