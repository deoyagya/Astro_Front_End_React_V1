/**
 * MyDataLayout — Parent layout for the "My Data" dashboard.
 *
 * Renders once and wraps all sub-pages via React Router <Outlet>.
 * Provides:
 *   1. Compact birth-data form (auto-loads saved data via useBirthData)
 *   2. Dropdown navigation for 8 sub-pages
 *   3. MyDataProvider context so children share the birth payload
 *   4. Chart modal — auto-opens D1 chart on Load, re-openable via button
 *   5. White content area wrapping child pages
 */

import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import PlaceAutocomplete from '../../components/PlaceAutocomplete';
import DateInput from '../../components/form/DateInput';
import TimeSelectGroup from '../../components/form/TimeSelectGroup';
import VedicChart from '../../components/chart/VedicChart';
import { useBirthData } from '../../hooks/useBirthData';
import { MyDataProvider, useMyData } from '../../context/MyDataContext';
import { useAuth } from '../../context/AuthContext';
import { useStyles } from '../../context/StyleContext';
import { api } from '../../api/client';
import '../../styles/mydata.css';

const TABS = [
  { label: 'My Details',       icon: 'fa-id-card',      to: '/my-data/details' },
  { label: 'Avakhada Chakra',  icon: 'fa-dharmachakra', to: '/my-data/avakhada' },
  { label: 'My Personality',   icon: 'fa-brain',        to: '/my-data/personality' },
  { label: 'Birth Details',    icon: 'fa-baby',         to: '/my-data/birth-details' },
  { label: 'Yogas & Rajyogas', icon: 'fa-sun',          to: '/my-data/yogas' },
  { label: 'Sade Sati',        icon: 'fa-moon',         to: '/my-data/sade-sati' },
  { label: 'Transit',          icon: 'fa-globe',        to: '/my-data/transit' },
  { label: 'Temporal Forecast', icon: 'fa-hourglass-half', to: '/my-data/temporal-forecast', premium: true },
  { label: 'Subscription', icon: 'fa-crown', to: '/my-data/subscription' },
];

