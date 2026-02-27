import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

export type Gender = 'male' | 'female';

interface GenderSelectorProps {
  value: Gender | null;
  onChange: (gender: Gender) => void;
  label?: string;
  error?: string;
}

export function GenderSelector({
  value,
  onChange,
  label = 'Gender',
  error,
}: GenderSelectorProps) {
  const select = (g: Gender) => {
    if (g !== value) {
      Haptics.selectionAsync();
      onChange(g);
    }
  };

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, !!error && styles.containerError]}>
        <Pressable
          onPress={() => select('male')}
          style={[styles.tab, value === 'male' && styles.tabActive]}
        >
          <Ionicons
            name="male"
            size={16}
            color={value === 'male' ? colors.text : colors.muted}
          />
          <Text
            style={[styles.tabText, value === 'male' && styles.tabTextActive]}
          >
            Male
          </Text>
        </Pressable>
        <Pressable
          onPress={() => select('female')}
          style={[styles.tab, value === 'female' && styles.tabActive]}
        >
          <Ionicons
            name="female"
            size={16}
            color={value === 'female' ? colors.text : colors.muted}
          />
          <Text
            style={[
              styles.tabText,
              value === 'female' && styles.tabTextActive,
            ]}
          >
            Female
          </Text>
        </Pressable>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...typography.styles.label,
    color: colors.muted,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerError: {
    borderColor: colors.error,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
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
  error: {
    ...typography.styles.caption,
    color: colors.error,
  },
});
