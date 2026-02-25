import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminLifeAreasPage() {
  const { themeId } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [themes, areasData] = await Promise.all([
        api.get('/v1/admin/taxonomy/themes?include_inactive=true'),
        api.get(`/v1/admin/taxonomy/themes/${themeId}/life-areas?include_inactive=true`),
      ]);
      setTheme(themes.find((t) => t.id === themeId) || null);
      setAreas(areasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [themeId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const handleDelete = async (area) => {
    try {
      await api.del(`/v1/admin/taxonomy/life-areas/${area.id}`);
      setConfirmDelete(null);
      setToast({ type: 'success', msg: 'Life area deleted!' });
      loadData();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
      setConfirmDelete(null);
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-breadcrumb">
            <Link to="/admin/themes">Themes</Link>
            <span className="sep">/</span>
            <span>{theme?.name || 'Loading...'}</span>
            <span className="sep">/</span>
            <span>Life Areas</span>
          </div>

          <div className="admin-header">
            <h1><i className="fas fa-sitemap"></i> Life Areas {theme ? `— ${theme.name}` : ''}</h1>
            <p>Manage sub-domains under this core theme</p>
          </div>

          <div className="admin-toolbar">
            <div></div>
            <button className="btn-admin-add" onClick={() => navigate(`/admin/themes/${themeId}/life-areas/add`)}>
              <i className="fas fa-plus"></i> Add Life Area
            </button>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading life areas...</p></div>
          ) : error ? (
            <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>
          ) : areas.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-folder-open"></i><p>No life areas yet. Add one to get started.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rule File</th>
                  <th>Houses</th>
                  <th>Charts</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.id} className={!area.is_active ? 'deleted-row' : ''}>
                    <td>
                      <strong>{area.name}</strong>
                      {area.description && <div style={{ color: '#8a8f9d', fontSize: '0.85rem' }}>{area.description}</div>}
                    </td>
                    <td style={{ color: '#8a8f9d', fontSize: '0.85rem' }}>{area.rule_file || '—'}</td>
                    <td style={{ color: '#9d7bff' }}>{area.primary_houses?.join(', ') || '—'}</td>
                    <td style={{ color: '#9d7bff', fontSize: '0.85rem' }}>{area.divisional_charts?.join(', ') || '—'}</td>
                    <td>{area.question_count}</td>
                    <td>
                      {area.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>
                      }
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => navigate(`/admin/themes/${themeId}/life-areas/${area.id}/edit`)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button className="btn-delete" onClick={() => setConfirmDelete(area)}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 450 }}>
            <h2>Delete Life Area</h2>
            <div className="confirm-warning">
              <p><strong>Warning:</strong> Deleting &quot;{confirmDelete.name}&quot; will also soft-delete all its child questions. Existing reports are preserved.</p>
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
