import React from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const QUICK_ACTIONS = [
  { label: 'Birth Chart', icon: 'planet', color: '#7b5bff', route: '/tools/birth-chart' },
  { label: 'Dasha', icon: 'time', color: '#43d0ff', route: '/tools/dasha' },
  { label: 'Match', icon: 'heart', color: '#ff6b8a', route: '/tools/compatibility' },
  { label: 'Horoscope', icon: 'telescope', color: '#ffa502', route: '/tools/horoscope' },
];

const FEATURED = [
  { label: 'Life Area Reports', icon: 'document-text', desc: 'Deep Vedic analysis', route: '/reports' },
  { label: 'My Reports', icon: 'download', desc: 'Download purchased', route: '/reports/my-reports' },
];

const AFFIRMATIONS = [
  'The cosmos aligns in your favor today.',
  'Trust the divine timing of your life.',
  'Your inner light guides every step forward.',
  'Planetary energies support your growth.',
  'Each moment unfolds as it is meant to.',
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 10) / 2;
  const todayAffirmation = AFFIRMATIONS[new Date().getDate() % AFFIRMATIONS.length];

  const navigateTo = (route: string) => {
    router.navigate(route as any);
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Daily Alignment */}
        <GlassCard>
          <View style={styles.alignmentHeader}>
            <Ionicons name="sparkles" size={18} color={colors.accent2} />
            <Text style={styles.alignmentTitle}>Daily Alignment</Text>
          </View>
          <Text style={styles.affirmation}>{todayAffirmation}</Text>
        </GlassCard>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <GlassCard
              key={action.label}
              onPress={() => navigateTo(action.route)}
              style={[styles.quickCard, { width: cardWidth }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Featured sections */}
        <Text style={styles.sectionTitle}>Explore</Text>
        {FEATURED.map((item) => (
          <GlassCard
            key={item.label}
            onPress={() => navigateTo(item.route)}
            style={styles.featuredCard}
          >
            <View style={styles.featuredIcon}>
              <Ionicons name={item.icon as any} size={20} color={colors.accent} />
            </View>
            <View style={styles.featuredText}>
              <Text style={styles.featuredLabel}>{item.label}</Text>
              <Text style={styles.featuredDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </GlassCard>
        ))}

        {/* Decorative glow */}
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={['rgba(123,91,255,0.15)', 'transparent']}
            style={styles.glow1}
          />
          <LinearGradient
            colors={['rgba(67,208,255,0.1)', 'transparent']}
            style={styles.glow2}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  alignmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alignmentTitle: { ...typography.styles.label, color: colors.accent2 },
  affirmation: { ...typography.styles.bodySmall, color: colors.text, fontStyle: 'italic', lineHeight: 22 },
  sectionTitle: { ...typography.styles.h3, color: colors.text, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    ...typography.styles.caption,
    color: colors.text,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featuredIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(123,91,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredText: { flex: 1 },
  featuredLabel: { ...typography.styles.label, color: colors.text, fontWeight: '600', fontSize: 13 },
  featuredDesc: { ...typography.styles.caption, color: colors.muted },
  glowContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, zIndex: -1 },
  glow1: { position: 'absolute', top: -60, left: -40, width: 200, height: 200, borderRadius: 100 },
  glow2: { position: 'absolute', top: -20, right: -60, width: 180, height: 180, borderRadius: 90 },
});
