/**
 * ToastContext — Global toast notification system.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast('Something went wrong.', 'error');
 *   toast('Saved successfully!', 'success');
 *   toast('Please note...', 'info');
 *
 * Wrap your app with <ToastProvider> in main.jsx.
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 5000;
const MAX_TOASTS = 3;

let _nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, variant = 'error', durationMs = TOAST_DURATION_MS) => {
      const id = ++_nextId;

      setToasts((prev) => {
        const next = [...prev, { id, message, variant }];
        // Keep only the most recent MAX_TOASTS
        if (next.length > MAX_TOASTS) {
          const removed = next.shift();
          clearTimeout(timersRef.current[removed.id]);
          delete timersRef.current[removed.id];
        }
        return next;
      });

      // Auto-dismiss
      timersRef.current[id] = setTimeout(() => removeToast(id), durationMs);

      return id;
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      {/* Toast container — renders at viewport bottom-right */}
      {toasts.length > 0 && (
        <div className="global-toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`global-toast global-toast--${t.variant}`}
            >
              <i
                className={`fas ${
                  t.variant === 'success'
                    ? 'fa-check-circle'
                    : t.variant === 'info'
                    ? 'fa-info-circle'
                    : 'fa-exclamation-circle'
                }`}
              />
              <span>{t.message}</span>
              <button
                className="global-toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export default ToastContext;
