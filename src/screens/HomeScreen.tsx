import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getCharts, searchSongs } from '../api/jiosaavn';
import { Colors } from '../theme/colors';
import { SectionHeader } from '../components/SectionHeader';
import { TrackCard } from '../components/TrackCard';
import { ChartCard } from '../components/ChartCard';
import { SkeletonCard } from '../components/LoadingScreen';
import { usePlayerStore } from '../store/playerStore';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { a11yButton } from '../utils/a11y';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { playQueue } = usePlayerStore();

  const {
    data: chartsData,
    isLoading: chartsLoading,
    isFetching: chartsFetching,
    refetch: refetchCharts,
  } = useQuery({
    queryKey: ['charts'],
    queryFn: getCharts,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: trendingData,
    isLoading: trendingLoading,
    isFetching: trendingFetching,
    refetch: refetchTrending,
  } = useQuery({
    queryKey: ['trending'],
    queryFn: () => searchSongs('trending bollywood 2025'),
    staleTime: 10 * 60 * 1000,
  });

  const { data: romanticData, isLoading: romanticLoading } = useQuery({
    queryKey: ['romantic'],
    queryFn: () => searchSongs('best romantic hindi songs'),
    staleTime: 15 * 60 * 1000,
  });

  const { data: punjabData, isLoading: punjabLoading } = useQuery({
    queryKey: ['punjabi'],
    queryFn: () => searchSongs('punjabi hits 2025'),
    staleTime: 15 * 60 * 1000,
  });

  const isRefreshing = chartsFetching || trendingFetching;

  const onRefresh = useCallback(() => {
    refetchCharts();
    refetchTrending();
  }, [refetchCharts, refetchTrending]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home.greetingMorning');
    if (h < 17) return t('home.greetingAfternoon');
    if (h < 21) return t('home.greetingEvening');
    return t('home.greetingNight');
  };

  // ── Featured hero banner ──────────────────────────────────────────────────
  const renderFeaturedBanner = () => {
    const tracks = trendingData?.results?.slice(0, 5) ?? [];
    if (!tracks.length) return null;
    const featured = tracks[0];
    return (
      <TouchableOpacity
        style={styles.featuredBanner}
        onPress={() => playQueue(tracks, 0)}
        activeOpacity={0.85}
      >
        <Image
          source={
            featured.thumbnail
              ? { uri: featured.thumbnail }
              : require('../../assets/placeholder.png')
          }
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.92)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.featuredContent}>
          <Text style={styles.featuredLabel}>🔥 {t('home.trendingBadge')}</Text>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {featured.title}
          </Text>
          <Text style={styles.featuredArtist}>{featured.artist}</Text>
          <View style={styles.featuredActions}>
            <TouchableOpacity
              style={styles.featuredPlayBtn}
              onPress={() => playQueue(tracks, 0)}
            >
              <Ionicons name="play" size={16} color="#000" />
              <Text style={styles.featuredPlayText}>{t('home.playNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featuredShuffleBtn}
              onPress={() => {
                const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                playQueue(shuffled, 0);
              }}
            >
              <Ionicons name="shuffle" size={16} color={Colors.text} />
              <Text style={styles.featuredShuffleText}>{t('common.shuffle')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Quick picks grid (Spotify-style 2-col pill rows) ─────────────────────
  const renderQuickPicks = () => {
    const tracks = trendingData?.results?.slice(0, 6) ?? [];
    if (!tracks.length) return null;
    return (
      <View style={styles.quickPicksGrid}>
        {tracks.map((track, i) => (
          <TouchableOpacity
            key={track.id}
            style={styles.quickPickItem}
            onPress={() => playQueue(tracks, i)}
            activeOpacity={0.7}
          >
            <Image
              source={
                track.thumbnail
                  ? { uri: track.thumbnail }
                  : require('../../assets/placeholder.png')
              }
              style={styles.quickPickImage}
            />
            <Text style={styles.quickPickTitle} numberOfLines={1}>
              {track.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{t('home.headline')}</Text>
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => navigation.navigate('Search')}
            {...a11yButton(t('tabs.search'))}
          >
            <Ionicons name="search" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Featured Banner ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          {trendingLoading ? (
            <View style={{ paddingHorizontal: 16 }}>
              <SkeletonCard height={200} borderRadius={8} />
            </View>
          ) : (
            renderFeaturedBanner()
          )}
        </View>

        {/* ── Quick Picks ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title={t('home.quickPicks')} subtitle={t('home.quickPicksSub')} />
          {trendingLoading ? (
            <View style={styles.quickPicksGrid}>
              {[...Array(6)].map((_, i) => (
                <SkeletonCard
                  key={i}
                  width={(SCREEN_WIDTH - 48) / 2}
                  height={52}
                  borderRadius={4}
                />
              ))}
            </View>
          ) : (
            renderQuickPicks()
          )}
        </View>

        {/* ── Charts ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.topCharts')}
            onSeeAll={() => navigation.navigate('Charts')}
          />
          {chartsLoading ? (
            <FlatList
              horizontal
              data={[1, 2, 3, 4]}
              keyExtractor={(i) => String(i)}
              renderItem={() => (
                <View style={{ marginRight: 12 }}>
                  <SkeletonCard width={160} height={160} borderRadius={4} />
                  <View style={{ marginTop: 8 }}>
                    <SkeletonCard width={120} height={12} borderRadius={4} />
                  </View>
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <FlatList
              horizontal
              data={chartsData?.charts ?? []}
              keyExtractor={(c) => c.id}
              renderItem={({ item, index }) => (
                <ChartCard
                  chart={item}
                  index={index}
                  onPress={() =>
                    navigation.navigate('Playlist', { id: item.id, title: item.title })
                  }
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* ── Trending Tracks ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.trendingNow')}
            onSeeAll={() =>
              navigation.navigate('TrackList', {
                title: t('home.trendingNow'),
                tracks: trendingData?.results ?? [],
              })
            }
          />
          {trendingLoading
            ? [...Array(5)].map((_, i) => (
                <View key={i} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                  <SkeletonCard height={56} borderRadius={4} />
                </View>
              ))
            : (trendingData?.results ?? []).slice(0, 8).map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={trendingData?.results}
                  showIndex={i}
                />
              ))}
        </View>

        {/* ── Romantic ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.loveSongs')}
            subtitle={t('home.loveSongsSub')}
            onSeeAll={() =>
              navigation.navigate('TrackList', {
                title: t('home.loveSongs'),
                tracks: romanticData?.results ?? [],
              })
            }
          />
          {romanticLoading ? (
            <FlatList
              horizontal
              data={[1, 2, 3, 4]}
              keyExtractor={(i) => String(i)}
              renderItem={() => (
                <View style={{ marginRight: 12 }}>
                  <SkeletonCard width={140} height={140} borderRadius={4} />
                </View>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <FlatList
              horizontal
              data={romanticData?.results?.slice(0, 10) ?? []}
              keyExtractor={(t) => t.id}
              renderItem={({ item }) => (
                <TrackCard track={item} queue={romanticData?.results} variant="grid" />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          )}
        </View>

        {/* ── Punjabi ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title={t('home.punjabiHits')}
            onSeeAll={() =>
              navigation.navigate('TrackList', {
                title: t('home.punjabiHits'),
                tracks: punjabData?.results ?? [],
              })
            }
          />
          {punjabLoading
            ? [...Array(4)].map((_, i) => (
                <View key={i} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                  <SkeletonCard height={56} borderRadius={4} />
                </View>
              ))
            : (punjabData?.results ?? []).slice(0, 6).map((track, i) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={punjabData?.results}
                  showIndex={i}
                />
              ))}
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: { flex: 1 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '400',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginBottom: 4,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // ── Featured Banner ───────────────────────────────────────────────────────
  featuredBanner: {
    marginHorizontal: 16,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  featuredArtist: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    marginBottom: 12,
  },
  featuredActions: {
    flexDirection: 'row',
    gap: 10,
  },
  featuredPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    gap: 6,
  },
  featuredPlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  featuredShuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  featuredShuffleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },

  // ── Quick Picks ───────────────────────────────────────────────────────────
  quickPicksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: 4,
    overflow: 'hidden',
    width: (SCREEN_WIDTH - 48) / 2,
    height: 52,
  },
  quickPickImage: {
    width: 52,
    height: 52,
    backgroundColor: Colors.surface3,
  },
  quickPickTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 10,
  },
});
