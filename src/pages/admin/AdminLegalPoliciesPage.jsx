import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../../styles/admin.css';
import '../../styles/admin-legal.css';
import PageShell from '../../components/PageShell';
import AdminRichTextEditor from '../../components/admin/AdminRichTextEditor';
import { api } from '../../api/client';
import { LEGAL_POLICY_META, formatPolicyDate } from '../../lib/legalPolicies';

function nextVersionLabel(latestVersion) {
  if (!latestVersion) return '1.0';
  return `${Number(latestVersion.version_number || 0) + 1}.0`;
}

function resolvePolicyMeta(policySummary) {
  const known = LEGAL_POLICY_META[policySummary?.policy_type];
  if (known) return known;
  return {
    label: policySummary?.label || 'Policy',
    shortLabel: policySummary?.label || 'Policy',
    icon: 'fa-file-lines',
    publicPath: policySummary?.public_path || '/legal',
  };
}

export default function AdminLegalPoliciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [indexPayload, setIndexPayload] = useState({ policies: [] });
  const [editorPayload, setEditorPayload] = useState(null);
  const [historyPayload, setHistoryPayload] = useState(null);
  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [indexLoading, setIndexLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedPolicyType = searchParams.get('policy') || '';
  const requestedTab = searchParams.get('tab');
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'edit';

  const selectedPolicySummary = useMemo(
    () => indexPayload.policies.find((policy) => policy.policy_type === selectedPolicyType) || null,
    [indexPayload.policies, selectedPolicyType],
  );
  const meta = resolvePolicyMeta(selectedPolicySummary);

  const updateSearch = useCallback((policyType, tab) => {
    setSearchParams({ policy: policyType, tab }, { replace: true });
  }, [setSearchParams]);

  const hydrateDraft = useCallback((data, fallbackLabel) => {
    const base = data?.latest_version || data?.starter_template;
    setTitle(base?.title || fallbackLabel || '');
    setHtmlContent(base?.html_content || '');
    setChangeSummary('');
    setNotifyUsers(true);
  }, []);

  const fetchIndex = useCallback(async () => {
    setIndexLoading(true);
    setError('');
    try {
      const data = await api.get('/v1/admin/legal-policies');
      setIndexPayload(data);
    } catch (err) {
      setError(err.message || 'Failed to load legal policies.');
    } finally {
      setIndexLoading(false);
    }
  }, []);

  const fetchWorkspace = useCallback(async (policyType, policyLabel) => {
    if (!policyType) return;
    setWorkspaceLoading(true);
    setError('');
    try {
      const [editorData, historyData] = await Promise.all([
        api.get(`/v1/admin/legal-policies/${policyType}`),
        api.get(`/v1/admin/legal-policies/${policyType}/history`),
      ]);
      setEditorPayload(editorData);
      setHistoryPayload(historyData);
      hydrateDraft(editorData, policyLabel);
    } catch (err) {
      setError(err.message || 'Failed to load selected policy workspace.');
    } finally {
      setWorkspaceLoading(false);
    }
  }, [hydrateDraft]);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  useEffect(() => {
    if (!indexPayload.policies.length) return;
    const policyExists = indexPayload.policies.some((policy) => policy.policy_type === selectedPolicyType);
    const resolvedPolicy = policyExists ? selectedPolicyType : indexPayload.policies[0].policy_type;
    const resolvedTab = requestedTab === 'history' ? 'history' : 'edit';
    if (resolvedPolicy !== selectedPolicyType || requestedTab !== resolvedTab) {
      updateSearch(resolvedPolicy, resolvedTab);
    }
  }, [indexPayload.policies, requestedTab, selectedPolicyType, updateSearch]);

  useEffect(() => {
    if (!selectedPolicySummary) return;
    fetchWorkspace(selectedPolicySummary.policy_type, selectedPolicySummary.label);
  }, [fetchWorkspace, selectedPolicySummary]);

  const handleSave = async () => {
    if (!selectedPolicySummary) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.post(`/v1/admin/legal-policies/${selectedPolicySummary.policy_type}`, {
        title,
        html_content: htmlContent,
        change_summary: changeSummary,
        notify_users: notifyUsers,
      });
      setSuccess(`Saved ${meta.label} version ${result.version_label}.`);
      await Promise.all([fetchIndex(), fetchWorkspace(selectedPolicySummary.policy_type, selectedPolicySummary.label)]);
    } catch (err) {
      setError(err.message || 'Failed to save policy version.');
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => {
    if (!editorPayload) return;
    hydrateDraft(editorPayload, meta.label);
    setSuccess('');
    setError('');
  };

  const loading = indexLoading || workspaceLoading;

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="admin-header">
          <div className="legal-admin-header">
            <div>
              <h1><i className="fas fa-balance-scale" style={{ marginRight: 10 }}></i>Policy Management</h1>
              <p>
                Manage one policy at a time. Use the selector to switch documents, then choose whether you want to edit
                the next version or inspect version history.
              </p>
            </div>
            <div className="legal-admin-header-actions">
              <button className="btn-admin-add" type="button" onClick={fetchIndex} disabled={loading}>
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-rotate'}`}></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && <div className="admin-toast error" style={{ position: 'static', marginBottom: 18 }}>{error}</div>}
        {success && <div className="admin-toast success" style={{ position: 'static', marginBottom: 18 }}>{success}</div>}

        {indexLoading && !indexPayload.policies.length ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading policy workspace...</p>
          </div>
        ) : indexPayload.policies.length ? (
          <div className="legal-admin-shell">
            <div className="legal-panel">
              <div className="legal-workspace-toolbar">
                <div className="legal-select-field">
                  <label htmlFor="policy-selector">Policy</label>
                  <select
                    id="policy-selector"
                    className="legal-select"
                    value={selectedPolicySummary?.policy_type || ''}
                    onChange={(event) => updateSearch(event.target.value, activeTab)}
                  >
                    {indexPayload.policies.map((policy) => (
                      <option key={policy.policy_type} value={policy.policy_type}>
                        {policy.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="legal-tabs" role="tablist" aria-label="Policy workspace mode">
                  <button
                    type="button"
                    className={`legal-tab ${activeTab === 'edit' ? 'active' : ''}`}
                    onClick={() => updateSearch(selectedPolicySummary?.policy_type || '', 'edit')}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`legal-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => updateSearch(selectedPolicySummary?.policy_type || '', 'history')}
                  >
                    History
                  </button>
                </div>
              </div>

              <div className="legal-inline-metrics">
                <div className="legal-inline-metric">
                  <span>Selected policy</span>
                  <strong>{meta.label}</strong>
                </div>
                <div className="legal-inline-metric">
                  <span>Current version</span>
                  <strong>{selectedPolicySummary?.latest_version?.version_label || 'None yet'}</strong>
                </div>
                <div className="legal-inline-metric">
                  <span>History records</span>
                  <strong>{selectedPolicySummary?.history_count || 0}</strong>
                </div>
                <div className="legal-inline-metric">
                  <span>Public page</span>
                  <strong>{meta.publicPath}</strong>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading selected policy...</p>
              </div>
            ) : activeTab === 'edit' ? (
              <div className="legal-panel">
                <div className="legal-panel-header">
                  <div>
                    <h2 className="legal-panel-title">Edit {meta.label}</h2>
                    <p className="legal-panel-subtitle">
                      Current version: {editorPayload?.latest_version?.version_label || 'None yet'} | Next version: {nextVersionLabel(editorPayload?.latest_version)}
                    </p>
                  </div>
                  <div className="legal-admin-header-actions">
                    <button className="btn-edit" type="button" onClick={resetDraft} disabled={saving}>
                      <i className="fas fa-rotate-left"></i>
                      Reset Draft
                    </button>
                    <button className="btn-admin-add" type="button" onClick={handleSave} disabled={saving}>
                      <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                      Save New Version
                    </button>
                  </div>
                </div>

                <div className="legal-panel-stack">
                  <div className="legal-field">
                    <label htmlFor="legal-policy-title">Policy title</label>
                    <input
                      id="legal-policy-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={editorPayload?.starter_template?.title || meta.label}
                    />
                  </div>

                  <div className="legal-field">
                    <label htmlFor="legal-policy-summary">Change summary</label>
                    <textarea
                      id="legal-policy-summary"
                      value={changeSummary}
                      onChange={(event) => setChangeSummary(event.target.value)}
                      placeholder="Describe what changed in this version."
                      rows={4}
                    />
                  </div>

                  <label className="legal-toggle">
                    <input
                      type="checkbox"
                      checked={notifyUsers}
                      onChange={(event) => setNotifyUsers(event.target.checked)}
                    />
                    <div>
                      <strong>Email registered users after publish</strong>
                      <span>The update email will include a direct link to the latest published policy page.</span>
                    </div>
                  </label>

                  <AdminRichTextEditor value={htmlContent} onChange={setHtmlContent} minHeight={620} />

                  <div className="legal-policy-actions">
                    <a className="btn-edit" href={meta.publicPath} target="_blank" rel="noreferrer">
                      <i className="fas fa-up-right-from-square"></i>
                      Open Current Public Page
                    </a>
                    <button className="btn-edit" type="button" onClick={() => updateSearch(selectedPolicySummary.policy_type, 'history')}>
                      <i className="fas fa-clock-rotate-left"></i>
                      Open Version History
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="legal-panel">
                <div className="legal-panel-header">
                  <div>
                    <h2 className="legal-panel-title">{meta.label} History</h2>
                    <p className="legal-panel-subtitle">Open any saved version on its own read-only review page.</p>
                  </div>
                </div>

                <div className="legal-panel-stack">
                  {historyPayload?.versions?.length ? historyPayload.versions.map((version) => (
                    <div key={version.id} className="legal-history-row">
                      <div className="legal-history-row-main">
                        <strong>Version {version.version_label}</strong>
                        <span>{version.title}</span>
                      </div>
                      <div className="legal-history-row-meta">
                        <span>Modified {formatPolicyDate(version.modified_at)}</span>
                        <span>Notified users: {version.notification_recipient_count || 0}</span>
                      </div>
                      <div className="legal-policy-actions">
                        <Link className="btn-edit" to={`/admin/legal-policies/${selectedPolicySummary.policy_type}/history/${version.id}`}>
                          <i className="fas fa-eye"></i>
                          View Record
                        </Link>
                      </div>
                    </div>
                  )) : (
                    <div className="legal-history-empty">No versions saved yet for this policy.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="legal-history-empty">No policy definitions are available.</div>
        )}
      </section>
    </PageShell>
  );
}
