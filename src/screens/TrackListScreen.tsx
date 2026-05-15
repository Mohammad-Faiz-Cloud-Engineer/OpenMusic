import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients } from '../theme/colors';
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
      <LinearGradient colors={Gradients.ambientBg} style={StyleSheet.absoluteFill} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.backBtnGlass} />
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Text style={styles.trackCount}>{t('common.songs', { count: tracks.length })}</Text>
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.shuffleBtn}
            onPress={() => { const s = [...tracks].sort(() => Math.random() - 0.5); playQueue(s, 0); }}
          >
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.shuffleBtnGlass} />
            <Ionicons name="shuffle" size={18} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={() => playQueue(tracks, 0)}>
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
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  backBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text,
    textAlign: 'center', marginHorizontal: 8, letterSpacing: -0.2,
  },

  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  trackCount: { fontSize: 13, color: Colors.textSecondary },
  actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shuffleBtn: {
    width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  shuffleBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  playBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
