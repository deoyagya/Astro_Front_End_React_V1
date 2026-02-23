/**
 * API Client — Centralized fetch wrapper for Vedic Astro backend.
 *
 * Features:
 * - Base URL from environment (VITE_API_BASE_URL)
 * - JWT Authorization header injection
 * - 401 silent refresh interceptor (uses refresh token before redirecting)
 * - JSON parsing with error normalization
 * - Query parameter helper for POST endpoints
 * - Network error resilience: timeout, auto-retry, user-friendly messages
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ---------- Network resilience constants ----------
const DEFAULT_TIMEOUT_MS = 15_000; // 15 s for normal API calls
const DOWNLOAD_TIMEOUT_MS = 30_000; // 30 s for file downloads
const RETRY_DELAY_MS = 1_000; // 1 s delay before auto-retry
const HEALTH_CHECK_TIMEOUT_MS = 5_000; // 5 s for health ping

// HTTP methods safe to auto-retry on network failure
const RETRYABLE_METHODS = new Set(['GET', 'POST']);

// User-friendly messages (never show raw browser errors)
const USER_MESSAGES = {
  offline: 'You appear to be offline. Please check your internet connection and try again.',
  serverDown: 'Our server is temporarily unavailable. Please try again in a few moments.',
  timeout: 'The request took too long. Please check your connection and try again.',
  networkError: 'A connection error occurred. Please check your internet and try again.',
  downloadFail: 'The download could not be completed. Please try again.',
};

// ---------- Helper functions ----------

/**
 * Detect whether a caught error is a network/connection failure
 * (as opposed to an HTTP error response that was already handled).
 */
function isNetworkError(err) {
  if (err.name === 'AbortError') return false; // timeout — handled separately
  if (err.name === 'TypeError') return true; // all browsers throw TypeError for fetch failures
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('unable to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('load failed')
  );
}

/**
 * Create an AbortController that auto-aborts after `ms` milliseconds.
 * Returns { signal, clear } — call clear() to cancel the timeout.
 */
function createTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  };
}

/**
 * Lightweight health ping — determines if the backend is reachable.
 * Pings GET / (no auth, no DB, returns {"status":"ok"}).
 * Returns true if server responds within 5 s, false otherwise.
 */
