import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { ErrorBanner } from '@components/ui/ErrorBanner';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { QuotaBadge } from '@components/chat/QuotaBadge';
import { usePremiumGate } from '@hooks/usePremiumGate';
import { api } from '@api/client';
import { CHAT } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface LifeArea {
  key: string;
  name: string;
  domain?: string;
  icon?: string;
}

interface ChatSession {
  id: string;
  life_area_key: string;
  life_area_name?: string;
  question_count: number;
  status: string;
  created_at: string;
}

interface Quota {
  used: number;
  total: number;
}

const AREA_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  health: 'heart-outline',
  education: 'school-outline',
  finance: 'cash-outline',
  spiritual: 'leaf-outline',
  family: 'people-outline',
  children: 'happy-outline',
  legal: 'shield-outline',
  property: 'home-outline',
  travel: 'airplane-outline',
  prashna: 'help-circle-outline',
  varshaphal: 'calendar-outline',
  compatibility: 'heart-half-outline',
  general: 'grid-outline',
};

const AREA_COLORS: Record<string, string> = {
  health: colors.malefic,
  education: colors.accent2,
  finance: colors.success,
  spiritual: colors.accent,
  family: colors.warning,
  children: colors.combust,
  legal: colors.error,
  property: colors.benefic,
  travel: colors.accent2,
  prashna: colors.accent,
  varshaphal: colors.warning,
  compatibility: colors.malefic,
  general: colors.muted,
};

export default function ChatAreasScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 10) / 2;
  const { isBasicPlus } = usePremiumGate();

  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        setError('');
        try {
          const [areaRes, quotaRes, sessRes] = await Promise.all([
            api.get(CHAT.LIFE_AREAS),
            api.get(CHAT.QUOTA).catch(() => null),
            api.get(`${CHAT.SESSIONS}?limit=5`).catch(() => ({ sessions: [] })),
          ]);
          setAreas(areaRes?.areas || areaRes || []);
          setQuota(quotaRes);
          setSessions(sessRes?.sessions || []);
        } catch (err: any) {
          setError(err.message || 'Failed to load chat data');
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  if (!isBasicPlus) {
    return (
      <Screen>
        <AppHeader />
        <View style={styles.gateCentered}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.warning} />
          <Text style={styles.gateTitle}>Premium Feature</Text>
          <Text style={styles.gateSubtitle}>AI Chat requires a paid subscription.</Text>
          <Pressable
            style={styles.gateBtn}
            onPress={() => router.push('/(auth)/(tabs)/my-data/subscription' as any)}
          >
            <Text style={styles.gateBtnText}>View Plans</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>AI Vedic Chat</Text>
        </View>

        {quota && <QuotaBadge used={quota.used} total={quota.total} />}

        {!!error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
        {loading && <LoadingSpinner message="Loading..." />}

        {!loading && (
          <>
            <Text style={styles.sectionLabel}>What area of life?</Text>
            <View style={styles.grid}>
              {areas.map((area) => {
                const aColor = AREA_COLORS[area.key] || colors.accent;
                const aIcon = AREA_ICONS[area.key] || 'grid-outline';
                return (
                  <Pressable
                    key={area.key}
                    style={{ width: cardWidth }}
                    onPress={() =>
                      router.push({
                        pathname: '/(auth)/(tabs)/consult/chat-templates',
                        params: { life_area_key: area.key, area_name: area.name },
                      } as any)
                    }
                  >
                    <GlassCard style={styles.areaCard}>
                      <View style={[styles.iconCircle, { backgroundColor: `${aColor}15` }]}>
                        <Ionicons name={aIcon} size={20} color={aColor} />
                      </View>
                      <Text style={styles.areaName}>{area.name}</Text>
                      {area.domain && <Text style={styles.areaDomain}>{area.domain}</Text>}
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>

            {sessions.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Recent Sessions</Text>
                <FlatList
                  data={sessions}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(s) => s.id}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item }) => (
                    <GlassCard
                      onPress={() =>
                        router.push({
                          pathname: '/(auth)/(tabs)/consult/chat-thread',
                          params: { session_id: item.id },
                        } as any)
                      }
                      style={styles.sessionCard}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.accent} />
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {item.life_area_name || item.life_area_key}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {item.question_count} Q · {item.status}
                      </Text>
                    </GlassCard>
                  )}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text },
  sectionLabel: { ...typography.styles.label, color: colors.muted, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  areaCard: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaName: { ...typography.styles.caption, color: colors.text, textAlign: 'center', fontWeight: '500' },
  areaDomain: { ...typography.styles.caption, color: colors.muted, fontSize: 10 },
  sessionCard: { width: 150, gap: 6 },
  sessionName: { ...typography.styles.caption, color: colors.text, fontWeight: '500' },
  sessionMeta: { ...typography.styles.caption, color: colors.muted, fontSize: 10 },
  // Premium gate
  gateCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  gateTitle: { ...typography.styles.h3, color: colors.text },
  gateSubtitle: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center' },
  gateBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.accent,
    marginTop: 8,
  },
  gateBtnText: { ...typography.styles.button, color: colors.text },
});
