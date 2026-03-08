import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@components/layout/TabBar';
import { colors } from '@theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tools" />
      <Tabs.Screen name="consult" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="my-data" />
      <Tabs.Screen name="birth-details" options={{ href: null }} />
    </Tabs>
  );
}
