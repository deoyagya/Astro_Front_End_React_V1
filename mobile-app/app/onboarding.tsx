import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const SLIDES = [
  {
    icon: 'logo',
    iconColor: '#7b5bff',
    bgGrad: ['rgba(123,91,255,0.25)', 'rgba(5,9,20,1)'] as [string, string],
    title: 'Your Cosmic Blueprint',
    subtitle: 'Generate precise Vedic birth charts with planetary positions, dignities, and divisional charts for your personalized reading.',
  },
  {
    icon: 'sparkles',
    iconColor: '#43d0ff',
    bgGrad: ['rgba(67,208,255,0.2)', 'rgba(5,9,20,1)'] as [string, string],
    title: 'AI-Powered Predictions',
    subtitle: 'Get personalized horoscope predictions backed by classical Jyotish wisdom and modern AI interpretation for every area of your life.',
  },
  {
    icon: 'heart',
    iconColor: '#ff6b8a',
    bgGrad: ['rgba(255,107,138,0.2)', 'rgba(5,9,20,1)'] as [string, string],
    title: 'Compatibility & Matching',
    subtitle: 'Ashtakoot Guna Milan with detailed 8-guna scoring — Nadi Dosha detection, remedies, and complete relationship analysis.',
  },
  {
    icon: 'document-text',
    iconColor: '#FFD700',
    bgGrad: ['rgba(255,215,0,0.15)', 'rgba(5,9,20,1)'] as [string, string],
    title: 'Life Area Reports',
    subtitle: 'Deep 25+ page Vedic analysis reports for Career, Love, Health, Education, Spirituality & Family — with personalized remedies.',
  },
];

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <LinearGradient colors={item.bgGrad} style={[styles.slide, { width, height: height * 0.72 }]}>
            <View style={styles.slideContent}>
              {item.icon === 'logo' ? (
                <View style={styles.iconWrap}>
                  <Image
                    source={require('@assets/logo.png')}
                    style={styles.logoSlide}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={[styles.iconWrap, { shadowColor: item.iconColor }]}>
                  <LinearGradient
                    colors={[`${item.iconColor}40`, `${item.iconColor}10`]}
                    style={styles.iconGlow}
                  >
                    <Ionicons name={item.icon as any} size={56} color={item.iconColor} />
                  </LinearGradient>
                </View>
              )}
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </LinearGradient>
        )}
      />

      {/* Bottom controls */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          {currentIndex < SLIDES.length - 1 ? (
            <>
              <Pressable onPress={finishOnboarding}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable onPress={goNext} style={styles.nextBtn}>
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </>
          ) : (
            <Pressable onPress={finishOnboarding} style={styles.getStartedBtn}>
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 20,
  },
  iconWrap: {
    marginBottom: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  iconGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSlide: {
    width: 150,
    height: 100,
    borderRadius: 10,
  },
  slideTitle: {
    ...typography.styles.h1,
    color: colors.text,
    textAlign: 'center',
  },
  slideSubtitle: {
    ...typography.styles.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 24,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipText: {
    ...typography.styles.body,
    color: colors.muted,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextText: {
    ...typography.styles.body,
    color: '#fff',
    fontWeight: '600',
  },
  getStartedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
  },
  getStartedText: {
    ...typography.styles.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
});
