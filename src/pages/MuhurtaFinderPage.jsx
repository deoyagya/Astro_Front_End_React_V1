import '../styles/muhurta.css';
import PageShell from '../components/PageShell';
import { useState, useEffect, useCallback, useMemo } from 'react';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Fallback hardcoded events (used if API is unavailable)
const FALLBACK_EVENT_TYPES = [
  { value: 'marriage',          label: 'Marriage',          icon: 'fa-ring',          color: '#ff6b81' },
  { value: 'business_launch',   label: 'Business Launch',   icon: 'fa-briefcase',     color: '#ffa502' },
  { value: 'travel',            label: 'Travel',            icon: 'fa-plane',         color: '#70a1ff' },
  { value: 'griha_pravesh',     label: 'Griha Pravesh',     icon: 'fa-home',          color: '#2ed573' },
  { value: 'upanayana',         label: 'Upanayana',         icon: 'fa-om',            color: '#eccc68' },
  { value: 'surgery',           label: 'Surgery',           icon: 'fa-heartbeat',     color: '#ff4757' },
  { value: 'vehicle_purchase',  label: 'Vehicle Purchase',  icon: 'fa-car',           color: '#7bed9f' },
  { value: 'property_purchase', label: 'Property Purchase', icon: 'fa-building',      color: '#a29bfe' },
];

const QUALITY_COLORS = {
  excellent: '#2ed573',
  good:      '#7bed9f',
  average:   '#ffa502',
  poor:      '#ff6348',
  avoid:     '#ff4757',
};

