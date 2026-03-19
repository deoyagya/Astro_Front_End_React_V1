import { useState, useEffect, useCallback, useRef } from 'react';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import { getAccessToken } from '../../auth/session';
import '../../styles/admin.css';

const ROLES = ['free', 'premium', 'admin'];
const PER_PAGE = 50;

const COUNTRY_NAMES = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', CA: 'Canada',
  AU: 'Australia', DE: 'Germany', FR: 'France', JP: 'Japan', SG: 'Singapore',
  AE: 'UAE', NZ: 'New Zealand', NL: 'Netherlands', IT: 'Italy', ES: 'Spain',
  BR: 'Brazil', ZA: 'South Africa', KE: 'Kenya', NG: 'Nigeria', MY: 'Malaysia',
  PH: 'Philippines', ID: 'Indonesia', TH: 'Thailand', VN: 'Vietnam', KR: 'South Korea',
  CN: 'China', RU: 'Russia', MX: 'Mexico', AR: 'Argentina', CL: 'Chile',
  SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland',
  IE: 'Ireland', CH: 'Switzerland', AT: 'Austria', BE: 'Belgium', PT: 'Portugal',
  LK: 'Sri Lanka', NP: 'Nepal', BD: 'Bangladesh', PK: 'Pakistan', MM: 'Myanmar',
};
function countryName(code) {
  if (!code) return '';
  return COUNTRY_NAMES[code] || code;
}

const ROLE_BADGE = {
  admin:   { bg: 'rgba(123,91,255,0.25)', color: '#b794ff' },
  premium: { bg: 'rgba(255,193,7,0.2)',   color: '#ffc107' },
  free:    { bg: 'rgba(160,168,184,0.2)', color: '#a0a8b8' },
};

function roleBadge(role) {
  const s = ROLE_BADGE[role] || ROLE_BADGE.free;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
}

