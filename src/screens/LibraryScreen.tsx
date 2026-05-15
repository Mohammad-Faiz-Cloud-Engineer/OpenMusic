import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { usePlayerStore } from '../store/playerStore';
import { useRecentStore } from '../store/recentStore';
import { formatDuration, Track } from '../api/jiosaavn';
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
  const {
    queue,
    currentIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();
  const recentTracks = useRecentStore((s) => s.tracks);

  const placeholder = require('../../assets/placeholder.png');

  const renderQueueItem = ({ item, index }: { item: Track; index: number }) => {
    const isActive = index === currentIndex;
    return (
      <TouchableOpacity
        style={[styles.queueItem, isActive && styles.queueItemActive]}
        onPress={() => playTrack(item, queue)}
        activeOpacity={0.75}
        {...a11yButton(`${item.title} by ${item.artist}`)}
      >
        <View style={styles.queueLeft}>
          <View style={styles.queueImageContainer}>
            <Image
              source={item.thumbnail ? { uri: item.thumbnail } : placeholder}
              style={styles.queueImage}
              accessibilityLabel={item.title}
            />
            {isActive && (
              <View style={styles.queueActiveOverlay}>
                <Ionicons name="musical-note" size={14} color={Colors.accent} />
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
          <Text style={styles.queueDuration}>
            {formatDuration(item.duration_seconds)}
          </Text>
          <TouchableOpacity
            onPress={() => removeFromQueue(index)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.removeBtn}
            {...a11yButton(t('library.clear'), 'Remove from queue')}
          >
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['rgba(168,85,247,0.15)', 'transparent']}
        style={styles.headerGradient}
      >
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
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'queue' ? t('library.queue') : t('library.recent')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

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
                  <Image
                    source={
                      currentTrack.thumbnail
                        ? { uri: currentTrack.thumbnail }
                        : placeholder
                    }
                    style={styles.nowPlayingImage}
                    blurRadius={20}
                  />
                  <LinearGradient
                    colors={['rgba(168,85,247,0.4)', 'rgba(0,0,0,0.7)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.nowPlayingContent}>
                    <View style={styles.nowPlayingLeft}>
                      <Image
                        source={
                          currentTrack.thumbnail
                            ? { uri: currentTrack.thumbnail }
                            : placeholder
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
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.text} />
                  </View>
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
                contentContainerStyle={{ paddingBottom: 160 }}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  style={styles.emptyIconGradient}
                >
                  <Ionicons name="list" size={32} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>{t('library.queueEmpty')}</Text>
              <Text style={styles.emptySubtitle}>{t('library.queueEmptyHint')}</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => navigation.navigate('Search')}
                {...a11yButton(t('library.findMusic'))}
              >
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  style={styles.emptyActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.emptyActionText}>{t('library.findMusic')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {activeTab === 'recent' && (
        recentTracks.length > 0 ? (
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
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="time" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>{t('library.recentEmpty')}</Text>
            <Text style={styles.emptySubtitle}>{t('library.recentEmptyHint')}</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerGradient: {
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  nowPlayingCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  nowPlayingImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  nowPlayingContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  nowPlayingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nowPlayingArt: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
  },
  nowPlayingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nowPlayingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accentLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  nowPlayingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  nowPlayingArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  queueHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clearBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  queueItemActive: {
    backgroundColor: Colors.accentOverlay,
  },
  queueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  queueImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  queueImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  queueActiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(168,85,247,0.4)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueInfo: {
    flex: 1,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    gap: 8,
  },
  queueDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeText: {
    color: Colors.accent,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconContainer: {
    marginBottom: 8,
  },
  emptyIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
