import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface ToolCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export function ToolCard({ title, description, icon, onPress }: ToolCardProps) {
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon as any} size={22} color={colors.accent} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
    gap: 6,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(123,91,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    ...typography.styles.label,
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  description: {
    ...typography.styles.caption,
    color: colors.muted,
  },
});
