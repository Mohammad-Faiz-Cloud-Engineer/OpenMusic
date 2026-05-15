import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.text} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{t('common.offline')}</Text>
        <Text style={styles.hint}>{t('common.offlineHint')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  hint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
