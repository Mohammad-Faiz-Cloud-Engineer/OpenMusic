import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useToastStore } from '../store/toastStore';

export const Toast: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const visible = useToastStore((s) => s.visible);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 260,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          bottom: insets.bottom + 90,
          left: 16,
          right: 16,
          alignItems: 'center',
          zIndex: 999,
        },
        toast: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: 16,
          overflow: 'hidden',
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        text: {
          fontSize: 14,
          fontWeight: '500',
          color: colors.text,
          flexShrink: 1,
        },
      }),
    [colors, insets.bottom]
  );

  return (
    <Animated.View
      style={[
        styles.wrap,
        { transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        <BlurView
          intensity={isDark ? 60 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};
