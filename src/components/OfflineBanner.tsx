import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surface2,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        textWrap: { flex: 1 },
        title: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
        },
        hint: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 1,
        },
      }),
    [colors]
  );

  if (isOnline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={16} color={colors.text} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{t('common.offline')}</Text>
        <Text style={styles.hint}>{t('common.offlineHint')}</Text>
      </View>
    </View>
  );
};
