import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  percentage: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({
  percentage,
  color = Colors.primary,
  height = 6,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: Math.min(percentage, 100),
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [percentage, anim]);

  const barColor =
    percentage > 100
      ? Colors.danger
      : percentage > 80
      ? Colors.accent
      : color;

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: barColor,
            width: anim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 99,
  },
});
