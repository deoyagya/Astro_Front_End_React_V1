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
  // Guard against NaN / undefined — backend may return non-numeric values
  const safeUsed = Number.isFinite(used) ? used : 0;
  const safeTotal = Number.isFinite(total) ? total : 0;

  const remaining = Math.max(0, safeTotal - safeUsed);
  const pct = safeTotal > 0 ? (safeUsed / safeTotal) * 100 : 0;
  const barColor = pct > 80 ? colors.malefic : pct > 50 ? colors.warning : colors.success;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="chatbubbles-outline" size={14} color={barColor} />
        <Text style={[styles.text, { color: barColor }]}>
          {remaining}/{safeTotal} questions remaining
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

/**
 * Normalise the raw backend /v1/chat/quota response into { used, total }.
 *
 * Backend shape:
 *   { max_questions_per_session, monthly_questions_used, unique_charts_used,
 *     unique_charts_limit, session_timeout_minutes, plan }
 *
 * We map monthly_questions_used → used,
 *          max_questions_per_session → total (per-session limit shown as cap).
 */
export function parseQuotaResponse(raw: any): QuotaBadgeProps | null {
  if (!raw || typeof raw !== 'object') return null;

  // Accept both the raw backend shape and the mobile {used, total} shape
  const used =
    raw.monthly_questions_used ?? raw.used ?? 0;
  const total =
    raw.max_questions_per_session ?? raw.total ?? 0;

  return {
    used: Number.isFinite(Number(used)) ? Number(used) : 0,
    total: Number.isFinite(Number(total)) ? Number(total) : 0,
  };
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
