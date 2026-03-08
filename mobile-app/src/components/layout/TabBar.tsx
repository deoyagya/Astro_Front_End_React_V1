import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  tools: { active: 'compass', inactive: 'compass-outline' },
  consult: { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
  reports: { active: 'document-text', inactive: 'document-text-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
  'my-data': { active: 'folder', inactive: 'folder-outline' },
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  tools: 'Tools',
  consult: 'Consult',
  reports: 'Reports',
  profile: 'Profile',
  'my-data': 'My Data',
};

// Routes hidden from tab bar (still routable programmatically)
const HIDDEN_ROUTES = new Set(['birth-details']);

// Tabs that have a nested Stack navigator (_layout.tsx)
// Used to safely reset stack on re-tap — Home has no nested Stack.
const TABS_WITH_STACK = new Set(['tools', 'consult', 'reports', 'profile', 'my-data']);

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={80}
      tint="dark"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const tabKey = route.name;
          // Skip hidden routes (e.g. birth-details)
          if (HIDDEN_ROUTES.has(tabKey)) return null;

          const isFocused = state.index === index;
          const icons = TAB_ICONS[tabKey] || TAB_ICONS.index;
          const label = TAB_LABELS[tabKey] || tabKey;

          const handlePress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            } else if (isFocused && TABS_WITH_STACK.has(route.name)) {
              // Re-tapping focused tab: reset nested Stack to its root screen.
              // navigate() with { screen: 'index' } tells the Tab navigator to
              // forward the navigation to the child Stack, which pops back to 'index'.
              navigation.navigate(route.name, { screen: 'index' });
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <Ionicons
                name={(isFocused ? icons.active : icons.inactive) as any}
                size={22}
                color={isFocused ? colors.accent : colors.muted}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? colors.accent : colors.muted },
                  isFocused && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,56,86,0.5)',
    backgroundColor: Platform.OS === 'android' ? colors.tabBar : undefined,
  },
  tabRow: {
    flexDirection: 'row',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: typography.family.medium,
    fontWeight: typography.weight.medium,
  },
  labelActive: {
    fontWeight: typography.weight.semiBold,
  },
});
