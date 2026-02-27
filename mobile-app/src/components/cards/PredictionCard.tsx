import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface PredictionCardProps {
  domain: string;
  headline: string;
  narrative: string;
  score?: number;
}

const DOMAIN_ICONS: Record<string, string> = {
  career: 'briefcase',
  finance: 'cash',
  health: 'heart',
  relationship: 'people',
  education: 'school',
  spiritual: 'sparkles',
  family: 'home',
  travel: 'airplane',
};

export function PredictionCard({
  domain,
  headline,
  narrative,
  score,
}: PredictionCardProps) {
  const icon = DOMAIN_ICONS[domain.toLowerCase()] || 'star';
  const scoreColor =
    score && score >= 70
      ? colors.success
      : score && score >= 40
        ? colors.warning
        : colors.error;

  return (
    <GlassCard>
      <View style={styles.header}>
        <View style={styles.domainRow}>
          <Ionicons name={icon as any} size={18} color={colors.accent2} />
          <Text style={styles.domain}>{domain}</Text>
        </View>
        {score !== undefined && (
          <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20` }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>
              {score}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.narrative} numberOfLines={4}>
        {narrative}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  domain: {
    ...typography.styles.label,
    color: colors.accent2,
    textTransform: 'capitalize',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  scoreText: {
    ...typography.styles.caption,
    fontWeight: typography.weight.bold,
  },
  headline: {
    ...typography.styles.body,
    color: colors.text,
    fontWeight: typography.weight.semiBold,
    marginBottom: 4,
  },
  narrative: {
    ...typography.styles.bodySmall,
    color: colors.muted,
    lineHeight: 20,
  },
});
