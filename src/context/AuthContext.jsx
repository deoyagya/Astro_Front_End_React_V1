import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import SessionTimeoutModal from '../components/SessionTimeoutModal';

/* ===== Session timeout constants ===== */
const WARNING_BEFORE_EXPIRY_SEC = 300;  // Show modal 5 min before expiry (if idle)
const CHECK_INTERVAL_MS = 15000;        // Check expiry every 15 seconds
const IDLE_THRESHOLD_MS = 25 * 60 * 1000; // 25 min idle = genuinely inactive
const SILENT_REFRESH_BUFFER_SEC = 120;  // Silently refresh 2 min before expiry

/** Decode JWT exp claim (seconds since epoch). Returns null on failure. */
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp || null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app to provide authentication state.
 *
 * Session management:
 *   - Tracks user activity (mouse, keyboard, scroll, API calls)
 *   - Silently refreshes token while user is active
 *   - Only shows timeout modal when user is genuinely idle
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Session timeout modal state
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(WARNING_BEFORE_EXPIRY_SEC);
  const [refreshing, setRefreshing] = useState(false);
  const sessionTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // Activity tracking
  const lastActivityRef = useRef(Date.now());
  const silentRefreshInFlightRef = useRef(false);

  // --- Activity tracker: reset on any user interaction ---
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, markActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markActivity));
  }, [markActivity]);

  // Also mark activity on API calls (patched into client.js via custom event)
  useEffect(() => {
    const onApiCall = () => markActivity();
    window.addEventListener('api-activity', onApiCall);
    return () => window.removeEventListener('api-activity', onApiCall);
  }, [markActivity]);

  function isUserIdle() {
    return Date.now() - lastActivityRef.current > IDLE_THRESHOLD_MS;
  }

  // On mount (or token change): validate token by fetching /me
  useEffect(() => {
    if (token) {
      api
        .get('/v1/auth/me')
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  /** Login — called after successful OTP verification. */
  const login = useCallback(async (tokenData) => {
    localStorage.setItem('auth_token', tokenData.access_token);
    if (tokenData.refresh_token) {
      localStorage.setItem('auth_refresh_token', tokenData.refresh_token);
    }
    setToken(tokenData.access_token);
    lastActivityRef.current = Date.now();
  }, []);

  /** Logout — clear all auth state. */
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  /** Re-fetch user profile (e.g. after role upgrade from payment). */
  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get('/v1/auth/me');
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    } catch {
      return null;
    }
  }, []);

  /**
   * Silently refresh the session — no modal, no user action needed.
   * Called automatically when user is active and token is near expiry.
   */
  const silentRefresh = useCallback(async () => {
    if (silentRefreshInFlightRef.current) return;
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) return;

    silentRefreshInFlightRef.current = true;
    try {
      const data = await api.post('/v1/auth/refresh', { refresh_token: refreshToken });
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_refresh_token', data.refresh_token);
      setToken(data.access_token);
      localStorage.setItem('session_refresh_event', Date.now().toString());
    } catch {
      // Silent refresh failed — don't logout yet, the modal flow will handle it
    } finally {
      silentRefreshInFlightRef.current = false;
    }
  }, []);

  /**
   * Manual refresh — called by "Stay Logged In" button.
   */
  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) {
      logout();
      return;
    }
    setRefreshing(true);
    try {
      const data = await api.post('/v1/auth/refresh', { refresh_token: refreshToken });
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_refresh_token', data.refresh_token);
      setToken(data.access_token);
      localStorage.setItem('session_refresh_event', Date.now().toString());
      setShowTimeoutModal(false);
      setRemainingSeconds(WARNING_BEFORE_EXPIRY_SEC);
      lastActivityRef.current = Date.now();
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    } catch {
      logout();
    } finally {
      setRefreshing(false);
    }
  }, [logout]);

  /* ===== Session Expiry Monitor (15-second interval) ===== */
  useEffect(() => {
    if (!token) {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setShowTimeoutModal(false);
      return;
    }

    function checkExpiry() {
      const currentToken = localStorage.getItem('auth_token');
      if (!currentToken) return;

      const exp = getTokenExpiry(currentToken);
      if (!exp) return;

      const nowSec = Math.floor(Date.now() / 1000);
      const remaining = exp - nowSec;

      if (remaining <= 0) {
        logout();
        return;
      }

      // If modal is already showing, let the countdown handle it — don't interfere
      if (showTimeoutModal) return;

      // User is ACTIVE and token is approaching expiry → silent refresh
      if (!isUserIdle() && remaining <= SILENT_REFRESH_BUFFER_SEC) {
        silentRefresh();
        return;
      }

      // User is IDLE and token is in warning zone → show modal
      if (isUserIdle() && remaining <= WARNING_BEFORE_EXPIRY_SEC) {
        setRemainingSeconds(remaining);
        setShowTimeoutModal(true);
      }
    }

    checkExpiry();
    sessionTimerRef.current = setInterval(checkExpiry, CHECK_INTERVAL_MS);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [token, logout, showTimeoutModal, silentRefresh]);

  /* ===== Countdown Timer (1-second interval when modal visible) ===== */
  useEffect(() => {
    if (!showTimeoutModal) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      // Modal is visible — let the USER decide (Stay Logged In / End Session).
      // Only auto-logout when the countdown reaches zero.
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [showTimeoutModal, logout, silentRefresh]);

  /* ===== Cross-Tab Sync (localStorage events) ===== */
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'session_refresh_event') {
        const newToken = localStorage.getItem('auth_token');
        if (newToken) {
          setToken(newToken);
          setShowTimeoutModal(false);
          setRemainingSeconds(WARNING_BEFORE_EXPIRY_SEC);
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
        }
      } else if (e.key === 'auth_token' && !e.newValue) {
        setToken(null);
        setUser(null);
        setShowTimeoutModal(false);
      }
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutModal
        visible={showTimeoutModal}
        remainingSeconds={remainingSeconds}
        onStayLoggedIn={refreshSession}
        onEndSession={logout}
        refreshing={refreshing}
      />
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * @returns {{ user, token, isAuthenticated, loading, login, logout, refreshUser }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}

export default AuthContext;
