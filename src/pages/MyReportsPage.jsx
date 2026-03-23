import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ApiError from '../components/ApiError';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { api } from '../api/client';
import '../styles/report-pages.css';

/* Map report type IDs to display info */
const REPORT_TYPE_MAP = {
  kundli: { icon: 'fa-chart-pie', label: 'Birth Chart (Kundli)' },
  life_reading: { icon: 'fa-scroll', label: 'Life Reading Report' },
  career: { icon: 'fa-briefcase', label: 'Career & Finance Report' },
  love: { icon: 'fa-heart', label: 'Love & Marriage Report' },
  marriage: { icon: 'fa-ring', label: 'Marriage / Partnership / Married Life Report' },
  manglik: { icon: 'fa-fire', label: 'Manglik Dosha Analysis & Remedies' },
  'birth-chart-analysis': { icon: 'fa-chart-pie', label: 'Complete Birth Chart Analysis' },
  'sade-sati': { icon: 'fa-moon', label: 'Shani Sade Sati Report' },
  temporal_forecast: { icon: 'fa-hourglass-half', label: 'Threat and Opportunity Report' },
  education: { icon: 'fa-brain', label: 'Education & Intelligence Report' },
  health: { icon: 'fa-spa', label: 'Health & Wellness Report' },
  spiritual: { icon: 'fa-om', label: 'Spiritual Growth Report' },
  family: { icon: 'fa-home', label: 'Family & Children Report' },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export default function MyReportsPage() {
  useSharedEffects();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null); // report ID currently downloading

  /* Fetch user's report files on mount */
  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await api.get('/v1/reports/my');
        setReports(data);
      } catch (err) {
        setError(err.message || 'Failed to load your reports.');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  /* Handle PDF download */
  const handleDownload = async (report) => {
    setDownloading(report.id);
    try {
      const filename = `${report.display_name.replace(/\s+/g, '_')}.pdf`;
      await api.download(`/v1/reports/${report.id}/download`, filename);
    } catch (err) {
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const getReportInfo = (type) =>
    REPORT_TYPE_MAP[type] || { icon: 'fa-file-pdf', label: type };

  return (
    <PageShell activeNav="my-reports">
      <div className="report-page">
        <div className="container">
          <div className="cart-header">
            <h1>My Reports</h1>
            <p className="subtitle">Download your purchased reports anytime</p>
          </div>

          {loading && (
            <div className="empty-cart">
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}></i>
              Loading your reports...
            </div>
          )}

          <ApiError message={error} onDismiss={() => setError('')} />

          {!loading && reports.length === 0 && !error && (
            <div className="empty-cart" style={{ padding: '60px 20px' }}>
              <i className="fas fa-file-download" style={{ fontSize: '3rem', color: '#9d7bff', marginBottom: '20px', display: 'block' }}></i>
              <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>No reports yet</p>
              <p style={{ fontSize: '0.95rem', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                Order your first astrological report and it will appear here for download.
              </p>
              <button
                className="btn"
                onClick={() => navigate('/reports')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-scroll"></i> Browse Reports
              </button>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="report-list">
              {reports.map((report) => {
                const info = getReportInfo(report.report_type);
                const isDownloading = downloading === report.id;

                return (
                  <div key={report.id} className="report-item">
                    <div className="report-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(123, 91, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <i className={`fas ${info.icon}`} style={{ color: '#9d7bff', fontSize: '1.2rem' }}></i>
                      </div>
                      <div>
                        <h3 style={{ marginBottom: '4px' }}>{report.display_name}</h3>
                        <p style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span><i className="fas fa-calendar-alt" style={{ marginRight: '4px' }}></i>{formatDate(report.generated_at)}</span>
                          <span><i className="fas fa-file" style={{ marginRight: '4px' }}></i>{formatFileSize(report.file_size)}</span>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexShrink: 0, marginLeft: '20px' }}>
                      <button
                        className="btn"
                        onClick={() => handleDownload(report)}
                        disabled={isDownloading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          fontSize: '0.9rem',
                          lineHeight: 1.1,
                          minWidth: 'auto',
                          width: 'auto',
                          margin: 0,
                          borderRadius: '10px',
                          whiteSpace: 'nowrap',
                          ...(isDownloading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                        }}
                      >
                        {isDownloading ? (
                          <><i className="fas fa-spinner fa-spin"></i>Downloading...</>
                        ) : (
                          <><i className="fas fa-download"></i>Download PDF</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Browse more reports CTA */}
          {!loading && reports.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/reports')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-plus-circle"></i> Order More Reports
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
