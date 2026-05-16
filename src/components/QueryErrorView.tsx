import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { a11yButton } from '../utils/a11y';

interface QueryErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export const QueryErrorView: React.FC<QueryErrorViewProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 12,
        },
        title: {
          fontSize: 15,
          fontWeight: '400',
          color: colors.textSecondary,
          textAlign: 'center',
        },
        button: {
          marginTop: 8,
          borderWidth: 1,
          borderColor: colors.textSecondary,
          paddingHorizontal: 28,
          paddingVertical: 10,
          borderRadius: 20,
        },
        buttonText: {
          color: colors.text,
          fontWeight: '700',
          fontSize: 13,
          letterSpacing: 0.5,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={44} color={colors.textMuted} />
      <Text style={styles.title}>{message ?? t('common.errorLoad')}</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRetry}
          {...a11yButton(t('common.retry'))}
        >
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
