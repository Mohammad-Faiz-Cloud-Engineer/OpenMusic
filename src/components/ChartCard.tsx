import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Chart } from '../api/jiosaavn';
import { a11yButton } from '../utils/a11y';

interface ChartCardProps {
  chart: Chart;
  onPress: () => void;
  index?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({ chart, onPress, index }) => {
  const placeholder = require('../../assets/placeholder.png');
  const imageSource = chart.thumbnail ? { uri: chart.thumbnail } : placeholder;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      {...a11yButton(chart.title)}
    >
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFill}
        />
        {index !== undefined && (
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>#{index + 1}</Text>
          </View>
        )}
        <View style={styles.playBtn}>
          <Ionicons name="play" size={18} color="#fff" />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {chart.title}
        </Text>
        {chart.description ? (
          <Text style={styles.desc} numberOfLines={1}>
            {chart.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    marginRight: 12,
  },
  imageContainer: {
    width: 160,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  indexBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  playBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  info: {
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  desc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
