import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';

const SLOT_OPTIONS = [
  { value: '', label: 'All slots' },
  { value: 'generator', label: 'Primary Generator' },
  { value: 'reviewer', label: 'Primary Reviewer' },
  { value: 'cv_producer', label: 'Cross-Validation Producer' },
  { value: 'cv_reviewer', label: 'Cross-Validation Reviewer' },
];

export default function AdminAISettingsAuditPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slotKey, setSlotKey] = useState('');

  const fetchAuditLogs = useCallback(async (nextSlotKey = slotKey) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ limit: '100' });
      if (nextSlotKey) query.set('slot_key', nextSlotKey);
      const data = await api.get(`/v1/admin/ai-settings/audit-logs?${query.toString()}`);
      setPayload(data);
    } catch (err) {
      setError(err.message || 'Failed to load AI settings audit logs.');
    } finally {
      setLoading(false);
    }
  }, [slotKey]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1><i className="fas fa-shield-alt" style={{ marginRight: 10 }}></i>AI Settings Audit Log</h1>
            <p>Review who changed AI key settings, when the change happened, and which encryption posture was active.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link className="btn-admin-add" to="/admin/ai-settings">
              <i className="fas fa-arrow-left"></i> Back to AI Settings
            </Link>
            <button className="btn-admin-add" type="button" onClick={() => fetchAuditLogs()} disabled={loading}>
              <i className="fas fa-rotate"></i> Refresh
            </button>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            color: '#c7cfdd',
          }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: '#dce3f0', fontWeight: 600 }}>Slot filter</span>
              <select
                value={slotKey}
                onChange={(e) => {
                  const next = e.target.value;
                  setSlotKey(next);
                  fetchAuditLogs(next);
                }}
                style={{
                  minWidth: 240,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #2a2f3e',
                  background: 'rgba(40,44,60,0.8)',
                  color: '#fff',
                }}
              >
                {SLOT_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <div style={{ color: '#a9b3c7' }}>
              Backend:
              <strong style={{ marginLeft: 8, color: '#fff' }}>
                {payload?.storage_policy?.encryption_backend || 'local'}
              </strong>
              {payload?.storage_policy?.encryption_key_reference && (
                <span style={{ marginLeft: 12 }}>
                  Ref: <code style={{ color: '#f472b6' }}>{payload.storage_policy.encryption_key_reference}</code>
                </span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="admin-toast error" style={{ position: 'static', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {!payload?.db_storage_ready && (
          <div className="admin-toast error" style={{ position: 'static', marginBottom: 20 }}>
            Audit-log storage is not ready in this environment yet.
          </div>
        )}

        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading AI settings audit log...</p>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(26,31,46,0.92)',
              border: '1px solid #2a2f3e',
              borderRadius: 18,
              padding: 24,
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e6edf7' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #2a2f3e' }}>
                  <th style={{ padding: '10px 8px' }}>Time</th>
                  <th style={{ padding: '10px 8px' }}>Slot</th>
                  <th style={{ padding: '10px 8px' }}>Provider / Model</th>
                  <th style={{ padding: '10px 8px' }}>Actor</th>
                  <th style={{ padding: '10px 8px' }}>IP</th>
                  <th style={{ padding: '10px 8px' }}>Key action</th>
                  <th style={{ padding: '10px 8px' }}>Encryption</th>
                </tr>
              </thead>
              <tbody>
                {(payload?.items || []).map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>{new Date(item.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>{item.slot_key}</td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                      <div>{item.provider}</div>
                      <div style={{ color: '#a9b3c7', marginTop: 4 }}>{item.model}</div>
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                      <div>{item.actor_name || item.actor_email || item.actor_user_id || 'Unknown admin'}</div>
                      {item.actor_email && item.actor_name && (
                        <div style={{ color: '#a9b3c7', marginTop: 4 }}>{item.actor_email}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>{item.actor_ip || 'n/a'}</td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                      {item.key_cleared ? 'Cleared saved key' : item.key_replaced ? 'Replaced saved key' : 'Config update only'}
                    </td>
                    <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                      {item.used_dedicated_encryption ? 'Dedicated encryption' : 'Fallback encryption'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!payload?.items?.length && (
              <div style={{ paddingTop: 20, color: '#a9b3c7' }}>
                No AI settings audit log entries found for the current filter.
              </div>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
