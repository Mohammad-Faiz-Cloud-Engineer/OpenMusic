import React, { useCallback, useMemo } from 'react';
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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getCharts, searchSongs } from '../api/jiosaavn';
import { useTheme } from '../theme';
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
import { shuffleArray } from '../utils/playerUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const placeholder = require('../../assets/placeholder.png');

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { playQueue } = usePlayerStore();
  const { colors, gradients, isDark } = useTheme();

  const { data: chartsData, isLoading: chartsLoading, isFetching: chartsFetching, refetch: refetchCharts } = useQuery({
    queryKey: ['charts'], queryFn: getCharts, staleTime: 10 * 60 * 1000,
  });
  const { data: trendingData, isLoading: trendingLoading, isFetching: trendingFetching, refetch: refetchTrending } = useQuery({
    queryKey: ['trending'], queryFn: () => searchSongs('trending bollywood 2026'), staleTime: 10 * 60 * 1000,
  });
  const { data: romanticData, isLoading: romanticLoading } = useQuery({
    queryKey: ['romantic'], queryFn: () => searchSongs('best romantic hindi songs'), staleTime: 15 * 60 * 1000,
  });
  const { data: punjabData, isLoading: punjabLoading } = useQuery({
    queryKey: ['punjabi'], queryFn: () => searchSongs('punjabi hits 2026'), staleTime: 15 * 60 * 1000,
  });

  const isRefreshing = chartsFetching || trendingFetching;
  const onRefresh = useCallback(() => { refetchCharts(); refetchTrending(); }, [refetchCharts, refetchTrending]);

  const getGreeting = useCallback(() => {
    const h = new Date().getHours();
    if (h < 12) return t('home.greetingMorning');
    if (h < 17) return t('home.greetingAfternoon');
    if (h < 21) return t('home.greetingEvening');
    return t('home.greetingNight');
  }, [t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        scroll: { flex: 1 },
        section: { marginBottom: 4 },
        horizontalList: { paddingHorizontal: 16, paddingBottom: 4 },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 20,
        },
        greeting: { fontSize: 12, color: colors.textSecondary, fontWeight: '400', marginBottom: 2 },
        headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
        searchBtn: {
          width: 42,
          height: 42,
          borderRadius: 21,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        searchBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        featuredBanner: {
          marginHorizontal: 16,
          height: 210,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: colors.surface2,
        },
        featuredContent: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 18,
        },
        featuredBadgeWrap: {
          overflow: 'hidden',
          borderRadius: 20,
          alignSelf: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        featuredBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
        featuredTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
        featuredArtist: { fontSize: 13, color: colors.textSecondary, marginTop: 3, marginBottom: 14 },
        featuredActions: { flexDirection: 'row', gap: 10 },
        featuredPlayBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 6,
        },
        featuredPlayText: { fontSize: 13, fontWeight: '700', color: '#000' },
        featuredShuffleBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 6,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        featuredShuffleText: { fontSize: 13, fontWeight: '600', color: colors.text },
        quickPicksGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 16,
          gap: 8,
        },
        quickPickItem: {
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 16,
          width: (SCREEN_WIDTH - 48) / 2,
          height: 56,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        quickPickGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        quickPickImage: { width: 56, height: 56, borderRadius: 0 },
        quickPickTitle: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text, paddingHorizontal: 10 },
      }),
    [colors]
  );

  const featuredOverlayColors = isDark
    ? (['transparent', 'rgba(0,0,0,0.95)'] as const)
    : (['transparent', 'rgba(255,255,255,0.94)'] as const);

  const renderFeaturedBanner = () => {
    const tracks = trendingData?.results?.slice(0, 5) ?? [];
    if (!tracks.length) return null;
    const featured = tracks[0];
    return (
      <TouchableOpacity style={styles.featuredBanner} onPress={() => playQueue(tracks, 0)} activeOpacity={0.88}>
        <Image
          source={featured.thumbnail ? { uri: featured.thumbnail } : placeholder}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={featuredOverlayColors} style={StyleSheet.absoluteFill} />
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadgeWrap}>
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <Text style={styles.featuredBadgeText}>{t('home.trendingBadge')}</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
          <Text style={styles.featuredArtist}>{featured.artist}</Text>
          <View style={styles.featuredActions}>
            <TouchableOpacity style={styles.featuredPlayBtn} onPress={() => playQueue(tracks, 0)}>
              <Ionicons name="play" size={16} color="#000" />
              <Text style={styles.featuredPlayText}>{t('home.playNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featuredShuffleBtn}
              onPress={() => playQueue(shuffleArray(tracks), 0)}
            >
              <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <Ionicons name="shuffle" size={16} color={colors.text} />
              <Text style={styles.featuredShuffleText}>{t('common.shuffle')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickPicks = () => {
    const tracks = trendingData?.results?.slice(0, 6) ?? [];
    if (!tracks.length) return null;
    return (
      <View style={styles.quickPicksGrid}>
        {tracks.map((track, i) => (
          <TouchableOpacity key={track.id} style={styles.quickPickItem} onPress={() => playQueue(tracks, i)} activeOpacity={0.75}>
            <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.quickPickGlass} />
            <Image
              source={track.thumbnail ? { uri: track.thumbnail } : placeholder}
              style={styles.quickPickImage}
            />
            <Text style={styles.quickPickTitle} numberOfLines={1}>{track.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headerTitle}>{t('home.headline')}</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => navigation.navigate('Search')} {...a11yButton(t('tabs.search'))}>
            <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.searchBtnGlass} />
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {trendingLoading
            ? <View style={{ paddingHorizontal: 16 }}><SkeletonCard height={210} borderRadius={24} /></View>
            : renderFeaturedBanner()
          }
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.quickPicks')} subtitle={t('home.quickPicksSub')} />
          {trendingLoading
            ? <View style={styles.quickPicksGrid}>{[...Array(6)].map((_, i) => <SkeletonCard key={i} width={(SCREEN_WIDTH - 48) / 2} height={56} borderRadius={16} />)}</View>
            : renderQuickPicks()
          }
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.topCharts')} onSeeAll={() => navigation.navigate('Charts')} />
          {chartsLoading
            ? <FlatList horizontal data={[1,2,3,4]} keyExtractor={i => String(i)} renderItem={() => <View style={{ marginRight: 12 }}><SkeletonCard width={160} height={160} borderRadius={20} /></View>} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
            : <FlatList horizontal data={chartsData?.charts ?? []} keyExtractor={c => c.id} renderItem={({ item }) => <ChartCard chart={item} onPress={() => navigation.navigate('Playlist', { id: item.id, title: item.title })} />} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
          }
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.trendingNow')} onSeeAll={() => navigation.navigate('TrackList', { title: t('home.trendingNow'), tracks: trendingData?.results ?? [] })} />
          {trendingLoading
            ? [...Array(5)].map((_, i) => <View key={i} style={{ paddingHorizontal: 16, marginBottom: 8 }}><SkeletonCard height={60} borderRadius={16} /></View>)
            : (trendingData?.results ?? []).slice(0, 8).map((track, i) => <TrackCard key={track.id} track={track} queue={trendingData?.results} showIndex={i} />)
          }
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.loveSongs')} subtitle={t('home.loveSongsSub')} onSeeAll={() => navigation.navigate('TrackList', { title: t('home.loveSongs'), tracks: romanticData?.results ?? [] })} />
          {romanticLoading
            ? <FlatList horizontal data={[1,2,3,4]} keyExtractor={i => String(i)} renderItem={() => <View style={{ marginRight: 12 }}><SkeletonCard width={140} height={140} borderRadius={16} /></View>} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
            : <FlatList horizontal data={romanticData?.results?.slice(0, 10) ?? []} keyExtractor={t => t.id} renderItem={({ item }) => <TrackCard track={item} queue={romanticData?.results} variant="grid" />} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList} />
          }
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('home.punjabiHits')} onSeeAll={() => navigation.navigate('TrackList', { title: t('home.punjabiHits'), tracks: punjabData?.results ?? [] })} />
          {punjabLoading
            ? [...Array(4)].map((_, i) => <View key={i} style={{ paddingHorizontal: 16, marginBottom: 8 }}><SkeletonCard height={60} borderRadius={16} /></View>)
            : (punjabData?.results ?? []).slice(0, 6).map((track, i) => <TrackCard key={track.id} track={track} queue={punjabData?.results} showIndex={i} />)
          }
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
