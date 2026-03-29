import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ApiError from '../components/ApiError';
import { useSharedEffects } from '../hooks/useSharedEffects';
import { api } from '../api/client';
import '../styles/report-pages.css';

const REPORT_TYPE_MAP = {
  kundli: { icon: 'fa-chart-pie', label: 'Birth Chart (Kundli)' },
  life_reading: { icon: 'fa-scroll', label: 'Life Reading Report' },
  career: { icon: 'fa-briefcase', label: 'Career & Finance Report' },
  love: { icon: 'fa-heart', label: 'Love & Marriage Report' },
  marriage: { icon: 'fa-ring', label: 'Marriage / Partnership / Married Life Report' },
  money: { icon: 'fa-sack-dollar', label: 'Money / Finance / Wealth Report' },
  property: { icon: 'fa-house-chimney', label: 'Property / Vehicles / Assets Report' },
  manglik: { icon: 'fa-fire', label: 'Manglik Dosha Analysis & Remedies' },
  'birth-chart-analysis': { icon: 'fa-chart-pie', label: 'Complete Birth Chart Analysis' },
  'sade-sati': { icon: 'fa-moon', label: 'Shani Sade Sati Report' },
  temporal_forecast: { icon: 'fa-hourglass-half', label: 'Threat and Opportunity Report' },
  education: { icon: 'fa-brain', label: 'Education & Intelligence Report' },
  health: { icon: 'fa-spa', label: 'Health & Wellness Report' },
  spiritual: { icon: 'fa-om', label: 'Spiritual Growth Report' },
  family: { icon: 'fa-home', label: 'Family & Children Report' },
  foreign: { icon: 'fa-plane-departure', label: 'Foreign Travel / Settlement Report' },
  yearly_prediction_report: { icon: 'fa-calendar-days', label: 'Yearly Prediction Report' },
  monthly_prediction_report: { icon: 'fa-calendar-alt', label: 'Monthly Prediction Report' },
  daily_prediction_report: { icon: 'fa-sun', label: 'Daily Prediction Report' },
};

const TAB_CONFIG = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'One-time Reports' },
  { key: 'forecast', label: 'Forecasts' },
  { key: 'yearly', label: 'Yearly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'daily', label: 'Daily' },
  { key: 'processing', label: 'Processing' },
];

const STATUS_UI = {
  ready: { label: 'Ready', tone: 'success', icon: 'fa-circle-check' },
  processing: { label: 'Processing', tone: 'pending', icon: 'fa-spinner fa-spin' },
  failed: { label: 'Failed', tone: 'danger', icon: 'fa-triangle-exclamation' },
  skipped: { label: 'Skipped', tone: 'muted', icon: 'fa-forward' },
};

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-AU', {
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

function getReportInfo(type) {
  return REPORT_TYPE_MAP[type] || { icon: 'fa-file-pdf', label: type.replace(/_/g, ' ') };
}

function getCountForTab(tabKey, counts = {}) {
  if (tabKey === 'reports') return counts.one_time || 0;
  if (tabKey === 'forecast') return (counts.yearly || 0) + (counts.monthly || 0) + (counts.daily || 0);
  if (tabKey === 'yearly') return counts.yearly || 0;
  if (tabKey === 'monthly') return counts.monthly || 0;
  if (tabKey === 'daily') return counts.daily || 0;
  if (tabKey === 'processing') return (counts.processing || 0) + (counts.failed || 0);
  return counts.all || 0;
}

function matchesTab(item, activeTab) {
  if (activeTab === 'reports') return item.cadence === 'one_time';
  if (activeTab === 'forecast') return item.cadence !== 'one_time';
  if (activeTab === 'yearly') return item.cadence === 'yearly';
  if (activeTab === 'monthly') return item.cadence === 'monthly';
  if (activeTab === 'daily') return item.cadence === 'daily';
  if (activeTab === 'processing') return item.status === 'processing' || item.status === 'failed' || item.status === 'skipped';
  return true;
}

function getEmptyStateCopy(activeTab) {
  if (activeTab === 'forecast') {
    return {
      title: 'No forecasts yet',
      body: 'Your daily, monthly, and yearly prediction reports will appear here once they are generated.',
      ctaLabel: 'Open Subscription',
      ctaHref: '/my-data/subscription',
      icon: 'fa-calendar-days',
    };
  }
  if (activeTab === 'processing') {
    return {
      title: 'Nothing is processing right now',
      body: 'When a report is being generated or needs attention, it will appear in this tab.',
      ctaLabel: 'View All Reports',
      ctaHref: '/my-reports',
      icon: 'fa-clock',
    };
  }
  return {
    title: 'No reports yet',
    body: 'Order your first astrological report or unlock recurring forecasts and they will appear here.',
    ctaLabel: 'Browse Reports',
    ctaHref: '/reports',
    icon: 'fa-file-download',
  };
}

