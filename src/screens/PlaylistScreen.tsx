import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getPlaylist, formatDuration } from '../api/jiosaavn';
import { Colors } from '../theme/colors';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlaylistScreenProps {
  navigation: any;
  route: { params: { id: string; title?: string } };
}

export const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ navigation, route }) => {
  const { id, title } = route.params;
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
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1A0A2E', '#0A0A1A', '#0A0A0F']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading playlist...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1A0A2E', '#0A0A1A', '#0A0A0F']} style={StyleSheet.absoluteFill} />
        <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
        <Text style={styles.errorText}>Failed to load playlist</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
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
            {/* Hero */}
            <View style={styles.hero}>
              <Image source={imageSource} style={styles.heroBg} blurRadius={30} />
              <LinearGradient
                colors={['rgba(168,85,247,0.3)', 'rgba(0,0,0,0.7)', Colors.bg]}
                style={StyleSheet.absoluteFill}
              />

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color={Colors.text} />
              </TouchableOpacity>

              {/* Artwork */}
              <View style={styles.artworkContainer}>
                <Image source={imageSource} style={styles.artwork} />
              </View>

              {/* Info */}
              <View style={styles.heroInfo}>
                <Text style={styles.playlistTitle} numberOfLines={2}>
                  {data.title}
                </Text>
                <Text style={styles.playlistOwner}>by {data.owner}</Text>
                <Text style={styles.playlistMeta}>
                  {data.song_count} songs · {durationStr}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.playAllBtn}
                  onPress={() => playQueue(data.tracks, 0)}
                >
                  <LinearGradient
                    colors={['#A855F7', '#EC4899']}
                    style={styles.playAllGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.playAllText}>Play All</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shuffleBtn}
                  onPress={() => {
                    const shuffled = [...data.tracks].sort(() => Math.random() - 0.5);
                    playQueue(shuffled, 0);
                  }}
                >
                  <Ionicons name="shuffle" size={20} color={Colors.text} />
                  <Text style={styles.shuffleText}>Shuffle</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Track count header */}
            <View style={styles.tracksHeader}>
              <Text style={styles.tracksHeaderText}>
                {data.tracks.length} Tracks
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <TrackCard
            track={item}
            queue={data.tracks}
            showIndex={index}
          />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: Colors.bg,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: {
    color: Colors.accent,
    fontWeight: '600',
  },

  // Hero
  hero: {
    minHeight: 420,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    opacity: 0.5,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  artwork: {
    width: 180,
    height: 180,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
  },
  heroInfo: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  playlistTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  playlistOwner: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  heroActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  playAllBtn: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  playAllText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  shuffleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },

  // Tracks
  tracksHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tracksHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
