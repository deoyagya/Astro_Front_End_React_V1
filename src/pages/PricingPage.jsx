/**
 * PricingPage — Public pricing page with 4-tier subscription cards.
 *
 * Features:
 *   - Monthly / Yearly billing toggle with savings badge
 *   - 4 plan cards (Free / Basic / Premium / Elite)
 *   - Feature comparison table
 *   - Coupon code validation
 *   - Stripe Checkout redirect (sole payment provider)
 *   - Responsive: 4-col → 2-col → 1-col
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import EmbeddedCheckoutModal from '../components/EmbeddedCheckoutModal';
import RazorpayCheckoutModal from '../components/RazorpayCheckoutModal';
import usePaymentGateway from '../hooks/usePaymentGateway';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDiscountValue, formatLocalCurrency, formatUsdCentsForUser } from '../utils/localPricing';
import '../styles/pricing.css';
import { useStyles } from '../context/StyleContext';

export default function PricingPage() {
  const { getOverride } = useStyles('pricing');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();
  const gw = usePaymentGateway();

  const [plans, setPlans] = useState([]);
  const [comparisonFeatures, setComparisonFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Billing cycle toggle
  const [yearly, setYearly] = useState(true);

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState(null);

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [razorpayCheckout, setRazorpayCheckout] = useState(null); // Razorpay checkout data
  const paymentContext = {
    currency: gw.currency || 'USD',
    exchangeRate: gw.exchangeRate || 1,
  };

  /* ---- Fetch plans ---- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await api.get(`/v1/subscription/plans?currency=${encodeURIComponent(gw.currency || 'USD')}`);

        setPlans(plansRes.plans || []);
        setComparisonFeatures(plansRes.comparison_features || []);
      } catch (err) {
        toast(err.message || 'Failed to load pricing data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gw.currency, toast]);

  /* ---- Handle Stripe return (redirect back after checkout) ---- */
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const cancelled = searchParams.get('cancelled');

    if (cancelled === 'true') {
      toast('Checkout was cancelled. You can try again anytime.', 'info');
      return;
    }

    if (sessionId && isAuthenticated) {
      // Verify Stripe checkout session
      const verifyStripe = async () => {
        setCheckoutLoading('verifying');
        try {
          await api.post('/v1/subscription/verify-stripe', { session_id: sessionId });
          if (refreshUser) await refreshUser();
          navigate('/my-data/subscription', { replace: true });
        } catch (err) {
          toast(err.message || 'Payment verification failed. Please contact support.', 'error');
        } finally {
          setCheckoutLoading(null);
        }
      };
      verifyStripe();
    }
  }, [searchParams, isAuthenticated, refreshUser, navigate]);

  /* ---- Current user plan detection ---- */
  const currentPlanSlug = user?.role || 'free';

  /* ---- Coupon validation ---- */
  const handleValidateCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponResult(null);
    try {
      const res = await api.post('/v1/subscription/validate-coupon', {
        code: couponCode.trim().toUpperCase(),
        plan_slug: 'basic',
      });
      setCouponResult(res);
    } catch (err) {
      setCouponResult({ valid: false, reason: err.message || 'Validation failed' });
    } finally {
      setCouponValidating(false);
    }
  }, [couponCode]);

  /* ---- Checkout (Stripe or Razorpay) ---- */
  const handleCheckout = useCallback(async (planSlug) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCheckoutLoading(planSlug);

    try {
      const checkoutData = await api.post('/v1/subscription/checkout', {
        plan_slug: planSlug,
        billing_cycle: yearly ? 'yearly' : 'monthly',
        coupon_code: couponResult?.valid ? couponCode.trim().toUpperCase() : undefined,
        gateway: gw.gateway || undefined,
        currency: gw.currency || undefined,
      });

      // Razorpay checkout
      if (checkoutData.gateway === 'razorpay') {
        setRazorpayCheckout({
          subscriptionId: checkoutData.razorpay_subscription_id || checkoutData.subscription_id,
          orderId: checkoutData.subscription_id,
          amount: checkoutData.amount,
          currency: checkoutData.currency || 'INR',
          razorpayKeyId: checkoutData.razorpay_key_id,
          mode: checkoutData.razorpay_subscription_id ? 'subscription' : 'payment',
        });
        setCheckoutLoading(null);
        return;
      }

      // Stripe checkout
      if (checkoutData.client_secret) {
        setClientSecret(checkoutData.client_secret);
        setCheckoutLoading(null);
        return;
      }

      toast('Unable to start checkout. Please try again.', 'error');
      setCheckoutLoading(null);
    } catch (err) {
      toast(err.message || 'Checkout failed. Please try again.', 'error');
      setCheckoutLoading(null);
    }
  }, [isAuthenticated, navigate, yearly, couponResult, couponCode, gw.gateway, gw.currency]);

  /* ---- Price formatting (localized display / USD source of truth) ---- */
  const formatPrice = (plan) => {
    const localPrices = plan.local_prices;
    if (localPrices && localPrices.currency === paymentContext.currency) {
      const display = yearly ? localPrices.yearly_display : localPrices.monthly_display;
      return display || 'Free';
    }
    const cents = yearly ? plan.price_yearly_cents : plan.price_monthly_cents;
    if (!cents || cents === 0) return 'Free';
    return formatUsdCentsForUser(cents, paymentContext);
  };

  const formatMonthlyEquivalent = (plan) => {
    const localPrices = plan.local_prices;
    if (localPrices && localPrices.currency === paymentContext.currency) {
      if (!localPrices.monthly_equivalent) return null;
      return formatLocalCurrency(localPrices.monthly_equivalent, paymentContext.currency);
    }
    const cents = plan.price_yearly_cents;
    if (!cents) return null;
    return formatUsdCentsForUser(Math.round(cents / 12), paymentContext);
  };

  const formatOriginalMonthly = (plan) => {
    const cents = plan.price_monthly_cents;
    if (!cents) return '';
    return `${formatUsdCentsForUser(cents, paymentContext)}/mo`;
  };

  const getFeatureDisplay = (plan, featureKey) => {
    const feature = Array.isArray(plan.features)
      ? plan.features.find((f) => f.feature_key === featureKey)
      : plan.features?.[featureKey];
    if (!feature || !feature.enabled) return { type: 'cross' };
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

  /* ---- Change plan (for users with active subscription) ---- */
  const handleChangePlan = useCallback(async (planSlug, direction) => {
    setCheckoutLoading(planSlug);
    try {
      await api.post('/v1/subscription/change-plan', {
        new_plan_slug: planSlug,
        billing_cycle: yearly ? 'yearly' : 'monthly',
      });
      if (refreshUser) await refreshUser();
      navigate('/my-data/subscription');
    } catch (err) {
      const msg = err.message || '';
      // No subscription record in DB — fall back to new checkout flow
      if (msg.toLowerCase().includes('no active subscription')) {
        setCheckoutLoading(null);
        handleCheckout(planSlug);
        return;
      }
      toast(msg || `Failed to ${direction}. Please try again.`, 'error');
    } finally {
      setCheckoutLoading(null);
    }
  }, [yearly, refreshUser, navigate, handleCheckout]);

  const handleCtaClick = (plan) => {
    if (plan.slug === currentPlanSlug) return;
    const rank = PLAN_RANK[plan.slug] ?? 0;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // User already has a paid subscription → use change-plan endpoint
    const hasActiveSub = currentRank > 0; // anything above 'free'

    if (rank > currentRank) {
      if (hasActiveSub) {
        handleChangePlan(plan.slug, 'upgrade');
      } else {
        handleCheckout(plan.slug);
      }
    } else if (rank < currentRank) {
      if (window.confirm(
        `Downgrade to ${plan.name}?\n\nThis will take effect from your next billing cycle. ` +
        `You'll continue to enjoy your current plan benefits until then.`
      )) {
        if (hasActiveSub) {
          handleChangePlan(plan.slug, 'downgrade');
        } else {
          handleCheckout(plan.slug);
        }
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

  // Handle Stripe verification loading state
  if (checkoutLoading === 'verifying') {
    return (
      <PageShell activeNav="pricing">
        <div className="pricing-page">
          <div className="container">
            <div className="pricing-loading">
              <i className="fas fa-spinner fa-spin"></i>
              Verifying your payment...
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const sortedPlans = [...plans].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  return (
    <PageShell activeNav="pricing">
      {clientSecret && (
        <EmbeddedCheckoutModal
          clientSecret={clientSecret}
          onClose={() => setClientSecret('')}
        />
      )}
      {razorpayCheckout && (
        <RazorpayCheckoutModal
          orderId={razorpayCheckout.orderId}
          subscriptionId={razorpayCheckout.subscriptionId}
          amount={razorpayCheckout.amount}
          currency={razorpayCheckout.currency}
          razorpayKeyId={razorpayCheckout.razorpayKeyId}
          mode={razorpayCheckout.mode}
          verifyUrl={razorpayCheckout.verifyUrl}
          prefill={{ email: user?.email || '' }}
          onSuccess={async (result) => {
            setRazorpayCheckout(null);
            if (result.verified) {
              if (refreshUser) await refreshUser();
              navigate('/my-data/subscription', { replace: true });
            } else {
              toast('Payment verification failed. Please contact support.', 'error');
            }
          }}
          onClose={() => setRazorpayCheckout(null)}
        />
      )}
      <div className="pricing-page">
        <div className="container">
          {/* Header */}
          <div className="pricing-header">
            <h1><i className="fas fa-crown"></i> Choose Your Plan</h1>
            <p className="subtitle">
              Unlock the full power of Vedic astrology with AI-powered insights,
              detailed reports, and personalized guidance.
            </p>
            <p className="gateway-info">
              {gw.gateway === 'razorpay' ? (
                <>
                  <i className="fas fa-rupee-sign"></i>{' '}
                  Prices shown in INR{' '}
                  <span className="gateway-badge razorpay">Razorpay</span>
                </>
              ) : (
                <>
                  <i className="fas fa-cc-stripe"></i>{' '}
                  Prices shown in USD{' '}
                  <span className="gateway-badge">Stripe</span>
                </>
              )}
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

          {/* Plan cards */}
          <div className="plan-cards">
            {sortedPlans.map((plan) => {
              const priceStr = formatPrice(plan);
              const monthlyEq = yearly ? formatMonthlyEquivalent(plan) : null;
              const originalMonthly = yearly ? formatOriginalMonthly(plan) : '';
              const isPopular = plan.slug === 'premium';
              const isCurrent = plan.slug === currentPlanSlug;
              const isFree = priceStr === 'Free';

              return (
                <div
                  key={plan.slug}
                  className={`plan-card ${isPopular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  {isPopular && !isCurrent && <div className="popular-badge">Most Popular</div>}
                  {isCurrent && <div className="current-badge">Your Plan</div>}

                  <span className="plan-icon">{plan.icon || '⭐'}</span>
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-desc">{plan.description}</p>

                  <div className="plan-price">
                    {isFree ? (
                      <span className="amount">Free</span>
                    ) : yearly && monthlyEq ? (
                      <>
                        <span className="amount">{monthlyEq}</span>
                        <span className="period">/mo</span>
                        {originalMonthly && (
                          <span className="original-price">{originalMonthly}</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="amount">{priceStr}</span>
                        <span className="period">/mo</span>
                      </>
                    )}
                  </div>

                  <ul className="plan-features">
                    {(plan.display_features || []).map((feat, i) => (
                      <li key={i} className={feat.startsWith('✗') ? 'disabled' : ''}>
                        <i className={`fas ${feat.startsWith('✗') ? 'fa-times' : 'fa-check'}`}></i>
                        {feat.replace(/^[✓✗]\s*/, '')}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={getCtaClass(plan)}
                    onClick={() => handleCtaClick(plan)}
                    disabled={isCurrent || checkoutLoading === plan.slug}
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
                    {formatDiscountValue(couponResult.discount_value, couponResult.discount_type, paymentContext)}{' '}
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
          {sortedPlans.length > 0 && comparisonFeatures.length > 0 && (
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
                    {comparisonFeatures.map((feat) => (
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

          {/* Trust badges */}
          <div className="pricing-faq">
            <p>
              All payments are securely processed. Cancel anytime.
            </p>
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
              <div className="trust-item">
                {gw.gateway === 'razorpay' ? (
                  <>
                    <i className="fas fa-rupee-sign"></i>
                    <span>Powered by Razorpay</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-cc-stripe"></i>
                    <span>Powered by Stripe</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
