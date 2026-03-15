/**
 * SiteGate — Temporary OTP-based site access control.
 *
 * On mount: auto-sends OTP to the gatekeeper email.
 * Shows only a code input field (email hidden).
 * On successful verify: stores flag in sessionStorage, renders children.
 *
 * To disable: remove <SiteGate> wrapper from App.jsx.
 */

import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

const GATE_EMAIL = 'deoyagya@gmail.com';
const GATE_KEY = 'site_gate_verified';

export default function SiteGate({ children }) {
  const [verified, setVerified] = useState(() => sessionStorage.getItem(GATE_KEY) === 'yes');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('sending'); // sending | ready | verifying | error
  const [message, setMessage] = useState('');
  const hasSent = useRef(false);
  const inputRef = useRef(null);

  // Auto-send OTP on mount
  useEffect(() => {
    if (verified || hasSent.current) return;
    hasSent.current = true;

    api.post('/v1/auth/otp/send', { identifier: GATE_EMAIL })
      .then(() => {
        setStatus('ready');
        setMessage('Access code sent to your email.');
        setTimeout(() => inputRef.current?.focus(), 100);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Failed to send access code. Please refresh.');
      });
  }, [verified]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim() || status === 'verifying') return;

    setStatus('verifying');
    setMessage('');

    try {
      await api.post('/v1/auth/otp/verify', {
        identifier: GATE_EMAIL,
        otp_code: code.trim(),
      });
      sessionStorage.setItem(GATE_KEY, 'yes');
      setVerified(true);
    } catch (err) {
      setStatus('ready');
      setMessage(err.message || 'Invalid code. Please try again.');
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResend = async () => {
    setStatus('sending');
    setMessage('');
    setCode('');
    try {
      await api.post('/v1/auth/otp/resend', { identifier: GATE_EMAIL });
      setStatus('ready');
      setMessage('New code sent.');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      setStatus('error');
      setMessage('Failed to resend. Please refresh.');
    }
  };

  if (verified) return children;

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.icon}>&#9734;</div>
        <h1 style={styles.title}>Astro Yagya</h1>
        <p style={styles.subtitle}>Enter the access code to continue</p>

        {status === 'sending' && (
          <p style={styles.sending}>Sending access code...</p>
        )}

        {(status === 'ready' || status === 'verifying' || status === 'error') && (
          <form onSubmit={handleVerify} style={styles.form}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={styles.input}
              disabled={status === 'verifying'}
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: status === 'verifying' ? 0.6 : 1,
              }}
              disabled={status === 'verifying' || code.length < 4}
            >
              {status === 'verifying' ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {message && (
          <p style={{
            ...styles.message,
            color: message.includes('sent') ? '#4ade80' : '#f87171',
          }}>
            {message}
          </p>
        )}

        {(status === 'ready' || status === 'error') && (
          <button onClick={handleResend} style={styles.resend}>
            Resend Code
          </button>
        )}
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
  },
  sending: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  input: {
    padding: '14px 16px',
    fontSize: '1.4rem',
    textAlign: 'center',
    letterSpacing: '0.5em',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
    fontFamily: 'monospace',
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
  message: {
    fontSize: '0.85rem',
    marginTop: '1rem',
  },
  resend: {
    marginTop: '1.5rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '0.85rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
