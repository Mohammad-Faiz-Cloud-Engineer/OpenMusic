import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, type DimensionValue, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export const SkeletonCard: React.FC<{
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}> = ({ width = '100%', height = 50, borderRadius = 4 }) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface2,
        },
      }),
    [colors.surface2, width, height, borderRadius]
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[styles.base, { opacity: anim }]}
    />
  );
};
