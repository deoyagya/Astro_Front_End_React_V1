import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { GlassCard } from '@components/ui/GlassCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const NAV_CARDS = [
  {
    label: 'Saved Charts',
    icon: 'albums-outline' as const,
    color: colors.accent2,
    route: '/(auth)/(tabs)/my-data/saved-charts',
  },
  {
    label: 'Add New Chart',
    icon: 'add-circle-outline' as const,
    color: colors.success,
    route: '/(auth)/(tabs)/tools/new-chart',
  },
  {
    label: 'Purchase History',
    icon: 'receipt-outline' as const,
    color: colors.combust,
    route: '/(auth)/(tabs)/my-data/purchase-history',
  },
  {
    label: 'Download Reports',
    icon: 'download-outline' as const,
    color: colors.accent,
    route: '/(auth)/(tabs)/reports/my-reports',
  },
];

export default function MyDataScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 12) / 2; // padding 16 each side + 12 gap

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate(route as any);
  };

  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>My Data</Text>
        <Text style={styles.subtitle}>
          Manage your charts, orders, and reports
        </Text>

        <View style={styles.grid}>
          {NAV_CARDS.map((card) => (
            <Pressable
              key={card.label}
              onPress={() => handlePress(card.route)}
              style={{ width: cardWidth }}
            >
              <GlassCard style={styles.card}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: `${card.color}15` },
                  ]}
                >
                  <Ionicons name={card.icon} size={28} color={card.color} />
                </View>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
    gap: 16,
  },
  title: {
    ...typography.styles.h1,
    color: colors.text,
    paddingTop: 12,
  },
  subtitle: {
    ...typography.styles.bodySmall,
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    ...typography.styles.label,
    color: colors.text,
    textAlign: 'center',
  },
});
