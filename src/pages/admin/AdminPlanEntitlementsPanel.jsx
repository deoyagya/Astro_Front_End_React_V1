import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

const DEFAULT_PERIOD_OPTIONS = [
  { value: '', label: 'Unlimited / Access only' },
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'total_saved', label: 'Total Saved' },
  { value: 'per_deliverable', label: 'Per Deliverable' },
  { value: 'per_match', label: 'Per Match' },
];

function featureMode(row) {
  return row?.metadata_json?.entitlement_mode || (row?.is_metered ? 'quota' : 'boolean');
}

function periodOptions(row) {
  const values = row?.metadata_json?.limit_period_options;
  if (Array.isArray(values) && values.length > 0) {
    return [
      { value: '', label: 'Unlimited / Access only' },
      ...values.map((value) => ({
        value,
        label: value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      })),
    ];
  }
  return DEFAULT_PERIOD_OPTIONS;
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

export default function AdminPlanEntitlementsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [plans, setPlans] = useState([]);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/v1/admin/subscription/entitlements/matrix');
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
      setRows(normalizeRows(data?.rows));
    } catch (err) {
      setError(err.message || 'Failed to load entitlement matrix');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const categories = useMemo(() => {
    const next = new Set(rows.map((row) => row.category).filter(Boolean));
    return ['all', ...Array.from(next).sort()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesCategory = category === 'all' || row.category === category;
      const haystack = `${row.name || ''} ${row.feature_key || ''} ${row.description || ''}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [category, rows, search]);

  const updateCell = useCallback((featureKey, planId, patch) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.feature_key !== featureKey) return row;
        return {
          ...row,
          plan_values: (row.plan_values || []).map((cell) => (
            cell.plan_id === planId ? { ...cell, ...patch } : cell
          )),
        };
      }),
    );
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const payload = rows.map((row) => ({
        feature_key: row.feature_key,
        plan_values: (row.plan_values || []).map((cell) => ({
          plan_id: cell.plan_id,
          enabled: !!cell.enabled,
          limit_value:
            cell.limit_value === '' || cell.limit_value == null
              ? null
              : parseInt(cell.limit_value, 10) || 0,
          limit_period: cell.limit_period || null,
        })),
      }));
      const data = await api.put('/v1/admin/subscription/entitlements/matrix', payload);
      setPlans(Array.isArray(data?.plans) ? data.plans : plans);
      setRows(normalizeRows(data?.rows));
      setToast({ type: 'success', msg: 'Plan entitlements saved' });
    } catch (err) {
      setError(err.message || 'Failed to save entitlement matrix');
      setToast({ type: 'error', msg: err.message || 'Failed to save entitlement matrix' });
    } finally {
      setSaving(false);
    }
  }, [plans, rows]);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div
        style={{
          background: 'rgba(17, 20, 33, 0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, color: '#f5f6fa' }}>
              <i className="fas fa-table-cells-large" style={{ marginRight: 10, color: '#9d7bff' }}></i>
              Plan Entitlement Matrix
            </h2>
            <p style={{ margin: '8px 0 0', color: '#8b949e', lineHeight: 1.6 }}>
              Define access and limits per plan using checkboxes and counts. Blank counts mean access without a hard count.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ minWidth: 180 }}
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'All Categories' : value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </select>
            <button className="btn-admin-add" type="button" onClick={handleSave} disabled={saving || loading}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Matrix</>}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="badge-active">Checkbox = feature access</span>
          <span className="badge-inactive" style={{ borderColor: 'rgba(112,161,255,0.35)', color: '#70a1ff' }}>Count = allowed quantity</span>
          <span className="badge-inactive" style={{ borderColor: 'rgba(255,165,2,0.35)', color: '#ffa502' }}>Period = monthly / yearly / cap scope</span>
        </div>

        {toast ? (
          <div className={`admin-toast ${toast.type}`} style={{ marginBottom: 14 }}>
            {toast.msg}
          </div>
        ) : null}

        {error ? (
          <div className="api-error" style={{ marginBottom: 14 }}>
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading entitlement matrix...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #30363d' }}>
            <table className="admin-table" style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 240 }}>Feature</th>
                  <th style={{ minWidth: 110 }}>Category</th>
                  {plans.map((plan) => (
                    <th key={plan.id} style={{ minWidth: 240 }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <strong style={{ color: plan.color || '#f5f6fa' }}>{plan.name}</strong>
                        <span style={{ color: '#8b949e', fontSize: 12 }}>{plan.slug}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const mode = featureMode(row);
                  const showLimitInputs = mode !== 'boolean';
                  const options = periodOptions(row);
                  return (
                    <tr key={row.feature_key}>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <strong style={{ color: '#f5f6fa' }}>{row.name}</strong>
                          <code style={{ fontSize: 12, color: '#a29bfe' }}>{row.feature_key}</code>
                          {row.description ? (
                            <span style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.5 }}>{row.description}</span>
                          ) : null}
                          {row.unit_label ? (
                            <span style={{ color: '#70a1ff', fontSize: 12 }}>
                              Unit: {row.unit_label}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td style={{ color: '#c7cfdd', textTransform: 'capitalize' }}>{row.category || 'general'}</td>
                      {(row.plan_values || []).map((cell) => (
                        <td key={`${row.feature_key}-${cell.plan_id}`}>
                          <div style={{ display: 'grid', gap: 10 }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#e0e0e0' }}>
                              <input
                                type="checkbox"
                                checked={!!cell.enabled}
                                onChange={(e) => updateCell(row.feature_key, cell.plan_id, { enabled: e.target.checked })}
                              />
                              <span>Access</span>
                            </label>
                            {showLimitInputs ? (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  className="form-input"
                                  placeholder={mode === 'cap' ? 'Max count' : 'Allowed count'}
                                  value={cell.limit_value ?? ''}
                                  onChange={(e) => updateCell(row.feature_key, cell.plan_id, {
                                    limit_value: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0,
                                  })}
                                  disabled={!cell.enabled}
                                />
                                <select
                                  className="form-input"
                                  value={cell.limit_period || ''}
                                  onChange={(e) => updateCell(row.feature_key, cell.plan_id, { limit_period: e.target.value })}
                                  disabled={!cell.enabled}
                                >
                                  {options.map((option) => (
                                    <option key={option.value || 'blank'} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : (
                              <div style={{ color: '#8b949e', fontSize: 12 }}>
                                Access-only feature
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
