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
import '../../styles/admin-survey-builder.css';

export default function AdminSurveyBuilderPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = location.state?.tab || 'builder';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [formMeta, setFormMeta] = useState(null);

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

  useEffect(() => {
    if (!formId) {
      setFormMeta(null);
      return;
    }
    apiGet(formId)
      .then((data) => setFormMeta(data))
      .catch(() => {});
  }, [formId, apiGet]);

  const handleSaved = (savedForm) => {
    setFormMeta(savedForm || null);
    // After creating a new form, navigate to edit mode
    if (!formId && savedForm?.id) {
      navigate(`/admin/surveys/${savedForm.id}/edit`, { replace: true });
    }
  };

  const handlePublished = () => {
    navigate('/admin/surveys');
  };

  const publicUrl = formMeta?.slug ? `${window.location.origin}/survey/${formMeta.slug}` : '';

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      window.prompt('Copy survey link', publicUrl);
    }
  };

  const handleExport = () => {
    if (!formId) return;
    window.open(`${api.baseUrl}/v1/admin/surveys/${formId}/export`, '_blank', 'noopener,noreferrer');
  };

  return (
    <PageShell activeNav="admin">
      <div className="admin-page">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px' }}>
          <div className="asb-breadcrumb">
            <button
              onClick={() => navigate('/admin/surveys')}
              className="asb-breadcrumb-btn"
            >
              <i className="fas fa-arrow-left"></i> Back to Surveys
            </button>
          </div>

          <div className="asb-hero">
            <div>
              <h1>{formId ? 'Edit Survey Form' : 'Create Survey Form'}</h1>
              <p>
                Design the form experience, publish it, review submissions, and export responses from one workspace.
              </p>
            </div>
            <div className="asb-hero-actions">
              {formId && publicUrl && (
                <>
                  <button className="asb-action-btn" onClick={handleCopyLink}>
                    <i className="fas fa-link"></i> Copy Public Link
                  </button>
                  <a className="asb-action-btn" href={publicUrl} target="_blank" rel="noreferrer">
                    <i className="fas fa-external-link-alt"></i> Open Public Survey
                  </a>
                </>
              )}
              {formId && (
                <button className="asb-action-btn asb-action-btn-primary" onClick={handleExport}>
                  <i className="fas fa-file-export"></i> Export CSV
                </button>
              )}
            </div>
          </div>

          <div className="asb-summary-grid">
            <div className="asb-summary-card">
              <span className="asb-summary-label">Status</span>
              <strong className={`asb-status ${formMeta?.status || 'draft'}`}>{formMeta?.status || 'draft'}</strong>
            </div>
            <div className="asb-summary-card">
              <span className="asb-summary-label">Questions</span>
              <strong>{formMeta?.questions?.length ?? 'Drafting'}</strong>
            </div>
            <div className="asb-summary-card">
              <span className="asb-summary-label">Responses</span>
              <strong>{stats?.total_submissions ?? 0}</strong>
            </div>
          </div>

          {/* Tab switcher (only when editing existing form) */}
          {formId && (
            <div className="asb-tabs">
              {['builder', 'stats', 'submissions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`asb-tab ${activeTab === tab ? 'active' : ''}`}
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
            <div className="asb-submissions-panel">
              {submissions.length === 0 ? (
                <p className="asb-empty">
                  No submissions yet.
                </p>
              ) : (
                <table className="asb-submissions-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Submitted At</th>
                      <th>Email</th>
                      <th>Responses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, idx) => (
                      <tr key={sub.id}>
                        <td>{idx + 1}</td>
                        <td>
                          {new Date(sub.submitted_at).toLocaleString()}
                        </td>
                        <td>{sub.respondent_email || '—'}</td>
                        <td>
                          <code className="asb-response-code">
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
