import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';
import { useStyles } from '../../context/StyleContext';

export default function AdminReportsPage() {
  const { getStyle, getOverride } = useStyles('admin-reports');
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const params = includeInactive ? '?include_inactive=true' : '';
      const data = await api.get(`/v1/admin/report-configs/${params}`);
      setConfigs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async (config) => {
    try {
      await api.del(`/v1/admin/report-configs/${config.id}`);
      setConfirmDelete(null);
      setToast({ type: 'success', msg: `Report ${config.report_id_display} deleted!` });
      loadConfigs();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
      setConfirmDelete(null);
    }
  };

  const formatCost = (cents) => {
    if (cents == null) return '—';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-breadcrumb">
            <a href="/admin/themes" onClick={(e) => { e.preventDefault(); navigate('/admin/themes'); }}>Themes</a>
            <span className="sep">/</span>
            <span>Reports</span>
          </div>

          <div className="admin-header">
            <h1><i className="fas fa-file-invoice"></i> Report Configurations</h1>
            <p>Create and manage custom report templates with pricing and LLM settings</p>
          </div>

          <div className="admin-toolbar">
            <label style={{ color: '#c7cfdd', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
              <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
              Show inactive
            </label>
            <button className="btn-admin-add" onClick={() => navigate('/admin/reports/create')}>
              <i className="fas fa-plus"></i> Create New Report
            </button>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading report configs...</p></div>
          ) : error ? (
            <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>
          ) : configs.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-file-invoice"></i><p>No report configurations yet. Create your first report template.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Name</th>
                  <th>Questions</th>
                  <th>Pricing</th>
                  <th>Total Cost</th>
                  <th>LLM</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr key={config.id} className={!config.is_active ? 'deleted-row' : ''}>
                    <td style={{ fontWeight: 600, color: '#b794ff', whiteSpace: 'nowrap' }}>{config.report_id_display}</td>
                    <td>
                      <strong>{config.name}</strong>
                      {config.description && <div style={{ color: '#a0a8b8', fontSize: '0.9375rem' }}>{config.description.substring(0, 80)}{config.description.length > 80 ? '...' : ''}</div>}
                    </td>
                    <td style={{ textAlign: 'center' }}>{config.question_count}</td>
                    <td>
                      <span style={{ color: config.pricing_mode === 'fixed' ? '#ffa502' : '#2ed573', fontSize: '0.9375rem' }}>
                        {config.pricing_mode === 'fixed' ? 'Fixed' : 'Variable'}
                      </span>
                      {config.discount_mode && (
                        <div style={{ color: '#ff4757', fontSize: '0.875rem' }}>
                          {config.discount_mode === 'percentage' ? `${config.discount_value}% off` : `$${(config.discount_value / 100).toFixed(2)} off`}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCost(config.total_cost_cents)}</td>
                    <td style={{ fontSize: '0.9375rem', color: '#c7cfdd' }}>
                      <div>{config.creator_model}</div>
                      <div style={{ color: '#a0a8b8', fontSize: '0.875rem' }}>+ {config.reviewer_model}</div>
                    </td>
                    <td>
                      {config.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>
                      }
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => navigate(`/admin/reports/${config.id}/edit`)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        {config.is_active && (
                          <button className="btn-delete" onClick={() => setConfirmDelete(config)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ color: '#a0a8b8', fontSize: '0.9375rem', marginTop: 10 }}>{configs.length} report(s) found</p>
        </div>
      </section>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 450 }}>
            <h2>Delete Report Config</h2>
            <div className="confirm-warning">
              <p><strong>Warning:</strong> Report &quot;{confirmDelete.report_id_display} — {confirmDelete.name}&quot; will be marked as inactive.</p>
            </div>
            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-delete" style={{ padding: '10px 20px', fontSize: '0.95rem' }} onClick={() => handleDelete(confirmDelete)}>
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
