/**
 * SubscriptionPage — My Data sub-page for managing subscriptions.
 *
 * Shows:
 *   1. Current plan card with status badge
 *   2. Billing cycle info + next payment date
 *   3. Plan features list (from DB, not hardcoded)
 *   4. Credit balance display per feature
 *   5. Credit pack purchase section
 *   6. Cancel subscription with confirmation modal
 *   7. For free users: upgrade CTA linking to /pricing
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useStyles } from '../../context/StyleContext';
import EmbeddedCheckoutModal from '../../components/EmbeddedCheckoutModal';
import RazorpayCheckoutModal from '../../components/RazorpayCheckoutModal';
import usePaymentGateway from '../../hooks/usePaymentGateway';
import '../../styles/subscription.css';

/* ---- Icon map ---- */
const PLAN_ICONS = {
  free: '✨',
  basic: '🔮',
  premium: '💎',
  elite: '👑',
};

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { gateway, razorpayKeyId, loading: gwLoading } = usePaymentGateway();

  // Razorpay credit pack order
  const [razorpayOrder, setRazorpayOrder] = useState(null);

  const [subData, setSubData] = useState(null);
  const [creditBalance, setCreditBalance] = useState({});
  const [creditPacks, setCreditPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Credit purchase
  const [purchasingPack, setPurchasingPack] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  /* ---- Fetch subscription data ---- */
  const fetchData = useCallback(async () => {
    try {
      const [subRes, balanceRes, packsRes] = await Promise.all([
        api.get('/v1/subscription/current').catch(() => null),
        api.get('/v1/subscription/credit-balance').catch(() => ({ balances: {} })),
        api.get('/v1/subscription/credit-packs').catch(() => ({ packs: [] })),
      ]);
      setSubData(subRes);
      setCreditBalance(balanceRes?.balances || {});
      setCreditPacks(packsRes?.packs || []);
    } catch (err) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- Helpers ---- */
  const planSlug = subData?.plan?.slug || user?.role || 'free';
  const isPaid = planSlug !== 'free';
  const subscription = subData?.subscription;
  const planFeatures = subData?.features || [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getStatusBadgeClass = (status) => {
    if (!status || status === 'free') return 'status-badge free';
    if (status === 'active' || status === 'authenticated') return 'status-badge active';
    if (status === 'cancelled' || status === 'expired' || status === 'halted') return 'status-badge cancelled';
    return 'status-badge pending';
  };

  const getUsageBarColor = (pct) => {
    if (pct < 60) return 'green';
    if (pct < 85) return 'yellow';
    return 'red';
  };

  /* ---- Cancel subscription ---- */
  const handleCancel = useCallback(async () => {
    setCancelling(true);
    setError('');
    try {
      await api.post('/v1/subscription/cancel', {
        immediate: cancelImmediate,
        reason: 'User requested cancellation',
      });
      setCancelModalOpen(false);
      setSuccessMsg(
        cancelImmediate
          ? 'Subscription cancelled. You have been moved to the Free plan.'
          : 'Subscription will be cancelled at the end of your billing period.'
      );
      if (refreshUser) await refreshUser();
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  }, [cancelImmediate, fetchData, refreshUser]);

  /* ---- Purchase credit pack (Stripe or Razorpay) ---- */
  const handlePurchasePack = useCallback(async (pack) => {
    setPurchasingPack(pack.id);
    setError('');

    try {
      const res = await api.post('/v1/subscription/purchase-credits', {
        pack_id: pack.id,
        gateway: gateway || 'stripe',
      });

      // Razorpay flow — open popup
      if (res.gateway === 'razorpay' && res.order_id) {
        setRazorpayOrder({
          orderId: res.order_id,
          amount: res.amount,
          currency: res.currency || 'INR',
          razorpayKeyId: res.razorpay_key_id || razorpayKeyId,
        });
        setPurchasingPack(null);
        return;
      }

      // Stripe flow — embedded checkout
      if (res.client_secret) {
        setClientSecret(res.client_secret);
        setPurchasingPack(null);
        return;
      }

      setError('Unable to start checkout. Please try again.');
      setPurchasingPack(null);
    } catch (err) {
      setError(err.message || 'Failed to initiate credit purchase.');
      setPurchasingPack(null);
    }
  }, [gateway, razorpayKeyId]);

  /* ---- Razorpay credit pack success ---- */
  const handleRazorpaySuccess = useCallback(async (result) => {
    setRazorpayOrder(null);
    if (result.verified) {
      setSuccessMsg('Credit pack purchased successfully!');
      if (refreshUser) await refreshUser();
      await fetchData();
    } else {
      setError(result.error || 'Payment verification failed. Please contact support.');
    }
  }, [refreshUser, fetchData]);

  const handleRazorpayClose = useCallback(() => {
    setRazorpayOrder(null);
  }, []);

  /* ---- Render ---- */
  if (loading) {
    return (
      <div className="subscription-page">
        <div className="sub-loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading subscription...
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      {clientSecret && (
        <EmbeddedCheckoutModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret('')}
        />
      )}
      {razorpayOrder && (
        <RazorpayCheckoutModal
          orderId={razorpayOrder.orderId}
          amount={razorpayOrder.amount}
          currency={razorpayOrder.currency}
          razorpayKeyId={razorpayOrder.razorpayKeyId}
          prefill={{ name: user?.full_name || '', email: user?.email || '' }}
          onSuccess={handleRazorpaySuccess}
          onClose={handleRazorpayClose}
          mode="payment"
        />
      )}
      {/* Success message */}
      {successMsg && (
        <div className="sub-success">
          <i className="fas fa-check-circle" style={{ marginRight: 8 }}></i>
          {successMsg}
          <button
            onClick={() => setSuccessMsg('')}
            style={{ marginLeft: 12, background: 'none', border: 'none', color: '#2ed573', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9375rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="sub-error">
          <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
          {error}
        </div>
      )}

      {/* Current Plan Section */}
      <div className="sub-section">
        <h2><i className="fas fa-crown"></i> Current Plan</h2>
        <div className="current-plan-card">
          <span className="current-plan-icon">{PLAN_ICONS[planSlug] || '⭐'}</span>
          <div className="current-plan-info">
            <div className="plan-name-row">
              <h3>{subData?.plan?.name || planSlug.charAt(0).toUpperCase() + planSlug.slice(1)}</h3>
              <span className={getStatusBadgeClass(subscription?.status || (isPaid ? 'active' : 'free'))}>
                {subscription?.status || (isPaid ? 'Active' : 'Free')}
              </span>
            </div>
            {subscription && (
              <>
                <div className="billing-info">
                  <strong>Billing:</strong> {subscription.billing_cycle || 'monthly'}
                </div>
                {subscription.current_period_end && (
                  <div className="billing-info">
                    <strong>Next renewal:</strong> {formatDate(subscription.current_period_end)}
                  </div>
                )}
                {subscription.cancelled_at && (
                  <div className="billing-info" style={{ color: '#ff4757' }}>
                    <strong>Cancels on:</strong> {formatDate(subscription.current_period_end)}
                  </div>
                )}
              </>
            )}
            {!isPaid && (
              <div className="billing-info">You are on the free tier with limited features.</div>
            )}
          </div>

          <div className="current-plan-actions">
            {isPaid && subscription?.status !== 'cancelled' ? (
              <>
                <button className="sub-btn outline" onClick={() => navigate('/pricing')}>
                  <i className="fas fa-exchange-alt" style={{ marginRight: 6 }}></i>Change Plan
                </button>
                <button className="sub-btn danger" onClick={() => setCancelModalOpen(true)}>
                  <i className="fas fa-times" style={{ marginRight: 6 }}></i>Cancel
                </button>
              </>
            ) : (
              <button className="sub-btn primary" onClick={() => navigate('/pricing')}>
                <i className="fas fa-arrow-up" style={{ marginRight: 6 }}></i>
                {isPaid ? 'Resubscribe' : 'Upgrade'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      {planFeatures.length > 0 && (
        <div className="sub-section">
          <h2><i className="fas fa-check-double"></i> Your Features</h2>
          <ul className="plan-features-list">
            {planFeatures.map((f) => (
              <li key={f.feature_key}>
                <i className={`fas ${f.enabled ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <span>{f.feature_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                {f.enabled && f.limit_value && (
                  <span className="feature-limit">
                    {f.limit_value >= 999999 ? '∞' : f.limit_value}
                    {f.limit_period ? `/${f.limit_period.slice(0, 2)}` : ''}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Usage Summary (if we have subscription data with usage) */}
      {subData?.usage && Object.keys(subData.usage).length > 0 && (
        <div className="sub-section">
          <h2><i className="fas fa-chart-bar"></i> Monthly Usage</h2>
          {Object.entries(subData.usage).map(([endpoint, data]) => {
            const used = data.used || 0;
            const limit = data.limit || 0;
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            return (
              <div key={endpoint} className="usage-bar-container">
                <div className="usage-bar-label">
                  <span>{endpoint.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  <span>{used} / {limit >= 999999 ? '∞' : limit}</span>
                </div>
                <div className="usage-bar-track">
                  <div
                    className={`usage-bar-fill ${getUsageBarColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Credit Balance */}
      <div className="sub-section">
        <h2><i className="fas fa-coins"></i> Credit Balance</h2>
        {Object.keys(creditBalance).length > 0 ? (
          <div className="credit-balances">
            {Object.entries(creditBalance).map(([key, amount]) => (
              <div key={key} className="credit-balance-card">
                <div className="balance-amount">{amount}</div>
                <div className="balance-label">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} credits
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-credits">
            <p>No credit packs purchased yet.</p>
          </div>
        )}
      </div>

      {/* Buy Credit Packs */}
      {creditPacks.length > 0 && (
        <div className="sub-section">
          <h2><i className="fas fa-shopping-bag"></i> Buy Credit Packs</h2>
          <div className="credit-packs-inline">
            {creditPacks.map((pack) => (
              <div key={pack.id} className="credit-pack-inline-card">
                <div className="pack-credits-count">{pack.credit_amount}</div>
                <div className="pack-label">{pack.name}</div>
                <div className="pack-price-tag">${(pack.price_cents / 100).toFixed(2)}</div>
                <button
                  type="button"
                  className="pack-purchase-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePurchasePack(pack)}
                  disabled={purchasingPack === pack.id || gwLoading}
                >
                  {purchasingPack === pack.id ? (
                    <><i className="fas fa-spinner fa-spin"></i> Processing</>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA for free users */}
      {!isPaid && (
        <div className="sub-section">
          <div className="upgrade-cta">
            <h3>Unlock AI-Powered Vedic Insights</h3>
            <p>
              Upgrade to access detailed reports, AI chat consultations,
              temporal forecasts, and personalized remedies.
            </p>
            <button className="upgrade-btn" onClick={() => navigate('/pricing')}>
              <i className="fas fa-crown" style={{ marginRight: 8 }}></i>
              View Plans &amp; Pricing
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="cancel-modal-overlay" onClick={() => setCancelModalOpen(false)}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3><i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>Cancel Subscription?</h3>
            <p>
              Are you sure you want to cancel your <strong>{subData?.plan?.name}</strong> subscription?
              {!cancelImmediate && (
                <> You will retain access until the end of your current billing period ({formatDate(subscription?.current_period_end)}).</>
              )}
              {cancelImmediate && (
                <> Your access will be revoked immediately and you will be moved to the Free plan.</>
              )}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c7cfdd', fontSize: '0.9375rem', cursor: 'pointer', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={cancelImmediate}
                  onChange={(e) => setCancelImmediate(e.target.checked)}
                  style={{ accentColor: '#ff4757' }}
                />
                Cancel immediately (lose access now)
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="sub-btn outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                Keep Subscription
              </button>
              <button
                className="sub-btn danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Cancelling...</>
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
