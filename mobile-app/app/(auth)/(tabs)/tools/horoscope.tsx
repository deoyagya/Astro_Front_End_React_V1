import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { PredictionCard } from '@components/cards/PredictionCard';
import { useBirthData } from '@hooks/useBirthData';
import { activeChartStore } from '@stores/activeChartStore';
import { api } from '@api/client';
import { PREDICT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function HoroscopeScreen() {
  const { loaded: birthDataLoaded, savedData } = useBirthData({ reportType: 'horoscope' });
  // Determine data source: active chart (from saved-charts) or user's own (from hook)
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictions, setPredictions] = useState<any>(null);

  // Auto-fetch predictions when birth data is available
  const fetchPredictions = useCallback(async () => {
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
        `${PREDICT.EVALUATE}?subdomain_id=1701&dasha_depth=2&interpretation_mode=static`,
        body
      );
      setPredictions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get predictions');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth, effectiveData?.name, effectiveData?.gender]);

  // Trigger fetch when screen is focused (handles birth data changes)
  useFocusEffect(
    useCallback(() => {
      if (!birthDataLoaded || !effectiveData?.dob) return;
      fetchPredictions();
    }, [birthDataLoaded, fetchPredictions])
  );

  // predict/evaluate returns { meta, prediction: {...}, system, manifest }
  const prediction = predictions?.prediction;
  const predictionList = prediction ? [prediction] : [];
  const overallScore = prediction?.probability_score != null
    ? Math.round(prediction.probability_score)
    : undefined;

  // No birth data — show CTA
  if (birthDataLoaded && (!effectiveData?.dob || !effectiveData?.place_of_birth)) {
    return (
      <Screen>
        <AppHeader />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Horoscope</Text>
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="telescope-outline" size={64} color={colors.warning} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details Found</Text>
            <Text style={styles.emptySubtitle}>
              Enter your birth details to receive personalized Vedic predictions.
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
            <Text style={styles.title}>Horoscope</Text>
            <Text style={styles.subtitle}>Vedic predictions based on your chart</Text>
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

        {loading && <LoadingSpinner message="Analyzing your chart..." />}

        {predictionList.length > 0 && !loading && (
          <>
            {overallScore !== undefined && (
              <GlassCard style={styles.overallCard}>
                <Text style={styles.overallLabel}>Overall Score</Text>
                <Text
                  style={[
                    styles.overallScore,
                    {
                      color:
                        overallScore >= 70
                          ? colors.success
                          : overallScore >= 40
                            ? colors.warning
                            : colors.error,
                    },
                  ]}
                >
                  {overallScore}%
                </Text>
              </GlassCard>
            )}

            {predictionList.map((pred: any, i: number) => (
              <PredictionCard
                key={pred.subdomain_name || pred.event_type || i}
                domain={pred.subdomain_name || pred.event_type || 'General'}
                headline={pred.headline || ''}
                narrative={pred.interpretation || pred.interpretation_paragraph || ''}
                score={pred.probability_score != null ? Math.round(pred.probability_score) : undefined}
              />
            ))}

            {/* Refresh button */}
            <GradientButton
              title="Refresh Predictions"
              variant="secondary"
              onPress={fetchPredictions}
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
  title: { ...typography.styles.h3, color: colors.text },
  subtitle: { ...typography.styles.caption, color: colors.muted, marginTop: 2 },
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

  // Empty state
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: {
    ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center', paddingHorizontal: 16,
  },

  overallCard: { alignItems: 'center', paddingVertical: 20, gap: 4 },
  overallLabel: { ...typography.styles.label, color: colors.muted },
  overallScore: { ...typography.styles.h1, fontSize: 48 },
});
