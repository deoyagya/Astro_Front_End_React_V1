/**
 * API Client — Centralized fetch wrapper for Vedic Astro backend.
 *
 * Features:
 * - Base URL from environment (VITE_API_BASE_URL)
 * - JWT Authorization header injection
 * - 401 auto-logout (clears token, redirects to /login)
 * - JSON parsing with error normalization
 * - Query parameter helper for POST endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

  // 401 → session expired → clear token and redirect
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  // 429 → rate limited
  if (response.status === 429) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  }

  // Other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || `Request failed (${response.status})`);
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
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
