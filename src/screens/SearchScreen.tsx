import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { searchSongs, getSuggestions, Track } from '../api/jiosaavn';
import { Colors } from '../theme/colors';
import { TrackCard } from '../components/TrackCard';
import { SectionHeader } from '../components/SectionHeader';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GENRE_KEYS = [
  { key: 'bollywood', query: 'bollywood hits 2025', color: ['#A855F7', '#7C3AED'] as const, icon: '🎬' },
  { key: 'punjabi', query: 'punjabi hits', color: ['#EC4899', '#BE185D'] as const, icon: '🎵' },
  { key: 'romantic', query: 'romantic hindi songs', color: ['#EF4444', '#DC2626'] as const, icon: '❤️' },
  { key: 'party', query: 'party songs hindi', color: ['#F59E0B', '#D97706'] as const, icon: '🎉' },
  { key: 'arijit', query: 'arijit singh', color: ['#3B82F6', '#1D4ED8'] as const, icon: '🎤' },
  { key: 'devotional', query: 'devotional songs hindi', color: ['#10B981', '#059669'] as const, icon: '🙏' },
  { key: 'retro', query: 'old hindi songs classic', color: ['#8B5CF6', '#6D28D9'] as const, icon: '📻' },
  { key: 'english', query: 'english pop hits 2025', color: ['#06B6D4', '#0891B2'] as const, icon: '🌍' },
] as const;

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type SearchScreenProps = BottomTabScreenProps<TabParamList, 'Search'>;

export const SearchScreen: React.FC<SearchScreenProps> = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text.trim());
    }, 400);
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['suggestions', debouncedQuery],
    queryFn: () => getSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && isFocused,
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchSongs(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    setDebouncedQuery(suggestion);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const genreCategories = GENRE_KEYS.map((g) => ({
    ...g,
    label: t(`categories.${g.key}`),
  }));

  const handleCategoryPress = (cat: (typeof genreCategories)[0]) => {
    setQuery(cat.label);
    setDebouncedQuery(cat.query);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  };

  const showSuggestions = isFocused && debouncedQuery.length >= 2 && (suggestionsData?.suggestions?.length ?? 0) > 0;
  const showResults = !isFocused && debouncedQuery.length >= 2;
  const showCategories = !debouncedQuery;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('search.title')}
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onSubmitEditing={() => {
              setIsFocused(false);
              Keyboard.dismiss();
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {searchLoading && debouncedQuery.length >= 2 && (
            <ActivityIndicator size="small" color={Colors.accent} style={{ marginLeft: 8 }} />
          )}
        </View>
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {suggestionsData?.suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(s)}
            >
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.suggestionText}>{s}</Text>
              <Ionicons name="arrow-back" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Categories */}
      {showCategories && (
        <FlatList
          data={genreCategories}
          keyExtractor={(c) => c.label}
          numColumns={2}
          contentContainerStyle={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.categoriesTitle}>{t('search.browseCategories')}</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={item.color}
                style={styles.categoryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Search Results */}
      {showResults && (
        <FlatList
          data={searchData?.results ?? []}
          keyExtractor={(t) => t.id}
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
                <Text style={styles.emptyIcon}>🎵</Text>
                <Text style={styles.emptyTitle}>{t('common.noResults')}</Text>
                <Text style={styles.emptySubtitle}>{t('common.noResultsHint')}</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <TrackCard
              track={item}
              queue={searchData?.results}
              showIndex={index}
            />
          )}
          ListFooterComponent={<View style={{ height: 160 }} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.bg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: '100%',
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    zIndex: 100,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
    marginTop: 8,
  },
  categoryCard: {
    flex: 1,
    margin: 5,
    borderRadius: 14,
    overflow: 'hidden',
    height: 90,
  },
  categoryGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Results
  resultsContainer: {
    paddingBottom: 160,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },
});
