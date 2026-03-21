import PageShell from '../components/PageShell';
import { useState, useCallback, useMemo } from 'react';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData, to24Hour } from '../hooks/useBirthData';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_LABELS = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Prana'];
const LEVEL_ICONS  = ['fa-sun', 'fa-moon', 'fa-star', 'fa-circle', 'fa-dot-circle'];

/** Planet → accent colour (Vedic association) */
const PLANET_COLORS = {
  Sun:     '#ffa502',
  Moon:    '#dfe6e9',
  Mars:    '#ff4757',
  Mercury: '#2ed573',
  Jupiter: '#eccc68',
  Venus:   '#ff6b81',
  Saturn:  '#a29bfe',
  Rahu:    '#70a1ff',
  Ketu:    '#636e72',
};

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Human-readable duration between two ISO dates */
function durationLabel(start, end) {
  if (!start || !end) return '';
  const ms = new Date(end) - new Date(start);
  const totalDays = Math.round(ms / 86400000);
  if (totalDays < 1) return '< 1 day';
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;
  const parts = [];
  if (years)  parts.push(`${years}y`);
  if (months) parts.push(`${months}m`);
  if (days && !years) parts.push(`${days}d`); // skip days when years are shown
  return parts.join(' ') || '< 1 day';
}

// ---------------------------------------------------------------------------
// DashaDrillDown — the 5-level drill-down navigator
// ---------------------------------------------------------------------------

