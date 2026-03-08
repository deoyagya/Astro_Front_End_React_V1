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
import { PanchangSummary } from '@components/muhurta/PanchangSummary';
import { api } from '@api/client';
import { MUHURTA } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const QUALITY_COLORS: Record<string, string> = {
  excellent: colors.success,
  good: colors.benefic,
  average: colors.warning,
  poor: colors.error,
  avoid: colors.malefic,
  auspicious: colors.success,
  moderate: colors.warning,
  inauspicious: colors.malefic,
};

export default function MuhurtaDetailScreen() {
  const { windowJson, eventType, locationJson, birthJson } = useLocalSearchParams<{
    windowJson: string;
    eventType: string;
    locationJson: string;
    birthJson: string;
  }>();

  const window = useMemo(() => {
    try { return JSON.parse(windowJson || '{}'); }
    catch { return {}; }
  }, [windowJson]);

  const location = useMemo(() => {
    try { return JSON.parse(locationJson || '{}'); }
    catch { return {}; }
  }, [locationJson]);

  const birthData = useMemo(() => {
    try { return birthJson ? JSON.parse(birthJson) : null; }
    catch { return null; }
  }, [birthJson]);

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [error, setError] = useState('');

  const score = window.score || window.total_score || 0;
  const quality = window.quality || window.verdict || 'average';
  const qColor = QUALITY_COLORS[quality] || colors.muted;

  const panchang = window.panchang || {};
  const doshas = window.doshas || window.warnings || [];
  const specialYogas = window.special_yogas || [];
  const inauspicious = window.inauspicious_periods || {};

  const handleValidate = async () => {
    setValidating(true);
    setError('');
    try {
      const res = await api.post(MUHURTA.VALIDATE, {
        event_type: eventType,
        date: window.date,
        time: window.start_time || window.time_start,
        lat: location.lat,
        lon: location.lon,
        tz_id: location.tz_id || 'Asia/Kolkata',
        birth_data: birthData || undefined,
      }, { noAuth: true });
      setValidation(res);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Window Details</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {/* Header card */}
        <GlassCard style={styles.mainCard}>
          <Text style={styles.dateText}>{window.date}</Text>
          <Text style={styles.timeText}>
            {window.start_time || window.time_start} – {window.end_time || window.time_end}
          </Text>
          <View style={styles.scoreRow}>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${Math.min(score, 100)}%`, backgroundColor: qColor }]} />
            </View>
            <View style={[styles.qualityBadge, { backgroundColor: `${qColor}20` }]}>
              <Text style={[styles.qualityText, { color: qColor }]}>{quality}</Text>
            </View>
            <Text style={[styles.scoreText, { color: qColor }]}>{score}/100</Text>
          </View>
        </GlassCard>

        {/* Panchang */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Panchang</Text>
          <PanchangSummary
            vara={panchang.vara?.name || window.vara}
            tithi={panchang.tithi?.name || window.tithi}
            tithi_quality={panchang.tithi?.quality}
            nakshatra={panchang.nakshatra?.name || window.nakshatra}
            nakshatra_quality={panchang.nakshatra?.quality}
            yoga={panchang.yoga?.name || window.yoga}
            yoga_quality={panchang.yoga?.quality}
            karana={panchang.karana?.name || window.karana}
          />
        </GlassCard>

        {/* Special Yogas */}
        {specialYogas.length > 0 && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Special Yogas</Text>
            <View style={styles.chipRow}>
              {specialYogas.map((y: any, i: number) => (
                <View key={i} style={styles.chip}>
                  <Ionicons name="sparkles" size={12} color={colors.success} />
                  <Text style={styles.chipText}>{typeof y === 'string' ? y : y.name || y.yoga}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Doshas / Warnings */}
        {doshas.length > 0 && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Doshas / Warnings</Text>
            {doshas.map((d: any, i: number) => (
              <View key={i} style={styles.doshaRow}>
                <Ionicons name="warning-outline" size={14} color={colors.malefic} />
                <Text style={styles.doshaText}>{typeof d === 'string' ? d : d.description || d.name}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Inauspicious Periods */}
        {(inauspicious.rahu_kalam || inauspicious.yamagandam || inauspicious.gulika) && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Inauspicious Periods</Text>
            {inauspicious.rahu_kalam && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Rahu Kalam</Text>
                <Text style={styles.periodValue}>{inauspicious.rahu_kalam}</Text>
              </View>
            )}
            {inauspicious.yamagandam && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Yamagandam</Text>
                <Text style={styles.periodValue}>{inauspicious.yamagandam}</Text>
              </View>
            )}
            {inauspicious.gulika && (
              <View style={styles.periodRow}>
                <Text style={styles.periodLabel}>Gulika</Text>
                <Text style={styles.periodValue}>{inauspicious.gulika}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Personalization */}
        {window.tara_bala != null && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Personalization</Text>
            <View style={styles.personalRow}>
              <Text style={styles.periodLabel}>Tara Bala</Text>
              <Text style={styles.periodValue}>{window.tara_bala}</Text>
            </View>
            {window.chandra_bala != null && (
              <View style={styles.personalRow}>
                <Text style={styles.periodLabel}>Chandra Bala</Text>
                <Text style={styles.periodValue}>{window.chandra_bala}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Validate Button */}
        {!validation && (
          <GradientButton
            title="Validate This Moment"
            onPress={handleValidate}
            loading={validating}
            disabled={validating}
            style={{ marginTop: 4 }}
          />
        )}
        {validating && <LoadingSpinner message="Validating..." />}

        {/* Validation Result */}
        {validation && (
          <GlassCard style={styles.validationCard}>
            <Text style={styles.sectionTitle}>Validation Verdict</Text>
            <View style={[
              styles.verdictBadge,
              { backgroundColor: `${QUALITY_COLORS[validation.verdict] || colors.muted}20` },
            ]}>
              <Ionicons
                name={validation.verdict === 'auspicious' ? 'checkmark-circle' : validation.verdict === 'inauspicious' ? 'close-circle' : 'alert-circle'}
                size={20}
                color={QUALITY_COLORS[validation.verdict] || colors.muted}
              />
              <Text style={[styles.verdictText, { color: QUALITY_COLORS[validation.verdict] || colors.muted }]}>
                {validation.verdict}
              </Text>
            </View>
            {validation.reasoning && (
              <Text style={styles.reasonText}>{validation.reasoning}</Text>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },
  mainCard: { gap: 8 },
  dateText: { ...typography.styles.h3, color: colors.text },
  timeText: { ...typography.styles.body, color: colors.accent2 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  barBg: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  qualityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qualityText: { ...typography.styles.caption, fontWeight: '700', textTransform: 'capitalize' },
  scoreText: { ...typography.styles.bodySmall, fontWeight: '700' },
  sectionTitle: { ...typography.styles.body, color: colors.text, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(67,217,131,0.1)',
  },
  chipText: { ...typography.styles.caption, color: colors.success },
  doshaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  doshaText: { ...typography.styles.bodySmall, color: colors.malefic, flex: 1 },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  periodLabel: { ...typography.styles.bodySmall, color: colors.muted },
  periodValue: { ...typography.styles.bodySmall, color: colors.text, fontWeight: '500' },
  personalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  validationCard: { gap: 10 },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verdictText: { ...typography.styles.body, fontWeight: '700', textTransform: 'capitalize' },
  reasonText: { ...typography.styles.bodySmall, color: colors.muted, lineHeight: 22 },
});
