import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import '../../styles/admin.css';
import '../../styles/admin-legal.css';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';
import { LEGAL_POLICY_META, formatPolicyDate } from '../../lib/legalPolicies';

export default function AdminLegalPolicyVersionViewPage() {
  const { policyType, versionId } = useParams();
  const meta = LEGAL_POLICY_META[policyType];
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVersion = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/v1/admin/legal-policies/${policyType}/history`);
      const matched = data?.versions?.find((item) => item.id === versionId) || null;
      if (!matched) {
        throw new Error('Version record not found.');
      }
      setVersion(matched);
    } catch (err) {
      setError(err.message || 'Failed to load the policy version.');
    } finally {
      setLoading(false);
    }
  }, [policyType, versionId]);

  useEffect(() => {
    if (meta) fetchVersion();
  }, [fetchVersion, meta]);

  const safeHtml = useMemo(() => DOMPurify.sanitize(version?.html_content || ''), [version?.html_content]);

  if (!meta) {
    return (
      <PageShell activeNav="admin">
        <section className="admin-page">
          <div className="admin-empty">Unsupported legal policy type.</div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="admin">
      <section className="admin-page">
        <div className="admin-breadcrumb">
          <Link to="/admin/legal-policies">Legal Policies</Link>
          <span className="sep">/</span>
          <Link to={`/admin/legal-policies/${policyType}`}>{meta.label}</Link>
          <span className="sep">/</span>
          <Link to={`/admin/legal-policies/${policyType}/history`}>Version History</Link>
          <span className="sep">/</span>
          <span>Read Only View</span>
        </div>

        <div className="admin-header">
          <div className="legal-admin-header">
            <div>
              <h1><i className="fas fa-file-lines" style={{ marginRight: 10 }}></i>Read-Only Policy Record</h1>
              <p>This screen is only for reviewing one saved legal version at a time. It does not allow editing.</p>
            </div>
            <div className="legal-admin-header-actions">
              <Link className="btn-edit" to={`/admin/legal-policies/${policyType}/history`}>
                <i className="fas fa-arrow-left"></i>
                Back to History
              </Link>
              <Link className="btn-edit" to={`/admin/legal-policies/${policyType}`}>
                <i className="fas fa-pen-nib"></i>
                Open Editor
              </Link>
            </div>
          </div>
        </div>

        {error && <div className="admin-toast error" style={{ position: 'static', marginBottom: 18 }}>{error}</div>}

        {loading ? (
          <div className="admin-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading policy record...</p>
          </div>
        ) : version ? (
          <div className="legal-admin-shell">
            <div className="legal-panel">
              <div className="legal-panel-header">
                <div>
                  <h2 className="legal-panel-title">{version.title}</h2>
                  <p className="legal-panel-subtitle">
                    Version {version.version_label} | Initial creation {formatPolicyDate(version.initial_created_at)} | Modified {formatPolicyDate(version.modified_at)}
                  </p>
                </div>
                <span className="legal-policy-pill live">{version.version_label}</span>
              </div>

              <dl className="legal-meta-list">
                <div className="legal-meta-row">
                  <dt>Users notified</dt>
                  <dd>{version.notification_recipient_count || 0}</dd>
                </div>
                <div className="legal-meta-row">
                  <dt>Notification sent</dt>
                  <dd>{formatPolicyDate(version.notification_sent_at)}</dd>
                </div>
                <div className="legal-meta-row">
                  <dt>Record created</dt>
                  <dd>{formatPolicyDate(version.created_at)}</dd>
                </div>
              </dl>
            </div>

            <div className="legal-history-note">
              <strong style={{ display: 'block', marginBottom: 8, color: '#fff' }}>Change summary</strong>
              {version.change_summary || 'No change summary was provided for this version.'}
            </div>

            <div className="legal-preview-frame">
              <div className="legal-policy-render" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            </div>
          </div>
        ) : (
          <div className="legal-history-empty">The requested version could not be found.</div>
        )}
      </section>
    </PageShell>
  );
}
