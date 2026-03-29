import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData } from '../hooks/useBirthData';

const SECTION_ICONS = {
  daily_forecast_snapshot: 'fa-sun',
  daily_planetary_trigger_and_mood: 'fa-bolt',
  career_and_work: 'fa-briefcase',
  money_and_spending: 'fa-sack-dollar',
  love_and_marriage: 'fa-heart',
  family_and_home: 'fa-house',
  health_and_wellbeing: 'fa-spa',
  learning_travel_and_opportunity: 'fa-compass',
  attention_windows: 'fa-clock',
  do_and_avoid_focus: 'fa-list-check',
  daily_micro_remedy: 'fa-om',
};

function formatDateLabel(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatGeneratedAt(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function hasRenderableRepeatGroups(section) {
  return Array.isArray(section?.repeat_group_instances) && section.repeat_group_instances.length > 0;
}

function renderRepeatGroups(section) {
  if (!hasRenderableRepeatGroups(section)) return null;
  return (
    <div className="transit-list" style={{ marginTop: 12 }}>
      {section.repeat_group_instances.map((instance, idx) => (
        <div key={`${section.section_id}-${idx}`} className="transit-item">
          <span className="planet">
            {instance.label || instance.time_range || instance.date || `Point ${idx + 1}`}
          </span>
          <span className="effect">
            {instance.summary || instance.overview?.summary || instance.action_focus?.summary || ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HoroscopePage() {
  const navigate = useNavigate();
  const {
    fullName,
    setFullName,
    birthDate,
    setBirthDate,
    hour,
    setHour,
    minute,
    setMinute,
    ampm,
    setAmpm,
    birthPlace,
    setBirthPlace,
    loaded,
    saveBirthData,
    validate,
    buildPayload,
  } = useBirthData({ reportType: 'daily_prediction_report' });

  const autoRequestedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [accessState, setAccessState] = useState('idle');
  const [accessMessage, setAccessMessage] = useState('');
  const [forecast, setForecast] = useState(null);
  const [libraryItem, setLibraryItem] = useState(null);

  const todayStr = formatDateLabel(new Date().toISOString());

  const narrativeSections = useMemo(() => {
    const sections = forecast?.sections || [];
    return sections.filter((section) => !section.structural);
  }, [forecast]);

  const handleLoadForecast = useCallback(async () => {
    setError('');
    setAccessMessage('');

    const err = validate();
    if (err) {
      setError(err);
      setAccessState('idle');
      return;
    }

    const payload = buildPayload();
    setLoading(true);
    try {
      const data = await api.post('/v1/reports/forecasts/daily/current', payload);
      setAccessState(data.access_state || 'idle');
      setAccessMessage(data.message || '');
      setLibraryItem(data.library_item || null);
      setForecast(data.forecast || null);
      if (data.access_state === 'ready') {
        saveBirthData();
      }
    } catch (err) {
      setError(err.message || 'Failed to load today’s forecast.');
      setAccessState('failed');
      setForecast(null);
      setLibraryItem(null);
    } finally {
      setLoading(false);
    }
  }, [buildPayload, saveBirthData, validate]);

  useEffect(() => {
    if (!loaded || autoRequestedRef.current) return;
    if (validate()) return;
    autoRequestedRef.current = true;
    handleLoadForecast();
  }, [handleLoadForecast, loaded, validate]);

  const handleDownload = useCallback(async () => {
    if (!libraryItem?.download_report_id) return;
    setDownloading(true);
    try {
      const filename = `${(libraryItem.display_name || 'daily_prediction_report').replace(/\s+/g, '_')}.pdf`;
      await api.download(`/v1/reports/${libraryItem.download_report_id}/download`, filename);
    } catch (err) {
      setError(err.message || 'Failed to download today’s report.');
    } finally {
      setDownloading(false);
    }
  }, [libraryItem]);

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Daily Horoscope</h1>
            <p>Your daily forecast now comes from the recurring prediction framework and is saved in My Reports.</p>
          </div>

          <div className="two-column">
            <div className="form-card">
              <h2>Your Birth Details</h2>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <DateInput id="horoscopeDob" value={birthDate} onChange={setBirthDate} />
                </div>

                <div className="form-group">
                  <label>Time of Birth</label>
                  <TimeSelectGroup
                    hourId="horoscopeHour"
                    minuteId="horoscopeMinute"
                    ampmId="horoscopeAmpm"
                    onHourChange={setHour}
                    onMinuteChange={setMinute}
                    onAmpmChange={setAmpm}
                    hourValue={hour}
                    minuteValue={minute}
                    ampmValue={ampm}
                  />
                </div>

                <div className="form-group">
                  <label>Place of Birth</label>
                  <PlaceAutocomplete
                    id="horoscopePlace"
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
                  onClick={handleLoadForecast}
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Loading Forecast...</>
                  ) : (
                    <><i className="fas fa-sun"></i> Load Today&apos;s Forecast</>
                  )}
                </button>
                <p className="preview-note">
                  <i className="fas fa-info-circle"></i> Daily forecasts are delivered through your subscription and stored in My Reports.
                </p>
              </form>
            </div>

            <div className="chart-card">
              <h2>Today&apos;s Predictions</h2>
              <div
                className="date-badge"
                style={{ background: 'rgba(123,91,255,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}
              >
                <i className="fas fa-calendar-alt"></i> {forecast?.period_label ? formatDateLabel(forecast.period_label) : todayStr}
              </div>

              {loading ? (
                <div className="api-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Preparing today&apos;s forecast...</p>
                </div>
              ) : accessState === 'requires_subscription' ? (
                <div id="horoscopeContent" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-lock" style={{ fontSize: '2rem', color: '#7b5bff', marginBottom: 12, display: 'block' }}></i>
                  <p style={{ marginBottom: 16 }}>{accessMessage || 'Daily forecasts are available with a subscription that includes Daily Prediction Report access.'}</p>
                  <button type="button" className="btn-generate" onClick={() => navigate('/pricing')}>
                    <i className="fas fa-crown"></i> View Plans &amp; Pricing
                  </button>
                </div>
              ) : accessState === 'ready' && forecast ? (
                <div id="horoscopeContent">
                  {libraryItem && (
                    <div className="horoscope-card">
                      <h3><i className="fas fa-file-lines"></i> Daily Report Ready</h3>
                      <p>{libraryItem.display_name || forecast.display_title}</p>
                      {forecast.generated_at && (
                        <p style={{ color: '#c7cfdd', fontSize: '0.9rem', marginTop: 8 }}>
                          Generated: {formatGeneratedAt(forecast.generated_at)}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                        <button
                          type="button"
                          className="btn-generate"
                          style={{ width: 'auto', paddingInline: 18 }}
                          onClick={handleDownload}
                          disabled={!libraryItem?.download_report_id || downloading}
                        >
                          {downloading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Downloading...</>
                          ) : (
                            <><i className="fas fa-download"></i> Download PDF</>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn-generate"
                          style={{ width: 'auto', paddingInline: 18, background: 'transparent', border: '1px solid rgba(157,123,255,0.4)' }}
                          onClick={() => navigate('/my-reports?tab=daily')}
                        >
                          <i className="fas fa-folder-open"></i> Open Library
                        </button>
                      </div>
                    </div>
                  )}

                  {narrativeSections.map((section) => (
                    <div key={section.section_id} className="horoscope-card">
                      <h3>
                        <i className={`fas ${SECTION_ICONS[section.section_id] || 'fa-star-half-alt'}`}></i> {section.heading}
                      </h3>
                      {section.body ? <p>{section.body}</p> : <p style={{ color: '#c7cfdd' }}>This section is still being assembled.</p>}
                      {renderRepeatGroups(section)}
                    </div>
                  ))}
                </div>
              ) : accessState === 'processing' ? (
                <div id="horoscopeContent" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#7b5bff', marginBottom: 10, display: 'block' }}></i>
                  {accessMessage || 'Today’s forecast is still being generated. Please check again shortly.'}
                </div>
              ) : accessState === 'failed' ? (
                <div id="horoscopeContent" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-triangle-exclamation" style={{ fontSize: '2rem', color: '#ffb347', marginBottom: 10, display: 'block' }}></i>
                  {accessMessage || 'Today’s forecast could not be loaded right now. Please try again shortly.'}
                </div>
              ) : (
                <div id="horoscopeContent" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-sun" style={{ fontSize: '2rem', color: '#7b5bff', marginBottom: 10, display: 'block' }}></i>
                  Load your saved birth details to fetch today&apos;s recurring forecast.
                </div>
              )}

              <p className="preview-note" style={{ marginTop: '20px' }}>
                <i className="fas fa-folder-tree"></i> The same daily forecast is also saved in My Reports for later access.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
