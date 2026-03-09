/**
 * PricingPage — Public pricing page with 4-tier subscription cards.
 *
 * Features:
 *   - Monthly / Yearly billing toggle with savings badge
 *   - 4 plan cards (Free / Basic / Premium / Elite)
 *   - Feature comparison table
 *   - Coupon code validation
 *   - Razorpay subscription checkout flow
 *   - Credit pack add-ons section
 *   - Responsive: 4-col → 2-col → 1-col
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/pricing.css';

/* ---- Razorpay SDK loader (shared with PaymentPage) ---- */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ---- Icon map for plan tiers ---- */
const PLAN_ICONS = {
  free: '✨',
  basic: '🔮',
  premium: '💎',
  elite: '👑',
};

/* ---- Feature comparison rows ---- */
const COMPARISON_FEATURES = [
  { label: 'AI Chat Questions / month', key: 'ai_chat' },
  { label: 'PDF Detailed Reports', key: 'pdf_report' },
  { label: 'Temporal Forecast (Life Areas)', key: 'temporal_forecast' },
  { label: 'Full Compatibility Analysis', key: 'compatibility_full' },
  { label: 'Premium Muhurta', key: 'muhurta_premium' },
  { label: 'Chart Wizard Consultations', key: 'chart_wizard' },
  { label: 'Cross-Validation Pipeline', key: 'cross_validation' },
  { label: 'Personalized Remedies', key: 'remedies' },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();

  const [plans, setPlans] = useState([]);
  const [creditPacks, setCreditPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Billing cycle toggle
  const [yearly, setYearly] = useState(true);

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState(null); // { valid, reason, discount_value, discount_type }

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(null); // plan slug being checked out

  /* ---- Fetch plans + credit packs ---- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, packsRes] = await Promise.all([
          api.get('/v1/subscription/plans'),
          api.get('/v1/subscription/credit-packs'),
        ]);
        setPlans(plansRes.plans || []);
        setCreditPacks(packsRes.packs || []);
      } catch (err) {
        setError(err.message || 'Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ---- Current user plan detection ---- */
  const currentPlanSlug = user?.role || 'free';
  const isPlanHigherOrEqual = (planSlug) => {
    const order = ['free', 'basic', 'premium', 'elite', 'admin'];
    return order.indexOf(planSlug) <= order.indexOf(currentPlanSlug);
  };

  /* ---- Coupon validation ---- */
  const handleValidateCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponResult(null);
    try {
      const res = await api.post('/v1/subscription/validate-coupon', {
        code: couponCode.trim().toUpperCase(),
        plan_slug: 'basic', // Validate against the cheapest paid plan
      });
      setCouponResult(res);
    } catch (err) {
      setCouponResult({ valid: false, reason: err.message || 'Validation failed' });
    } finally {
      setCouponValidating(false);
    }
  }, [couponCode]);

  /* ---- Checkout ---- */
  const handleCheckout = useCallback(async (planSlug) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCheckoutLoading(planSlug);
    setError('');

    try {
      // Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        setError('Failed to load payment gateway. Please check your internet and try again.');
        setCheckoutLoading(null);
        return;
      }

      // Initiate checkout via API
      const checkoutData = await api.post('/v1/subscription/checkout', {
        plan_slug: planSlug,
        billing_cycle: yearly ? 'yearly' : 'monthly',
        coupon_code: couponResult?.valid ? couponCode.trim().toUpperCase() : undefined,
      });

      // Open Razorpay subscription checkout
      const options = {
        key: checkoutData.razorpay_key_id,
        subscription_id: checkoutData.subscription_id,
        name: 'Astro Yagya',
        description: `${planSlug.charAt(0).toUpperCase() + planSlug.slice(1)} Plan — ${yearly ? 'Yearly' : 'Monthly'}`,
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#7c3aed' },

        handler: async (response) => {
          try {
            await api.post('/v1/subscription/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Refresh user data to get updated role
            if (refreshUser) await refreshUser();

            // Navigate to subscription management
            navigate('/my-data/subscription');
          } catch (err) {
            setError(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setCheckoutLoading(null);
          }
        },

        modal: {
          ondismiss: () => setCheckoutLoading(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed. Please try again.');
        setCheckoutLoading(null);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
      setCheckoutLoading(null);
    }
  }, [isAuthenticated, navigate, yearly, couponResult, couponCode, user, refreshUser]);

  /* ---- Helpers ---- */
  const formatPrice = (paisa) => {
    if (!paisa || paisa === 0) return 'Free';
    return `₹${(paisa / 100).toLocaleString('en-IN')}`;
  };

  const getFeatureDisplay = (plan, featureKey) => {
    // plan.features is a dict keyed by feature_key (from backend)
    const feature = Array.isArray(plan.features)
      ? plan.features.find((f) => f.feature_key === featureKey)
      : plan.features?.[featureKey];
    if (!feature || !feature.enabled) return { type: 'cross' };
    // Backend uses "limit" (dict) or "limit_value" (array) depending on shape
    const limitVal = feature.limit_value ?? feature.limit;
    const limitPeriod = feature.limit_period ?? feature.period;
    if (limitVal) {
      const label = limitVal >= 999999 ? 'Unlimited' : `${limitVal}/${limitPeriod || 'mo'}`;
      return { type: 'limit', label };
    }
    return { type: 'check' };
  };

  const PLAN_RANK = { free: 0, basic: 1, premium: 2, elite: 3, admin: 4 };
  const currentRank = PLAN_RANK[currentPlanSlug] ?? 0;

  const getCtaLabel = (plan) => {
    const rank = PLAN_RANK[plan.slug] ?? 0;
    if (plan.slug === currentPlanSlug) return 'Current Plan';
    if (!isAuthenticated) return plan.slug === 'free' ? 'Get Started' : 'Subscribe';
    if (rank > currentRank) return checkoutLoading === plan.slug ? 'Processing...' : 'Upgrade';
    if (rank < currentRank) return 'Downgrade';
    return 'Subscribe';
  };

  const getCtaClass = (plan) => {
    const rank = PLAN_RANK[plan.slug] ?? 0;
    if (plan.slug === currentPlanSlug) return 'plan-cta current-plan';
    if (!isAuthenticated) return plan.slug === 'free' ? 'plan-cta outline' : 'plan-cta primary';
    if (rank > currentRank) return 'plan-cta primary';
    if (rank < currentRank) return 'plan-cta downgrade';
    return 'plan-cta outline';
  };

  const handleCtaClick = (plan) => {
    if (plan.slug === currentPlanSlug) return;
    const rank = PLAN_RANK[plan.slug] ?? 0;
    if (!isAuthenticated) {
      if (plan.slug === 'free') { navigate('/login'); return; }
      navigate('/login');
      return;
    }
    if (rank > currentRank) {
      // Upgrade — effective immediately
      handleCheckout(plan.slug);
    } else if (rank < currentRank) {
      // Downgrade — effective next billing cycle
      if (window.confirm(
        `Downgrade to ${plan.name}?\n\nThis will take effect from your next billing cycle. ` +
        `You'll continue to enjoy your current plan benefits until then.`
      )) {
        handleCheckout(plan.slug);
      }
    }
  };

  /* ---- Render ---- */
  if (loading) {
    return (
      <PageShell activeNav="pricing">
        <div className="pricing-page">
          <div className="container">
            <div className="pricing-loading">
              <i className="fas fa-spinner fa-spin"></i>
              Loading plans...
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Sort plans by display_order
  const sortedPlans = [...plans].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <PageShell activeNav="pricing">
      <div className="pricing-page">
        <div className="container">
          {/* Header */}
          <div className="pricing-header">
            <h1><i className="fas fa-crown"></i> Choose Your Plan</h1>
            <p className="subtitle">
              Unlock the full power of Vedic astrology with AI-powered insights,
              detailed reports, and personalized guidance.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="billing-toggle">
            <span
              className={`toggle-label ${!yearly ? 'active' : ''}`}
              onClick={() => setYearly(false)}
            >
              Monthly
            </span>
            <div
              className={`toggle-track ${yearly ? 'yearly' : ''}`}
              onClick={() => setYearly(!yearly)}
            >
              <div className="toggle-knob"></div>
            </div>
            <span
              className={`toggle-label ${yearly ? 'active' : ''}`}
              onClick={() => setYearly(true)}
            >
              Yearly
            </span>
            {yearly && <span className="save-badge">Save ~16%</span>}
          </div>

          {/* Error */}
          {error && (
            <div className="pricing-error">
              <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
              {error}
              <button
                onClick={() => setError('')}
                style={{ marginLeft: 12, background: 'none', border: 'none', color: '#9d7bff', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Plan cards */}
          <div className="plan-cards">
            {sortedPlans.map((plan) => {
              const price = yearly ? plan.price_yearly_paisa : plan.price_monthly_paisa;
              const monthlyEquivalent = yearly && plan.price_yearly_paisa
                ? Math.round(plan.price_yearly_paisa / 12)
                : null;
              const isPopular = plan.slug === 'premium';
              const isCurrent = plan.slug === currentPlanSlug;

              return (
                <div
                  key={plan.slug}
                  className={`plan-card ${isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  {isPopular && !isCurrent && <div className="popular-badge">Most Popular</div>}
                  {isCurrent && <div className="current-badge">Your Plan</div>}

                  <span className="plan-icon">{PLAN_ICONS[plan.slug] || '⭐'}</span>
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-desc">{plan.description}</p>

                  <div className="plan-price">
                    {price === 0 ? (
                      <span className="amount">Free</span>
                    ) : yearly ? (
                      <>
                        <span className="amount">{formatPrice(monthlyEquivalent)}</span>
                        <span className="period">/mo</span>
                        <span className="original-price">
                          {formatPrice(plan.price_monthly_paisa)}/mo
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="amount">{formatPrice(price)}</span>
                        <span className="period">/mo</span>
                      </>
                    )}
                  </div>

                  <ul className="plan-features">
                    {(plan.features_json || []).map((feat, i) => (
                      <li key={i} className={feat.startsWith('✗') ? 'disabled' : ''}>
                        <i className={`fas ${feat.startsWith('✗') ? 'fa-times' : 'fa-check'}`}></i>
                        {feat.replace(/^[✓✗]\s*/, '')}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={getCtaClass(plan)}
                    onClick={() => handleCtaClick(plan)}
                    disabled={
                      isCurrent ||
                      checkoutLoading === plan.slug
                    }
                  >
                    {checkoutLoading === plan.slug && (
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
                    )}
                    {getCtaLabel(plan)}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Coupon section */}
          <div className="coupon-section">
            <h3><i className="fas fa-tag" style={{ marginRight: 8 }}></i>Have a coupon code?</h3>
            <div className="coupon-input-row">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  if (couponResult) setCouponResult(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
              />
              <button onClick={handleValidateCoupon} disabled={couponValidating || !couponCode.trim()}>
                {couponValidating ? (
                  <><i className="fas fa-spinner fa-spin"></i> Checking</>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            {couponResult && (
              <p className={`coupon-message ${couponResult.valid ? 'valid' : 'invalid'}`}>
                {couponResult.valid ? (
                  <>
                    <i className="fas fa-check-circle"></i>{' '}
                    {couponResult.discount_type === 'percentage'
                      ? `${couponResult.discount_value}% off`
                      : `₹${(couponResult.discount_value / 100).toLocaleString('en-IN')} off`}{' '}
                    — Applied!
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle"></i> {couponResult.reason}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Feature comparison table */}
          {sortedPlans.length > 0 && (
            <div className="feature-comparison">
              <h2>Feature Comparison</h2>
              <div className="feature-table-wrap">
                <table className="feature-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      {sortedPlans.map((p) => (
                        <th key={p.slug}>{p.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((feat) => (
                      <tr key={feat.key}>
                        <td>{feat.label}</td>
                        {sortedPlans.map((plan) => {
                          const display = getFeatureDisplay(plan, feat.key);
                          return (
                            <td key={plan.slug}>
                              {display.type === 'check' && (
                                <i className="fas fa-check check"></i>
                              )}
                              {display.type === 'cross' && (
                                <i className="fas fa-times cross"></i>
                              )}
                              {display.type === 'limit' && (
                                <span className="limit-value">{display.label}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Credit packs */}
          {creditPacks.length > 0 && (
            <div className="credit-packs-section">
              <h2>Need More AI Questions?</h2>
              <p className="section-subtitle">
                Top up your AI chat credits with affordable packs — no subscription change needed.
              </p>
              <div className="credit-packs-grid">
                {creditPacks.map((pack) => (
                  <div key={pack.id} className="credit-pack-card">
                    <div className="pack-credits">{pack.credit_amount}</div>
                    <div className="pack-name">{pack.name}</div>
                    <div className="pack-price">₹{(pack.price_paisa / 100).toLocaleString('en-IN')}</div>
                    <div className="pack-unit">
                      ₹{((pack.price_paisa / 100) / pack.credit_amount).toFixed(1)} per question
                    </div>
                    <button
                      className="pack-buy-btn"
                      onClick={() => {
                        if (!isAuthenticated) { navigate('/login'); return; }
                        navigate('/my-data/subscription');
                      }}
                    >
                      Buy Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="pricing-faq">
            <p>All payments are securely processed by Razorpay. Cancel anytime.</p>
            <div className="trust-icons">
              <div className="trust-item">
                <i className="fas fa-lock"></i>
                <span>PCI DSS Compliant</span>
              </div>
              <div className="trust-item">
                <i className="fas fa-shield-alt"></i>
                <span>256-bit Encryption</span>
              </div>
              <div className="trust-item">
                <i className="fas fa-undo"></i>
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
