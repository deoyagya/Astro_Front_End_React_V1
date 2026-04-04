import { withAcceptanceGateHeaders } from '../api/acceptanceGate';

const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const REFRESH_EVENT_KEY = 'session_refresh_event';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const DEFAULT_REFRESH_TIMEOUT_MS = 15_000;
const NON_AUTH_LOCAL_KEYS = [
  'saved_birth_data',
  'cw_is_open',
  'cw_session_state',
  'cart',
  'cart_ids',
];
const NON_AUTH_SESSION_KEYS = [
  'chartBundle',
  'chartBirthInfo',
];
const NON_AUTH_SESSION_PREFIXES = [
  'payment_gateway_config_v4:',
];

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function writeStorage(key, value) {
  const storage = getStorage();
  if (!storage) return;
  if (value == null) {
    storage.removeItem(key);
    return;
  }
  storage.setItem(key, value);
}

function clearStorageKeys(storage, keys = [], prefixes = []) {
  if (!storage) return;
  keys.forEach((key) => storage.removeItem(key));
  for (let i = storage.length - 1; i >= 0; i -= 1) {
    const key = storage.key(i);
    if (!key) continue;
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      storage.removeItem(key);
    }
  }
}

export function clearClientDataCaches() {
  if (typeof window === 'undefined') return;
  clearStorageKeys(window.localStorage, NON_AUTH_LOCAL_KEYS);
  clearStorageKeys(window.sessionStorage, NON_AUTH_SESSION_KEYS, NON_AUTH_SESSION_PREFIXES);
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) || '';
}

export function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) || '';
}

export function getStoredUser() {
  const raw = getStorage()?.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  writeStorage(USER_KEY, user ? JSON.stringify(user) : null);
}

export function setSessionTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) writeStorage(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) writeStorage(REFRESH_TOKEN_KEY, refreshToken);
}

export function announceSessionRefresh() {
  writeStorage(REFRESH_EVENT_KEY, Date.now().toString());
}

export function clearSession() {
  clearClientDataCaches();
  writeStorage(ACCESS_TOKEN_KEY, null);
  writeStorage(REFRESH_TOKEN_KEY, null);
  writeStorage(USER_KEY, null);
}

export function persistSession({ accessToken, refreshToken, user } = {}) {
  setSessionTokens({ accessToken, refreshToken });
  if (user !== undefined) {
    setStoredUser(user);
  }
}

export function getTokenExpiry(token = getAccessToken()) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp || null;
  } catch {
    return null;
  }
}

export async function refreshStoredSession({ timeoutMs = DEFAULT_REFRESH_TIMEOUT_MS } = {}) {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: withAcceptanceGateHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    persistSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    });
    announceSessionRefresh();
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const sessionKeys = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  REFRESH_EVENT_KEY,
};
