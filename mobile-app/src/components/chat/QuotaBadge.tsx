import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface QuotaBadgeProps {
  used: number;
  total: number;
}

export function QuotaBadge({ used, total }: QuotaBadgeProps) {
  const remaining = Math.max(0, total - used);
  const pct = total > 0 ? (used / total) * 100 : 0;
  const barColor = pct > 80 ? colors.malefic : pct > 50 ? colors.warning : colors.success;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="chatbubbles-outline" size={14} color={barColor} />
        <Text style={[styles.text, { color: barColor }]}>
          {remaining}/{total} questions remaining
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { ...typography.styles.caption, fontWeight: '600' },
  barBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 3, borderRadius: 2 },
});
