/**
 * useBirthData — Centralized birth data persistence hook.
 *
 * Used by all tool/report pages to:
 * 1. Pre-fill form fields from saved data (backend for auth users, localStorage for anon)
 * 2. Persist birth data after chart generation
 * 3. Pre-fill user name from AuthContext
 *
 * Phase 26: Chart Data Persistence & Birth Data Pre-population
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const LS_KEY = 'saved_birth_data';

// ---------------------------------------------------------------------------
// Time conversion utilities (centralized — replaces duplicates across pages)
// ---------------------------------------------------------------------------

/** Convert 12h AM/PM to 24h time string "HH:MM" */
export function to24Hour(hour, minute, ampm) {
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (isNaN(h)) h = 6;   // default to 6 AM if empty
  if (isNaN(m)) return '06:00';
  if (ampm === 'AM' && h === 12) h = 0;
  else if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Convert 24h "HH:MM" to { hour, minute, ampm } for 12h form selects */
export function from24Hour(tob) {
  if (!tob || !tob.includes(':')) return { hour: '6', minute: '00', ampm: 'AM' };
  let [h, m] = tob.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: String(h), minute: String(m).padStart(2, '0'), ampm };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * @param {object} options
 * @param {boolean} options.skipAutoLoad — skip auto-loading saved data (e.g. for Compatibility Person B)
 * @param {string}  options.reportType   — report_type when saving ("full", "dasha", etc.)
 */
export function useBirthData(options = {}) {
  const { user, isAuthenticated } = useAuth();
  const { skipAutoLoad = false, reportType = 'full' } = options;

  // Form state
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hour, setHour] = useState('6');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [gender, setGender] = useState('female');
  const [birthPlace, setBirthPlace] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const loadedRef = useRef(false);

  // Apply birth data from a saved record
  const applyBirthData = useCallback((bd) => {
    if (bd.name) setFullName(bd.name);
    if (bd.dob) {
      // Normalize dob to YYYY-MM-DD (type="date" input requirement)
      let dob = bd.dob;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) dob = d.toISOString().split('T')[0];
      }
      setBirthDate(dob);
    }
    if (bd.tob) {
      const { hour: h, minute: m, ampm: ap } = from24Hour(bd.tob);
      setHour(h);
      setMinute(m);
      setAmpm(ap);
    }
    if (bd.gender) setGender(bd.gender);
    if (bd.place_of_birth) {
      setBirthPlace({
        name: bd.place_of_birth,
        lat: bd.lat ?? null,
        lon: bd.lon ?? null,
        timezone: bd.tz_id ?? null,
      });
    }
  }, []);

  // Load saved birth data on mount
  useEffect(() => {
    if (skipAutoLoad || loadedRef.current) {
      setLoaded(true);
      return;
    }
    loadedRef.current = true;

    async function loadSaved() {
      // Priority 1: Backend (authenticated users)
      if (isAuthenticated) {
        try {
          const data = await api.get('/v1/charts/saved?limit=1');
          if (data.charts && data.charts.length > 0) {
            applyBirthData(data.charts[0].birth_data);
            setLoaded(true);
            return;
          }
        } catch {
          // Fall through to localStorage
        }
      }

      // Priority 2: localStorage
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const bd = JSON.parse(saved);
          applyBirthData(bd);
          setLoaded(true);
          return;
        }
      } catch {
        // ignore
      }

      // Priority 3: Pre-fill name from user profile
      if (user?.full_name) {
        setFullName(user.full_name);
      }

      setLoaded(true);
    }

    loadSaved();
  }, [isAuthenticated, user, skipAutoLoad, applyBirthData]);

  // Build API payload from current form state
  const buildPayload = useCallback(() => {
    // Ensure dob is always YYYY-MM-DD regardless of how it was stored
    let normalizedDob = birthDate;
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      // Try to parse non-ISO formats (MM/DD/YYYY, DD/MM/YYYY, etc.)
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) {
        normalizedDob = d.toISOString().split('T')[0];
      }
    }
    const payload = {
      name: fullName.trim(),
      dob: normalizedDob,
      tob: to24Hour(hour, minute, ampm),
      gender,
      place_of_birth: birthPlace?.name || '',
    };
    // Always include lat/lon if available (backend resolves tz from lat/lon)
    if (birthPlace?.lat != null && birthPlace?.lon != null) {
      payload.lat = birthPlace.lat;
      payload.lon = birthPlace.lon;
    }
    // Include tz_id if known (optional — backend resolves from lat/lon if missing)
    if (birthPlace?.timezone) {
      payload.tz_id = birthPlace.timezone;
    }
    return payload;
  }, [fullName, birthDate, hour, minute, ampm, gender, birthPlace]);

  // Validate form fields
  const validate = useCallback(() => {
    if (!fullName.trim()) return 'Please enter your full name.';
    if (!birthDate) return 'Please select your date of birth.';
    if (!hour || !minute || !ampm) return 'Please select your time of birth (hour, minute, and AM/PM).';
    if (!birthPlace) return 'Please select a birth place from the dropdown.';
    return null;
  }, [fullName, birthDate, hour, minute, ampm, birthPlace]);

  // Persist birth data after chart generation
  const saveBirthData = useCallback(async () => {
    const inputData = buildPayload();

    // Always save to localStorage (instant pre-fill next time)
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        ...inputData,
        saved_at: new Date().toISOString(),
      }));
    } catch {
      // quota exceeded etc.
    }

    // If authenticated, also save to backend (fire-and-forget)
    if (isAuthenticated) {
      try {
        api.post('/v1/charts/save', {
          report_type: reportType,
          input_data: inputData,
        });
      } catch {
        // silently ignore
      }
    }
  }, [buildPayload, isAuthenticated, reportType]);

  return {
    // State
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    gender, setGender,
    birthPlace, setBirthPlace,
    loaded,
    // Actions
    saveBirthData,
    buildPayload,
    validate,
    applyBirthData,
  };
}
