import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { getCharts } from '../api/jiosaavn';
import { Colors } from '../theme/colors';
import { ChartCard } from '../components/ChartCard';
import { QueryErrorView } from '../components/QueryErrorView';
import { a11yButton } from '../utils/a11y';
import type { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<RootStackParamList, 'Charts'>;

export const ChartsScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['charts'],
    queryFn: getCharts,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          {...a11yButton(t('common.goBack'))}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('charts.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={styles.loader} />
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
          onRefresh={refetch}
          renderItem={({ item, index }) => (
            <ChartCard
              chart={item}
              index={index}
              onPress={() =>
                navigation.navigate('Playlist', { id: item.id, title: item.title })
              }
            />
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 8,
    letterSpacing: -0.2,
  },
  loader: {
    marginTop: 48,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
