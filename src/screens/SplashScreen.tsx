import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../navigation/navigationTypes';
import { color, font, onForest } from '../theme/tokens';
import Icon from '../components/ui/Icon';

type Props = StackScreenProps<AuthStackParamList, 'Splash'>;

const FEATURES = [
  { icon: 'bar-chart' as const, title: 'Smart Tracking', desc: 'Auto-categorize every rupee' },
  { icon: 'bot' as const, title: 'Tomo AI Coach', desc: 'Personal finance advice, anytime' },
  { icon: 'target' as const, title: 'Budget Goals', desc: 'Hit your savings targets faster' },
];

const { height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: Props) {
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const f0 = useRef(new Animated.Value(0)).current;
  const f1 = useRef(new Animated.Value(0)).current;
  const f2 = useRef(new Animated.Value(0)).current;
  const featureOpacities = [f0, f1, f2];
  const buttonsY = useRef(new Animated.Value(40)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        120,
        featureOpacities.map((op) =>
          Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true })
        )
      ),
      Animated.parallel([
        Animated.spring(buttonsY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoSection,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <View style={styles.logoRing}>
            <Icon name="sprout" size={44} color={color.cream} />
          </View>
          <Text style={styles.appName}>Ari</Text>
          <Text style={styles.tagline}>Your Money, Your Future</Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              style={[styles.featureRow, { opacity: featureOpacities[i] }]}
            >
              <View style={styles.featureIcon}>
                <Icon name={f.icon} size={22} color={color.cream} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttons,
            {
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
            accessibilityLabel="Let's Get Started"
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Let&apos;s Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.75}
            accessibilityLabel="I already have an account"
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.forest },
  safe: { flex: 1, paddingHorizontal: 24 },
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: 48,
  },
  logoRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: color.forest2,
    borderWidth: 1,
    borderColor: color.moss,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontFamily: font.displayBold,
    fontSize: 48,
    color: color.cream,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: font.body,
    fontSize: 16,
    color: onForest.muted,
    letterSpacing: 0.5,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.forestDeep,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.forest2,
    padding: 16,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: color.forest2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontFamily: font.bodySemi,
    fontSize: 15,
    color: onForest.textBright,
    marginBottom: 3,
  },
  featureDesc: { fontFamily: font.body, fontSize: 13, color: onForest.muted },
  buttons: {
    paddingBottom: 16,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: color.clay,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: color.cream,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: font.body,
    fontSize: 15,
    color: onForest.muted,
  },
});
