import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { ChartViewToggle } from '@components/charts/ChartStyleToggle';
import type { ChartViewMode } from '@components/charts/ChartStyleToggle';
import { NorthIndianChart } from '@components/charts/NorthIndianChart';
import { SouthIndianChart } from '@components/charts/SouthIndianChart';
import { useBirthData, CHART_CACHE_KEY } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';
import {
  SIGN_NAMES, PLANET_ABBR, MALEFICS, formatDegrees, getDignity, vargaToChartData,
} from '@utils/jyotish';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

type ChartStyle = 'South Indian' | 'North Indian';

const DIVISIONAL_CHARTS = [
  { label: 'D1', value: 'D1', title: 'Rashi' },
  { label: 'D2', value: 'D2', title: 'Hora' },
  { label: 'D3', value: 'D3', title: 'Drekkana' },
  { label: 'D7', value: 'D7', title: 'Saptamsha' },
  { label: 'D9', value: 'D9', title: 'Navamsha' },
  { label: 'D10', value: 'D10', title: 'Dashamsha' },
  { label: 'D12', value: 'D12', title: 'Dwadashamsha' },
  { label: 'D16', value: 'D16', title: 'Shodashamsha' },
  { label: 'D20', value: 'D20', title: 'Vimshamsha' },
  { label: 'D24', value: 'D24', title: 'Chaturvimshamsha' },
  { label: 'D27', value: 'D27', title: 'Bhamsha' },
  { label: 'D30', value: 'D30', title: 'Trimshamsha' },
  { label: 'D40', value: 'D40', title: 'Khavedamsha' },
  { label: 'D45', value: 'D45', title: 'Akshavedamsha' },
  { label: 'D60', value: 'D60', title: 'Shashtiamsha' },
];

/**
 * Enrich D1 chart placements with per-planet metadata
 * (degree, retro, combust, dignity) from natal planets data.
 * Ported from web BirthChartPage.jsx.
 */
function enrichD1WithPlanetData(d1Chart: any, natalPlanets: any) {
  if (!d1Chart?.placements || !natalPlanets) return d1Chart;
  const enriched = JSON.parse(JSON.stringify(d1Chart));
  for (const [, hData] of Object.entries(enriched.placements) as [string, any][]) {
    hData.planetData = hData.planetData || {};
    for (const pName of hData.planets || []) {
      if (pName === 'Lagna') continue;
      const pNatal = natalPlanets[pName];
      if (!pNatal) continue;
      const lon = pNatal.longitude ?? pNatal.lon;
      const degInSign = lon != null ? lon % 30 : pNatal.degree ?? null;
      hData.planetData[pName] = {
        degree: degInSign,
        longitude: lon,
        isRetro: pNatal.is_retrograde || pNatal.retrograde || pNatal.is_retro || false,
        isCombust: pNatal.derived?.combustion?.is_combust || false,
        sign: typeof pNatal.sign === 'string' ? parseInt(pNatal.sign, 10) : pNatal.sign,
      };
    }
  }
  return enriched;
}

