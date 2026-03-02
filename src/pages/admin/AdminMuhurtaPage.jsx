import '../../styles/admin.css';
import PageShell from '../../components/PageShell';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';

const DEFAULT_ICONS = [
  'fa-star', 'fa-ring', 'fa-briefcase', 'fa-plane', 'fa-home', 'fa-om',
  'fa-heartbeat', 'fa-car', 'fa-building', 'fa-graduation-cap', 'fa-gem',
  'fa-pray', 'fa-baby', 'fa-seedling', 'fa-coins', 'fa-balance-scale',
  'fa-hands', 'fa-book-open', 'fa-dove', 'fa-sun',
];

const DEFAULT_COLORS = [
  '#ff6b81', '#ffa502', '#70a1ff', '#2ed573', '#eccc68', '#ff4757',
  '#7bed9f', '#a29bfe', '#9d7bff', '#fd79a8', '#00cec9', '#e17055',
];

export default function AdminMuhurtaPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  // Modals
  const [editModal, setEditModal] = useState(null); // null | { mode: 'create'|'edit', data: {...} }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showInactive) params.set('include_inactive', 'true');
      const qs = params.toString();
      const data = await api.get(`/v1/admin/muhurta/${qs ? `?${qs}` : ''}`);
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = () => {
    setEditModal({
      mode: 'create',
      data: {
        event_key: '',
        label: '',
        icon: 'fa-star',
        description: '',
        color: '#9d7bff',
        price_paisa: 0,
        discount_pct: 0,
        discount_expires_at: '',
        is_active: true,
        display_order: 100,
      },
    });
  };

  const handleEdit = (event) => {
    setEditModal({
      mode: 'edit',
      data: {
        id: event.id,
        event_key: event.event_key,
        label: event.label,
        icon: event.icon,
        description: event.description || '',
        color: event.color,
        price_paisa: event.price_paisa,
        discount_pct: event.discount_pct,
        discount_expires_at: event.discount_expires_at ? event.discount_expires_at.substring(0, 16) : '',
        is_active: event.is_active,
        display_order: event.display_order,
      },
    });
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);

    try {
      const payload = { ...editModal.data };
      // Convert price from rupees input to paisa
      payload.discount_expires_at = payload.discount_expires_at || null;

      if (editModal.mode === 'create') {
        await api.post('/v1/admin/muhurta/', payload);
        setToast({ type: 'success', msg: `Event "${payload.label}" created` });
      } else {
        const { id, ...fields } = payload;
        await api.put(`/v1/admin/muhurta/${id}`, fields);
        setToast({ type: 'success', msg: `Event "${payload.label}" updated` });
      }
      setEditModal(null);
      loadEvents();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.del(`/v1/admin/muhurta/${confirmDelete.id}`);
      setToast({ type: 'success', msg: `Event "${confirmDelete.label}" deactivated` });
      setConfirmDelete(null);
      loadEvents();
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Delete failed' });
    }
  };

  const updateField = (key, value) => {
    setEditModal(prev => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  // Auto-generate event_key from label
  const handleLabelChange = (val) => {
    updateField('label', val);
    if (editModal?.mode === 'create') {
      updateField('event_key', val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
    }
  };

  const formatPrice = (paisa) => paisa > 0 ? `\u20B9${(paisa / 100).toFixed(0)}` : 'Free';

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <h1><i className="fas fa-clock" style={{ marginRight: 10, color: '#9d7bff' }}></i>Muhurta Event Management</h1>
            <p className="admin-subtitle">Manage Muhurta event types, pricing, and discounts.</p>
          </div>

          <div className="admin-toolbar">
            <label className="filter-toggle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
              Show Inactive
            </label>
            <button className="btn-admin-add" onClick={handleCreate}>
              <i className="fas fa-plus"></i> Add Event Type
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, padding: '12px 16px', margin: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#ff6b81' }}><i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i>{error}</span>
              <button onClick={() => { setError(''); loadEvents(); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#e0e0e0', padding: '6px 14px', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
                <i className="fas fa-redo" style={{ marginRight: 6 }}></i>Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i> Loading events...</div>
          ) : events.length === 0 ? (
            <div className="admin-empty">No muhurta events found.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Icon</th>
                  <th>Label</th>
                  <th>Event Key</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'center' }}>Discount</th>
                  <th style={{ textAlign: 'center' }}>Order</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id || ev.event_key} className={!ev.is_active ? 'deleted-row' : ''}>
                    <td>
                      <i className={`fas ${ev.icon}`} style={{ color: ev.color, fontSize: 18 }}></i>
                    </td>
                    <td>
                      <strong style={{ color: ev.color }}>{ev.label}</strong>
                      {ev.description && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>{ev.description.substring(0, 60)}{ev.description.length > 60 ? '...' : ''}</div>}
                    </td>
                    <td><code style={{ fontSize: 12, color: '#b0b7c3' }}>{ev.event_key}</code></td>
                    <td style={{ textAlign: 'right' }}>
                      {ev.is_free ? (
                        <span style={{ color: '#2ed573', fontWeight: 600 }}>Free</span>
                      ) : (
                        <span>
                          {ev.discount_pct > 0 && <span style={{ textDecoration: 'line-through', color: '#666', marginRight: 6, fontSize: 12 }}>{formatPrice(ev.price_paisa)}</span>}
                          <span style={{ color: '#ffa502', fontWeight: 600 }}>{ev.price_display}</span>
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {ev.discount_pct > 0 ? (
                        <span style={{ background: '#2ed573', color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                          {ev.discount_pct}% OFF
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', color: '#b0b7c3' }}>{ev.display_order}</td>
                    <td style={{ textAlign: 'center' }}>
                      {ev.is_active
                        ? <span className="badge-active">Active</span>
                        : <span className="badge-inactive">Inactive</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell">
                        <button className="btn-edit" onClick={() => handleEdit(ev)} title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                        {ev.is_active && (
                          <button className="btn-delete" onClick={() => setConfirmDelete(ev)} title="Deactivate">
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Create/Edit Modal */}
      {editModal && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 560 }}>
            <h3>{editModal.mode === 'create' ? 'Create New Event Type' : `Edit: ${editModal.data.label}`}</h3>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Label</label>
                <input type="text" className="form-input" placeholder="e.g. Namkaran Sanskar"
                  value={editModal.data.label} onChange={e => handleLabelChange(e.target.value)} />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Event Key (slug)</label>
                <input type="text" className="form-input" placeholder="e.g. namkaran_sanskar"
                  value={editModal.data.event_key}
                  onChange={e => updateField('event_key', e.target.value)}
                  disabled={editModal.mode === 'edit'} />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" rows={2} placeholder="Brief description..."
                value={editModal.data.description} onChange={e => updateField('description', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Icon</label>
                <select className="form-input" value={editModal.data.icon} onChange={e => updateField('icon', e.target.value)}>
                  {DEFAULT_ICONS.map(ic => (
                    <option key={ic} value={ic}>{ic.replace('fa-', '')}</option>
                  ))}
                </select>
                <div style={{ marginTop: 6 }}>
                  <i className={`fas ${editModal.data.icon}`} style={{ color: editModal.data.color, fontSize: 24 }}></i>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {DEFAULT_COLORS.map(c => (
                    <button key={c} style={{
                      width: 28, height: 28, borderRadius: 4, border: editModal.data.color === c ? '2px solid #fff' : '1px solid #333',
                      background: c, cursor: 'pointer',
                    }} onClick={() => updateField('color', c)} />
                  ))}
                </div>
                <input type="text" className="form-input" style={{ marginTop: 6, width: 100 }}
                  value={editModal.data.color} onChange={e => updateField('color', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (paisa)</label>
                <input type="number" className="form-input" min={0} step={100}
                  value={editModal.data.price_paisa} onChange={e => updateField('price_paisa', parseInt(e.target.value) || 0)} />
                <small style={{ color: '#8b949e' }}>0 = Free. 50100 = &#8377;501</small>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Discount %</label>
                <input type="number" className="form-input" min={0} max={100}
                  value={editModal.data.discount_pct} onChange={e => updateField('discount_pct', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Discount Expires At</label>
                <input type="datetime-local" className="form-input"
                  value={editModal.data.discount_expires_at} onChange={e => updateField('discount_expires_at', e.target.value)} />
                <small style={{ color: '#8b949e' }}>Leave blank for no expiry</small>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Display Order</label>
                <input type="number" className="form-input" min={0}
                  value={editModal.data.display_order} onChange={e => updateField('display_order', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={editModal.data.is_active} onChange={e => updateField('is_active', e.target.checked)} />
                Active
              </label>
            </div>

            {/* Price Preview */}
            {editModal.data.price_paisa > 0 && (
              <div style={{
                background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 12, marginTop: 12,
                display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
              }}>
                <i className={`fas ${editModal.data.icon}`} style={{ color: editModal.data.color, fontSize: 20 }}></i>
                <div>
                  <strong style={{ color: '#e0e0e0' }}>{editModal.data.label || 'Preview'}</strong>
                  <div style={{ color: '#8b949e', fontSize: 12 }}>
                    {editModal.data.discount_pct > 0 && (
                      <span style={{ textDecoration: 'line-through', marginRight: 8 }}>{formatPrice(editModal.data.price_paisa)}</span>
                    )}
                    <span style={{ color: '#ffa502', fontWeight: 600 }}>
                      {formatPrice(Math.round(editModal.data.price_paisa * (100 - editModal.data.discount_pct) / 100))}
                    </span>
                    {editModal.data.discount_pct > 0 && (
                      <span style={{ background: '#2ed573', color: '#000', padding: '1px 6px', borderRadius: 4, marginLeft: 8, fontSize: 11 }}>
                        {editModal.data.discount_pct}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn-modal-save" disabled={saving || !editModal.data.label.trim() || !editModal.data.event_key.trim()} onClick={handleSave}>
                {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : (editModal.mode === 'create' ? 'Create' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="admin-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="admin-modal-content" style={{ maxWidth: 420 }}>
            <h3>Deactivate Event</h3>
            <div className="confirm-warning">
              <p>Are you sure you want to deactivate <strong>{confirmDelete.label}</strong> ({confirmDelete.event_key})?</p>
              <p style={{ fontSize: 13, color: '#8b949e', marginTop: 8 }}>This will hide the event from the Muhurta finder. It can be reactivated later.</p>
            </div>
            <div className="admin-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-modal-save" style={{ background: '#ff4757' }} onClick={handleDelete}>Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {toast.msg}
        </div>
      )}
    </PageShell>
  );
}
