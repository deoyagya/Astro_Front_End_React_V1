import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Root index — acts as a redirect gate.
 * expo-router always loads app/index.tsx first.
 * We check onboarding state and redirect accordingly.
 */
export default function RootIndex() {
  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem('onboarding_done');
      if (done === 'true') {
        router.replace('/login');
      } else {
        router.replace('/onboarding');
      }
    })();
  }, []);

  // Return nothing — splash screen is still visible
  return null;
}
