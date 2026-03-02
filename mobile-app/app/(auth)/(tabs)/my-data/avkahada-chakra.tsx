import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

interface DetailRow {
  label: string;
  value: string;
}

export default function AvkahadaChakraScreen() {
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [avkData, setAvkData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAvkahada = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob || !effectiveData?.place_of_birth) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post(CHART.AVAKHADA, {
        name: effectiveData.name || 'Chart',
        dob: effectiveData.dob,
        tob: effectiveData.tob,
        gender: effectiveData.gender || undefined,
        place_of_birth: effectiveData.place_of_birth,
      });
      setAvkData(data?.avakhada || data);
      setMeta(data?.meta || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load Avkahada Chakra');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchAvkahada();
    }, [loaded, fetchAvkahada])
  );

  // Build rows from avkahada response
  const rows: DetailRow[] = [];
  if (avkData) {
    if (avkData.paya) rows.push({ label: 'Paya (Nakshatra Based)', value: avkData.paya });
    if (avkData.varan || avkData.varna) rows.push({ label: 'Varna', value: avkData.varan || avkData.varna });
    if (avkData.yoni) rows.push({ label: 'Yoni', value: avkData.yoni });
    if (avkData.gana) rows.push({ label: 'Gana', value: avkData.gana });
    if (avkData.vasya || avkData.vashya) rows.push({ label: 'Vasya', value: avkData.vasya || avkData.vashya });
    if (avkData.nadi) rows.push({ label: 'Nadi', value: avkData.nadi });
    if (avkData.tatva || avkData.tattva) rows.push({ label: 'Tatva', value: avkData.tatva || avkData.tattva });
    if (avkData.yoni_animal) rows.push({ label: 'Yoni Animal', value: avkData.yoni_animal });
    if (avkData.rajju) rows.push({ label: 'Rajju', value: avkData.rajju });
    if (avkData.vedha) rows.push({ label: 'Vedha', value: avkData.vedha });

    // Balance of Dasha
    if (avkData.balance_of_dasha || avkData.dasha_balance) {
      const bd = avkData.balance_of_dasha || avkData.dasha_balance;
      const bdStr = typeof bd === 'string' ? bd : `${bd.lord || ''} ${bd.years || 0}Y ${bd.months || 0}M ${bd.days || 0}D`;
      rows.push({ label: 'Balance of Dasha', value: bdStr });
    }

    // Lagna & Rasi from meta/avk
    if (avkData.lagna) rows.push({ label: 'Lagna', value: avkData.lagna });
    if (avkData.lagna_lord) rows.push({ label: 'Lagna Lord', value: avkData.lagna_lord });
    if (avkData.rasi || avkData.moon_sign) rows.push({ label: 'Rasi', value: avkData.rasi || avkData.moon_sign });
    if (avkData.rasi_lord || avkData.moon_sign_lord) rows.push({ label: 'Rasi Lord', value: avkData.rasi_lord || avkData.moon_sign_lord });

    // Nakshatra
    if (avkData.nakshatra) {
      const pada = avkData.pada ? `-${avkData.pada}` : '';
      rows.push({ label: 'Nakshatra-Pada', value: `${avkData.nakshatra}${pada}` });
    }
    if (avkData.nakshatra_lord) rows.push({ label: 'Nakshatra Lord', value: avkData.nakshatra_lord });

    // Sun sign
    if (avkData.sun_sign) rows.push({ label: 'SunSign (Indian)', value: avkData.sun_sign });

    // Julian Day from meta
    if (meta?.jd) rows.push({ label: 'Julian Day', value: String(Math.round(meta.jd)) });
  }

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Avkahada Chakra</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Calculating Avkahada..." />}

        {!loading && loaded && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="star-outline" size={64} color={colors.combust} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to view your Avkahada Chakra.</Text>
          </GlassCard>
        )}

        {rows.length > 0 && (
          <GlassCard style={styles.tableCard}>
            <View style={styles.tableHeaderBg}>
              <Text style={styles.tableHeaderText}>Avkahada Chakra</Text>
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
  tableHeaderBg: {
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
