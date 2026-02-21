/**
 * API Client — Centralized fetch wrapper for Vedic Astro backend.
 *
 * Features:
 * - Base URL from environment (VITE_API_BASE_URL)
 * - JWT Authorization header injection
 * - 401 silent refresh interceptor (uses refresh token before redirecting)
 * - JSON parsing with error normalization
 * - Query parameter helper for POST endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Attempt a silent token refresh using the stored refresh token.
 * Returns true if the refresh succeeded (new tokens stored), false otherwise.
 */
async function attemptSilentRefresh() {
  const refreshToken = localStorage.getItem('auth_refresh_token');
  if (!refreshToken) return false;
  try {
    const resp = await fetch(
      `${API_BASE}/v1/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } }
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
    // fall through
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // 401 → attempt silent refresh, retry once, then redirect
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

  // 429 → rate limited
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
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
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
    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (response.status === 401) {
      const refreshed = await attemptSilentRefresh();
      if (refreshed) {
        return api.download(endpoint, filename);
      }
      clearAuthAndRedirect();
      throw new Error('Session expired.');
    }
    if (!response.ok) {
      throw new Error(`Download failed (${response.status})`);
    }
    const blob = await response.blob();
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
