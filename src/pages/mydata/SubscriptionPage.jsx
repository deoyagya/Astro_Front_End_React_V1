/**
 * SubscriptionPage — My Data sub-page for managing subscriptions.
 *
 * Shows:
 *   1. Current plan card with status badge
 *   2. Billing cycle info + next payment date
 *   3. Plan features list (from DB, not hardcoded)
 *   4. Forecast access summary
 *   5. Usage summary (when available)
 *   6. Cancel subscription with confirmation modal
 *   7. For free users: upgrade CTA linking to /pricing
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import '../../styles/subscription.css';

/* ---- Icon map ---- */
const PLAN_ICONS = {
  free: '✨',
  basic: '🔮',
  premium: '💎',
  elite: '👑',
};

const FORECAST_FEATURES = [
  {
    featureKey: 'monthly_prediction_report',
    title: 'Monthly Prediction Reports',
    icon: 'fa-calendar-alt',
    description: 'A fresh month-ahead forecast is generated on the last day of the month and stored in your report library.',
    tab: 'monthly',
  },
  {
    featureKey: 'daily_prediction_report',
    title: 'Daily Prediction Reports',
    icon: 'fa-sun',
    description: 'Your daily all-life-area forecast is generated each day and appears in your report library automatically.',
    tab: 'daily',
  },
];

function normalizePlanFeatures(features) {
  if (Array.isArray(features)) {
    return features;
  }
  if (features && typeof features === 'object') {
    return Object.entries(features).map(([featureKey, value]) => ({
      feature_key: featureKey,
      enabled: !!value?.enabled,
      limit_value: value?.limit ?? value?.limit_value ?? null,
      limit_period: value?.period ?? value?.limit_period ?? null,
    }));
  }
  return [];
}

function normalizeFeatureRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  /* ---- Fetch subscription data ---- */
  const fetchData = useCallback(async () => {
    try {
      const subRes = await api.get('/v1/subscription/current').catch(() => null);
      setSubData(subRes);
    } catch (err) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- Helpers ---- */
  const normalizedPlan = subData?.plan || {
    slug: subData?.plan_slug,
    name: subData?.plan_name,
  };
  const normalizedSubscription = subData?.subscription || {
    status: subData?.status,
    billing_cycle: subData?.billing_cycle,
    current_period_start: subData?.current_period_start,
    current_period_end: subData?.current_period_end,
    cancelled_at: subData?.cancelled_at,
  };
  const featureRows = normalizeFeatureRows(subData?.feature_rows);
  const planFeatures = featureRows.length > 0
    ? featureRows.map((row) => ({
        feature_key: row.feature_key,
        enabled: !!row.enabled,
        limit_value: row.limit_value ?? null,
        limit_period: row.limit_period ?? null,
      }))
    : normalizePlanFeatures(subData?.features);
  const usageEntries = subData?.usage && typeof subData.usage === 'object'
    ? Object.entries(subData.usage)
    : [];
  const planSlug = normalizedPlan?.slug || user?.role || 'free';
  const isPaid = planSlug !== 'free';
  const subscription = normalizedSubscription;
  const forecastEntitlements = FORECAST_FEATURES.map((feature) => {
    const match = planFeatures.find((item) => item.feature_key === feature.featureKey);
    return { ...feature, enabled: !!match?.enabled };
  });
  const hasAnyForecastEntitlement = forecastEntitlements.some((feature) => feature.enabled);

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
              <h3>{normalizedPlan?.name || planSlug.charAt(0).toUpperCase() + planSlug.slice(1)}</h3>
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
      {(featureRows.length > 0 || planFeatures.length > 0) && (
        <div className="sub-section">
          <h2><i className="fas fa-check-double"></i> Your Features</h2>
          <ul className="plan-features-list">
            {(featureRows.length > 0 ? featureRows : planFeatures).map((f) => (
              <li key={f.feature_key}>
                <i className={`fas ${f.enabled ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <span>{f.label || f.feature_key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                {f.enabled && (f.limit_display || f.limit_value) && (
                  <span className="feature-limit">
                    {f.limit_display || (
                      <>
                        {f.limit_value >= 999999 ? '∞' : f.limit_value}
                        {f.limit_period ? `/${f.limit_period.slice(0, 2)}` : ''}
                      </>
                    )}
                  </span>
                )}
                {f.description ? (
                  <span className="feature-description" style={{ display: 'block', color: '#8b949e', fontSize: '0.85rem', marginTop: 4 }}>
                    {f.description}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sub-section">
        <h2><i className="fas fa-calendar-days"></i> Forecast Access</h2>
        <div className="subscription-forecast-grid">
          {forecastEntitlements.map((feature) => (
            <div key={feature.featureKey} className={`subscription-forecast-card ${feature.enabled ? 'enabled' : 'locked'}`}>
              <div className="subscription-forecast-card-head">
                <div className="subscription-forecast-icon">
                  <i className={`fas ${feature.icon}`}></i>
                </div>
                <div>
                  <h3>{feature.title}</h3>
                  <span className={`subscription-forecast-badge ${feature.enabled ? 'enabled' : 'locked'}`}>
                    {feature.enabled ? 'Included in your plan' : 'Upgrade required'}
                  </span>
                </div>
              </div>
              <p>{feature.description}</p>
              <div className="subscription-forecast-actions">
                {feature.enabled ? (
                  <button className="sub-btn outline" onClick={() => navigate(`/my-reports?tab=${feature.tab}`)}>
                    <i className="fas fa-folder-open" style={{ marginRight: 6 }}></i>Open Library
                  </button>
                ) : (
                  <button className="sub-btn primary" onClick={() => navigate('/pricing')}>
                    <i className="fas fa-arrow-up" style={{ marginRight: 6 }}></i>Upgrade
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="subscription-forecast-note">
          <i className="fas fa-circle-info"></i>
          <span>
            {hasAnyForecastEntitlement
              ? 'Recurring forecasts are stored in My Reports with yearly, monthly, and daily filters so you can find each period quickly.'
              : 'Forecast entitlements are controlled by your subscription plan. Upgrade to unlock recurring monthly and daily predictions.'}
          </span>
        </div>
      </div>

      {/* Usage Summary (if we have subscription data with usage) */}
      {usageEntries.length > 0 && (
        <div className="sub-section">
          <h2><i className="fas fa-chart-bar"></i> Plan Usage &amp; Remaining</h2>
          {usageEntries.map(([featureKey, data]) => {
            const used = data.used || 0;
            const limit = data.limit || 0;
            const period = data.period || null;
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            const label = data.label || featureKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const limitSuffix = period === 'monthly'
              ? 'this month'
              : period === 'yearly'
                ? 'this year'
                : period === 'daily'
                  ? 'today'
                  : period === 'total_saved'
                    ? 'saved'
                    : period === 'per_deliverable'
                      ? 'per report'
                      : period === 'per_match'
                        ? 'per match'
                        : '';
            const secondaryText = period === 'per_deliverable' || period === 'per_match'
              ? `Up to ${limit} ${limitSuffix}`
              : data.remaining != null
                ? `${data.remaining} remaining ${limitSuffix}`.trim()
                : null;
            return (
              <div key={featureKey} className="usage-bar-container">
                <div className="usage-bar-label">
                  <span>{label}</span>
                  <span>{used} / {limit >= 999999 ? '∞' : limit}</span>
                </div>
                {period === 'monthly' || period === 'yearly' || period === 'daily' || period === 'total_saved' ? (
                  <div className="usage-bar-track">
                    <div
                      className={`usage-bar-fill ${getUsageBarColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                ) : null}
                {secondaryText ? (
                  <div style={{ marginTop: 6, color: '#b8bfd8', fontSize: '0.92rem' }}>{secondaryText}</div>
                ) : null}
              </div>
            );
          })}
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
