import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@components/layout/Screen';
import { AppHeader } from '@components/layout/AppHeader';
import { ToolCard } from '@components/cards/ToolCard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const { width } = Dimensions.get('window');

const TOOLS = [
  {
    title: 'Birth Chart',
    description: 'Generate your Vedic birth chart with planet positions and dignities',
    icon: 'planet',
    route: '/tools/birth-chart',
  },
  {
    title: 'Dasha Timeline',
    description: 'Explore your Vimshottari Dasha periods and sub-periods',
    icon: 'time',
    route: '/tools/dasha',
  },
  {
    title: 'Compatibility',
    description: 'Kundli Milan — check Guna compatibility between two charts',
    icon: 'heart',
    route: '/tools/compatibility',
  },
  {
    title: 'Horoscope',
    description: 'AI-powered personalized predictions based on your chart',
    icon: 'telescope',
    route: '/tools/horoscope',
  },
];

export default function ToolsListScreen() {
  return (
    <Screen>
      <AppHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>Free Tools</Text>
        <Text style={styles.subtitle}>
          Explore classical Vedic astrology calculations
        </Text>

        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.title}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              onPress={() => router.navigate(tool.route as any)}
            />
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
    paddingTop: 4,
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
});
