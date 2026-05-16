import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { getCharts } from '../api/jiosaavn';
import { useTheme } from '../theme';
import { ChartCard } from '../components/ChartCard';
import { QueryErrorView } from '../components/QueryErrorView';
import { a11yButton } from '../utils/a11y';
import type { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'Charts'>;

export const ChartsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors, gradients, isDark } = useTheme();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['charts'],
    queryFn: getCharts,
    staleTime: 10 * 60 * 1000,
  });

  const handleRefresh = useCallback(() => { void refetch(); }, [refetch]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bg },
        header: {
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
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
        loader: { marginTop: 48 },
        list: { paddingHorizontal: 16, paddingBottom: 160 },
        row: { justifyContent: 'space-between', marginBottom: 16 },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} {...a11yButton(t('common.goBack'))}>
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={styles.backBtnGlass} />
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('charts.title')}</Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : isError ? (
        <QueryErrorView onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.charts ?? []}
          keyExtractor={(c) => c.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshing={isFetching && !isLoading}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <ChartCard
              chart={item}
              onPress={() => navigation.navigate('Playlist', { id: item.id, title: item.title })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};
