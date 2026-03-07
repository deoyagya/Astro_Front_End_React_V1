/**
 * TemporalForecastPage — Premium Opportunity & Threat Window Timeline
 *
 * Shows classified temporal windows (opportunity / threat / mixed) across
 * 13 life areas using the current planetary transits and Vimshottari Dasha.
 *
 * API: POST /v1/temporal-forecast/compute  (basic)
 *      POST /v1/temporal-forecast/interpret (premium — with LLM)
 *
 * Data flow: chartBundle (from MyDataLayout) → extract asc/dasha/moon →
 *            POST to temporal-forecast API → render timeline cards
 *
 * Phase 43B — 2026-03-06
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceDot,
} from 'recharts';
import '../../styles/temporal-forecast.css';

// Sign name → number lookup
const SIGN_NUMBERS = {
  aries: 1, taurus: 2, gemini: 3, cancer: 4, leo: 5, virgo: 6,
  libra: 7, scorpio: 8, sagittarius: 9, capricorn: 10, aquarius: 11, pisces: 12,
};

/**
 * Extract sign number from various formats.
 * Handles: int, "Aries", "1", {sign: "Aries"}, etc.
 */
function parseSignNum(val) {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).toLowerCase().trim();
  if (SIGN_NUMBERS[str]) return SIGN_NUMBERS[str];
  const num = parseInt(str, 10);
  return !isNaN(num) && num >= 1 && num <= 12 ? num : 0;
}

/**
 * Extract dasha data from the bundle (inner object, already unwrapped).
 * Backend key: bundle.dasha_tree = [{planet, start, end, sub_periods: [{planet, start, end, sub_periods}]}]
 */
function extractDasha(bundle) {
  if (!bundle) return null;

  // dasha_tree is the canonical backend key
  const dashas = bundle.dasha_tree || bundle.dasha_periods || bundle.vimshottari;
  if (!dashas || !Array.isArray(dashas)) return null;

  const now = new Date();

  // Find current Mahadasha (level 1)
  let currentMD = null;
  for (const md of dashas) {
    const start = new Date(md.start);
    const end = new Date(md.end);
    if (now >= start && now <= end) {
      currentMD = md;
      break;
    }
  }

  if (!currentMD) return null;

  // Find current Antardasha within MD
  let currentAD = null;
  const subPeriods = currentMD.sub_periods || [];
  for (const ad of subPeriods) {
    const start = new Date(ad.start);
    const end = new Date(ad.end);
    if (now >= start && now <= end) {
      currentAD = ad;
      break;
    }
  }

  return {
    md_planet: currentMD.planet,
    ad_planet: currentAD ? currentAD.planet : null,
    ad_start: currentAD ? currentAD.start : null,
    ad_end: currentAD ? currentAD.end : null,
  };
}

/**
 * Type → color/icon mapping for window classifications.
 */
const TYPE_CONFIG = {
  opportunity: { color: '#2ed573', bg: 'rgba(46, 213, 115, 0.12)', icon: 'fa-arrow-up', label: 'Opportunity' },
  threat:      { color: '#ff4757', bg: 'rgba(255, 71, 87, 0.12)',  icon: 'fa-arrow-down', label: 'Threat' },
  mixed:       { color: '#ffa502', bg: 'rgba(255, 165, 2, 0.12)',  icon: 'fa-arrows-alt-h', label: 'Mixed' },
};

const INTENSITY_CONFIG = {
  high:     { badge: 'tf-badge-high',     label: 'High' },
  moderate: { badge: 'tf-badge-moderate',  label: 'Moderate' },
  low:      { badge: 'tf-badge-low',       label: 'Low' },
};

/** Range slider presets — auto-interval keeps data points manageable. */
const RANGE_PRESETS = [
  { label: '3 Months',  days: 90,   interval: 7  },
  { label: '6 Months',  days: 180,  interval: 7  },
  { label: '1 Year',    days: 365,  interval: 14 },
  { label: '2 Years',   days: 730,  interval: 14 },
  { label: '5 Years',   days: 1825, interval: 60 },
  { label: '10 Years',  days: 3650, interval: 60 },
  { label: '20 Years',  days: 7300, interval: 90 },
];

