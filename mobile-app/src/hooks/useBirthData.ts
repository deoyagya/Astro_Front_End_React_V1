import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@context/AuthContext';
import { api } from '@api/client';
import { CHART } from '@api/endpoints';

const STORAGE_KEY = 'saved_birth_data';
export const CHART_CACHE_KEY = 'cached_chart_response';
export const BIRTH_DATA_ENTERED_KEY = 'birth_data_entered';

/**
 * Standalone async check — does saved birth data exist?
 * Used by auth layout to redirect new users to birth-details screen.
 */
export async function hasBirthData(isAuthenticated: boolean): Promise<boolean> {
  // Fast check: was birth data already entered this session?
  try {
    const entered = await AsyncStorage.getItem(BIRTH_DATA_ENTERED_KEY);
    if (entered === 'true') return true;
  } catch {}

  // Priority 1: Backend
  if (isAuthenticated) {
    try {
      const response = await api.get(`${CHART.SAVED}?limit=1`);
      const charts = response?.charts || [];
      if (charts.length > 0 && charts[0].birth_data?.dob) return true;
    } catch {}
  }

  // Priority 2: AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.dob) return true;
    }
  } catch {}

  return false;
}

interface BirthData {
  name: string;
  dob: string; // YYYY-MM-DD
  tob: string; // HH:MM (24h)
  gender?: 'male' | 'female';
  place_of_birth?: string;
  lat?: number;
  lon?: number;
}

interface UseBirthDataOptions {
  reportType?: string;
  skipAutoLoad?: boolean;
}

interface UseBirthDataResult {
  loaded: boolean;
  savedData: BirthData | null;
  saveBirthData: (data: BirthData, reportType?: string) => void;
  reload: () => void;
}

export function useBirthData(options: UseBirthDataOptions = {}): UseBirthDataResult {
  const { skipAutoLoad = false, reportType = 'full' } = options;
  const { user, isAuthenticated } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [savedData, setSavedData] = useState<BirthData | null>(null);

  // Shared load logic — called on mount and via reload()
  // Priority: AsyncStorage first (always has the freshest save), then backend fallback.
  const loadData = useCallback(async () => {
    // Priority 1: AsyncStorage (local cache — written synchronously on every save)
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.dob) {
          setSavedData(parsed);
          setLoaded(true);
          return;
        }
      }
    } catch {
      // Fall through to backend
    }

    // Priority 2: Backend (authenticated users — cross-device source of truth)
    if (isAuthenticated) {
      try {
        const response = await api.get(`${CHART.SAVED}?limit=1`);
        const charts = response?.charts || [];
        if (charts.length > 0 && charts[0].birth_data) {
          const bd = charts[0].birth_data;
          const data: BirthData = {
            name: bd.name || '',
            dob: bd.dob || '',
            tob: bd.tob || '',
            gender: bd.gender || undefined,
            place_of_birth: bd.place_of_birth,
            lat: bd.lat,
            lon: bd.lon,
          };
          setSavedData(data);
          // Sync to AsyncStorage so future reads are instant
          AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...data, saved_at: new Date().toISOString() })
          ).catch((e) => { if (__DEV__) console.warn('[BirthData] AsyncStorage sync failed:', e.message); });
          setLoaded(true);
          return;
        }
      } catch {
        // Fall through to defaults
      }
    }

    // Priority 3: User profile (name only)
    if (user?.full_name) {
      setSavedData({ name: user.full_name, dob: '', tob: '' });
    }

    setLoaded(true);
  }, [isAuthenticated, user?.full_name]);

  // Initial load on mount (unless skipAutoLoad)
  useEffect(() => {
    if (skipAutoLoad) {
      setLoaded(true);
      return;
    }
    loadData();
  }, [skipAutoLoad, loadData]);

  // Expose reload for external callers (e.g., useFocusEffect in birth-chart)
  const reload = useCallback(() => { loadData(); }, [loadData]);

  const saveBirthData = useCallback(
    (data: BirthData, type?: string) => {
      const rt = type || reportType;

      // 1. AsyncStorage — instant persistence
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, saved_at: new Date().toISOString() })
      ).catch((e) => { if (__DEV__) console.warn('[BirthData] AsyncStorage save failed:', e.message); });

      // 2. Backend — fire-and-forget for authenticated users
      if (isAuthenticated) {
        api
          .post(CHART.SAVE, { report_type: rt, input_data: data })
          .catch((e) => { if (__DEV__) console.warn('[BirthData] Backend save failed:', e.message); });
      }
    },
    [isAuthenticated, reportType]
  );

  return { loaded, savedData, saveBirthData, reload };
}

// Utility: parse "HH:MM" → Date (today, that time)
export function parseTimeString(tob: string): Date {
  const [h, m] = (tob || '06:00').split(':').map(Number);
  const d = new Date(1990, 0, 1, h || 6, m || 0);
  return d;
}

// Utility: parse "YYYY-MM-DD" → Date
export function parseDateString(dob: string): Date {
  if (!dob) return new Date(1990, 0, 1);
  const parts = dob.split('-').map(Number);
  return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
}
