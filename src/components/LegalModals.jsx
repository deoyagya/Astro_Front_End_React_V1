import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { useLegalModal } from '../context/LegalModalContext';
import { api } from '../api/client';
import { LEGAL_POLICY_META, formatPolicyDate } from '../lib/legalPolicies';

function PolicyModal({ isOpen, onClose, meta, payload, loading, error }) {
  const version = payload?.latest_version;
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(version?.html_content || ''),
    [version?.html_content],
  );

  return (
    <div className={`modal${isOpen ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 900 }}>
        <button type="button" className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        <h2>{meta.label}</h2>
        <div className="modal-body">
          {loading ? (
            <p>Loading latest {meta.shortLabel.toLowerCase()} policy...</p>
          ) : error ? (
            <p>{error}</p>
          ) : !payload?.available ? (
            <p>No published version is available yet.</p>
          ) : (
            <>
              <p style={{ color: '#94a3b8' }}>
                Version {version.version_label} | Initial creation {formatPolicyDate(version.initial_created_at)} | Last updated {formatPolicyDate(version.modified_at)}
              </p>
              <div className="legal-policy-render" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
              <p style={{ marginTop: 18 }}>
                <a href={meta.publicPath} style={{ color: '#7b5bff' }}>Open the full policy page</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegalModals() {
  const { activeModal, closeModal } = useLegalModal();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeModal) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get('/v1/legal-policies/bundle')
      .then((data) => {
        if (!cancelled) setBundle(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load legal policies.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeModal]);

  return (
    <>
      <PolicyModal
        isOpen={activeModal === 'terms'}
        onClose={closeModal}
        meta={LEGAL_POLICY_META.terms_of_use}
        payload={bundle?.terms_of_use}
        loading={loading}
        error={error}
      />
      <PolicyModal
        isOpen={activeModal === 'privacy'}
        onClose={closeModal}
        meta={LEGAL_POLICY_META.privacy_policy}
        payload={bundle?.privacy_policy}
        loading={loading}
        error={error}
      />
    </>
  );
}