const PAGE_SIZE = 2;

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Add N days to today and return YYYY-MM-DD string. */
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/** Format period key into readable label */
function periodLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Convert "HH:MM" or "HH:MM:SS" to minutes since midnight */
function toMin(t) {
  if (!t) return null;
  const [h, m] = t.substring(0, 5).split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight back to "HH:MM" */
function fromMin(m) {
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Compute favourable (auspicious) time ranges within a window
 * by subtracting all inauspicious periods from the window span.
 * Returns array of { start, end } strings.
 */
function computeFavourableRanges(w) {
  const wStart = toMin(w.start_time);
  const wEnd = toMin(w.end_time);
  if (wStart == null || wEnd == null || wEnd <= wStart) return [];

  // Collect all avoid intervals as [start, end] in minutes
  const avoids = [];
  const inaus = w.inauspicious_periods || {};
  for (const val of Object.values(inaus)) {
    if (val && typeof val === 'object') {
      const s = toMin(val.start_time);
      const e = toMin(val.end_time);
      if (s != null && e != null && e > s) {
        avoids.push([Math.max(s, wStart), Math.min(e, wEnd)]);
      }
    }
  }

  // Sort by start time and merge overlapping avoid intervals
  avoids.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of avoids) {
    if (merged.length && s <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    } else {
      merged.push([s, e]);
    }
  }

  // Compute gaps = favourable ranges
  const ranges = [];
  let cursor = wStart;
  for (const [s, e] of merged) {
    if (s > cursor) {
      ranges.push({ start: fromMin(cursor), end: fromMin(s) });
    }
    cursor = Math.max(cursor, e);
  }
  if (cursor < wEnd) {
    ranges.push({ start: fromMin(cursor), end: fromMin(wEnd) });
  }
  return ranges;
}

export default function MuhurtaFinderPage() {
  const { isAuthenticated, user } = useAuth();

  // --- Dynamic event types (fetched from API) ---
  const [eventTypes, setEventTypes] = useState(FALLBACK_EVENT_TYPES);

  // --- Form state ---
  const [selectedEvent, setSelectedEvent] = useState('');
  const [place, setPlace] = useState(null);
  const [startOffset, setStartOffset] = useState(0);    // days from today (0 = today)
  const [duration, setDuration] = useState(14);          // scan duration in days

  // Computed dates from sliders (always future)
  const startDate = useMemo(() => addDays(startOffset), [startOffset]);
  const endDate = useMemo(() => addDays(startOffset + duration), [startOffset, duration]);

  // --- Birth data state ---
  const [savedCharts, setSavedCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState('');
  const [birthMode, setBirthMode] = useState('none'); // 'none' | 'saved' | 'manual'
  const [manualBirth, setManualBirth] = useState({ name: '', dob: '', tob: '', place_of_birth: '' });
  const [manualBirthPlace, setManualBirthPlace] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(false);

  // --- Results state ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // --- Pagination ---
  const [windowPage, setWindowPage] = useState(0);

  // --- Email report state ---
  const [reportEmail, setReportEmail] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportStatus, setReportStatus] = useState('');

  // --- Paywall state (Phase 36F) ---
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // --- LLM Interpretation state (Phase 36G) ---
  const [interpretExpanded, setInterpretExpanded] = useState(true);

  // Fetch event types from API on mount
  useEffect(() => {
    api.get('/v1/muhurta/events')
      .then(data => {
        if (data?.events?.length > 0) {
          setEventTypes(data.events.map(ev => ({
            value: ev.event_key,
            label: ev.label,
            icon: ev.icon,
            color: ev.color,
            is_free: ev.is_free,
            price_display: ev.price_display,
            effective_price_paisa: ev.effective_price_paisa,
          })));
        }
      })
      .catch(() => { /* fallback to hardcoded */ });
  }, []);

  // Pre-fill email with logged-in user's email
  useEffect(() => {
    if (user?.email) setReportEmail(user.email);
  }, [user]);

  // Fetch saved charts on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    setChartsLoading(true);
    api.get('/v1/charts/saved?limit=20')
      .then(data => {
        const charts = data?.charts || data || [];
        setSavedCharts(Array.isArray(charts) ? charts : []);
        if (Array.isArray(charts) && charts.length > 0) {
          setBirthMode('saved');
          setSelectedChartId(charts[0].id);
        } else {
          setBirthMode('manual');
        }
      })
      .catch(() => {
        setBirthMode('manual');
      })
      .finally(() => setChartsLoading(false));
  }, [isAuthenticated]);

  // Reset results when form inputs change
  useEffect(() => {
    setResult(null);
    setWindowPage(0);
    setReportStatus('');
  }, [selectedEvent, startOffset, duration]);

  // Build birth_data payload from selected mode
  const getBirthData = useCallback(() => {
    if (birthMode === 'none') return null;

    if (birthMode === 'saved' && selectedChartId) {
      const chart = savedCharts.find(c => c.id === selectedChartId);
      if (!chart?.birth_data) return null;
      const bd = chart.birth_data;
      return {
        name: bd.name || 'Unknown',
        dob: bd.dob,
        tob: bd.tob,
        place_of_birth: bd.place_of_birth || 'Unknown',
        lat: bd.lat || undefined,
        lon: bd.lon || undefined,
        tz_id: bd.tz_id || undefined,
      };
    }

    if (birthMode === 'manual') {
      if (!manualBirth.name || !manualBirth.dob || !manualBirth.tob) return null;
      return {
        name: manualBirth.name,
        dob: manualBirth.dob,
        tob: manualBirth.tob,
        place_of_birth: manualBirthPlace?.name || manualBirth.place_of_birth || 'Unknown',
        lat: manualBirthPlace?.lat || undefined,
        lon: manualBirthPlace?.lon || undefined,
      };
    }

    return null;
  }, [birthMode, selectedChartId, savedCharts, manualBirth, manualBirthPlace]);

  const handleSearch = useCallback(async () => {
    setError('');
    setResult(null);
    setReportStatus('');
    setWindowPage(0);

    if (!selectedEvent) { setError('Please select an event type.'); return; }
    if (!place) { setError('Please select a location.'); return; }

    const payload = {
      event_type: selectedEvent,
      start_date: startDate,
      end_date: endDate,
      lat: place.lat,
      lon: place.lon,
      tz_id: place.timezone || undefined,
    };

    // Add birth data if available
    const birthData = getBirthData();
    if (birthData) {
      payload.birth_data = birthData;
    }

    setLoading(true);
    setPaymentRequired(false);
    setPricing(null);
    try {
      const data = await api.post('/v1/muhurta/find', payload);
      setResult(data);
      // Check paywall flag from backend
      if (data.payment_required) {
        setPaymentRequired(true);
        setPricing(data.pricing || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to find Muhurta windows.');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, place, startDate, endDate, getBirthData]);

  const handleEmailReport = useCallback(async () => {
    if (!reportEmail || !place) return;
    setReportSending(true);
    setReportStatus('');

    const payload = {
      event_type: selectedEvent,
      start_date: startDate,
      end_date: endDate,
      lat: place.lat,
      lon: place.lon,
      tz_id: place.timezone || undefined,
      email: reportEmail,
    };
    const birthData = getBirthData();
    if (birthData) {
      payload.birth_data = birthData;
    }

    try {
      const data = await api.post('/v1/muhurta/report', payload);
      setReportStatus(data.status === 'sent'
        ? `Muhurta list emailed to ${reportEmail}`
        : 'Failed to send report. Check server email config.');
    } catch (err) {
      setReportStatus(`Error: ${err.message}`);
    } finally {
      setReportSending(false);
    }
  }, [selectedEvent, startDate, endDate, place, reportEmail, getBirthData]);

  const eventLabel = eventTypes.find(e => e.value === selectedEvent)?.label || '';

  // --- Razorpay SDK loader ---
  const loadRazorpay = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // --- Unlock (Razorpay) handler ---
  const handleUnlockPayment = useCallback(async () => {
    if (!pricing || paymentProcessing) return;
    setPaymentProcessing(true);
    try {
      // 1. Create muhurta order on backend
      const orderData = await api.post('/v1/payment/razorpay/muhurta-order', {
        event_key: selectedEvent,
      });

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) { setError('Failed to load payment gateway.'); setPaymentProcessing(false); return; }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: orderData.razorpay_order_id,
        name: 'Vedic Astrology',
        description: `Muhurta — ${eventLabel}`,
        prefill: {
          email: user?.email || reportEmail || '',
          name: user?.name || '',
        },
        theme: { color: '#7b5bff' },
        handler: async function (response) {
          // 4. Verify payment
          try {
            await api.post('/v1/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // 5. Re-fetch results (now unlocked)
            setPaymentRequired(false);
            setPricing(null);
            const unlocked = await api.post('/v1/muhurta/find', {
              event_type: selectedEvent,
              start_date: startDate,
              end_date: endDate,
              lat: place.lat,
              lon: place.lon,
              tz_id: place?.timezone || undefined,
              birth_data: getBirthData() || undefined,
            });
            setResult(unlocked);
          } catch (err) {
            setError('Payment verified but failed to refresh results. Please reload.');
          }
          setPaymentProcessing(false);
        },
        modal: {
          ondismiss: () => setPaymentProcessing(false),
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Failed to initiate payment.');
      setPaymentProcessing(false);
    }
  }, [pricing, paymentProcessing, selectedEvent, eventLabel, user, reportEmail,
      loadRazorpay, startDate, endDate, place, getBirthData]);

  // Pagination helpers
  const windows = result?.windows || [];
  const totalPages = Math.ceil(windows.length / PAGE_SIZE);
  const pagedWindows = windows.slice(windowPage * PAGE_SIZE, (windowPage + 1) * PAGE_SIZE);

  return (
    <PageShell activeNav="muhurta">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1><i className="fas fa-clock" style={{ marginRight: 10 }}></i>Muhurta Finder</h1>
            <p className="tool-subtitle">Find auspicious timing for important life events using classical Vedic electional astrology</p>
          </div>

          <div className="two-column">
            {/* LEFT: Form */}
            <div className="form-card">
              <h3>Select Event Type</h3>
              <div className="muhurta-event-grid">
                {eventTypes.map(evt => (
                  <button
                    key={evt.value}
                    className={`muhurta-event-btn ${selectedEvent === evt.value ? 'active' : ''}`}
                    onClick={() => setSelectedEvent(evt.value)}
                    style={selectedEvent === evt.value ? { borderColor: evt.color, background: evt.color + '18' } : {}}
                  >
                    <i className={`fas ${evt.icon}`} style={{ color: evt.color }}></i>
                    <span>{evt.label}</span>
                    {evt.is_free === false && evt.price_display && (
                      <span className="event-price-badge">{evt.price_display}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label>Event Location</label>
                <PlaceAutocomplete
                  id="muhurtaPlace"
                  placeholder="Enter city (e.g. Delhi, Mumbai, Pune)"
                  value={place?.name || ''}
                  onSelect={setPlace}
                />
              </div>

              {/* Date Range Sliders */}
              <div className="muhurta-slider-section">
                <div className="muhurta-slider-group">
                  <label>
                    Start: <strong>{startOffset === 0 ? 'Today' : `${startOffset} day${startOffset > 1 ? 's' : ''} from now`}</strong>
                    <span className="slider-date-preview">{formatDate(startDate)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={startOffset}
                    onChange={e => setStartOffset(Number(e.target.value))}
                    className="muhurta-slider"
                  />
                  <div className="slider-labels">
                    <span>Today</span>
                    <span>+30 days</span>
                  </div>
                </div>

                <div className="muhurta-slider-group">
                  <label>
                    Duration: <strong>{duration} day{duration > 1 ? 's' : ''}</strong>
                    <span className="slider-date-preview">until {formatDate(endDate)}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="muhurta-slider"
                  />
                  <div className="slider-labels">
                    <span>1 day</span>
                    <span>30 days</span>
                  </div>
                </div>
              </div>

              {/* Birth Data Section */}
              <div className="muhurta-birth-section">
                <h3><i className="fas fa-user-circle"></i> Personalize with Birth Data</h3>
                <p className="birth-section-desc">
                  Select a saved chart or enter birth details for personalized Tara Bala, Chandrabala, and Ghatak analysis.
                </p>

                <div className="birth-mode-selector">
                  <button
                    className={`birth-mode-btn ${birthMode === 'none' ? 'active' : ''}`}
                    onClick={() => setBirthMode('none')}
                  >
                    <i className="fas fa-globe"></i> Generic
                  </button>
                  {savedCharts.length > 0 && (
                    <button
                      className={`birth-mode-btn ${birthMode === 'saved' ? 'active' : ''}`}
                      onClick={() => setBirthMode('saved')}
                    >
                      <i className="fas fa-bookmark"></i> Saved Chart
                    </button>
                  )}
                  <button
                    className={`birth-mode-btn ${birthMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setBirthMode('manual')}
                  >
                    <i className="fas fa-edit"></i> Enter Details
                  </button>
                </div>

                {chartsLoading && (
                  <p className="charts-loading"><i className="fas fa-spinner fa-spin"></i> Loading saved charts...</p>
                )}

                {/* Saved Chart Selector */}
                {birthMode === 'saved' && savedCharts.length > 0 && (
                  <div className="saved-chart-selector">
                    <label>Select Person</label>
                    <select
                      value={selectedChartId}
                      onChange={e => setSelectedChartId(e.target.value)}
                      className="form-input"
                    >
                      {savedCharts.map(chart => (
                        <option key={chart.id} value={chart.id}>
                          {chart.birth_data?.name || 'Unnamed'} — {chart.birth_data?.dob || ''} {chart.birth_data?.tob || ''}
                          {chart.birth_data?.place_of_birth ? ` (${chart.birth_data.place_of_birth})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedChartId && (() => {
                      const chart = savedCharts.find(c => c.id === selectedChartId);
                      const bd = chart?.birth_data;
                      if (!bd) return null;
                      return (
                        <div className="selected-chart-info">
                          <i className="fas fa-user"></i>
                          <div>
                            <strong>{bd.name}</strong>
                            <span>{bd.dob} at {bd.tob}</span>
                            <span>{bd.place_of_birth}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Manual Birth Entry */}
                {birthMode === 'manual' && (
                  <div className="manual-birth-form">
                    <div className="form-row" style={{ display: 'flex', gap: 12 }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Person's Name</label>
                        <input type="text" placeholder="e.g. Sonam Sharma"
                          className="form-input"
                          value={manualBirth.name}
                          onChange={e => setManualBirth(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="form-row" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Date of Birth</label>
                        <input type="date" className="form-input"
                          value={manualBirth.dob}
                          onChange={e => setManualBirth(p => ({ ...p, dob: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Time of Birth (24h)</label>
                        <input type="time" className="form-input"
                          value={manualBirth.tob}
                          onChange={e => setManualBirth(p => ({ ...p, tob: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 8 }}>
                      <label>Birth Place</label>
                      <PlaceAutocomplete
                        id="muhurtaBirthPlace"
                        placeholder="Enter birth city"
                        value={manualBirthPlace?.name || ''}
                        onSelect={setManualBirthPlace}
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="api-error">{error}</p>}

              <button className="btn-generate" onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Scanning...</>
                ) : (
                  <><i className="fas fa-search"></i> Find Muhurta</>
                )}
              </button>
            </div>

            {/* RIGHT: Results */}
            <div className="chart-card">
              {!result && !loading && (
                <div className="muhurta-placeholder">
                  <i className="fas fa-om" style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}></i>
                  <p style={{ opacity: 0.5 }}>Select an event and location, then click "Find Muhurta" to discover auspicious time windows.</p>
                </div>
              )}

              {loading && (
                <div className="muhurta-placeholder">
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 36, color: '#7b5bff' }}></i>
                  <p style={{ marginTop: 12 }}>Scanning {formatDate(startDate)} to {formatDate(endDate)} for {eventLabel}...</p>
                </div>
              )}

              {result && (
                <div className="muhurta-results">
                  <div className="muhurta-results-header">
                    <h3>{result.event_label || eventLabel}</h3>
                    <span className="muhurta-meta">
                      {result.total_windows} window{result.total_windows !== 1 ? 's' : ''} found
                      &nbsp;|&nbsp; {result.total_slots_scanned} slots scanned
                      &nbsp;|&nbsp; {result.mode}
                    </span>
                  </div>

                  {/* Birth person attribution */}
                  {result.birth_person && (
                    <div className="muhurta-person-badge">
                      <i className="fas fa-user-check"></i>
                      Personalized for: <strong>{result.birth_person.name}</strong>
                      <span className="person-detail">
                        (Born {result.birth_person.dob} at {result.birth_person.tob},
                        {result.birth_person.place_of_birth})
                      </span>
                    </div>
                  )}

                  {/* LLM Interpretation Card (Phase 36G) */}
                  {result.interpretation && !paymentRequired && (
                    <div className="muhurta-interpretation">
                      <button
                        className="interpretation-toggle"
                        onClick={() => setInterpretExpanded(p => !p)}
                      >
                        <span className="interpretation-header-left">
                          <i className="fas fa-brain"></i> AI Interpretation
                        </span>
                        <i className={`fas fa-chevron-${interpretExpanded ? 'up' : 'down'}`}></i>
                      </button>
                      {interpretExpanded && (
                        <div className="interpretation-body">
                          {result.interpretation.split('\n\n').map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paywall overlay for paid events */}
                  {paymentRequired && pricing && (
                    <div className="muhurta-paywall-banner">
                      <div className="paywall-icon"><i className="fas fa-lock"></i></div>
                      <div className="paywall-text">
                        <h4>Unlock Full Muhurta Details</h4>
                        <p>Detailed time windows, yogas, doshas, Tara Bala, and Chandrabala analysis are available after payment.</p>
                      </div>
                      <div className="paywall-price">
                        {pricing.discount_pct > 0 && (
                          <span className="price-original">{pricing.price_display}</span>
                        )}
                        <span className="price-effective">
                          {pricing.effective_price_paisa
                            ? `₹${(pricing.effective_price_paisa / 100).toFixed(0)}`
                            : pricing.price_display}
                        </span>
                        {pricing.discount_pct > 0 && (
                          <span className="discount-badge">{pricing.discount_pct}% OFF</span>
                        )}
                      </div>
                      <button
                        className="btn-unlock"
                        onClick={handleUnlockPayment}
                        disabled={paymentProcessing}
                      >
                        {paymentProcessing ? (
                          <><i className="fas fa-spinner fa-spin"></i> Processing...</>
                        ) : (
                          <><i className="fas fa-unlock-alt"></i> Unlock Now</>
                        )}
                      </button>
                    </div>
                  )}

                  {windows.length === 0 && (
                    <div className="muhurta-no-results">
                      <i className="fas fa-exclamation-triangle"></i>
                      <p>No auspicious windows found in this date range. Try extending the duration slider or choosing a different event.</p>
                    </div>
                  )}

                  {/* Paginated window cards — 2 per page */}
                  {pagedWindows.map((w, idx) => {
                    const globalIdx = windowPage * PAGE_SIZE + idx;
                    return (
                      <div key={globalIdx} className={`muhurta-window ${globalIdx === 0 ? 'best' : ''}`}>
                        <div className="muhurta-window-header">
                          <div className="muhurta-window-date">
                            <span className="date-label">{formatDate(w.date)}</span>
                            <span className="time-range">
                              {w.start_time?.substring(0, 5)} - {w.end_time?.substring(0, 5)}
                            </span>
                          </div>
                          <div className="muhurta-window-score">
                            <span className="muhurta-score-circle" style={{ background: QUALITY_COLORS[w.quality] || '#666' }}>
                              {w.score}
                            </span>
                            <span className="quality-label" style={{ color: QUALITY_COLORS[w.quality] || '#999' }}>
                              {w.quality}
                            </span>
                            {globalIdx === 0 && <span className="best-tag">Best</span>}
                          </div>
                        </div>

                        <div className="muhurta-window-panchang">
                          {w.panchang_summary && Object.entries(w.panchang_summary).map(([k, v]) => (
                            <span key={k} className="panchang-chip">{k}: {v}</span>
                          ))}
                        </div>

                        {/* Detail section — blurred when payment required */}
                        <div className={paymentRequired ? 'muhurta-blurred' : ''}>
                          {w.special_yogas && w.special_yogas.length > 0 && (
                            <div className="muhurta-special-yogas">
                              {w.special_yogas.map((sy, i) => (
                                <span key={i} className="yoga-badge"><i className="fas fa-star"></i> {sy}</span>
                              ))}
                            </div>
                          )}

                          {w.doshas && w.doshas.length > 0 && (
                            <div className="muhurta-doshas">
                              {w.doshas.map((d, i) => (
                                <span key={i} className="dosha-badge"><i className="fas fa-exclamation-circle"></i> {d}</span>
                              ))}
                            </div>
                          )}

                          {/* Favourable time ranges */}
                          {(() => {
                            const ranges = computeFavourableRanges(w);
                            if (ranges.length === 0) return null;
                            return (
                              <div className="muhurta-favourable">
                                <span className="favourable-label"><i className="fas fa-check-circle"></i> Favourable:</span>
                                {ranges.map((r, i) => (
                                  <span key={i} className="favourable-chip">{r.start} - {r.end}</span>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Inauspicious periods for this day */}
                          {w.inauspicious_periods && Object.keys(w.inauspicious_periods).length > 0 && (
                            <div className="muhurta-inauspicious">
                              <span className="inauspicious-label"><i className="fas fa-ban"></i> Avoid:</span>
                              {Object.entries(w.inauspicious_periods).map(([key, val]) => (
                                <span key={key} className="inauspicious-chip">
                                  {periodLabel(key)}: {val?.start_time?.substring(0, 5)} - {val?.end_time?.substring(0, 5)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Tara / Chandrabala badges */}
                          {w.tara_bala && (
                            <div className="muhurta-personal-badge">
                              <span className={`tara-badge ${w.tara_bala.is_auspicious ? 'favorable' : 'unfavorable'}`}>
                                Tara: {w.tara_bala.tara_name} ({w.tara_bala.is_auspicious ? 'Favorable' : 'Unfavorable'})
                              </span>
                            </div>
                          )}
                          {w.chandrabala && (
                            <div className="muhurta-personal-badge">
                              <span className={`chandra-badge ${w.chandrabala.auspicious ? 'favorable' : 'unfavorable'}`}>
                                Chandrabala: House {w.chandrabala.house} ({w.chandrabala.auspicious ? 'Favorable' : 'Unfavorable'})
                              </span>
                            </div>
                          )}
                        </div>{/* end blur wrapper */}

                      </div>
                    );
                  })}

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="muhurta-pagination">
                      <button
                        className="btn-page"
                        disabled={windowPage === 0}
                        onClick={() => setWindowPage(p => p - 1)}
                      >
                        <i className="fas fa-chevron-left"></i> Prev
                      </button>
                      <span className="page-info">
                        {windowPage + 1} of {totalPages}
                      </span>
                      <button
                        className="btn-page"
                        disabled={windowPage >= totalPages - 1}
                        onClick={() => setWindowPage(p => p + 1)}
                      >
                        Next <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}

                  {/* Email Muhurta List to user */}
                  <div className={`muhurta-report-section ${paymentRequired ? 'report-locked' : ''}`}>
                    <h4><i className="fas fa-envelope"></i> Email Muhurta List</h4>
                    {paymentRequired ? (
                      <div className="report-locked-msg">
                        <i className="fas fa-lock"></i>
                        <span>Complete payment to unlock email delivery of your full Muhurta report.</span>
                      </div>
                    ) : (
                      <>
                        <p className="report-desc">
                          Get the complete list of all muhurta windows emailed to you.
                        </p>
                        <div className="report-form">
                          <input
                            type="email"
                            className="form-input"
                            placeholder="Your email address"
                            value={reportEmail}
                            onChange={e => setReportEmail(e.target.value)}
                          />
                          <button
                            className="btn-email-report"
                            onClick={handleEmailReport}
                            disabled={reportSending || !reportEmail}
                          >
                            {reportSending ? (
                              <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                            ) : (
                              <><i className="fas fa-paper-plane"></i> Email Me</>
                            )}
                          </button>
                        </div>
                        {reportStatus && (
                          <p className={`report-status ${reportStatus.startsWith('Error') ? 'error' : 'success'}`}>
                            {reportStatus}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
