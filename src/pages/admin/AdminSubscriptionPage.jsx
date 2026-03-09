import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';

// ---------- Constants ----------

const KNOWN_FEATURE_KEYS = [
  'ai_chat',
  'pdf_report',
  'temporal_forecast',
  'compatibility_full',
  'muhurta_premium',
  'chart_storage',
  'cross_validation',
  'wizard_advanced',
];

const PLAN_SLUGS = ['free', 'basic', 'premium', 'elite'];

const LIMIT_PERIODS = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed_amount', label: 'Fixed Amount (Rs)' },
];

const TABS = [
  { key: 'plans', label: 'Plans', icon: 'fa-layer-group' },
  { key: 'coupons', label: 'Coupons', icon: 'fa-ticket-alt' },
  { key: 'packs', label: 'Credit Packs', icon: 'fa-coins' },
  { key: 'stats', label: 'Stats', icon: 'fa-chart-bar' },
];

// ---------- Helpers ----------

const formatRupees = (paisa) => {
  if (paisa == null || paisa === 0) return 'Free';
  return '\u20B9' + (paisa / 100).toLocaleString('en-IN');
};

const formatUSD = (cents) => {
  if (cents == null || cents === 0) return 'Free';
  return '$' + (cents / 100).toFixed(2);
};

const paisaToRupees = (paisa) => (paisa != null ? paisa / 100 : '');
const rupeesToPaisa = (rupees) => Math.round((parseFloat(rupees) || 0) * 100);

const centsToDollars = (cents) => (cents != null ? (cents / 100).toFixed(2) : '');
const dollarsToCents = (dollars) => Math.round((parseFloat(dollars) || 0) * 100);

