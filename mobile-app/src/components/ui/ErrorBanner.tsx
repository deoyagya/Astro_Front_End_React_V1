import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { radius } from '@theme/spacing';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning';
}

export function ErrorBanner({
  message,
  onDismiss,
  variant = 'error',
}: ErrorBannerProps) {
  const bgColor =
    variant === 'error' ? 'rgba(255,71,87,0.12)' : 'rgba(255,180,84,0.12)';
  const borderColor = variant === 'error' ? colors.error : colors.warning;
  const textColor = variant === 'error' ? colors.error : colors.warning;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Ionicons
        name={variant === 'error' ? 'alert-circle' : 'warning'}
        size={18}
        color={textColor}
      />
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color={textColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  message: {
    ...typography.styles.bodySmall,
    flex: 1,
  },
});
