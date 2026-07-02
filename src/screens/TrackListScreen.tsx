import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { TrackCard } from '../components/TrackCard';
import { usePlayerStore } from '../store/playerStore';
import { shuffleArray } from '../utils/playerUtils';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { a11yButton } from '../utils/a11y';

type TrackListScreenProps = StackScreenProps<RootStackParamList, 'TrackList'>;

export const TrackListScreen: React.FC<TrackListScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { title, tracks } = route.params;
  const playQueue = usePlayerStore((s) => s.playQueue);
  const { colors, gradients, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: {
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        },
        backBtn: {
          width: 38, height: 38, borderRadius: 19, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        backBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        headerTitle: {
          flex: 1, fontSize: 18, fontWeight: '700', color: colors.text,
          textAlign: 'center', marginHorizontal: 8, letterSpacing: -0.2,
        },
        actions: {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingBottom: 12,
        },
        trackCount: { fontSize: 13, color: colors.textSecondary },
        actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        shuffleBtn: {
          width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        shuffleBtnGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        playBtn: {
          width: 50, height: 50, borderRadius: 25,
          backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
          shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.backBtnGlass} />
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.actions}>
        <Text style={styles.trackCount}>{t('common.songs', { count: tracks.length })}</Text>
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.shuffleBtn}
            onPress={() => playQueue(shuffleArray(tracks), 0)}
            {...a11yButton(t('common.shuffle'))}
          >
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.shuffleBtnGlass} />
            <Ionicons name="shuffle" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={() => playQueue(tracks, 0)} {...a11yButton(t('common.play'))}>
            <Ionicons name="play" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={tracks}
        keyExtractor={(track, i) => `${track.id}-${i}`}
        renderItem={({ item, index }) => (
          <TrackCard track={item} queue={tracks} showIndex={index} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      />
    </SafeAreaView>
  );
};