/** Custom tooltip for the timeline Recharts area chart. */
function TimelineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const cfg = TYPE_CONFIG[d.window_type] || TYPE_CONFIG.mixed;
  return (
    <div className="tf-timeline-tooltip">
      <div className="tf-tt-date">{d.date}</div>
      <div className="tf-tt-type" style={{ color: cfg.color }}>
        <i className={`fas ${cfg.icon}`}></i> {cfg.label} ({d.intensity})
      </div>
      <div className="tf-tt-score">Score: {d.score?.toFixed(1)}</div>
      <div className="tf-tt-opp">Opportunity: {d.opportunity_score?.toFixed(1)}%</div>
      <div className="tf-tt-threat">Threat: {d.threat_score?.toFixed(1)}%</div>
      {d.primary_trigger && (
        <div className="tf-tt-trigger">Trigger: {d.primary_trigger}</div>
      )}
    </div>
  );
}


export default function TemporalForecastPage() {
  const { birthPayload, refreshKey, hasBirthData, chartBundle } = useMyData();
  const { user } = useAuth();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | opportunity | threat | mixed
  const [expandedCard, setExpandedCard] = useState(null);

  // Timeline state — keyed per life_area_id
  const [timelineData, setTimelineData] = useState({});
  const [timelineLoading, setTimelineLoading] = useState({});
  const [timelineError, setTimelineError] = useState({});
  const [timelineRange, setTimelineRange] = useState({});

  // Determine if user is premium (for LLM interpretation)
  const isPremium = user?.role === 'premium' || user?.role === 'admin';

  // Extract chart data from bundle
  // API response: { bundle: { request: {lat,lon,tz_id,...}, natal: { ascendant: {sign}, planets: {Moon: {sign}} }, dasha_tree: [...] }, manifest }
  const chartParams = useMemo(() => {
    if (!chartBundle || !birthPayload) return null;

    // chartBundle is the raw /v1/chart/create response — data lives under .bundle
    const b = chartBundle.bundle || chartBundle;
    const natal = b.natal || {};
    const asc = natal.ascendant || {};

    // Resolved request data from backend (always has lat/lon/tz_id from resolve_location)
    const reqData = b.request || {};

    const ascSign = parseSignNum(
      asc.sign || b.ascendant_sign || b.asc_sign
      || (b.charts?.D1?.lagna_sign)
    );

    // Moon sign — from natal planets
    const planets = natal.planets || b.planets || {};
    const moonSign = parseSignNum(
      planets.Moon?.sign || b.moon_sign
    );

    // Dasha — lives at bundle.dasha_tree (array of {planet, start, end, sub_periods})
    const dasha = extractDasha(b);

    if (!ascSign || !dasha?.md_planet) return null;

    // lat/lon/tz_id: prefer birthPayload, fall back to chart bundle's request data
    // (birthPayload may lack lat/lon if saved chart didn't store them,
    //  but reqData always has them from backend's resolve_location)
    const lat = birthPayload.lat ?? reqData.lat;
    const lon = birthPayload.lon ?? birthPayload.lng ?? reqData.lon;
    const tzId = birthPayload.tz_id || birthPayload.timezone || reqData.tz_id || 'UTC';

    if (lat == null || lon == null) return null;

    // Extract natal planet sign positions for Natal Potential Multiplier (NPM)
    const natalPlanetSigns = {};
    for (const [name, info] of Object.entries(planets)) {
      if (info?.sign_number) natalPlanetSigns[name] = info.sign_number;
    }

    return {
      lat,
      lon,
      tz_id: tzId,
      asc_sign: ascSign,
      moon_sign: moonSign || null,
      md_planet: dasha.md_planet,
      ad_planet: dasha.ad_planet,
      ad_start: dasha.ad_start,
      ad_end: dasha.ad_end,
      // Request all 13 life areas
      life_area_ids: null,
      // Natal planet signs for NPM scoring
      natal_planet_signs: Object.keys(natalPlanetSigns).length > 0 ? natalPlanetSigns : null,
    };
  }, [chartBundle, birthPayload]);

  // Fetch forecast when chart params are available
  useEffect(() => {
    if (!chartParams) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    const endpoint = isPremium
      ? '/v1/temporal-forecast/interpret'
      : '/v1/temporal-forecast/compute';

    // LLM interpretation for 13 life areas can take 60s+ — use extended timeout
    const fetchCall = isPremium
      ? api.postLong(endpoint, chartParams, 120_000)
      : api.post(endpoint, chartParams);

    fetchCall
      .then((res) => {
        if (!cancelled) {
          setForecastData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to compute temporal forecast');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey, chartParams, isPremium]);

  // Clear cached timeline data when chart params change (new chart loaded)
  useEffect(() => {
    setTimelineData({});
    setTimelineError({});
    setTimelineLoading({});
  }, [chartParams]);

  /** Fetch timeline for a single life area. */
  const fetchTimeline = useCallback(async (lifeAreaId, rangeIndex) => {
    if (!chartParams) return;
    const preset = RANGE_PRESETS[rangeIndex ?? 0];
    const now = new Date();
    const scanStart = now.toISOString().slice(0, 10);
    const end = new Date(now.getTime() + preset.days * 86400000);
    const scanEnd = end.toISOString().slice(0, 10);

    setTimelineLoading((p) => ({ ...p, [lifeAreaId]: true }));
    setTimelineError((p) => ({ ...p, [lifeAreaId]: '' }));

    try {
      const result = await api.postLong('/v1/temporal-forecast/timeline', {
        lat: chartParams.lat,
        lon: chartParams.lon,
        tz_id: chartParams.tz_id,
        asc_sign: chartParams.asc_sign,
        moon_sign: chartParams.moon_sign,
        md_planet: chartParams.md_planet,
        ad_planet: chartParams.ad_planet,
        ad_start: chartParams.ad_start,
        ad_end: chartParams.ad_end,
        natal_planet_signs: chartParams.natal_planet_signs,
        life_area_id: lifeAreaId,
        scan_start: scanStart,
        scan_end: scanEnd,
        interval_days: preset.interval,
      }, 120_000);
      setTimelineData((p) => ({ ...p, [lifeAreaId]: result }));
    } catch (err) {
      setTimelineError((p) => ({ ...p, [lifeAreaId]: err.message || 'Failed to load timeline' }));
    } finally {
      setTimelineLoading((p) => ({ ...p, [lifeAreaId]: false }));
    }
  }, [chartParams]);

  // Filtered forecasts
  const filteredForecasts = useMemo(() => {
    if (!forecastData?.forecasts) return [];
    if (filter === 'all') return forecastData.forecasts;
    return forecastData.forecasts.filter((f) => f.window_type === filter);
  }, [forecastData, filter]);

  // ── Render states ──

  // Premium gate — redirect free/basic users to upgrade prompt
  if (!isPremium) {
    return (
      <div className="tf-container">
        <div className="tf-premium-gate">
          <i className="fas fa-crown"></i>
          <h2>Premium Feature</h2>
          <p>Temporal Forecast is a premium feature that reveals opportunity and threat windows across 13 life areas based on your planetary transits and Vimshottari Dasha.</p>
          <div className="tf-premium-features">
            <div className="tf-pf-item"><i className="fas fa-check-circle"></i> 13 life area classifications</div>
            <div className="tf-pf-item"><i className="fas fa-check-circle"></i> Double transit analysis</div>
            <div className="tf-pf-item"><i className="fas fa-check-circle"></i> Sade Sati detection</div>
            <div className="tf-pf-item"><i className="fas fa-check-circle"></i> AI-powered interpretations</div>
          </div>
          <a href="/reports" className="btn-upgrade-tf">
            <i className="fas fa-arrow-up"></i> Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-hourglass-half"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your temporal opportunity &amp; threat forecast will appear here</p>
      </div>
    );
  }

  if (!chartBundle) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-chart-line"></i>
        <p>Chart data is loading...</p>
        <p className="hint">The temporal forecast needs your chart to compute</p>
      </div>
    );
  }

  if (!chartParams) {
    return (
      <div className="api-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Could not extract ascendant or dasha from chart data. Please ensure your birth time is accurate.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Computing temporal forecast across 13 life areas...</p>
        <p className="hint">Analyzing transits, dasha, Sade Sati, and double transit</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
      </div>
    );
  }

  if (!forecastData) return null;

  const { opportunity_count, threat_count, mixed_count, overall_type, overall_score, dasha_path, sade_sati_phase, transit_date } = forecastData;
  const overallCfg = TYPE_CONFIG[overall_type] || TYPE_CONFIG.mixed;

  return (
    <div className="tf-container">
      {/* ── Header ── */}
      <div className="tf-header">
        <div className="tf-header-left">
          <h2><i className="fas fa-hourglass-half"></i> Temporal Forecast</h2>
          <p className="tf-subtitle">
            Opportunity &amp; Threat Windows — {transit_date}
          </p>
        </div>
        <div className="tf-header-right">
          <div className="tf-overall-badge" style={{ borderColor: overallCfg.color, background: overallCfg.bg }}>
            <i className={`fas ${overallCfg.icon}`} style={{ color: overallCfg.color }}></i>
            <span>Overall: <strong style={{ color: overallCfg.color }}>{overallCfg.label}</strong></span>
            <span className="tf-score">{overall_score.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* ── Summary Strip ── */}
      <div className="tf-summary-strip">
        <div className="tf-summary-item tf-summary-dasha">
          <i className="fas fa-satellite-dish"></i>
          <span>Dasha: <strong>{dasha_path}</strong></span>
        </div>
        {sade_sati_phase !== 'none' && (
          <div className="tf-summary-item tf-summary-sade-sati">
            <i className="fas fa-ring"></i>
            <span>Sade Sati: <strong>{sade_sati_phase}</strong></span>
          </div>
        )}
        <div className="tf-summary-item tf-summary-opp">
          <i className="fas fa-arrow-up" style={{ color: '#2ed573' }}></i>
          <span>{opportunity_count} Opportunity</span>
        </div>
        <div className="tf-summary-item tf-summary-threat">
          <i className="fas fa-arrow-down" style={{ color: '#ff4757' }}></i>
          <span>{threat_count} Threat</span>
        </div>
        <div className="tf-summary-item tf-summary-mixed">
          <i className="fas fa-arrows-alt-h" style={{ color: '#ffa502' }}></i>
          <span>{mixed_count} Mixed</span>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="tf-filters">
        {['all', 'opportunity', 'threat', 'mixed'].map((f) => (
          <button
            key={f}
            className={`tf-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={f !== 'all' && filter === f ? { borderColor: TYPE_CONFIG[f]?.color } : {}}
          >
            {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label}
            {f === 'all' && ` (${forecastData.forecasts.length})`}
            {f === 'opportunity' && ` (${opportunity_count})`}
            {f === 'threat' && ` (${threat_count})`}
            {f === 'mixed' && ` (${mixed_count})`}
          </button>
        ))}
      </div>

      {/* ── Forecast Cards Grid ── */}
      <div className="tf-grid">
        {filteredForecasts.map((f) => {
          const cfg = TYPE_CONFIG[f.window_type] || TYPE_CONFIG.mixed;
          const intCfg = INTENSITY_CONFIG[f.intensity] || INTENSITY_CONFIG.low;
          const isExpanded = expandedCard === f.life_area_id;

          return (
            <div
              key={f.life_area_id}
              className={`tf-card ${isExpanded ? 'tf-card-expanded' : ''}`}
              style={{ borderColor: cfg.color + '40' }}
              onClick={() => setExpandedCard(isExpanded ? null : f.life_area_id)}
            >
              {/* Card Header */}
              <div className="tf-card-header">
                <div className="tf-card-icon" style={{ color: cfg.color }}>
                  <i className={`fas ${f.icon}`}></i>
                </div>
                <div className="tf-card-title">
                  <h3>{f.premium_label}</h3>
                  <span className="tf-card-domain">{f.domain_name}</span>
                </div>
                <div className="tf-card-badge-group">
                  <span className={`tf-badge tf-badge-type`} style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '60' }}>
                    <i className={`fas ${cfg.icon}`}></i> {cfg.label}
                  </span>
                  <span className={`tf-badge ${intCfg.badge}`}>
                    {intCfg.label}
                  </span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="tf-score-bar">
                <div className="tf-score-track">
                  <div
                    className="tf-score-fill-opp"
                    style={{ width: `${Math.min(f.opportunity_score, 100)}%` }}
                  ></div>
                  <div
                    className="tf-score-fill-threat"
                    style={{ width: `${Math.min(f.threat_score, 100)}%` }}
                  ></div>
                </div>
                <div className="tf-score-labels">
                  <span style={{ color: '#2ed573' }}>{f.opportunity_score.toFixed(0)}% opp</span>
                  <span className="tf-score-total">{f.score.toFixed(1)}</span>
                  <span style={{ color: '#ff4757' }}>{f.threat_score.toFixed(0)}% thr</span>
                </div>
              </div>

              {/* Summary */}
              {f.summary && (
                <p className="tf-card-summary">{f.summary}</p>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="tf-card-details">
                  {/* Key Transits */}
                  {f.key_transits && f.key_transits.length > 0 && (
                    <div className="tf-detail-section">
                      <h4><i className="fas fa-planet-ringed"></i> Key Transits</h4>
                      <div className="tf-transit-list">
                        {f.key_transits.map((t, idx) => (
                          <div key={idx} className="tf-transit-item">
                            <span className="tf-transit-planet">{t.planet}</span>
                            <span className="tf-transit-sign">{t.sign} (H{t.house_from_lagna})</span>
                            {t.is_retrograde && <span className="tf-retro-badge">R</span>}
                            <span className={`tf-nature-badge tf-nature-${t.functional_nature?.replace(/_/g, '-')}`}>
                              {t.functional_nature?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Indicators */}
                  <div className="tf-detail-section tf-indicators">
                    {f.double_transit && (
                      <div className="tf-indicator tf-indicator-positive">
                        <i className="fas fa-check-double"></i>
                        <span>Double Transit (Houses {f.double_transit_houses?.join(', ')})</span>
                      </div>
                    )}
                    {f.sade_sati_phase !== 'none' && (
                      <div className="tf-indicator tf-indicator-warning">
                        <i className="fas fa-ring"></i>
                        <span>Sade Sati — {f.sade_sati_phase} phase</span>
                      </div>
                    )}
                    <div className="tf-indicator">
                      <i className="fas fa-satellite-dish"></i>
                      <span>Dasha: {f.dasha_path} ({f.dasha_lord_nature})</span>
                    </div>
                    <div className="tf-indicator">
                      <i className="fas fa-home"></i>
                      <span>Primary Houses: {f.primary_houses?.join(', ')}</span>
                    </div>
                  </div>

                  {/* LLM Interpretation (Premium) */}
                  {f.interpretation && (
                    <div className="tf-interpretation">
                      <h4><i className="fas fa-brain"></i> AI Interpretation</h4>
                      <p>{f.interpretation}</p>
                    </div>
                  )}

                  {/* Premium upsell if no interpretation */}
                  {!f.interpretation && !isPremium && (
                    <div className="tf-premium-upsell">
                      <i className="fas fa-crown"></i>
                      <span>Upgrade to Premium for AI-powered interpretations of each life area</span>
                    </div>
                  )}

                  {/* ── Timeline Section ── */}
                  <div className="tf-timeline-section">
                    <h4><i className="fas fa-calendar-alt"></i> Timeline</h4>

                    {/* Range Slider + Load Button */}
                    <div className="tf-timeline-controls">
                      <label className="tf-range-label">
                        {RANGE_PRESETS[timelineRange[f.life_area_id] ?? 0].label}
                      </label>
                      <div className="tf-range-slider-row">
                        <span className="tf-range-end-label">Now</span>
                        <input
                          type="range"
                          min={0}
                          max={RANGE_PRESETS.length - 1}
                          value={timelineRange[f.life_area_id] ?? 0}
                          className="tf-range-slider"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            const idx = Number(e.target.value);
                            setTimelineRange((p) => ({ ...p, [f.life_area_id]: idx }));
                          }}
                        />
                        <span className="tf-range-end-label">20 Years</span>
                      </div>
                      <button
                        className="tf-timeline-load-btn"
                        disabled={timelineLoading[f.life_area_id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchTimeline(f.life_area_id, timelineRange[f.life_area_id] ?? 0);
                        }}
                      >
                        {timelineLoading[f.life_area_id]
                          ? <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                          : <><i className="fas fa-chart-area"></i> Load Timeline</>
                        }
                      </button>
                    </div>

                    {/* Error */}
                    {timelineError[f.life_area_id] && (
                      <div className="tf-timeline-error">
                        <i className="fas fa-exclamation-circle"></i> {timelineError[f.life_area_id]}
                      </div>
                    )}

                    {/* Chart */}
                    {timelineData[f.life_area_id] && !timelineLoading[f.life_area_id] && (() => {
                      const tl = timelineData[f.life_area_id];
                      return (
                        <div className="tf-timeline-chart-wrapper" onClick={(e) => e.stopPropagation()}>
                          {/* Peak badges */}
                          <div className="tf-timeline-peaks">
                            {tl.peak_opportunity && (
                              <span className="tf-peak-badge tf-peak-opp">
                                <i className="fas fa-arrow-up"></i> Peak Opportunity: {tl.peak_opportunity.date} (score {tl.peak_opportunity.score})
                              </span>
                            )}
                            {tl.peak_threat && (
                              <span className="tf-peak-badge tf-peak-threat">
                                <i className="fas fa-arrow-down"></i> Peak Threat: {tl.peak_threat.date} (score {tl.peak_threat.score})
                              </span>
                            )}
                          </div>

                          {/* Summary stats */}
                          <div className="tf-timeline-stats">
                            <span><i className="fas fa-arrow-up" style={{color:'#2ed573'}}></i> {tl.opportunity_count} opportunity</span>
                            <span><i className="fas fa-arrow-down" style={{color:'#ff4757'}}></i> {tl.threat_count} threat</span>
                            <span><i className="fas fa-arrows-alt-h" style={{color:'#ffa502'}}></i> {tl.mixed_count} mixed</span>
                            <span className="tf-timeline-interval">Every {tl.interval_days} days</span>
                          </div>

                          {/* Recharts Area Chart */}
                          <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={tl.points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`grad-opp-${f.life_area_id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#2ed573" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#2ed573" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id={`grad-threat-${f.life_area_id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ff4757" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#ff4757" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                              <XAxis
                                dataKey="date"
                                tick={{ fill: '#8891a5', fontSize: 11 }}
                                tickFormatter={(d) => {
                                  const dt = new Date(d);
                                  return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                                }}
                                interval="preserveStartEnd"
                              />
                              <YAxis domain={[0, 100]} tick={{ fill: '#8891a5', fontSize: 11 }} width={35} />
                              <Tooltip content={<TimelineTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="opportunity_score"
                                stroke="#2ed573"
                                fill={`url(#grad-opp-${f.life_area_id})`}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: '#2ed573' }}
                              />
                              <Area
                                type="monotone"
                                dataKey="threat_score"
                                stroke="#ff4757"
                                fill={`url(#grad-threat-${f.life_area_id})`}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: '#ff4757' }}
                              />
                              {tl.peak_opportunity && (
                                <ReferenceDot
                                  x={tl.peak_opportunity.date}
                                  y={tl.peak_opportunity.score}
                                  r={6}
                                  fill="#2ed573"
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              )}
                              {tl.peak_threat && (
                                <ReferenceDot
                                  x={tl.peak_threat.date}
                                  y={tl.peak_threat.score}
                                  r={6}
                                  fill="#ff4757"
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              )}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Expand indicator */}
              <div className="tf-card-expand-hint">
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
              </div>
            </div>
          );
        })}
      </div>

      {filteredForecasts.length === 0 && (
        <div className="tf-empty-filter">
          <i className="fas fa-filter"></i>
          <p>No {filter} windows found. Try a different filter.</p>
        </div>
      )}
    </div>
  );
}
