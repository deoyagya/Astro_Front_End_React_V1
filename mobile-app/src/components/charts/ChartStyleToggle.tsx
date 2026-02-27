import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

export type ChartViewMode = 'Chart Display' | 'Table View';

interface ChartViewToggleProps {
  value: ChartViewMode;
  onChange: (mode: ChartViewMode) => void;
}

export function ChartViewToggle({ value, onChange }: ChartViewToggleProps) {
  const toggle = (mode: ChartViewMode) => {
    if (mode !== value) {
      Haptics.selectionAsync();
      onChange(mode);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => toggle('Chart Display')}
        style={[styles.tab, value === 'Chart Display' && styles.tabActive]}
      >
        <Text
          style={[
            styles.tabText,
            value === 'Chart Display' && styles.tabTextActive,
          ]}
        >
          Chart Display
        </Text>
      </Pressable>
      <Pressable
        onPress={() => toggle('Table View')}
        style={[styles.tab, value === 'Table View' && styles.tabActive]}
      >
        <Text
          style={[
            styles.tabText,
            value === 'Table View' && styles.tabTextActive,
          ]}
        >
          Table View
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    ...typography.styles.label,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
