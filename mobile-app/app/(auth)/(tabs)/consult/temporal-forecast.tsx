import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { LifeAreaCard } from '@components/temporal/LifeAreaCard';
import { usePremiumGate } from '@hooks/usePremiumGate';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHART, TEMPORAL } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

type FilterType = 'all' | 'opportunity' | 'threat' | 'mixed';

const FILTERS: { key: FilterType; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: colors.text },
  { key: 'opportunity', label: 'Opportunity', color: colors.success },
  { key: 'threat', label: 'Threat', color: colors.malefic },
  { key: 'mixed', label: 'Mixed', color: colors.warning },
];

export default function TemporalForecastScreen() {
  const { isPremium } = usePremiumGate();
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [results, setResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartParams, setChartParams] = useState<any>(null);

  const fetchForecast = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob) return;

    setLoading(true);
    setError('');
    try {
      // First get chart bundle for dasha + asc data
      const bundle = await api.post(CHART.CREATE, {
        name: effectiveData.name || 'Chart',
        dob: effectiveData.dob,
        tob: effectiveData.tob,
        place_of_birth: effectiveData.place_of_birth,
      });

      const b = bundle?.bundle || bundle;
      const natal = b?.natal || {};
      const dasha = b?.dasha || {};
      const meta = b?.meta || b?.request || {};
      const planets = natal.planets || {};

      // Extract current dasha period
      const currentDasha = dasha.current || {};
      const md = currentDasha.md || currentDasha.maha_dasha || {};
      const ad = currentDasha.ad || currentDasha.antar_dasha || {};

      // Extract natal planet signs for NPM
      const natalPlanetSigns: Record<string, number> = {};
      for (const [name, info] of Object.entries(planets) as any[]) {
        if (info?.sign_number) natalPlanetSigns[name] = info.sign_number;
      }

      const params = {
        lat: meta.lat || effectiveData.lat || 28.6139,
        lon: meta.lon || effectiveData.lon || 77.2090,
        tz_id: meta.tz_id || 'Asia/Kolkata',
        asc_sign: natal.ascendant?.sign_number || natal.ascendant?.sign || 1,
        moon_sign: planets.Moon?.sign_number || planets.Moon?.sign || 1,
        md_planet: md.planet || md.lord || 'Saturn',
        ad_planet: ad.planet || ad.lord || 'Mercury',
        ad_start: ad.start || ad.start_date || '',
        ad_end: ad.end || ad.end_date || '',
        natal_planet_signs: Object.keys(natalPlanetSigns).length > 0 ? natalPlanetSigns : undefined,
      };

      setChartParams(params);

      // Compute forecast (use /interpret for premium, /compute for basic)
      const endpoint = isPremium ? TEMPORAL.INTERPRET : TEMPORAL.COMPUTE;
      const res = await api.post(endpoint, params);
      setResults(res?.results || res?.areas || []);
    } catch (err: any) {
      setError(err.message || 'Failed to compute forecast');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, isPremium]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchForecast();
    }, [loaded, fetchForecast])
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r: any) => r.window_type === filter);
  }, [results, filter]);

  const counts = useMemo(() => ({
    opportunity: results.filter((r: any) => r.window_type === 'opportunity').length,
    threat: results.filter((r: any) => r.window_type === 'threat').length,
    mixed: results.filter((r: any) => r.window_type === 'mixed').length,
  }), [results]);

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Temporal Forecast</Text>
            <Text style={styles.dateText}>Transit Date: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Computing forecast..." />}

        {!loading && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="trending-up-outline" size={48} color={colors.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Data</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to see your temporal forecast.</Text>
          </GlassCard>
        )}

        {!loading && results.length > 0 && (
          <>
            {/* Stats bar */}
            <View style={styles.statsRow}>
              <View style={[styles.statChip, { backgroundColor: `${colors.success}15` }]}>
                <Text style={[styles.statText, { color: colors.success }]}>{counts.opportunity} opp</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: `${colors.malefic}15` }]}>
                <Text style={[styles.statText, { color: colors.malefic }]}>{counts.threat} threat</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: `${colors.warning}15` }]}>
                <Text style={[styles.statText, { color: colors.warning }]}>{counts.mixed} mixed</Text>
              </View>
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[styles.filterChip, filter === f.key && { backgroundColor: `${f.color}20`, borderColor: f.color }]}
                >
                  <Text style={[styles.filterText, filter === f.key && { color: f.color }]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Life area cards */}
            <View style={styles.cardsList}>
              {filtered.map((area: any) => (
                <LifeAreaCard
                  key={area.life_area_id || area.life_area_key}
                  name={area.life_area_name || area.name || ''}
                  domain={area.domain}
                  icon={area.icon || area.life_area_key}
                  window_type={area.window_type}
                  intensity={area.intensity}
                  opportunity_score={area.opportunity_pct || area.opportunity_score || 0}
                  threat_score={area.threat_pct || area.threat_score || 0}
                  summary={area.summary || area.interpretation?.summary}
                  onPress={() => {
                    if (!chartParams) return;
                    router.push({
                      pathname: '/(auth)/(tabs)/consult/temporal-timeline',
                      params: {
                        lifeAreaId: String(area.life_area_id || area.id),
                        lifeAreaName: area.life_area_name || area.name || '',
                        chartParamsJson: JSON.stringify(chartParams),
                      },
                    } as any);
                  }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },
  dateText: { ...typography.styles.caption, color: colors.muted },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center', paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statText: { ...typography.styles.caption, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: { ...typography.styles.caption, color: colors.muted, fontWeight: '600' },
  cardsList: { gap: 10 },
});
