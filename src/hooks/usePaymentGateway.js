/**
 * usePaymentGateway — Hook for detecting the optimal payment gateway.
 *
 * Phase 47: Dual Gateway (Stripe + Razorpay).
 * Calls GET /v1/payment/detect-gateway on mount without browser-side caching.
 *
 * Returns:
 *   { gateway, currency, countryCode, razorpayKeyId, stripeKey, loading, error }
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const FALLBACK_CURRENCY = 'AUD';
const FALLBACK_COUNTRY = 'AU';
const FALLBACK_EXCHANGE_RATE = 1.53;

export default function usePaymentGateway() {
  const [state, setState] = useState({
    gateway: null,
    currency: FALLBACK_CURRENCY,
    countryCode: FALLBACK_COUNTRY,
    exchangeRate: FALLBACK_EXCHANGE_RATE,
    razorpayKeyId: null,
    stripeKey: null,
    loading: true,
    error: null,
  });

  const detect = useCallback(async () => {
    const timezone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || '';
    const locale = navigator?.language || '';

    try {
      const params = new URLSearchParams();
      if (timezone) params.set('timezone', timezone);
      if (locale) params.set('locale', locale);
      const data = await api.get(`/v1/payment/detect-gateway?${params.toString()}`);
      const result = {
        gateway: data.gateway || data.provider || 'stripe',
        currency: data.currency || 'USD',
        countryCode: data.country_code || 'US',
        exchangeRate: data.exchange_rate || 1,
        razorpayKeyId: data.razorpay_key_id || null,
        stripeKey: data.stripe_publishable_key || null,
        loading: false,
        error: null,
      };

      setState(result);
    } catch (err) {
      // Fallback to Stripe + AUD display currency when detection is unavailable
      setState({
        gateway: 'stripe',
        currency: FALLBACK_CURRENCY,
        countryCode: FALLBACK_COUNTRY,
        exchangeRate: FALLBACK_EXCHANGE_RATE,
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