export default function MyReportsPage() {
  useSharedEffects();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [library, setLibrary] = useState({ items: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  const activeTab = TAB_CONFIG.some((tab) => tab.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'all';

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const data = await api.get('/v1/reports/library');
        setLibrary({
          items: Array.isArray(data.items) ? data.items : [],
          counts: data.counts || {},
        });
      } catch (err) {
        setError(err.message || 'Failed to load your reports.');
      } finally {
        setLoading(false);
      }
    }
    fetchLibrary();
  }, []);

  const filteredItems = useMemo(
    () => library.items.filter((item) => matchesTab(item, activeTab)),
    [library.items, activeTab],
  );

  const handleTabChange = (tabKey) => {
    const next = new URLSearchParams(searchParams);
    if (tabKey === 'all') next.delete('tab');
    else next.set('tab', tabKey);
    next.delete('order');
    setSearchParams(next, { replace: true });
  };

  const handleDownload = async (item) => {
    if (!item.download_report_id) return;
    setDownloading(item.id);
    try {
      const filename = `${item.display_name.replace(/\s+/g, '_')}.pdf`;
      await api.download(`/v1/reports/${item.download_report_id}/download`, filename);
    } catch (err) {
      setError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const emptyState = getEmptyStateCopy(activeTab);

  return (
    <PageShell activeNav="my-reports">
      <div className="report-page">
        <div className="container">
          <div className="cart-header report-library-header">
            <div>
              <h1>My Reports</h1>
              <p className="subtitle">Your purchased reports and recurring forecasts, all in one place</p>
            </div>
            <div className="report-library-actions">
              <button className="btn btn-outline" onClick={() => navigate('/my-data/subscription')}>
                <i className="fas fa-crown"></i> Subscription
              </button>
              <button className="btn" onClick={() => navigate('/reports')}>
                <i className="fas fa-plus-circle"></i> Browse Reports
              </button>
            </div>
          </div>

          <div className="report-library-tabs">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.key}
                className={`report-library-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span>{tab.label}</span>
                <strong>{getCountForTab(tab.key, library.counts)}</strong>
              </button>
            ))}
          </div>

          {loading && (
            <div className="empty-cart">
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}></i>
              Loading your report library...
            </div>
          )}

          <ApiError message={error} onDismiss={() => setError('')} />

          {!loading && filteredItems.length === 0 && !error && (
            <div className="empty-cart report-library-empty" style={{ padding: '60px 20px' }}>
              <i className={`fas ${emptyState.icon}`} style={{ fontSize: '3rem', color: '#9d7bff', marginBottom: '20px', display: 'block' }}></i>
              <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{emptyState.title}</p>
              <p style={{ fontSize: '0.95rem', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
                {emptyState.body}
              </p>
              <button
                className="btn"
                onClick={() => navigate(emptyState.ctaHref)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-arrow-right"></i> {emptyState.ctaLabel}
              </button>
            </div>
          )}

          {!loading && filteredItems.length > 0 && (
            <div className="report-library-grid">
              {filteredItems.map((item) => {
                const info = getReportInfo(item.report_type);
                const statusUi = STATUS_UI[item.status] || STATUS_UI.processing;
                const isDownloading = downloading === item.id;

                return (
                  <article key={item.id} className="report-library-card">
                    <div className="report-library-card-head">
                      <div className="report-library-icon">
                        <i className={`fas ${info.icon}`}></i>
                      </div>
                      <div className="report-library-title-group">
                        <div className="report-library-kicker">
                          <span>{item.family_label || info.label}</span>
                          {item.period_label && <span className="report-library-period">{item.period_label}</span>}
                        </div>
                        <h3>{item.display_name}</h3>
                      </div>
                      <span className={`report-library-status ${statusUi.tone}`}>
                        <i className={`fas ${statusUi.icon}`}></i> {statusUi.label}
                      </span>
                    </div>

                    <div className="report-library-meta">
                      <span>
                        <i className="fas fa-layer-group"></i>
                        {item.cadence === 'one_time' ? 'One-time report' : `${item.cadence[0].toUpperCase()}${item.cadence.slice(1)} forecast`}
                      </span>
                      <span>
                        <i className="fas fa-calendar-alt"></i>
                        {formatDate(item.generated_at || item.updated_at || item.created_at)}
                      </span>
                      <span>
                        <i className="fas fa-file"></i>
                        {item.file_size ? formatFileSize(item.file_size) : 'Not ready yet'}
                      </span>
                    </div>

                    {item.error_message && item.status === 'failed' && (
                      <div className="report-library-alert">
                        <i className="fas fa-triangle-exclamation"></i>
                        <span>{item.error_message}</span>
                      </div>
                    )}

                    <div className="report-library-card-actions">
                      {item.is_downloadable ? (
                        <button
                          className="btn"
                          onClick={() => handleDownload(item)}
                          disabled={isDownloading}
                          style={isDownloading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                        >
                          {isDownloading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Downloading...</>
                          ) : (
                            <><i className="fas fa-download"></i> Download PDF</>
                          )}
                        </button>
                      ) : (
                        <button className="btn btn-outline" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                          <i className="fas fa-clock"></i> {item.status === 'failed' ? 'Needs Attention' : 'Generating'}
                        </button>
                      )}

                      {item.cadence !== 'one_time' && (
                        <button className="btn btn-outline" onClick={() => handleTabChange('forecast')}>
                          <i className="fas fa-calendar-days"></i> Forecast Archive
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
