import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
import type { Track } from '../api/jiosaavn';

import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

type TrackListScreenProps = StackScreenProps<RootStackParamList, 'TrackList'>;

export const TrackListScreen: React.FC<TrackListScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { title, tracks } = route.params;
  const { playQueue } = usePlayerStore();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(168,85,247,0.2)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.playAllBtn}
            onPress={() => playQueue(tracks, 0)}
          >
            <LinearGradient
              colors={['#A855F7', '#EC4899']}
              style={styles.playAllGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.playAllText}>{t('common.playAll')}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shuffleBtn}
            onPress={() => {
              const shuffled = [...tracks].sort(() => Math.random() - 0.5);
              playQueue(shuffled, 0);
            }}
          >
            <Ionicons name="shuffle" size={16} color={Colors.text} />
            <Text style={styles.shuffleText}>{t('common.shuffle')}</Text>
          </TouchableOpacity>
          <Text style={styles.trackCount}>{t('common.songs', { count: tracks.length })}</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={tracks}
        keyExtractor={(t, i) => `${t.id}-${i}`}
        renderItem={({ item, index }) => (
          <TrackCard track={item} queue={tracks} showIndex={index} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  playAllBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  playAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shuffleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  trackCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
});
