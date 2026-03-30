import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

function getTriggerLabel(metadata = {}) {
  if (Array.isArray(metadata.routes) && metadata.routes.length > 0) {
    return metadata.routes.join(', ');
  }
  if (metadata.route) return metadata.route;
  if (metadata.report_type) return `report:${metadata.report_type}`;
  if (metadata.order_type) return `order:${metadata.order_type}`;
  if (metadata.report_family) return `report-family:${metadata.report_family}`;
  return 'Application write flow';
}

function getSurfaceLabel(trigger) {
  if (!trigger) return 'Application';
  if (trigger.startsWith('/v1/payment') || trigger.includes('stripe') || trigger.includes('razorpay')) {
    return 'Financial / Checkout';
  }
  if (trigger.startsWith('batch:')) return 'Batch / Automation';
  if (trigger.startsWith('/v1/')) return 'API / DB Write';
  return 'Application';
}

export default function AdminActivityInventoryPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/v1/admin/subscription/entitlements/matrix');
      setActivities(Array.isArray(data?.activities) ? data.activities : []);
    } catch (err) {
      setError(err.message || 'Failed to load activity inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const categories = useMemo(() => {
    const next = new Set(activities.map((item) => item.category).filter(Boolean));
    return ['all', ...Array.from(next).sort()];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return activities.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const trigger = getTriggerLabel(item.metadata_json || {});
      const haystack = `${item.name || ''} ${item.activity_key || ''} ${item.feature_key || ''} ${item.description || ''} ${trigger}`.toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [activities, category, search]);

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
              <i className="fas fa-list-check" style={{ marginRight: 10, color: '#9d7bff' }}></i>
              Activity Inventory
            </h2>
            <p style={{ margin: '8px 0 0', color: '#8b949e', lineHeight: 1.6 }}>
              Full inventory of create and update flows that write data or initiate a financial transaction. Read and delete operations are intentionally excluded.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search activities..."
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
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="badge-active">Create / update / upsert only</span>
          <span className="badge-inactive" style={{ borderColor: 'rgba(112,161,255,0.35)', color: '#70a1ff' }}>Financial and Stripe-adjacent flows are tagged</span>
          <span className="badge-inactive" style={{ borderColor: 'rgba(255,165,2,0.35)', color: '#ffa502' }}>Mapped feature shows which plan entitlement should govern the flow</span>
        </div>

        {error ? (
          <div className="api-error" style={{ marginBottom: 14 }}>
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading activity inventory...
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #30363d' }}>
            <table className="admin-table" style={{ minWidth: 1120 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 250 }}>Activity</th>
                  <th style={{ minWidth: 140 }}>Operation</th>
                  <th style={{ minWidth: 220 }}>Surface</th>
                  <th style={{ minWidth: 260 }}>Trigger / Route</th>
                  <th style={{ minWidth: 180 }}>Mapped Feature</th>
                  <th style={{ minWidth: 160 }}>Limit</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((item) => {
                  const trigger = getTriggerLabel(item.metadata_json || {});
                  const limit = item.hard_limit_value
                    ? `${item.hard_limit_value} / ${item.hard_limit_scope || 'scope'}`
                    : '—';
                  return (
                    <tr key={item.activity_key}>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <strong style={{ color: '#f5f6fa' }}>{item.name}</strong>
                          <code style={{ fontSize: 12, color: '#a29bfe' }}>{item.activity_key}</code>
                          {item.description ? (
                            <span style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.5 }}>{item.description}</span>
                          ) : null}
                        </div>
                      </td>
                      <td style={{ color: '#c7cfdd', textTransform: 'capitalize' }}>{item.crud_operation || 'create'}</td>
                      <td>{getSurfaceLabel(trigger)}</td>
                      <td>
                        <code style={{ color: '#c7cfdd', fontSize: 12 }}>{trigger}</code>
                      </td>
                      <td>
                        {item.feature_key ? (
                          <code style={{ color: '#70a1ff' }}>{item.feature_key}</code>
                        ) : (
                          <span style={{ color: '#8b949e' }}>Unmapped</span>
                        )}
                      </td>
                      <td>{limit}</td>
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
