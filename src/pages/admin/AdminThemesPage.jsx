import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';
import { useStyles } from '../../context/StyleContext';

export default function AdminThemesPage() {
  const { getStyle, getOverride } = useStyles('admin-themes');
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadThemes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/v1/admin/taxonomy/themes?include_inactive=true');
      setThemes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadThemes(); }, [loadThemes]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDelete = async (theme) => {
    try {
      await api.del(`/v1/admin/taxonomy/themes/${theme.id}`);
      setConfirmDelete(null);
      setToast({ type: 'success', msg: 'Theme deleted!' });
      loadThemes();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
      setConfirmDelete(null);
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <h1><i className="fas fa-layer-group"></i> Core Themes</h1>
            <p>Manage top-level taxonomy categories for Vedic astrology predictions</p>
          </div>

          <div className="admin-toolbar">
            <div></div>
            <button className="btn-admin-add" onClick={() => navigate('/admin/themes/add')}>
              <i className="fas fa-plus"></i> Add Core Theme
            </button>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading themes...</p></div>
          ) : error ? (
            <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>
          ) : themes.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-folder-open"></i><p>No themes found. Create your first core theme.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Icon</th>
                  <th>Domain ID</th>
                  <th>Life Areas</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {themes.map((theme) => (
                  <tr key={theme.id} className={!theme.is_active ? 'deleted-row' : ''}>
                    <td style={{ color: '#a0a8b8' }}>{theme.display_order}</td>
                    <td>
                      <strong>{theme.name}</strong>
                      {theme.description && <div style={{ color: '#a0a8b8', fontSize: '0.9375rem' }}>{theme.description}</div>}
                    </td>
                    <td><i className={`fas ${theme.icon || 'fa-star'}`} style={{ color: '#9d7bff' }}></i></td>
                    <td>{theme.domain_id || '—'}</td>
                    <td>
                      <button
                        style={{ background: 'none', border: 'none', color: '#b794ff', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/admin/themes/${theme.id}/life-areas`)}
                      >
                        {theme.life_area_count} areas
                      </button>
                    </td>
                    <td>
                      {theme.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>
                      }
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => navigate(`/admin/themes/${theme.id}/edit`)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button className="btn-delete" onClick={() => setConfirmDelete(theme)}>
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
            <h2>Delete Theme</h2>
            <div className="confirm-warning">
              <p><strong>Warning:</strong> Deleting &quot;{confirmDelete.name}&quot; will also soft-delete all its child life areas and questions.</p>
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
