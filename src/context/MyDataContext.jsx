/**
 * MyDataContext — Shared birth payload + chart bundle context for "My Data" dashboard.
 *
 * Provides:
 *   birthPayload  — validated birth data object ready for API calls
 *   hasBirthData  — boolean flag
 *   loadBirthData — set payload + bump refreshKey (triggers child re-fetch)
 *   refreshKey    — counter that child pages key their useEffect on
 *   chartBundle   — full chart/create response (with vargas) for chart rendering
 *   setChartBundle — update chart bundle
 *   registerExternalLoadHandler — register form-sync callback (used by MyDataInner)
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const MyDataContext = createContext(null);

export function MyDataProvider({ children }) {
  const [birthPayload, setBirthPayload] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartBundle, setChartBundle] = useState(null);

  // Callback ref — MyDataInner registers its form-sync handler here
  const onExternalLoadRef = useRef(null);

  const hasBirthData = !!birthPayload;

  const loadBirthData = useCallback((payload, { triggerExternal = false } = {}) => {
    setBirthPayload(payload);
    setRefreshKey((prev) => prev + 1);
    // Sync birth form fields ONLY when triggered by a child page (e.g. SavedCharts)
    if (triggerExternal && onExternalLoadRef.current) {
      onExternalLoadRef.current(payload);
    }
  }, []);

  const registerExternalLoadHandler = useCallback((handler) => {
    onExternalLoadRef.current = handler;
  }, []);

  return (
    <MyDataContext.Provider value={{
      birthPayload, hasBirthData, loadBirthData, refreshKey,
      chartBundle, setChartBundle,
      registerExternalLoadHandler,
    }}>
      {children}
    </MyDataContext.Provider>
  );
}

export function useMyData() {
  const ctx = useContext(MyDataContext);
  if (!ctx) throw new Error('useMyData must be used within MyDataProvider');
  return ctx;
}
