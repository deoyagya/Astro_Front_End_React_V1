import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface DashaNodeProps {
  node: any;
  depth?: number;
  isCurrent?: boolean;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DEPTH_LABELS = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Prana'];

export function DashaNode({ node, depth = 0, isCurrent = false }: DashaNodeProps) {
  const [expanded, setExpanded] = useState(isCurrent);
  const subs = node.sub_periods || node.children || [];
  const hasChildren = subs.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpanded(!expanded);
    }
  };

  const depthLabel = DEPTH_LABELS[depth] || `Level ${depth + 1}`;
  const indent = depth * 16;

  return (
    <View style={{ marginLeft: indent }}>
      <Pressable
        onPress={handleToggle}
        style={[
          styles.nodeRow,
          isCurrent && styles.currentRow,
        ]}
      >
        {hasChildren && (
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={14}
            color={colors.muted}
            style={styles.chevron}
          />
        )}
        {!hasChildren && <View style={styles.chevronPlaceholder} />}

        <View style={styles.nodeContent}>
          <View style={styles.nameRow}>
            <Text style={styles.planetName}>{node.planet || node.lord}</Text>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
          </View>
          <Text style={styles.dates}>
            {formatDate(node.start_date || node.start)} — {formatDate(node.end_date || node.end)}
          </Text>
        </View>

        <Text style={styles.depthLabel}>{depthLabel}</Text>
      </Pressable>

      {expanded &&
        hasChildren &&
        subs.map((sub: any, i: number) => {
          const now = new Date();
          const start = new Date(sub.start_date || sub.start);
          const end = new Date(sub.end_date || sub.end);
          const subIsCurrent = now >= start && now <= end;

          return (
            <DashaNode
              key={`${sub.planet || sub.lord}-${i}`}
              node={sub}
              depth={depth + 1}
              isCurrent={subIsCurrent}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(42,56,86,0.3)',
  },
  currentRow: {
    backgroundColor: 'rgba(67,217,131,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  chevron: {
    marginRight: 6,
  },
  chevronPlaceholder: {
    width: 20,
  },
  nodeContent: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planetName: {
    ...typography.styles.body,
    color: colors.text,
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: 'rgba(67,217,131,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  dates: {
    ...typography.styles.caption,
    color: colors.muted,
  },
  depthLabel: {
    ...typography.styles.caption,
    color: colors.muted,
    fontSize: 10,
  },
});
