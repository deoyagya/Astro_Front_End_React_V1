/**
 * EmbeddedCheckoutModal — Stripe Embedded Checkout rendered in a modal overlay.
 *
 * Reusable across all payment flows (reports, subscriptions, credit packs, muhurta).
 * Uses Stripe's EmbeddedCheckout component which handles the full payment form.
 *
 * Props:
 *   clientSecret — Stripe Checkout Session client secret (cs_xxx_secret_yyy)
 *   onClose      — Callback when user closes the modal (cancels checkout)
 */

import { useCallback, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import '../styles/checkout-modal.css';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

export default function EmbeddedCheckoutModal({ clientSecret, onClose }) {
  if (!clientSecret) return null;

  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    if (!STRIPE_PK) {
      setStripeError(
        'Payment system is not configured yet. Please contact support or try Razorpay payment option.',
      );
    }
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  }, [onClose]);

  return (
    <div className="checkout-overlay" onClick={handleOverlayClick}>
      <div className="checkout-modal">
        <div className="checkout-modal-header">
          <h3>Complete Your Payment</h3>
          <button
            className="checkout-close-btn"
            onClick={onClose}
            aria-label="Close checkout"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="checkout-modal-body">
          {stripeError ? (
            <div style={{
              padding: '40px 24px',
              textAlign: 'center',
              color: '#ff6b6b',
            }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: 16, display: 'block' }}></i>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{stripeError}</p>
              <button
                onClick={onClose}
                style={{
                  marginTop: 20,
                  padding: '10px 28px',
                  background: 'rgba(123,91,255,0.15)',
                  border: '1px solid #7b5bff',
                  borderRadius: 8,
                  color: '#b794ff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </div>
    </div>
  );
}
