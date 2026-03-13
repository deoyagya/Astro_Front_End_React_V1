/**
 * RazorpayCheckoutModal — Opens Razorpay checkout popup and handles verification.
 *
 * Phase 47: Dual Gateway (Stripe + Razorpay).
 * Dynamically loads Razorpay checkout.js, opens popup, and on success POSTs to
 * /v1/payment/razorpay/verify (one-off) or /v1/subscription/verify-razorpay (subscriptions).
 *
 * Props:
 *   orderId       — Razorpay Order ID (order_xxx) for one-off payments
 *   subscriptionId — Razorpay Subscription ID for recurring payments
 *   amount        — Amount in paisa (for display)
 *   currency      — "INR" or "USD"
 *   razorpayKeyId — Razorpay Key ID (public)
 *   prefill       — { name, email, contact } for pre-filling
 *   onSuccess     — Callback({ orderId, paymentId, verified }) after successful verification
 *   onClose       — Callback when user closes Razorpay popup without paying
 *   verifyUrl     — Override verify endpoint (defaults to /v1/payment/razorpay/verify)
 *   mode          — "payment" | "subscription" (defaults to "payment")
 */

import { useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Singleton script loader
let scriptLoaded = false;
let scriptLoadPromise = null;

function loadRazorpayScript() {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export default function RazorpayCheckoutModal({
  orderId,
  subscriptionId,
  amount,
  currency = 'INR',
  razorpayKeyId,
  prefill = {},
  onSuccess,
  onClose,
  verifyUrl,
  mode = 'payment',
}) {
  const razorpayRef = useRef(null);

  const handlePaymentSuccess = useCallback(
    async (response) => {
      try {
        let result;

        if (mode === 'subscription') {
          // Subscription verification
          const url = verifyUrl || '/v1/subscription/verify-razorpay';
          result = await api.post(url, {
            razorpay_subscription_id: response.razorpay_subscription_id || subscriptionId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        } else {
          // One-off payment verification
          const url = verifyUrl || '/v1/payment/razorpay/verify';
          result = await api.post(url, {
            razorpay_order_id: response.razorpay_order_id || orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        }

        if (onSuccess) {
          onSuccess({
            orderId: response.razorpay_order_id || orderId,
            paymentId: response.razorpay_payment_id,
            subscriptionId: response.razorpay_subscription_id || subscriptionId,
            verified: true,
            ...result,
          });
        }
      } catch (err) {
        console.error('Razorpay verification failed:', err);
        if (onSuccess) {
          onSuccess({
            orderId: response.razorpay_order_id || orderId,
            paymentId: response.razorpay_payment_id,
            verified: false,
            error: err.message || 'Payment verification failed',
          });
        }
      }
    },
    [orderId, subscriptionId, onSuccess, verifyUrl, mode],
  );

  useEffect(() => {
    if (!razorpayKeyId || (!orderId && !subscriptionId)) return;

    let cancelled = false;

    (async () => {
      try {
        await loadRazorpayScript();
        if (cancelled) return;

        const options = {
          key: razorpayKeyId,
          currency: currency,
          name: 'Astro Yagya',
          description: mode === 'subscription' ? 'Subscription Payment' : 'Report Purchase',
          handler: handlePaymentSuccess,
          modal: {
            ondismiss: () => {
              if (onClose) onClose();
            },
            escape: true,
            confirm_close: true,
          },
          prefill: {
            name: prefill.name || '',
            email: prefill.email || '',
            contact: prefill.contact || '',
          },
          theme: {
            color: '#7b5bff',
          },
        };

        // Set order or subscription
        if (mode === 'subscription' && subscriptionId) {
          options.subscription_id = subscriptionId;
        } else {
          options.order_id = orderId;
          options.amount = amount;
        }

        const rzp = new window.Razorpay(options);
        razorpayRef.current = rzp;
        rzp.open();
      } catch (err) {
        console.error('Failed to open Razorpay:', err);
        if (onClose) onClose();
      }
    })();

    return () => {
      cancelled = true;
      if (razorpayRef.current) {
        try {
          razorpayRef.current.close();
        } catch {
          // Ignore close errors
        }
      }
    };
  }, [
    orderId,
    subscriptionId,
    amount,
    currency,
    razorpayKeyId,
    prefill.name,
    prefill.email,
    prefill.contact,
    handlePaymentSuccess,
    onClose,
    mode,
  ]);

  // Razorpay renders its own popup — no DOM output needed
  return null;
}
