import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { color } from '../../theme/tokens';

interface Props {
  onPress: () => void;
}

export default function AnimatedFAB({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start();
  }, []);

  // Position above tab bar: 60px tab + insets.bottom + 16px gap
  const bottomPosition = 60 + insets.bottom + 16;

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          bottom: bottomPosition,
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.touchable}
        accessibilityLabel="Add new transaction"
        accessibilityRole="button"
      >
        <Icon name="plus" size={26} color={color.cream} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.clay,
    elevation: 6,
    shadowColor: color.clay,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
