import React, { useState, useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { hasBirthData } from '@hooks/useBirthData';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';
import { colors } from '@theme/colors';

export default function AuthLayout() {
  const { isAuthenticated, isReady } = useAuth();
  const [birthChecked, setBirthChecked] = useState(false);
  const [hasBirth, setHasBirth] = useState(true); // default true to avoid flash

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    hasBirthData(true).then((has) => {
      if (!cancelled) {
        setHasBirth(has);
        setBirthChecked(true);
      }
    });

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (!isReady) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!birthChecked) {
    return <LoadingSpinner message="Checking your birth data..." />;
  }

  if (!hasBirth) {
    return <Redirect href="/(auth)/(tabs)/birth-details" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