export default function BirthChartScreen() {
  const { loaded: birthDataLoaded, savedData, reload } = useBirthData({ reportType: 'full' });
  // Determine data source: active chart (from saved-charts) or user's own (from hook)
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;
  const [viewMode, setViewMode] = useState<ChartViewMode>('Chart Display');
  const [chartPreference, setChartPreference] = useState<ChartStyle>('South Indian');
  const [selectedDiv, setSelectedDiv] = useState('D1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<any>(null);
  const [natalPlanets, setNatalPlanets] = useState<any>({});
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);

  // Read chart style preference from Profile settings (reactive on screen focus)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('chart_style').then((v) => {
        if (v === 'North Indian' || v === 'South Indian') setChartPreference(v);
      });
    }, [])
  );

  // Re-read birth data when screen regains focus (e.g., after editing in birth-details)
  // Also clear stale chart if birth data was just saved (prevents showing old chart)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('chart_needs_refresh').then((val) => {
        if (val === 'true') {
          setChartData(null);
          setNatalPlanets({});
          setSelectedHouse(null);
          AsyncStorage.removeItem('chart_needs_refresh').catch(() => {});
        }
      });
      reload();
    }, [reload])
  );

  // Load cached chart on mount for instant display
  useEffect(() => {
    AsyncStorage.getItem(CHART_CACHE_KEY).then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setChartData(parsed);
          setNatalPlanets(parsed?.natal?.planets || {});
        } catch {}
      }
    });
  }, []);

  // Auto-fetch chart when birth data is available
  const fetchChart = useCallback(async () => {
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
        `${CHART.CREATE}?include_vargas=true&include_dasha=false&include_ashtakavarga=false`,
        body
      );
      const bundle = data?.bundle || data;
      setChartData(bundle);
      setNatalPlanets(bundle?.natal?.planets || {});
      setSelectedHouse(null);
      // Cache unwrapped bundle for instant load next time
      AsyncStorage.setItem(CHART_CACHE_KEY, JSON.stringify(bundle)).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load chart');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth, effectiveData?.name, effectiveData?.gender]);

  // Trigger fetch when birth data loads
  useEffect(() => {
    if (!birthDataLoaded || !effectiveData?.dob) return;
    fetchChart();
  }, [birthDataLoaded, fetchChart]);

  const activeDivInfo = DIVISIONAL_CHARTS.find((d) => d.value === selectedDiv);

  // Get the active divisional chart data (enriched with planet metadata)
  const activeChart = useMemo(() => {
    if (!chartData) return null;
    if (selectedDiv === 'D1') {
      return enrichD1WithPlanetData(chartData?.charts?.D1, natalPlanets);
    }
    const divLabel = activeDivInfo?.title || selectedDiv;
    return vargaToChartData(chartData?.vargas?.[selectedDiv], divLabel);
  }, [chartData, selectedDiv, natalPlanets, activeDivInfo]);

  // Extract planet positions from active chart
  const planets = activeChart
    ? Object.entries(activeChart.placements || {}).flatMap(([hStr, hData]: [string, any]) =>
        (hData.planets || [])
          .filter((p: string) => p !== 'Lagna')
          .map((p: string) => ({
            name: p,
            house: parseInt(hStr, 10),
            sign: hData.sign,
            signName: SIGN_NAMES[hData.sign] || '',
            degree: hData.planetData?.[p]?.degree,
            isRetro: hData.planetData?.[p]?.isRetro,
            dignity: getDignity(p, hData.sign),
          }))
      )
    : [];

  // No birth data — show CTA
  if (birthDataLoaded && (!effectiveData?.dob || !effectiveData?.place_of_birth)) {
    return (
      <Screen>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Birth Chart</Text>
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="planet-outline" size={64} color={colors.accent} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details Found</Text>
            <Text style={styles.emptySubtitle}>
              Enter your birth details to view your chart with all divisional charts (D1–D60).
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Birth Chart</Text>
            <Text style={styles.subtitle}>
              {activeDivInfo ? `${activeDivInfo.label} — ${activeDivInfo.title}` : 'D1 — Rashi'}
            </Text>
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

        {/* Divisional chart pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {DIVISIONAL_CHARTS.map((dc) => {
            const isActive = selectedDiv === dc.value;
            // Check if this divisional chart has data
            const hasData = dc.value === 'D1'
              ? !!chartData?.charts?.D1
              : !!chartData?.vargas?.[dc.value];
            return (
              <Pressable
                key={dc.value}
                onPress={() => { setSelectedDiv(dc.value); setSelectedHouse(null); }}
                style={[
                  styles.pill,
                  isActive && styles.pillActive,
                  !hasData && styles.pillDisabled,
                ]}
              >
                <Text style={[
                  styles.pillText,
                  isActive && styles.pillTextActive,
                  !hasData && styles.pillTextDisabled,
                ]}>
                  {dc.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && !chartData && <LoadingSpinner message="Calculating chart..." />}

        {activeChart && (
          <>
            <ChartViewToggle value={viewMode} onChange={setViewMode} />

            {viewMode === 'Chart Display' ? (
              /* Chart SVG — format determined by Profile preference */
              chartPreference === 'North Indian' ? (
                <NorthIndianChart
                  chartData={activeChart}
                  onHousePress={setSelectedHouse}
                  selectedHouse={selectedHouse}
                  d9Vargas={selectedDiv === 'D1' ? chartData?.vargas?.D9 : undefined}
                />
              ) : (
                <SouthIndianChart
                  chartData={activeChart}
                  onHousePress={setSelectedHouse}
                  selectedHouse={selectedHouse}
                  d9Vargas={selectedDiv === 'D1' ? chartData?.vargas?.D9 : undefined}
                />
              )
            ) : (
              /* Table View — planet positions table */
              <GlassCard>
                <Text style={styles.tableTitle}>Planet Positions</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 1.2 }]}>Planet</Text>
                  <Text style={[styles.th, { flex: 1.5 }]}>Sign</Text>
                  <Text style={[styles.th, { flex: 0.6 }]}>H</Text>
                  <Text style={[styles.th, { flex: 1.2 }]}>Degree</Text>
                  <Text style={[styles.th, { flex: 1.2 }]}>Dignity</Text>
                </View>
                {planets.map((p) => (
                  <View key={p.name} style={styles.tableRow}>
                    <Text
                      style={[
                        styles.td,
                        { flex: 1.2 },
                        { color: MALEFICS.has(p.name) ? colors.malefic : colors.benefic },
                      ]}
                    >
                      {PLANET_ABBR[p.name] || p.name}
                    </Text>
                    <Text style={[styles.td, { flex: 1.5 }]}>{p.signName}</Text>
                    <Text style={[styles.td, { flex: 0.6 }]}>{p.house}</Text>
                    <Text style={[styles.td, { flex: 1.2 }]}>
                      {p.degree != null ? formatDegrees(p.degree) : '—'}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        { flex: 1.2 },
                        p.dignity === 'exalted' && { color: colors.benefic },
                        p.dignity === 'debilitated' && { color: colors.malefic },
                        p.dignity === 'own' && { color: colors.accent2 },
                      ]}
                    >
                      {p.dignity}
                      {p.isRetro ? ' R' : ''}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Create New Chart — dedicated blank form screen */}
            <GradientButton
              title="Create New Chart"
              variant="secondary"
              onPress={() => {
                activeChartStore.clear();
                router.push('/(auth)/(tabs)/tools/new-chart' as any);
              }}
            />
          </>
        )}

        {/* Chart data loaded but selected divisional not available */}
        {chartData && !activeChart && !loading && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.warning} />
            <Text style={styles.emptyTitle}>{selectedDiv} Not Available</Text>
            <Text style={styles.emptySubtitle}>
              This divisional chart was not included in the API response. Try D1 (Rashi) or D9 (Navamsha).
            </Text>
          </GlassCard>
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

  // Divisional chart pills
  pillRow: { gap: 8, paddingVertical: 4, paddingRight: 16 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  pillText: {
    ...typography.styles.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  pillTextDisabled: {
    color: colors.muted,
  },

  // Empty state
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: {
    ...typography.styles.body, color: colors.muted, textAlign: 'center', paddingHorizontal: 16,
  },

  // Planet table
  tableTitle: { ...typography.styles.h3, color: colors.text, marginBottom: 10 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  th: { ...typography.styles.caption, color: colors.muted, fontWeight: '600' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(42,56,86,0.3)',
  },
  td: { ...typography.styles.bodySmall, color: colors.text },
});
