/**
 * usePaymentGateway — Hook for detecting the optimal payment gateway.
 *
 * Phase 47: Dual Gateway (Stripe + Razorpay).
 * Calls GET /v1/payment/detect-gateway on mount, caches in sessionStorage.
 *
 * Returns:
 *   { gateway, currency, countryCode, razorpayKeyId, stripeKey, loading, error }
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const CACHE_KEY = 'payment_gateway_config';
const CACHE_TTL = 1800_000; // 30 minutes

export default function usePaymentGateway() {
  const [state, setState] = useState({
    gateway: null,
    currency: 'USD',
    countryCode: 'US',
    razorpayKeyId: null,
    stripeKey: null,
    loading: true,
    error: null,
  });

  const detect = useCallback(async () => {
    // Check sessionStorage cache
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setState({
            gateway: data.gateway || data.provider,
            currency: data.currency || 'USD',
            countryCode: data.country_code || 'US',
            razorpayKeyId: data.razorpay_key_id || null,
            stripeKey: data.stripe_publishable_key || null,
            loading: false,
            error: null,
          });
          return;
        }
      }
    } catch {
      // Ignore cache errors
    }

    try {
      const data = await api.get('/v1/payment/detect-gateway');
      const result = {
        gateway: data.gateway || data.provider || 'stripe',
        currency: data.currency || 'USD',
        countryCode: data.country_code || 'US',
        razorpayKeyId: data.razorpay_key_id || null,
        stripeKey: data.stripe_publishable_key || null,
        loading: false,
        error: null,
      };

      // Cache
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() }),
        );
      } catch {
        // Ignore storage errors
      }

      setState(result);
    } catch (err) {
      // Fallback to Stripe
      setState({
        gateway: 'stripe',
        currency: 'USD',
        countryCode: 'US',
        razorpayKeyId: null,
        stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null,
        loading: false,
        error: err.message,
      });
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return state;
}
