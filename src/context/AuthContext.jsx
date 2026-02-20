import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

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

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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
