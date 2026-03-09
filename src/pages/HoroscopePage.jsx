import PageShell from '../components/PageShell';
import { useState, useCallback } from 'react';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData, to24Hour } from '../hooks/useBirthData';

const MOON_SIGNS = [
  { value: 1, label: 'Aries (Mesha)' },
  { value: 2, label: 'Taurus (Vrishabha)' },
  { value: 3, label: 'Gemini (Mithuna)' },
  { value: 4, label: 'Cancer (Karka)' },
  { value: 5, label: 'Leo (Simha)' },
  { value: 6, label: 'Virgo (Kanya)' },
  { value: 7, label: 'Libra (Tula)' },
  { value: 8, label: 'Scorpio (Vrishchika)' },
  { value: 9, label: 'Sagittarius (Dhanu)' },
  { value: 10, label: 'Capricorn (Makara)' },
  { value: 11, label: 'Aquarius (Kumbha)' },
  { value: 12, label: 'Pisces (Meena)' },
];

/** Maps subdomain IDs for horoscope-relevant domains */
const HOROSCOPE_SUBDOMAIN = 100; // Career > General (use as default general prediction)

export default function HoroscopePage() {
  const {
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    birthPlace, setBirthPlace,
    saveBirthData,
  } = useBirthData({ reportType: 'horoscope' });

  const [selectedSign, setSelectedSign] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [transitData, setTransitData] = useState(null);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleGenerate = useCallback(async () => {
    setError('');

    if (!fullName.trim()) { setError('Please enter your name.'); return; }
    if (!birthDate) { setError('Please select your date of birth.'); return; }
    if (!birthPlace) { setError('Please select a birth place from the dropdown.'); return; }

    const tob = to24Hour(hour, minute, ampm);
    const payload = {
      name: fullName.trim(),
      dob: birthDate,
      tob,
      place_of_birth: birthPlace.name,
    };

    setLoading(true);
    try {
      // Fetch chart with transits + prediction in parallel
      const [chartData, evalData] = await Promise.all([
        api.post('/v1/chart/create?include_transit_hits=true&include_dasha=false&include_vargas=false', payload),
        api.post(`/v1/predict/evaluate?subdomain_id=${HOROSCOPE_SUBDOMAIN}&dasha_depth=2&interpretation_mode=static`, payload),
      ]);

      // Extract transit hits
      setTransitData(chartData?.bundle?.transit_hits || null);

      // Extract prediction cards
      setPrediction(evalData?.prediction || null);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to generate horoscope.');
    } finally {
      setLoading(false);
    }
  }, [fullName, birthDate, hour, minute, ampm, birthPlace, saveBirthData]);

  // Extract prediction data
  const cards = prediction?.cards || [];
  const headline = cards[0]?.headline || '';
  const narrative = cards[0]?.narrative || '';
  const score = prediction?.normalized_score || prediction?.score;
  const currentDasha = prediction?.current_dasha || {};

  // Extract transit hits for display
  const transitHits = transitData?.hits || [];
  const topTransits = transitHits.slice(0, 5);

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Daily Horoscope</h1>
            <p>Personalized predictions based on your birth chart and current transits</p>
          </div>

          <div className="two-column">

            {/* ─── Left: Form ─── */}
            <div className="form-card">
              <h2>Your Birth Details</h2>

              <div className="horoscope-selector">
                <label style={{ color: '#c7cfdd', display: 'block', marginBottom: 8 }}>Moon Sign (Optional)</label>
                <select
                  className="sign-select"
                  id="horoscopeSelector"
                  value={selectedSign}
                  onChange={(e) => setSelectedSign(e.target.value)}
                >
                  <option value="">Auto-detect from birth chart</option>
                  {MOON_SIGNS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

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
                    hourId="horoscopeHour" minuteId="horoscopeMinute" ampmId="horoscopeAmpm"
                    onHourChange={setHour} onMinuteChange={setMinute} onAmpmChange={setAmpm}
                    hourValue={hour} minuteValue={minute} ampmValue={ampm}
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
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                  ) : (
                    <><i className="fas fa-star"></i> Get Horoscope</>
                  )}
                </button>
                <p className="preview-note">
                  <i className="fas fa-info-circle"></i> Personalized predictions in paid version
                </p>
              </form>
            </div>

            {/* ─── Right: Predictions ─── */}
            <div className="chart-card">
              <h2>Today's Predictions</h2>
              <div
                className="date-badge"
                style={{ background: 'rgba(123,91,255,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}
              >
                <i className="fas fa-calendar-alt"></i> {todayStr}
              </div>

              {loading ? (
                <div className="api-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Computing your horoscope...</p>
                </div>
              ) : prediction ? (
                <div id="horoscopeContent">
                  {/* Main prediction card */}
                  {headline && (
                    <div className="horoscope-card">
                      <h3><i className="fas fa-sun"></i> Overview</h3>
                      <p style={{ fontWeight: 600, color: '#b794ff', marginBottom: 8 }}>{headline}</p>
                      {narrative && <p>{narrative}</p>}
                      {score != null && (
                        <p style={{ marginTop: 10, color: '#c7cfdd', fontSize: '0.9rem' }}>
                          Overall Score: <strong style={{ color: score >= 60 ? '#2ed573' : score >= 40 ? '#ffa502' : '#ff4757' }}>
                            {Math.round(score)}/100
                          </strong>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Additional cards */}
                  {cards.slice(1).map((card, idx) => (
                    <div key={idx} className="horoscope-card">
                      <h3><i className="fas fa-star-half-alt"></i> {card.headline || `Insight ${idx + 2}`}</h3>
                      <p>{card.narrative || ''}</p>
                    </div>
                  ))}

                  {/* Current Dasha */}
                  {currentDasha.mahadasha && (
                    <div className="horoscope-card">
                      <h3><i className="fas fa-clock"></i> Current Dasha Period</h3>
                      <p>
                        <strong>Mahadasha:</strong> {currentDasha.mahadasha}
                        {currentDasha.antardasha && <> &middot; <strong>Antardasha:</strong> {currentDasha.antardasha}</>}
                      </p>
                    </div>
                  )}

                  {/* Transit hits */}
                  {topTransits.length > 0 && (
                    <div className="horoscope-card">
                      <h3><i className="fas fa-globe"></i> Active Transits</h3>
                      {topTransits.map((t, idx) => (
                        <div key={idx} className="transit-item">
                          <span className="planet">{t.transit_planet || t.planet || '—'}</span>
                          <span className="effect">{t.aspect_type || t.description || t.type || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div id="horoscopeContent" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-star" style={{ fontSize: '2rem', color: '#7b5bff', marginBottom: 10, display: 'block' }}></i>
                  Enter your birth details to get personalized predictions
                </div>
              )}

              <p className="preview-note" style={{ marginTop: '20px' }}>
                <i className="fas fa-lock"></i> Full daily predictions with remedial measures in paid version
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