function statusBadge(isActive, isSuspended) {
  if (isSuspended) return <span className="badge-deleted">Suspended</span>;
  if (!isActive)   return <span className="badge-inactive">Inactive</span>;
  return <span className="badge-active">Active</span>;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function AdminUserManagementPage() {
  // List state
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Detail / Edit
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', phone: '', role: 'free', send_welcome_email: true });
  const [createSaving, setCreateSaving] = useState(false);

  // Suspend
  const [showSuspend, setShowSuspend] = useState(null); // user object
  const [suspendForm, setSuspendForm] = useState({ reason: '', suspended_until: '' });
  const [suspendSaving, setSuspendSaving] = useState(false);

  // Activity Log
  const [showActivity, setShowActivity] = useState(null); // user id
  const [activities, setActivities] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);

  // CSV Import
  const csvRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Fetch Users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PER_PAGE, offset: page * PER_PAGE });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter === 'active') params.set('is_active', 'true');
      if (statusFilter === 'inactive') params.set('is_active', 'false');
      const data = await api.get(`/v1/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // ── Fetch User Detail ──
  const openDetail = async (userId) => {
    setDetailLoading(true);
    setEditMode(false);
    try {
      const data = await api.get(`/v1/admin/users/${userId}`);
      setSelectedUser(data);
      setEditForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'free',
        marketing_consent: data.marketing_consent || false,
        is_active: data.is_active,
      });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Save Edit ──
  const saveEdit = async () => {
    if (!selectedUser) return;
    setEditSaving(true);
    try {
      await api.put(`/v1/admin/users/${selectedUser.id}`, editForm);
      setToast({ type: 'success', msg: 'User updated!' });
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setEditSaving(false);
    }
  };

  // ── Create User ──
  const handleCreate = async () => {
    if (!createForm.full_name.trim()) {
      setToast({ type: 'error', msg: 'Full name is required.' });
      return;
    }
    if (!createForm.email && !createForm.phone) {
      setToast({ type: 'error', msg: 'Email or phone is required.' });
      return;
    }
    setCreateSaving(true);
    try {
      await api.post('/v1/admin/users', createForm);
      setToast({ type: 'success', msg: 'User created!' });
      setShowCreate(false);
      setCreateForm({ full_name: '', email: '', phone: '', role: 'free', send_welcome_email: true });
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setCreateSaving(false);
    }
  };

  // ── Suspend / Unsuspend ──
  const handleSuspend = async () => {
    if (!showSuspend || !suspendForm.reason.trim()) {
      setToast({ type: 'error', msg: 'Suspension reason is required.' });
      return;
    }
    setSuspendSaving(true);
    try {
      const body = { reason: suspendForm.reason };
      if (suspendForm.suspended_until) body.suspended_until = new Date(suspendForm.suspended_until).toISOString();
      await api.post(`/v1/admin/users/${showSuspend.id}/suspend`, body);
      setToast({ type: 'success', msg: `${showSuspend.full_name || 'User'} suspended.` });
      setShowSuspend(null);
      setSuspendForm({ reason: '', suspended_until: '' });
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSuspendSaving(false);
    }
  };

  const handleUnsuspend = async (userId, name) => {
    try {
      await api.post(`/v1/admin/users/${userId}/unsuspend`, {});
      setToast({ type: 'success', msg: `${name || 'User'} unsuspended.` });
      if (selectedUser?.id === userId) {
        openDetail(userId);
      }
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  // ── Activity Log ──
  const openActivity = async (userId) => {
    setShowActivity(userId);
    setActivityPage(0);
    fetchActivity(userId, 0);
  };

  const fetchActivity = async (userId, pg) => {
    setActivityLoading(true);
    try {
      const data = await api.get(`/v1/admin/users/${userId}/activity?limit=${PER_PAGE}&offset=${pg * PER_PAGE}`);
      setActivities(data.activities || []);
      setActivityTotal(data.total || 0);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setActivityLoading(false);
    }
  };

  const exportActivity = async (userId) => {
    try {
      await api.download(`/v1/admin/users/${userId}/activity/export`, `user_${userId}_activity.csv`);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  };

  // ── CSV Import ──
  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/admin/users/import-csv`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Import failed');
      const msgs = [];
      if (data.imported) msgs.push(`${data.imported} imported`);
      if (data.skipped) msgs.push(`${data.skipped} skipped`);
      if (data.errors?.length) msgs.push(`${data.errors.length} errors`);
      setToast({ type: data.imported > 0 ? 'success' : 'error', msg: `CSV: ${msgs.join(', ')}` });
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
    // Reset file input
    if (csvRef.current) csvRef.current.value = '';
  };

  // ── Search debounce ──
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="container">
          {/* Header */}
          <div className="admin-header">
            <h1><i className="fas fa-users"></i> User Management</h1>
            <p>Search, manage, and monitor all registered users</p>
          </div>

          {/* Toolbar */}
          <div className="admin-toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search by name, email, or phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select className="filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }} style={{ minWidth: 140 }}>
              <option value="">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} style={{ minWidth: 140 }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn-admin-add" onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus"></i> Add User
            </button>
            <button
              className="btn-admin-add"
              style={{ background: 'linear-gradient(90deg, #06b6d4, #22d3ee)' }}
              onClick={() => csvRef.current?.click()}
            >
              <i className="fas fa-file-csv"></i> Import CSV
            </button>
            <input ref={csvRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
          </div>

          {/* Table */}
          {loading ? (
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading users…</p>
            </div>
          ) : users.length === 0 ? (
            <div className="admin-empty">
              <i className="fas fa-users-slash"></i>
              <p>No users found.</p>
            </div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.full_name || '—'}</td>
                      <td>{u.email || '—'}</td>
                      <td>{u.phone || '—'}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td>{statusBadge(u.is_active, u.is_suspended)}</td>
                      <td>{fmtDate(u.created_at)}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-edit" onClick={() => openDetail(u.id)} title="View / Edit">
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn-edit"
                            style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}
                            onClick={() => openActivity(u.id)}
                            title="Activity Log"
                          >
                            <i className="fas fa-history"></i>
                          </button>
                          {u.is_suspended ? (
                            <button
                              className="btn-edit"
                              style={{ background: 'rgba(46,213,115,0.2)', color: '#2ed573' }}
                              onClick={() => handleUnsuspend(u.id, u.full_name)}
                              title="Unsuspend"
                            >
                              <i className="fas fa-check-circle"></i>
                            </button>
                          ) : (
                            <button className="btn-delete" onClick={() => { setShowSuspend(u); setSuspendForm({ reason: '', suspended_until: '' }); }} title="Suspend">
                              <i className="fas fa-ban"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, color: '#a0a8b8' }}>
                <span>{total} user{total !== 1 ? 's' : ''} total</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn-edit" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <i className="fas fa-chevron-left"></i> Prev
                  </button>
                  <span>Page {page + 1} of {totalPages}</span>
                  <button className="btn-edit" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── User Detail / Edit Modal ── */}
      {(selectedUser || detailLoading) && (
        <div className="admin-modal" onClick={() => { setSelectedUser(null); setEditMode(false); }}>
          <div className="admin-modal-content" style={{ maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading…</p></div>
            ) : selectedUser && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ color: '#fff', fontFamily: "'Cinzel', serif", margin: 0 }}>
                    <i className="fas fa-user" style={{ color: '#9d7bff', marginRight: 8 }}></i>
                    {editMode ? 'Edit User' : 'User Details'}
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!editMode && (
                      <button className="btn-edit" onClick={() => setEditMode(true)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                    )}
                    <button className="btn-delete" onClick={() => { setSelectedUser(null); setEditMode(false); }}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                {editMode ? (
                  /* Edit Form */
                  <div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Full Name</label>
                      <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Phone</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Role</label>
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }}>
                        {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                      <label style={{ color: '#c7cfdd', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={editForm.marketing_consent} onChange={(e) => setEditForm({ ...editForm, marketing_consent: e.target.checked })} />
                        Marketing Consent
                      </label>
                      <label style={{ color: '#c7cfdd', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
                        Active
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-edit" onClick={() => setEditMode(false)}>Cancel</button>
                      <button className="btn-admin-add" onClick={saveEdit} disabled={editSaving}>
                        {editSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving…</> : <><i className="fas fa-save"></i> Save</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Detail View */
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20 }}>
                      <div><span style={{ color: '#a0a8b8', fontSize: '0.85rem' }}>Name</span><div style={{ color: '#fff', fontWeight: 600 }}>{selectedUser.full_name || '—'}</div></div>
                      <div><span style={{ color: '#a0a8b8', fontSize: '0.85rem' }}>Email</span><div style={{ color: '#fff' }}>{selectedUser.email || '—'}</div></div>
                      <div><span style={{ color: '#a0a8b8', fontSize: '0.85rem' }}>Phone</span><div style={{ color: '#fff' }}>{selectedUser.phone || '—'}</div></div>
                      <div><span style={{ color: '#a0a8b8', fontSize: '0.85rem' }}>Role</span><div>{roleBadge(selectedUser.role)}</div></div>
                      <div><span style={{ color: '#a0a8b8', fontSize: '0.85rem' }}>Status</span><div>{statusBadge(selectedUser.is_active, !!selectedUser.suspension)}</div></div>
                      <div><span style={{ color: '#a0a8b8', fontSize: '0.85rem' }}>Created</span><div style={{ color: '#fff' }}>{fmtDate(selectedUser.created_at)}</div></div>
                    </div>

                    {/* Last Login */}
                    {selectedUser.last_login && (
                      <div style={{ background: 'rgba(40,44,60,0.6)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                        <div style={{ color: '#b794ff', fontWeight: 600, marginBottom: 8 }}><i className="fas fa-sign-in-alt" style={{ marginRight: 6 }}></i>Last Login</div>
                        <div style={{ color: '#c7cfdd', fontSize: '0.9rem', lineHeight: 1.6 }}>
                          {selectedUser.last_login.login_date} {selectedUser.last_login.login_time}<br />
                          {[selectedUser.last_login.city, selectedUser.last_login.region, countryName(selectedUser.last_login.country)].filter(Boolean).join(', ') || '—'}<br />
                          IP: {selectedUser.last_login.ip_address || '—'} · {selectedUser.last_login.auth_method || '—'}
                        </div>
                      </div>
                    )}

                    {/* Plan Info */}
                    {selectedUser.plan_info && (
                      <div style={{ background: 'rgba(40,44,60,0.6)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                        <div style={{ color: '#ffc107', fontWeight: 600, marginBottom: 8 }}><i className="fas fa-crown" style={{ marginRight: 6 }}></i>Subscription</div>
                        <div style={{ color: '#c7cfdd', fontSize: '0.9rem' }}>
                          {selectedUser.plan_info.plan_name || selectedUser.plan_info.plan_slug || '—'} · {selectedUser.plan_info.status}
                          {selectedUser.plan_info.current_period_end && <><br />Expires: {fmtDate(selectedUser.plan_info.current_period_end)}</>}
                        </div>
                      </div>
                    )}

                    {/* Suspension */}
                    {selectedUser.suspension && (
                      <div style={{ background: 'rgba(255,71,87,0.1)', borderLeft: '4px solid #ff4757', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                        <div style={{ color: '#ff4757', fontWeight: 600, marginBottom: 8 }}><i className="fas fa-ban" style={{ marginRight: 6 }}></i>Suspended</div>
                        <div style={{ color: '#c7cfdd', fontSize: '0.9rem' }}>
                          Reason: {selectedUser.suspension.reason}<br />
                          Since: {fmtDateTime(selectedUser.suspension.suspended_at)}
                          {selectedUser.suspension.suspended_until && <><br />Until: {fmtDateTime(selectedUser.suspension.suspended_until)}</>}
                        </div>
                        <button
                          className="btn-edit" style={{ marginTop: 10, background: 'rgba(46,213,115,0.2)', color: '#2ed573' }}
                          onClick={() => handleUnsuspend(selectedUser.id, selectedUser.full_name)}
                        >
                          <i className="fas fa-check-circle"></i> Unsuspend
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Create User Modal ── */}
      {showCreate && (
        <div className="admin-modal" onClick={() => setShowCreate(false)}>
          <div className="admin-modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#fff', fontFamily: "'Cinzel', serif", marginBottom: 20 }}>
              <i className="fas fa-user-plus" style={{ color: '#9d7bff', marginRight: 8 }}></i>
              Create User
            </h3>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Full Name *</label>
              <input type="text" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                placeholder="Enter full name"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@example.com"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Phone</label>
              <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="+91..."
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Role</label>
              <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }}>
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <label style={{ color: '#c7cfdd', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
              <input type="checkbox" checked={createForm.send_welcome_email} onChange={(e) => setCreateForm({ ...createForm, send_welcome_email: e.target.checked })} />
              Send welcome email
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-edit" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-admin-add" onClick={handleCreate} disabled={createSaving}>
                {createSaving ? <><i className="fas fa-spinner fa-spin"></i> Creating…</> : <><i className="fas fa-plus"></i> Create</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend Modal ── */}
      {showSuspend && (
        <div className="admin-modal" onClick={() => setShowSuspend(null)}>
          <div className="admin-modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ff4757', fontFamily: "'Cinzel', serif", marginBottom: 20 }}>
              <i className="fas fa-ban" style={{ marginRight: 8 }}></i>
              Suspend {showSuspend.full_name || 'User'}
            </h3>
            <div className="confirm-warning">
              This will immediately block the user from accessing the platform. They will be notified via email.
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Reason *</label>
              <textarea value={suspendForm.reason} onChange={(e) => setSuspendForm({ ...suspendForm, reason: e.target.value })}
                placeholder="Enter the reason for suspension…"
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0', minHeight: 80, resize: 'vertical' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 4 }}>Suspend Until (optional — leave blank for indefinite)</label>
              <input type="datetime-local" value={suspendForm.suspended_until} onChange={(e) => setSuspendForm({ ...suspendForm, suspended_until: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(40,44,60,0.8)', border: '1px solid #2a2f3e', borderRadius: 8, color: '#e8eaf0' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-edit" onClick={() => setShowSuspend(null)}>Cancel</button>
              <button className="btn-delete" style={{ padding: '10px 20px' }} onClick={handleSuspend} disabled={suspendSaving}>
                {suspendSaving ? <><i className="fas fa-spinner fa-spin"></i> Suspending…</> : <><i className="fas fa-ban"></i> Suspend</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity Log Modal ── */}
      {showActivity && (
        <div className="admin-modal" onClick={() => setShowActivity(null)}>
          <div className="admin-modal-content" style={{ maxWidth: '95vw', width: 1200 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: '#fff', fontFamily: "'Cinzel', serif", margin: 0 }}>
                <i className="fas fa-history" style={{ color: '#06b6d4', marginRight: 8 }}></i>
                Login Activity
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-edit" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }} onClick={() => exportActivity(showActivity)}>
                  <i className="fas fa-download"></i> Export CSV
                </button>
                <button className="btn-delete" onClick={() => setShowActivity(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            {activityLoading ? (
              <div className="admin-loading"><i className="fas fa-spinner fa-spin"></i><p>Loading…</p></div>
            ) : activities.length === 0 ? (
              <div className="admin-empty"><i className="fas fa-inbox"></i><p>No login activity recorded.</p></div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>IP</th>
                      <th>Location</th>
                      <th>Method</th>
                      <th>Browser</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((a) => (
                      <tr key={a.id}>
                        <td>{a.login_date || '—'}</td>
                        <td>{a.login_time || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{a.ip_address || '—'}</td>
                        <td>{[a.city, a.region, countryName(a.country)].filter(Boolean).join(', ') || '—'}</td>
                        <td><span style={{ background: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem' }}>{a.auth_method || '—'}</span></td>
                        <td style={{ wordBreak: 'break-word', fontSize: '0.85rem' }}>{a.user_agent || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {activityTotal > PER_PAGE && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                    <button className="btn-edit" disabled={activityPage === 0} onClick={() => { setActivityPage((p) => p - 1); fetchActivity(showActivity, activityPage - 1); }}>
                      <i className="fas fa-chevron-left"></i> Prev
                    </button>
                    <span style={{ color: '#a0a8b8', alignSelf: 'center' }}>Page {activityPage + 1} of {Math.ceil(activityTotal / PER_PAGE)}</span>
                    <button className="btn-edit" disabled={activityPage + 1 >= Math.ceil(activityTotal / PER_PAGE)} onClick={() => { setActivityPage((p) => p + 1); fetchActivity(showActivity, activityPage + 1); }}>
                      Next <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}
    </PageShell>
  );
}
