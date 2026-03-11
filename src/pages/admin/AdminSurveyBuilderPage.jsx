/**
 * AdminSurveyBuilderPage — Thin wrapper over the reusable SurveyBuilder.
 *
 * Phase 51: Injects app-specific API functions into the library's
 * generic builder component. Follows AdminStyleManagerPage pattern.
 */

import { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { SurveyBuilder, SurveyStats } from '../../lib/survey-builder';
import { api } from '../../api/client';
import '../../styles/admin.css';

export default function AdminSurveyBuilderPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = location.state?.tab || 'builder';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // API callbacks injected into the reusable SurveyBuilder
  const apiCreate = useCallback(
    (body) => api.post('/v1/admin/surveys', body),
    [],
  );
  const apiUpdate = useCallback(
    (id, body) => api.put(`/v1/admin/surveys/${id}`, body),
    [],
  );
  const apiGet = useCallback(
    (id) => api.get(`/v1/admin/surveys/${id}`),
    [],
  );
  const apiPublish = useCallback(
    (id) => api.post(`/v1/admin/surveys/${id}/publish`, {}),
    [],
  );

  // Load stats + submissions when stats tab is active
  useEffect(() => {
    if (activeTab !== 'stats' || !formId) return;
    const load = async () => {
      try {
        const [s, sub] = await Promise.all([
          api.get(`/v1/admin/surveys/${formId}/stats`),
          api.get(`/v1/admin/surveys/${formId}/submissions`),
        ]);
        setStats(s);
        setSubmissions(sub.submissions || []);
      } catch (err) {
        console.error('Stats load failed:', err);
      }
    };
    load();
  }, [activeTab, formId]);

  const handleSaved = (savedForm) => {
    // After creating a new form, navigate to edit mode
    if (!formId && savedForm?.id) {
      navigate(`/admin/surveys/${savedForm.id}/edit`, { replace: true });
    }
  };

  const handlePublished = () => {
    navigate('/admin/surveys');
  };

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px' }}>
          {/* Back link */}
          <button
            onClick={() => navigate('/admin/surveys')}
            style={{
              background: 'transparent', border: 'none', color: '#8b949e',
              cursor: 'pointer', fontSize: 14, marginBottom: 12, padding: 0,
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: 6 }}></i> Back to Surveys
          </button>

          {/* Tab switcher (only when editing existing form) */}
          {formId && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {['builder', 'stats', 'submissions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? '#7b5bff' : '#21262d',
                    color: activeTab === tab ? '#fff' : '#8b949e',
                    border: 'none', borderRadius: 6, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'builder' && <i className="fas fa-edit" style={{ marginRight: 6 }}></i>}
                  {tab === 'stats' && <i className="fas fa-chart-bar" style={{ marginRight: 6 }}></i>}
                  {tab === 'submissions' && <i className="fas fa-list" style={{ marginRight: 6 }}></i>}
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Builder tab */}
          {activeTab === 'builder' && (
            <SurveyBuilder
              formId={formId || null}
              apiCreate={apiCreate}
              apiUpdate={apiUpdate}
              apiGet={apiGet}
              apiPublish={apiPublish}
              onSaved={handleSaved}
              onPublished={handlePublished}
            />
          )}

          {/* Stats tab */}
          {activeTab === 'stats' && formId && (
            stats ? (
              <SurveyStats stats={stats} />
            ) : (
              <p style={{ color: '#8b949e', textAlign: 'center', padding: 40 }}>
                Loading statistics...
              </p>
            )
          )}

          {/* Submissions tab */}
          {activeTab === 'submissions' && formId && (
            <div style={{
              background: '#161b22', borderRadius: 12, border: '1px solid #30363d',
              overflow: 'hidden',
            }}>
              {submissions.length === 0 ? (
                <p style={{ color: '#8b949e', textAlign: 'center', padding: 40 }}>
                  No submissions yet.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#c9d1d9' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #30363d' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Submitted At</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Responses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, idx) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #21262d' }}>
                        <td style={tdStyle}>{idx + 1}</td>
                        <td style={tdStyle}>
                          {new Date(sub.submitted_at).toLocaleString()}
                        </td>
                        <td style={tdStyle}>{sub.respondent_email || '—'}</td>
                        <td style={tdStyle}>
                          <code style={{ fontSize: 12, color: '#8b949e' }}>
                            {JSON.stringify(sub.responses).slice(0, 120)}
                            {JSON.stringify(sub.responses).length > 120 ? '...' : ''}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

const thStyle = {
  padding: '10px 14px', textAlign: 'left', color: '#8b949e',
  fontWeight: 600, fontSize: 12, textTransform: 'uppercase',
};
const tdStyle = { padding: '10px 14px' };
