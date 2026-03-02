/**
 * ApiError — Reusable inline error banner for API/form errors.
 *
 * Usage:
 *   <ApiError message={error} onDismiss={() => setError('')} />
 *
 * Renders nothing when message is falsy.
 */

export default function ApiError({ message, onDismiss, className = '' }) {
  if (!message) return null;

  return (
    <div className={`api-error-banner ${className}`} role="alert">
      <i className="fas fa-exclamation-circle" />
      <p>{message}</p>
      {onDismiss && (
        <button
          className="api-error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <i className="fas fa-times" />
        </button>
      )}
    </div>
  );
}
