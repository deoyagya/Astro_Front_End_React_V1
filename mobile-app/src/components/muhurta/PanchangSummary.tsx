import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface PanchangRow {
  label: string;
  value: string;
  quality?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface PanchangSummaryProps {
  tithi?: string;
  tithi_quality?: string;
  nakshatra?: string;
  nakshatra_quality?: string;
  yoga?: string;
  yoga_quality?: string;
  karana?: string;
  vara?: string;
}

const QUALITY_COLOR: Record<string, string> = {
  excellent: colors.success,
  good: colors.benefic,
  neutral: colors.muted,
  bad: colors.error,
  avoid: colors.malefic,
};

export function PanchangSummary(props: PanchangSummaryProps) {
  const rows: PanchangRow[] = [];

  if (props.vara) rows.push({ label: 'Vara', value: props.vara, icon: 'calendar-outline' });
  if (props.tithi) rows.push({ label: 'Tithi', value: props.tithi, quality: props.tithi_quality, icon: 'moon-outline' });
  if (props.nakshatra) rows.push({ label: 'Nakshatra', value: props.nakshatra, quality: props.nakshatra_quality, icon: 'star-outline' });
  if (props.yoga) rows.push({ label: 'Yoga', value: props.yoga, quality: props.yoga_quality, icon: 'sunny-outline' });
  if (props.karana) rows.push({ label: 'Karana', value: props.karana, icon: 'ellipse-outline' });

  if (rows.length === 0) return null;

  return (
    <View style={styles.container}>
      {rows.map((row) => {
        const qColor = QUALITY_COLOR[row.quality || ''] || colors.muted;
        return (
          <View key={row.label} style={styles.row}>
            <Ionicons name={row.icon} size={14} color={colors.muted} />
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
            {row.quality && (
              <View style={[styles.qBadge, { backgroundColor: `${qColor}20` }]}>
                <Text style={[styles.qText, { color: qColor }]}>{row.quality}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...typography.styles.caption, color: colors.muted, width: 72 },
  value: { ...typography.styles.bodySmall, color: colors.text, flex: 1 },
  qBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  qText: { ...typography.styles.caption, fontSize: 10, fontWeight: '600' },
});
