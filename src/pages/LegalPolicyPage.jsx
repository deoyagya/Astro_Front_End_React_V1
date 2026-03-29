import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import PageShell from '../components/PageShell';
import { api } from '../api/client';
import { LEGAL_POLICY_META, formatPolicyDate } from '../lib/legalPolicies';

const SLUG_TO_POLICY_TYPE = {
  privacy: 'privacy_policy',
  terms: 'terms_of_use',
};

export default function LegalPolicyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const policyType = SLUG_TO_POLICY_TYPE[slug];
  const meta = policyType ? LEGAL_POLICY_META[policyType] : null;
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPolicy = useCallback(async () => {
    if (!policyType) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/v1/legal-policies/latest/${policyType}`);
      setPayload(data);
    } catch (err) {
      setError(err.message || 'Failed to load the policy.');
    } finally {
      setLoading(false);
    }
  }, [policyType]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const previewHtml = useMemo(() => DOMPurify.sanitize(payload?.latest_version?.html_content || ''), [payload]);

  if (!meta) {
    return (
      <PageShell activeNav="home">
        <section className="container" style={{ padding: '64px 0', color: '#fff' }}>
          Unsupported policy page.
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="home">
      <section className="container" style={{ padding: '54px 0 72px' }}>
        <div
          style={{
            display: 'grid',
            gap: 18,
            background: 'rgba(15,23,42,0.88)',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 24,
            padding: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className={`fas ${meta.icon}`} style={{ color: '#f59e0b' }}></i>
                {meta.label}
              </h1>
              <p style={{ margin: '10px 0 0', color: '#cbd5e1' }}>
                Review the latest published version of this policy.
              </p>
            </div>
            <button className="btn-admin-add" type="button" onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }
              try {
                window.close();
              } catch {
                navigate('/');
              }
            }}>
              <i className="fas fa-xmark"></i>
              Close Page
            </button>
          </div>

          {loading ? (
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading {meta.shortLabel.toLowerCase()} policy...</p>
            </div>
          ) : error ? (
            <div className="admin-toast error" style={{ position: 'static' }}>{error}</div>
          ) : !payload?.available ? (
            <div
              style={{
                background: 'rgba(248,113,113,0.12)',
                color: '#fecaca',
                borderRadius: 16,
                padding: 18,
              }}
            >
              No published version is available yet.
            </div>
          ) : (
            <>
              <div style={{ color: '#cbd5e1' }}>
                Version <strong>{payload.latest_version.version_label}</strong> | Initial creation {formatPolicyDate(payload.latest_version.initial_created_at)} | Last modified {formatPolicyDate(payload.latest_version.modified_at)}
              </div>
              <div
                style={{
                  background: '#fff',
                  color: '#0f172a',
                  borderRadius: 18,
                  padding: '28px 30px',
                  lineHeight: 1.75,
                }}
              >
                <div className="legal-policy-render" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
