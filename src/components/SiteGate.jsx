import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import {
  clearAcceptanceGateToken,
  setAcceptanceGateToken,
} from '../api/acceptanceGate';

const OTP_LENGTH = 6;

const getExpiryDeadlineMs = (response) => {
  if (response?.expires_at) {
    const parsed = Date.parse(response.expires_at);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof response?.expires_in_seconds === 'number' && response.expires_in_seconds > 0) {
    return Date.now() + (response.expires_in_seconds * 1000);
  }
  return Date.now() + (300 * 1000);
};

const getSecondsRemaining = (deadlineMs) => {
  if (!deadlineMs) return 0;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
};

export default function SiteGate({ children }) {
  const [enabled, setEnabled] = useState(null);
  const [verified, setVerified] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpExpiresAtMs, setOtpExpiresAtMs] = useState(null);
  const [cooldownUntilMs, setCooldownUntilMs] = useState(null);
  const [timer, setTimer] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);
  const requestedRef = useRef(false);

  const syncTimers = useCallback(() => {
    setTimer(getSecondsRemaining(otpExpiresAtMs));
    setCooldown(getSecondsRemaining(cooldownUntilMs));
  }, [otpExpiresAtMs, cooldownUntilMs]);

  const requestCode = useCallback(async () => {
    setLoading(true);
    setError('');
    setVerified(false);
    clearAcceptanceGateToken();
    try {
      const response = await api.post('/v1/access-gate/request', {});
      if (!response?.enabled) {
        setEnabled(false);
        setVerified(true);
        return;
      }
      setEnabled(true);
      setMaskedEmail(response.masked_email || '');
      setOtpExpiresAtMs(getExpiryDeadlineMs(response));
      setCooldownUntilMs(
        typeof response.cooldown_seconds === 'number' && response.cooldown_seconds > 0
          ? Date.now() + (response.cooldown_seconds * 1000)
          : null,
      );
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err) {
      setEnabled(true);
      setError(err.message || 'Unable to send the access code right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    requestCode();
  }, [requestCode]);

  useEffect(() => {
    syncTimers();
    const intervalId = window.setInterval(syncTimers, 1000);
    const handleReset = () => {
      requestedRef.current = true;
      requestCode();
    };
    window.addEventListener('acceptance-gate-reset', handleReset);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('acceptance-gate-reset', handleReset);
    };
  }, [requestCode, syncTimers]);

  const handleChangeDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError('');
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    if (!digits.length) return;
    const next = Array(OTP_LENGTH).fill('');
    digits.forEach((digit, idx) => {
      next[idx] = digit;
    });
    setOtp(next);
    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      setError('Enter the full 6-digit access code.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await api.post('/v1/access-gate/verify', { otp_code: otpCode });
      setAcceptanceGateToken(response.access_token);
      setVerified(true);
    } catch (err) {
      setError(err.message || 'Unable to verify the access code.');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  };

  if (enabled === false || verified) {
    return children;
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.icon}><i className="fas fa-shield-alt" /></div>
        <h1 style={styles.title}>Acceptance Testing Access</h1>
        <p style={styles.subtitle}>
          A fresh one-time access code is sent automatically to
          {' '}
          <strong>{maskedEmail || 'your approved email'}</strong>
          {' '}
          each time the site is loaded.
        </p>

        {loading ? (
          <div style={styles.helper}>Sending your access code...</div>
        ) : (
          <form onSubmit={verifyCode} style={styles.form}>
            <div style={styles.otpRow} onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { otpRefs.current[index] = node; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleChangeDigit(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  style={styles.otpInput}
                />
              ))}
            </div>

            <div style={styles.timerRow}>
              <span>Code expires in {timer}s</span>
              <button
                type="button"
                onClick={requestCode}
                disabled={loading || cooldown > 0}
                style={styles.linkButton}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new code'}
              </button>
            </div>

            <button type="submit" style={styles.button} disabled={submitting}>
              {submitting ? 'Verifying...' : 'Unlock Site'}
            </button>
          </form>
        )}

        {error ? <p style={styles.error}>{error}</p> : null}
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
    background: 'radial-gradient(circle at top, #221645 0%, #0b0d17 55%, #06070d 100%)',
    padding: '2rem',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '540px',
    background: 'rgba(19, 24, 40, 0.94)',
    border: '1px solid rgba(157, 123, 255, 0.28)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
    padding: '2.75rem 2.5rem',
    textAlign: 'center',
  },
  icon: {
    color: '#9d7bff',
    fontSize: '2.4rem',
    marginBottom: '1rem',
  },
  title: {
    color: '#f2edff',
    fontSize: '2rem',
    margin: 0,
    fontWeight: 700,
  },
  subtitle: {
    color: '#c5bfd8',
    lineHeight: 1.7,
    fontSize: '1rem',
    margin: '1rem 0 2rem',
  },
  helper: {
    color: '#c5bfd8',
    fontSize: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  otpRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: '0.75rem',
  },
  otpInput: {
    height: '62px',
    borderRadius: '14px',
    border: '1px solid rgba(157, 123, 255, 0.28)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#fff',
    fontSize: '1.6rem',
    textAlign: 'center',
    outline: 'none',
  },
  timerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    color: '#c5bfd8',
    fontSize: '0.95rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: '#9d7bff',
    cursor: 'pointer',
    fontWeight: 600,
    padding: 0,
  },
  button: {
    height: '52px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #9d7bff, #6e45ff)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  error: {
    color: '#ff8080',
    marginTop: '1rem',
    fontSize: '0.95rem',
  },
};
