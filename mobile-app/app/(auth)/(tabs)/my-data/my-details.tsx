import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

/** Format "YYYY-MM-DD" → "9 : 8 : 1973" style */
function formatDobDisplay(dob: string): string {
  if (!dob) return '—';
  const parts = dob.split('-').map(Number);
  return `${parts[2]} : ${parts[1]} : ${parts[0]}`;
}

/** Format "HH:MM" → "21 : 40 : 0" */
function formatTobDisplay(tob: string): string {
  if (!tob) return '—';
  const [h, m] = tob.split(':').map(Number);
  return `${h} : ${m} : 0`;
}

/** Day of week from YYYY-MM-DD */
function getDayOfWeek(dob: string): string {
  if (!dob) return '—';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dob + 'T12:00:00');
  return days[d.getDay()] || '—';
}

interface DetailRow {
  label: string;
  value: string;
}

export default function MyDetailsScreen() {
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [chartMeta, setChartMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob || !effectiveData?.place_of_birth) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post(
        `${CHART.CREATE}?include_avakhada=true&include_panchang=true`,
        {
          name: effectiveData.name || 'Chart',
          dob: effectiveData.dob,
          tob: effectiveData.tob,
          gender: effectiveData.gender || undefined,
          place_of_birth: effectiveData.place_of_birth,
        }
      );
      setChartMeta(data?.bundle || data);
    } catch (err: any) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchDetails();
    }, [loaded, fetchDetails])
  );

  const meta = chartMeta?.meta || {};
  const natal = chartMeta?.natal || {};
  const avk = chartMeta?.avakhada || {};

  // Build the person details rows
  const rows: DetailRow[] = [];
  if (effectiveData) {
    rows.push({ label: 'Sex', value: effectiveData.gender ? effectiveData.gender.charAt(0).toUpperCase() + effectiveData.gender.slice(1) : '—' });
    rows.push({ label: 'Date of Birth', value: formatDobDisplay(effectiveData.dob) });
    rows.push({ label: 'Time of Birth', value: formatTobDisplay(effectiveData.tob) });
    rows.push({ label: 'Day of Birth', value: getDayOfWeek(effectiveData.dob) });
    rows.push({ label: 'Place of Birth', value: effectiveData.place_of_birth || '—' });
    rows.push({ label: 'Time Zone', value: meta.tz_offset != null ? String(meta.tz_offset) : '5.5' });
    rows.push({ label: 'Latitude', value: effectiveData.lat != null ? formatCoord(effectiveData.lat, 'N', 'S') : meta.lat ? formatCoord(meta.lat, 'N', 'S') : '—' });
    rows.push({ label: 'Longitude', value: effectiveData.lon != null ? formatCoord(effectiveData.lon, 'E', 'W') : meta.lon ? formatCoord(meta.lon, 'E', 'W') : '—' });
  }

  // Add computed fields from chart
  if (natal.planets) {
    const moon = natal.planets.Moon || natal.planets.moon;
    const asc = natal.ascendant || {};
    rows.push({ label: 'Lagna', value: getSignName(asc.sign) || '—' });
    rows.push({ label: 'Lagna Lord', value: asc.lord ? asc.lord.substring(0, 3).toUpperCase() : '—' });
    rows.push({ label: 'Rasi', value: moon ? getSignName(moon.sign) : '—' });
    rows.push({ label: 'Rasi Lord', value: moon?.lord ? moon.lord.substring(0, 3).toUpperCase() : '—' });
  }

  if (avk.nakshatra) {
    rows.push({ label: 'Nakshatra-Pada', value: `${avk.nakshatra}${avk.pada ? `-${avk.pada}` : ''}` });
    rows.push({ label: 'Nakshatra Lord', value: avk.nakshatra_lord ? avk.nakshatra_lord.substring(0, 3).toUpperCase() : '—' });
  }

  if (meta.jd) {
    rows.push({ label: 'Julian Day', value: String(Math.round(meta.jd)) });
  }

  if (avk.sun_sign) {
    rows.push({ label: 'SunSign (Indian)', value: avk.sun_sign });
  }

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Person Details</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading details..." />}

        {!loading && loaded && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="person-outline" size={64} color={colors.accent2} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to view your person details.</Text>
          </GlassCard>
        )}

        {rows.length > 0 && (
          <GlassCard style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Person Details</Text>
            </View>
            {rows.map((row, idx) => (
              <View key={row.label} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
                <Text style={styles.cellLabel}>{row.label}</Text>
                <Text style={styles.cellValue}>{row.value}</Text>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </Screen>
  );
}

function formatCoord(val: number, pos: string, neg: string): string {
  const dir = val >= 0 ? pos : neg;
  const abs = Math.abs(val);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  return `${deg} : ${min} : ${dir}`;
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

function getSignName(sign: any): string {
  if (typeof sign === 'string') return sign;
  if (typeof sign === 'number') return SIGN_NAMES[sign] || String(sign);
  return '—';
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
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center', paddingHorizontal: 16 },
  tableCard: { padding: 0, overflow: 'hidden' },
  tableHeader: {
    backgroundColor: colors.combust,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    ...typography.styles.h3,
    color: '#fff',
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cellLabel: {
    ...typography.styles.label,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRightWidth: 0.5,
    borderRightColor: colors.border,
  },
  cellValue: {
    ...typography.styles.body,
    color: colors.muted,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});