const formatDate = (iso) => {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ---------- Component ----------

export default function AdminSubscriptionPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [toast, setToast] = useState(null);

  // Plans state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState('');
  const [planModal, setPlanModal] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);

  // Features modal
  const [featuresModal, setFeaturesModal] = useState(null);
  const [featuresData, setFeaturesData] = useState([]);
  const [featuresSaving, setFeaturesSaving] = useState(false);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState('');
  const [couponModal, setCouponModal] = useState(null);
  const [couponSaving, setCouponSaving] = useState(false);

  // Credit Packs state
  const [packs, setPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [packsError, setPacksError] = useState('');
  const [packModal, setPackModal] = useState(null);
  const [packSaving, setPackSaving] = useState(false);

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ==================== PLANS ====================

  const loadPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError('');
      const data = await api.get('/v1/admin/subscription/plans');
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setPlansError(err.message);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const handleTogglePlan = async (plan) => {
    try {
      const newState = !plan.is_active;
      await api.patch(`/v1/admin/subscription/plans/${plan.id}/toggle?is_active=${newState}`);
      setToast({ type: 'success', msg: `${plan.name} ${newState ? 'activated' : 'deactivated'}` });
      loadPlans();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Toggle failed' });
    }
  };

  const handleNewPlan = () => {
    setPlanModal({
      mode: 'create',
      data: {
        slug: '',
        name: '',
        description: '',
        icon: '',
        color: '#9d7bff',
        price_monthly_cents: 0,
        price_yearly_cents: 0,
        price_monthly_paisa: 0,
        price_yearly_paisa: 0,
        stripe_price_id_monthly: '',
        stripe_price_id_yearly: '',
        razorpay_plan_id_monthly: '',
        razorpay_plan_id_yearly: '',
        trial_days: 0,
        features_json: [],
        display_order: 100,
      },
    });
  };

  const handleEditPlan = (plan) => {
    setPlanModal({
      mode: 'edit',
      data: {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description || '',
        icon: plan.icon || '',
        color: plan.color || '#9d7bff',
        price_monthly_cents: plan.price_monthly_cents || 0,
        price_yearly_cents: plan.price_yearly_cents || 0,
        price_monthly_paisa: plan.price_monthly_paisa,
        price_yearly_paisa: plan.price_yearly_paisa,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
        razorpay_plan_id_monthly: plan.razorpay_plan_id_monthly || '',
        razorpay_plan_id_yearly: plan.razorpay_plan_id_yearly || '',
        trial_days: plan.trial_days || 0,
        features_json: plan.features_json || [],
        display_order: plan.display_order || 0,
      },
    });
  };

  const handleSavePlan = async () => {
    if (!planModal) return;
    setPlanSaving(true);
    try {
      const d = planModal.data;
      const payload = {
        slug: d.slug,
        name: d.name,
        description: d.description || null,
        icon: d.icon || null,
        color: d.color || null,
        price_monthly_cents: d.price_monthly_cents || 0,
        price_yearly_cents: d.price_yearly_cents || 0,
        price_monthly_paisa: d.price_monthly_paisa,
        price_yearly_paisa: d.price_yearly_paisa,
        stripe_price_id_monthly: d.stripe_price_id_monthly || null,
        stripe_price_id_yearly: d.stripe_price_id_yearly || null,
        razorpay_plan_id_monthly: d.razorpay_plan_id_monthly || null,
        razorpay_plan_id_yearly: d.razorpay_plan_id_yearly || null,
        trial_days: d.trial_days,
        features_json: d.features_json,
        display_order: d.display_order,
      };

      if (planModal.mode === 'create') {
        await api.post('/v1/admin/subscription/plans', payload);
        setToast({ type: 'success', msg: `Plan "${d.name}" created` });
      } else {
        await api.put(`/v1/admin/subscription/plans/${d.id}`, payload);
        setToast({ type: 'success', msg: `Plan "${d.name}" updated` });
      }
      setPlanModal(null);
      loadPlans();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Save failed' });
    } finally {
      setPlanSaving(false);
    }
  };

  // Stripe sync
  const [stripeSyncing, setStripeSyncing] = useState(null);

  const handleSyncToStripe = async (plan) => {
    if (!plan.price_monthly_cents && !plan.price_yearly_cents) {
      setToast({ type: 'error', msg: 'Set USD prices before syncing to Stripe' });
      return;
    }
    setStripeSyncing(plan.id);
    try {
      const result = await api.post(`/v1/admin/subscription/plans/${plan.id}/sync-stripe`);
      setToast({
        type: 'success',
        msg: `${plan.name} synced to Stripe! Monthly: ${result.stripe_price_id_monthly || 'N/A'}, Yearly: ${result.stripe_price_id_yearly || 'N/A'}`,
      });
      loadPlans();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Stripe sync failed' });
    } finally {
      setStripeSyncing(null);
    }
  };

  const updatePlanField = (key, value) => {
    setPlanModal((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  // Auto-generate slug from name on create
  const handlePlanNameChange = (val) => {
    updatePlanField('name', val);
    if (planModal?.mode === 'create') {
      updatePlanField(
        'slug',
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
      );
    }
  };

  // Features JSON list management
  const handleAddFeatureJsonItem = () => {
    const current = planModal?.data?.features_json || [];
    updatePlanField('features_json', [...current, '']);
  };

  const handleUpdateFeatureJsonItem = (idx, val) => {
    const updated = [...(planModal?.data?.features_json || [])];
    updated[idx] = val;
    updatePlanField('features_json', updated);
  };

  const handleRemoveFeatureJsonItem = (idx) => {
    const updated = [...(planModal?.data?.features_json || [])];
    updated.splice(idx, 1);
    updatePlanField('features_json', updated);
  };

  // ==================== PLAN FEATURES ====================

  const handleOpenFeatures = async (plan) => {
    setFeaturesModal({ plan_id: plan.id, plan_name: plan.name });
    try {
      const data = await api.get(`/v1/admin/subscription/plans/${plan.id}/features`);
      setFeaturesData(
        Array.isArray(data)
          ? data.map((f) => ({
              feature_key: f.feature_key,
              enabled: f.enabled,
              limit_value: f.limit_value ?? '',
              limit_period: f.limit_period || '',
            }))
          : [],
      );
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Failed to load features' });
      setFeaturesData([]);
    }
  };

  const handleAddFeatureRow = () => {
    setFeaturesData((prev) => [
      ...prev,
      { feature_key: KNOWN_FEATURE_KEYS[0], enabled: true, limit_value: '', limit_period: '' },
    ]);
  };

  const handleUpdateFeatureRow = (idx, key, val) => {
    setFeaturesData((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [key]: val };
      return updated;
    });
  };

  const handleRemoveFeatureRow = (idx) => {
    setFeaturesData((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveFeatures = async () => {
    if (!featuresModal) return;
    setFeaturesSaving(true);
    try {
      const payload = featuresData.map((f) => ({
        feature_key: f.feature_key,
        enabled: f.enabled,
        limit_value: f.limit_value === '' || f.limit_value == null ? null : parseInt(f.limit_value, 10),
        limit_period: f.limit_period || null,
      }));
      await api.put(`/v1/admin/subscription/plans/${featuresModal.plan_id}/features`, payload);
      setToast({ type: 'success', msg: `Features saved for "${featuresModal.plan_name}"` });
      setFeaturesModal(null);
      loadPlans();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Failed to save features' });
    } finally {
      setFeaturesSaving(false);
    }
  };

  // ==================== COUPONS ====================

  const loadCoupons = useCallback(async () => {
    try {
      setCouponsLoading(true);
      setCouponsError('');
      const data = await api.get('/v1/admin/subscription/coupons');
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setCouponsError(err.message);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  const handleNewCoupon = () => {
    setCouponModal({
      mode: 'create',
      data: {
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        applicable_plan_slugs: null,
        max_redemptions: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
      },
    });
  };

  const handleEditCoupon = (coupon) => {
    setCouponModal({
      mode: 'edit',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        applicable_plan_slugs: coupon.applicable_plan_slugs || null,
        max_redemptions: coupon.max_redemptions ?? '',
        valid_from: coupon.valid_from ? coupon.valid_from.substring(0, 10) : '',
        valid_until: coupon.valid_until ? coupon.valid_until.substring(0, 10) : '',
        is_active: coupon.is_active,
      },
    });
  };

  const handleSaveCoupon = async () => {
    if (!couponModal) return;
    setCouponSaving(true);
    try {
      const d = couponModal.data;
      const payload = {
        code: d.code,
        discount_type: d.discount_type,
        discount_value: d.discount_value,
        applicable_plan_slugs: d.applicable_plan_slugs,
        max_redemptions: d.max_redemptions === '' || d.max_redemptions == null ? null : parseInt(d.max_redemptions, 10),
        valid_from: d.valid_from || null,
        valid_until: d.valid_until || null,
        is_active: d.is_active,
      };

      if (couponModal.mode === 'create') {
        await api.post('/v1/admin/subscription/coupons', payload);
        setToast({ type: 'success', msg: `Coupon "${d.code}" created` });
      } else {
        await api.put(`/v1/admin/subscription/coupons/${d.id}`, payload);
        setToast({ type: 'success', msg: `Coupon "${d.code}" updated` });
      }
      setCouponModal(null);
      loadCoupons();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Save failed' });
    } finally {
      setCouponSaving(false);
    }
  };

  const updateCouponField = (key, value) => {
    setCouponModal((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  const handleCouponPlanToggle = (slug) => {
    setCouponModal((prev) => {
      const current = prev.data.applicable_plan_slugs;
      if (!current) {
        // From "All Plans" to selecting one
        return { ...prev, data: { ...prev.data, applicable_plan_slugs: [slug] } };
      }
      const exists = current.includes(slug);
      const updated = exists ? current.filter((s) => s !== slug) : [...current, slug];
      return {
        ...prev,
        data: {
          ...prev.data,
          applicable_plan_slugs: updated.length === 0 ? null : updated,
        },
      };
    });
  };

  // ==================== CREDIT PACKS ====================

  const loadPacks = useCallback(async () => {
    try {
      setPacksLoading(true);
      setPacksError('');
      const data = await api.get('/v1/admin/subscription/credit-packs');
      setPacks(Array.isArray(data) ? data : []);
    } catch (err) {
      setPacksError(err.message);
    } finally {
      setPacksLoading(false);
    }
  }, []);

  const handleNewPack = () => {
    setPackModal({
      mode: 'create',
      data: {
        name: '',
        credit_amount: 10,
        price_paisa: 0,
        feature_key: KNOWN_FEATURE_KEYS[0],
        validity_days: 30,
        is_active: true,
        display_order: 100,
      },
    });
  };

  const handleEditPack = (pack) => {
    setPackModal({
      mode: 'edit',
      data: {
        id: pack.id,
        name: pack.name,
        credit_amount: pack.credit_amount,
        price_paisa: pack.price_paisa,
        feature_key: pack.feature_key,
        validity_days: pack.validity_days,
        is_active: pack.is_active,
        display_order: pack.display_order || 0,
      },
    });
  };

  const handleSavePack = async () => {
    if (!packModal) return;
    setPackSaving(true);
    try {
      const d = packModal.data;
      const payload = {
        name: d.name,
        credit_amount: d.credit_amount,
        price_paisa: d.price_paisa,
        feature_key: d.feature_key,
        validity_days: d.validity_days,
        is_active: d.is_active,
        display_order: d.display_order,
      };

      if (packModal.mode === 'create') {
        await api.post('/v1/admin/subscription/credit-packs', payload);
        setToast({ type: 'success', msg: `Pack "${d.name}" created` });
      } else {
        await api.put(`/v1/admin/subscription/credit-packs/${d.id}`, payload);
        setToast({ type: 'success', msg: `Pack "${d.name}" updated` });
      }
      setPackModal(null);
      loadPacks();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Save failed' });
    } finally {
      setPackSaving(false);
    }
  };

  const updatePackField = (key, value) => {
    setPackModal((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  // ==================== STATS ====================

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError('');
      const data = await api.get('/v1/admin/subscription/stats');
      setStats(data);
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ==================== TAB LOAD ====================

  useEffect(() => {
    if (activeTab === 'plans') loadPlans();
    else if (activeTab === 'coupons') loadCoupons();
    else if (activeTab === 'packs') loadPacks();
    else if (activeTab === 'stats') loadStats();
  }, [activeTab, loadPlans, loadCoupons, loadPacks, loadStats]);

  // ==================== RENDER HELPERS ====================

  const renderError = (error, retryFn) => (
    <div
      style={{
        background: 'rgba(255,71,87,0.1)',
        border: '1px solid rgba(255,71,87,0.3)',
        borderRadius: 8,
        padding: '12px 16px',
        margin: '12px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span style={{ color: '#ff6b81' }}>
        <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
        {error}
      </span>
      <button
        onClick={retryFn}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 6,
          color: '#e0e0e0',
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: 13,
          whiteSpace: 'nowrap',
        }}
      >
        <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Retry
      </button>
    </div>
  );

  const renderLoading = (msg) => (
    <div className="admin-loading">
      <i className="fas fa-spinner fa-spin"></i> {msg}
    </div>
  );

  // ==================== PLANS TAB ====================

  const renderPlansTab = () => (
    <>
      <div className="admin-toolbar">
        <span style={{ color: '#8b949e', fontSize: 13 }}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </span>
        <button className="btn-admin-add" onClick={handleNewPlan}>
          <i className="fas fa-plus"></i> New Plan
        </button>
      </div>

      {plansError && renderError(plansError, () => { setPlansError(''); loadPlans(); })}

      {plansLoading ? (
        renderLoading('Loading plans...')
      ) : plans.length === 0 ? (
        <div className="admin-empty">No subscription plans found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 50, textAlign: 'center' }}>Order</th>
                <th>Slug</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>USD Monthly</th>
                <th style={{ textAlign: 'right' }}>USD Yearly</th>
                <th style={{ textAlign: 'center' }}>Stripe</th>
                <th style={{ textAlign: 'center' }}>Trial</th>
                <th style={{ textAlign: 'center' }}>Features</th>
                <th style={{ textAlign: 'center' }}>Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className={!plan.is_active ? 'deleted-row' : ''}>
                  <td style={{ textAlign: 'center', color: '#b0b7c3' }}>{plan.display_order}</td>
                  <td>
                    <code style={{ fontSize: 12, color: '#b0b7c3' }}>{plan.slug}</code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {plan.icon && (
                        <i
                          className={`fas ${plan.icon}`}
                          style={{ color: plan.color || '#9d7bff', fontSize: 16 }}
                        ></i>
                      )}
                      <div>
                        <strong style={{ color: plan.color || '#e0e0e0' }}>{plan.name}</strong>
                        {plan.description && (
                          <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                            {plan.description.length > 50
                              ? plan.description.substring(0, 50) + '...'
                              : plan.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffa502' }}>
                    {formatUSD(plan.price_monthly_cents)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffa502' }}>
                    {formatUSD(plan.price_yearly_cents)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {plan.stripe_price_id_monthly || plan.stripe_price_id_yearly ? (
                      <span title={`M: ${plan.stripe_price_id_monthly || 'N/A'}\nY: ${plan.stripe_price_id_yearly || 'N/A'}`}
                        style={{ color: '#2ed573', fontSize: 14 }}>
                        <i className="fas fa-check-circle"></i>
                      </span>
                    ) : plan.slug === 'free' ? (
                      <span style={{ color: '#8b949e' }}>—</span>
                    ) : (
                      <button
                        className="btn-edit"
                        onClick={() => handleSyncToStripe(plan)}
                        disabled={stripeSyncing === plan.id}
                        title="Sync to Stripe"
                        style={{ fontSize: 11, padding: '2px 8px' }}
                      >
                        {stripeSyncing === plan.id ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <><i className="fab fa-stripe-s" style={{ marginRight: 3 }}></i>Sync</>
                        )}
                      </button>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', color: '#b0b7c3' }}>
                    {plan.trial_days ? `${plan.trial_days}d` : '\u2014'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenFeatures(plan)}
                      title="Manage Features"
                      style={{ fontSize: 12, padding: '3px 10px' }}
                    >
                      <i className="fas fa-cog" style={{ marginRight: 4 }}></i>
                      {plan.feature_count ?? 0}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <label
                      style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={plan.is_active}
                        onChange={() => handleTogglePlan(plan)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 22,
                          background: plan.is_active ? '#2ed573' : '#444',
                          transition: 'background 0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: '#fff',
                            top: 3,
                            left: plan.is_active ? 21 : 3,
                            transition: 'left 0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => handleEditPlan(plan)} title="Edit Plan">
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // ==================== COUPONS TAB ====================

  const renderCouponsTab = () => (
    <>
      <div className="admin-toolbar">
        <span style={{ color: '#8b949e', fontSize: 13 }}>
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
        </span>
        <button className="btn-admin-add" onClick={handleNewCoupon}>
          <i className="fas fa-plus"></i> New Coupon
        </button>
      </div>

      {couponsError && renderError(couponsError, () => { setCouponsError(''); loadCoupons(); })}

      {couponsLoading ? (
        renderLoading('Loading coupons...')
      ) : coupons.length === 0 ? (
        <div className="admin-empty">No coupons found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th style={{ textAlign: 'center' }}>Type</th>
                <th style={{ textAlign: 'right' }}>Value</th>
                <th>Plans</th>
                <th style={{ textAlign: 'center' }}>Max Uses</th>
                <th style={{ textAlign: 'center' }}>Used</th>
                <th>Valid From</th>
                <th>Valid Until</th>
                <th style={{ textAlign: 'center' }}>Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className={!c.is_active ? 'deleted-row' : ''}>
                  <td>
                    <code style={{ fontSize: 13, color: '#70a1ff', fontWeight: 600 }}>{c.code}</code>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        background: c.discount_type === 'percentage' ? 'rgba(46,213,115,0.15)' : 'rgba(255,165,2,0.15)',
                        color: c.discount_type === 'percentage' ? '#2ed573' : '#ffa502',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {c.discount_type === 'percentage' ? '%' : '\u20B9'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {c.discount_type === 'percentage'
                      ? `${c.discount_value}%`
                      : formatRupees(c.discount_value)}
                  </td>
                  <td>
                    {c.applicable_plan_slugs && c.applicable_plan_slugs.length > 0 ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.applicable_plan_slugs.map((s) => (
                          <span
                            key={s}
                            style={{
                              background: 'rgba(157,123,255,0.15)',
                              color: '#a29bfe',
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#8b949e', fontSize: 12 }}>All Plans</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', color: '#b0b7c3' }}>
                    {c.max_redemptions ?? '\u221E'}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.redemption_count}</td>
                  <td style={{ fontSize: 12, color: '#b0b7c3' }}>{formatDate(c.valid_from)}</td>
                  <td style={{ fontSize: 12, color: '#b0b7c3' }}>{formatDate(c.valid_until)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {c.is_active ? (
                      <span className="badge-active">Active</span>
                    ) : (
                      <span className="badge-inactive">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => handleEditCoupon(c)} title="Edit Coupon">
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // ==================== CREDIT PACKS TAB ====================

  const renderPacksTab = () => (
    <>
      <div className="admin-toolbar">
        <span style={{ color: '#8b949e', fontSize: 13 }}>
          {packs.length} pack{packs.length !== 1 ? 's' : ''}
        </span>
        <button className="btn-admin-add" onClick={handleNewPack}>
          <i className="fas fa-plus"></i> New Pack
        </button>
      </div>

      {packsError && renderError(packsError, () => { setPacksError(''); loadPacks(); })}

      {packsLoading ? (
        renderLoading('Loading credit packs...')
      ) : packs.length === 0 ? (
        <div className="admin-empty">No credit packs found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ textAlign: 'center' }}>Credits</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th>Feature Key</th>
                <th style={{ textAlign: 'center' }}>Validity</th>
                <th style={{ textAlign: 'center' }}>Order</th>
                <th style={{ textAlign: 'center' }}>Active</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id} className={!pack.is_active ? 'deleted-row' : ''}>
                  <td>
                    <strong style={{ color: '#e0e0e0' }}>{pack.name}</strong>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        background: 'rgba(255,165,2,0.15)',
                        color: '#ffa502',
                        padding: '2px 10px',
                        borderRadius: 4,
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {pack.credit_amount}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffa502' }}>
                    {formatRupees(pack.price_paisa)}
                  </td>
                  <td>
                    <code style={{ fontSize: 12, color: '#a29bfe' }}>{pack.feature_key}</code>
                  </td>
                  <td style={{ textAlign: 'center', color: '#b0b7c3' }}>
                    {pack.validity_days ? `${pack.validity_days}d` : '\u2014'}
                  </td>
                  <td style={{ textAlign: 'center', color: '#b0b7c3' }}>{pack.display_order}</td>
                  <td style={{ textAlign: 'center' }}>
                    {pack.is_active ? (
                      <span className="badge-active">Active</span>
                    ) : (
                      <span className="badge-inactive">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => handleEditPack(pack)} title="Edit Pack">
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  // ==================== STATS TAB ====================

  const renderStatsTab = () => (
    <>
      {statsError && renderError(statsError, () => { setStatsError(''); loadStats(); })}

      {statsLoading ? (
        renderLoading('Loading stats...')
      ) : !stats ? (
        <div className="admin-empty">No stats available.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(157,123,255,0.15) 0%, rgba(112,161,255,0.1) 100%)',
              border: '1px solid rgba(157,123,255,0.3)',
              borderRadius: 12,
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(157,123,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="fas fa-users" style={{ fontSize: 24, color: '#9d7bff' }}></i>
            </div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#e0e0e0' }}>
                {stats.active_subscriptions ?? 0}
              </div>
              <div style={{ fontSize: 14, color: '#8b949e', marginTop: 2 }}>Active Subscriptions</div>
            </div>
          </div>

          {/* Plan Breakdown */}
          {stats.plans && stats.plans.length > 0 && (
            <div>
              <h3 style={{ color: '#e0e0e0', marginBottom: 12 }}>
                <i className="fas fa-layer-group" style={{ marginRight: 8, color: '#9d7bff' }}></i>
                Plan Breakdown
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {stats.plans.map((sp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: 8,
                      padding: '16px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#e0e0e0', fontSize: 16 }}>
                        {sp.name || sp.slug || `Plan #${idx + 1}`}
                      </strong>
                      {sp.is_active != null && (
                        sp.is_active ? (
                          <span className="badge-active">Active</span>
                        ) : (
                          <span className="badge-inactive">Inactive</span>
                        )
                      )}
                    </div>
                    {sp.slug && (
                      <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
                        <code>{sp.slug}</code>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13 }}>
                      {sp.price_monthly_cents != null && sp.price_monthly_cents > 0 && (
                        <div>
                          <span style={{ color: '#8b949e' }}>USD Monthly: </span>
                          <span style={{ color: '#2ed573', fontWeight: 600 }}>
                            {formatUSD(sp.price_monthly_cents)}
                          </span>
                        </div>
                      )}
                      {sp.stripe_synced && (
                        <div>
                          <span style={{ color: '#636eff' }}><i className="fab fa-stripe-s"></i> Synced</span>
                        </div>
                      )}
                      {sp.price_monthly_paisa != null && sp.price_monthly_paisa > 0 && (
                        <div>
                          <span style={{ color: '#8b949e' }}>INR: </span>
                          <span style={{ color: '#ffa502', fontWeight: 600 }}>
                            {formatRupees(sp.price_monthly_paisa)}
                          </span>
                        </div>
                      )}
                      {sp.price_yearly_paisa != null && (
                        <div>
                          <span style={{ color: '#8b949e' }}>Yearly: </span>
                          <span style={{ color: '#ffa502', fontWeight: 600 }}>
                            {formatRupees(sp.price_yearly_paisa)}
                          </span>
                        </div>
                      )}
                    </div>
                    {sp.subscriber_count != null && (
                      <div style={{ marginTop: 8, fontSize: 13 }}>
                        <span style={{ color: '#8b949e' }}>Subscribers: </span>
                        <span style={{ color: '#70a1ff', fontWeight: 600 }}>{sp.subscriber_count}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  // ==================== MAIN RENDER ====================

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <h1>
              <i className="fas fa-crown" style={{ marginRight: 10, color: '#ffa502' }}></i>
              Subscription Management
            </h1>
            <p className="admin-subtitle">
              Manage plans, coupons, credit packs, and view subscription analytics.
            </p>
          </div>

          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: '#161b22',
              borderRadius: 8,
              padding: 4,
              marginBottom: 20,
              border: '1px solid #30363d',
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  background: activeTab === tab.key ? 'rgba(157,123,255,0.2)' : 'transparent',
                  color: activeTab === tab.key ? '#c4b5fd' : '#8b949e',
                  transition: 'all 0.2s',
                }}
              >
                <i className={`fas ${tab.icon}`} style={{ marginRight: 6 }}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'plans' && renderPlansTab()}
          {activeTab === 'coupons' && renderCouponsTab()}
          {activeTab === 'packs' && renderPacksTab()}
          {activeTab === 'stats' && renderStatsTab()}
        </div>
      </section>

      {/* ==================== PLAN EDIT MODAL ==================== */}
      {planModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setPlanModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{planModal.mode === 'create' ? 'Create New Plan' : `Edit: ${planModal.data.name}`}</h3>

            {/* Row: Name + Slug */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Plan Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Premium"
                  value={planModal.data.name}
                  onChange={(e) => handlePlanNameChange(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Slug</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. premium"
                  value={planModal.data.slug}
                  onChange={(e) => updatePlanField('slug', e.target.value)}
                  disabled={planModal.mode === 'edit'}
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Plan description..."
                value={planModal.data.description}
                onChange={(e) => updatePlanField('description', e.target.value)}
              />
            </div>

            {/* Row: Icon + Color */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Icon (FontAwesome class)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. fa-gem"
                  value={planModal.data.icon}
                  onChange={(e) => updatePlanField('icon', e.target.value)}
                />
                {planModal.data.icon && (
                  <div style={{ marginTop: 6 }}>
                    <i
                      className={`fas ${planModal.data.icon}`}
                      style={{ color: planModal.data.color, fontSize: 22 }}
                    ></i>
                  </div>
                )}
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={planModal.data.color}
                    onChange={(e) => updatePlanField('color', e.target.value)}
                    style={{ width: 40, height: 34, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={planModal.data.color}
                    onChange={(e) => updatePlanField('color', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row: USD Base Pricing (Source of Truth) */}
            <div style={{ background: 'rgba(46,213,115,0.06)', border: '1px solid rgba(46,213,115,0.2)', borderRadius: 8, padding: 12, marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#2ed573', fontWeight: 600, marginBottom: 8 }}>
                <i className="fas fa-dollar-sign" style={{ marginRight: 4 }}></i>USD Base Pricing (Source of Truth)
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Monthly Price ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={centsToDollars(planModal.data.price_monthly_cents)}
                    onChange={(e) => updatePlanField('price_monthly_cents', dollarsToCents(e.target.value))}
                  />
                  <small style={{ color: '#8b949e' }}>
                    Stored as {planModal.data.price_monthly_cents} cents
                  </small>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Yearly Price ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={centsToDollars(planModal.data.price_yearly_cents)}
                    onChange={(e) => updatePlanField('price_yearly_cents', dollarsToCents(e.target.value))}
                  />
                  <small style={{ color: '#8b949e' }}>
                    Stored as {planModal.data.price_yearly_cents} cents
                  </small>
                </div>
              </div>
            </div>

            {/* Row: INR Pricing (Legacy / Override) */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>INR Monthly (₹) <span style={{ color: '#8b949e', fontSize: 11 }}>Legacy</span></label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={paisaToRupees(planModal.data.price_monthly_paisa)}
                  onChange={(e) => updatePlanField('price_monthly_paisa', rupeesToPaisa(e.target.value))}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>INR Yearly (₹) <span style={{ color: '#8b949e', fontSize: 11 }}>Legacy</span></label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={paisaToRupees(planModal.data.price_yearly_paisa)}
                  onChange={(e) => updatePlanField('price_yearly_paisa', rupeesToPaisa(e.target.value))}
                />
              </div>
            </div>

            {/* Row: Stripe Price IDs (auto-generated on sync) */}
            {(planModal.data.stripe_price_id_monthly || planModal.data.stripe_price_id_yearly) && (
              <div style={{ background: 'rgba(99,110,255,0.06)', border: '1px solid rgba(99,110,255,0.2)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                <div style={{ color: '#636eff', fontWeight: 600, marginBottom: 6 }}>
                  <i className="fab fa-stripe-s" style={{ marginRight: 4 }}></i>Stripe Price IDs (auto-synced)
                </div>
                {planModal.data.stripe_price_id_monthly && (
                  <div style={{ color: '#8b949e', marginBottom: 2 }}>
                    Monthly: <code style={{ color: '#b0b7c3' }}>{planModal.data.stripe_price_id_monthly}</code>
                  </div>
                )}
                {planModal.data.stripe_price_id_yearly && (
                  <div style={{ color: '#8b949e' }}>
                    Yearly: <code style={{ color: '#b0b7c3' }}>{planModal.data.stripe_price_id_yearly}</code>
                  </div>
                )}
              </div>
            )}

            {/* Row: Razorpay IDs (Legacy) */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Razorpay Plan ID (Monthly) <span style={{ color: '#8b949e', fontSize: 11 }}>Legacy</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="plan_..."
                  value={planModal.data.razorpay_plan_id_monthly}
                  onChange={(e) => updatePlanField('razorpay_plan_id_monthly', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Razorpay Plan ID (Yearly) <span style={{ color: '#8b949e', fontSize: 11 }}>Legacy</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="plan_..."
                  value={planModal.data.razorpay_plan_id_yearly}
                  onChange={(e) => updatePlanField('razorpay_plan_id_yearly', e.target.value)}
                />
              </div>
            </div>

            {/* Row: Trial Days + Display Order */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Trial Days</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={planModal.data.trial_days}
                  onChange={(e) => updatePlanField('trial_days', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Display Order</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={planModal.data.display_order}
                  onChange={(e) => updatePlanField('display_order', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Features JSON (display strings) */}
            <div className="form-group">
              <label>Feature Display Strings</label>
              <small style={{ color: '#8b949e', display: 'block', marginBottom: 6 }}>
                These are shown on the pricing page (e.g. "10 AI Questions")
              </small>
              {(planModal.data.features_json || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="e.g. 10 AI Questions"
                    value={item}
                    onChange={(e) => handleUpdateFeatureJsonItem(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeatureJsonItem(idx)}
                    style={{
                      background: 'rgba(255,71,87,0.15)',
                      border: '1px solid rgba(255,71,87,0.3)',
                      color: '#ff6b81',
                      borderRadius: 6,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFeatureJsonItem}
                style={{
                  background: 'rgba(157,123,255,0.1)',
                  border: '1px solid rgba(157,123,255,0.3)',
                  color: '#a29bfe',
                  borderRadius: 6,
                  padding: '4px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                <i className="fas fa-plus" style={{ marginRight: 4 }}></i>Add String
              </button>
            </div>

            {/* Price Preview */}
            {(planModal.data.price_monthly_cents > 0 || planModal.data.price_yearly_cents > 0 || planModal.data.price_monthly_paisa > 0 || planModal.data.price_yearly_paisa > 0) && (
              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 14,
                }}
              >
                {planModal.data.icon && (
                  <i
                    className={`fas ${planModal.data.icon}`}
                    style={{ color: planModal.data.color, fontSize: 20 }}
                  ></i>
                )}
                <div>
                  <strong style={{ color: planModal.data.color || '#e0e0e0' }}>
                    {planModal.data.name || 'Preview'}
                  </strong>
                  <div style={{ color: '#8b949e', fontSize: 12 }}>
                    {planModal.data.price_monthly_cents > 0 && (
                      <span style={{ marginRight: 12 }}>
                        USD Monthly: <span style={{ color: '#2ed573', fontWeight: 600 }}>{formatUSD(planModal.data.price_monthly_cents)}</span>
                      </span>
                    )}
                    {planModal.data.price_yearly_cents > 0 && (
                      <span style={{ marginRight: 12 }}>
                        USD Yearly: <span style={{ color: '#2ed573', fontWeight: 600 }}>{formatUSD(planModal.data.price_yearly_cents)}</span>
                      </span>
                    )}
                    {planModal.data.price_monthly_paisa > 0 && (
                      <span style={{ marginRight: 12 }}>
                        INR Monthly: <span style={{ color: '#ffa502', fontWeight: 600 }}>{formatRupees(planModal.data.price_monthly_paisa)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setPlanModal(null)}>
                Cancel
              </button>
              <button
                className="btn-modal-save"
                disabled={planSaving || !planModal.data.name.trim() || !planModal.data.slug.trim()}
                onClick={handleSavePlan}
              >
                {planSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : planModal.mode === 'create' ? (
                  'Create Plan'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FEATURES MODAL ==================== */}
      {featuresModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setFeaturesModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>
              <i className="fas fa-cog" style={{ marginRight: 8, color: '#9d7bff' }}></i>
              Features: {featuresModal.plan_name}
            </h3>

            {featuresData.length === 0 ? (
              <div style={{ color: '#8b949e', padding: '20px 0', textAlign: 'center' }}>
                No features configured. Click "Add Feature" to start.
              </div>
            ) : (
              <table className="admin-table" style={{ marginBottom: 12 }}>
                <thead>
                  <tr>
                    <th>Feature Key</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Enabled</th>
                    <th style={{ width: 100 }}>Limit</th>
                    <th style={{ width: 120 }}>Period</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {featuresData.map((feat, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-input"
                          value={feat.feature_key}
                          onChange={(e) => handleUpdateFeatureRow(idx, 'feature_key', e.target.value)}
                          style={{ fontSize: 13 }}
                        >
                          {KNOWN_FEATURE_KEYS.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={feat.enabled}
                          onChange={(e) => handleUpdateFeatureRow(idx, 'enabled', e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min={0}
                          placeholder="unlimited"
                          value={feat.limit_value}
                          onChange={(e) =>
                            handleUpdateFeatureRow(
                              idx,
                              'limit_value',
                              e.target.value === '' ? '' : parseInt(e.target.value) || 0,
                            )
                          }
                          style={{ fontSize: 13 }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-input"
                          value={feat.limit_period}
                          onChange={(e) => handleUpdateFeatureRow(idx, 'limit_period', e.target.value)}
                          style={{ fontSize: 13 }}
                        >
                          {LIMIT_PERIODS.map((lp) => (
                            <option key={lp.value} value={lp.value}>
                              {lp.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeatureRow(idx)}
                          style={{
                            background: 'rgba(255,71,87,0.15)',
                            border: '1px solid rgba(255,71,87,0.3)',
                            color: '#ff6b81',
                            borderRadius: 6,
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              type="button"
              onClick={handleAddFeatureRow}
              style={{
                background: 'rgba(157,123,255,0.1)',
                border: '1px solid rgba(157,123,255,0.3)',
                color: '#a29bfe',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add Feature
            </button>

            <div className="admin-modal-actions" style={{ marginTop: 16 }}>
              <button className="btn-modal-cancel" onClick={() => setFeaturesModal(null)}>
                Cancel
              </button>
              <button className="btn-modal-save" disabled={featuresSaving} onClick={handleSaveFeatures}>
                {featuresSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  'Save Features'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== COUPON MODAL ==================== */}
      {couponModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setCouponModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>
              {couponModal.mode === 'create' ? 'Create New Coupon' : `Edit Coupon: ${couponModal.data.code}`}
            </h3>

            {/* Code */}
            <div className="form-group">
              <label>Coupon Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SAVE20"
                value={couponModal.data.code}
                onChange={(e) => updateCouponField('code', e.target.value.toUpperCase())}
                style={{ textTransform: 'uppercase', letterSpacing: 1 }}
              />
            </div>

            {/* Row: Type + Value */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Discount Type</label>
                <select
                  className="form-input"
                  value={couponModal.data.discount_type}
                  onChange={(e) => updateCouponField('discount_type', e.target.value)}
                >
                  {DISCOUNT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  Discount Value{' '}
                  {couponModal.data.discount_type === 'percentage' ? '(%)' : '(\u20B9)'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={couponModal.data.discount_type === 'percentage' ? 100 : undefined}
                  value={couponModal.data.discount_value}
                  onChange={(e) => updateCouponField('discount_value', parseInt(e.target.value) || 0)}
                />
                {couponModal.data.discount_type === 'fixed_amount' && (
                  <small style={{ color: '#8b949e' }}>
                    Enter raw value (e.g. 5000 for \u20B950 off)
                  </small>
                )}
              </div>
            </div>

            {/* Applicable Plans */}
            <div className="form-group">
              <label>Applicable Plans</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => updateCouponField('applicable_plan_slugs', null)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: !couponModal.data.applicable_plan_slugs ? '#9d7bff' : '#30363d',
                    background: !couponModal.data.applicable_plan_slugs ? 'rgba(157,123,255,0.2)' : 'transparent',
                    color: !couponModal.data.applicable_plan_slugs ? '#c4b5fd' : '#8b949e',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  All Plans
                </button>
                {PLAN_SLUGS.map((slug) => {
                  const selected =
                    couponModal.data.applicable_plan_slugs &&
                    couponModal.data.applicable_plan_slugs.includes(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => handleCouponPlanToggle(slug)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: selected ? '#70a1ff' : '#30363d',
                        background: selected ? 'rgba(112,161,255,0.15)' : 'transparent',
                        color: selected ? '#70a1ff' : '#8b949e',
                        cursor: 'pointer',
                        fontSize: 13,
                        textTransform: 'capitalize',
                      }}
                    >
                      {slug}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Redemptions */}
            <div className="form-group">
              <label>Max Redemptions</label>
              <input
                type="number"
                className="form-input"
                min={0}
                placeholder="Leave blank for unlimited"
                value={couponModal.data.max_redemptions}
                onChange={(e) =>
                  updateCouponField('max_redemptions', e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                }
              />
              <small style={{ color: '#8b949e' }}>Leave blank for unlimited redemptions</small>
            </div>

            {/* Row: Valid From + Valid Until */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Valid From</label>
                <input
                  type="date"
                  className="form-input"
                  value={couponModal.data.valid_from}
                  onChange={(e) => updateCouponField('valid_from', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Valid Until</label>
                <input
                  type="date"
                  className="form-input"
                  value={couponModal.data.valid_until}
                  onChange={(e) => updateCouponField('valid_until', e.target.value)}
                />
              </div>
            </div>

            {/* Active */}
            <div className="form-group" style={{ marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={couponModal.data.is_active}
                  onChange={(e) => updateCouponField('is_active', e.target.checked)}
                />
                Active
              </label>
            </div>

            {/* Preview */}
            {couponModal.data.code && (
              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 8,
                  padding: 12,
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 14,
                }}
              >
                <i className="fas fa-ticket-alt" style={{ color: '#ffa502', fontSize: 20 }}></i>
                <div>
                  <strong style={{ color: '#70a1ff', letterSpacing: 1 }}>{couponModal.data.code}</strong>
                  <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2 }}>
                    {couponModal.data.discount_type === 'percentage'
                      ? `${couponModal.data.discount_value}% off`
                      : `${formatRupees(couponModal.data.discount_value)} off`}
                    {couponModal.data.applicable_plan_slugs
                      ? ` on ${couponModal.data.applicable_plan_slugs.join(', ')}`
                      : ' on all plans'}
                  </div>
                </div>
              </div>
            )}

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setCouponModal(null)}>
                Cancel
              </button>
              <button
                className="btn-modal-save"
                disabled={couponSaving || !couponModal.data.code.trim()}
                onClick={handleSaveCoupon}
              >
                {couponSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : couponModal.mode === 'create' ? (
                  'Create Coupon'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREDIT PACK MODAL ==================== */}
      {packModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setPackModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>
              {packModal.mode === 'create' ? 'Create New Credit Pack' : `Edit: ${packModal.data.name}`}
            </h3>

            {/* Name */}
            <div className="form-group">
              <label>Pack Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AI Chat 25-Pack"
                value={packModal.data.name}
                onChange={(e) => updatePackField('name', e.target.value)}
              />
            </div>

            {/* Row: Credits + Price */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Credit Amount</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={packModal.data.credit_amount}
                  onChange={(e) => updatePackField('credit_amount', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (\u20B9)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={paisaToRupees(packModal.data.price_paisa)}
                  onChange={(e) => updatePackField('price_paisa', rupeesToPaisa(e.target.value))}
                />
                <small style={{ color: '#8b949e' }}>
                  Enter in rupees. Stored as {packModal.data.price_paisa} paisa
                </small>
              </div>
            </div>

            {/* Feature Key */}
            <div className="form-group">
              <label>Feature Key</label>
              <select
                className="form-input"
                value={packModal.data.feature_key}
                onChange={(e) => updatePackField('feature_key', e.target.value)}
              >
                {KNOWN_FEATURE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Row: Validity + Order */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Validity (days)</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={packModal.data.validity_days}
                  onChange={(e) => updatePackField('validity_days', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Display Order</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  value={packModal.data.display_order}
                  onChange={(e) => updatePackField('display_order', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Active */}
            <div className="form-group" style={{ marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={packModal.data.is_active}
                  onChange={(e) => updatePackField('is_active', e.target.checked)}
                />
                Active
              </label>
            </div>

            {/* Preview */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
              }}
            >
              <i className="fas fa-coins" style={{ color: '#ffa502', fontSize: 20 }}></i>
              <div>
                <strong style={{ color: '#e0e0e0' }}>{packModal.data.name || 'Preview'}</strong>
                <div style={{ color: '#8b949e', fontSize: 12, marginTop: 2 }}>
                  <span style={{ color: '#ffa502', fontWeight: 600 }}>{packModal.data.credit_amount}</span>
                  {' credits '}
                  <span style={{ color: '#a29bfe' }}>({packModal.data.feature_key})</span>
                  {' for '}
                  <span style={{ color: '#ffa502', fontWeight: 600 }}>
                    {formatRupees(packModal.data.price_paisa)}
                  </span>
                  {' \u00B7 '}
                  {packModal.data.validity_days}d validity
                </div>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setPackModal(null)}>
                Cancel
              </button>
              <button
                className="btn-modal-save"
                disabled={packSaving || !packModal.data.name.trim()}
                onClick={handleSavePack}
              >
                {packSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : packModal.mode === 'create' ? (
                  'Create Pack'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST ==================== */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {toast.msg}
        </div>
      )}
    </PageShell>
  );
}
