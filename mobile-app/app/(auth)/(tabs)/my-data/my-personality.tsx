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
import { PERSONALITY } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const SUBDOMAIN_ICONS: Record<number, string> = {
  301: 'people-outline',
  302: 'chatbubbles-outline',
  303: 'body-outline',
  304: 'flame-outline',
  305: 'heart-outline',
  306: 'wallet-outline',
};

const SUBDOMAIN_COLORS: Record<number, string> = {
  301: colors.accent2,
  302: colors.accent,
  303: colors.success,
  304: colors.error,
  305: colors.benefic,
  306: colors.warning,
};

function getToneColor(tone: string): string {
  switch (tone?.toLowerCase()) {
    case 'positive': return colors.success;
    case 'negative': return colors.error;
    case 'mixed': return colors.warning;
    default: return colors.muted;
  }
}

function formatConfidence(val: any): string {
  if (typeof val === 'number') return `${Math.round(val * 100)}%`;
  if (typeof val === 'string') return val;
  return '';
}

export default function MyPersonalityScreen() {
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPersonality = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob || !effectiveData?.place_of_birth) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post(
        `${PERSONALITY.PROFILE}?interpretation_mode=static`,
        {
          name: effectiveData.name || 'Chart',
          dob: effectiveData.dob,
          tob: effectiveData.tob,
          gender: effectiveData.gender || undefined,
          place_of_birth: effectiveData.place_of_birth,
        }
      );
      setProfileData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load personality profile');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchPersonality();
    }, [loaded, fetchPersonality])
  );

  // Backend returns { predictions: { 301: {...}, 302: {...} }, subdomain_labels: {...} }
  const predictions = profileData?.predictions || {};
  const subdomains = Object.values(predictions) as any[];

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>My Personality</Text>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Analyzing personality..." />}

        {!loading && loaded && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="happy-outline" size={64} color={colors.success} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to discover your personality profile.</Text>
          </GlassCard>
        )}

        {/* Subdomain prediction cards */}
        {subdomains.map((sd: any, idx: number) => {
          const sdId = sd.subdomain_id || (301 + idx);
          const name = sd.subdomain_name || `Subdomain ${idx + 1}`;
          const icon = SUBDOMAIN_ICONS[sdId] || 'ellipse-outline';
          const sdColor = SUBDOMAIN_COLORS[sdId] || colors.accent;
          const interpretation = sd.interpretation_paragraph || sd.interpretation || '';
          const headline = sd.headline || '';
          const tone = sd.tone || '';
          const confidence = sd.confidence;
          const advice = sd.advice || '';
          const score = sd.normalized_score;

          return (
            <GlassCard key={sdId}>
              <View style={styles.sdHeader}>
                <View style={[styles.sdIconCircle, { backgroundColor: `${sdColor}15` }]}>
                  <Ionicons name={icon as any} size={22} color={sdColor} />
                </View>
                <View style={styles.sdHeaderText}>
                  <Text style={styles.sdName} numberOfLines={2}>{name}</Text>
                  {headline ? (
                    <Text style={[styles.sdHeadline, { color: sdColor }]} numberOfLines={2}>{headline}</Text>
                  ) : null}
                </View>
                {confidence != null && (
                  <View style={[styles.confidenceBadge, { backgroundColor: `${getToneColor(tone)}20` }]}>
                    <Text style={[styles.confidenceText, { color: getToneColor(tone) }]}>
                      {formatConfidence(confidence)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Score + Tone row */}
              {(score != null || tone) && (
                <View style={styles.metaRow}>
                  {score != null && (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>Score: {Math.round(score * 100)}%</Text>
                    </View>
                  )}
                  {tone ? (
                    <View style={[styles.metaChip, { backgroundColor: `${getToneColor(tone)}15` }]}>
                      <Text style={[styles.metaChipText, { color: getToneColor(tone) }]}>
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {interpretation ? (
                <Text style={styles.interpretationText}>{interpretation}</Text>
              ) : null}

              {advice ? (
                <View style={styles.adviceRow}>
                  <Ionicons name="bulb-outline" size={14} color={colors.warning} />
                  <Text style={styles.adviceText}>{advice}</Text>
                </View>
              ) : null}
            </GlassCard>
          );
        })}

        {!loading && subdomains.length === 0 && effectiveData?.dob && !error && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="analytics-outline" size={48} color={colors.accent} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>Personality analysis could not be generated for this chart.</Text>
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
  sdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sdIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sdHeaderText: { flex: 1 },
  sdName: { ...typography.styles.label, color: colors.text, fontWeight: '600', fontSize: 14 },
  sdHeadline: { ...typography.styles.caption, fontWeight: '600', marginTop: 2 },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: { ...typography.styles.caption, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(123,91,255,0.1)',
  },
  metaChipText: { ...typography.styles.caption, color: colors.accent, fontWeight: '500' },
  interpretationText: { ...typography.styles.bodySmall, color: colors.muted, lineHeight: 20 },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  adviceText: { ...typography.styles.caption, color: colors.warning, flex: 1, lineHeight: 16 },
});
