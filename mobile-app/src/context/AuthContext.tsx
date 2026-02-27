import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@api/client';
import { AUTH } from '@api/endpoints';

interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isReady: false,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // On mount: check for existing token and validate
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await api.getToken();
        if (storedToken) {
          setToken(storedToken);
          const userData = await api.get<User>(AUTH.ME);
          setUser(userData);
        }
      } catch {
        // Token invalid or expired — clear it
        await api.clearToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (newToken: string) => {
    await api.setToken(newToken);
    setToken(newToken);
    try {
      const userData = await api.get<User>(AUTH.ME);
      setUser(userData);
    } catch {
      // If /me fails after login, still set token — user data may be fetched later
    }
  }, []);

  const logout = useCallback(async () => {
    await api.clearToken();
    await AsyncStorage.removeItem('birth_data_entered').catch(() => {});
    await AsyncStorage.removeItem('cached_chart_response').catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.get<User>(AUTH.ME);
      setUser(userData);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isReady,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