export function DashaDrillDown({ dashaTree }) {
  // Navigation stack: array of { node, label } objects.
  // Empty stack = showing Mahadasha list (Level 1).
  const [navStack, setNavStack] = useState([]);

  // Current list of periods to display
  const currentPeriods = useMemo(() => {
    if (navStack.length === 0) return dashaTree;
    return navStack[navStack.length - 1].node.sub_periods || [];
  }, [navStack, dashaTree]);

  const currentDepth = navStack.length; // 0 = Mahadasha, 1 = Antardasha, etc.
  const levelLabel = LEVEL_LABELS[currentDepth] || `Level ${currentDepth + 1}`;
  const maxDepth = 4; // 0-indexed: 0=MD, 1=AD, 2=PD, 3=SD, 4=Pr

  // Drill into a period
  const drillIn = useCallback((period) => {
    if (!period.sub_periods || period.sub_periods.length === 0) return;
    setNavStack(prev => [...prev, {
      node: period,
      label: period.planet,
    }]);
  }, []);

  // Go back one level
  const goBack = useCallback(() => {
    setNavStack(prev => prev.slice(0, -1));
  }, []);

  // Go to specific level in breadcrumb
  const goToLevel = useCallback((idx) => {
    if (idx < 0) {
      setNavStack([]);
    } else {
      setNavStack(prev => prev.slice(0, idx + 1));
    }
  }, []);

  // Reset when dashaTree changes
  const resetNav = useCallback(() => setNavStack([]), []);

  // Find current period path for highlighting
  const currentPath = useMemo(() => {
    const path = [];
    let list = dashaTree;
    while (list) {
      const cur = list.find(p => p.is_current);
      if (!cur) break;
      path.push(cur.planet);
      list = cur.sub_periods;
    }
    return path;
  }, [dashaTree]);

  // Build summary of current running period chain
  const currentSummary = useMemo(() => {
    const parts = [];
    let list = dashaTree;
    while (list) {
      const cur = list.find(p => p.is_current);
      if (!cur) break;
      parts.push({
        ...cur,
        label: cur.planet,
        levelLabel: LEVEL_LABELS[parts.length] || `Level ${parts.length + 1}`,
        pathDepth: parts.length,
      });
      list = cur.sub_periods;
    }
    return parts;
  }, [dashaTree]);

  const jumpToPath = useCallback((pathDepth) => {
    if (pathDepth < 0) {
      setNavStack([]);
      return;
    }

    setNavStack(
      currentSummary.slice(0, pathDepth + 1).map((period) => ({
        node: period,
        label: period.planet,
      })),
    );
  }, [currentSummary]);

  const renderPeriodCard = useCallback((period, idx, options = {}) => {
    const {
      levelName = levelLabel,
      isCurrent = period.is_current || false,
      canDrill = Boolean(period.sub_periods?.length) && currentDepth < maxDepth,
      onClick,
      extraClassName = '',
      activeLabel = 'Active',
      testId,
    } = options;

    const planetColor = PLANET_COLORS[period.planet] || '#c4b0ff';
    const clickable = Boolean(onClick) || canDrill;

    return (
      <div
        key={`${period.planet}-${period.start}-${idx}-${levelName}`}
        className={`dasha-drill-item ${isCurrent ? 'current' : ''} ${clickable ? 'clickable' : ''} ${extraClassName}`.trim()}
        onClick={() => {
          if (onClick) {
            onClick(period);
            return;
          }
          if (canDrill) {
            drillIn(period);
          }
        }}
        data-testid={testId}
      >
        <div className="dasha-drill-planet" style={{ borderColor: planetColor }}>
          <span className="planet-name" style={{ color: planetColor }}>{period.planet}</span>
          <span className="planet-level">{levelName}</span>
        </div>

        <div className="dasha-drill-info">
          <div className="dasha-drill-dates">
            {fmtDate(period.start)} — {fmtDate(period.end)}
          </div>
          <div className="dasha-drill-duration">
            <i className="fas fa-hourglass-half"></i> {durationLabel(period.start, period.end)}
          </div>
        </div>

        <div className="dasha-drill-right">
          {isCurrent && (
            <span className="dasha-current-badge">
              <i className="fas fa-circle"></i> {activeLabel}
            </span>
          )}
          {clickable && (
            <span className="dasha-drill-arrow">
              <i className="fas fa-chevron-right"></i>
            </span>
          )}
        </div>
      </div>
    );
  }, [currentDepth, drillIn, levelLabel]);

  return (
    <div className="dasha-drilldown">
      {/* Current Running Period Summary */}
      {currentSummary.length > 0 && navStack.length === 0 && (
        <div className="dasha-current-summary" data-testid="dasha-current-path">
          <div className="dasha-current-label">
            <i className="fas fa-clock"></i> Currently Running Across 5 Levels
          </div>
          <div className="dasha-current-subtitle">
            Tap any active dasha level to jump straight into its child timeline.
          </div>
          <div className="dasha-period-list dasha-current-path-list">
            {currentSummary.map((item, i) => renderPeriodCard(item, i, {
              levelName: item.levelLabel,
              isCurrent: true,
              canDrill: Boolean(item.sub_periods?.length) && item.pathDepth < maxDepth,
              onClick: Boolean(item.sub_periods?.length) && item.pathDepth < maxDepth
                ? () => jumpToPath(item.pathDepth)
                : undefined,
              extraClassName: 'current-path',
              activeLabel: 'Active Level',
              testId: `dasha-path-item-${item.pathDepth}`,
            }))}
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      {navStack.length > 0 && (
        <div className="dasha-breadcrumb">
          <button className="dasha-breadcrumb-btn" onClick={() => goToLevel(-1)}>
            <i className="fas fa-layer-group"></i> All Mahadasha
          </button>
          {navStack.map((item, idx) => (
            <span key={idx} className="dasha-breadcrumb-item">
              <i className="fas fa-chevron-right"></i>
              <button
                className={`dasha-breadcrumb-btn ${idx === navStack.length - 1 ? 'active' : ''}`}
                onClick={() => goToLevel(idx)}
              >
                {item.label} {LEVEL_LABELS[idx]}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Back Button */}
      {navStack.length > 0 && (
        <button className="dasha-back-btn" onClick={goBack}>
          <i className="fas fa-arrow-left"></i>
          Back to {LEVEL_LABELS[currentDepth - 1]} view
        </button>
      )}

      {/* Level Header */}
      <div className="dasha-level-header">
        <i className={`fas ${LEVEL_ICONS[currentDepth] || 'fa-circle'}`}></i>
        <span>{levelLabel} Periods</span>
        <span className="dasha-level-count">{currentPeriods.length} periods</span>
      </div>

      {/* Period List */}
      <div className="dasha-period-list">
        {currentPeriods.map((period, idx) => renderPeriodCard(period, idx))}
      </div>

      {/* Deepest level message */}
      {currentDepth === maxDepth && (
        <div className="dasha-deepest-note">
          <i className="fas fa-info-circle"></i>
          This is the Prana Dasha level — the finest subdivision of planetary periods.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DashaPage
// ---------------------------------------------------------------------------

export default function DashaPage() {
  const {
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    birthPlace, setBirthPlace,
    saveBirthData,
    validate,
    buildPayload,
  } = useBirthData({ reportType: 'dasha' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashaData, setDashaData] = useState(null);

  const handleGenerate = useCallback(async () => {
    setError('');

    const err = validate();
    if (err) { setError(err); return; }

    const payload = buildPayload();
    const params = new URLSearchParams({
      include_dasha: 'true',
      dasha_depth: '5',
      include_vargas: 'false',
      include_ashtakavarga: 'false',
    });

    setLoading(true);
    try {
      const data = await api.post(`/v1/chart/create?${params}`, payload);
      setDashaData(data);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to generate dasha timeline.');
    } finally {
      setLoading(false);
    }
  }, [validate, buildPayload, saveBirthData]);

  const dashaTree = dashaData?.bundle?.dasha_tree || [];

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Dasha Calculator</h1>
            <p>Understand your current planetary periods and future timeline predictions</p>
          </div>

          <div className="two-column">

            {/* ─── Left: Form ─── */}
            <div className="form-card">
              <h2>Birth Details</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <DateInput id="birthDate" value={birthDate} onChange={setBirthDate} />
                </div>

                <div className="form-group">
                  <label>Time of Birth</label>
                  <TimeSelectGroup
                    hourId="hour" minuteId="minute" ampmId="ampm"
                    onHourChange={setHour} onMinuteChange={setMinute} onAmpmChange={setAmpm}
                    hourValue={hour} minuteValue={minute} ampmValue={ampm}
                  />
                </div>

                <div className="form-group">
                  <label>Place of Birth</label>
                  <PlaceAutocomplete
                    id="birthPlace"
                    placeholder="Enter birth city"
                    value={birthPlace?.name || ''}
                    onSelect={setBirthPlace}
                  />
                </div>

                {error && (
                  <div className="api-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Calculating...</>
                  ) : (
                    <><i className="fas fa-om"></i> Calculate Dasha</>
                  )}
                </button>
                <p className="preview-note">
                  <i className="fas fa-info-circle"></i> 5-level deep Vimshottari Dasha with drill-down
                </p>
              </form>
            </div>

            {/* ─── Right: Dasha Timeline ─── */}
            <div className="chart-card">
              <h2>Your Dasha Timeline</h2>

              {loading ? (
                <div className="api-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Computing Vimshottari Dasha (5 levels)...</p>
                </div>
              ) : dashaTree.length > 0 ? (
                <DashaDrillDown dashaTree={dashaTree} />
              ) : (
                <div className="dasha-timeline" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-clock" style={{ fontSize: '2rem', marginBottom: 10, display: 'block', color: '#7b5bff' }}></i>
                  Enter your birth details and click Calculate to see your dasha timeline
                </div>
              )}

              <p className="preview-note" style={{ marginTop: '20px' }}>
                <i className="fas fa-lock"></i> Full dasha analysis with 30+ years prediction in paid report
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
