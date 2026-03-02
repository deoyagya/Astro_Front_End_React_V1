import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { GradientButton } from '@components/ui/GradientButton';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { TRANSIT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

const MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']);

function formatDeg(lon: number): string {
  const deg = Math.floor(lon % 30);
  const min = Math.floor(((lon % 30) - deg) * 60);
  return `${deg}\u00B0${min}'`;
}

export default function TransitScreen() {
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [transitPlanets, setTransitPlanets] = useState<any>(null);
  const [transitHits, setTransitHits] = useState<any[]>([]);
  const [transitMeta, setTransitMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTransit = useCallback(async () => {
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

      // Fetch transit table and hits in parallel
      const [tableRes, hitsRes] = await Promise.all([
        api.post(TRANSIT.TABLE, body),
        api.post(TRANSIT.HITS, body),
      ]);

      setTransitPlanets(tableRes?.transit_planets || {});
      setTransitMeta(tableRes?.meta || {});
      // transit_hits is an object with .hits array, not a direct array
      const hitsObj = hitsRes?.transit_hits || {};
      setTransitHits(hitsObj?.hits || hitsObj?.top_hits || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transit data');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchTransit();
    }, [loaded, fetchTransit])
  );

  // Build sorted planet list
  const planetList = transitPlanets
    ? Object.entries(transitPlanets)
        .filter(([name]) => !['Lagna', 'Ascendant'].includes(name))
        .map(([name, data]: [string, any]) => ({
          name,
          sign: data.sign,
          signName: typeof data.sign === 'number' ? SIGN_NAMES[data.sign] || '' : data.sign || '',
          longitude: data.longitude ?? data.lon,
          isRetro: data.is_retrograde || data.retrograde || false,
        }))
    : [];

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Transit</Text>
            {transitMeta?.generated_at_local && (
              <Text style={styles.subtitle}>
                As of {new Date(transitMeta.generated_at_local).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            )}
          </View>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading transits..." />}

        {!loading && loaded && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="navigate-outline" size={64} color={colors.accent} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to view current planetary transits.</Text>
          </GlassCard>
        )}

        {/* Current transit positions table */}
        {planetList.length > 0 && (
          <GlassCard style={styles.tableCard}>
            <View style={styles.tableHeaderBg}>
              <Text style={styles.tableHeaderText}>Current Planetary Positions</Text>
            </View>

            {/* Table header row */}
            <View style={styles.thRow}>
              <Text style={[styles.th, { flex: 1.3 }]}>Planet</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Sign</Text>
              <Text style={[styles.th, { flex: 1 }]}>Degree</Text>
              <Text style={[styles.th, { flex: 0.5 }]}>R</Text>
            </View>

            {planetList.map((p, idx) => (
              <View key={p.name} style={[styles.tRow, idx % 2 === 0 && styles.tRowAlt]}>
                <Text style={[
                  styles.td,
                  { flex: 1.3, fontWeight: '600' },
                  { color: MALEFICS.has(p.name) ? colors.malefic : colors.benefic },
                ]}>
                  {p.name}
                </Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{p.signName}</Text>
                <Text style={[styles.td, { flex: 1 }]}>
                  {p.longitude != null ? formatDeg(p.longitude) : '\u2014'}
                </Text>
                <Text style={[styles.td, { flex: 0.5, color: p.isRetro ? colors.malefic : colors.muted }]}>
                  {p.isRetro ? 'R' : '\u2014'}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Transit hits on natal chart */}
        {transitHits.length > 0 && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Transit Impact on Your Chart</Text>
            {transitHits.map((hit: any, idx: number) => {
              // Backend uses "quality" for benefic/malefic
              const quality = hit.quality || hit.nature || '';
              const impactColor = quality === 'benefic' ? colors.benefic
                : quality === 'malefic' ? colors.malefic
                : colors.muted;
              return (
                <View key={`hit-${idx}`} style={styles.hitRow}>
                  <View style={[styles.hitDot, { backgroundColor: impactColor }]} />
                  <View style={styles.hitInfo}>
                    <Text style={styles.hitTitle}>
                      {hit.transit_planet}{' '}
                      {hit.aspect_type || 'transit'}{' '}
                      {hit.natal_planet || ''}
                    </Text>
                    {hit.orb != null && (
                      <Text style={styles.hitDetail}>
                        Orb: {typeof hit.orb === 'number' ? hit.orb.toFixed(1) : hit.orb}\u00B0
                        {hit.classification ? ` (${hit.classification})` : ''}
                      </Text>
                    )}
                    {hit.score != null && (
                      <Text style={styles.hitDetail}>
                        Score: {typeof hit.score === 'number' ? hit.score.toFixed(0) : hit.score}
                      </Text>
                    )}
                  </View>
                  {quality ? (
                    <Text style={[styles.hitNature, { color: impactColor }]}>
                      {quality}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </GlassCard>
        )}

        {!loading && transitPlanets && (
          <GradientButton
            title="Refresh"
            variant="secondary"
            onPress={fetchTransit}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    marginBottom: 4,
  },
  title: { ...typography.styles.h3, color: colors.text },
  subtitle: { ...typography.styles.caption, color: colors.muted, marginTop: 2 },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center', paddingHorizontal: 16 },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHeaderBg: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: { ...typography.styles.label, color: '#fff', fontWeight: '700', fontSize: 15 },
  thRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: { ...typography.styles.caption, color: colors.muted, fontWeight: '700' },
  tRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  td: { ...typography.styles.bodySmall, color: colors.text },
  sectionTitle: { ...typography.styles.label, color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  hitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  hitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  hitInfo: { flex: 1 },
  hitTitle: { ...typography.styles.label, color: colors.text, fontWeight: '600' },
  hitDetail: { ...typography.styles.caption, color: colors.accent2, marginTop: 2 },
  hitNature: { ...typography.styles.caption, fontWeight: '600', textTransform: 'capitalize' },
});
