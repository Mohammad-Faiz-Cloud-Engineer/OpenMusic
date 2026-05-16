import React, { useRef, useCallback, useState, useEffect, useMemo, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
  ScrollView,
  Alert,
  FlatList,
  Share,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  type GestureResponderEvent,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore, RepeatMode } from '../store/playerStore';
import { useShallow } from 'zustand/react/shallow';
import { useLikeStore } from '../store/likeStore';
import { useUserPlaylistStore, PLAYLIST_NAME_MAX } from '../store/userPlaylistStore';
import { useTheme } from '../theme';
import { formatDuration } from '../api/jiosaavn';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { a11yButton } from '../utils/a11y';
import { devWarn } from '../utils/devLog';

// Resolved once at module load to avoid repeated require() calls inside render.
const placeholder = require('../../assets/placeholder.png');

type PlayerSeekStyles = {
  seekSection: ViewStyle;
  seekBarHitArea: ViewStyle;
  seekBarTrack: ViewStyle;
  seekBarFill: ViewStyle;
  seekBarThumb: ViewStyle;
  seekTimes: ViewStyle;
  seekTime: TextStyle;
};

/** Subscribes only to position/duration so the rest of PlayerScreen does not re-render every tick. */
const PlayerSeekSection = memo(function PlayerSeekSection({
  seekStyles,
}: {
  seekStyles: PlayerSeekStyles;
}) {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setIsSeeking = usePlayerStore((s) => s.setIsSeeking);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const seekBarWidth = useRef(0);

  const handleSeekBarPress = useCallback(
    (evt: GestureResponderEvent) => {
      if (seekBarWidth.current <= 0 || duration <= 0) return;
      const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / seekBarWidth.current));
      const newPos = ratio * duration;
      setIsSeeking(true);
      setPosition(newPos);
      void seekTo(newPos);
    },
    [duration, seekTo, setIsSeeking, setPosition]
  );

  const progress = duration > 0 ? Math.max(0, Math.min(1, position / duration)) : 0;

  return (
    <View style={seekStyles.seekSection}>
      <TouchableOpacity
        style={seekStyles.seekBarHitArea}
        onPress={handleSeekBarPress}
        activeOpacity={1}
        onLayout={(e) => {
          seekBarWidth.current = e.nativeEvent.layout.width;
        }}
      >
        <View style={seekStyles.seekBarTrack}>
          <View style={[seekStyles.seekBarFill, { width: `${progress * 100}%` }]} />
          <View style={[seekStyles.seekBarThumb, { left: `${progress * 100}%` }]} />
        </View>
      </TouchableOpacity>
      <View style={seekStyles.seekTimes}>
        <Text style={seekStyles.seekTime}>{formatDuration(position / 1000)}</Text>
        <Text style={seekStyles.seekTime}>{formatDuration(duration / 1000)}</Text>
      </View>
    </View>
  );
});

