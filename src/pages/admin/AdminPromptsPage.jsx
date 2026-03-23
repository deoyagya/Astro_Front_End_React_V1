import { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';
import { useStyles } from '../../context/StyleContext';

// Category labels
const CATEGORY_LABELS = {
  system_prompt: 'System Prompt',
  user_template: 'User Template',
};

// Icon per prompt type
const TYPE_ICONS = {
  generator_system: 'fa-wand-magic-sparkles',
  reviewer_system: 'fa-magnifying-glass-chart',
  translator_system: 'fa-language',
  generation_v1: 'fa-file-lines',
  generation_v2: 'fa-file-code',
  generation_v3: 'fa-file-shield',
  review: 'fa-clipboard-check',
  revision: 'fa-pen-to-square',
  translation_batch: 'fa-globe',
  sade_sati_generator_system: 'fa-moon-stars',
  sade_sati_reviewer_system: 'fa-shield-halved',
  sade_sati_generation: 'fa-scroll',
  sade_sati_review: 'fa-list-check',
  sade_sati_revision: 'fa-pen-ruler',
  education_report_generator_system: 'fa-graduation-cap',
  education_report_reviewer_system: 'fa-school-circle-check',
  education_report_generation: 'fa-book-open-reader',
  education_report_review: 'fa-square-poll-vertical',
  education_report_revision: 'fa-pencil',
  health_report_generator_system: 'fa-heart-pulse',
  health_report_reviewer_system: 'fa-user-doctor',
  health_report_generation: 'fa-notes-medical',
  health_report_review: 'fa-file-medical',
  health_report_revision: 'fa-stethoscope',
  foreign_report_generator_system: 'fa-plane-departure',
  foreign_report_reviewer_system: 'fa-passport',
  foreign_report_generation: 'fa-earth-asia',
  foreign_report_review: 'fa-route',
  foreign_report_revision: 'fa-globe',
  family_report_generator_system: 'fa-people-roof',
  family_report_reviewer_system: 'fa-baby',
  family_report_generation: 'fa-house-chimney-user',
  family_report_review: 'fa-clipboard-list',
  family_report_revision: 'fa-seedling',
  marriage_report_generator_system: 'fa-ring',
  marriage_report_reviewer_system: 'fa-shield-heart',
  marriage_report_generation: 'fa-file-signature',
  marriage_report_review: 'fa-clipboard-question',
  marriage_report_revision: 'fa-pen-fancy',
};

export default function AdminPromptsPage() {
  const { getStyle, getOverride } = useStyles('admin-prompts');
  // --- State ---
  const [prompts, setPrompts] = useState([]);
  const [typeInfo, setTypeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modals
  const [editModal, setEditModal] = useState(null); // null | { mode: 'create' | 'edit', data: {...} }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [cloneModal, setCloneModal] = useState(null); // null | { source: prompt }
  const [previewModal, setPreviewModal] = useState(null); // null | { raw, rendered, type, version }
  const [saving, setSaving] = useState(false);

  // --- Data Loading ---
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterType) params.set('prompt_type', filterType);
      if (showInactive) params.set('include_inactive', 'true');
      const qs = params.toString();
      const data = await api.get(`/v1/admin/prompts${qs ? `?${qs}` : ''}`);
      setPrompts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterType, showInactive]);

  const loadTypeInfo = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/prompts/types');
      setTypeInfo(data);
    } catch {
      // Non-critical — UI still works
    }
  }, []);

  useEffect(() => { loadPrompts(); }, [loadPrompts]);
  useEffect(() => { loadTypeInfo(); }, [loadTypeInfo]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- Handlers ---

  const handleRefreshCache = async () => {
    try {
      const result = await api.postEmpty('/v1/admin/prompts/refresh-cache');
      setToast({ type: 'success', msg: `Cache refreshed: ${result.prompts_loaded} prompts loaded` });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  const handleDelete = async (prompt) => {
    try {
      await api.del(`/v1/admin/prompts/${prompt.id}`);
      setConfirmDelete(null);
      setToast({ type: 'success', msg: 'Prompt deleted' });
      loadPrompts();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
      setConfirmDelete(null);
    }
  };

  const handleActivate = async (prompt) => {
    try {
      await api.postEmpty(`/v1/admin/prompts/${prompt.id}/activate`);
      setToast({ type: 'success', msg: `Activated "${prompt.display_name}" v${prompt.version}` });
      loadPrompts();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      if (editModal.mode === 'create') {
        await api.post('/v1/admin/prompts', editModal.data);
        setToast({ type: 'success', msg: 'Prompt created' });
      } else {
        const { id, ...fields } = editModal.data;
        await api.put(`/v1/admin/prompts/${id}`, fields);
        setToast({ type: 'success', msg: 'Prompt updated' });
      }
      setEditModal(null);
      loadPrompts();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    if (!cloneModal) return;
    setSaving(true);
    try {
      await api.post(`/v1/admin/prompts/${cloneModal.source.id}/clone`, {
        new_version: cloneModal.newVersion,
        scope: cloneModal.scope || null,
        content: cloneModal.content || null,
      });
      setToast({ type: 'success', msg: `Cloned as v${cloneModal.newVersion}` });
      setCloneModal(null);
      loadPrompts();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (prompt) => {
    try {
      const data = await api.get(`/v1/admin/prompts/preview/${prompt.prompt_type}?scope=${encodeURIComponent(prompt.scope)}`);
      setPreviewModal(data);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  const openCreate = () => {
    setEditModal({
      mode: 'create',
      data: {
        category: 'user_template',
        prompt_type: 'generation_v1',
        display_name: '',
        content: '',
        version: '1.0.0',
        scope: 'global',
        is_active: false,
        description: '',
        template_vars: [],
      },
    });
  };

  const openEdit = (prompt) => {
    setEditModal({
      mode: 'edit',
      data: {
        id: prompt.id,
        display_name: prompt.display_name,
        content: prompt.content,
        description: prompt.description || '',
        template_vars: prompt.template_vars || [],
      },
    });
  };

  const openClone = (prompt) => {
    // Suggest next minor version
    const parts = prompt.version.split('.');
    const minor = parseInt(parts[1] || '0', 10) + 1;
    setCloneModal({
      source: prompt,
      newVersion: `${parts[0]}.${minor}.0`,
      scope: '',
      content: '',
    });
  };

  // --- Computed ---
  const typeDetails = typeInfo?.type_details || [];
  const getTypeDesc = (pt) => typeDetails.find((t) => t.prompt_type === pt)?.description || '';

  // --- Render ---
  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          {/* Header */}
          <div className="admin-header">
            <h1><i className="fas fa-robot"></i> Prompt Management</h1>
            <p>Manage LLM system prompts and user templates with versioning and scope overrides</p>
          </div>

          {/* Toolbar */}
          <div className="admin-toolbar">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
              <select
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ minWidth: 160 }}
              >
                <option value="">All Categories</option>
                <option value="system_prompt">System Prompts</option>
                <option value="user_template">User Templates</option>
              </select>

              <select
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ minWidth: 180 }}
              >
                <option value="">All Types</option>
                {(typeInfo?.prompt_types || []).map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c7cfdd', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  style={{ accentColor: '#7b5bff' }}
                />
                Show Inactive
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn-admin-add"
                onClick={handleRefreshCache}
                style={{ background: 'rgba(46, 213, 115, 0.2)', color: '#2ed573' }}
              >
                <i className="fas fa-sync-alt"></i> Refresh Cache
              </button>
              <button className="btn-admin-add" onClick={openCreate}>
                <i className="fas fa-plus"></i> New Prompt
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading prompts...</p></div>
          ) : error ? (
            <div className="api-error"><i className="fas fa-exclamation-circle"></i><p>{error}</p></div>
          ) : prompts.length === 0 ? (
            <div className="admin-empty"><i className="fas fa-robot"></i><p>No prompts found. Adjust filters or create a new prompt.</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Display Name</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((p) => (
                  <tr key={p.id} className={!p.is_active ? 'deleted-row' : ''}>
                    <td>
                      <i className={`fas ${TYPE_ICONS[p.prompt_type] || 'fa-file'}`} style={{ color: '#9d7bff', marginRight: 6 }}></i>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.9375rem' }}>{p.prompt_type}</span>
                    </td>
                    <td>
                      <strong>{p.display_name}</strong>
                      {p.description && (
                        <div style={{ color: '#a0a8b8', fontSize: '0.875rem', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: '0.875rem',
                        background: p.category === 'system_prompt' ? 'rgba(255,165,2,0.15)' : 'rgba(123,91,255,0.15)',
                        color: p.category === 'system_prompt' ? '#ffa502' : '#b794ff',
                      }}>
                        {CATEGORY_LABELS[p.category] || p.category}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9375rem' }}>v{p.version}</td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        color: p.scope === 'global' ? '#c7cfdd' : '#2ed573',
                      }}>
                        {p.scope}
                      </span>
                    </td>
                    <td>
                      {p.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>
                      }
                      {p.deleted_at && <span className="badge-deleted">Deleted</span>}
                    </td>
                    <td>
                      <div className="actions-cell" style={{ flexWrap: 'wrap' }}>
                        <button className="btn-edit" onClick={() => handlePreview(p)} title="Preview rendered">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn-edit" onClick={() => openEdit(p)} title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-edit" onClick={() => openClone(p)} title="Clone version"
                          style={{ background: 'rgba(46,213,115,0.15)', color: '#2ed573' }}
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                        {!p.is_active && !p.deleted_at && (
                          <button className="btn-edit" onClick={() => handleActivate(p)} title="Activate"
                            style={{ background: 'rgba(255,165,2,0.15)', color: '#ffa502' }}
                          >
                            <i className="fas fa-bolt"></i>
                          </button>
                        )}
                        <button className="btn-delete" onClick={() => setConfirmDelete(p)} title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Summary */}
          {!loading && prompts.length > 0 && (
            <div style={{ marginTop: 16, color: '#a0a8b8', fontSize: '0.9375rem' }}>
              Showing {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
              {(filterCategory || filterType) && ' (filtered)'}
            </div>
          )}
        </div>
      </section>

      {/* ---- Create/Edit Modal ---- */}
      {editModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 750, maxHeight: '90vh', overflow: 'auto' }}>
            <h2>{editModal.mode === 'create' ? 'Create New Prompt' : 'Edit Prompt'}</h2>

            {editModal.mode === 'create' && (
              <>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <select
                      value={editModal.data.category}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, category: e.target.value } })}
                    >
                      <option value="system_prompt">System Prompt</option>
                      <option value="user_template">User Template</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Prompt Type</label>
                    <select
                      value={editModal.data.prompt_type}
                      onChange={(e) => {
                        const pt = e.target.value;
                        const detail = typeDetails.find((t) => t.prompt_type === pt);
                        setEditModal({
                          ...editModal,
                          data: {
                            ...editModal.data,
                            prompt_type: pt,
                            category: detail?.category || editModal.data.category,
                            template_vars: detail?.template_variables || [],
                          },
                        });
                      }}
                    >
                      {(typeInfo?.prompt_types || []).map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Version</label>
                    <input
                      type="text"
                      value={editModal.data.version}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, version: e.target.value } })}
                      placeholder="1.0.0"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Scope</label>
                    <input
                      type="text"
                      value={editModal.data.scope}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, scope: e.target.value } })}
                      placeholder="global | subdomain:304 | domain:300"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={editModal.data.is_active}
                      onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, is_active: e.target.checked } })}
                      style={{ accentColor: '#7b5bff' }}
                    />
                    Active on create
                  </label>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={editModal.data.display_name}
                onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, display_name: e.target.value } })}
                placeholder="E.g. V3 Mega-Prompt (Phase 29 Data)"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editModal.data.description}
                onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, description: e.target.value } })}
                placeholder="Change notes / purpose"
                rows={2}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ margin: 0 }}>Prompt Content</label>
                <span style={{ fontSize: '0.875rem', color: '#a0a8b8' }}>
                  {editModal.data.content.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                className="json-editor-area"
                value={editModal.data.content}
                onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, content: e.target.value } })}
                placeholder="Prompt text with {placeholder} variables..."
                style={{ minHeight: 200 }}
              />
            </div>

            {/* Template variables hint */}
            {editModal.data.template_vars && editModal.data.template_vars.length > 0 && (
              <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(123,91,255,0.08)', borderRadius: 8, border: '1px dashed rgba(123,91,255,0.3)' }}>
                <div style={{ fontSize: '0.875rem', color: '#b794ff', fontWeight: 600, marginBottom: 4 }}>Template Variables</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {editModal.data.template_vars.map((v) => (
                    <span key={v} style={{ padding: '2px 8px', background: 'rgba(123,91,255,0.15)', borderRadius: 4, fontSize: '0.875rem', fontFamily: 'monospace', color: '#c7cfdd' }}>
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setEditModal(null)}>Cancel</button>
              <button
                className="btn-modal-save"
                onClick={handleSave}
                disabled={saving || !editModal.data.content.trim() || !editModal.data.display_name.trim()}
              >
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : editModal.mode === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Confirmation ---- */}
      {confirmDelete && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 450 }}>
            <h2>Delete Prompt</h2>
            <div className="confirm-warning">
              <p><strong>Warning:</strong> Deleting &quot;{confirmDelete.display_name}&quot; (v{confirmDelete.version}, scope: {confirmDelete.scope}) will soft-delete it and deactivate it.</p>
              {confirmDelete.is_active && (
                <p style={{ marginTop: 8, color: '#ff4757' }}>
                  <i className="fas fa-exclamation-triangle"></i> This prompt is currently <strong>ACTIVE</strong>. The system will fall back to hardcoded defaults.
                </p>
              )}
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

      {/* ---- Clone Modal ---- */}
      {cloneModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setCloneModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 550 }}>
            <h2>Clone Prompt</h2>
            <p style={{ color: '#c7cfdd', fontSize: '0.9rem', marginBottom: 16 }}>
              Cloning <strong>{cloneModal.source.display_name}</strong> (v{cloneModal.source.version})
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>New Version *</label>
                <input
                  type="text"
                  value={cloneModal.newVersion}
                  onChange={(e) => setCloneModal({ ...cloneModal, newVersion: e.target.value })}
                  placeholder="2.0.0"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Scope Override (optional)</label>
                <input
                  type="text"
                  value={cloneModal.scope}
                  onChange={(e) => setCloneModal({ ...cloneModal, scope: e.target.value })}
                  placeholder="subdomain:304"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Content Override (optional)</label>
              <textarea
                className="json-editor-area"
                value={cloneModal.content}
                onChange={(e) => setCloneModal({ ...cloneModal, content: e.target.value })}
                placeholder="Leave empty to copy original content..."
                style={{ minHeight: 100 }}
              />
            </div>

            <p style={{ color: '#a0a8b8', fontSize: '0.875rem' }}>
              <i className="fas fa-info-circle"></i> The clone starts as <strong>inactive</strong>. Use the activate button to make it live.
            </p>

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setCloneModal(null)}>Cancel</button>
              <button
                className="btn-modal-save"
                onClick={handleClone}
                disabled={saving || !cloneModal.newVersion.trim()}
              >
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Cloning...</> : 'Clone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Preview Modal ---- */}
      {previewModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setPreviewModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }}>
            <h2>
              <i className="fas fa-eye" style={{ color: '#9d7bff', marginRight: 8 }}></i>
              Preview: {previewModal.prompt_type} v{previewModal.version}
              <span style={{ fontSize: '0.875rem', color: '#a0a8b8', marginLeft: 8 }}>scope: {previewModal.scope}</span>
            </h2>

            <div className="json-dual-panel" style={{ marginTop: 16 }}>
              <div className="json-panel">
                <label>Raw Template</label>
                <textarea
                  className="json-editor-area"
                  value={previewModal.raw_template}
                  readOnly
                  style={{ minHeight: 300 }}
                />
              </div>
              <div className="json-panel">
                <label className="compliant-label">Rendered Preview (sample data)</label>
                <textarea
                  className="json-editor-area valid"
                  value={previewModal.rendered_preview}
                  readOnly
                  style={{ minHeight: 300 }}
                />
              </div>
            </div>

            {previewModal.template_vars && previewModal.template_vars.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(123,91,255,0.08)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.875rem', color: '#b794ff', fontWeight: 600, marginBottom: 4 }}>Template Variables ({previewModal.template_vars.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {previewModal.template_vars.map((v) => (
                    <span key={v} style={{ padding: '2px 8px', background: 'rgba(123,91,255,0.15)', borderRadius: 4, fontSize: '0.875rem', fontFamily: 'monospace', color: '#c7cfdd' }}>
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-modal-actions" style={{ marginTop: 16 }}>
              <button className="btn-modal-cancel" onClick={() => setPreviewModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
