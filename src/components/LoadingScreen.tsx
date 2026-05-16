import React, { useEffect, useRef } from 'react';
import { Animated, type DimensionValue } from 'react-native';
import { Colors } from '../theme/colors';

export const SkeletonCard: React.FC<{
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}> = ({ width = '100%', height = 50, borderRadius = 4 }) => {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: Colors.surface2,
        opacity: anim,
      }}
    />
  );
};
