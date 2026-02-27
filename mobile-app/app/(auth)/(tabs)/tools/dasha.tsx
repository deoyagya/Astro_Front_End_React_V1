import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { DashaPeriodCard } from '@components/dasha/DashaPeriodCard';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';
import { dashaNavStore } from '@stores/dashaNavStore';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function DashaScreen() {
  const { loaded: birthDataLoaded, savedData } = useBirthData({ reportType: 'dasha' });
  // Determine data source: active chart (from saved-charts) or user's own (from hook)
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashaData, setDashaData] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);
  const cardYPositions = useRef<Record<number, number>>({});

  const fetchDasha = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob || !effectiveData?.place_of_birth) return;
    setLoading(true);
    setError('');
    try {
      const body = {
        name: effectiveData.name || 'Chart',
        dob: effectiveData.dob,
        tob: effectiveData.tob,
        gender: effectiveData.gender || undefined,
        place_of_birth: effectiveData.place_of_birth,
      };
      const data = await api.post(
        `${CHART.CREATE}?include_dasha=true&dasha_depth=5`,
        body
      );
      const bundle = data?.bundle || data;
      setDashaData(bundle);

      // Cache the full tree for sub-level screens
      const tree = bundle?.dasha_tree || [];
      dashaNavStore.setTree(tree);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate dasha');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth, effectiveData?.name, effectiveData?.gender]);

  useEffect(() => {
    if (!birthDataLoaded || !effectiveData?.dob) return;
    fetchDasha();
  }, [birthDataLoaded, fetchDasha]);

  const periods: any[] = dashaData?.dasha_tree || [];

  // Find current Mahadasha index
  const currentIdx = useMemo(() => {
    const now = new Date();
    return periods.findIndex((p: any) => {
      const s = new Date(p.start_date || p.start);
      const e = new Date(p.end_date || p.end);
      return now >= s && now <= e;
    });
  }, [periods]);

  const currentMaha = currentIdx >= 0
    ? (periods[currentIdx]?.planet || periods[currentIdx]?.lord)
    : null;

  // Auto-scroll to current Mahadasha after layout
  const handleCardLayout = useCallback((idx: number, e: LayoutChangeEvent) => {
    cardYPositions.current[idx] = e.nativeEvent.layout.y;
    if (idx === currentIdx && scrollRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        const y = cardYPositions.current[idx];
        if (y != null) {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
        }
      }, 300);
    }
  }, [currentIdx]);

  const handlePress = (idx: number) => {
    const period = periods[idx];
    const subs = period.sub_periods || period.children || [];
    if (subs.length > 0) {
      router.push(`/(auth)/(tabs)/tools/dasha-level?path=${idx}` as any);
    }
  };

  // No birth data — show CTA
  if (birthDataLoaded && (!effectiveData?.dob || !effectiveData?.place_of_birth)) {
    return (
      <Screen>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Dasha Timeline</Text>
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="time-outline" size={64} color={colors.accent2} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details Found</Text>
            <Text style={styles.emptySubtitle}>
              Enter your birth details to view your complete Vimshottari Dasha timeline (5 levels deep).
            </Text>
            <GradientButton
              title="Enter Birth Details"
              onPress={() => router.navigate('/(auth)/(tabs)/birth-details' as any)}
            />
          </GlassCard>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Dasha Timeline</Text>
            <Text style={styles.subtitle}>Vimshottari — tap any period to drill down</Text>
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => router.navigate('/(auth)/(tabs)/birth-details' as any)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={styles.editText}>Edit Details</Text>
          </Pressable>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {loading && <LoadingSpinner message="Calculating dasha periods..." />}

        {periods.length > 0 && !loading && (
          <>
            {/* Current period summary */}
            {currentMaha && (
              <GlassCard>
                <Text style={styles.summaryLabel}>Current Mahadasha</Text>
                <Text style={styles.summaryPlanet}>{currentMaha}</Text>
              </GlassCard>
            )}

            {/* Mahadasha period cards */}
            <View style={styles.cardList}>
              {periods.map((period: any, idx: number) => {
                const isCurrent = idx === currentIdx;
                const subs = period.sub_periods || period.children || [];
                return (
                  <View
                    key={`md-${period.planet || period.lord}-${idx}`}
                    onLayout={(e) => handleCardLayout(idx, e)}
                  >
                    <DashaPeriodCard
                      planet={period.planet || period.lord}
                      startDate={period.start_date || period.start}
                      endDate={period.end_date || period.end}
                      levelLabel="Mahadasha"
                      isCurrent={isCurrent}
                      hasChildren={subs.length > 0}
                      onPress={() => handlePress(idx)}
                    />
                  </View>
                );
              })}
            </View>

            <GradientButton
              title="Refresh Dasha"
              variant="secondary"
              onPress={fetchDasha}
              loading={loading}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  title: { ...typography.styles.h2, color: colors.text },
  subtitle: { ...typography.styles.bodySmall, color: colors.muted, marginTop: 2 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(123,91,255,0.1)',
  },
  editText: { ...typography.styles.caption, color: colors.accent, fontWeight: '600' },

  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: {
    ...typography.styles.body, color: colors.muted, textAlign: 'center', paddingHorizontal: 16,
  },

  summaryLabel: { ...typography.styles.label, color: colors.muted },
  summaryPlanet: { ...typography.styles.h2, color: colors.success, marginTop: 4 },

  cardList: { gap: 8 },
});
