import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { TimelineChart } from '@components/temporal/TimelineChart';
import { api } from '@api/client';
import { TEMPORAL } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const RANGE_PRESETS = [
  { label: '3 Months', days: 90, interval: 7 },
  { label: '6 Months', days: 180, interval: 7 },
  { label: '1 Year', days: 365, interval: 14 },
  { label: '2 Years', days: 730, interval: 14 },
  { label: '5 Years', days: 1825, interval: 60 },
  { label: '10 Years', days: 3650, interval: 60 },
  { label: '20 Years', days: 7300, interval: 90 },
];

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TemporalTimelineScreen() {
  const { lifeAreaId, lifeAreaName, chartParamsJson } = useLocalSearchParams<{
    lifeAreaId: string;
    lifeAreaName: string;
    chartParamsJson: string;
  }>();

  const chartParams = useMemo(() => {
    try { return JSON.parse(chartParamsJson || '{}'); }
    catch { return {}; }
  }, [chartParamsJson]);

  const [rangeIdx, setRangeIdx] = useState(2); // default: 1 Year
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const preset = RANGE_PRESETS[rangeIdx];

  const handleLoadTimeline = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      const endDate = addDays(today, preset.days);

      const res = await api.post(TEMPORAL.TIMELINE, {
        ...chartParams,
        life_area_id: lifeAreaId,
        scan_start: formatDate(today),
        scan_end: formatDate(endDate),
        interval_days: preset.interval,
      });

      setTimelineData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const points = timelineData?.points || [];
  const peaks = timelineData?.peaks || {};
  const peakOpp = peaks.opportunity || null;
  const peakThreat = peaks.threat || null;

  // Count stats
  const oppCount = points.filter((p: any) => p.window_type === 'opportunity').length;
  const threatCount = points.filter((p: any) => p.window_type === 'threat').length;
  const mixedCount = points.filter((p: any) => p.window_type === 'mixed').length;

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{lifeAreaName} Timeline</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Range control */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Scan Range</Text>
          <View style={styles.presetRow}>
            {RANGE_PRESETS.map((p, idx) => (
              <Pressable
                key={p.label}
                onPress={() => setRangeIdx(idx)}
                style={[styles.presetChip, rangeIdx === idx && styles.presetChipActive]}
              >
                <Text style={[styles.presetText, rangeIdx === idx && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.rangeLabel}>Every {preset.interval} days</Text>
        </GlassCard>

        <GradientButton
          title={loading ? 'Computing...' : 'Load Timeline'}
          onPress={handleLoadTimeline}
          loading={loading}
          disabled={loading}
        />

        {loading && <LoadingSpinner message="Scanning timeline..." />}

        {!loading && timelineData && (
          <>
            {/* Peak badges */}
            <View style={styles.peakRow}>
              {peakOpp && (
                <View style={[styles.peakBadge, { backgroundColor: `${colors.success}15` }]}>
                  <Ionicons name="trending-up" size={14} color={colors.success} />
                  <Text style={[styles.peakText, { color: colors.success }]}>
                    Peak Opp: {peakOpp.date} ({Math.round(peakOpp.score)})
                  </Text>
                </View>
              )}
              {peakThreat && (
                <View style={[styles.peakBadge, { backgroundColor: `${colors.malefic}15` }]}>
                  <Ionicons name="trending-down" size={14} color={colors.malefic} />
                  <Text style={[styles.peakText, { color: colors.malefic }]}>
                    Peak Threat: {peakThreat.date} ({Math.round(peakThreat.score)})
                  </Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: colors.success }]}>{oppCount} opportunity</Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={[styles.statText, { color: colors.malefic }]}>{threatCount} threat</Text>
              <Text style={styles.statDot}>·</Text>
              <Text style={[styles.statText, { color: colors.warning }]}>{mixedCount} mixed</Text>
            </View>

            {/* Chart */}
            <GlassCard noPadding style={styles.chartCard}>
              <TimelineChart
                points={points}
                peakOpp={peakOpp}
                peakThreat={peakThreat}
              />
            </GlassCard>

            {/* Point count */}
            <Text style={styles.pointCount}>
              {points.length} data point{points.length !== 1 ? 's' : ''}
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text, flex: 1 },
  sectionTitle: { ...typography.styles.body, color: colors.text, fontWeight: '600', marginBottom: 8 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipActive: {
    backgroundColor: `${colors.accent}20`,
    borderColor: colors.accent,
  },
  presetText: { ...typography.styles.caption, color: colors.muted },
  presetTextActive: { color: colors.accent, fontWeight: '600' },
  rangeLabel: { ...typography.styles.caption, color: colors.accent, textAlign: 'center', marginTop: 8 },
  peakRow: { gap: 8 },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  peakText: { ...typography.styles.caption, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statText: { ...typography.styles.caption, fontWeight: '600' },
  statDot: { ...typography.styles.caption, color: colors.muted },
  chartCard: { padding: 12 },
  pointCount: { ...typography.styles.caption, color: colors.muted, textAlign: 'center' },
});
