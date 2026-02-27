import { useState, useCallback } from 'react';
import { api } from '@api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      method: 'get' | 'post' | 'put' | 'patch' | 'delete',
      path: string,
      body?: any
    ): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await (api as any)[method](path, body);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err: any) {
        const message = err.message || 'Something went wrong';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
