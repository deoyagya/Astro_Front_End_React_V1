/**
 * StyleProvider — Reusable context provider for dynamic UI style overrides.
 *
 * Accepts all dependencies via props — no app-specific imports.
 *
 * Props:
 *   registry       — The screen style registry object (screen definitions)
 *   fetchOverrides — () => Promise<{ [screenKey]: { [elementKey]: styles } }>
 *   children       — React children
 *
 * @module lib/style-manager/StyleProvider
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

export const StyleManagerContext = createContext({
  overrides: {},
  registry: {},
  loaded: false,
  refreshStyles: async () => {},
});

export function StyleProvider({ registry, fetchOverrides, children }) {
  const [overrides, setOverrides] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOverrides()
      .then((data) => { if (!cancelled) setOverrides(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [fetchOverrides]);

  const refreshStyles = useCallback(async () => {
    try {
      const data = await fetchOverrides();
      setOverrides(data);
    } catch {
      // silent — keep existing overrides
    }
  }, [fetchOverrides]);

  const value = useMemo(
    () => ({ overrides, registry, loaded, refreshStyles }),
    [overrides, registry, loaded, refreshStyles],
  );

  return (
    <StyleManagerContext.Provider value={value}>
      {children}
    </StyleManagerContext.Provider>
  );
}
