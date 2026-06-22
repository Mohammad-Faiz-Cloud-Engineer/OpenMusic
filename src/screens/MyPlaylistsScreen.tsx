import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useUserPlaylistStore, PLAYLIST_NAME_MAX, type UserPlaylistStored } from '../store/userPlaylistStore';
import { a11yButton } from '../utils/a11y';

type Props = StackScreenProps<RootStackParamList, 'MyPlaylists'>;

export const MyPlaylistsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors, gradients, isDark } = useTheme();
  const playlists = useUserPlaylistStore((s) => s.playlists);
  const createPlaylist = useUserPlaylistStore((s) => s.createPlaylist);
  const deletePlaylist = useUserPlaylistStore((s) => s.deletePlaylist);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          gap: 12,
        },
        backBtn: {
          width: 38,
          height: 38,
          borderRadius: 19,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        addBtn: {
          width: 38,
          height: 38,
          borderRadius: 19,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        backBtnGlass: { ...StyleSheet.absoluteFill, backgroundColor: colors.glass },
        headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 12,
          gap: 14,
          borderRadius: 16,
          marginBottom: 4,
        },
        rowIcon: {
          width: 52,
          height: 52,
          borderRadius: 14,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        rowIconGlass: { ...StyleSheet.absoluteFill, backgroundColor: colors.glass },
        rowText: { flex: 1 },
        rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
        rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
        empty: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          gap: 10,
        },
        emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
        emptySub: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        emptyCta: {
          marginTop: 14,
          borderRadius: 24,
          overflow: 'hidden',
          paddingHorizontal: 28,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        emptyCtaGlass: { ...StyleSheet.absoluteFill, backgroundColor: colors.glass },
        emptyCtaText: { fontSize: 14, fontWeight: '700', color: colors.text },
        modalOverlay: {
          flex: 1,
          backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.35)',
          justifyContent: 'center',
          padding: 24,
        },
        modalCard: {
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          overflow: 'hidden',
          ...Platform.select({ android: { elevation: 8 } }),
        },
        modalGlass: {
          ...StyleSheet.absoluteFill,
          backgroundColor: isDark ? 'rgba(20,20,30,0.95)' : 'rgba(255,255,255,0.96)',
        },
        modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
        input: {
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: Platform.OS === 'ios' ? 14 : 10,
          fontSize: 16,
          color: colors.text,
          marginBottom: 20,
          backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.04)',
        },
        modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
        modalBtnGhost: { paddingVertical: 10, paddingHorizontal: 8 },
        modalBtnGhostText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
        modalBtnPrimary: {
          backgroundColor: colors.text,
          borderRadius: 20,
          paddingVertical: 10,
          paddingHorizontal: 20,
        },
        modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: colors.bg },
      }),
    [colors, isDark]
  );

  const onCreate = useCallback(async () => {
    const name = newName.trim() || t('library.defaultPlaylistName');
    await createPlaylist(name);
    setNewName('');
    setShowCreate(false);
  }, [createPlaylist, newName, t]);

  const confirmDelete = useCallback(
    (pl: UserPlaylistStored) => {
      Alert.alert(
        t('library.deletePlaylistTitle'),
        t('library.deletePlaylistMessage', { name: pl.name }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('library.delete'),
            style: 'destructive',
            onPress: () => void deletePlaylist(pl.id),
          },
        ]
      );
    },
    [deletePlaylist, t]
  );

  const renderItem = useCallback(
    ({ item }: { item: UserPlaylistStored }) => (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('UserPlaylist', { playlistId: item.id })}
        activeOpacity={0.75}
        {...a11yButton(item.name)}
      >
        <View style={styles.rowIcon}>
          <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.rowIconGlass} />
          <Ionicons name="musical-notes" size={22} color={colors.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.rowSub}>
            {t('common.songs', { count: item.tracks.length })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          {...a11yButton(t('library.deletePlaylistA11y', { name: item.name }))}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [confirmDelete, navigation, t, styles, colors.accent, colors.textMuted, isDark]
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
        <Text style={styles.headerTitle}>{t('library.yourPlaylists')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          {...a11yButton(t('library.createPlaylist'))}
        >
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.backBtnGlass} />
          <Ionicons name="add" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{t('library.playlistsEmpty')}</Text>
          <Text style={styles.emptySub}>{t('library.playlistsEmptyHint')}</Text>
          <TouchableOpacity style={styles.emptyCta} onPress={() => setShowCreate(true)}>
            <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.emptyCtaGlass} />
            <Text style={styles.emptyCtaText}>{t('library.createPlaylist')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreate(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.modalGlass} />
            <Text style={styles.modalTitle}>{t('library.createPlaylist')}</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={t('library.playlistNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={PLAYLIST_NAME_MAX}
              autoFocus
              autoCorrect={false}
              autoCapitalize="sentences"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalBtnGhostText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => void onCreate()}>
                <Text style={styles.modalBtnPrimaryText}>{t('common.create')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};
