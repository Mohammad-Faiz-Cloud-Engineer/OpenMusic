import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { searchSongs, getSuggestions, MAX_QUERY_LENGTH } from '../api/jiosaavn';
import { useTheme } from '../theme';
import { TrackCard } from '../components/TrackCard';
import { SectionHeader } from '../components/SectionHeader';
import { QueryErrorView } from '../components/QueryErrorView';
import { useTranslation } from 'react-i18next';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type SearchScreenProps = BottomTabScreenProps<TabParamList, 'Search'>;

export const SearchScreen: React.FC<SearchScreenProps> = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text.trim());
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurRef.current) clearTimeout(blurRef.current);
    };
  }, []);

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', debouncedQuery],
    queryFn: () => getSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && isFocused,
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchData, isLoading: searchLoading, isError: searchError, refetch } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchSongs(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const handleSuggestionPress = (suggestion: string) => {
    if (blurRef.current) clearTimeout(blurRef.current);
    setQuery(suggestion);
    setDebouncedQuery(suggestion);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  const showSuggestions =
    isFocused &&
    debouncedQuery.length >= 2 &&
    (suggestionsData?.suggestions?.length ?? 0) > 0;
  const showResults = !isFocused && debouncedQuery.length >= 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
        },
        header: {
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
        },
        headerTitle: {
          fontSize: 28,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 16,
          letterSpacing: -0.3,
        },
        searchBar: {
          flexDirection: 'row',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 20,
          paddingHorizontal: 14,
          height: 50,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        searchBarFocused: {
          borderColor: colors.glassBorderStrong,
        },
        searchIcon: { marginRight: 10 },
        searchBarGlass: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.glass },
        searchInput: {
          flex: 1,
          fontSize: 15,
          color: colors.text,
          height: '100%',
        },
        suggestionsContainer: {
          overflow: 'hidden',
          marginHorizontal: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          backgroundColor: colors.glass,
        },
        suggestionItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        },
        suggestionItemLast: {
          borderBottomWidth: 0,
        },
        suggestionText: {
          flex: 1,
          fontSize: 14,
          color: colors.text,
        },
        resultsContainer: {
          paddingBottom: 160,
        },
        emptyState: {
          alignItems: 'center',
          paddingTop: 60,
          gap: 8,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        emptySubtitle: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        idleState: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingBottom: 80,
        },
        idleTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginTop: 8,
        },
        idleSubtitle: {
          fontSize: 14,
          color: colors.textSecondary,
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('search.title')}
        </Text>

        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.searchBarGlass} />
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            maxLength={MAX_QUERY_LENGTH}
            onChangeText={handleQueryChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              if (blurRef.current) clearTimeout(blurRef.current);
              blurRef.current = setTimeout(() => setIsFocused(false), 150);
            }}
            onSubmitEditing={() => {
              setIsFocused(false);
              Keyboard.dismiss();
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {searchLoading && debouncedQuery.length >= 2 && (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />
          )}
        </View>
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestionsData?.suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.suggestionItem,
                i === (suggestionsData.suggestions.length - 1) && styles.suggestionItemLast,
              ]}
              onPress={() => handleSuggestionPress(s)}
            >
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <Text style={styles.suggestionText}>{s}</Text>
              <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showResults && (
        searchError ? (
          <QueryErrorView onRetry={() => void refetch()} />
        ) : (
          <FlatList
            data={searchData?.results ?? []}
            keyExtractor={(track) => track.id}
            contentContainerStyle={styles.resultsContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              searchData?.results?.length ? (
                <SectionHeader
                  title={t('search.resultsFor', { query: debouncedQuery })}
                  subtitle={t('common.songsFound', { count: searchData.results.length })}
                />
              ) : null
            }
            ListEmptyComponent={
              !searchLoading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>{t('common.noResults')}</Text>
                  <Text style={styles.emptySubtitle}>{t('common.noResultsHint')}</Text>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <TrackCard track={item} queue={searchData?.results} showIndex={index} />
            )}
            ListFooterComponent={<View style={{ height: 160 }} />}
          />
        )
      )}

      {!showResults && !showSuggestions && query.length === 0 && (
        <View style={styles.idleState}>
          <Ionicons name="search-outline" size={52} color={colors.textMuted} />
          <Text style={styles.idleTitle}>{t('search.idleTitle')}</Text>
          <Text style={styles.idleSubtitle}>{t('search.idleSubtitle')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};
