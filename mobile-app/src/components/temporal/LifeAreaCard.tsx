import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface LifeAreaCardProps {
  name: string;
  domain?: string;
  icon?: string;
  window_type: string;
  intensity?: string;
  opportunity_score: number;
  threat_score: number;
  summary?: string;
  onPress: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  opportunity: colors.success,
  threat: colors.malefic,
  mixed: colors.warning,
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  opportunity: 'trending-up',
  threat: 'trending-down',
  mixed: 'swap-horizontal',
};

const INTENSITY_COLORS: Record<string, string> = {
  strong: colors.success,
  moderate: colors.warning,
  mild: colors.muted,
};

const LIFE_AREA_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
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

export function LifeAreaCard({
  name,
  domain,
  icon,
  window_type,
  intensity,
  opportunity_score,
  threat_score,
  summary,
  onPress,
}: LifeAreaCardProps) {
  const typeColor = TYPE_COLORS[window_type] || colors.muted;
  const typeIcon = TYPE_ICONS[window_type] || 'ellipse';
  const areaIcon = LIFE_AREA_ICONS[icon || ''] || LIFE_AREA_ICONS[name.toLowerCase()] || 'grid-outline';

  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${typeColor}15` }]}>
          <Ionicons name={areaIcon} size={20} color={typeColor} />
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name}>{name}</Text>
          {domain && <Text style={styles.domain}>{domain}</Text>}
        </View>
        <View style={styles.badgeCol}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
            <Ionicons name={typeIcon} size={12} color={typeColor} />
            <Text style={[styles.typeText, { color: typeColor }]}>{window_type}</Text>
          </View>
          {intensity && (
            <Text style={[styles.intensity, { color: INTENSITY_COLORS[intensity] || colors.muted }]}>
              {intensity}
            </Text>
          )}
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.scoreBarRow}>
        <View style={styles.barBg}>
          <View style={[styles.barOpp, { width: `${Math.min(opportunity_score, 100)}%` }]} />
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barThreat, { width: `${Math.min(threat_score, 100)}%` }]} />
        </View>
      </View>
      <View style={styles.scoreLabelRow}>
        <Text style={styles.scoreLabel}>
          <Text style={{ color: colors.success }}>{Math.round(opportunity_score)}%</Text> opp
        </Text>
        <Text style={styles.scoreLabel}>
          <Text style={{ color: colors.malefic }}>{Math.round(threat_score)}%</Text> threat
        </Text>
      </View>

      {summary && <Text style={styles.summary} numberOfLines={2}>{summary}</Text>}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: { flex: 1, gap: 2 },
  name: { ...typography.styles.body, color: colors.text, fontWeight: '600' },
  domain: { ...typography.styles.caption, color: colors.muted },
  badgeCol: { alignItems: 'flex-end', gap: 4 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: { ...typography.styles.caption, fontWeight: '700', textTransform: 'capitalize' },
  intensity: { ...typography.styles.caption, fontWeight: '500', textTransform: 'capitalize' },
  scoreBarRow: { flexDirection: 'row', gap: 6 },
  barBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barOpp: { height: 4, borderRadius: 2, backgroundColor: colors.success },
  barThreat: { height: 4, borderRadius: 2, backgroundColor: colors.malefic },
  scoreLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreLabel: { ...typography.styles.caption, color: colors.muted },
  summary: { ...typography.styles.caption, color: colors.muted, lineHeight: 18 },
});
