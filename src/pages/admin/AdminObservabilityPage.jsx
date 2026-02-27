import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { api } from '../../api/client';

/* ============================================================
   Gauge / Speedometer SVG Component
   ============================================================ */

function GaugeMeter({
  value = 0,          // 0–100
  max = 100,
  label = '',
  unit = '%',
  warnAt = 80,        // yellow zone starts
  critAt = 100,       // red zone starts
  size = 180,
  invert = false,     // true = lower is worse (e.g., cache hit-rate)
  subtitle = '',
  formatValue,
}) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const pct = (clampedValue / max) * 100;

  // Arc geometry (bottom-open semicircle, 240 degrees)
  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = size * 0.38;
  const startAngle = -210;
  const endAngle = 30;
  const totalArc = endAngle - startAngle; // 240 degrees

  const polarToXY = (angleDeg, radius) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (from, to, radius) => {
    const s = polarToXY(from, radius);
    const e = polarToXY(to, radius);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Value arc angle
  const valueAngle = startAngle + (pct / 100) * totalArc;

  // Determine color based on thresholds
  let color = '#2ed573'; // green
  if (invert) {
    // For inverted (low=bad): below critAt=red, below warnAt=yellow
    if (pct <= critAt) color = '#ff4757';
    else if (pct <= warnAt) color = '#ffa502';
    else color = '#2ed573';
  } else {
    // Normal: above critAt=red, above warnAt=yellow
    if (pct >= critAt) color = '#ff4757';
    else if (pct >= warnAt) color = '#ffa502';
    else color = '#2ed573';
  }

  // Display value
  const displayVal = formatValue ? formatValue(clampedValue) : `${Math.round(clampedValue)}`;

  // Warn/crit zone arcs (for background zone coloring)
  const warnAngle = startAngle + (warnAt / 100) * totalArc;
  const critAngle = startAngle + (Math.min(critAt, 100) / 100) * totalArc;

  return (
    <div className="obs-gauge-container">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background track */}
        <path
          d={arcPath(startAngle, endAngle, r)}
          fill="none"
          stroke="rgba(42,47,62,0.8)"
          strokeWidth={12}
          strokeLinecap="round"
        />

        {/* Zone arcs — green / yellow / red background hints */}
        {!invert ? (
          <>
            <path d={arcPath(startAngle, warnAngle, r)} fill="none" stroke="rgba(46,213,115,0.12)" strokeWidth={12} strokeLinecap="round" />
            <path d={arcPath(warnAngle, critAngle, r)} fill="none" stroke="rgba(255,165,2,0.12)" strokeWidth={12} strokeLinecap="round" />
            {critAt < 100 && (
              <path d={arcPath(critAngle, endAngle, r)} fill="none" stroke="rgba(255,71,87,0.12)" strokeWidth={12} strokeLinecap="round" />
            )}
          </>
        ) : (
          <>
            <path d={arcPath(startAngle, startAngle + (critAt / 100) * totalArc, r)} fill="none" stroke="rgba(255,71,87,0.12)" strokeWidth={12} strokeLinecap="round" />
            <path d={arcPath(startAngle + (critAt / 100) * totalArc, startAngle + (warnAt / 100) * totalArc, r)} fill="none" stroke="rgba(255,165,2,0.12)" strokeWidth={12} strokeLinecap="round" />
            <path d={arcPath(startAngle + (warnAt / 100) * totalArc, endAngle, r)} fill="none" stroke="rgba(46,213,115,0.12)" strokeWidth={12} strokeLinecap="round" />
          </>
        )}

        {/* Value arc */}
        {pct > 0.5 && (
          <path
            d={arcPath(startAngle, valueAngle, r)}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        )}

        {/* Needle */}
        {(() => {
          const needleTip = polarToXY(valueAngle, r - 8);
          const needleBase1 = polarToXY(valueAngle + 90, 4);
          const needleBase2 = polarToXY(valueAngle - 90, 4);
          return (
            <>
              <polygon
                points={`${needleTip.x},${needleTip.y} ${cx + needleBase1.x - cx},${cy + needleBase1.y - cy} ${cx + needleBase2.x - cx},${cy + needleBase2.y - cy}`}
                fill={color}
                opacity={0.8}
              />
              <circle cx={cx} cy={cy} r={6} fill="#1a1f2e" stroke={color} strokeWidth={2} />
            </>
          );
        })()}

        {/* Center value text */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill={color} fontSize={size * 0.16} fontWeight="700" fontFamily="'Poppins', sans-serif">
          {displayVal}
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#8a8f9d" fontSize={size * 0.07} fontFamily="'Poppins', sans-serif">
          {unit}
        </text>
      </svg>
      <div className="obs-gauge-label">{label}</div>
      {subtitle && <div className="obs-gauge-subtitle">{subtitle}</div>}
    </div>
  );
}


