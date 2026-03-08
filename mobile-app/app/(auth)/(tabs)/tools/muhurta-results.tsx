import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { GradientButton } from '@components/ui/GradientButton';
import { WindowCard } from '@components/muhurta/WindowCard';
import { useAuth } from '@context/AuthContext';
import { api } from '@api/client';
import { MUHURTA } from '@api/endpoints';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

export default function MuhurtaResultsScreen() {
  const { resultJson, eventLabel, eventType } = useLocalSearchParams<{
    resultJson: string;
    eventLabel: string;
    eventType: string;
  }>();
  const { user } = useAuth();
  const [emailing, setEmailing] = useState(false);

  const result = useMemo(() => {
    try { return JSON.parse(resultJson || '{}'); }
    catch { return {}; }
  }, [resultJson]);

  const windows = result.windows || result.results || [];
  const mode = result.mode || (result.birth_person ? 'personalized' : 'generic');

  const handleEmailReport = async () => {
    if (!user?.email) {
      Alert.alert('No Email', 'Please add an email to your profile first.');
      return;
    }
    setEmailing(true);
    try {
      await api.post(MUHURTA.REPORT, {
        event_type: eventType,
        start_date: result.date_range?.start || result.start_date,
        end_date: result.date_range?.end || result.end_date,
        lat: result.location?.lat || result.lat,
        lon: result.location?.lon || result.lon,
        tz_id: result.location?.tz_id || 'Asia/Kolkata',
        birth_data: result.birth_person || undefined,
        email: user.email,
      });
      Alert.alert('Report Sent', `Muhurta report sent to ${user.email}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send report');
    } finally {
      setEmailing(false);
    }
  };

  const handleWindowPress = (idx: number) => {
    const win = windows[idx];
    router.push({
      pathname: '/(auth)/(tabs)/tools/muhurta-detail',
      params: {
        windowJson: JSON.stringify(win),
        eventType: eventType || '',
        locationJson: JSON.stringify(result.location || {}),
        birthJson: result.birth_person ? JSON.stringify(result.birth_person) : '',
      },
    } as any);
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>{eventLabel || 'Muhurta Results'}</Text>
        </View>

        {/* Summary */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.summaryText}>
              {windows.length} window{windows.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="options-outline" size={16} color={colors.muted} />
            <Text style={styles.modeText}>Mode: {mode}</Text>
          </View>
        </GlassCard>

        {/* Windows list */}
        {windows.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={colors.muted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Windows Found</Text>
            <Text style={styles.emptySubtitle}>
              Try expanding your date range or choosing a different event type.
            </Text>
          </GlassCard>
        ) : (
          <View style={styles.windowsList}>
            {windows.map((win: any, idx: number) => (
              <WindowCard
                key={`${win.date}-${win.start_time}-${idx}`}
                date={win.date}
                start_time={win.start_time || win.time_start || ''}
                end_time={win.end_time || win.time_end || ''}
                score={win.score || win.total_score || 0}
                quality={win.quality || win.verdict || 'average'}
                tithi={win.panchang?.tithi?.name || win.tithi}
                nakshatra={win.panchang?.nakshatra?.name || win.nakshatra}
                yoga={win.panchang?.yoga?.name || win.yoga}
                onPress={() => handleWindowPress(idx)}
              />
            ))}
          </View>
        )}

        {windows.length > 0 && (
          <GradientButton
            title={emailing ? 'Sending...' : 'Email Report'}
            onPress={handleEmailReport}
            loading={emailing}
            variant="secondary"
            style={{ marginTop: 8 }}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4, marginBottom: 4 },
  title: { ...typography.styles.h3, color: colors.text, flex: 1 },
  summaryCard: { gap: 6 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  modeText: { ...typography.styles.caption, color: colors.muted, textTransform: 'capitalize' },
  emptyCard: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { ...typography.styles.h3, color: colors.text },
  emptySubtitle: { ...typography.styles.bodySmall, color: colors.muted, textAlign: 'center', paddingHorizontal: 16 },
  windowsList: { gap: 10 },
});
