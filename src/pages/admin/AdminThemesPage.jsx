import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

// Curated icon list for Vedic astrology themes
const ICON_OPTIONS = [
  { value: 'fa-star',           label: 'General / Default' },
  { value: 'fa-briefcase',      label: 'Career' },
  { value: 'fa-heart',          label: 'Love & Marriage' },
  { value: 'fa-coins',          label: 'Wealth & Money' },
  { value: 'fa-user',           label: 'Self & Body' },
  { value: 'fa-graduation-cap', label: 'Education' },
  { value: 'fa-baby',           label: 'Children' },
  { value: 'fa-home',           label: 'Home & Property' },
  { value: 'fa-heartbeat',      label: 'Health' },
  { value: 'fa-pray',           label: 'Spirituality' },
  { value: 'fa-users',          label: 'Family' },
  { value: 'fa-gavel',          label: 'Legal & Justice' },
  { value: 'fa-plane',          label: 'Travel' },
  { value: 'fa-handshake',      label: 'Partnerships' },
  { value: 'fa-shield-alt',     label: 'Protection' },
  { value: 'fa-brain',          label: 'Mind & Intelligence' },
  { value: 'fa-om',             label: 'Dharma' },
  { value: 'fa-eye',            label: 'Mysticism' },
  { value: 'fa-crown',          label: 'Authority & Power' },
  { value: 'fa-bolt',           label: 'Energy & Action' },
  { value: 'fa-moon',           label: 'Emotions' },
  { value: 'fa-sun',            label: 'Vitality' },
  { value: 'fa-compass',        label: 'Direction' },
  { value: 'fa-gem',            label: 'Luxury & Beauty' },
  { value: 'fa-scroll',         label: 'Tradition' },
];

export default function AdminThemesPage() {
  const navigate = useNavigate();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'fa-star' });
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
    setFormData({ name: '', description: '', icon: 'fa-star' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      description: theme.description || '',
      icon: theme.icon || 'fa-star',
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
        icon: formData.icon || null,
      };
      if (editingTheme) {
        await api.put(`/v1/admin/taxonomy/themes/${editingTheme.id}`, body);
        setToast({ type: 'success', msg: 'Theme updated!' });
      } else {
        // domain_id + display_order are auto-assigned by the backend
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
                    <td style={{ color: '#8a8f9d' }}>{theme.display_order}</td>
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
              <label>Icon *</label>
              <div className="icon-picker-row">
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
                <div className="icon-preview">
                  <i className={`fas ${formData.icon}`}></i>
                </div>
              </div>
            </div>
            {editingTheme && (
              <div className="form-group">
                <label>Domain ID</label>
                <div className="readonly-field">{editingTheme.domain_id || 'Auto-assigned'}</div>
              </div>
            )}
            {editingTheme && (
              <div className="form-group">
                <label>Display Order</label>
                <div className="readonly-field">{editingTheme.display_order}</div>
              </div>
            )}
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
