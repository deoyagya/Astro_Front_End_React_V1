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
        <Ionicons name={icon as any} size={28} color={colors.accent} />
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
    minHeight: 140,
    gap: 8,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(123,91,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...typography.styles.h3,
    color: colors.text,
    fontSize: 16,
  },
  description: {
    ...typography.styles.caption,
    color: colors.muted,
  },
});
