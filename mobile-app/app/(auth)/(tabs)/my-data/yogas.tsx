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
import { YOGA } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const TYPE_COLORS: Record<string, string> = {
  raja: colors.accent,
  dhana: colors.warning,
  pancha_mahapurusha: colors.accent2,
  gajakesari: colors.success,
  budha_aditya: colors.combust,
  viparita: colors.malefic,
  exchange: colors.benefic,
  chandra: colors.accent2,
  surya: colors.combust,
  special: colors.accent,
};

function getTypeColor(type: string): string {
  const lower = (type || '').toLowerCase().replace(/[\s-]/g, '_');
  return TYPE_COLORS[lower] || colors.accent;
}

function getStrengthIcon(strength: string): { icon: string; color: string } {
  switch (strength?.toLowerCase()) {
    case 'strong':
    case 'full':
      return { icon: 'arrow-up-circle', color: colors.success };
    case 'moderate':
    case 'medium':
      return { icon: 'remove-circle', color: colors.warning };
    case 'weak':
    case 'partial':
      return { icon: 'arrow-down-circle', color: colors.error };
    default:
      return { icon: 'ellipse', color: colors.muted };
  }
}

export default function YogasScreen() {
  const { loaded, savedData } = useBirthData({});
  const activeData = activeChartStore.getBirthData();
  const effectiveData = activeData ?? savedData;

  const [yogas, setYogas] = useState<any[]>([]);
  const [totalYogas, setTotalYogas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchYogas = useCallback(async () => {
    if (!effectiveData?.dob || !effectiveData?.tob || !effectiveData?.place_of_birth) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post(YOGA.SCAN, {
        name: effectiveData.name || 'Chart',
        dob: effectiveData.dob,
        tob: effectiveData.tob,
        gender: effectiveData.gender || undefined,
        place_of_birth: effectiveData.place_of_birth,
      });
      setYogas(data?.yogas || []);
      setTotalYogas(data?.total_yogas || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to scan yogas');
    } finally {
      setLoading(false);
    }
  }, [effectiveData?.dob, effectiveData?.tob, effectiveData?.place_of_birth]);

  useFocusEffect(
    useCallback(() => {
      if (loaded && effectiveData?.dob) fetchYogas();
    }, [loaded, fetchYogas])
  );

  // Group yogas by yoga_type (backend field name)
  const grouped = yogas.reduce<Record<string, any[]>>((acc, y) => {
    const type = y.yoga_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(y);
    return acc;
  }, {});

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Yogas & Rajyogas</Text>
            {totalYogas > 0 && (
              <Text style={styles.subtitle}>{totalYogas} yoga{totalYogas > 1 ? 's' : ''} detected</Text>
            )}
          </View>
        </View>

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Scanning yogas..." />}

        {!loading && loaded && !effectiveData?.dob && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={64} color={colors.warning} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Birth Details</Text>
            <Text style={styles.emptySubtitle}>Enter your birth details to scan for classical yogas.</Text>
          </GlassCard>
        )}

        {/* Grouped yoga cards */}
        {Object.entries(grouped).map(([type, items]) => (
          <View key={type}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: getTypeColor(type) }]} />
              <Text style={styles.groupTitle}>{formatTypeName(type)}</Text>
              <Text style={styles.groupCount}>{items.length}</Text>
            </View>

            {items.map((y: any, idx: number) => {
              const strengthInfo = getStrengthIcon(y.strength);
              return (
                <GlassCard key={`${y.yoga_name}-${idx}`} style={styles.yogaCard}>
                  <View style={styles.yogaHeader}>
                    <Text style={styles.yogaName}>{y.yoga_name}</Text>
                    {y.strength && (
                      <View style={styles.strengthRow}>
                        <Ionicons name={strengthInfo.icon as any} size={14} color={strengthInfo.color} />
                        <Text style={[styles.strengthText, { color: strengthInfo.color }]}>
                          {y.strength}
                        </Text>
                      </View>
                    )}
                  </View>

                  {y.mechanism && (
                    <Text style={styles.yogaDesc}>{y.mechanism}</Text>
                  )}

                  {y.commentary && (
                    <Text style={styles.yogaDesc}>{y.commentary}</Text>
                  )}

                  {y.forming_planets && y.forming_planets.length > 0 && (
                    <View style={styles.planetRow}>
                      <Text style={styles.planetLabel}>Planets:</Text>
                      <Text style={styles.planetValue}>{y.forming_planets.join(', ')}</Text>
                    </View>
                  )}

                  {y.classical_reference && (
                    <Text style={styles.sourceText}>{y.classical_reference}</Text>
                  )}
                </GlassCard>
              );
            })}
          </View>
        ))}

        {!loading && yogas.length === 0 && effectiveData?.dob && !error && (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="search-outline" size={48} color={colors.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Yogas Detected</Text>
            <Text style={styles.emptySubtitle}>No classical yogas were found in this chart.</Text>
          </GlassCard>
        )}
      </ScrollView>
    </Screen>
  );
}

function formatTypeName(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTitle: {
    ...typography.styles.label,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupCount: {
    ...typography.styles.caption,
    color: colors.muted,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  yogaCard: { marginBottom: 0 },
  yogaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  yogaName: { ...typography.styles.label, color: colors.text, fontWeight: '600', fontSize: 15, flex: 1 },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strengthText: { ...typography.styles.caption, fontWeight: '600', textTransform: 'capitalize' },
  yogaDesc: { ...typography.styles.bodySmall, color: colors.muted, lineHeight: 20, marginBottom: 4 },
  planetRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  planetLabel: { ...typography.styles.caption, color: colors.muted, fontWeight: '600' },
  planetValue: { ...typography.styles.caption, color: colors.accent2 },
  sourceText: { ...typography.styles.caption, color: colors.muted, fontStyle: 'italic', marginTop: 4, opacity: 0.7 },
});
