import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';
import { activeChartStore } from '@stores/activeChartStore';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function SavedChartsScreen() {
  const [charts, setCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`${CHART.SAVED}?limit=20`);
      setCharts(data?.charts || data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved charts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever screen gains focus (e.g., after creating a new chart)
  useFocusEffect(
    useCallback(() => {
      fetchCharts();
    }, [fetchCharts])
  );

  const handleViewChart = (chart: any) => {
    const bd = chart.birth_data || chart;
    // Set the active chart context — does NOT overwrite user's own birth data
    activeChartStore.set(chart.id, {
      name: bd.name || 'Chart',
      dob: bd.dob,
      tob: bd.tob,
      gender: bd.gender || undefined,
      place_of_birth: bd.place_of_birth,
      lat: bd.lat,
      lon: bd.lon,
    });
    router.navigate('/(auth)/(tabs)/tools/birth-chart' as any);
  };

  const handleDelete = (chart: any) => {
    const bd = chart.birth_data || chart;
    const name = bd.name || 'this chart';
    Alert.alert(
      'Delete Chart',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(CHART.DELETE(chart.id));
              setCharts((prev) => prev.filter((c) => c.id !== chart.id));
            } catch (err: any) {
              setError(err.message || 'Failed to delete chart');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Saved Charts</Text>
        </View>

        {loading && <LoadingSpinner message="Loading saved charts..." />}
        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

        {!loading && charts.length === 0 && !error && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="albums-outline" size={64} color={colors.accent2} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Saved Charts</Text>
            <Text style={styles.emptySubtitle}>
              Your generated charts will appear here.
            </Text>
            <GradientButton
              title="Create First Chart"
              onPress={() => router.navigate('/(auth)/(tabs)/tools/new-chart' as any)}
            />
          </GlassCard>
        )}

        {charts.map((chart, idx) => {
          const bd = chart.birth_data || chart;
          return (
            <Pressable key={chart.id || idx} onPress={() => handleViewChart(chart)}>
              <GlassCard>
                <View style={styles.chartRow}>
                  <View style={styles.chartInfo}>
                    <Text style={styles.chartName}>{bd.name || 'Chart'}</Text>
                    {bd.gender && (
                      <Text style={styles.chartGender}>
                        {bd.gender === 'male' ? '\u2642' : '\u2640'}{' '}
                        {bd.gender.charAt(0).toUpperCase() + bd.gender.slice(1)}
                      </Text>
                    )}
                    <Text style={styles.chartDetail}>
                      {bd.dob ? formatDate(bd.dob) : '—'}
                      {bd.tob ? `, ${bd.tob}` : ''}
                    </Text>
                    {bd.place_of_birth && (
                      <Text style={styles.chartDetail} numberOfLines={1}>
                        {bd.place_of_birth}
                      </Text>
                    )}
                    {chart.created_at && (
                      <Text style={styles.chartMeta}>
                        Saved {formatDate(chart.created_at)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleDelete(chart);
                      }}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          );
        })}

        {!loading && charts.length > 0 && (
          <GradientButton
            title="Refresh"
            variant="secondary"
            onPress={fetchCharts}
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
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: {
    ...typography.styles.body,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartInfo: { flex: 1, gap: 2 },
  chartName: { ...typography.styles.h3, color: colors.text },
  chartGender: { ...typography.styles.caption, color: colors.accent2 },
  chartDetail: { ...typography.styles.bodySmall, color: colors.muted },
  chartMeta: { ...typography.styles.caption, color: colors.muted, marginTop: 4 },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,82,82,0.1)',
  },
  deleteText: { ...typography.styles.caption, color: colors.error, fontWeight: '600' },
});