async function isServerReachable() {
  try {
    const { signal, clear } = createTimeout(HEALTH_CHECK_TIMEOUT_MS);
    const resp = await fetch(`${API_BASE}/`, { method: 'GET', signal });
    clear();
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Map a network-level error to a user-friendly message.
 * Called when fetch() itself throws (not for HTTP error responses).
 */
async function friendlyNetworkError(err) {
  // 1. Timeout (AbortController)
  if (err.name === 'AbortError') {
    return USER_MESSAGES.timeout;
  }

  // 2. Browser says we're offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return USER_MESSAGES.offline;
  }

  // 3. Network error — ping server to distinguish server-down vs client-side issue
  if (isNetworkError(err)) {
    const reachable = await isServerReachable();
    return reachable ? USER_MESSAGES.networkError : USER_MESSAGES.serverDown;
  }

  // 4. Fallback
  return USER_MESSAGES.networkError;
}

// ---------- Auth helpers ----------

/**
 * Attempt a silent token refresh using the stored refresh token.
 * Returns true if the refresh succeeded (new tokens stored), false otherwise.
 */
async function attemptSilentRefresh() {
  const refreshToken = localStorage.getItem('auth_refresh_token');
  if (!refreshToken) return false;

  const { signal, clear } = createTimeout(DEFAULT_TIMEOUT_MS);
  try {
    const resp = await fetch(
      `${API_BASE}/v1/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal },
    );
    if (resp.ok) {
      const data = await resp.json();
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_refresh_token', data.refresh_token);
      // Signal to other tabs that we refreshed
      localStorage.setItem('session_refresh_event', Date.now().toString());
      return true;
    }
  } catch {
    // Network error or timeout — fall through
  } finally {
    clear();
  }
  return false;
}

/** Clear all auth state and redirect to login page. */
function clearAuthAndRedirect() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

// ---------- Core request function ----------

/**
 * Core request function — all API calls go through here.
 * @param {string} endpoint  — e.g. "/v1/chart/create"
 * @param {object} options   — fetch options (method, body, headers, etc.)
 * @returns {Promise<any>}   — parsed JSON response
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Timeout: every request gets a deadline (default 15 s)
  const timeoutMs = options._timeoutMs || DEFAULT_TIMEOUT_MS;
  const { signal, clear } = createTimeout(timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal,
    });
  } catch (err) {
    clear();

    // Auto-retry once for retryable methods on network/timeout errors
    const method = (options.method || 'GET').toUpperCase();
    if (
      !options._isRetry &&
      !options._isNetworkRetry &&
      RETRYABLE_METHODS.has(method) &&
      (isNetworkError(err) || err.name === 'AbortError')
    ) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return apiRequest(endpoint, { ...options, _isNetworkRetry: true });
    }

    // Convert to user-friendly message
    const message = await friendlyNetworkError(err);
    throw new Error(message);
  } finally {
    clear();
  }

  // ---- HTTP-level error handling ----

  // 401 -> attempt silent refresh, retry once, then redirect
  if (response.status === 401) {
    if (!options._isRetry) {
      const refreshed = await attemptSilentRefresh();
      if (refreshed) {
        return apiRequest(endpoint, { ...options, _isRetry: true });
      }
    }
    clearAuthAndRedirect();
    throw new Error('Session expired. Please log in again.');
  }

  // 429 -> rate limited
  if (response.status === 429) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  }

  // Other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    // detail can be a string or an array of { field, message } objects (FastAPI validation)
    let msg = '';
    if (typeof error.detail === 'string') {
      msg = error.detail;
    } else if (Array.isArray(error.detail) && error.detail.length > 0) {
      msg = error.detail.map((d) => d.message || d.msg || JSON.stringify(d)).join('; ');
    } else if (typeof error.error === 'string') {
      msg = error.error;
    }
    throw new Error(msg || `Request failed (${response.status})`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ---------- Public API interface ----------

/**
 * Public API interface.
 */
export const api = {
  /**
   * GET request.
   * @param {string} url — endpoint path (e.g. "/v1/auth/me")
   */
  get: (url) => apiRequest(url),

  /**
   * POST request with JSON body.
   * @param {string} url  — endpoint path (e.g. "/v1/chart/create?include_dasha=true")
   * @param {object} data — request body (will be JSON.stringify'd)
   */
  post: (url, data) =>
    apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * POST request without body (for endpoints that only use query params).
   * @param {string} url — endpoint path with query params
   */
  postEmpty: (url) =>
    apiRequest(url, {
      method: 'POST',
    }),

  /**
   * PUT request with JSON body.
   * @param {string} url  — endpoint path
   * @param {object} data — request body
   */
  put: (url, data) =>
    apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * DELETE request.
   * @param {string} url — endpoint path
   */
  del: (url) =>
    apiRequest(url, {
      method: 'DELETE',
    }),

  /**
   * Raw request for non-JSON responses (e.g. PDF downloads).
   * Returns the raw Response object.
   * @param {string} endpoint — endpoint path
   * @param {object} options  — fetch options
   */
  raw: async (endpoint, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const timeoutMs = options._timeoutMs || DOWNLOAD_TIMEOUT_MS;
    const { signal, clear } = createTimeout(timeoutMs);

    let response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, signal });
    } catch (err) {
      clear();
      const message = await friendlyNetworkError(err);
      throw new Error(message);
    } finally {
      clear();
    }

    if (response.status === 401) {
      if (!options._isRetry) {
        const refreshed = await attemptSilentRefresh();
        if (refreshed) {
          return api.raw(endpoint, { ...options, _isRetry: true });
        }
      }
      clearAuthAndRedirect();
      throw new Error('Session expired.');
    }
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response;
  },

  /**
   * Download a file (e.g. PDF) from an endpoint and trigger a browser download.
   * @param {string} endpoint — e.g. "/v1/reports/abc-123/download"
   * @param {string} filename — fallback filename (e.g. "Career_Report.pdf")
   */
  download: async (endpoint, filename = 'report.pdf') => {
    const token = localStorage.getItem('auth_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { signal, clear } = createTimeout(DOWNLOAD_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(`${API_BASE}${endpoint}`, { headers, signal });
    } catch (err) {
      clear();
      const message = await friendlyNetworkError(err);
      throw new Error(message);
    } finally {
      clear();
    }

    if (response.status === 401) {
      const refreshed = await attemptSilentRefresh();
      if (refreshed) {
        return api.download(endpoint, filename);
      }
      clearAuthAndRedirect();
      throw new Error('Session expired.');
    }
    if (!response.ok) {
      throw new Error(USER_MESSAGES.downloadFail);
    }

    let blob;
    try {
      blob = await response.blob();
    } catch {
      throw new Error(USER_MESSAGES.downloadFail);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export { API_BASE };
