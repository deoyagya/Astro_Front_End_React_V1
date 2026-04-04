import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function resolveFeatureEnabled(payload, featureKey) {
  const featureRows = Array.isArray(payload?.feature_rows) ? payload.feature_rows : [];
  const row = featureRows.find((item) => item.feature_key === featureKey);
  if (row) return !!row.enabled;

  const features = payload?.features;
  if (features && typeof features === 'object' && features[featureKey]) {
    return !!features[featureKey].enabled;
  }

  return false;
}

export function useFeatureAccess(featureKey) {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState({ loading: !!isAuthenticated, allowed: false });

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated) {
      setState({ loading: false, allowed: false });
      return undefined;
    }

    if (user?.role === 'admin') {
      setState({ loading: false, allowed: true });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true }));
    api.get('/v1/subscription/current')
      .then((payload) => {
        if (cancelled) return;
        setState({
          loading: false,
          allowed: resolveFeatureEnabled(payload, featureKey),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, allowed: false });
      });

    return () => {
      cancelled = true;
    };
  }, [featureKey, isAuthenticated, user?.role]);

  return useMemo(
    () => ({
      loading: state.loading,
      allowed: state.allowed,
    }),
    [state.allowed, state.loading],
  );
}
