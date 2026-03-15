/**
 * SiteGate — Temporary site access control via environment-stored passcode.
 *
 * The access code is set via Vercel env var VITE_SITE_GATE_CODE.
 * If the env var is empty/missing, the gate is disabled (site is open).
 * Verified flag stored in sessionStorage (resets when browser closes).
 *
 * To disable: remove VITE_SITE_GATE_CODE from Vercel env vars and redeploy,
 * or remove <SiteGate> wrapper from App.jsx.
 */

import { useState, useRef } from 'react';

const GATE_CODE = import.meta.env.VITE_SITE_GATE_CODE || '';
const GATE_KEY = 'site_gate_verified';

export default function SiteGate({ children }) {
  // If no gate code configured, gate is disabled — let everyone through
  if (!GATE_CODE) return children;

  const [verified, setVerified] = useState(() => sessionStorage.getItem(GATE_KEY) === 'yes');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (code.trim() === GATE_CODE.trim()) {
      sessionStorage.setItem(GATE_KEY, 'yes');
      setVerified(true);
    } else {
      setError('Incorrect access code.');
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (verified) return children;

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.icon}>&#9734;</div>
        <h1 style={styles.title}>Astro Yagya</h1>
        <p style={styles.subtitle}>This site is under development.<br />Enter the access code to continue.</p>

        <form onSubmit={handleVerify} style={styles.form}>
          <input
            ref={inputRef}
            type="password"
            autoFocus
            maxLength={20}
            placeholder="Access code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            style={styles.input}
          />
          <button
            type="submit"
            style={styles.button}
            disabled={!code.trim()}
          >
            Enter
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a23 0%, #1a1a3e 50%, #0d0d2b 100%)',
    padding: '2rem',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '3rem 2.5rem',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
  },
  icon: {
    fontSize: '3rem',
    color: '#f5c542',
    marginBottom: '1rem',
  },
  title: {
    color: '#f5c542',
    fontSize: '1.8rem',
    margin: '0 0 0.5rem',
    fontWeight: 700,
  },
  subtitle: {
    color: '#b0a89e',
    fontSize: '0.95rem',
    margin: '0 0 2rem',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '14px 16px',
    fontSize: '1.2rem',
    textAlign: 'center',
    letterSpacing: '0.3em',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
  },
  button: {
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #f5c542, #e6a817)',
    color: '#0a0a23',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  error: {
    fontSize: '0.85rem',
    marginTop: '1rem',
    color: '#f87171',
  },
};
