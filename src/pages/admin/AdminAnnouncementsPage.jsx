import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/admin.css';
import '../../styles/admin-legal.css';
import '../../styles/admin-announcements.css';
import PageShell from '../../components/PageShell';
import DateInput from '../../components/form/DateInput';
import TimeInput from '../../components/form/TimeInput';
import { api } from '../../api/client';

function toLocalDateTimeParts(value) {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };
  const offset = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offset).toISOString().slice(0, 16);
  const [datePart, timePart] = local.split('T');
  return {
    date: datePart || '',
    time: timePart || '',
  };
}

function toIso(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const date = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function createEmptyForm() {
  return {
    id: null,
    message: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    pageKeys: [],
    isEnabled: true,
  };
}

export default function AdminAnnouncementsPage() {
  const [payload, setPayload] = useState({ page_catalog: [], announcements: [] });
  const [form, setForm] = useState(createEmptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pageQuery, setPageQuery] = useState('');
  const [pageSelectorOpen, setPageSelectorOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [listQuery, setListQuery] = useState('');
  const [listPageFilter, setListPageFilter] = useState('all');
  const pageSelectorRef = useRef(null);

  const editing = useMemo(() => Boolean(form.id), [form.id]);
  const selectedPages = useMemo(
    () => payload.page_catalog.filter((page) => form.pageKeys.includes(page.page_key)),
    [form.pageKeys, payload.page_catalog],
  );
  const filteredPages = useMemo(() => {
    const needle = pageQuery.trim().toLowerCase();
    if (!needle) return payload.page_catalog;
    return payload.page_catalog.filter((page) => (
      page.label.toLowerCase().includes(needle)
      || page.route_pattern.toLowerCase().includes(needle)
    ));
  }, [pageQuery, payload.page_catalog]);
  const announcementStatusCounts = useMemo(() => {
    const counts = { all: payload.announcements.length, live: 0, scheduled: 0, expired: 0, disabled: 0 };
    payload.announcements.forEach((announcement) => {
      if (counts[announcement.status] !== undefined) {
        counts[announcement.status] += 1;
      }
    });
    return counts;
  }, [payload.announcements]);
  const filteredAnnouncements = useMemo(() => {
    const needle = listQuery.trim().toLowerCase();
    return payload.announcements.filter((announcement) => {
      if (statusFilter !== 'all' && announcement.status !== statusFilter) {
        return false;
      }
      if (listPageFilter !== 'all' && !(announcement.page_keys || []).includes(listPageFilter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const pageText = (announcement.page_labels || []).join(' ').toLowerCase();
      return announcement.message.toLowerCase().includes(needle) || pageText.includes(needle);
    });
  }, [listPageFilter, listQuery, payload.announcements, statusFilter]);

  const fetchPayload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/v1/admin/announcements');
      setPayload(data);
    } catch (err) {
      setError(err.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayload();
  }, [fetchPayload]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pageSelectorRef.current && !pageSelectorRef.current.contains(event.target)) {
        setPageSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setForm(createEmptyForm());
    setPageQuery('');
    setPageSelectorOpen(false);
    setSuccess('');
    setError('');
  };

  const togglePageKey = (pageKey) => {
    setForm((current) => ({
      ...current,
      pageKeys: (() => {
        const currentKeys = current.pageKeys || [];
        if (pageKey === 'site_wide') {
          return currentKeys.includes('site_wide') ? [] : ['site_wide'];
        }
        const withoutSiteWide = currentKeys.filter((key) => key !== 'site_wide');
        return withoutSiteWide.includes(pageKey)
          ? withoutSiteWide.filter((key) => key !== pageKey)
          : [...withoutSiteWide, pageKey];
      })(),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const startAtIso = toIso(form.startDate, form.startTime);
    const endAtIso = toIso(form.endDate, form.endTime);
    if (!startAtIso || !endAtIso) {
      setSaving(false);
      setError('Start and end date/time are required.');
      return;
    }
    if (new Date(endAtIso).getTime() <= new Date(startAtIso).getTime()) {
      setSaving(false);
      setError('End date/time must be later than start date/time.');
      return;
    }

    try {
      const body = {
        message: form.message,
        start_at: startAtIso,
        end_at: endAtIso,
        page_keys: form.pageKeys,
        is_enabled: form.isEnabled,
      };
      if (editing) {
        await api.put(`/v1/admin/announcements/${form.id}`, body);
        setSuccess('Announcement updated.');
      } else {
        await api.post('/v1/admin/announcements', body);
        setSuccess('Announcement created.');
      }
      await fetchPayload();
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement) => {
    setForm({
      id: announcement.id,
      message: announcement.message,
      ...(() => {
        const start = toLocalDateTimeParts(announcement.start_at);
        const end = toLocalDateTimeParts(announcement.end_at);
        return {
          startDate: start.date,
          startTime: start.time || '09:00',
          endDate: end.date,
          endTime: end.time || '18:00',
        };
      })(),
      pageKeys: announcement.page_keys || [],
      isEnabled: announcement.is_enabled,
    });
    setPageQuery('');
    setPageSelectorOpen(false);
    setSuccess('');
    setError('');
  };

  const handleDelete = async (announcementId) => {
    setError('');
    setSuccess('');
    try {
      await api.del(`/v1/admin/announcements/${announcementId}`);
      if (form.id === announcementId) {
        resetForm();
      }
      setSuccess('Announcement deleted.');
      await fetchPayload();
    } catch (err) {
      setError(err.message || 'Failed to delete announcement.');
    }
  };

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="admin-header">
          <h1><i className="fas fa-bullhorn" style={{ marginRight: 10 }}></i>Announcements</h1>
          <p>
            Schedule ribbon announcements by page, start date, and end date. Users see the banner only on matching pages
            during the active time window and can dismiss it with the close icon.
          </p>
        </div>

        {error && <div className="admin-toast error" style={{ position: 'static', marginBottom: 18 }}>{error}</div>}
        {success && <div className="admin-toast success" style={{ position: 'static', marginBottom: 18 }}>{success}</div>}

        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading announcements...</p>
          </div>
        ) : (
          <div className="announcement-admin-shell">
            <div className="announcement-admin-panel">
              <div className="legal-admin-header">
                <div>
                  <h2 style={{ margin: 0, color: '#fff' }}>{editing ? 'Edit announcement' : 'New announcement'}</h2>
                  <p style={{ marginTop: 8, color: '#94a3b8' }}>
                    One message, one schedule, multiple target pages.
                  </p>
                </div>
                <div className="announcement-actions">
                  <button className="btn-edit" type="button" onClick={resetForm} disabled={saving}>
                    <i className="fas fa-rotate-left"></i>
                    Clear
                  </button>
                  <button className="btn-admin-add" type="button" onClick={handleSave} disabled={saving}>
                    <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                    {editing ? 'Update Announcement' : 'Create Announcement'}
                  </button>
                </div>
              </div>

              <div className="announcement-admin-form">
                <div className="announcement-field">
                  <label htmlFor="announcement-message">Announcement message</label>
                  <textarea
                    id="announcement-message"
                    rows={4}
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Enter the message users should see in the ribbon."
                  />
                </div>

                <div className="announcement-admin-grid">
                  <div className="announcement-field">
                    <label htmlFor="announcement-start-date">Start date</label>
                    <DateInput
                      id="announcement-start-date"
                      value={form.startDate}
                      onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
                    />
                  </div>

                  <div className="announcement-field">
                    <label htmlFor="announcement-start-time">Start time</label>
                    <TimeInput
                      id="announcement-start-time"
                      value={form.startTime}
                      onChange={(value) => setForm((current) => ({ ...current, startTime: value }))}
                      step="900"
                    />
                  </div>

                  <div className="announcement-field">
                    <label htmlFor="announcement-end-date">End date</label>
                    <DateInput
                      id="announcement-end-date"
                      value={form.endDate}
                      onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
                    />
                  </div>

                  <div className="announcement-field">
                    <label htmlFor="announcement-end-time">End time</label>
                    <TimeInput
                      id="announcement-end-time"
                      value={form.endTime}
                      onChange={(value) => setForm((current) => ({ ...current, endTime: value }))}
                      step="900"
                    />
                  </div>
                </div>

                <label className="announcement-page-option" style={{ maxWidth: 340 }}>
                  <input
                    type="checkbox"
                    checked={form.isEnabled}
                    onChange={(event) => setForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                  />
                  <div>
                    <strong>Enabled</strong>
                    <span>Disabled announcements stay stored but never display publicly.</span>
                  </div>
                </label>

                <div className="announcement-field">
                  <label>Display on pages</label>
                  <div className="announcement-multiselect" ref={pageSelectorRef}>
                    <div
                      className={`announcement-select-control ${pageSelectorOpen ? 'open' : ''}`}
                      onClick={() => setPageSelectorOpen(true)}
                    >
                      <div className="announcement-select-values">
                        {selectedPages.map((page) => (
                          <button
                            key={page.page_key}
                            type="button"
                            className="announcement-inline-chip"
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePageKey(page.page_key);
                            }}
                          >
                            <span>{page.label}</span>
                            <i className="fas fa-times"></i>
                          </button>
                        ))}
                        <input
                          type="text"
                          className="announcement-select-input"
                          placeholder={selectedPages.length ? 'Search more pages...' : 'Search and select pages'}
                          value={pageQuery}
                          onFocus={() => setPageSelectorOpen(true)}
                          onChange={(event) => {
                            setPageQuery(event.target.value);
                            setPageSelectorOpen(true);
                          }}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </div>
                      <div className="announcement-select-meta">
                        {selectedPages.length ? (
                          <span className="announcement-select-badge">
                            {selectedPages.length}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="announcement-select-toggle"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPageSelectorOpen((current) => !current);
                          }}
                          aria-label={pageSelectorOpen ? 'Close page selector' : 'Open page selector'}
                        >
                          <i className={`fas fa-chevron-${pageSelectorOpen ? 'up' : 'down'}`}></i>
                        </button>
                      </div>
                    </div>

                    {pageSelectorOpen && (
                      <div className="announcement-select-panel">
                        <div className="announcement-select-panel-head">
                          <span className="announcement-select-summary">
                            {form.pageKeys.includes('site_wide')
                              ? 'Site Wide selected: all end-user pages'
                              : selectedPages.length
                                ? `${selectedPages.length} page${selectedPages.length > 1 ? 's' : ''} selected`
                                : 'Select one or more pages'}
                          </span>
                          {selectedPages.length ? (
                            <button
                              type="button"
                              className="announcement-select-clear"
                              onClick={() => setForm((current) => ({ ...current, pageKeys: [] }))}
                            >
                              Clear all
                            </button>
                          ) : null}
                        </div>
                        <div className="announcement-select-options">
                          {filteredPages.length ? filteredPages.map((page) => (
                            <label
                              key={page.page_key}
                              className={`announcement-select-option ${
                                form.pageKeys.includes(page.page_key) ? 'selected' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.pageKeys.includes(page.page_key)}
                                onChange={() => togglePageKey(page.page_key)}
                              />
                              <div>
                                <strong>{page.label}</strong>
                                <span>{page.page_key === 'site_wide' ? 'All end-user pages' : page.route_pattern}</span>
                              </div>
                            </label>
                          )) : (
                            <div className="announcement-select-empty">No matching pages found.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="announcement-admin-panel">
              <div className="legal-admin-header">
                <div>
                  <h2 style={{ margin: 0, color: '#fff' }}>Announcement register</h2>
                  <p style={{ marginTop: 8, color: '#94a3b8' }}>
                    Review current, upcoming, expired, and disabled announcements with page and schedule details.
                  </p>
                </div>
              </div>

              <div className="announcement-register-controls">
                <div className="announcement-filter-pills">
                  {[
                    ['all', 'All'],
                    ['live', 'Live'],
                    ['scheduled', 'Scheduled'],
                    ['expired', 'Expired'],
                    ['disabled', 'Disabled'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`announcement-filter-pill ${statusFilter === value ? 'active' : ''}`}
                      onClick={() => setStatusFilter(value)}
                    >
                      <span>{label}</span>
                      <span className="announcement-filter-count">{announcementStatusCounts[value]}</span>
                    </button>
                  ))}
                </div>

                <div className="announcement-register-toolbar">
                  <input
                    type="text"
                    className="announcement-register-search"
                    placeholder="Search by message or page..."
                    value={listQuery}
                    onChange={(event) => setListQuery(event.target.value)}
                  />
                  <select
                    className="announcement-register-page-filter"
                    value={listPageFilter}
                    onChange={(event) => setListPageFilter(event.target.value)}
                  >
                    <option value="all">All pages</option>
                    {payload.page_catalog.map((page) => (
                      <option key={page.page_key} value={page.page_key}>
                        {page.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="announcement-register-table-wrap">
                {filteredAnnouncements.length ? (
                  <div className="announcement-register-table">
                    <div className="announcement-register-head">
                      <span>Message</span>
                      <span>Pages</span>
                      <span>Start</span>
                      <span>End</span>
                      <span>Status</span>
                      <span>Actions</span>
                    </div>
                    {filteredAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="announcement-register-row">
                        <div className="announcement-register-message">
                          <strong>{announcement.message}</strong>
                        </div>
                        <div className="announcement-register-pages">
                          {(announcement.page_labels || []).map((label) => (
                            <span key={`${announcement.id}-${label}`} className="announcement-page-pill">{label}</span>
                          ))}
                        </div>
                        <div className="announcement-register-datetime">
                          {new Date(announcement.start_at).toLocaleString()}
                        </div>
                        <div className="announcement-register-datetime">
                          {new Date(announcement.end_at).toLocaleString()}
                        </div>
                        <div>
                          <span className={`announcement-status ${announcement.status}`}>{announcement.status}</span>
                        </div>
                        <div className="announcement-actions">
                          <button className="btn-edit" type="button" onClick={() => handleEdit(announcement)}>
                            <i className="fas fa-pen"></i>
                            Edit
                          </button>
                          <button className="btn-delete" type="button" onClick={() => handleDelete(announcement.id)}>
                            <i className="fas fa-trash"></i>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="legal-history-empty">No announcements match the current filters.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
