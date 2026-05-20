import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import type { LyricLine } from '../api/jiosaavn';
import { a11yButton } from '../utils/a11y';

interface LyricsViewProps {
  lines: LyricLine[];
  currentPositionMs: number;
  hasTimedLyrics: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

const LINE_HEIGHT = 52;

const LyricsView: React.FC<LyricsViewProps> = ({
  lines,
  currentPositionMs,
  hasTimedLyrics,
  onClose,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const listRef = useRef<FlatList<LyricLine>>(null);
  const prevActiveRef = useRef(-1);

  const currentLineIndex = useMemo(() => {
    if (!hasTimedLyrics || lines.length === 0) return -1;
    const sec = currentPositionMs / 1000;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time >= 0 && lines[i].time <= sec) {
        idx = i;
      }
    }
    return idx;
  }, [currentPositionMs, lines, hasTimedLyrics]);

  useEffect(() => {
    if (currentLineIndex >= 0 && hasTimedLyrics && currentLineIndex !== prevActiveRef.current) {
      prevActiveRef.current = currentLineIndex;
      listRef.current?.scrollToIndex({
        index: currentLineIndex,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [currentLineIndex, hasTimedLyrics]);

  const renderItem = useCallback(
    ({ item, index }: { item: LyricLine; index: number }) => {
      const isActive = index === currentLineIndex;
      const isPast = hasTimedLyrics && currentLineIndex >= 0 && index < currentLineIndex;
      return (
        <View style={[styles.lineWrap, { height: LINE_HEIGHT }]}>
          <Text
            style={[
              styles.line,
              {
                color: isActive
                  ? colors.text
                  : isPast
                    ? colors.textSecondary
                    : colors.textMuted,
                fontSize: isActive ? 17 : 14,
                fontWeight: isActive ? '700' : '400',
              },
            ]}
            numberOfLines={2}
          >
            {item.text}
          </Text>
        </View>
      );
    },
    [currentLineIndex, colors, hasTimedLyrics]
  );

  const keyExtractor = useCallback((_item: LyricLine, index: number) => `${index}`, []);

  const listHeight = height * 0.52;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {t('player.lyricsLoading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color={colors.textMuted} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {t('player.lyricsError')}
        </Text>
      </View>
    );
  }

  if (!lines.length) {
    return (
      <View style={styles.centered}>
        <Ionicons name="musical-notes-outline" size={44} color={colors.textMuted} />
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {t('player.lyricsUnavailable')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={lines}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={[styles.list, { maxHeight: listHeight }]}
        contentContainerStyle={styles.listContent}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={7}
        removeClippedSubviews={false}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  list: {
    width: '100%',
  },
  listContent: {
    paddingVertical: 12,
  },
  lineWrap: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  line: {
    textAlign: 'center',
    lineHeight: 22,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    minHeight: 200,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default LyricsView;