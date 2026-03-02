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

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

function getPhaseColor(phase: string): string {
  const lower = (phase || '').toLowerCase();
  if (lower.includes('rising') || lower.includes('1st') || lower.includes('ascending')) return colors.warning;
  if (lower.includes('peak') || lower.includes('2nd') || lower.includes('transit')) return colors.error;
  if (lower.includes('setting') || lower.includes('3rd') || lower.includes('descending')) return colors.combust;
  return colors.muted;
}

export default function SadeSatiScreen() {
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [sadeData, setSadeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSadeSati = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob || !effectiveData?.place_of_birth) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post(
        `${CHART.CREATE}?include_sade_sati=true`,
        {
          name: effectiveData.name || 'Chart',
          dob: effectiveData.dob,
          tob: effectiveData.tob,
          gender: effectiveData.gender || undefined,
          place_of_birth: effectiveData.place_of_birth,
        }
      );
      const bundle = data?.bundle || data;
      setSadeData(bundle?.sade_sati || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load Sade Sati report');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchSadeSati();
    }, [loaded, fetchSadeSati])
  );

  // Backend returns: { current_status: "Sade Sati (Rising Phase)" | "Dhaiya (4th from Moon)" | "None",
  //                    moon_sign: 5, sade_sati_periods: [...], dhaiya_periods: [...] }
  const currentStatus = sadeData?.current_status || 'None';
  const isActive = currentStatus !== 'None';
  const moonSign = sadeData?.moon_sign;
  const periods = sadeData?.sade_sati_periods || [];
  const dhaiyaPeriods = sadeData?.dhaiya_periods || [];

  // Parse phase from current_status string like "Sade Sati (Rising Phase)"
  const phaseMatch = currentStatus.match(/\(([^)]+)\)/);
  const currentPhase = phaseMatch ? phaseMatch[1] : '';

  // Determine current Saturn sign from the most recent/active period
  const now = new Date();
  const activePeriod = periods.find((p: any) => {
    if (!p.start_date || !p.end_date) return false;
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    return now >= start && now <= end;
  });
  const saturnSign = activePeriod?.saturn_sign;

  const statusLabel = isActive ? 'ACTIVE' : 'INACTIVE';
  const statusColor = isActive ? colors.error : colors.success;
  const statusBg = isActive ? 'rgba(255,71,87,0.15)' : 'rgba(67,217,131,0.15)';

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Sade Sati Report</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Analyzing Saturn transit..." />}

        {!loading && loaded && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="planet-outline" size={64} color={colors.malefic} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to check your Sade Sati status.</Text>
          </GlassCard>
        )}

        {sadeData && (
          <>
            {/* Status card */}
            <GlassCard>
              <View style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <Ionicons name="planet-outline" size={36} color={isActive ? colors.malefic : colors.success} />
                  <View>
                    <Text style={styles.statusLabel}>Sade Sati</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Current status detail */}
              {isActive && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, { color: getPhaseColor(currentPhase) }]}>
                    {currentStatus}
                  </Text>
                </View>
              )}

              {moonSign != null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Moon Sign</Text>
                  <Text style={styles.infoValue}>
                    {typeof moonSign === 'number' ? SIGN_NAMES[moonSign] || String(moonSign) : moonSign}
                  </Text>
                </View>
              )}

              {saturnSign != null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Saturn Currently In</Text>
                  <Text style={styles.infoValue}>
                    {typeof saturnSign === 'number' ? SIGN_NAMES[saturnSign] || String(saturnSign) : saturnSign}
                  </Text>
                </View>
              )}

              {currentPhase ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Current Phase</Text>
                  <Text style={[styles.infoValue, { color: getPhaseColor(currentPhase) }]}>
                    {currentPhase}
                  </Text>
                </View>
              ) : null}
            </GlassCard>

            {/* Sade Sati periods timeline */}
            {periods.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>Sade Sati Periods</Text>
                {periods.map((p: any, idx: number) => {
                  const phase = p.phase || `Phase ${idx + 1}`;
                  const isCurrent = activePeriod && p.start_date === activePeriod.start_date;
                  return (
                    <View key={`ss-${idx}`} style={styles.phaseRow}>
                      <View style={[styles.phaseDot, { backgroundColor: getPhaseColor(phase) }]} />
                      <View style={styles.phaseInfo}>
                        <Text style={styles.phaseName}>{phase}</Text>
                        {p.saturn_sign != null && (
                          <Text style={styles.phaseDetail}>
                            Saturn in {typeof p.saturn_sign === 'number' ? SIGN_NAMES[p.saturn_sign] || String(p.saturn_sign) : p.saturn_sign}
                          </Text>
                        )}
                        {p.start_date && (
                          <Text style={styles.phaseDate}>
                            {p.start_date}{p.end_date ? ` \u2014 ${p.end_date}` : ''}
                            {p.duration_years ? ` (${p.duration_years}y)` : ''}
                          </Text>
                        )}
                      </View>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>NOW</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </GlassCard>
            )}

            {/* Dhaiya periods */}
            {dhaiyaPeriods.length > 0 && (
              <GlassCard>
                <Text style={styles.sectionTitle}>Dhaiya Periods</Text>
                {dhaiyaPeriods.map((p: any, idx: number) => (
                  <View key={`dh-${idx}`} style={styles.phaseRow}>
                    <View style={[styles.phaseDot, { backgroundColor: colors.warning }]} />
                    <View style={styles.phaseInfo}>
                      <Text style={styles.phaseName}>{p.type || `Dhaiya ${idx + 1}`}</Text>
                      {p.saturn_sign != null && (
                        <Text style={styles.phaseDetail}>
                          Saturn in {typeof p.saturn_sign === 'number' ? SIGN_NAMES[p.saturn_sign] || String(p.saturn_sign) : p.saturn_sign}
                        </Text>
                      )}
                      {p.start_date && (
                        <Text style={styles.phaseDate}>
                          {p.start_date}{p.end_date ? ` \u2014 ${p.end_date}` : ''}
                          {p.duration_years ? ` (${p.duration_years}y)` : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </GlassCard>
            )}
          </>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel: { ...typography.styles.h3, color: colors.text },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeText: { ...typography.styles.caption, fontWeight: '700', letterSpacing: 1 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  infoLabel: { ...typography.styles.label, color: colors.muted },
  infoValue: { ...typography.styles.label, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  sectionTitle: { ...typography.styles.label, color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: 12 },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  phaseInfo: { flex: 1 },
  phaseName: { ...typography.styles.label, color: colors.text, fontWeight: '600' },
  phaseDetail: { ...typography.styles.caption, color: colors.muted, marginTop: 2 },
  phaseDate: { ...typography.styles.caption, color: colors.accent2, marginTop: 2 },
  currentBadge: {
    backgroundColor: 'rgba(255,71,87,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: { ...typography.styles.caption, color: colors.error, fontWeight: '700', fontSize: 10 },
});
