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
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', rule_file: '', primary_houses: '', primary_planets: '', display_order: 0 });
  const [saving, setSaving] = useState(false);
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

  const openAdd = () => {
    setEditingArea(null);
    setFormData({ name: '', description: '', rule_file: '', primary_houses: '', primary_planets: '', display_order: 0 });
    setError('');
    setShowModal(true);
  };

  const openEdit = (area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description || '',
      rule_file: area.rule_file || '',
      primary_houses: area.primary_houses ? area.primary_houses.join(', ') : '',
      primary_planets: area.primary_planets ? area.primary_planets.join(', ') : '',
      display_order: area.display_order,
    });
    setError('');
    setShowModal(true);
  };

  const parseHouses = (str) => str ? str.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean) : null;
  const parsePlanets = (str) => str ? str.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        theme_id: themeId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        rule_file: formData.rule_file.trim() || null,
        primary_houses: parseHouses(formData.primary_houses),
        primary_planets: parsePlanets(formData.primary_planets),
        display_order: Number(formData.display_order) || 0,
      };
      if (editingArea) {
        const { theme_id: _, ...updateBody } = body;
        await api.put(`/v1/admin/taxonomy/life-areas/${editingArea.id}`, updateBody);
        setToast({ type: 'success', msg: 'Life area updated!' });
      } else {
        await api.post('/v1/admin/taxonomy/life-areas', body);
        setToast({ type: 'success', msg: 'Life area created!' });
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            <button className="btn-admin-add" onClick={openAdd}>
              <i className="fas fa-plus"></i> Add Life Area
            </button>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading life areas...</p></div>
          ) : areas.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-folder-open"></i><p>No life areas yet. Add one to get started.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rule File</th>
                  <th>Houses</th>
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
                    <td>{area.question_count}</td>
                    <td>
                      {area.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>
                      }
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => openEdit(area)}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="admin-modal-content">
            <h2>{editingArea ? 'Edit Life Area' : 'Add Life Area'}</h2>
            <div className="form-group">
              <label>Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Job Loss / Break / Layoff" maxLength={200} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div className="form-group">
              <label>Rule File Path</label>
              <input type="text" value={formData.rule_file} onChange={(e) => setFormData({ ...formData, rule_file: e.target.value })} placeholder="career/job_loss.json" />
            </div>
            <div className="form-group">
              <label>Primary Houses (comma-separated)</label>
              <input type="text" value={formData.primary_houses} onChange={(e) => setFormData({ ...formData, primary_houses: e.target.value })} placeholder="6, 10, 11" />
            </div>
            <div className="form-group">
              <label>Primary Planets (comma-separated)</label>
              <input type="text" value={formData.primary_planets} onChange={(e) => setFormData({ ...formData, primary_planets: e.target.value })} placeholder="Sun, Saturn, Rahu" />
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