type PlayerScreenProps = StackScreenProps<RootStackParamList, 'Player'>;

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const artworkSize = Math.max(240, screenWidth - 56);
  const {
    currentTrack, isPlaying, isLoading,
    repeatMode, isShuffle, queue, currentIndex,
    playTrack, togglePlay, next, prev, setRepeat, toggleShuffle,
  } = usePlayerStore(
    useShallow((s) => ({
      currentTrack: s.currentTrack,
      isPlaying: s.isPlaying,
      isLoading: s.isLoading,
      repeatMode: s.repeatMode,
      isShuffle: s.isShuffle,
      queue: s.queue,
      currentIndex: s.currentIndex,
      playTrack: s.playTrack,
      togglePlay: s.togglePlay,
      next: s.next,
      prev: s.prev,
      setRepeat: s.setRepeat,
      toggleShuffle: s.toggleShuffle,
    }))
  );

  const artworkScale = useRef(new Animated.Value(isPlaying ? 1 : 0.88)).current;
  const [showGuide, setShowGuide] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showNewPlaylistPrompt, setShowNewPlaylistPrompt] = useState(false);
  const [newPlaylistNameInput, setNewPlaylistNameInput] = useState('');

  const likedIds = useLikeStore((s) => s.likedIds);
  const toggleLikeTrack = useLikeStore((s) => s.toggleLike);
  const isLikedSong = Boolean(currentTrack && likedIds.has(currentTrack.id));
  const userPlaylists = useUserPlaylistStore((s) => s.playlists);
  const addTrackToPlaylistStore = useUserPlaylistStore((s) => s.addTrackToPlaylist);
  const createPlaylistStore = useUserPlaylistStore((s) => s.createPlaylist);

  const onPickPlaylistForCurrent = useCallback(
    async (playlistId: string, playlistDisplayName: string) => {
      if (!currentTrack) return;
      const result = await addTrackToPlaylistStore(playlistId, currentTrack);
      setShowPlaylistPicker(false);
      const message =
        result === 'added'
          ? t('player.addedToPlaylist', { name: playlistDisplayName })
          : result === 'duplicate'
            ? t('player.alreadyInPlaylist', { name: playlistDisplayName })
            : t('player.playlistNotFound');
      Alert.alert('', message);
    },
    [addTrackToPlaylistStore, currentTrack, t]
  );

  const submitInlineNewPlaylist = useCallback(async () => {
    if (!currentTrack) return;
    const nameNorm = newPlaylistNameInput.trim() || t('library.defaultPlaylistName');
    const playlistId = await createPlaylistStore(nameNorm);
    const result = await addTrackToPlaylistStore(playlistId, currentTrack);
    setShowNewPlaylistPrompt(false);
    setNewPlaylistNameInput('');
    setShowPlaylistPicker(false);
    if (result === 'added') {
      Alert.alert('', t('player.addedToPlaylist', { name: nameNorm }));
    } else {
      Alert.alert('', t('player.playlistAddFailed'));
    }
  }, [
    addTrackToPlaylistStore,
    createPlaylistStore,
    currentTrack,
    newPlaylistNameInput,
    t,
  ]);

  const handleShare = useCallback(async () => {
    if (!currentTrack) return;
    try {
      await Share.share({
        message: `${currentTrack.title} - ${currentTrack.artist}`,
        title: currentTrack.title,
      });
    } catch (err) {
      devWarn('[player] share failed', err);
      Alert.alert('', t('player.shareFailed'));
    }
  }, [currentTrack, t]);

  const playQueueItem = useCallback(
    (index: number) => {
      const track = queue[index];
      if (!track) return;
      setShowQueue(false);
      void playTrack(track, queue, { openFullPlayer: false });
    },
    [playTrack, queue]
  );

  useEffect(() => {
    Animated.spring(artworkScale, {
      toValue: isPlaying ? 1 : 0.88,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isPlaying, artworkScale]);

  // Clean up any pending setTimeout on unmount to avoid state updates on
  // an unmounted component (the guide is opened via a delayed call from menu).
  const guideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (guideTimerRef.current) clearTimeout(guideTimerRef.current);
    };
  }, []);

  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  // Ensure sheet content clears the device navigation bar.
  const sheetBottomPad = Math.max(insets.bottom + 16, 44);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        scroll: { flex: 1 },
        scrollContent: { paddingBottom: 40 },
        bgArtwork: {
          position: 'absolute', top: 0, left: 0, right: 0,
          height: screenHeight, opacity: 0.45,
        },
        emptyContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
        emptyText: { fontSize: 16, color: colors.textSecondary },
        glassBtn: {
          overflow: 'hidden', borderRadius: 24, borderWidth: 1,
          borderColor: colors.glassBorder, paddingHorizontal: 28, paddingVertical: 12,
        },
        glassBtnFill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        glassBtnText: { color: colors.text, fontWeight: '700', fontSize: 13 },
        topBar: {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
        },
        topIconBtn: {
          width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        topIconGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        topCenter: { alignItems: 'center' },
        topLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
        artworkContainer: { alignItems: 'center', paddingHorizontal: 28, marginTop: 8, marginBottom: 28 },
        artworkWrapper: {
          width: artworkSize, height: artworkSize,
          borderRadius: 24, overflow: 'hidden',
          shadowColor: '#000', shadowOffset: { width: 0, height: 28 },
          shadowOpacity: 0.75, shadowRadius: 36, elevation: 28,
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        artwork: { width: '100%', height: '100%', backgroundColor: colors.surface2 },
        trackInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginBottom: 20 },
        trackInfoLeft: { flex: 1 },
        trackTitle: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
        trackArtist: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
        likeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
        seekSection: { paddingHorizontal: 32, marginBottom: 28 },
        seekBarHitArea: { height: 24, justifyContent: 'center' },
        seekBarTrack: {
          height: 4,
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          borderRadius: 2, position: 'relative',
        },
        seekBarFill: { height: '100%', backgroundColor: colors.text, borderRadius: 2 },
        seekBarThumb: {
          position: 'absolute', top: -7, width: 16, height: 16,
          borderRadius: 8, backgroundColor: colors.text, marginLeft: -8,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
        },
        seekTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
        seekTime: { fontSize: 11, color: colors.textMuted },
        controls: {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 32, marginBottom: 28,
        },
        sideControl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
        activeIndicator: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
        repeatOneLabel: { position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: '800', color: colors.accent },
        skipBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
        playBtn: {
          width: 68, height: 68, borderRadius: 34,
          backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center',
          shadowColor: colors.text, shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
        },
        extraControls: {
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 52, marginBottom: 28,
        },
        extraBtn: { alignItems: 'center', gap: 4 },
        extraBtnText: { fontSize: 11, color: colors.textSecondary },
        upNext: {
          marginHorizontal: 16, borderRadius: 24, overflow: 'hidden',
          padding: 18, borderWidth: 1, borderColor: colors.glassBorder,
        },
        upNextGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        upNextTitle: {
          fontSize: 11, fontWeight: '700', color: colors.textSecondary,
          letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14,
        },
        upNextItem: {
          flexDirection: 'row', alignItems: 'center', marginBottom: 14,
          borderRadius: 14, paddingVertical: 4, paddingHorizontal: 4,
          marginHorizontal: -4,
        },
        upNextImage: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2 },
        upNextInfo: { flex: 1, marginHorizontal: 12 },
        upNextTrackTitle: { fontSize: 13, fontWeight: '400', color: colors.text },
        upNextArtist: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        upNextDuration: { fontSize: 12, color: colors.textMuted },
        sheetOverlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'flex-end',
          zIndex: 100,
        },
        sheetOverlayBlur: { ...StyleSheet.absoluteFillObject },
        sheetOverlayDim: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.22)',
        },
        sheetOverlayTap: { ...StyleSheet.absoluteFillObject },
        sheet: {
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          overflow: 'hidden', paddingHorizontal: 20, paddingTop: 12,
          paddingBottom: sheetBottomPad, maxHeight: '82%',
          borderWidth: 1, borderColor: colors.glassBorder, borderBottomWidth: 0,
        },
        sheetGlass: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(15,15,25,0.82)' : 'rgba(255,255,255,0.96)',
        },
        sheetHandle: {
          width: 36, height: 4, borderRadius: 2,
          backgroundColor: colors.glassBorderStrong, alignSelf: 'center', marginBottom: 20,
        },
        sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
        sheetSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
        sheetItem: {
          flexDirection: 'row', alignItems: 'center', gap: 14,
          paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.glassBorder,
        },
        sheetIconWrap: {
          width: 42, height: 42, borderRadius: 14, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        sheetIconGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        sheetItemText: { flex: 1 },
        sheetItemLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
        sheetItemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        playlistPickSheet: { maxHeight: '78%' },
        playlistPickList: { maxHeight: screenHeight * 0.52 },
        playlistPickEmpty: {
          paddingVertical: 20,
          paddingHorizontal: 8,
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 18,
          textAlign: 'center',
        },
        newPlOverlay: {
          ...StyleSheet.absoluteFillObject,
          justifyContent: 'center',
          zIndex: 200,
          padding: 28,
        },
        newPlCard: {
          borderRadius: 24,
          overflow: 'hidden',
          padding: 20,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        newPlGlass: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(18,18,28,0.96)' : 'rgba(255,255,255,0.96)',
        },
        newPlTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 14,
        },
        newPlInput: {
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 13 : 10,
          fontSize: 16,
          color: colors.text,
          marginBottom: 18,
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)',
        },
        newPlBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
        newPlBtnGhost: { paddingVertical: 10 },
        newPlBtnGhostText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        newPlBtnPrimary: {
          backgroundColor: colors.text,
          borderRadius: 20,
          paddingVertical: 11,
          paddingHorizontal: 20,
        },
        newPlBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: colors.bg },
        guideScroll: { flexGrow: 0 },
        guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, gap: 14 },
        guideIconWrap: {
          width: 42, height: 42, borderRadius: 14, overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          borderWidth: 1, borderColor: colors.glassBorder,
        },
        guideRowText: { flex: 1 },
        guideRowLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 },
        guideRowDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
        guideDoneBtn: {
          marginTop: 20, backgroundColor: colors.text,
          borderRadius: 28, paddingVertical: 15, alignItems: 'center',
        },
        guideDoneBtnText: { fontSize: 15, fontWeight: '700', color: colors.bg },
        queueList: { maxHeight: screenHeight * 0.55 },
        queueItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.glassBorder,
        },
        queueItemActive: { backgroundColor: colors.accentOverlay },
        queueArtwork: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface2 },
        queueText: { flex: 1 },
        queueTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
        queueArtist: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        queueMeta: { fontSize: 12, color: colors.textMuted },
      }),
    [artworkSize, colors, isDark, screenHeight, sheetBottomPad]
  );

  const seekStyles = useMemo(
    (): PlayerSeekStyles => ({
      seekSection: styles.seekSection,
      seekBarHitArea: styles.seekBarHitArea,
      seekBarTrack: styles.seekBarTrack,
      seekBarFill: styles.seekBarFill,
      seekBarThumb: styles.seekBarThumb,
      seekTimes: styles.seekTimes,
      seekTime: styles.seekTime,
    }),
    [styles]
  );

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    setRepeat(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  };

  const mainOverlayGradient = isDark
    ? (['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', colors.bg] as const)
    : (['rgba(255,255,255,0.35)', 'rgba(245,245,247,0.92)', colors.bg] as const);

  const artworkSheenGradient = isDark
    ? (['rgba(255,255,255,0.06)', 'transparent', 'rgba(0,0,0,0.2)'] as const)
    : (['rgba(255,255,255,0.45)', 'transparent', 'rgba(0,0,0,0.08)'] as const);

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes-outline" size={56} color={colors.textMuted} />
        <Text style={styles.emptyText}>{t('player.nothingPlaying')}</Text>
        <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()} {...a11yButton(t('common.goBack'))}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.glassBtnFill} />
          <Text style={styles.glassBtnText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageSource = currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder;

  return (
    <View style={styles.container}>
      {/* Full-screen blurred artwork bg */}
      <Image source={imageSource} style={styles.bgArtwork} blurRadius={80} />
      <LinearGradient
        colors={mainOverlayGradient}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topIconBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.topIconGlass} />
            <Ionicons name="chevron-down" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>{t('player.nowPlaying')}</Text>
          </View>

          <TouchableOpacity style={styles.topIconBtn} onPress={() => setShowMenu(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.topIconGlass} />
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Animated.View style={[styles.artworkWrapper, { transform: [{ scale: artworkScale }] }]}>
            <Image source={imageSource} style={styles.artwork} />
            {/* Subtle glass sheen on artwork */}
            <LinearGradient
              colors={artworkSheenGradient}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Track info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackInfoLeft}>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => void toggleLikeTrack(currentTrack)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            {...a11yButton(isLikedSong ? t('player.unlike') : t('player.controls.like'))}
          >
            <Ionicons
              name={isLikedSong ? 'heart' : 'heart-outline'}
              size={24}
              color={isLikedSong ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <PlayerSeekSection seekStyles={seekStyles} />

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideControl} onPress={toggleShuffle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="shuffle" size={22} color={isShuffle ? colors.accent : colors.textSecondary} />
            {isShuffle && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={prev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="play-skip-back" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Play button */}
          <TouchableOpacity style={styles.playBtn} onPress={() => void togglePlay()} activeOpacity={0.85}>
            {isLoading
              ? <Ionicons name="hourglass-outline" size={28} color={colors.bg} />
              : <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={colors.bg} style={!isPlaying ? { marginLeft: 3 } : undefined} />
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={next} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="play-skip-forward" size={28} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideControl} onPress={cycleRepeat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="repeat" size={22} color={repeatMode !== 'off' ? colors.accent : colors.textSecondary} />
            {repeatMode === 'one' && <Text style={styles.repeatOneLabel}>1</Text>}
            {repeatMode !== 'off' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Extra controls */}
        <View style={styles.extraControls}>
          <TouchableOpacity
            style={styles.extraBtn}
            onPress={() => setShowQueue(true)}
            {...a11yButton(t('player.controls.queue'))}
          >
            <Ionicons name="list-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.extraBtnText}>{t('player.queue')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.extraBtn}
            onPress={() => void handleShare()}
            {...a11yButton(t('player.controls.share'))}
          >
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.extraBtnText}>{t('player.share')}</Text>
          </TouchableOpacity>
        </View>

        {/* Up Next */}
        {queue.length > 1 && (
          <View style={styles.upNext}>
            <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.upNextGlass} />
            <Text style={styles.upNextTitle}>{t('player.upNext')}</Text>
            {queue.slice(currentIndex + 1, currentIndex + 4).map((track, i) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.upNextItem}
                  onPress={() => void playTrack(track, queue, { openFullPlayer: false })}
                  activeOpacity={0.7}
                  {...a11yButton(`${track.title} by ${track.artist}`)}
                >
                  <Image
                    source={track.thumbnail ? { uri: track.thumbnail } : placeholder}
                    style={styles.upNextImage}
                  />
                  <View style={styles.upNextInfo}>
                    <Text style={styles.upNextTrackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.upNextArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Text style={styles.upNextDuration}>{formatDuration(track.duration_seconds)}</Text>
                </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Queue sheet */}
      {showQueue && (
        <View style={styles.sheetOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.sheetOverlayBlur} />
          <View style={styles.sheetOverlayDim} />
          <TouchableOpacity style={styles.sheetOverlayTap} onPress={() => setShowQueue(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.sheetGlass} />
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('player.queue')}</Text>
            <Text style={styles.sheetSubtitle}>{t('common.songs', { count: queue.length })}</Text>
            <FlatList
              data={queue}
              keyExtractor={(track, index) => `${track.id}-${index}`}
              style={styles.queueList}
              renderItem={({ item, index }) => {
                const isActive = index === currentIndex;
                return (
                  <TouchableOpacity
                    style={[styles.queueItem, isActive && styles.queueItemActive]}
                    onPress={() => playQueueItem(index)}
                    activeOpacity={0.75}
                    {...a11yButton(`${item.title} by ${item.artist}`)}
                  >
                    <Image
                      source={item.thumbnail ? { uri: item.thumbnail } : placeholder}
                      style={styles.queueArtwork}
                    />
                    <View style={styles.queueText}>
                      <Text style={styles.queueTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.queueArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>
                    <Text style={styles.queueMeta}>{formatDuration(item.duration_seconds)}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      )}

      {/* Menu sheet */}
      {showMenu && (
        <View style={styles.sheetOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.sheetOverlayBlur} />
          <View style={styles.sheetOverlayDim} />
          <TouchableOpacity style={styles.sheetOverlayTap} onPress={() => setShowMenu(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.sheetGlass} />
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('player.menu')}</Text>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setShowMenu(false);
                setShowPlaylistPicker(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sheetIconWrap}>
                <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.sheetIconGlass} />
                <Ionicons name="list-circle-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.sheetItemText}>
                <Text style={styles.sheetItemLabel}>{t('player.addToPlaylist')}</Text>
                <Text style={styles.sheetItemSub}>{t('player.addToPlaylistSubtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setShowMenu(false);
                guideTimerRef.current = setTimeout(() => setShowGuide(true), 250);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sheetIconWrap}>
                <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={styles.sheetIconGlass} />
                <Ionicons name="information-circle-outline" size={20} color={colors.text} />
              </View>
              <View style={styles.sheetItemText}>
                <Text style={styles.sheetItemLabel}>{t('player.controlsGuide')}</Text>
                <Text style={styles.sheetItemSub}>{t('player.controlsGuideSubtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add to playlist */}
      {showPlaylistPicker && (
        <View style={styles.sheetOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.sheetOverlayBlur} />
          <View style={styles.sheetOverlayDim} />
          <TouchableOpacity style={styles.sheetOverlayTap} onPress={() => setShowPlaylistPicker(false)} activeOpacity={1} />
          <View style={[styles.sheet, styles.playlistPickSheet]}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.sheetGlass} />
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('player.choosePlaylist')}</Text>
            <FlatList
              data={userPlaylists}
              keyExtractor={(p) => p.id}
              style={styles.playlistPickList}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    setShowPlaylistPicker(false);
                    setShowNewPlaylistPrompt(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetIconWrap}>
                    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={styles.sheetIconGlass} />
                    <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                  </View>
                  <View style={styles.sheetItemText}>
                    <Text style={styles.sheetItemLabel}>{t('player.newPlaylistDotMenu')}</Text>
                    <Text style={styles.sheetItemSub}>{t('library.playlistNamePlaceholder')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => void onPickPlaylistForCurrent(item.id, item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetIconWrap}>
                    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={styles.sheetIconGlass} />
                    <Ionicons name="musical-notes" size={18} color={colors.textSecondary} />
                  </View>
                  <View style={styles.sheetItemText}>
                    <Text style={styles.sheetItemLabel}>{item.name}</Text>
                    <Text style={styles.sheetItemSub}>
                      {t('common.songs', { count: item.tracks.length })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.playlistPickEmpty}>{t('library.playlistsEmptyHint')}</Text>
              }
            />
          </View>
        </View>
      )}

      {/* New playlist name */}
      {showNewPlaylistPrompt && (
        <KeyboardAvoidingView
          style={styles.newPlOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.sheetOverlayBlur} />
          <View style={[styles.sheetOverlayDim, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)' }]} />
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              setShowNewPlaylistPrompt(false);
              setNewPlaylistNameInput('');
            }}
            activeOpacity={1}
          />
          <View style={styles.newPlCard}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.newPlGlass} />
            <Text style={styles.newPlTitle}>{t('library.createPlaylist')}</Text>
            <TextInput
              value={newPlaylistNameInput}
              onChangeText={setNewPlaylistNameInput}
              placeholder={t('library.playlistNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.newPlInput}
              maxLength={PLAYLIST_NAME_MAX}
              autoFocus
              autoCorrect={false}
              autoCapitalize="sentences"
            />
            <View style={styles.newPlBtns}>
              <TouchableOpacity
                onPress={() => {
                  setShowNewPlaylistPrompt(false);
                  setNewPlaylistNameInput('');
                }}
                style={styles.newPlBtnGhost}
              >
                <Text style={styles.newPlBtnGhostText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void submitInlineNewPlaylist()}
                style={styles.newPlBtnPrimary}
              >
                <Text style={styles.newPlBtnPrimaryText}>{t('common.create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Controls guide sheet */}
      {showGuide && (
        <View style={styles.sheetOverlay}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.sheetOverlayBlur} />
          <View style={styles.sheetOverlayDim} />
          <TouchableOpacity style={styles.sheetOverlayTap} onPress={() => setShowGuide(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.sheetGlass} />
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('player.controlsGuide')}</Text>
            <Text style={styles.sheetSubtitle}>{t('player.controlsGuideSubtitle')}</Text>
            <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false} bounces={false}>
              {([
                { icon: 'shuffle',           label: t('player.controls.shuffle'),   desc: t('player.controls.shuffleDesc') },
                { icon: 'play-skip-back',    label: t('player.controls.prev'),      desc: t('player.controls.prevDesc') },
                { icon: 'play-circle',       label: t('player.controls.playPause'), desc: t('player.controls.playPauseDesc') },
                { icon: 'play-skip-forward', label: t('player.controls.next'),      desc: t('player.controls.nextDesc') },
                { icon: 'repeat',            label: t('player.controls.repeat'),    desc: t('player.controls.repeatDesc') },
                { icon: 'remove-outline',    label: t('player.controls.seekBar'),   desc: t('player.controls.seekBarDesc') },
                { icon: 'heart-outline',     label: t('player.controls.like'),      desc: t('player.controls.likeDesc') },
                { icon: 'list',              label: t('player.controls.queue'),     desc: t('player.controls.queueDesc') },
                { icon: 'share-outline',     label: t('player.controls.share'),     desc: t('player.controls.shareDesc') },
              ] as { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; desc: string }[]).map((item, i) => (
                <View key={i} style={styles.guideRow}>
                  <View style={styles.guideIconWrap}>
                    <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <View style={styles.sheetIconGlass} />
                    <Ionicons name={item.icon} size={20} color={colors.text} />
                  </View>
                  <View style={styles.guideRowText}>
                    <Text style={styles.guideRowLabel}>{item.label}</Text>
                    <Text style={styles.guideRowDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
              <View style={{ height: 8 }} />
            </ScrollView>
            <TouchableOpacity style={styles.guideDoneBtn} onPress={() => setShowGuide(false)} activeOpacity={0.85}>
              <Text style={styles.guideDoneBtnText}>{t('player.gotIt')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
