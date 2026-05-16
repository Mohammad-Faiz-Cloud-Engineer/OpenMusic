import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  type GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore, RepeatMode } from '../store/playerStore';
import { useLikeStore } from '../store/likeStore';
import { useUserPlaylistStore, PLAYLIST_NAME_MAX } from '../store/userPlaylistStore';
import { Colors, Gradients } from '../theme/colors';
import { formatDuration } from '../api/jiosaavn';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { a11yButton } from '../utils/a11y';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 56;

// Resolved once at module load — avoids repeated require() calls inside render
const placeholder = require('../../assets/placeholder.png');

type PlayerScreenProps = StackScreenProps<RootStackParamList, 'Player'>;

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    currentTrack, isPlaying, isLoading, position, duration,
    repeatMode, isShuffle, queue, currentIndex,
    togglePlay, next, prev, seekTo, setRepeat, toggleShuffle,
    setIsSeeking, setPosition,
  } = usePlayerStore();

  const artworkScale = useRef(new Animated.Value(isPlaying ? 1 : 0.88)).current;
  const seekBarWidth = useRef(0);
  const [showGuide, setShowGuide] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
      const ok = await addTrackToPlaylistStore(playlistId, currentTrack);
      setShowPlaylistPicker(false);
      Alert.alert(
        '',
        ok
          ? t('player.addedToPlaylist', { name: playlistDisplayName })
          : t('player.alreadyInPlaylist', { name: playlistDisplayName })
      );
    },
    [addTrackToPlaylistStore, currentTrack, t]
  );

  const submitInlineNewPlaylist = useCallback(async () => {
    if (!currentTrack) return;
    const nameNorm = newPlaylistNameInput.trim() || t('library.defaultPlaylistName');
    const playlistId = await createPlaylistStore(nameNorm);
    await addTrackToPlaylistStore(playlistId, currentTrack);
    setShowNewPlaylistPrompt(false);
    setNewPlaylistNameInput('');
    setShowPlaylistPicker(false);
    Alert.alert('', t('player.addedToPlaylist', { name: nameNorm }));
  }, [
    addTrackToPlaylistStore,
    createPlaylistStore,
    currentTrack,
    newPlaylistNameInput,
    t,
  ]);

  React.useEffect(() => {
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

  const handleSeekBarPress = useCallback((evt: GestureResponderEvent) => {
    if (seekBarWidth.current <= 0 || duration <= 0) return;
    const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / seekBarWidth.current));
    const newPos = ratio * duration;
    setIsSeeking(true);
    setPosition(newPos);
    seekTo(newPos);
  }, [duration, seekTo, setIsSeeking, setPosition]);

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    setRepeat(modes[(modes.indexOf(repeatMode) + 1) % modes.length]);
  };

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes-outline" size={56} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t('player.nothingPlaying')}</Text>
        <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()} {...a11yButton(t('common.goBack'))}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.glassBtnFill} />
          <Text style={styles.glassBtnText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;
  const imageSource = currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder;

  return (
    <View style={styles.container}>
      {/* Full-screen blurred artwork bg */}
      <Image source={imageSource} style={styles.bgArtwork} blurRadius={80} />
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', Colors.bg]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topIconBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.topIconGlass} />
            <Ionicons name="chevron-down" size={22} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>{t('player.nowPlaying')}</Text>
          </View>

          <TouchableOpacity style={styles.topIconBtn} onPress={() => setShowMenu(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.topIconGlass} />
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Artwork ──────────────────────────────────────────────────────── */}
        <View style={styles.artworkContainer}>
          <Animated.View style={[styles.artworkWrapper, { transform: [{ scale: artworkScale }] }]}>
            <Image source={imageSource} style={styles.artwork} />
            {/* Subtle glass sheen on artwork */}
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'transparent', 'rgba(0,0,0,0.2)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* ── Track info ───────────────────────────────────────────────────── */}
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
              color={isLikedSong ? Colors.accent : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* ── Seek bar ─────────────────────────────────────────────────────── */}
        <View style={styles.seekSection}>
          <TouchableOpacity
            style={styles.seekBarHitArea}
            onPress={handleSeekBarPress}
            activeOpacity={1}
            onLayout={(e) => { seekBarWidth.current = e.nativeEvent.layout.width; }}
          >
            <View style={styles.seekBarTrack}>
              <View style={[styles.seekBarFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.seekBarThumb, { left: `${progress * 100}%` }]} />
            </View>
          </TouchableOpacity>
          <View style={styles.seekTimes}>
            <Text style={styles.seekTime}>{formatDuration(position / 1000)}</Text>
            <Text style={styles.seekTime}>{formatDuration(duration / 1000)}</Text>
          </View>
        </View>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideControl} onPress={toggleShuffle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="shuffle" size={22} color={isShuffle ? Colors.accent : Colors.textSecondary} />
            {isShuffle && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={prev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="play-skip-back" size={28} color={Colors.text} />
          </TouchableOpacity>

          {/* Play button — solid white circle */}
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.85}>
            {isLoading
              ? <Ionicons name="hourglass-outline" size={28} color="#000" />
              : <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#000" style={!isPlaying ? { marginLeft: 3 } : undefined} />
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={next} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="play-skip-forward" size={28} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideControl} onPress={cycleRepeat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="repeat" size={22} color={repeatMode !== 'off' ? Colors.accent : Colors.textSecondary} />
            {repeatMode === 'one' && <Text style={styles.repeatOneLabel}>1</Text>}
            {repeatMode !== 'off' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* ── Extra controls ───────────────────────────────────────────────── */}
        <View style={styles.extraControls}>
          <TouchableOpacity style={styles.extraBtn} {...a11yButton(t('player.controls.queue'))}>
            <Ionicons name="list-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.extraBtnText}>{t('player.queue')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn} {...a11yButton(t('player.controls.share'))}>
            <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.extraBtnText}>{t('player.share')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Up Next — glass card ─────────────────────────────────────────── */}
        {queue.length > 1 && (
          <View style={styles.upNext}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.upNextGlass} />
            <Text style={styles.upNextTitle}>{t('player.upNext')}</Text>
            {queue.slice(currentIndex + 1, currentIndex + 4).map((track) => (
              <View key={track.id} style={styles.upNextItem}>
                <Image
                  source={track.thumbnail ? { uri: track.thumbnail } : placeholder}
                  style={styles.upNextImage}
                />
                <View style={styles.upNextInfo}>
                  <Text style={styles.upNextTrackTitle} numberOfLines={1}>{track.title}</Text>
                  <Text style={styles.upNextArtist} numberOfLines={1}>{track.artist}</Text>
                </View>
                <Text style={styles.upNextDuration}>{formatDuration(track.duration_seconds)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── 3-dot menu sheet ─────────────────────────────────────────────────── */}
      <Modal visible={showMenu} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
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
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.sheetIconGlass} />
                <Ionicons name="list-circle-outline" size={20} color={Colors.text} />
              </View>
              <View style={styles.sheetItemText}>
                <Text style={styles.sheetItemLabel}>{t('player.addToPlaylist')}</Text>
                <Text style={styles.sheetItemSub}>{t('player.addToPlaylistSubtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
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
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.sheetIconGlass} />
                <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
              </View>
              <View style={styles.sheetItemText}>
                <Text style={styles.sheetItemLabel}>{t('player.controlsGuide')}</Text>
                <Text style={styles.sheetItemSub}>{t('player.controlsGuideSubtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Add to playlist ─────────────────────────────────────────────────── */}
      <Modal
        visible={showPlaylistPicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowPlaylistPicker(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowPlaylistPicker(false)}>
          <Pressable style={[styles.sheet, styles.playlistPickSheet]} onPress={() => {}}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
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
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.sheetIconGlass} />
                    <Ionicons name="add-circle-outline" size={22} color={Colors.accent} />
                  </View>
                  <View style={styles.sheetItemText}>
                    <Text style={styles.sheetItemLabel}>{t('player.newPlaylistDotMenu')}</Text>
                    <Text style={styles.sheetItemSub}>{t('library.playlistNamePlaceholder')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => void onPickPlaylistForCurrent(item.id, item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetIconWrap}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.sheetIconGlass} />
                    <Ionicons name="musical-notes" size={18} color={Colors.textSecondary} />
                  </View>
                  <View style={styles.sheetItemText}>
                    <Text style={styles.sheetItemLabel}>{item.name}</Text>
                    <Text style={styles.sheetItemSub}>
                      {t('common.songs', { count: item.tracks.length })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.playlistPickEmpty}>{t('library.playlistsEmptyHint')}</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── New playlist name ───────────────────────────────────────────────── */}
      <Modal
        visible={showNewPlaylistPrompt}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setShowNewPlaylistPrompt(false);
          setNewPlaylistNameInput('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.newPlOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowNewPlaylistPrompt(false);
              setNewPlaylistNameInput('');
            }}
          />
          <View style={styles.newPlCard}>
            <BlurView intensity={44} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.newPlGlass} />
            <Text style={styles.newPlTitle}>{t('library.createPlaylist')}</Text>
            <TextInput
              value={newPlaylistNameInput}
              onChangeText={setNewPlaylistNameInput}
              placeholder={t('library.playlistNamePlaceholder')}
              placeholderTextColor={Colors.textMuted}
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
      </Modal>

      {/* ── Controls guide sheet ─────────────────────────────────────────────── */}
      <Modal visible={showGuide} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowGuide(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowGuide(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
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
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.sheetIconGlass} />
                    <Ionicons name={item.icon} size={20} color={Colors.text} />
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
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  bgArtwork: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: SCREEN_HEIGHT, opacity: 0.45,
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  glassBtn: {
    overflow: 'hidden', borderRadius: 24, borderWidth: 1,
    borderColor: Colors.glassBorder, paddingHorizontal: 28, paddingVertical: 12,
  },
  glassBtnFill: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  glassBtnText: { color: Colors.text, fontWeight: '700', fontSize: 13 },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  topIconBtn: {
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  topIconGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  topCenter: { alignItems: 'center' },
  topLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },

  // ── Artwork ───────────────────────────────────────────────────────────────
  artworkContainer: { alignItems: 'center', paddingHorizontal: 28, marginTop: 8, marginBottom: 28 },
  artworkWrapper: {
    width: ARTWORK_SIZE, height: ARTWORK_SIZE,
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.75, shadowRadius: 36, elevation: 28,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  artwork: { width: '100%', height: '100%', backgroundColor: Colors.surface2 },

  // ── Track info ────────────────────────────────────────────────────────────
  trackInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, marginBottom: 20 },
  trackInfoLeft: { flex: 1 },
  trackTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, letterSpacing: -0.3 },
  trackArtist: { fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
  likeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  // ── Seek bar ──────────────────────────────────────────────────────────────
  seekSection: { paddingHorizontal: 32, marginBottom: 28 },
  seekBarHitArea: { height: 24, justifyContent: 'center' },
  seekBarTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, position: 'relative',
  },
  seekBarFill: { height: '100%', backgroundColor: Colors.text, borderRadius: 2 },
  seekBarThumb: {
    position: 'absolute', top: -7, width: 16, height: 16,
    borderRadius: 8, backgroundColor: Colors.text, marginLeft: -8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  seekTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  seekTime: { fontSize: 11, color: Colors.textMuted },

  // ── Controls ──────────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, marginBottom: 28,
  },
  sideControl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeIndicator: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
  repeatOneLabel: { position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: '800', color: Colors.accent },
  skipBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.text, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
  },

  // ── Extra controls ────────────────────────────────────────────────────────
  extraControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 52, marginBottom: 28,
  },
  extraBtn: { alignItems: 'center', gap: 4 },
  extraBtnText: { fontSize: 11, color: Colors.textSecondary },

  // ── Up Next ───────────────────────────────────────────────────────────────
  upNext: {
    marginHorizontal: 16, borderRadius: 24, overflow: 'hidden',
    padding: 18, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  upNextGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  upNextTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14,
  },
  upNextItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  upNextImage: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surface2 },
  upNextInfo: { flex: 1, marginHorizontal: 12 },
  upNextTrackTitle: { fontSize: 13, fontWeight: '400', color: Colors.text },
  upNextArtist: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  upNextDuration: { fontSize: 12, color: Colors.textMuted },

  // ── Sheet ─────────────────────────────────────────────────────────────────
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden', paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: 44, maxHeight: '82%',
    borderWidth: 1, borderColor: Colors.glassBorder, borderBottomWidth: 0,
  },
  sheetGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,15,25,0.72)' },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.glassBorderStrong, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.glassBorder,
  },
  sheetIconWrap: {
    width: 42, height: 42, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  sheetIconGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.glass },
  sheetItemText: { flex: 1 },
  sheetItemLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  sheetItemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  playlistPickSheet: { maxHeight: '78%' },
  playlistPickList: { maxHeight: SCREEN_HEIGHT * 0.52 },
  playlistPickEmpty: {
    paddingVertical: 20,
    paddingHorizontal: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },

  newPlOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 28,
  },
  newPlCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  newPlGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,18,28,0.96)',
  },
  newPlTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  newPlInput: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 18,
  },
  newPlBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  newPlBtnGhost: { paddingVertical: 10 },
  newPlBtnGhostText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  newPlBtnPrimary: {
    backgroundColor: Colors.text,
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  newPlBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#000' },

  // ── Guide ─────────────────────────────────────────────────────────────────
  guideScroll: { flexGrow: 0 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, gap: 14 },
  guideIconWrap: {
    width: 42, height: 42, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  guideRowText: { flex: 1 },
  guideRowLabel: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  guideRowDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  guideDoneBtn: {
    marginTop: 20, backgroundColor: Colors.text,
    borderRadius: 28, paddingVertical: 15, alignItems: 'center',
  },
  guideDoneBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
