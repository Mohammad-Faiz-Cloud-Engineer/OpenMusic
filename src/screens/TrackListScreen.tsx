import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
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
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Text style={styles.trackCount}>{t('common.songs', { count: tracks.length })}</Text>
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.shuffleBtn}
            onPress={() => {
              const shuffled = [...tracks].sort(() => Math.random() - 0.5);
              playQueue(shuffled, 0);
            }}
          >
            <Ionicons name="shuffle" size={18} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => playQueue(tracks, 0)}
          >
            <Ionicons name="play" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
    letterSpacing: -0.2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  trackCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
