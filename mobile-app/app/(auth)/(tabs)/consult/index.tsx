import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { usePremiumGate } from '@hooks/usePremiumGate';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface FeatureCard {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  requiresPremium: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    label: 'AI Vedic Chat',
    description: 'Ask questions about 13 life areas with cross-validated AI responses',
    icon: 'chatbubbles-outline',
    color: colors.accent,
    route: '/(auth)/(tabs)/consult/chat-areas',
    requiresPremium: true,
  },
  {
    label: 'Temporal Forecast',
    description: 'See opportunity & threat windows across all life areas over time',
    icon: 'trending-up-outline',
    color: colors.success,
    route: '/(auth)/(tabs)/consult/temporal-forecast',
    requiresPremium: true,
  },
];

export default function ConsultLandingScreen() {
  const { isPremium } = usePremiumGate();

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Premium Consultation</Text>
        <Text style={styles.subtitle}>
          Advanced AI-powered Vedic astrology insights
        </Text>

        {FEATURES.map((feature) => (
          <GlassCard
            key={feature.label}
            onPress={() => {
              if (feature.requiresPremium && !isPremium) {
                router.push('/(auth)/(tabs)/my-data/subscription' as any);
                return;
              }
              router.push(feature.route as any);
            }}
            style={styles.featureCard}
          >
            <View style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${feature.color}15` }]}>
                <Ionicons name={feature.icon} size={28} color={feature.color} />
              </View>
              <View style={styles.featureText}>
                <View style={styles.labelRow}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  {feature.requiresPremium && !isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="lock-closed" size={10} color={colors.warning} />
                      <Text style={styles.premiumBadgeText}>Premium</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
          </GlassCard>
        ))}

        {!isPremium && (
          <GlassCard style={styles.upgradeCard}>
            <Ionicons name="diamond-outline" size={32} color={colors.warning} />
            <Text style={styles.upgradeTitle}>Unlock Premium Features</Text>
            <Text style={styles.upgradeDesc}>
              Get AI-powered consultations, temporal forecasts, and more with a Premium subscription.
            </Text>
            <GradientButton
              title="View Plans"
              onPress={() => router.push('/(auth)/(tabs)/my-data/subscription' as any)}
              style={styles.upgradeBtn}
            />
          </GlassCard>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  title: { ...typography.styles.h2, color: colors.text, paddingTop: 8 },
  subtitle: { ...typography.styles.bodySmall, color: colors.muted, marginBottom: 8 },
  featureCard: { paddingVertical: 14, paddingHorizontal: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureLabel: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  featureDesc: { ...typography.styles.caption, color: colors.muted },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,180,84,0.12)',
  },
  premiumBadgeText: { ...typography.styles.caption, color: colors.warning, fontSize: 10 },
  upgradeCard: { alignItems: 'center', paddingVertical: 28, gap: 10, marginTop: 8 },
  upgradeTitle: { ...typography.styles.h3, color: colors.text },
  upgradeDesc: {
    ...typography.styles.bodySmall,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  upgradeBtn: { marginTop: 8, width: '80%' },
});
