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
import { sanitizeGeo } from '../hooks/useBirthData';

const MyDataContext = createContext(null);

export function MyDataProvider({ children }) {
  const [birthPayload, setBirthPayload] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [chartBundle, setChartBundle] = useState(null);

  // Callback ref — MyDataInner registers its form-sync handler here
  const onExternalLoadRef = useRef(null);

  const hasBirthData = !!birthPayload;

  /**
   * Clear all loaded data — forces child pages back to placeholder state.
   * Used when switching users in dropdown (before Load button is clicked).
   */
  const clearData = useCallback(() => {
    setBirthPayload(null);
    setChartBundle(null);
  }, []);

  const loadBirthData = useCallback((payload, { triggerExternal = false } = {}) => {
    // Sanitize payload — ensure tob has a valid default (backend requires "HH:MM")
    const clean = { ...payload };
    if (!clean.tob || !clean.tob.includes(':')) {
      clean.tob = '12:00';
    }
    // Strip seconds if present (e.g. "06:00:00" → "06:00")
    if (clean.tob && clean.tob.split(':').length > 2) {
      clean.tob = clean.tob.split(':').slice(0, 2).join(':');
    }
    // Ensure gender is a valid value (backend requires 'male' or 'female')
    if (!clean.gender || !['male', 'female'].includes(clean.gender)) {
      clean.gender = 'male';
    }
    // Backend requires ALL THREE (lat + lon + tz_id) or NONE.
    const geo = sanitizeGeo({ lat: clean.lat, lon: clean.lon, tz_id: clean.tz_id });
    delete clean.lat; delete clean.lon; delete clean.tz_id;
    Object.assign(clean, geo);
    setBirthPayload(clean);
    setRefreshKey((prev) => prev + 1);
    // Sync birth form fields ONLY when triggered by a child page (e.g. SavedCharts)
    if (triggerExternal && onExternalLoadRef.current) {
      onExternalLoadRef.current(clean);
    }
  }, []);

  const registerExternalLoadHandler = useCallback((handler) => {
    onExternalLoadRef.current = handler;
  }, []);

  return (
    <MyDataContext.Provider value={{
      birthPayload, hasBirthData, loadBirthData, clearData, refreshKey,
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
