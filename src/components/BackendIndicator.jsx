/**
 * BackendIndicator — Dev-only floating badge showing which backend is active.
 *
 * Pings the API health endpoint and inspects the response to determine
 * whether FastAPI (Python) or Laravel (PHP) is serving on the configured port.
 *
 * Only renders in development mode (import.meta.env.DEV).
 */

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function BackendIndicator() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const check = async () => {
      try {
        const resp = await fetch(`${API_BASE}/`, { method: 'GET' });
        const headers = Object.fromEntries(resp.headers.entries());
        const data = await resp.json().catch(() => ({}));

        const server = headers['server'] || headers['x-powered-by'] || 'unknown';
        const isPhp = server.toLowerCase().includes('php');
        const isUvicorn = server.toLowerCase().includes('uvicorn');

        setInfo({
          backend: isPhp ? 'Laravel (PHP)' : isUvicorn ? 'FastAPI (Python)' : server,
          version: data.version || '?',
          ok: !isPhp,
          color: isPhp ? '#ef4444' : '#22c55e',
        });
      } catch {
        setInfo({
          backend: 'Unreachable',
          version: '-',
          ok: false,
          color: '#ef4444',
        });
      }
    };

    check();
    // Re-check every 30s in case you restart a server
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Only show in dev mode
  if (!import.meta.env.DEV || !info) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '12px',
      right: '12px',
      zIndex: 99999,
      background: info.color,
      color: '#fff',
      padding: '6px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'monospace',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'default',
      userSelect: 'none',
    }}>
      <span style={{ fontSize: '8px' }}>{info.ok ? '\u2B24' : '\u26A0'}</span>
      {info.backend} v{info.version}
    </div>
  );
}
