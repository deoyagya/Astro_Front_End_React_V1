import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';

const DEFAULT_PLAN = {
  slug: '',
  name: '',
  description: '',
  icon: '',
  color: '#9d7bff',
  price_monthly_cents: 0,
  price_yearly_cents: 0,
  stripe_price_id_monthly: '',
  stripe_price_id_yearly: '',
  trial_days: 0,
  display_order: 100,
};

const formatUSD = (cents) => {
  if (cents == null || cents === 0) return 'Free';
  return '$' + (cents / 100).toFixed(2);
};

const centsToDollars = (cents) => (cents != null ? (cents / 100).toFixed(2) : '');
const dollarsToCents = (dollars) => Math.round((parseFloat(dollars) || 0) * 100);

export default function AdminSubscriptionPlanEditorPage() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const isCreate = !planId || planId === 'new';

  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [data, setData] = useState(DEFAULT_PLAN);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadPlan = useCallback(async () => {
    if (isCreate) return;
    setLoading(true);
    setError('');
    try {
      const plans = await api.get('/v1/admin/subscription/plans');
      const plan = Array.isArray(plans) ? plans.find((item) => item.id === planId) : null;
      if (!plan) {
        setError('Plan not found');
        return;
      }
      setData({
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        description: plan.description || '',
        icon: plan.icon || '',
        color: plan.color || '#9d7bff',
        price_monthly_cents: plan.price_monthly_cents || 0,
        price_yearly_cents: plan.price_yearly_cents || 0,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
        trial_days: plan.trial_days || 0,
        display_order: plan.display_order || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [isCreate, planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const updateField = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (value) => {
    updateField('name', value);
    if (isCreate) {
      updateField(
        'slug',
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
      );
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        price_monthly_cents: data.price_monthly_cents || 0,
        price_yearly_cents: data.price_yearly_cents || 0,
        stripe_price_id_monthly: data.stripe_price_id_monthly || null,
        stripe_price_id_yearly: data.stripe_price_id_yearly || null,
        trial_days: data.trial_days || 0,
        display_order: data.display_order || 0,
      };

      if (isCreate) {
        await api.post('/v1/admin/subscription/plans', payload);
        setToast({ type: 'success', msg: `Plan "${data.name}" created` });
      } else {
        await api.put(`/v1/admin/subscription/plans/${data.id}`, payload);
        setToast({ type: 'success', msg: `Plan "${data.name}" updated` });
      }
      navigate('/admin/subscriptions');
    } catch (err) {
      setError(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = useMemo(
    () => (isCreate ? 'Create Subscription Plan' : `Edit Subscription Plan: ${data.name || 'Plan'}`),
    [data.name, isCreate],
  );

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container" style={{ maxWidth: 1440 }}>
          <div className="admin-breadcrumb">
            <a href="/admin/subscriptions" onClick={(e) => { e.preventDefault(); navigate('/admin/subscriptions'); }}>
              Subscriptions
            </a>
            <span className="sep">/</span>
            <span>{isCreate ? 'New Plan' : data.name || 'Edit Plan'}</span>
          </div>

          <div className="admin-header">
            <h1>
              <i className="fas fa-crown" style={{ marginRight: 10, color: '#ffa502' }}></i>
              {pageTitle}
            </h1>
            <p className="admin-subtitle">
              Manage the full plan definition on a dedicated screen instead of a modal.
            </p>
          </div>

          {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}

          {error && (
            <div className="api-error">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin"></i>
              Loading plan...
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(17, 20, 33, 0.88)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 18,
                padding: 28,
                display: 'grid',
                gap: 18,
                width: '100%',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Plan Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Premium"
                    value={data.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. premium"
                    value={data.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    disabled={!isCreate}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Plan description..."
                  value={data.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    padding: '14px 16px',
                    background: 'rgba(40, 44, 60, 0.8)',
                    border: '1px solid #2a2f3e',
                    borderRadius: 12,
                    color: '#e8eaf0',
                    resize: 'vertical',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Icon (FontAwesome class)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. fa-gem"
                    value={data.icon}
                    onChange={(e) => updateField('icon', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12 }}>
                    <input
                      type="color"
                      value={data.color}
                      onChange={(e) => updateField('color', e.target.value)}
                      style={{ width: '100%', height: 48, border: 'none', borderRadius: 10, background: 'transparent' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={data.color}
                      onChange={(e) => updateField('color', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(46,213,115,0.06)',
                  border: '1px solid rgba(46,213,115,0.2)',
                  borderRadius: 14,
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 13, color: '#2ed573', fontWeight: 700, marginBottom: 12 }}>
                  <i className="fas fa-dollar-sign" style={{ marginRight: 6 }}></i>
                  USD Base Pricing (Source of Truth)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Monthly Price ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      step={0.01}
                      value={centsToDollars(data.price_monthly_cents)}
                      onChange={(e) => updateField('price_monthly_cents', dollarsToCents(e.target.value))}
                    />
                    <small style={{ color: '#8b949e' }}>Stored as {data.price_monthly_cents} cents</small>
                  </div>
                  <div className="form-group">
                    <label>Yearly Price ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      step={0.01}
                      value={centsToDollars(data.price_yearly_cents)}
                      onChange={(e) => updateField('price_yearly_cents', dollarsToCents(e.target.value))}
                    />
                    <small style={{ color: '#8b949e' }}>Stored as {data.price_yearly_cents} cents</small>
                  </div>
                </div>
              </div>

              {(data.stripe_price_id_monthly || data.stripe_price_id_yearly) && (
                <div
                  style={{
                    background: 'rgba(99,110,255,0.06)',
                    border: '1px solid rgba(99,110,255,0.2)',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ color: '#636eff', fontWeight: 700, marginBottom: 8 }}>
                    <i className="fab fa-stripe-s" style={{ marginRight: 6 }}></i>
                    Stripe Price IDs
                  </div>
                  {data.stripe_price_id_monthly && (
                    <div style={{ color: '#c7cfdd', fontSize: 13, marginBottom: 4 }}>
                      Monthly: <code>{data.stripe_price_id_monthly}</code>
                    </div>
                  )}
                  {data.stripe_price_id_yearly && (
                    <div style={{ color: '#c7cfdd', fontSize: 13 }}>
                      Yearly: <code>{data.stripe_price_id_yearly}</code>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Trial Days</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={data.trial_days}
                    onChange={(e) => updateField('trial_days', parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={data.display_order}
                    onChange={(e) => updateField('display_order', parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(157,123,255,0.08)',
                  border: '1px solid rgba(157,123,255,0.18)',
                  borderRadius: 14,
                  padding: 16,
                  color: '#c7cfdd',
                  fontSize: 14,
                }}
              >
                <strong style={{ color: '#b89cfb', display: 'block', marginBottom: 6 }}>
                  Entitlements drive public feature copy
                </strong>
                Plan cards, comparison tables, and subscriber feature rows are now generated from the
                entitlement matrix and feature catalog. This screen only controls plan identity, price,
                icon, and ordering.
              </div>

              <div
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {data.icon ? <i className={`fas ${data.icon}`} style={{ color: data.color, fontSize: 20 }}></i> : null}
                  <strong style={{ color: data.color || '#e0e0e0' }}>{data.name || 'Plan Preview'}</strong>
                </div>
                <div style={{ color: '#8b949e', fontSize: 14 }}>
                  {data.price_monthly_cents > 0 && (
                    <span style={{ marginRight: 16 }}>
                      Monthly: <strong style={{ color: '#2ed573' }}>{formatUSD(data.price_monthly_cents)}</strong>
                    </span>
                  )}
                  {data.price_yearly_cents > 0 && (
                    <span>
                      Yearly: <strong style={{ color: '#2ed573' }}>{formatUSD(data.price_yearly_cents)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="admin-toolbar" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <button className="btn-modal-cancel" type="button" onClick={() => navigate('/admin/subscriptions')}>
                  Back
                </button>
                <button
                  className="btn-modal-save"
                  type="button"
                  disabled={saving || !data.name.trim() || !data.slug.trim()}
                  onClick={handleSave}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : isCreate ? (
                    'Create Plan'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
