/**
 * AdminWizardContentPage — CRUD table for wizard step content.
 * Filterable by category, step number, theme, life area.
 */
import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { useStyles } from '../../context/StyleContext';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'A', label: 'A — Chart Reading' },
  { value: 'B', label: 'B — Compatibility' },
  { value: 'C', label: 'C — Family Harmony' },
  { value: 'D', label: 'D — Muhurta' },
  { value: 'E', label: 'E — Prashna' },
  { value: 'F', label: 'F — Varshaphal' },
];

const EMPTY_FORM = {
  consultation_category: '',
  step_number: 0,
  field_key: '',
  label: '',
  help_text: '',
  image_url: '',
  video_url: '',
  tooltip: '',
  display_order: 0,
  is_active: true,
};

export default function AdminWizardContentPage() {
  const { getStyle, getOverride } = useStyles('admin-wizard-content');
  const [rows, setRows] = useState([]);
  const [themes, setThemes] = useState([]);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [filterStep, setFilterStep] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewForm, setPreviewForm] = useState({
    consultation_category: 'A',
    step_number: 0,
    theme_id: '',
    life_area_id: '',
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/v1/admin/wizard-content?include_inactive=true';
      if (filterCat) url += `&consultation_category=${filterCat}`;
      if (filterStep !== '') url += `&step_number=${filterStep}`;
      const data = await api.get(url);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterStep]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  useEffect(() => {
    api
      .get('/v1/admin/taxonomy/themes?include_inactive=true')
      .then((data) => {
        const nextThemes = Array.isArray(data) ? data : [];
        setThemes(nextThemes);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const activeThemeId = previewForm.theme_id;
    if (!activeThemeId) {
      setLifeAreas([]);
      setPreviewForm((prev) => ({ ...prev, life_area_id: '' }));
      return;
    }

    api
      .get(`/v1/admin/taxonomy/themes/${activeThemeId}/life-areas?include_inactive=true`)
      .then((data) => {
        const nextAreas = Array.isArray(data) ? data : [];
        setLifeAreas(nextAreas);
        setPreviewForm((prev) => {
          if (!prev.life_area_id) return prev;
          const stillExists = nextAreas.some((area) => area.id === prev.life_area_id);
          return stillExists ? prev : { ...prev, life_area_id: '' };
        });
      })
      .catch(() => {
        setLifeAreas([]);
      });
  }, [previewForm.theme_id]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, consultation_category: filterCat });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      consultation_category: row.consultation_category || '',
      step_number: row.step_number,
      field_key: row.field_key || '',
      label: row.label || '',
      help_text: row.help_text || '',
      image_url: row.image_url || '',
      video_url: row.video_url || '',
      tooltip: row.tooltip || '',
      display_order: row.display_order || 0,
      is_active: row.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setError(null);
    try {
      const payload = { ...form };
      if (!payload.consultation_category) payload.consultation_category = null;
      if (!payload.field_key) payload.field_key = null;
      if (editingId) {
        await api.put(`/v1/admin/wizard-content/${editingId}`, payload);
      } else {
        await api.post('/v1/admin/wizard-content', payload);
      }
      setShowModal(false);
      fetchContent();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/v1/admin/wizard-content/${id}`);
      fetchContent();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreviewField = (field, value) => {
    setPreviewForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'theme_id' ? { life_area_id: '' } : {}),
    }));
  };

  const handleLoadPreview = async () => {
    if (!previewForm.consultation_category || previewForm.step_number === '') {
      setPreviewError('Select a category and step number before loading the preview.');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const query = new URLSearchParams();
      if (previewForm.theme_id) query.set('theme_id', previewForm.theme_id);
      if (previewForm.life_area_id) query.set('life_area_id', previewForm.life_area_id);
      const queryString = query.toString();
      const url = `/v1/admin/wizard-content/preview/${previewForm.consultation_category}/${previewForm.step_number}${queryString ? `?${queryString}` : ''}`;
      const data = await api.get(url);
      setPreviewData(data);
    } catch (err) {
      setPreviewError(err.message);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <PageShell active="admin">
      <div className="admin-page">
        <div className="admin-header">
          <h1><i className="fas fa-photo-video"></i> Wizard Step Content</h1>
          <p>Manage labels, help text, images and videos for each wizard step.</p>
        </div>

        <div className="admin-toolbar">
          <select className="filter-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            className="search-input"
            type="number"
            placeholder="Step #"
            value={filterStep}
            onChange={(e) => setFilterStep(e.target.value)}
            style={{ width: '100px' }}
          />
          <button className="btn-admin-add" onClick={openCreate}>
            <i className="fas fa-plus"></i> Add Content
          </button>
        </div>

        <section
          style={{
            marginBottom: '1.5rem',
            padding: '1.2rem',
            borderRadius: '18px',
            border: '1px solid rgba(123, 91, 255, 0.2)',
            background: 'rgba(20, 24, 38, 0.72)',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.35rem', color: '#f0ebff' }}>
              <i className="fas fa-eye" style={{ marginRight: '0.5rem', color: '#8d6bff' }}></i>
              Preview Resolved Wizard Content
            </h3>
            <p style={{ margin: 0, color: '#a8a2bc' }}>
              Simulate the content cascade the end user sees for a category, step, theme, and life area combination.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
            <div className="wiz-field">
              <label className="wiz-label">Category</label>
              <select
                className="wiz-select"
                aria-label="Preview Category"
                value={previewForm.consultation_category}
                onChange={(e) => handlePreviewField('consultation_category', e.target.value)}
              >
                {CATEGORIES.slice(1).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="wiz-field">
              <label className="wiz-label">Step #</label>
              <input
                className="wiz-input"
                type="number"
                aria-label="Preview Step Number"
                value={previewForm.step_number}
                onChange={(e) => handlePreviewField('step_number', e.target.value)}
              />
            </div>
            <div className="wiz-field">
              <label className="wiz-label">Theme</label>
              <select
                className="wiz-select"
                aria-label="Preview Theme"
                value={previewForm.theme_id}
                onChange={(e) => handlePreviewField('theme_id', e.target.value)}
              >
                <option value="">All themes</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                ))}
              </select>
            </div>
            <div className="wiz-field">
              <label className="wiz-label">Life Area</label>
              <select
                className="wiz-select"
                aria-label="Preview Life Area"
                value={previewForm.life_area_id}
                onChange={(e) => handlePreviewField('life_area_id', e.target.value)}
                disabled={!previewForm.theme_id || lifeAreas.length === 0}
              >
                <option value="">All life areas</option>
                {lifeAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
            <button className="btn-admin-add" onClick={handleLoadPreview} disabled={previewLoading}>
              <i className={`fas ${previewLoading ? 'fa-spinner fa-spin' : 'fa-bolt'}`}></i>
              {previewLoading ? ' Loading Preview' : ' Load Preview'}
            </button>
          </div>

          {previewError && <div className="wiz-error" style={{ marginTop: '1rem' }}>{previewError}</div>}

          {previewData && (
            <div
              style={{
                marginTop: '1rem',
                borderRadius: '16px',
                border: '1px solid rgba(90, 102, 148, 0.28)',
                background: 'rgba(12, 16, 28, 0.68)',
                padding: '1rem',
              }}
            >
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ color: '#f2eeff', fontWeight: 700, marginBottom: '0.3rem' }}>
                  {previewData.step_label || 'No step-level label override'}
                </div>
                <div style={{ color: '#bdb7cf', lineHeight: 1.6 }}>
                  {previewData.step_help || 'No step-level help text override resolved for this combination.'}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {Object.keys(previewData.fields || {}).length === 0 ? (
                  <div style={{ color: '#918ba7' }}>No field-level overrides resolved for this combination.</div>
                ) : (
                  Object.entries(previewData.fields || {}).map(([fieldKey, field]) => (
                    <div
                      key={fieldKey}
                      style={{
                        borderRadius: '14px',
                        border: '1px solid rgba(93, 104, 146, 0.22)',
                        background: 'rgba(20, 24, 39, 0.92)',
                        padding: '0.9rem 1rem',
                      }}
                    >
                      <div style={{ color: '#cbbcff', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {fieldKey}
                      </div>
                      {field.label && <div style={{ color: '#f3efff', marginBottom: '0.25rem' }}>Label: {field.label}</div>}
                      {field.help_text && <div style={{ color: '#b8b2cb', marginBottom: '0.25rem' }}>Help: {field.help_text}</div>}
                      {field.tooltip && <div style={{ color: '#b8b2cb', marginBottom: '0.25rem' }}>Tooltip: {field.tooltip}</div>}
                      {(field.image_url || field.video_url) && (
                        <div style={{ color: '#8fd2ff' }}>
                          {field.image_url && <span style={{ marginRight: '1rem' }}>Image: {field.image_url}</span>}
                          {field.video_url && <span>Video: {field.video_url}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {error && <div className="wiz-error" style={{ margin: '1rem 0' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c7cfdd' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Cat</th>
                  <th>Step</th>
                  <th>Field</th>
                  <th>Label</th>
                  <th>Media</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ opacity: row.is_active ? 1 : 0.5 }}>
                    <td>{row.consultation_category || '*'}</td>
                    <td>{row.step_number}</td>
                    <td>{row.field_key || '(step-level)'}</td>
                    <td>{row.label || '—'}</td>
                    <td>
                      {row.image_url && <i className="fas fa-image" title="Has image" style={{ color: '#7b5bff', marginRight: '0.3rem' }}></i>}
                      {row.video_url && <i className="fas fa-video" title="Has video" style={{ color: '#2ed573' }}></i>}
                      {!row.image_url && !row.video_url && '—'}
                    </td>
                    <td>{row.is_active ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="btn-admin-edit" onClick={() => openEdit(row)} style={{ marginRight: '0.4rem' }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="btn-admin-delete" onClick={() => handleDelete(row.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No content found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="wiz-resume-overlay" onClick={() => setShowModal(false)}>
            <div className="wiz-resume-modal" style={{ maxWidth: '540px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
              <h3>{editingId ? 'Edit Step Content' : 'Create Step Content'}</h3>
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                <div className="wiz-row">
                  <div className="wiz-field">
                    <label className="wiz-label">Category</label>
                    <select className="wiz-select" value={form.consultation_category} onChange={(e) => handleField('consultation_category', e.target.value)}>
                      <option value="">All categories</option>
                      {CATEGORIES.slice(1).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="wiz-field">
                    <label className="wiz-label">Step #</label>
                    <input className="wiz-input" type="number" value={form.step_number} onChange={(e) => handleField('step_number', Number(e.target.value))} />
                  </div>
                </div>
                <div className="wiz-field">
                  <label className="wiz-label">Field Key</label>
                  <input className="wiz-input" value={form.field_key} onChange={(e) => handleField('field_key', e.target.value)} placeholder="Leave empty for step-level" />
                </div>
                <div className="wiz-field">
                  <label className="wiz-label">Label</label>
                  <input className="wiz-input" value={form.label} onChange={(e) => handleField('label', e.target.value)} />
                </div>
                <div className="wiz-field">
                  <label className="wiz-label">Help Text (Markdown)</label>
                  <textarea className="wiz-textarea" value={form.help_text} onChange={(e) => handleField('help_text', e.target.value)} rows={3} />
                </div>
                <div className="wiz-row">
                  <div className="wiz-field">
                    <label className="wiz-label">Image URL</label>
                    <input className="wiz-input" value={form.image_url} onChange={(e) => handleField('image_url', e.target.value)} />
                  </div>
                  <div className="wiz-field">
                    <label className="wiz-label">Video URL</label>
                    <input className="wiz-input" value={form.video_url} onChange={(e) => handleField('video_url', e.target.value)} />
                  </div>
                </div>
                <div className="wiz-field">
                  <label className="wiz-label">Tooltip</label>
                  <input className="wiz-input" value={form.tooltip} onChange={(e) => handleField('tooltip', e.target.value)} />
                </div>
                <div className="wiz-row">
                  <div className="wiz-field">
                    <label className="wiz-label">Display Order</label>
                    <input className="wiz-input" type="number" value={form.display_order} onChange={(e) => handleField('display_order', Number(e.target.value))} />
                  </div>
                  <div className="wiz-field">
                    <label className="wiz-label">Active</label>
                    <select className="wiz-select" value={form.is_active ? 'true' : 'false'} onChange={(e) => handleField('is_active', e.target.value === 'true')}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button className="wiz-btn wiz-btn-prev" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="wiz-btn wiz-btn-next" onClick={handleSave}>
                  <i className="fas fa-save"></i> {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
