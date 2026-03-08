import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@theme/colors';

export default function ConsultLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
