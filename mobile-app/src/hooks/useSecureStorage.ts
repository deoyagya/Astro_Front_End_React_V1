import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

export function useSecureStorage(key: string) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(key)
      .then((v) => setValue(v))
      .catch(() => setValue(null))
      .finally(() => setLoading(false));
  }, [key]);

  const save = useCallback(
    async (newValue: string) => {
      await SecureStore.setItemAsync(key, newValue);
      setValue(newValue);
    },
    [key]
  );

  const remove = useCallback(async () => {
    await SecureStore.deleteItemAsync(key);
    setValue(null);
  }, [key]);

  return { value, loading, save, remove };
}
