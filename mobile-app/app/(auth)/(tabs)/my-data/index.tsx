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

interface NavCard {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

interface NavSection {
  title: string;
  cards: NavCard[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'MY PROFILE',
    cards: [
      {
        label: 'My Details',
        icon: 'person-outline',
        color: colors.accent2,
        route: '/(auth)/(tabs)/my-data/my-details',
      },
      {
        label: 'Avkahada Chakra',
        icon: 'star-outline',
        color: colors.combust,
        route: '/(auth)/(tabs)/my-data/avkahada-chakra',
      },
      {
        label: 'Birth Details',
        icon: 'calendar-outline',
        color: colors.accent,
        route: '/(auth)/(tabs)/birth-details',
      },
      {
        label: 'Saved Charts',
        icon: 'albums-outline',
        color: colors.accent2,
        route: '/(auth)/(tabs)/my-data/saved-charts',
      },
    ],
  },
  {
    title: 'ANALYSIS',
    cards: [
      {
        label: 'My Personality',
        icon: 'happy-outline',
        color: colors.success,
        route: '/(auth)/(tabs)/my-data/my-personality',
      },
      {
        label: 'Yogas & Rajyogas',
        icon: 'trophy-outline',
        color: colors.warning,
        route: '/(auth)/(tabs)/my-data/yogas',
      },
    ],
  },
  {
    title: 'TIMING',
    cards: [
      {
        label: 'Sade Sati Report',
        icon: 'planet-outline',
        color: colors.malefic,
        route: '/(auth)/(tabs)/my-data/sade-sati',
      },
      {
        label: 'Transit',
        icon: 'navigate-outline',
        color: colors.accent,
        route: '/(auth)/(tabs)/my-data/transit',
      },
    ],
  },
  {
    title: 'ACCOUNT',
    cards: [
      {
        label: 'Purchase History',
        icon: 'receipt-outline',
        color: colors.combust,
        route: '/(auth)/(tabs)/my-data/purchase-history',
      },
      {
        label: 'Download Reports',
        icon: 'download-outline',
        color: colors.accent,
        route: '/(auth)/(tabs)/reports/my-reports',
      },
    ],
  },
];

export default function MyDataScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - 10) / 2; // padding 16 each side + 10 gap

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

        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {section.cards.map((card) => (
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
                      <Ionicons name={card.icon} size={22} color={card.color} />
                    </View>
                    <Text style={styles.cardLabel}>{card.label}</Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 100,
    gap: 10,
  },
  title: {
    ...typography.styles.h3,
    color: colors.text,
    paddingTop: 8,
  },
  sectionTitle: {
    ...typography.styles.caption,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    ...typography.styles.caption,
    color: colors.text,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
  },
});
