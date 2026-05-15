import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          {...a11yButton(t('common.goBack'))}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: 12,
  },
});
