import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface WindowCardProps {
  date: string;
  start_time: string;
  end_time: string;
  score: number;
  quality: string;
  tithi?: string;
  nakshatra?: string;
  yoga?: string;
  onPress: () => void;
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: colors.success,
  good: colors.benefic,
  average: colors.warning,
  poor: colors.error,
  avoid: colors.malefic,
};

export function WindowCard({
  date,
  start_time,
  end_time,
  score,
  quality,
  tithi,
  nakshatra,
  yoga,
  onPress,
}: WindowCardProps) {
  const qColor = QUALITY_COLORS[quality] || colors.muted;

  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.time}>{start_time} – {end_time}</Text>
        </View>
        <View style={styles.scoreCol}>
          <View style={[styles.qualityBadge, { backgroundColor: `${qColor}20` }]}>
            <Text style={[styles.qualityText, { color: qColor }]}>{quality}</Text>
          </View>
          <Text style={[styles.score, { color: qColor }]}>{score}/100</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(score, 100)}%`, backgroundColor: qColor }]} />
      </View>

      {/* Panchang summary */}
      {(tithi || nakshatra || yoga) && (
        <View style={styles.panchangRow}>
          {tithi && (
            <View style={styles.panchangItem}>
              <Ionicons name="moon-outline" size={12} color={colors.muted} />
              <Text style={styles.panchangText}>{tithi}</Text>
            </View>
          )}
          {nakshatra && (
            <View style={styles.panchangItem}>
              <Ionicons name="star-outline" size={12} color={colors.muted} />
              <Text style={styles.panchangText}>{nakshatra}</Text>
            </View>
          )}
          {yoga && (
            <View style={styles.panchangItem}>
              <Ionicons name="sunny-outline" size={12} color={colors.muted} />
              <Text style={styles.panchangText}>{yoga}</Text>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  date: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  time: { ...typography.styles.bodySmall, color: colors.muted },
  scoreCol: { alignItems: 'flex-end', gap: 4 },
  qualityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  qualityText: { ...typography.styles.caption, fontWeight: '700', textTransform: 'capitalize' },
  score: { ...typography.styles.caption, fontWeight: '600' },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },
  panchangRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  panchangItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panchangText: { ...typography.styles.caption, color: colors.muted },
});
