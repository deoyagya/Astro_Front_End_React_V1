/**
 * AdminGatewayConfigPage — Admin CRUD for payment gateway configuration.
 *
 * Manages country → gateway (stripe/razorpay) → currency mappings.
 * The catch-all "*" rule cannot be deleted.
 */

import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';

const GATEWAY_OPTIONS = ['stripe', 'razorpay'];
const CURRENCY_OPTIONS = ['USD', 'INR', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];

const EMPTY_FORM = {
  country_code: '',
  gateway: 'stripe',
  currency: 'USD',
  is_active: true,
};

export default function AdminGatewayConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  /* ---- Fetch all configs ---- */
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/v1/admin/gateway-config');
      setConfigs(data?.configs || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load gateway configs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  /* ---- Open form for add/edit ---- */
  const handleAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setError('');
    setSuccessMsg('');
  };

  const handleEdit = (config) => {
    setEditingId(config.id);
    setForm({
      country_code: config.country_code || '',
      gateway: config.gateway || 'stripe',
      currency: config.currency || 'USD',
      is_active: config.is_active !== false,
    });
    setShowForm(true);
    setError('');
    setSuccessMsg('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  /* ---- Save (create or update) ---- */
  const handleSave = async () => {
    if (!form.country_code.trim()) {
      setError('Country code is required (2-letter ISO code or "*" for default)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/v1/admin/gateway-config/${editingId}`, {
          gateway: form.gateway,
          currency: form.currency,
          is_active: form.is_active,
        });
        setSuccessMsg('Gateway config updated successfully');
      } else {
        await api.post('/v1/admin/gateway-config', {
          country_code: form.country_code.toUpperCase().trim(),
          gateway: form.gateway,
          currency: form.currency,
          is_active: form.is_active,
        });
        setSuccessMsg('Gateway config created successfully');
      }
      handleCloseForm();
      await fetchConfigs();
    } catch (err) {
      setError(err.message || 'Failed to save gateway config');
    } finally {
      setSaving(false);
    }
  };

  /* ---- Delete ---- */
  const handleDelete = async (id) => {
    setError('');
    try {
      await api.del(`/v1/admin/gateway-config/${id}`);
      setDeletingId(null);
      setSuccessMsg('Gateway config deleted');
      await fetchConfigs();
    } catch (err) {
      setError(err.message || 'Failed to delete config');
      setDeletingId(null);
    }
  };

  /* ---- Toggle active status ---- */
  const handleToggleActive = async (config) => {
    setError('');
    try {
      await api.put(`/v1/admin/gateway-config/${config.id}`, {
        gateway: config.gateway,
        currency: config.currency,
        is_active: !config.is_active,
      });
      await fetchConfigs();
    } catch (err) {
      setError(err.message || 'Failed to toggle status');
    }
  };

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        <div className="admin-header">
          <div>
            <h1><i className="fas fa-globe" style={{ marginRight: 10 }}></i>Payment Gateway Config</h1>
            <p className="admin-subtitle">
              Configure which payment gateway (Stripe or Razorpay) is used per country. The catch-all "*" rule serves as the default.
            </p>
          </div>
          <button className="admin-btn primary" onClick={handleAdd}>
            <i className="fas fa-plus" style={{ marginRight: 6 }}></i>Add Rule
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="admin-success">
            <i className="fas fa-check-circle" style={{ marginRight: 8 }}></i>
            {successMsg}
            <button onClick={() => setSuccessMsg('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#2ed573', cursor: 'pointer', textDecoration: 'underline' }}>
              Dismiss
            </button>
          </div>
        )}
        {error && (
          <div className="admin-error">
            <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>
            {error}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="admin-modal-overlay" onClick={handleCloseForm}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <h3>{editingId ? 'Edit Gateway Rule' : 'Add Gateway Rule'}</h3>

              <div className="admin-form-group">
                <label>Country Code</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.country_code}
                  onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value }))}
                  placeholder='2-letter ISO code (e.g. IN, US) or "*" for default'
                  maxLength={2}
                  disabled={!!editingId}
                  style={{ textTransform: 'uppercase' }}
                />
                <small style={{ color: '#8b949e', fontSize: '0.8rem' }}>
                  Use "*" as a catch-all default for unmatched countries.
                </small>
              </div>

              <div className="admin-form-group">
                <label>Gateway</label>
                <select
                  className="admin-input"
                  value={form.gateway}
                  onChange={(e) => setForm((f) => ({ ...f, gateway: e.target.value }))}
                >
                  {GATEWAY_OPTIONS.map((gw) => (
                    <option key={gw} value={gw}>
                      {gw.charAt(0).toUpperCase() + gw.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Currency</label>
                <select
                  className="admin-input"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    style={{ accentColor: '#7b5bff' }}
                  />
                  Active
                </label>
              </div>

              <div className="admin-modal-actions">
                <button className="admin-btn outline" onClick={handleCloseForm} disabled={saving}>
                  Cancel
                </button>
                <button className="admin-btn primary" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: 6 }}></i>Saving...</>
                  ) : (
                    <><i className="fas fa-save" style={{ marginRight: 6 }}></i>{editingId ? 'Update' : 'Create'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading gateway configs...
          </div>
        ) : configs.length === 0 ? (
          <div className="admin-empty">
            <i className="fas fa-globe" style={{ fontSize: 48, opacity: 0.3, marginBottom: 16, display: 'block' }}></i>
            <p>No gateway configs found. Add a rule to get started.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Gateway</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((cfg) => {
                  const isCatchAll = cfg.country_code === '*';
                  return (
                    <tr key={cfg.id}>
                      <td>
                        <span style={{ fontWeight: isCatchAll ? 700 : 400, color: isCatchAll ? '#ffa502' : '#e6edf3' }}>
                          {isCatchAll ? '* (Default)' : cfg.country_code}
                        </span>
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            background: cfg.gateway === 'razorpay' ? '#0066ff20' : '#7b5bff20',
                            color: cfg.gateway === 'razorpay' ? '#528cff' : '#a78bfa',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          {cfg.gateway === 'razorpay' ? (
                            <><i className="fas fa-rupee-sign" style={{ marginRight: 4 }}></i>Razorpay</>
                          ) : (
                            <><i className="fab fa-stripe-s" style={{ marginRight: 4 }}></i>Stripe</>
                          )}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{cfg.currency}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(cfg)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: cfg.is_active ? '#2ed573' : '#ff4757',
                            backgroundColor: cfg.is_active ? '#2ed57315' : '#ff475715',
                          }}
                          title={cfg.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <i className={`fas ${cfg.is_active ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ marginRight: 4 }}></i>
                          {cfg.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                        {cfg.updated_at
                          ? new Date(cfg.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="admin-btn-icon"
                          onClick={() => handleEdit(cfg)}
                          title="Edit"
                          style={{ marginRight: 8 }}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        {!isCatchAll && (
                          <>
                            {deletingId === cfg.id ? (
                              <span style={{ fontSize: '0.85rem' }}>
                                <button
                                  className="admin-btn-icon danger"
                                  onClick={() => handleDelete(cfg.id)}
                                  title="Confirm delete"
                                  style={{ color: '#ff4757', marginRight: 4 }}
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="admin-btn-icon"
                                  onClick={() => setDeletingId(null)}
                                  title="Cancel"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </span>
                            ) : (
                              <button
                                className="admin-btn-icon danger"
                                onClick={() => setDeletingId(cfg.id)}
                                title="Delete"
                                style={{ color: '#ff4757' }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </>
                        )}
                        {isCatchAll && (
                          <span style={{ color: '#484f58', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Cannot delete default
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info card */}
        <div style={{
          marginTop: 24,
          padding: '16px 20px',
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          color: '#8b949e',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}>
          <h4 style={{ color: '#e6edf3', marginBottom: 8, fontSize: '1rem' }}>
            <i className="fas fa-info-circle" style={{ marginRight: 8, color: '#7b5bff' }}></i>
            How Gateway Resolution Works
          </h4>
          <ol style={{ marginLeft: 16, paddingLeft: 0 }}>
            <li>User's IP is geo-located to a country code (e.g. IN, US, GB)</li>
            <li>System looks up an <strong>active</strong> rule matching that country code</li>
            <li>If no match, falls back to the <strong>* (Default)</strong> catch-all rule</li>
            <li>If no catch-all exists, defaults to <strong>Stripe / USD</strong></li>
          </ol>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            <strong>Tip:</strong> Set <code style={{ color: '#a78bfa', background: '#21262d', padding: '2px 6px', borderRadius: 4 }}>IN → Razorpay / INR</code> for India
            and <code style={{ color: '#a78bfa', background: '#21262d', padding: '2px 6px', borderRadius: 4 }}>* → Stripe / USD</code> as the default for everyone else.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
