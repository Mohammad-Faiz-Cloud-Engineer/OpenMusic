import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Chart } from '../api/jiosaavn';
import { a11yButton } from '../utils/a11y';

const placeholder = require('../../assets/placeholder.png');

interface ChartCardProps {
  chart: Chart;
  onPress: () => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({ chart, onPress }) => {
  const { colors } = useTheme();
  const imageSource = chart.thumbnail ? { uri: chart.thumbnail } : placeholder;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { width: 160, marginRight: 12 },
        imageWrap: {
          width: 160,
          height: 160,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.surface2,
        },
        image: { width: '100%', height: '100%' },
        playBtn: {
          position: 'absolute',
          bottom: 10,
          right: 10,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        },
        title: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 10 },
        desc: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
      }),
    [colors]
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      {...a11yButton(chart.title)}
    >
      <View style={styles.imageWrap}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.playBtn}>
          <Ionicons name="play" size={16} color="#000" />
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{chart.title}</Text>
      {chart.description ? (
        <Text style={styles.desc} numberOfLines={1}>{chart.description}</Text>
      ) : null}
    </TouchableOpacity>
  );
};
