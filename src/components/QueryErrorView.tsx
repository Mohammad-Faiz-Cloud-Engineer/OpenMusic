import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import { a11yButton } from '../utils/a11y';

interface QueryErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export const QueryErrorView: React.FC<QueryErrorViewProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color={Colors.red} />
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    color: Colors.accent,
    fontWeight: '600',
  },
});
