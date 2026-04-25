import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { track } from '../lib/analytics';

const { width } = Dimensions.get('window');

const SLIDES: { icon: IconName; title: string; desc: string; gradient: readonly [string, string] }[] = [
  {
    icon: 'bar-chart',
    title: 'Track Every Rupee',
    desc: 'Add expenses in seconds with auto-categorization.\nSwiggy? Food. Uber? Transport. We get it.',
    gradient: ['#0D2B2B', '#0A1A2A'],
  },
  {
    icon: 'bot',
    title: 'Meet Tomo, Your AI Coach',
    desc: 'Ask anything about your finances.\nTomo gives personalized advice based on your spending habits.',
    gradient: ['#1A0D2B', '#0A1A2A'],
  },
  {
    icon: 'target',
    title: 'Budget Like a Pro',
    desc: 'Set spending limits per category.\nGet alerts before you overspend. Build habits that stick.',
    gradient: ['#0D1A2B', '#0A1A2A'],
  },
  {
    icon: 'lightbulb',
    title: 'Smart Insights',
    desc: 'Get personalized nudges and monthly insights.\nAri learns your patterns and helps you improve.',
    gradient: ['#0D2B1A', '#0A1A2A'],
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Completing onboarding implies consent to ToS / Privacy Policy
      // (which must be visible on these slides before launch). Captured
      // as a discrete event for DPDPA audit-trail; pair with the link
      // copy review the user owes a CA before live keys.
      track('consent_accepted', {
        flow: 'onboarding',
        slides_seen: SLIDES.length,
      });
      onComplete();
    }
  };

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.emojiContainer, { transform: [{ scale }], opacity }]}>
          <View style={styles.emojiRing}>
            <Icon name={item.icon} size={56} color={Colors.primary} />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.title, { opacity }]}>{item.title}</Animated.Text>
        <Animated.Text style={[styles.desc, { opacity }]}>{item.desc}</Animated.Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[SLIDES[currentIndex].gradient[0], SLIDES[currentIndex].gradient[1], '#0A0A0A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={onComplete} accessibilityLabel="Skip onboarding" accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        {/* Dots + Button */}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    { width: dotWidth, opacity: dotOpacity },
                  ]}
                />
              );
            })}
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85} accessibilityLabel={currentIndex === SLIDES.length - 1 ? "Let's Go" : "Next slide"} accessibilityRole="button">
            <Text style={styles.nextText}>
              {currentIndex === SLIDES.length - 1 ? "Let's Go!" : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emojiContainer: { marginBottom: 40 },
  emojiRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,200,150,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(0,200,150,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
    letterSpacing: 0.3,
  },
});
