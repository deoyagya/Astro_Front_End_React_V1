/**
 * SessionTimeoutModal — Countdown warning before session expiry.
 *
 * Shows a modal with a circular SVG countdown ring, MM:SS timer,
 * and two buttons: "Stay Logged In" (refresh) and "End Session" (logout).
 *
 * Pure presentational — all logic comes from AuthContext via props.
 */

import { useStyles } from '../context/StyleContext';

export default function SessionTimeoutModal({
  visible,
  remainingSeconds,
  onStayLoggedIn,
  onEndSession,
  refreshing,
}) {
  const { getOverride } = useStyles('session-timeout');
  if (!visible) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Progress: 300s = 100%, 0s = 0%
  const totalWarning = 300;
  const progressPct = Math.max(0, (remainingSeconds / totalWarning) * 100);

  // SVG ring: circumference = 2 * PI * 45 ≈ 283
  const circumference = 283;
  const dashOffset = circumference - (circumference * progressPct) / 100;

  // Color classes based on time remaining
  let ringClass = '';
  if (remainingSeconds <= 60) ringClass = 'critical';
  else if (remainingSeconds <= 120) ringClass = 'warning';

  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon">
          <i className="fas fa-hourglass-half"></i>
        </div>
        <h2>Session Expiring Soon</h2>
        <p className="session-timeout-message">
          Your session will expire in
        </p>

        <div className="session-timeout-countdown">
          <svg className="countdown-ring" viewBox="0 0 100 100">
            <circle className="countdown-ring-bg" cx="50" cy="50" r="45" />
            <circle
              className={`countdown-ring-progress ${ringClass}`}
              cx="50" cy="50" r="45"
              style={{ strokeDashoffset: dashOffset }}
            />
          </svg>
          <span className="countdown-time">{timeStr}</span>
        </div>

        <p className="session-timeout-sub">
          Click &ldquo;Stay Logged In&rdquo; to extend your session.
        </p>

        <div className="session-timeout-actions">
          <button
            className="btn-stay-logged-in"
            onClick={onStayLoggedIn}
            disabled={refreshing}
          >
            {refreshing ? (
              <><i className="fas fa-spinner fa-spin"></i> Extending...</>
            ) : (
              <><i className="fas fa-shield-alt"></i> Stay Logged In</>
            )}
          </button>
          <button className="btn-end-session" onClick={onEndSession}>
            <i className="fas fa-sign-out-alt"></i> End Session
          </button>
        </div>
      </div>
    </div>
  );
}
