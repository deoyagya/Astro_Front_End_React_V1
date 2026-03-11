import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';
import { useStyles } from '../../context/StyleContext';

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

export default function AdminThemeFormPage() {
  const { getOverride } = useStyles('admin-themes');
  const { themeId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(themeId);

  const [theme, setTheme] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'fa-star' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadTheme = useCallback(async () => {
    if (!themeId) return;
    try {
      setLoading(true);
      const themes = await api.get('/v1/admin/taxonomy/themes?include_inactive=true');
      const found = themes.find((t) => t.id === themeId);
      if (found) {
        setTheme(found);
        setFormData({
          name: found.name,
          description: found.description || '',
          icon: found.icon || 'fa-star',
        });
      } else {
        setError('Theme not found.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [themeId]);

  useEffect(() => { loadTheme(); }, [loadTheme]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => { setToast(null); navigate('/admin/themes'); }, 1500);
      return () => clearTimeout(t);
    }
  }, [toast, navigate]);

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
      if (isEdit) {
        await api.put(`/v1/admin/taxonomy/themes/${themeId}`, body);
        setToast({ type: 'success', msg: 'Theme updated!' });
      } else {
        await api.post('/v1/admin/taxonomy/themes', body);
        setToast({ type: 'success', msg: 'Theme created!' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-breadcrumb">
            <Link to="/admin/themes">Themes</Link>
            <span className="sep">/</span>
            <span>{isEdit ? 'Edit' : 'Add'}</span>
          </div>

          <div className="admin-header">
            <h1><i className={`fas ${isEdit ? 'fa-edit' : 'fa-plus-circle'}`}></i> {isEdit ? 'Edit Theme' : 'Add Core Theme'}</h1>
            <p>{isEdit ? `Editing "${theme?.name || '...'}"` : 'Create a new top-level taxonomy theme'}</p>
          </div>

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading theme...</p></div>
          ) : (
            <div className="admin-form-page">
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
                  <select value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })}>
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
                    ))}
                  </select>
                  <div className="icon-preview"><i className={`fas ${formData.icon}`}></i></div>
                </div>
              </div>
              {isEdit && theme && (
                <>
                  <div className="form-group">
                    <label>Domain ID</label>
                    <div className="readonly-field">{theme.domain_id || 'Auto-assigned'}</div>
                  </div>
                  <div className="form-group">
                    <label>Display Order</label>
                    <div className="readonly-field">{theme.display_order}</div>
                  </div>
                </>
              )}
              {error && <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>}
              <div className="admin-modal-actions">
                <button className="btn-modal-cancel" onClick={() => navigate('/admin/themes')}>Cancel</button>
                <button className="btn-modal-save" onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-check"></i> Save</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
