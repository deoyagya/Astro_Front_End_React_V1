import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface TemplateChipProps {
  text: string;
  creditCost?: number;
  onPress: () => void;
  disabled?: boolean;
}

export function TemplateChip({ text, creditCost, onPress, disabled }: TemplateChipProps) {
  return (
    <Pressable
      style={[styles.chip, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
      <Text style={styles.text} numberOfLines={3}>{text}</Text>
      {creditCost != null && (
        <View style={styles.costBadge}>
          <Ionicons name="flash" size={10} color={colors.warning} />
          <Text style={styles.costText}>{creditCost}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  text: { ...typography.styles.bodySmall, color: colors.text, flex: 1 },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${colors.warning}15`,
  },
  costText: { ...typography.styles.caption, color: colors.warning, fontSize: 10, fontWeight: '700' },
});
