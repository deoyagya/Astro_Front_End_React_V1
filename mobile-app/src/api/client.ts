import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// ---------- Configuration ----------
const API_PORT = 8000;

// Base URL resolution — fully automatic, zero hardcoding.
//
// Priority:
//   1. EXPO_PUBLIC_API_BASE_URL env var (for production / manual override)
//   2. Auto-detect from Expo dev server connection (physical devices)
//   3. Platform-specific localhost fallback (simulators / web)
//
// How auto-detect works:
//   When Expo Go loads the app on a physical device, it connects to
//   the Mac's dev server (e.g. "192.168.2.108:8081"). We extract the
//   host part and swap the port to our API port. This means the phone
//   automatically finds the Mac — no hardcoded IPs or hostnames needed.
//
function resolveBaseUrl(): string {
  // 1. Explicit env var always wins
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, '');

  // 2. Auto-detect from Expo dev server (works on physical devices)
  //    Try multiple SDK paths — hostUri location varies across Expo versions
  const devHost =
    Constants.expoConfig?.hostUri ||                                  // SDK 50+
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||      // SDK 49+ manifest2
    (Constants as any).manifest?.debuggerHost;                        // older SDKs
  if (devHost) {
    // devHost looks like "192.168.2.108:8081" — strip the port
    const host = devHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${API_PORT}`;
    }
  }

  // 3. Platform fallbacks (simulators & web)
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;
  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}`;
  return `http://localhost:${API_PORT}`; // iOS simulator
}

const BASE_URL = resolveBaseUrl();
if (__DEV__) console.log('[API] Base URL resolved to:', BASE_URL);
const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000]; // ms between retries

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiError {
  message: string;
  status: number;
  details?: any;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Token helpers ----------
async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
}

async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token);
}

async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token');
}

// ---------- Core request with retry ----------
async function request<T = any>(
  method: Method,
  path: string,
  body?: any,
  options?: { noAuth?: boolean; timeout?: number; retries?: number }
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = options?.noAuth ? null : await getToken();
  const maxRetries = options?.retries ?? MAX_RETRIES;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait before retrying (not on first attempt)
    if (attempt > 0) {
      const delay = RETRY_DELAYS[attempt - 1] || 3000;
      await sleep(delay);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 401 — session expired, no retry
      if (res.status === 401) {
        await clearToken();
        router.replace('/login');
        throw { message: 'Session expired. Please log in again.', status: 401 } as ApiError;
      }

      // Server errors (5xx) — retry
      if (res.status >= 500 && attempt < maxRetries) {
        lastError = { message: `Server error (${res.status})`, status: res.status };
        continue;
      }

      if (!res.ok) {
        let errorData: any;
        try {
          errorData = await res.json();
        } catch {
          errorData = { detail: res.statusText };
        }

        const message =
          typeof errorData.error === 'string'
            ? errorData.error
            : typeof errorData.detail === 'string'
              ? errorData.detail
              : Array.isArray(errorData.detail)
                ? errorData.detail.map((e: any) => e.msg || e.message).join(', ')
                : `Request failed (${res.status})`;

        throw { message, status: res.status, details: errorData } as ApiError;
      }

      // 204 No Content
      if (res.status === 204) return undefined as T;

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);

      // Already-formatted API errors (like 401) — don't retry
      if (err.status && err.status > 0 && err.status < 500) throw err;

      // Network or timeout error — retry
      lastError = err;

      if (attempt < maxRetries) continue;

      // All retries exhausted
      if (err.name === 'AbortError') {
        throw {
          message: 'Request timed out. Please check your internet connection and try again.',
          status: 0,
        } as ApiError;
      }

      throw {
        message: 'Unable to connect. Please check your internet connection and try again.',
        status: 0,
      } as ApiError;
    }
  }

  // Should not reach here, but safety net
  throw lastError || ({ message: 'Unknown error', status: 0 } as ApiError);
}

// ---------- Health check ----------
async function checkHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BASE_URL}/docs`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.message || 'Unreachable',
    };
  }
}

// ---------- Public API ----------
export const api = {
  get: <T = any>(path: string, opts?: { noAuth?: boolean }) =>
    request<T>('GET', path, undefined, opts),

  post: <T = any>(path: string, body?: any, opts?: { noAuth?: boolean; retries?: number }) =>
    request<T>('POST', path, body, opts),

  put: <T = any>(path: string, body?: any) =>
    request<T>('PUT', path, body),

  patch: <T = any>(path: string, body?: any) =>
    request<T>('PATCH', path, body),

  delete: <T = any>(path: string) =>
    request<T>('DELETE', path),

  // Auth helpers
  setToken,
  getToken,
  clearToken,

  // Connectivity
  checkHealth,
  getBaseUrl: () => BASE_URL,
};
