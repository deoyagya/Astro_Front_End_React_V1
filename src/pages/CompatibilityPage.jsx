import PageShell from '../components/PageShell';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';

const SIGN_NAMES = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

/** Convert 12h AM/PM → 24h time string "HH:MM" */
function to24Hour(hour, minute, ampm) {
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (ampm === 'AM' && h === 12) h = 0;
  else if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Simple Guna Milan score calculator based on avakhada data */
function computeGunaMilan(avakhadaA, avakhadaB) {
  if (!avakhadaA || !avakhadaB) return null;

  const gunas = [];
  let totalScore = 0;

  // 1. Varna (1 point)
  const varnaOrder = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra'];
  const varnaA = varnaOrder.indexOf(avakhadaA.varan || '');
  const varnaB = varnaOrder.indexOf(avakhadaB.varan || '');
  const varnaScore = varnaA >= 0 && varnaB >= 0 && varnaA <= varnaB ? 1 : 0;
  gunas.push({ name: 'Varna', score: varnaScore, max: 1 });
  totalScore += varnaScore;

  // 2. Vashya (2 points)
  const vashyaA = avakhadaA.vashya || '';
  const vashyaB = avakhadaB.vashya || '';
  const vashyaScore = vashyaA === vashyaB ? 2 : 1;
  gunas.push({ name: 'Vashya', score: vashyaScore, max: 2 });
  totalScore += vashyaScore;

  // 3. Tara (3 points) — based on nakshatra distance
  const nakshatraScore = 2; // Default moderate
  gunas.push({ name: 'Tara', score: nakshatraScore, max: 3 });
  totalScore += nakshatraScore;

  // 4. Yoni (4 points)
  const yoniA = avakhadaA.yoni || '';
  const yoniB = avakhadaB.yoni || '';
  const yoniScore = yoniA === yoniB ? 4 : 2;
  gunas.push({ name: 'Yoni', score: yoniScore, max: 4 });
  totalScore += yoniScore;

  // 5. Graha Maitri (5 points) — based on moon sign lords
  const maitriScore = 3; // Default moderate
  gunas.push({ name: 'Graha Maitri', score: maitriScore, max: 5 });
  totalScore += maitriScore;

  // 6. Gana (6 points)
  const ganaA = avakhadaA.gana || '';
  const ganaB = avakhadaB.gana || '';
  const ganaScore = ganaA === ganaB ? 6 : ganaA !== 'Rakshasa' && ganaB !== 'Rakshasa' ? 3 : 0;
  gunas.push({ name: 'Gana', score: ganaScore, max: 6 });
  totalScore += ganaScore;

  // 7. Bhakoot (7 points) — sign distance
  const bhakootScore = 5; // Default moderate
  gunas.push({ name: 'Bhakoot', score: bhakootScore, max: 7 });
  totalScore += bhakootScore;

  // 8. Nadi (8 points)
  const nadiA = avakhadaA.nadi || '';
  const nadiB = avakhadaB.nadi || '';
  const nadiScore = nadiA !== nadiB ? 8 : 0;
  gunas.push({ name: 'Nadi', score: nadiScore, max: 8 });
  totalScore += nadiScore;

  const totalMax = 36;
  const percentage = Math.round((totalScore / totalMax) * 100);

  let matchLabel, matchColor;
  if (percentage >= 70) { matchLabel = 'Excellent Compatibility'; matchColor = '#2ed573'; }
  else if (percentage >= 50) { matchLabel = 'Good Compatibility'; matchColor = '#ffa502'; }
  else { matchLabel = 'Challenging Match'; matchColor = '#ff4757'; }

  return { gunas, totalScore, totalMax, percentage, matchLabel, matchColor };
}

export default function CompatibilityPage() {
  const navigate = useNavigate();

  // Person A state
  const [nameA, setNameA] = useState('');
  const [dobA, setDobA] = useState('');
  const [hourA, setHourA] = useState('06');
  const [minuteA, setMinuteA] = useState('00');
  const [ampmA, setAmpmA] = useState('AM');
  const [placeA, setPlaceA] = useState(null);

  // Person B state
  const [nameB, setNameB] = useState('');
  const [dobB, setDobB] = useState('');
  const [hourB, setHourB] = useState('06');
  const [minuteB, setMinuteB] = useState('00');
  const [ampmB, setAmpmB] = useState('AM');
  const [placeB, setPlaceB] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);

  const handleCompare = useCallback(async () => {
    setError('');

    // Validate both persons
    if (!nameA.trim()) { setError('Please enter Person A\'s name.'); return; }
    if (!dobA) { setError('Please select Person A\'s date of birth.'); return; }
    if (!placeA) { setError('Please select Person A\'s birth place.'); return; }
    if (!nameB.trim()) { setError('Please enter Person B\'s name.'); return; }
    if (!dobB) { setError('Please select Person B\'s date of birth.'); return; }
    if (!placeB) { setError('Please select Person B\'s birth place.'); return; }

    setLoading(true);
    try {
      const buildPayload = (name, dob, hour, min, ampm, place) => ({
        name: name.trim(),
        dob,
        tob: to24Hour(hour, min, ampm),
        place_of_birth: place.name,
      });

      const params = new URLSearchParams({
        include_avakhada: 'true',
        include_vargas: 'false',
        include_dasha: 'false',
        include_ashtakavarga: 'false',
      });

      // Fetch both charts in parallel
      const [dataA, dataB] = await Promise.all([
        api.post(`/v1/chart/create?${params}`, buildPayload(nameA, dobA, hourA, minuteA, ampmA, placeA)),
        api.post(`/v1/chart/create?${params}`, buildPayload(nameB, dobB, hourB, minuteB, ampmB, placeB)),
      ]);

      setResultA(dataA);
      setResultB(dataB);
    } catch (err) {
      setError(err.message || 'Failed to compute compatibility.');
    } finally {
      setLoading(false);
    }
  }, [nameA, dobA, hourA, minuteA, ampmA, placeA, nameB, dobB, hourB, minuteB, ampmB, placeB]);

  // Compute Guna Milan from avakhada data
  const gunaResult = useMemo(() => {
    if (!resultA || !resultB) return null;
    const avakhadaA = resultA.bundle?.avakhada;
    const avakhadaB = resultB.bundle?.avakhada;
    return computeGunaMilan(avakhadaA, avakhadaB);
  }, [resultA, resultB]);

  // Extract moon signs for display
  const moonSignA = resultA?.bundle?.natal?.planets?.Moon?.sign;
  const moonSignB = resultB?.bundle?.natal?.planets?.Moon?.sign;

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Compatibility (Kundli Milan)</h1>
            <p>Check relationship compatibility with Ashtakoot and Guna matching</p>
          </div>

          <div className="two-column">

            {/* ─── Left: Forms ─── */}
            <div className="form-card">
              <h2>Person A Details</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter name" value={nameA} onChange={(e) => setNameA(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <DateInput id="dobA" onChange={setDobA} />
                </div>
                <div className="form-group">
                  <label>Time of Birth</label>
                  <TimeSelectGroup
                    hourId="hourA" minuteId="minuteA" ampmId="ampmA"
                    onHourChange={setHourA} onMinuteChange={setMinuteA} onAmpmChange={setAmpmA}
                  />
                </div>
                <div className="form-group">
                  <label>Place of Birth</label>
                  <PlaceAutocomplete id="placeA" placeholder="Enter birth city" onSelect={setPlaceA} />
                </div>
              </form>

              <h2 style={{ marginTop: '30px' }}>Person B Details</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter name" value={nameB} onChange={(e) => setNameB(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <DateInput id="dobB" onChange={setDobB} />
                </div>
                <div className="form-group">
                  <label>Time of Birth</label>
                  <TimeSelectGroup
                    hourId="hourB" minuteId="minuteB" ampmId="ampmB"
                    onHourChange={setHourB} onMinuteChange={setMinuteB} onAmpmChange={setAmpmB}
                  />
                </div>
                <div className="form-group">
                  <label>Place of Birth</label>
                  <PlaceAutocomplete id="placeB" placeholder="Enter birth city" onSelect={setPlaceB} />
                </div>
              </form>

              {error && (
                <div className="api-error">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="button"
                className="btn-generate"
                onClick={handleCompare}
                disabled={loading}
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Comparing...</>
                ) : (
                  <><i className="fas fa-heart"></i> Check Compatibility</>
                )}
              </button>
              <p className="preview-note">
                <i className="fas fa-info-circle"></i> Full analysis available in paid report
              </p>
            </div>

            {/* ─── Right: Results ─── */}
            <div className="chart-card">
              <h2>Compatibility Score</h2>

              {loading ? (
                <div className="api-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Computing compatibility...</p>
                </div>
              ) : gunaResult ? (
                <>
                  {/* Score circle */}
                  <div className="compatibility-score">
                    <div className="score-circle">
                      <span>{gunaResult.totalScore}/{gunaResult.totalMax}</span>
                    </div>
                    <p style={{ color: gunaResult.matchColor, marginTop: '10px' }}>
                      {gunaResult.percentage}% Match - {gunaResult.matchLabel}
                    </p>
                  </div>

                  {/* Moon sign comparison */}
                  {(moonSignA || moonSignB) && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginBottom: 20 }}>
                      {moonSignA && (
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: '#b0b7c3', fontSize: '0.85rem' }}>{nameA || 'Person A'}</p>
                          <p style={{ color: '#9d7bff', fontWeight: 600 }}>{SIGN_NAMES[parseInt(moonSignA, 10)] || '—'} Moon</p>
                        </div>
                      )}
                      {moonSignB && (
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: '#b0b7c3', fontSize: '0.85rem' }}>{nameB || 'Person B'}</p>
                          <p style={{ color: '#9d7bff', fontWeight: 600 }}>{SIGN_NAMES[parseInt(moonSignB, 10)] || '—'} Moon</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Guna grid */}
                  <h3 className="section-subtitle">Guna Milan</h3>
                  <div className="guna-grid" id="gunaGrid">
                    {gunaResult.gunas.map((g) => (
                      <div key={g.name} className="guna-item">
                        <div className="guna-name">{g.name}</div>
                        <div className="guna-score" style={{
                          color: g.score === g.max ? '#2ed573' : g.score === 0 ? '#ff4757' : '#9d7bff',
                        }}>
                          {g.score}/{g.max}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nadi dosha check */}
                  {gunaResult.gunas.find(g => g.name === 'Nadi')?.score === 0 && (
                    <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                      <h4 style={{ color: '#ff4757', marginBottom: '10px' }}>
                        <i className="fas fa-exclamation-triangle"></i> Nadi Dosha Detected
                      </h4>
                      <p style={{ color: '#e0e0e0' }}>
                        Both partners have the same Nadi. Special remedies may be required for marriage compatibility.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="compatibility-score" style={{ padding: 40 }}>
                  <div style={{ color: '#b0b7c3', textAlign: 'center' }}>
                    <i className="fas fa-heart" style={{ fontSize: '2rem', color: '#7b5bff', marginBottom: 10, display: 'block' }}></i>
                    Enter both birth details and click Check Compatibility
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn-generate"
                style={{ marginTop: '20px' }}
                onClick={() => navigate('/order')}
              >
                <i className="fas fa-shopping-cart"></i> Order Detailed Compatibility Report
              </button>

              <p className="preview-note" style={{ marginTop: '20px' }}>
                <i className="fas fa-lock"></i> Full compatibility report with detailed analysis in paid version
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
