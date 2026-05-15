import React, { useRef, useCallback, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore, RepeatMode } from '../store/playerStore';
import { Colors } from '../theme/colors';
import { formatDuration } from '../api/jiosaavn';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';
import { a11yButton } from '../utils/a11y';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 64;

type PlayerScreenProps = StackScreenProps<RootStackParamList, 'Player'>;

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    repeatMode,
    isShuffle,
    queue,
    currentIndex,
    togglePlay,
    next,
    prev,
    seekTo,
    setRepeat,
    toggleShuffle,
    setIsSeeking,
    setPosition,
  } = usePlayerStore();

  const artworkScale = useRef(new Animated.Value(isPlaying ? 1 : 0.9)).current;
  const seekBarWidth = useRef(0);
  const [showGuide, setShowGuide] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  React.useEffect(() => {
    Animated.spring(artworkScale, {
      toValue: isPlaying ? 1 : 0.9,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isPlaying, artworkScale]);

  const handleSeekBarPress = useCallback(
    (evt: any) => {
      if (seekBarWidth.current <= 0 || duration <= 0) return;
      const x = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / seekBarWidth.current));
      const newPosition = ratio * duration;
      setIsSeeking(true);
      setPosition(newPosition);
      seekTo(newPosition);
    },
    [duration, seekTo, setIsSeeking, setPosition]
  );

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = modes.indexOf(repeatMode);
    setRepeat(modes[(current + 1) % modes.length]);
  };

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes-outline" size={56} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t('player.nothingPlaying')}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          {...a11yButton(t('common.goBack'))}
        >
          <Text style={styles.backBtnText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;
  const placeholder = require('../../assets/placeholder.png');
  const imageSource = currentTrack.thumbnail ? { uri: currentTrack.thumbnail } : placeholder;

  return (
    <View style={styles.container}>
      {/* Blurred artwork background */}
      <Image source={imageSource} style={styles.bgArtwork} blurRadius={60} />
      <View style={styles.bgOverlay} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={26} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>{t('player.nowPlaying')}</Text>
          </View>
          <TouchableOpacity
            style={styles.topBtn}
            onPress={() => setShowMenu(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Artwork ──────────────────────────────────────────────────────── */}
        <View style={styles.artworkContainer}>
          <Animated.View
            style={[styles.artworkWrapper, { transform: [{ scale: artworkScale }] }]}
          >
            <Image source={imageSource} style={styles.artwork} />
          </Animated.View>
        </View>

        {/* ── Track info ───────────────────────────────────────────────────── */}
        <View style={styles.trackInfo}>
          <View style={styles.trackInfoLeft}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity style={styles.likeBtn}>
            <Ionicons name="heart-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Seek bar ─────────────────────────────────────────────────────── */}
        <View style={styles.seekSection}>
          <TouchableOpacity
            style={styles.seekBarHitArea}
            onPress={handleSeekBarPress}
            activeOpacity={1}
            onLayout={(e) => {
              seekBarWidth.current = e.nativeEvent.layout.width;
            }}
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
          {/* Shuffle */}
          <TouchableOpacity
            style={styles.sideControl}
            onPress={toggleShuffle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffle ? Colors.accent : Colors.textSecondary}
            />
            {isShuffle && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Prev */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={prev}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-back" size={28} color={Colors.text} />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.85}>
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={28} color="#000" />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#000"
                style={!isPlaying ? { marginLeft: 3 } : undefined}
              />
            )}
          </TouchableOpacity>

          {/* Next */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={next}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={28} color={Colors.text} />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            style={styles.sideControl}
            onPress={cycleRepeat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="repeat"
              size={22}
              color={repeatMode !== 'off' ? Colors.accent : Colors.textSecondary}
            />
            {repeatMode === 'one' && <Text style={styles.repeatOneLabel}>1</Text>}
            {repeatMode !== 'off' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* ── Extra controls ───────────────────────────────────────────────── */}
        <View style={styles.extraControls}>
          <TouchableOpacity style={styles.extraBtn}>
            <Ionicons name="list-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.extraBtnText}>{t('player.queue')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.extraBtn}>
            <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.extraBtnText}>{t('player.share')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Up Next ──────────────────────────────────────────────────────── */}
        {queue.length > 1 && (
          <View style={styles.upNext}>
            <Text style={styles.upNextTitle}>{t('player.upNext')}</Text>
            {queue.slice(currentIndex + 1, currentIndex + 4).map((track) => (
              <View key={track.id} style={styles.upNextItem}>
                <Image
                  source={track.thumbnail ? { uri: track.thumbnail } : placeholder}
                  style={styles.upNextImage}
                />
                <View style={styles.upNextInfo}>
                  <Text style={styles.upNextTrackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.upNextArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
                <Text style={styles.upNextDuration}>
                  {formatDuration(track.duration_seconds)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── 3-dot menu ───────────────────────────────────────────────────────── */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('player.menu')}</Text>
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setShowMenu(false);
                setTimeout(() => setShowGuide(true), 250);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.sheetIconWrap}>
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

      {/* ── Controls guide modal ─────────────────────────────────────────────── */}
      <Modal
        visible={showGuide}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowGuide(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowGuide(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('player.controlsGuide')}</Text>
            <Text style={styles.sheetSubtitle}>{t('player.controlsGuideSubtitle')}</Text>
            <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false} bounces={false}>
              {[
                { icon: 'shuffle' as const,           label: t('player.controls.shuffle'),   desc: t('player.controls.shuffleDesc') },
                { icon: 'play-skip-back' as const,    label: t('player.controls.prev'),      desc: t('player.controls.prevDesc') },
                { icon: 'play-circle' as const,       label: t('player.controls.playPause'), desc: t('player.controls.playPauseDesc') },
                { icon: 'play-skip-forward' as const, label: t('player.controls.next'),      desc: t('player.controls.nextDesc') },
                { icon: 'repeat' as const,            label: t('player.controls.repeat'),    desc: t('player.controls.repeatDesc') },
                { icon: 'remove-outline' as const,    label: t('player.controls.seekBar'),   desc: t('player.controls.seekBarDesc') },
                { icon: 'heart-outline' as const,     label: t('player.controls.like'),      desc: t('player.controls.likeDesc') },
                { icon: 'list' as const,              label: t('player.controls.queue'),     desc: t('player.controls.queueDesc') },
                { icon: 'share-outline' as const,     label: t('player.controls.share'),     desc: t('player.controls.shareDesc') },
              ].map((item, index) => (
                <View key={index} style={styles.guideRow}>
                  <View style={styles.guideIconWrap}>
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
            <TouchableOpacity
              style={styles.guideDoneBtn}
              onPress={() => setShowGuide(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.guideDoneBtnText}>{t('player.gotIt')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  bgArtwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.55,
    opacity: 0.35,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  backBtn: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  topBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: { alignItems: 'center' },
  topLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Artwork ───────────────────────────────────────────────────────────────
  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 8,
    marginBottom: 28,
  },
  artworkWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 24,
  },
  artwork: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface2,
  },

  // ── Track info ────────────────────────────────────────────────────────────
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  trackInfoLeft: { flex: 1 },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  trackArtist: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '400',
  },
  likeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Seek bar ──────────────────────────────────────────────────────────────
  seekSection: {
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  seekBarHitArea: {
    height: 20,
    justifyContent: 'center',
  },
  seekBarTrack: {
    height: 4,
    backgroundColor: Colors.surface3,
    borderRadius: 2,
    position: 'relative',
  },
  seekBarFill: {
    height: '100%',
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
  seekBarThumb: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.text,
    marginLeft: -7,
  },
  seekTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  seekTime: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '400',
  },

  // ── Controls ──────────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  sideControl: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  repeatOneLabel: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 8,
    fontWeight: '800',
    color: Colors.accent,
  },
  skipBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // ── Extra controls ────────────────────────────────────────────────────────
  extraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 48,
    marginBottom: 28,
  },
  extraBtn: {
    alignItems: 'center',
    gap: 4,
  },
  extraBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '400',
  },

  // ── Up Next ───────────────────────────────────────────────────────────────
  upNext: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  upNextTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  upNextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upNextImage: {
    width: 44,
    height: 44,
    borderRadius: 2,
    backgroundColor: Colors.surface2,
  },
  upNextInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  upNextTrackTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.text,
  },
  upNextArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upNextDuration: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surface3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sheetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetItemText: { flex: 1 },
  sheetItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sheetItemSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Guide ─────────────────────────────────────────────────────────────────
  guideScroll: { flexGrow: 0 },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 14,
  },
  guideIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guideRowText: { flex: 1 },
  guideRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  guideRowDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  guideDoneBtn: {
    marginTop: 20,
    backgroundColor: Colors.text,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guideDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});
