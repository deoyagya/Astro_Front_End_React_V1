import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import SessionTimeoutModal from '../components/SessionTimeoutModal';

/* ===== Session timeout constants ===== */
const WARNING_BEFORE_EXPIRY_SEC = 300;  // Show modal 5 minutes before expiry
const CHECK_INTERVAL_MS = 15000;        // Check expiry every 15 seconds

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
 * State:
 *   user           — user object from /v1/auth/me (or null)
 *   token          — JWT access token (persisted in localStorage)
 *   isAuthenticated — true when user is loaded
 *   loading        — true during initial token validation
 *
 * Methods:
 *   login(tokenData)  — store tokens + fetch user profile
 *   logout()          — clear everything, redirect to /login
 *   refreshUser()     — re-fetch user profile from /v1/auth/me
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
          // Token invalid or expired — clear state
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

  /**
   * Login — called after successful OTP verification.
   * @param {{ access_token: string, refresh_token: string }} tokenData
   */
  const login = useCallback(async (tokenData) => {
    localStorage.setItem('auth_token', tokenData.access_token);
    if (tokenData.refresh_token) {
      localStorage.setItem('auth_refresh_token', tokenData.refresh_token);
    }
    setToken(tokenData.access_token);
    // User will be fetched by the useEffect above when token changes
  }, []);

  /**
   * Logout — clear all auth state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Re-fetch user profile (e.g. after role upgrade from payment).
   */
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
   * Refresh session — called by "Stay Logged In" button.
   * Calls the refresh endpoint, stores new tokens, hides modal.
   */
  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (!refreshToken) {
      logout();
      return;
    }
    setRefreshing(true);
    try {
      const data = await api.postEmpty(
        `/v1/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`
      );
      // Store new tokens
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_refresh_token', data.refresh_token);
      setToken(data.access_token);
      // Broadcast to other tabs
      localStorage.setItem('session_refresh_event', Date.now().toString());
      // Hide modal and reset countdown
      setShowTimeoutModal(false);
      setRemainingSeconds(WARNING_BEFORE_EXPIRY_SEC);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    } catch {
      // Refresh failed — force logout
      logout();
    } finally {
      setRefreshing(false);
    }
  }, [logout]);

  /* ===== Session Expiry Monitor (15-second interval) ===== */
  useEffect(() => {
    if (!token) {
      // No token — clear any running timers
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
        // Already expired — logout
        logout();
        return;
      }

      if (remaining <= WARNING_BEFORE_EXPIRY_SEC && !showTimeoutModal) {
        // Enter warning zone — show modal
        setRemainingSeconds(remaining);
        setShowTimeoutModal(true);
      }
    }

    // Run immediately and then every 15 seconds
    checkExpiry();
    sessionTimerRef.current = setInterval(checkExpiry, CHECK_INTERVAL_MS);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [token, logout, showTimeoutModal]);

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
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Countdown reached zero — auto-logout
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
  }, [showTimeoutModal, logout]);

  /* ===== Cross-Tab Sync (localStorage events) ===== */
  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === 'session_refresh_event') {
        // Another tab refreshed the session — re-read token, hide modal
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
        // Another tab logged out — clear local state
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
