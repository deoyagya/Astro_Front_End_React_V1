import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface DashaPeriodCardProps {
  planet: string;
  startDate: string;
  endDate: string;
  levelLabel: string;
  isCurrent: boolean;
  hasChildren: boolean;
  onPress?: () => void;
}

export function DashaPeriodCard({
  planet,
  startDate,
  endDate,
  levelLabel,
  isCurrent,
  hasChildren,
  onPress,
}: DashaPeriodCardProps) {
  return (
    <GlassCard
      onPress={hasChildren ? onPress : undefined}
      style={[styles.card, isCurrent && styles.currentCard]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.nameRow}>
            <Text style={[styles.planet, isCurrent && styles.currentPlanet]}>
              {planet}
            </Text>
            {isCurrent && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Current</Text>
              </View>
            )}
          </View>
          <Text style={styles.dates}>
            {formatDate(startDate)} — {formatDate(endDate)}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.levelLabel}>{levelLabel}</Text>
          {hasChildren && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.muted}
            />
          )}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  currentCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    borderColor: 'rgba(67,217,131,0.25)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planet: {
    ...typography.styles.h3,
    color: colors.text,
  },
  currentPlanet: {
    color: colors.success,
  },
  badge: {
    backgroundColor: 'rgba(67,217,131,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  dates: {
    ...typography.styles.caption,
    color: colors.muted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  levelLabel: {
    ...typography.styles.caption,
    color: colors.muted,
    fontSize: 10,
  },
});
