import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { a11yButton, a11yHeader } from '../utils/a11y';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onSeeAll, subtitle }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginBottom: 12,
          marginTop: 24,
        },
        left: { flex: 1 },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: -0.2,
        },
        subtitle: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
        seeAll: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title} {...a11yHeader(title)}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          {...a11yButton(t('common.seeAll'))}
        >
          <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
