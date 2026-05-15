import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { useRecentStore } from '../store/recentStore';
import { formatDuration } from '../api/jiosaavn';
import type { Track } from '../api/jiosaavn';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { a11yButton } from '../utils/a11y';
import { TrackCard } from '../components/TrackCard';

type LibraryTab = 'queue' | 'recent';

type LibraryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Library'>,
  StackScreenProps<RootStackParamList>
>;

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LibraryTab>('queue');
  const { queue, currentIndex, currentTrack, playTrack, removeFromQueue, clearQueue } =
    usePlayerStore();
  const recentTracks = useRecentStore((s) => s.tracks);
  const placeholder = require('../../assets/placeholder.png');

  const renderQueueItem = ({ item, index }: { item: Track; index: number }) => {
    const isActive = index === currentIndex;
    return (
      <TouchableOpacity
        style={styles.queueItem}
        onPress={() => playTrack(item, queue)}
        activeOpacity={0.7}
        {...a11yButton(`${item.title} by ${item.artist}`)}
      >
        <View style={styles.queueLeft}>
          <View style={styles.queueImageWrap}>
            <Image
              source={item.thumbnail ? { uri: item.thumbnail } : placeholder}
              style={styles.queueImage}
            />
            {isActive && (
              <View style={styles.queueActiveOverlay}>
                <Ionicons name="musical-note" size={12} color={Colors.accent} />
              </View>
            )}
          </View>
          <View style={styles.queueInfo}>
            <Text
              style={[styles.queueTitle, isActive && styles.activeText]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.queueArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>
        </View>
        <View style={styles.queueRight}>
          <Text style={styles.queueDuration}>{formatDuration(item.duration_seconds)}</Text>
          <TouchableOpacity
            onPress={() => removeFromQueue(index)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            {...a11yButton(`${t('library.removeTrack')} ${item.title}`)}
          >
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('library.title')}
        </Text>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <View style={styles.tabs}>
        {(['queue', 'recent'] as LibraryTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            {...a11yButton(tab === 'queue' ? t('library.queue') : t('library.recent'))}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'queue' ? t('library.queue') : t('library.recent')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Queue tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <>
          {queue.length > 0 ? (
            <>
              {/* Now playing card */}
              {currentTrack && (
                <TouchableOpacity
                  style={styles.nowPlayingCard}
                  onPress={() => navigation.navigate('Player')}
                  activeOpacity={0.8}
                  {...a11yButton(`${t('library.nowPlaying')}: ${currentTrack.title}`)}
                >
                  <Image
                    source={
                      currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder
                    }
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
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Queue header */}
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
                contentContainerStyle={{ paddingBottom: 160 }}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>{t('library.queueEmpty')}</Text>
              <Text style={styles.emptySubtitle}>{t('library.queueEmptyHint')}</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => navigation.navigate('Search')}
                {...a11yButton(t('library.findMusic'))}
              >
                <Text style={styles.emptyActionText}>{t('library.findMusic')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ── Recent tab ─────────────────────────────────────────────────────── */}
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
            <Ionicons name="time-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('library.recentEmpty')}</Text>
            <Text style={styles.emptySubtitle}>{t('library.recentEmptyHint')}</Text>
          </View>
        ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#000',
  },

  // ── Now Playing ───────────────────────────────────────────────────────────
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  nowPlayingArt: {
    width: 52,
    height: 52,
    borderRadius: 4,
    backgroundColor: Colors.surface3,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  nowPlayingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  nowPlayingArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Queue ─────────────────────────────────────────────────────────────────
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  queueHeaderTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  queueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  queueImageWrap: {
    position: 'relative',
    marginRight: 12,
  },
  queueImage: {
    width: 48,
    height: 48,
    borderRadius: 2,
    backgroundColor: Colors.surface2,
  },
  queueActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueInfo: { flex: 1 },
  queueTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text,
  },
  queueArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  queueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  queueDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  activeText: {
    color: Colors.accent,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.text,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
