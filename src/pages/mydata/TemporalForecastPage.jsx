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
import { useStyles } from '../../context/StyleContext';
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

const MAX_TIMELINE_MONTHS = 240;

function addMonths(baseDate, monthOffset) {
  const next = new Date(baseDate);
  next.setHours(0, 0, 0, 0);
  next.setMonth(next.getMonth() + monthOffset);
  return next;
}

function formatMonthYear(value) {
  return value.toLocaleDateString('en-AU', {
    month: 'short',
    year: 'numeric',
  });
}

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

function formatDisplayDate(value) {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getSimpleTone(windowType) {
  if (windowType === 'opportunity') return 'Favourable period';
  if (windowType === 'threat') return 'Caution period';
  return 'Mixed period';
}

function buildSimpleSummary(forecast) {
  const dateRange = `${formatDisplayDate(forecast.start)} to ${formatDisplayDate(forecast.end)}`;
  if (forecast.window_type === 'opportunity') {
    return `This looks like a supportive phase for ${forecast.premium_label.toLowerCase()} from ${dateRange}. The stronger indicators currently outweigh the cautions.`;
  }
  if (forecast.window_type === 'threat') {
    return `This looks like a caution-heavy phase for ${forecast.premium_label.toLowerCase()} from ${dateRange}. Move more carefully while the pressure points are active.`;
  }
  return `This period is mixed for ${forecast.premium_label.toLowerCase()} from ${dateRange}. There is progress available, but it comes with trade-offs and timing sensitivity.`;
}

function buildSimpleAction(forecast) {
  if (forecast.window_type === 'opportunity') {
    return 'Lean into the opening, but act with structure so the gains hold.';
  }
  if (forecast.window_type === 'threat') {
    return 'Slow down, reduce avoidable risk, and focus on protection before expansion.';
  }
  return 'Take selective action only in the strongest pockets and avoid overcommitting.';
}

function buildSimpleReason(forecast) {
  const reasons = [];
  if (forecast.primary_trigger) reasons.push(forecast.primary_trigger);
  if (forecast.double_transit && forecast.double_transit_houses?.length) {
    reasons.push(`Double transit support is active on houses ${forecast.double_transit_houses.join(', ')}`);
  }
  if (forecast.sade_sati_phase && forecast.sade_sati_phase !== 'none') {
    reasons.push(`Sade Sati is in its ${forecast.sade_sati_phase} phase`);
  }
  if (forecast.dasha_path) {
    reasons.push(`The active dasha line is ${forecast.dasha_path}`);
  }
  return reasons.slice(0, 3);
}

function getWindowApproach(windowType) {
  if (windowType === 'opportunity') {
    return 'Take action in a structured way and use the opening while support is active.';
  }
  if (windowType === 'threat') {
    return 'Slow down, protect against avoidable risk, and prioritise remedies and caution.';
  }
  return 'Stay selective. This is a transitional period with both openings and pressure points.';
}

function buildDominanceReading(opportunityScore = 0, threatScore = 0) {
  const opp = Number(opportunityScore) || 0;
  const thr = Number(threatScore) || 0;

  if (opp <= 0 && thr <= 0) {
    return 'No side is clearly active here yet, so wait for a stronger signal before making a big move.';
  }
  if (opp > thr * 1.5) {
    return 'Opportunity dominates here. The green score is materially stronger than the red score, so this is better treated as a supportive phase.';
  }
  if (thr > opp * 1.5) {
    return 'Threat dominates here. The red score is materially stronger than the green score, so this is better treated as a caution phase.';
  }
  return 'Both are active here. Neither side dominates enough, so treat this as mixed and act selectively rather than fully committing.';
}

function buildTimelineReadingRule() {
  return 'Reading rule: treat a point as Opportunity only when green clearly dominates red, as Threat when red clearly dominates green, and as Mixed when both stay close enough to coexist.';
}

function buildPageReadingGuide() {
  return 'How to read this: green shows support and openings, red shows pressure and risk, and the final label follows the side that clearly dominates. If both stay close, treat the period as mixed.';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildTimelineSegments(points = []) {
  if (!Array.isArray(points) || points.length === 0) return [];
  const segments = [];
  let current = {
    type: points[0].window_type,
    start: points[0].date,
    end: points[0].date,
    maxScore: points[0].score || 0,
  };

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (point.window_type === current.type) {
      current.end = point.date;
      current.maxScore = Math.max(current.maxScore, point.score || 0);
      continue;
    }
    segments.push(current);
    current = {
      type: point.window_type,
      start: point.date,
      end: point.date,
      maxScore: point.score || 0,
    };
  }
  segments.push(current);
  return segments;
}


export default function TemporalForecastPage({ viewMode = 'simple', selectedChartId = '' }) {
  const { birthPayload, refreshKey, hasBirthData, chartBundle } = useMyData();
  const { user } = useAuth();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryState, setDeliveryState] = useState({ sending: false, message: '', error: '' });
  const [filter, setFilter] = useState('all'); // all | opportunity | threat | mixed
  const [expandedCard, setExpandedCard] = useState(null);
  // Timeline state — keyed per life_area_id
  const [timelineData, setTimelineData] = useState({});
  const [timelineLoading, setTimelineLoading] = useState({});
  const [timelineError, setTimelineError] = useState({});
  const [timelineStartRange, setTimelineStartRange] = useState({});
  const [timelineEndRange, setTimelineEndRange] = useState({});
  const [activeTimelineDrag, setActiveTimelineDrag] = useState(null);

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

  const handleDeliverReport = useCallback(async () => {
    if (!chartParams) return;
    setDeliveryState({ sending: true, message: '', error: '' });
    try {
      const result = await api.postLong('/v1/temporal-forecast/deliver', {
        ...chartParams,
        saved_chart_id: selectedChartId || undefined,
        chart_name: birthPayload?.name || user?.full_name || 'Your Chart',
        place_of_birth: birthPayload?.place_of_birth || '',
        presentation_mode: viewMode,
        send_email: true,
      }, 120_000);

      setDeliveryState({
        sending: false,
        message: result.emailed
          ? `Saved to My Reports and emailed to ${result.recipient}.`
          : 'Saved to My Reports. Email could not be sent from this environment.',
        error: '',
      });
    } catch (err) {
      setDeliveryState({
        sending: false,
        message: '',
        error: err.message || 'Failed to generate the report deliverable.',
      });
    }
  }, [birthPayload?.name, birthPayload?.place_of_birth, chartParams, selectedChartId, user?.full_name, viewMode]);

  /** Fetch timeline for a single life area. */
  const fetchTimeline = useCallback(async (lifeAreaId, startMonthOffset, endMonthOffset) => {
    if (!chartParams) return;
    const now = new Date();
    const safeStartOffset = Math.max(0, Math.min(startMonthOffset ?? 0, MAX_TIMELINE_MONTHS - 1));
    const safeEndOffset = Math.max(safeStartOffset + 1, Math.min(endMonthOffset ?? 6, MAX_TIMELINE_MONTHS));
    const scanStartDate = addMonths(now, safeStartOffset);
    const scanEndDate = addMonths(now, safeEndOffset);
    const scanStart = scanStartDate.toISOString().slice(0, 10);
    const scanEnd = scanEndDate.toISOString().slice(0, 10);
    const effectiveDays = Math.max(1, Math.round((scanEndDate - scanStartDate) / 86400000));
    const intervalDays = Math.min(90, Math.max(7, Math.round(effectiveDays / 26)));

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
        interval_days: intervalDays,
      }, 120_000);
      setTimelineData((p) => ({ ...p, [lifeAreaId]: result }));
    } catch (err) {
      setTimelineError((p) => ({ ...p, [lifeAreaId]: err.message || 'Failed to load timeline' }));
    } finally {
      setTimelineLoading((p) => ({ ...p, [lifeAreaId]: false }));
    }
  }, [chartParams]);

  const updateTimelineRangeFromClientX = useCallback((lifeAreaId, handle, clientX, trackEl) => {
    if (!trackEl) return;
    const rect = trackEl.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const offset = Math.round(ratio * MAX_TIMELINE_MONTHS);

    if (handle === 'start') {
      setTimelineStartRange((p) => {
        const currentEnd = timelineEndRange[lifeAreaId] ?? 6;
        return {
          ...p,
          [lifeAreaId]: clamp(offset, 0, currentEnd - 1),
        };
      });
      return;
    }

    setTimelineEndRange((p) => {
      const currentStart = timelineStartRange[lifeAreaId] ?? 0;
      return {
        ...p,
        [lifeAreaId]: clamp(offset, currentStart + 1, MAX_TIMELINE_MONTHS),
      };
    });
  }, [timelineEndRange, timelineStartRange]);

  useEffect(() => {
    if (!activeTimelineDrag) return undefined;

    const handlePointerMove = (event) => {
      updateTimelineRangeFromClientX(
        activeTimelineDrag.lifeAreaId,
        activeTimelineDrag.handle,
        event.clientX,
        activeTimelineDrag.trackEl,
      );
    };

    const handlePointerUp = () => {
      setActiveTimelineDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeTimelineDrag, updateTimelineRangeFromClientX]);

  useEffect(() => {
    if (viewMode !== 'simple' || !expandedCard) return;
    if (timelineData[expandedCard] || timelineLoading[expandedCard]) return;
    fetchTimeline(expandedCard, 0, 6);
  }, [expandedCard, fetchTimeline, timelineData, timelineLoading, viewMode]);

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
          <a href="/pricing" className="btn-upgrade-tf">
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
  const today = new Date();
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
          <button
            className="tf-filter-btn active"
            onClick={handleDeliverReport}
            disabled={deliveryState.sending}
            style={{ marginLeft: '12px' }}
          >
            {deliveryState.sending ? (
              <><i className="fas fa-spinner fa-spin"></i> Sending Report...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Email PDF Report</>
            )}
          </button>
        </div>
      </div>

      {deliveryState.message && (
        <div className="api-success">
          <i className="fas fa-check-circle"></i>
          <p>{deliveryState.message}</p>
        </div>
      )}

      {deliveryState.error && (
        <div className="api-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{deliveryState.error}</p>
        </div>
      )}

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
      <p className="tf-reading-guide">{buildPageReadingGuide()}</p>

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
          const toggleExpandedCard = () => setExpandedCard(isExpanded ? null : f.life_area_id);

          return (
            <div
              key={f.life_area_id}
              className={`tf-card ${isExpanded ? 'tf-card-expanded' : ''}`}
              style={{ borderColor: cfg.color + '40' }}
            >
              {/* Card Header */}
              <button
                type="button"
                className="tf-card-header"
                onClick={toggleExpandedCard}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${f.premium_label}`}
              >
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
              </button>

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
                <p className="tf-score-reading">
                  {buildDominanceReading(f.opportunity_score, f.threat_score)}
                </p>
              </div>

              {/* Summary */}
              {f.summary && (
                <p className="tf-card-summary">{f.summary}</p>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="tf-card-details">
                  {viewMode === 'simple' ? (
                    <>
                      <div className="tf-detail-section">
                        <h4><i className="fas fa-sparkles"></i> Plain-English Outlook</h4>
                        <p className="tf-simple-intro">
                          {buildSimpleSummary(f)}
                        </p>
                        {timelineLoading[f.life_area_id] && (
                          <div className="tf-simple-loading">Preparing threat and opportunity windows...</div>
                        )}
                        {timelineData[f.life_area_id] && (
                          <div className="tf-simple-table-wrap">
                            <div className="tf-simple-table-head">
                              <span>Duration</span>
                              <span>Window Type</span>
                              <span>Best Approach / Remedy</span>
                            </div>
                            <div className="tf-simple-table-body">
                              {buildTimelineSegments(timelineData[f.life_area_id].points)
                                .filter((segment) => segment.type === 'opportunity' || segment.type === 'threat')
                                .map((segment, idx) => (
                                  <div key={`${segment.type}-${segment.start}-${idx}`} className="tf-simple-table-row">
                                    <div className="tf-simple-table-duration">
                                      {formatDisplayDate(segment.start)} - {formatDisplayDate(segment.end)}
                                    </div>
                                    <div>
                                      <span className={`tf-simple-window-badge tf-simple-window-${segment.type}`}>
                                        {segment.type === 'opportunity' ? 'Opportunity' : 'Threat'}
                                      </span>
                                    </div>
                                    <div className="tf-simple-table-guidance">
                                      {getWindowApproach(segment.type)}
                                    </div>
                                  </div>
                                ))}
                              {buildTimelineSegments(timelineData[f.life_area_id].points)
                                .filter((segment) => segment.type === 'opportunity' || segment.type === 'threat').length === 0 && (
                                  <div className="tf-simple-table-empty">
                                    No distinct threat or opportunity windows were found inside this selected range.
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                        {buildSimpleReason(f).length > 0 && (
                          <div className="tf-simple-reasons-block">
                            <div className="tf-simple-reasons-title">Why we are saying this</div>
                            <div className="tf-simple-reasons">
                              {buildSimpleReason(f).map((reason) => (
                                <span key={reason} className="tf-simple-reason-chip">{reason}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {f.interpretation && (
                        <div className="tf-interpretation">
                          <h4><i className="fas fa-brain"></i> AI Guidance</h4>
                          <p>{f.interpretation}</p>
                          <div className="tf-ai-review-note">
                            Simple view uses the same reviewed forecast as Advanced mode. The interpretation comes from the shared generator and reviewer pipeline before it is simplified for presentation.
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
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

                      <div className="tf-detail-section">
                        <h4><i className="fas fa-calendar-alt"></i> Forecast Window</h4>
                        <div className="tf-date-chips">
                          <span className="tf-date-chip">
                            <i className="fas fa-play"></i> Start: {formatDisplayDate(f.start)}
                          </span>
                          <span className="tf-date-chip">
                            <i className="fas fa-flag-checkered"></i> End: {formatDisplayDate(f.end)}
                          </span>
                        </div>
                      </div>

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

                      {!f.interpretation && !isPremium && (
                        <div className="tf-premium-upsell">
                          <i className="fas fa-crown"></i>
                          <span>Upgrade to Premium for AI-powered interpretations of each life area</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Timeline Section ── */}
                  <div className="tf-timeline-section">
                    <h4><i className="fas fa-calendar-alt"></i> Timeline</h4>

                    {/* Range Slider + Load Button */}
                    <div className="tf-timeline-controls">
                      <div className="tf-range-control-group">
                        <label className="tf-range-label">Select custom timeline range</label>
                        <div className="tf-dual-range-wrap" onClick={(e) => e.stopPropagation()}>
                          <div className="tf-dual-range-track"></div>
                          <div
                            className="tf-dual-range-fill"
                            style={{
                              left: `${((timelineStartRange[f.life_area_id] ?? 0) / MAX_TIMELINE_MONTHS) * 100}%`,
                              width: `${(((timelineEndRange[f.life_area_id] ?? 6) - (timelineStartRange[f.life_area_id] ?? 0)) / MAX_TIMELINE_MONTHS) * 100}%`,
                            }}
                          ></div>
                          <button
                            type="button"
                            className="tf-range-thumb tf-range-thumb-start"
                            style={{
                              left: `${((timelineStartRange[f.life_area_id] ?? 0) / MAX_TIMELINE_MONTHS) * 100}%`,
                            }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveTimelineDrag({
                                lifeAreaId: f.life_area_id,
                                handle: 'start',
                                trackEl: e.currentTarget.parentElement,
                              });
                            }}
                            aria-label="Adjust timeline start"
                          />
                          <button
                            type="button"
                            className="tf-range-thumb tf-range-thumb-end"
                            style={{
                              left: `${((timelineEndRange[f.life_area_id] ?? 6) / MAX_TIMELINE_MONTHS) * 100}%`,
                            }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveTimelineDrag({
                                lifeAreaId: f.life_area_id,
                                handle: 'end',
                                trackEl: e.currentTarget.parentElement,
                              });
                            }}
                            aria-label="Adjust timeline end"
                          />
                        </div>
                      </div>
                      <div className="tf-range-axis">
                        <span>{formatMonthYear(today)}</span>
                        <span>{formatMonthYear(addMonths(today, MAX_TIMELINE_MONTHS))}</span>
                      </div>
                      <div className="tf-range-summary">
                        Timeline window: {formatDisplayDate(
                          addMonths(today, timelineStartRange[f.life_area_id] ?? 0),
                        )} to {formatDisplayDate(
                          addMonths(today, timelineEndRange[f.life_area_id] ?? 6),
                        )}
                      </div>
                      <button
                        className="tf-timeline-load-btn"
                        disabled={timelineLoading[f.life_area_id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchTimeline(
                            f.life_area_id,
                            timelineStartRange[f.life_area_id] ?? 0,
                            timelineEndRange[f.life_area_id] ?? 6,
                          );
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
                            <span className="tf-peak-badge tf-peak-range">
                              <i className="fas fa-calendar-alt"></i> Range: {formatDisplayDate(tl.scan_start)} to {formatDisplayDate(tl.scan_end)}
                            </span>
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
                          <p className="tf-timeline-reading">{buildTimelineReadingRule()}</p>

                          {viewMode === 'simple' && (
                            <div className="tf-simple-timeline">
                              <h5>Chronological sequence</h5>
                              <div className="tf-simple-sequence">
                                {buildTimelineSegments(tl.points).map((segment, idx) => (
                                  <div key={`${segment.type}-${segment.start}-${idx}`} className={`tf-simple-segment tf-simple-segment-${segment.type}`}>
                                    <div className="tf-simple-segment-dates">
                                      {formatDisplayDate(segment.start)} to {formatDisplayDate(segment.end)}
                                    </div>
                                    <div className="tf-simple-segment-text">
                                      {segment.type === 'opportunity' && 'Supportive period — better for action and forward movement.'}
                                      {segment.type === 'threat' && 'Caution period — slow down and manage avoidable risks.'}
                                      {segment.type === 'mixed' && 'Mixed period — selective action works better than full commitment.'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

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
              <button
                type="button"
                className="tf-card-expand-hint"
                onClick={toggleExpandedCard}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${f.premium_label} details`}
              >
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
              </button>
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