/* ============================================================
   Settings Editor Component
   ============================================================ */

function SettingsEditor({ settings, onSave, saving }) {
  const [form, setForm] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({ ...settings });
      setDirty(false);
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only send changed fields
    const changes = {};
    for (const key of Object.keys(form)) {
      if (form[key] !== settings[key]) {
        changes[key] = form[key];
      }
    }
    if (Object.keys(changes).length > 0) {
      onSave(changes);
    }
  };

  const FIELD_DEFS = [
    { key: 'alert_enabled', label: 'Alerts Enabled', type: 'bool', group: 'General' },
    { key: 'alert_check_interval_seconds', label: 'Check Interval (seconds)', type: 'int', group: 'General', min: 10, max: 3600 },
    { key: 'alert_cooldown_seconds', label: 'Alert Cooldown (seconds)', type: 'int', group: 'General', min: 60, max: 86400 },
    { key: 'alert_email_recipients', label: 'Email Recipients (comma-separated)', type: 'str', group: 'General' },
    { key: 'alert_llm_daily_budget_warn_pct', label: 'Daily Budget Warning (%)', type: 'pct', group: 'LLM Budget' },
    { key: 'alert_llm_daily_budget_crit_pct', label: 'Daily Budget Critical (%)', type: 'pct', group: 'LLM Budget' },
    { key: 'alert_llm_monthly_budget_warn_pct', label: 'Monthly Budget Warning (%)', type: 'pct', group: 'LLM Budget' },
    { key: 'alert_llm_monthly_budget_crit_pct', label: 'Monthly Budget Critical (%)', type: 'pct', group: 'LLM Budget' },
    { key: 'alert_cache_hit_rate_min', label: 'Min Cache Hit-Rate', type: 'pct', group: 'Cache & Errors' },
    { key: 'alert_error_rate_threshold', label: 'Error Rate Threshold', type: 'pct', group: 'Cache & Errors' },
    { key: 'alert_error_rate_window_seconds', label: 'Error Rate Window (seconds)', type: 'int', group: 'Cache & Errors', min: 30, max: 3600 },
    { key: 'alert_slow_request_threshold_seconds', label: 'Slow Request Threshold (seconds)', type: 'float', group: 'Cache & Errors', min: 1, max: 120 },
  ];

  const groups = [...new Set(FIELD_DEFS.map(f => f.group))];

  return (
    <form onSubmit={handleSubmit} className="obs-settings-form">
      {groups.map(group => (
        <div key={group} className="obs-settings-group">
          <h4 className="obs-settings-group-title">
            <i className={`fas ${group === 'General' ? 'fa-cog' : group === 'LLM Budget' ? 'fa-dollar-sign' : 'fa-chart-bar'}`}></i>
            {group}
          </h4>
          <div className="obs-settings-fields">
            {FIELD_DEFS.filter(f => f.group === group).map(fd => (
              <div key={fd.key} className="obs-settings-field">
                <label>{fd.label}</label>
                {fd.type === 'bool' ? (
                  <div className="obs-toggle-wrap">
                    <button
                      type="button"
                      className={`obs-toggle ${form[fd.key] ? 'on' : 'off'}`}
                      onClick={() => handleChange(fd.key, !form[fd.key])}
                    >
                      <span className="obs-toggle-thumb"></span>
                    </button>
                    <span className="obs-toggle-label">{form[fd.key] ? 'ON' : 'OFF'}</span>
                  </div>
                ) : fd.type === 'str' ? (
                  <input
                    type="text"
                    value={form[fd.key] || ''}
                    onChange={(e) => handleChange(fd.key, e.target.value)}
                  />
                ) : fd.type === 'pct' ? (
                  <div className="obs-pct-input">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="2"
                      value={form[fd.key] ?? ''}
                      onChange={(e) => handleChange(fd.key, parseFloat(e.target.value) || 0)}
                    />
                    <span className="obs-pct-hint">{((form[fd.key] || 0) * 100).toFixed(0)}%</span>
                  </div>
                ) : fd.type === 'int' ? (
                  <input
                    type="number"
                    min={fd.min || 0}
                    max={fd.max || 999999}
                    value={form[fd.key] ?? ''}
                    onChange={(e) => handleChange(fd.key, parseInt(e.target.value, 10) || 0)}
                  />
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    min={fd.min || 0}
                    max={fd.max || 999999}
                    value={form[fd.key] ?? ''}
                    onChange={(e) => handleChange(fd.key, parseFloat(e.target.value) || 0)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="obs-settings-actions">
        <button type="submit" className="btn-admin-add" disabled={!dirty || saving}>
          {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Settings</>}
        </button>
      </div>
    </form>
  );
}


/* ============================================================
   Main Observability Dashboard Page
   ============================================================ */

export default function AdminObservabilityPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | settings | alerts
  const pollRef = useRef(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      const d = await api.get('/v1/admin/observability/metrics/summary');
      setData(d);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const s = await api.get('/v1/admin/observability/settings');
      setSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const a = await api.get('/v1/admin/observability/alerts?limit=50');
      setAlerts(a.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
    fetchSettings();
    fetchAlerts();
  }, [fetchData, fetchSettings, fetchAlerts]);

  // Auto-refresh polling (every 10 seconds)
  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = setInterval(() => {
        fetchData();
        fetchAlerts();
      }, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [autoRefresh, fetchData, fetchAlerts]);

  // Save settings
  const handleSaveSettings = async (changes) => {
    setSaving(true);
    try {
      const result = await api.patch('/v1/admin/observability/settings', changes);
      if (result.rejected && Object.keys(result.rejected).length > 0) {
        setToast({ type: 'error', msg: `Some fields rejected: ${Object.values(result.rejected).join(', ')}` });
      } else {
        setToast({ type: 'success', msg: 'Settings updated successfully' });
      }
      setSettings(result.current);
      // Re-fetch summary to reflect new thresholds
      fetchData();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Fire test alert
  const handleTestAlert = async () => {
    setTestingAlert(true);
    try {
      const result = await api.post('/v1/admin/observability/alerts/test', {});
      if (result.status === 'dispatched') {
        setToast({ type: 'success', msg: 'Test alert dispatched to configured recipients' });
      } else if (result.status === 'no_callback') {
        setToast({ type: 'error', msg: 'No email recipients configured. Set alert_email_recipients first.' });
      } else {
        setToast({ type: 'error', msg: result.message || 'Test alert failed' });
      }
      // Refresh alerts after a short delay
      setTimeout(fetchAlerts, 2000);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setTestingAlert(false);
    }
  };

  // Derive gauge values from data
  const getGaugeData = () => {
    if (!data) return {};

    const cg = data.cost_guard || {};
    const cache = data.llm_cache || {};
    const http = data.http_metrics || {};
    const thresholds = data.thresholds || {};

    // Daily budget gauge (percentage spent)
    const dailyPct = cg.daily_budget_usd > 0
      ? (cg.daily_spent_usd / cg.daily_budget_usd) * 100
      : 0;

    // Monthly budget gauge
    const monthlyPct = cg.monthly_budget_usd > 0
      ? (cg.monthly_spent_usd / cg.monthly_budget_usd) * 100
      : 0;

    // Cache hit-rate gauge
    const cacheHitRate = (cache.hit_rate !== undefined) ? cache.hit_rate * 100 : 0;

    // Error rate gauge
    const errorRate = (http.error_rate || 0) * 100;

    return {
      dailyPct,
      monthlyPct,
      cacheHitRate,
      errorRate,
      dailySpent: cg.daily_spent_usd || 0,
      dailyBudget: cg.daily_budget_usd || 0,
      monthlySpent: cg.monthly_spent_usd || 0,
      monthlyBudget: cg.monthly_budget_usd || 0,
      cacheHits: cache.hits || 0,
      cacheMisses: cache.misses || 0,
      cacheSize: cache.size || 0,
      cacheMaxSize: cache.max_size || 0,
      totalRequests: http.total_requests || 0,
      totalErrors: http.total_errors || 0,
      activeRequests: http.active_requests || 0,
      warnDaily: (thresholds.alert_llm_daily_budget_warn_pct || 0.8) * 100,
      critDaily: (thresholds.alert_llm_daily_budget_crit_pct || 1.0) * 100,
      warnMonthly: (thresholds.alert_llm_monthly_budget_warn_pct || 0.8) * 100,
      critMonthly: (thresholds.alert_llm_monthly_budget_crit_pct || 1.0) * 100,
      cacheMinRate: (thresholds.alert_cache_hit_rate_min || 0.3) * 100,
      errorThreshold: (thresholds.alert_error_rate_threshold || 0.05) * 100,
    };
  };

  const g = getGaugeData();

  // Severity badge helper
  const severityBadge = (severity) => (
    <span className={`obs-severity-badge ${severity}`}>
      <i className={`fas ${severity === 'critical' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}`}></i>
      {severity.toUpperCase()}
    </span>
  );

  // Time-ago helper
  const timeAgo = (isoStr) => {
    const d = new Date(isoStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <PageShell activeNav="admin">
      <div className="container">
        <div className="admin-page">
          {/* Toast */}
          {toast && <div className={`admin-toast ${toast.type}`}>{toast.msg}</div>}

          {/* Header */}
          <div className="admin-header">
            <h1><i className="fas fa-tachometer-alt"></i> Observability Dashboard</h1>
            <p>Real-time system health monitoring, alerts & threshold configuration</p>
          </div>

          {/* Tab Navigation */}
          <div className="obs-tabs">
            <button
              className={`obs-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <i className="fas fa-chart-line"></i> Dashboard
            </button>
            <button
              className={`obs-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="fas fa-sliders-h"></i> Thresholds
            </button>
            <button
              className={`obs-tab ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              <i className="fas fa-bell"></i> Alerts
              {data && data.total_alerts > 0 && (
                <span className="obs-tab-badge">{data.total_alerts}</span>
              )}
            </button>
            <div className="obs-tabs-right">
              <label className="obs-autorefresh">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={() => setAutoRefresh(!autoRefresh)}
                />
                <span>Auto-refresh (10s)</span>
              </label>
              <button className="obs-refresh-btn" onClick={() => { fetchData(); fetchAlerts(); fetchSettings(); }} title="Refresh now">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading observability data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="obs-error-banner">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
              <button onClick={fetchData}>Retry</button>
            </div>
          )}

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && data && !loading && (
            <>
              {/* Gauge Row */}
              <div className="obs-gauge-grid">
                <GaugeMeter
                  value={g.dailyPct}
                  max={120}
                  label="Daily LLM Budget"
                  unit="% used"
                  warnAt={g.warnDaily}
                  critAt={g.critDaily}
                  subtitle={`$${g.dailySpent.toFixed(2)} / $${g.dailyBudget.toFixed(2)}`}
                />
                <GaugeMeter
                  value={g.monthlyPct}
                  max={120}
                  label="Monthly LLM Budget"
                  unit="% used"
                  warnAt={g.warnMonthly}
                  critAt={g.critMonthly}
                  subtitle={`$${g.monthlySpent.toFixed(2)} / $${g.monthlyBudget.toFixed(2)}`}
                />
                <GaugeMeter
                  value={g.cacheHitRate}
                  max={100}
                  label="Cache Hit-Rate"
                  unit="%"
                  warnAt={g.cacheMinRate + 10}
                  critAt={g.cacheMinRate}
                  invert={true}
                  subtitle={`${g.cacheHits} hits / ${g.cacheMisses} misses`}
                />
                <GaugeMeter
                  value={g.errorRate}
                  max={Math.max(g.errorThreshold * 2, 10)}
                  label="Error Rate"
                  unit="% errors"
                  warnAt={(g.errorThreshold / Math.max(g.errorThreshold * 2, 10)) * 100 * 0.7}
                  critAt={(g.errorThreshold / Math.max(g.errorThreshold * 2, 10)) * 100}
                  subtitle={`${g.totalErrors} errors / ${g.totalRequests} requests`}
                  formatValue={(v) => v.toFixed(2)}
                />
              </div>

              {/* Stats Cards Row */}
              <div className="obs-stats-grid">
                <div className="obs-stat-card">
                  <div className="obs-stat-icon"><i className="fas fa-server"></i></div>
                  <div className="obs-stat-body">
                    <div className="obs-stat-value">{g.activeRequests}</div>
                    <div className="obs-stat-label">Active Requests</div>
                  </div>
                </div>
                <div className="obs-stat-card">
                  <div className="obs-stat-icon"><i className="fas fa-exchange-alt"></i></div>
                  <div className="obs-stat-body">
                    <div className="obs-stat-value">{g.totalRequests.toLocaleString()}</div>
                    <div className="obs-stat-label">Total Requests</div>
                  </div>
                </div>
                <div className="obs-stat-card">
                  <div className="obs-stat-icon"><i className="fas fa-database"></i></div>
                  <div className="obs-stat-body">
                    <div className="obs-stat-value">{g.cacheSize} / {g.cacheMaxSize}</div>
                    <div className="obs-stat-label">Cache Entries</div>
                  </div>
                </div>
                <div className="obs-stat-card">
                  <div className="obs-stat-icon"><i className="fas fa-bell"></i></div>
                  <div className="obs-stat-body">
                    <div className="obs-stat-value">{data.total_alerts || 0}</div>
                    <div className="obs-stat-label">Total Alerts Fired</div>
                  </div>
                </div>
              </div>

              {/* LLM Token & Context Tracking */}
              {(() => {
                const llm = data.llm_metrics || {};
                const fmtTokens = (n) => {
                  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
                  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
                  return n.toLocaleString();
                };
                return (
                  <div className="obs-token-section">
                    <div className="obs-card-header">
                      <h3><i className="fas fa-microchip"></i> LLM Token & Context Tracking</h3>
                    </div>

                    {/* Token stat cards */}
                    <div className="obs-token-grid">
                      <div className="obs-token-card">
                        <div className="obs-token-card-icon input"><i className="fas fa-sign-in-alt"></i></div>
                        <div className="obs-token-card-body">
                          <div className="obs-token-card-value">{fmtTokens(llm.input_tokens || 0)}</div>
                          <div className="obs-token-card-label">Input Tokens</div>
                        </div>
                      </div>
                      <div className="obs-token-card">
                        <div className="obs-token-card-icon output"><i className="fas fa-sign-out-alt"></i></div>
                        <div className="obs-token-card-body">
                          <div className="obs-token-card-value">{fmtTokens(llm.output_tokens || 0)}</div>
                          <div className="obs-token-card-label">Output Tokens</div>
                        </div>
                      </div>
                      <div className="obs-token-card">
                        <div className="obs-token-card-icon total"><i className="fas fa-layer-group"></i></div>
                        <div className="obs-token-card-body">
                          <div className="obs-token-card-value">{fmtTokens(llm.total_tokens || 0)}</div>
                          <div className="obs-token-card-label">Total Tokens</div>
                        </div>
                      </div>
                      <div className="obs-token-card">
                        <div className="obs-token-card-icon calls"><i className="fas fa-brain"></i></div>
                        <div className="obs-token-card-body">
                          <div className="obs-token-card-value">{(llm.total_calls || 0).toLocaleString()}</div>
                          <div className="obs-token-card-label">LLM Calls</div>
                        </div>
                      </div>
                      <div className="obs-token-card">
                        <div className="obs-token-card-icon avg"><i className="fas fa-ruler-horizontal"></i></div>
                        <div className="obs-token-card-body">
                          <div className="obs-token-card-value">{fmtTokens(llm.avg_tokens_per_call || 0)}</div>
                          <div className="obs-token-card-label">Avg Tokens / Call</div>
                        </div>
                      </div>
                      <div className="obs-token-card">
                        <div className="obs-token-card-icon cost"><i className="fas fa-dollar-sign"></i></div>
                        <div className="obs-token-card-body">
                          <div className="obs-token-card-value">${(llm.total_cost_usd || 0).toFixed(4)}</div>
                          <div className="obs-token-card-label">Total LLM Cost</div>
                        </div>
                      </div>
                    </div>

                    {/* Token ratio bar */}
                    {(llm.total_tokens || 0) > 0 && (
                      <div className="obs-token-ratio">
                        <div className="obs-token-ratio-header">
                          <span>Token Distribution</span>
                          <span className="obs-token-ratio-pct">
                            Input {((llm.input_tokens / llm.total_tokens) * 100).toFixed(0)}%
                            {' / '}
                            Output {((llm.output_tokens / llm.total_tokens) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="obs-token-ratio-bar">
                          <div
                            className="obs-token-ratio-fill input"
                            style={{ width: `${(llm.input_tokens / llm.total_tokens) * 100}%` }}
                          ></div>
                          <div
                            className="obs-token-ratio-fill output"
                            style={{ width: `${(llm.output_tokens / llm.total_tokens) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Provider breakdown */}
                    {Object.keys(llm.calls_by_provider || {}).length > 0 && (
                      <div className="obs-provider-breakdown">
                        <h4><i className="fas fa-chart-pie"></i> By Provider</h4>
                        <div className="obs-provider-table">
                          {Object.entries(llm.calls_by_provider).map(([provider, calls]) => (
                            <div key={provider} className="obs-provider-row">
                              <span className="obs-provider-name">
                                <i className={`fas ${provider === 'gemini' ? 'fa-gem' : provider === 'openai' ? 'fa-robot' : provider === 'anthropic' ? 'fa-brain' : 'fa-cloud'}`}></i>
                                {provider}
                              </span>
                              <span className="obs-provider-calls">{calls} calls</span>
                              <span className="obs-provider-cost">${((llm.cost_by_provider || {})[provider] || 0).toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Model breakdown */}
                    {Object.keys(llm.calls_by_model || {}).length > 0 && (
                      <div className="obs-provider-breakdown">
                        <h4><i className="fas fa-cubes"></i> By Model</h4>
                        <div className="obs-provider-table">
                          {Object.entries(llm.calls_by_model).map(([model, calls]) => (
                            <div key={model} className="obs-provider-row">
                              <span className="obs-provider-name">
                                <i className="fas fa-cube"></i>
                                {model}
                              </span>
                              <span className="obs-provider-calls">{calls} calls</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Recent Alerts Preview */}
              {data.recent_alerts && data.recent_alerts.length > 0 && (
                <div className="obs-recent-alerts-card">
                  <div className="obs-card-header">
                    <h3><i className="fas fa-bell"></i> Recent Alerts</h3>
                    <button className="obs-link-btn" onClick={() => setActiveTab('alerts')}>
                      View All <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                  <div className="obs-alert-mini-list">
                    {data.recent_alerts.slice(0, 5).map((alert, idx) => (
                      <div key={idx} className={`obs-alert-mini-row ${alert.severity}`}>
                        {severityBadge(alert.severity)}
                        <span className="obs-alert-mini-rule">{alert.rule_name}</span>
                        <span className="obs-alert-mini-detail">{alert.description}</span>
                        <span className="obs-alert-mini-time">{timeAgo(alert.fired_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== SETTINGS TAB ===== */}
          {activeTab === 'settings' && (
            <div className="obs-settings-panel">
              <div className="obs-card-header">
                <h3><i className="fas fa-sliders-h"></i> Alert Threshold Configuration</h3>
                <p className="obs-card-hint">Changes take effect immediately. They do not persist across server restarts unless also set in .env</p>
              </div>
              {settings ? (
                <SettingsEditor settings={settings} onSave={handleSaveSettings} saving={saving} />
              ) : (
                <div className="admin-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading settings...</p>
                </div>
              )}
            </div>
          )}

          {/* ===== ALERTS TAB ===== */}
          {activeTab === 'alerts' && (
            <div className="obs-alerts-panel">
              <div className="obs-card-header">
                <h3><i className="fas fa-bell"></i> Alert History</h3>
                <button
                  className="btn-admin-add"
                  onClick={handleTestAlert}
                  disabled={testingAlert}
                >
                  {testingAlert
                    ? <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                    : <><i className="fas fa-paper-plane"></i> Fire Test Alert</>
                  }
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="admin-empty">
                  <i className="fas fa-check-circle"></i>
                  <p>No alerts have fired yet. System is healthy.</p>
                </div>
              ) : (
                <table className="admin-table obs-alerts-table">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Rule</th>
                      <th>Description</th>
                      <th>Detail</th>
                      <th>Fired At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, idx) => (
                      <tr key={idx} className={`obs-alert-row ${alert.severity}`}>
                        <td>{severityBadge(alert.severity)}</td>
                        <td className="obs-alert-rule-name">{alert.rule_name}</td>
                        <td>{alert.description}</td>
                        <td className="obs-alert-detail">{alert.detail}</td>
                        <td className="obs-alert-time">
                          <span title={alert.fired_at}>{timeAgo(alert.fired_at)}</span>
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
