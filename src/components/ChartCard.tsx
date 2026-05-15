import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Chart } from '../api/jiosaavn';
import { a11yButton } from '../utils/a11y';

interface ChartCardProps {
  chart: Chart;
  onPress: () => void;
  index?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({ chart, onPress }) => {
  const placeholder = require('../../assets/placeholder.png');
  const imageSource = chart.thumbnail ? { uri: chart.thumbnail } : placeholder;

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

const styles = StyleSheet.create({
  card: { width: 160, marginRight: 12 },
  imageWrap: {
    width: 160,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
  },
  image: { width: '100%', height: '100%' },
  playBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 10 },
  desc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
