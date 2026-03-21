import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageShell from '../components/PageShell';
import ReportLandingPage from '../components/ReportLandingPage';
import { useSharedEffects } from '../hooks/useSharedEffects';

export default function ProductReportLandingPage({ slug, defaultActiveNav = 'reports' }) {
  useSharedEffects();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get(`/v1/reports/products/${slug}/landing`)
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load report details');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <PageShell activeNav={config?.activeNav || defaultActiveNav}>
      {loading && (
        <section className="rpl-section">
          <div className="rpl-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#8b6cff' }}></i>
            <p style={{ marginTop: '1rem', color: '#bfc3d9' }}>Loading report details...</p>
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="rpl-section">
          <div className="rpl-container" style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ff6b81' }}></i>
            <p style={{ marginTop: '1rem', color: '#ffb5c4' }}>{error}</p>
          </div>
        </section>
      )}

      {!loading && !error && config && <ReportLandingPage config={config} />}
    </PageShell>
  );
}
