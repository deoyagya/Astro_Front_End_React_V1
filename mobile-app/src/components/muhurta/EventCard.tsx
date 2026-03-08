import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface EventCardProps {
  name: string;
  icon?: string;
  price?: number;
  selected?: boolean;
  onPress: () => void;
}

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  marriage: 'heart-outline',
  travel: 'airplane-outline',
  business: 'briefcase-outline',
  education: 'school-outline',
  property: 'home-outline',
  medical: 'medkit-outline',
  griha_pravesh: 'home-outline',
  vehicle: 'car-outline',
};

export function EventCard({ name, icon, price, selected, onPress }: EventCardProps) {
  const ionIcon = EVENT_ICONS[icon || ''] || 'calendar-outline';

  return (
    <GlassCard
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={ionIcon} size={22} color={selected ? colors.accent : colors.accent2} />
      </View>
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <Text style={[styles.price, price ? styles.pricePaid : styles.priceFree]}>
        {price ? `₹${price}` : 'Free'}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 6, paddingVertical: 14 },
  selected: { borderColor: colors.accent, borderWidth: 1.5 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(67,208,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.styles.caption, color: colors.text, textAlign: 'center', fontWeight: '500' },
  price: { ...typography.styles.caption, fontWeight: '600' },
  pricePaid: { color: colors.warning },
  priceFree: { color: colors.success },
});
