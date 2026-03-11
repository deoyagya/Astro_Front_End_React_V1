/**
 * AdminSurveyListPage — List all survey forms with CRUD actions.
 *
 * Phase 51: Survey/Feedback Form Builder.
 * Thin admin wrapper — delegates to API and navigates to builder.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import '../../styles/admin.css';

const STATUS_COLORS = {
  draft: '#6c757d',
  live: '#28a745',
  closed: '#dc3545',
};

export default function AdminSurveyListPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  const loadSurveys = useCallback(async () => {
    try {
      const data = await api.get('/v1/admin/surveys');
      setSurveys(data.forms || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSurveys(); }, [loadSurveys]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePublish = async (formId) => {
    try {
      await api.post(`/v1/admin/surveys/${formId}/publish`, {});
      setToast({ message: 'Survey published!', type: 'success' });
      loadSurveys();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleClose = async (formId) => {
    try {
      await api.post(`/v1/admin/surveys/${formId}/close`, {});
      setToast({ message: 'Survey closed.', type: 'success' });
      loadSurveys();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (formId) => {
    try {
      await api.delete(`/v1/admin/surveys/${formId}`);
      setToast({ message: 'Survey deleted.', type: 'success' });
      setConfirmDelete(null);
      loadSurveys();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const publicUrl = (slug) => {
    const base = window.location.origin;
    return `${base}/survey/${slug}`;
  };

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: 0, color: '#e6edf3', fontSize: 24 }}>
                <i className="fas fa-poll-h" style={{ marginRight: 10, color: '#7b5bff' }}></i>
                Survey Manager
              </h1>
              <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: 14 }}>
                Create, manage, and analyze feedback forms
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/surveys/create')}
              style={{
                background: '#7b5bff', color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: 6 }}></i> New Survey
            </button>
          </div>

          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: 20, right: 20, zIndex: 9999,
              background: toast.type === 'success' ? '#28a745' : '#dc3545',
              color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {toast.message}
            </div>
          )}

          {/* Loading / Error */}
          {loading && <p style={{ color: '#8b949e', textAlign: 'center' }}>Loading surveys...</p>}
          {error && <p style={{ color: '#dc3545', textAlign: 'center' }}>{error}</p>}

          {/* Empty state */}
          {!loading && !error && surveys.length === 0 && (
            <div style={{
              textAlign: 'center', padding: 60, background: '#161b22',
              borderRadius: 12, border: '1px solid #30363d',
            }}>
              <i className="fas fa-clipboard-list" style={{ fontSize: 48, color: '#30363d', marginBottom: 16 }}></i>
              <p style={{ color: '#8b949e', fontSize: 16 }}>No surveys yet. Create your first one!</p>
            </div>
          )}

          {/* Survey table */}
          {!loading && surveys.length > 0 && (
            <div style={{ background: '#161b22', borderRadius: 12, border: '1px solid #30363d', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#c9d1d9' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #30363d' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8b949e', fontWeight: 600 }}>Title</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#8b949e', fontWeight: 600 }}>Slug</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8b949e', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8b949e', fontWeight: 600 }}>Questions</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#8b949e', fontWeight: 600 }}>Responses</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#8b949e', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #21262d' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{s.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {s.status === 'live' ? (
                          <a
                            href={publicUrl(s.slug)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#58a6ff', textDecoration: 'none' }}
                          >
                            {s.slug} <i className="fas fa-external-link-alt" style={{ fontSize: 10 }}></i>
                          </a>
                        ) : (
                          <span style={{ color: '#6e7681' }}>{s.slug}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          background: STATUS_COLORS[s.status] || '#6c757d',
                          color: '#fff', padding: '2px 10px', borderRadius: 12,
                          fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {(s.questions || []).length}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {s.submission_count ?? 0}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => navigate(`/admin/surveys/${s.id}/edit`)}
                            title="Edit"
                            style={btnStyle}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {s.status === 'draft' && (
                            <button onClick={() => handlePublish(s.id)} title="Publish" style={{ ...btnStyle, color: '#28a745' }}>
                              <i className="fas fa-rocket"></i>
                            </button>
                          )}
                          {s.status === 'live' && (
                            <button onClick={() => handleClose(s.id)} title="Close" style={{ ...btnStyle, color: '#ffc107' }}>
                              <i className="fas fa-lock"></i>
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/surveys/${s.id}/edit`, { state: { tab: 'stats' } })}
                            title="Stats"
                            style={{ ...btnStyle, color: '#58a6ff' }}
                          >
                            <i className="fas fa-chart-bar"></i>
                          </button>
                          <button
                            onClick={() => setConfirmDelete(s.id)}
                            title="Delete"
                            style={{ ...btnStyle, color: '#dc3545' }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete confirmation modal */}
          {confirmDelete && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
            }}>
              <div style={{
                background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
                padding: 30, maxWidth: 400, textAlign: 'center',
              }}>
                <p style={{ color: '#e6edf3', fontSize: 16, marginBottom: 20 }}>
                  Are you sure you want to delete this survey?
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{ ...btnStyle, padding: '8px 20px', background: '#21262d', borderRadius: 6 }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDelete)}
                    style={{ ...btnStyle, padding: '8px 20px', background: '#dc3545', borderRadius: 6, color: '#fff' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

const btnStyle = {
  background: 'transparent', border: 'none', color: '#8b949e',
  cursor: 'pointer', fontSize: 14, padding: '4px 8px',
};
