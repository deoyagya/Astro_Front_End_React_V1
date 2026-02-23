import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminThemesPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'fa-star', domain_id: '', display_order: 0 });
  const [saving, setSaving] = useState(false);
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

  const openAdd = () => {
    setEditingTheme(null);
    setFormData({ name: '', description: '', icon: 'fa-star', domain_id: '', display_order: 0 });
    setError('');
    setShowModal(true);
  };

  const openEdit = (theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      icon: theme.icon || 'fa-star',
      domain_id: theme.domain_id || '',
      display_order: theme.display_order,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
        domain_id: formData.domain_id ? Number(formData.domain_id) : null,
        display_order: Number(formData.display_order) || 0,
      };
      if (editingTheme) {
        await api.put(`/v1/admin/taxonomy/themes/${editingTheme.id}`, body);
        setToast({ type: 'success', msg: 'Theme updated!' });
      } else {
        await api.post('/v1/admin/taxonomy/themes', body);
        setToast({ type: 'success', msg: 'Theme created!' });
      }
      setShowModal(false);
      loadThemes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            <button className="btn-admin-add" onClick={openAdd}>
              <i className="fas fa-plus"></i> Add Core Theme
            </button>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading themes...</p></div>
          ) : themes.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-folder-open"></i><p>No themes found. Create your first core theme.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
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
                    <td>
                      <strong>{theme.name}</strong>
                      {theme.description && <div style={{ color: '#8a8f9d', fontSize: '0.85rem' }}>{theme.description}</div>}
                    </td>
                    <td><i className={`fas ${theme.icon || 'fa-star'}`} style={{ color: '#9d7bff' }}></i></td>
                    <td>{theme.domain_id || '—'}</td>
                    <td>
                      <button
                        style={{ background: 'none', border: 'none', color: '#9d7bff', cursor: 'pointer', textDecoration: 'underline' }}
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
                        <button className="btn-edit" onClick={() => openEdit(theme)}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="admin-modal-content">
            <h2>{editingTheme ? 'Edit Theme' : 'Add Core Theme'}</h2>
            <div className="form-group">
              <label>Theme Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Career & Profession" maxLength={150} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div className="form-group">
              <label>Icon (FontAwesome class)</label>
              <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="fa-briefcase" />
            </div>
            <div className="form-group">
              <label>Domain ID (legacy mapping)</label>
              <input type="number" value={formData.domain_id} onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })} placeholder="e.g., 100, 200" />
            </div>
            <div className="form-group">
              <label>Display Order</label>
              <input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} />
            </div>
            {error && <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>}
            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-modal-save" onClick={handleSave} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Toast */}
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
