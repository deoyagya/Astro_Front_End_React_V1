import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { api } from '../api/client';

export default function ReportsPage() {
  useSharedEffects();
  const navigate = useNavigate();
  const [sampleReport, setSampleReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch report catalog from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get('/v1/reports/catalog')
      .then((res) => {
        if (!cancelled) {
          setReports(res.reports || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load reports');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const getCart = () => {
    const parsed = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  };

  const addToCart = (report) => {
    const cart = getCart();
    if (!cart.some((item) => item.id === report.id)) {
      cart.push({ id: report.id, name: report.title, price: report.price, icon: report.icon });
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  };

  const orderReport = (report) => {
    addToCart(report);
    setSampleReport(null);
    navigate('/order');
  };

  const orderBundle = () => {
    const cart = getCart();
    reports.forEach((r) => {
      if (!cart.some((item) => item.id === r.id)) {
        cart.push({ id: r.id, name: r.title, price: r.price, icon: r.icon });
      }
    });
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/order');
  };

  // Calculate bundle pricing from API data
  const totalPrice = reports.reduce((sum, r) => sum + r.price, 0);
  const bundleDiscount = 0.4; // 40% off
  const bundlePrice = Math.round(totalPrice * (1 - bundleDiscount));

  return (
    <PageShell activeNav="reports">
      <section className="reports-section">
        <div className="container">
          <div className="section-header">
            <h2>Life Area Reports</h2>
            <p>
              Choose a detailed astrological report tailored to your specific life questions.
              Each report includes planetary analysis, dasha timing, and personalized recommendations.
            </p>
            <p className="sample-note">
              <i className="fas fa-eye"></i> Click &quot;View Sample&quot; to see a preview of what each report reveals
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="api-loading" style={{ textAlign: 'center', padding: '3rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#ffa502' }}></i>
              <p style={{ marginTop: '1rem', color: '#ccc' }}>Loading reports...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="api-error" style={{ textAlign: 'center', padding: '2rem' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ff4757' }}></i>
              <p style={{ marginTop: '1rem', color: '#ff4757' }}>{error}</p>
            </div>
          )}

          {/* Reports Grid */}
          {!loading && !error && reports.length > 0 && (
            <>
              <div className="reports-grid">
                {reports.map((report) => (
                  <div className="report-card" key={report.id} id={report.id}>
                    {report.badge && <div className="card-badge">{report.badge}</div>}
                    <div className="report-icon"><i className={`fas ${report.icon}`}></i></div>
                    <h3>{report.title}</h3>
                    <p className="report-desc">{report.desc}</p>
                    <div className="report-meta">
                      <span><i className="fas fa-calendar-alt"></i> {report.pages} pages</span>
                      <span><i className="fas fa-clock"></i> {report.delivery_hours || 24}hrs delivery</span>
                    </div>
                    <div className="report-price">₹{report.price.toLocaleString('en-IN')} INR</div>
                    <div className="report-actions">
                      <button className="btn-sample" onClick={() => setSampleReport(report)}>
                        <i className="fas fa-eye"></i> View Sample
                      </button>
                      <button className="btn-order" onClick={() => orderReport(report)}>
                        <i className="fas fa-file-invoice"></i> Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bundle Card */}
              <div className="bundle-card">
                <div className="bundle-content">
                  <h3><i className="fas fa-gift"></i> Complete Life Bundle</h3>
                  <p>Get all {reports.length} life area reports at 40% off + free personalized birth chart analysis</p>
                  <div className="bundle-price">
                    <span className="original">₹{totalPrice.toLocaleString('en-IN')}</span>
                    <span className="discounted">₹{bundlePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <button className="btn-bundle" onClick={orderBundle}>Order Complete Bundle</button>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && !error && reports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <i className="fas fa-file-alt" style={{ fontSize: '2rem' }}></i>
              <p style={{ marginTop: '1rem' }}>No reports available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sample Modal */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
      <div className={`modal${sampleReport ? ' show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setSampleReport(null); }}>
        {sampleReport && (
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSampleReport(null)}>
              <i className="fas fa-times"></i>
            </button>

            <div className="sample-header">
              <i className={`fas ${sampleReport.icon}`}></i>
              <h2>{sampleReport.title} — Sample Preview</h2>
            </div>

            {/* Critical areas of concern — shown first */}
            {sampleReport.warnings && sampleReport.warnings.length > 0 && (
              <div className="sample-warning">
                <h3><i className="fas fa-exclamation-triangle"></i> Critical Areas of Concern</h3>
                <ul>
                  {sampleReport.warnings.map((w, i) => (
                    <li key={i}><i className="fas fa-exclamation-circle"></i> {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key highlights */}
            {sampleReport.highlights && sampleReport.highlights.length > 0 && (
              <div className="sample-remedies" style={{ marginBottom: '25px' }}>
                <h3><i className="fas fa-star"></i> Report Highlights</h3>
                <ul>
                  {sampleReport.highlights.map((h, i) => (
                    <li key={i}><i className="fas fa-check-circle"></i> {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Planet analysis preview */}
            {sampleReport.planets && sampleReport.planets.length > 0 && (
              <div className="sample-planets">
                <h3>Key Planetary Analysis</h3>
                <div className="planet-grid">
                  {sampleReport.planets.map((p, i) => (
                    <div className={`planet-item ${p.status}`} key={i}>
                      <strong>{p.name}</strong> in {p.house}
                      <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>{p.effect}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remedies preview */}
            {sampleReport.remedies && sampleReport.remedies.length > 0 && (
              <div className="sample-remedies">
                <h3><i className="fas fa-shield-heart"></i> Included Remedies</h3>
                <ul>
                  {sampleReport.remedies.map((r, i) => (
                    <li key={i}><i className="fas fa-check-circle"></i> {r}</li>
                  ))}
                </ul>
                <p style={{ color: '#ffa502', marginTop: '15px' }}>
                  <i className="fas fa-lock"></i> 12+ more personalized remedies in full report
                </p>
              </div>
            )}

            <div className="sample-footer">
              <p>
                {sampleReport.footerNote || 'This is a sample preview. The full report includes personalized analysis based on your exact birth chart with complete remedies and timing windows.'}
              </p>
              <button className="btn-order" onClick={() => orderReport(sampleReport)}>
                <i className="fas fa-file-invoice"></i> Order Full Report — ₹{sampleReport.price.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
