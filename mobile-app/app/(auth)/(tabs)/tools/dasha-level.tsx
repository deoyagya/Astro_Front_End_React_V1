import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { DashaPeriodCard } from '@components/dasha/DashaPeriodCard';
import { dashaNavStore } from '@stores/dashaNavStore';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const LEVEL_NAMES = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Prana'];

export default function DashaLevelScreen() {
  const { path } = useLocalSearchParams<{ path: string }>();

  const { periods, breadcrumbs, level } = useMemo(() => {
    if (!path) return { periods: [], breadcrumbs: [], level: 0 };
    return dashaNavStore.getAtPath(path);
  }, [path]);

  const levelName = LEVEL_NAMES[level] || `Level ${level + 1}`;

  // Detect current period at this level
  const currentIdx = useMemo(() => {
    const now = new Date();
    return periods.findIndex((p: any) => {
      const s = new Date(p.start_date || p.start);
      const e = new Date(p.end_date || p.end);
      return now >= s && now <= e;
    });
  }, [periods]);

  const handlePress = (idx: number) => {
    const period = periods[idx];
    const subs = period.sub_periods || period.children || [];
    if (subs.length > 0) {
      router.push(`/(auth)/(tabs)/tools/dasha-level?path=${path}.${idx}` as any);
    }
  };

  // Empty state — tree not cached or invalid path
  if (periods.length === 0) {
    return (
      <Screen>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.warning} />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>
              Go back to the Dasha Timeline and tap a period to view sub-levels.
            </Text>
          </GlassCard>
          <GradientButton title="Go Back" onPress={() => router.back()} />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Breadcrumb */}
        <Text style={styles.breadcrumb}>
          {breadcrumbs.join('  >  ')}
        </Text>

        {/* Level title */}
        <Text style={styles.title}>{levelName} Periods</Text>
        <Text style={styles.subtitle}>
          {periods.length} periods — tap to drill deeper
        </Text>

        {/* Period cards */}
        <View style={styles.cardList}>
          {periods.map((period: any, idx: number) => {
            const isCurrent = idx === currentIdx;
            const subs = period.sub_periods || period.children || [];
            return (
              <DashaPeriodCard
                key={`${period.planet || period.lord}-${idx}`}
                planet={period.planet || period.lord}
                startDate={period.start_date || period.start}
                endDate={period.end_date || period.end}
                levelLabel={levelName}
                isCurrent={isCurrent}
                hasChildren={subs.length > 0}
                onPress={() => handlePress(idx)}
              />
            );
          })}
        </View>

        {/* Back button */}
        <GradientButton
          title="Back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  breadcrumb: {
    ...typography.styles.body,
    color: colors.accent,
    fontWeight: '700',
    paddingTop: 4,
  },
  title: { ...typography.styles.h3, color: colors.text },
  subtitle: { ...typography.styles.caption, color: colors.muted },
  cardList: { gap: 8 },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: {
    ...typography.styles.body, color: colors.muted, textAlign: 'center', paddingHorizontal: 16,
  },
});