/* ---- Inner layout (needs MyDataContext) ---- */
function MyDataInner() {
  const bd = useBirthData({ reportType: 'mydata' });
  const { loadBirthData, setChartBundle, chartBundle, registerExternalLoadHandler } = useMyData();
  const { user } = useAuth();
  const isPremium = user?.role === 'premium' || user?.role === 'admin';
  const [formError, setFormError] = useState('');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartVisible, setChartVisible] = useState(false);
  const autoLoaded = useRef(false);
  const skipNextCancelRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Saved charts list for the Full Name dropdown
  const [savedCharts, setSavedCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState('');

  // Fetch saved charts on mount
  useEffect(() => {
    let cancelled = false;
    api.get('/v1/charts/saved?limit=50')
      .then((res) => {
        if (!cancelled) setSavedCharts(res.charts || res || []);
      })
      .catch(() => { /* silent — dropdown will be empty */ });
    return () => { cancelled = true; };
  }, []);

  // Handle selecting a saved chart from the dropdown
  const handleChartSelect = (chartId) => {
    setSelectedChartId(chartId);
    if (!chartId) return;
    const chart = savedCharts.find((c) => c.id === chartId);
    if (!chart) return;
    const bdData = chart.birth_data || {};
    const payload = {
      name: bdData.name || '',
      dob: bdData.dob || '',
      tob: bdData.tob || '',
      place_of_birth: bdData.place_of_birth || '',
      lat: bdData.lat,
      lon: bdData.lon,
      tz_id: bdData.tz_id || bdData.timezone || '',
      gender: bdData.gender || '',
    };
    bd.applyBirthData(payload);
    loadBirthData(payload);
    fetchChartData(payload, true);
  };

  // Register form-sync handler so SavedCharts Load updates form fields,
  // fetches chart data, opens modal, and navigates to Details.
  useEffect(() => {
    registerExternalLoadHandler((payload) => {
      bd.applyBirthData(payload);
      // Skip the next location-change cancellation so the in-flight fetch
      // triggered here isn't killed by the navigate() below.
      skipNextCancelRef.current = true;
      if (fetchChartDataRef.current) {
        fetchChartDataRef.current(payload, true);
      }
      navigate('/my-data/details');
    });
    return () => registerExternalLoadHandler(null);
  }, [bd.applyBirthData, registerExternalLoadHandler, navigate]);

  // Auto-load birth data on mount when saved data is already available
  useEffect(() => {
    if (!bd.loaded || autoLoaded.current) return;
    if (bd.birthDate && bd.birthPlace) {
      autoLoaded.current = true;
      const payload = bd.buildPayload();
      if (payload.dob && payload.place_of_birth) {
        loadBirthData(payload);
        // Also fetch chart data silently (no modal auto-open on page load)
        fetchChartData(payload, false);
      }
    }
  }, [bd.loaded, bd.birthDate, bd.birthPlace, bd.buildPayload, loadBirthData]);

  /**
   * Fetch chart data with vargas for chart rendering.
   * @param {object} payload - Birth data payload
   * @param {boolean} openModal - Whether to auto-open modal after fetch
   */
  const fetchChartDataRef = useRef(null);
  const fetchRequestId = useRef(0);
  const fetchChartData = async (payload, openModal = true) => {
    const thisRequest = ++fetchRequestId.current;
    setChartLoading(true);
    try {
      const data = await api.post(
        '/v1/chart/create?include_vargas=true&include_dasha=true&include_panchang=true&include_yogas=true',
        payload
      );
      // Only apply result if this is still the latest request (prevents stale modal opens)
      if (thisRequest !== fetchRequestId.current) return;
      setChartBundle(data);
      if (openModal) {
        setChartVisible(true);
      }
    } catch (err) {
      console.error('Chart fetch failed:', err);
    } finally {
      if (thisRequest === fetchRequestId.current) {
        setChartLoading(false);
      }
    }
  };
  fetchChartDataRef.current = fetchChartData;

  const handleLoad = () => {
    setFormError('');
    const err = bd.validate();
    if (err) { setFormError(err); return; }
    const payload = bd.buildPayload();
    loadBirthData(payload);
    bd.saveBirthData();
    // Fetch chart data and auto-open modal
    fetchChartData(payload, true);
  };

  // Close chart modal and cancel in-flight chart fetches when navigating.
  // Skip cancellation when the navigation was triggered by the external load
  // handler (Saved Charts → Load), since that handler starts its own fetch
  // that must not be invalidated.
  useEffect(() => {
    if (skipNextCancelRef.current) {
      skipNextCancelRef.current = false;
      return;
    }
    fetchRequestId.current++;          // invalidate any pending fetchChartData
  }, [location.pathname]);

  // Dropdown navigation handler
  const handleTabChange = (e) => {
    navigate(e.target.value);
  };

  // Filter tabs by premium access
  const visibleTabs = TABS.filter((t) => !t.premium || isPremium);

  // Current tab path for the dropdown value
  const currentTab = visibleTabs.find((t) => location.pathname.startsWith(t.to))?.to || visibleTabs[0].to;

  return (
    <PageShell activeNav="my-data">
      <div className="mydata-page">
        <div className="container">
          {/* Header */}
          <div className="mydata-header">
            <h1><i className="fas fa-database"></i> My Data</h1>
            <p>Your complete astrological profile at a glance</p>
          </div>

          {/* Compact birth form */}
          <div className="mydata-birth-form">
            <div className="form-group">
              <label htmlFor="md-name">Full Name</label>
              <select
                id="md-name"
                value={selectedChartId}
                onChange={(e) => handleChartSelect(e.target.value)}
                style={{ minWidth: 180 }}
              >
                <option value="">-- Select a chart --</option>
                {savedCharts.map((chart) => {
                  const name = chart.birth_data?.name || 'Unnamed';
                  return (
                    <option key={chart.id} value={chart.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="md-dob">Date of Birth</label>
              <DateInput
                id="md-dob"
                value={bd.birthDate}
                onChange={(val) => bd.setBirthDate(val)}
                max="2025-12-31"
                min="1900-01-01"
                disabled={true}
              />
            </div>

            <div className="form-group">
              <label>Time of Birth</label>
              <TimeSelectGroup
                hourId="md-hour" minuteId="md-min" ampmId="md-ampm"
                hourValue={bd.hour} minuteValue={bd.minute} ampmValue={bd.ampm}
                onHourChange={bd.setHour} onMinuteChange={bd.setMinute} onAmpmChange={bd.setAmpm}
                disabled={true}
              />
            </div>

            <div className="form-group">
              <label htmlFor="md-gender">Gender</label>
              <select
                id="md-gender"
                value={bd.gender}
                onChange={(e) => bd.setGender(e.target.value)}
                disabled={true}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="md-place">Place of Birth</label>
              <PlaceAutocomplete
                id="md-place"
                value={bd.birthPlace?.name || ''}
                onSelect={bd.setBirthPlace}
                disabled={true}
              />
            </div>

            <button className="btn-load" onClick={handleLoad} disabled={!bd.loaded || chartLoading}>
              {chartLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Loading...</>
              ) : (
                <><i className="fas fa-bolt"></i> Load</>
              )}
            </button>

            {/* View Chart button — only visible when chart data exists */}
            {chartBundle && (
              <button
                className="btn-chart"
                onClick={() => setChartVisible((v) => !v)}
              >
                <i className={`fas ${chartVisible ? 'fa-chevron-up' : 'fa-chart-pie'}`}></i>
                {chartVisible ? 'Hide Chart' : 'Chart'}
              </button>
            )}
          </div>

          {formError && <p className="mydata-form-error">{formError}</p>}

          {/* Dropdown navigation — above chart, left-aligned with Full Name */}
          <div className="mydata-nav-dropdown">
            <label htmlFor="md-section" className="mydata-nav-label">
              <i className="fas fa-compass"></i> Section
            </label>
            <select
              id="md-section"
              className="mydata-section-select"
              value={currentTab}
              onChange={handleTabChange}
            >
              {visibleTabs.map((tab) => (
                <option key={tab.to} value={tab.to}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Inline Chart — below section dropdown */}
          {chartVisible && chartBundle && (
            <div className="mydata-inline-chart">
              <VedicChart
                chartBundle={chartBundle}
                showControls={true}
                showChartSelector={true}
                showStyleToggle={true}
                showAscendant={true}
              />
            </div>
          )}

          {/* Child page content — white background area */}
          <div className="mydata-content-area">
            <Outlet />
          </div>

        </div>
      </div>
    </PageShell>
  );
}

/* ---- Public export wraps with Provider ---- */
export default function MyDataLayout() {
  return (
    <MyDataProvider>
      <MyDataInner />
    </MyDataProvider>
  );
}
