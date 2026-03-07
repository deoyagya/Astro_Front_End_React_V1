import PageShell from '../components/PageShell';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData, to24Hour } from '../hooks/useBirthData';


export default function CompatibilityPage() {
  const navigate = useNavigate();

  // Person A state — pre-filled from saved data
  const {
    fullName: nameA, setFullName: setNameA,
    birthDate: dobA, setBirthDate: setDobA,
    hour: hourA, setHour: setHourA,
    minute: minuteA, setMinute: setMinuteA,
    ampm: ampmA, setAmpm: setAmpmA,
    birthPlace: placeA, setBirthPlace: setPlaceA,
    saveBirthData,
  } = useBirthData({ reportType: 'compatibility' });

  // Gender state
  const [genderA, setGenderA] = useState('');
  const [genderB, setGenderB] = useState('');

  // Person B state
  const [nameB, setNameB] = useState('');
  const [dobB, setDobB] = useState('');
  const [hourB, setHourB] = useState('06');
  const [minuteB, setMinuteB] = useState('00');
  const [ampmB, setAmpmB] = useState('AM');
  const [placeB, setPlaceB] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleCompare = useCallback(async () => {
    setError('');

    // Validate both persons
    if (!nameA.trim()) { setError('Please enter Person A\'s name.'); return; }
    if (!genderA) { setError('Please select Person A\'s gender.'); return; }
    if (!dobA) { setError('Please select Person A\'s date of birth.'); return; }
    if (!placeA) { setError('Please select Person A\'s birth place.'); return; }
    if (!nameB.trim()) { setError('Please enter Person B\'s name.'); return; }
    if (!genderB) { setError('Please select Person B\'s gender.'); return; }
    if (!dobB) { setError('Please select Person B\'s date of birth.'); return; }
    if (!placeB) { setError('Please select Person B\'s birth place.'); return; }

    // Build person payloads
    const personA = {
      name: nameA.trim(),
      gender: genderA,
      dob: dobA,
      tob: to24Hour(hourA, minuteA, ampmA),
      place_of_birth: placeA.name,
    };
    const personB = {
      name: nameB.trim(),
      gender: genderB,
      dob: dobB,
      tob: to24Hour(hourB, minuteB, ampmB),
      place_of_birth: placeB.name,
    };

    // Determine groom vs bride based on gender
    // In Vedic Ashtakoota, the groom and bride roles are gender-determined
    let groom, bride;
    if (genderA === 'male' && genderB === 'female') {
      groom = personA;
      bride = personB;
    } else if (genderA === 'female' && genderB === 'male') {
      groom = personB;
      bride = personA;
    } else {
      // Same gender — use positional (A=groom, B=bride) for calculation purposes
      groom = personA;
      bride = personB;
    }

    setLoading(true);
    try {
      // Call the backend compatibility endpoint (proper BPHS Guna Milan engine)
      const data = await api.post('/v1/compatibility/check', { groom, bride });
      setResult(data);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to compute compatibility.');
    } finally {
      setLoading(false);
    }
  }, [nameA, genderA, dobA, hourA, minuteA, ampmA, placeA, nameB, genderB, dobB, hourB, minuteB, ampmB, placeB, saveBirthData]);

  // Derive display values from backend response
  const totalPoints = result?.total_points ?? 0;
  const maxPoints = result?.max_points ?? 36;
  const percentage = result?.percentage ?? 0;
  const verdict = result?.verdict ?? '';
  const verdictDesc = result?.verdict_description ?? '';
  const kootas = result?.kootas ?? [];
  const doshas = result?.doshas ?? [];
  const manglikGroom = result?.manglik_groom;
  const manglikBride = result?.manglik_bride;

  // Color/label based on percentage
  let matchColor = '#ff4757';
  let matchLabel = 'Challenging Match';
  if (percentage >= 70) { matchColor = '#2ed573'; matchLabel = 'Excellent Compatibility'; }
  else if (percentage >= 50) { matchColor = '#ffa502'; matchLabel = 'Good Compatibility'; }

  // Names for display in groom/bride context
  const groomName = (genderA === 'female' && genderB === 'male') ? nameB : nameA;
  const brideName = (genderA === 'female' && genderB === 'male') ? nameA : nameB;

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Compatibility (Kundli Milan)</h1>
            <p>Check relationship compatibility with Ashtakoot and Guna matching</p>
          </div>

          <div className="two-column">

            {/* --- Left: Forms --- */}
            <div className="form-card">
              <h2>Person A Details</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter name" value={nameA} onChange={(e) => setNameA(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={genderA}
                    onChange={(e) => setGenderA(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(40, 44, 60, 0.8)', color: '#e0e0e0', fontSize: '0.95rem' }}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <DateInput id="dobA" value={dobA} onChange={setDobA} />
                </div>
                <div className="form-group">
                  <label>Time of Birth</label>
                  <TimeSelectGroup
                    hourId="hourA" minuteId="minuteA" ampmId="ampmA"
                    onHourChange={setHourA} onMinuteChange={setMinuteA} onAmpmChange={setAmpmA}
                    hourValue={hourA} minuteValue={minuteA} ampmValue={ampmA}
                  />
                </div>
                <div className="form-group">
                  <label>Place of Birth</label>
                  <PlaceAutocomplete id="placeA" placeholder="Enter birth city" value={placeA?.name || ''} onSelect={setPlaceA} />
                </div>
              </form>

              <h2 style={{ marginTop: '30px' }}>Person B Details</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Enter name" value={nameB} onChange={(e) => setNameB(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={genderB}
                    onChange={(e) => setGenderB(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(40, 44, 60, 0.8)', color: '#e0e0e0', fontSize: '0.95rem' }}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
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

            {/* --- Right: Results --- */}
            <div className="chart-card">
              <h2>Compatibility Score</h2>

              {loading ? (
                <div className="api-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Computing compatibility...</p>
                </div>
              ) : result ? (
                <>
                  {/* Score circle */}
                  <div className="compatibility-score">
                    <div className="score-circle">
                      <span>{totalPoints}/{maxPoints}</span>
                    </div>
                    <p style={{ color: matchColor, marginTop: '10px', fontWeight: 600 }}>
                      {percentage}% Match - {matchLabel}
                    </p>
                    {verdictDesc && (
                      <p style={{ color: '#b0b7c3', fontSize: '0.85rem', marginTop: '5px' }}>{verdictDesc}</p>
                    )}
                  </div>

                  {/* Partner names with roles */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 20, padding: '10px 0' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#64b5f6', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Groom</p>
                      <p style={{ color: '#e0e0e0', fontWeight: 600 }}>{groomName || 'Person A'}</p>
                    </div>
                    <div style={{ color: '#7b5bff', display: 'flex', alignItems: 'center' }}>
                      <i className="fas fa-heart"></i>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#f48fb1', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Bride</p>
                      <p style={{ color: '#e0e0e0', fontWeight: 600 }}>{brideName || 'Person B'}</p>
                    </div>
                  </div>

                  {/* Koota grid (8 Ashtakoota from backend) */}
                  <h3 className="section-subtitle">Guna Milan (Ashtakoota)</h3>
                  <div className="guna-grid" id="gunaGrid">
                    {kootas.map((k) => (
                      <div key={k.koota_name} className="guna-item" title={k.description || ''}>
                        <div className="guna-name">{k.koota_name}</div>
                        <div className="guna-score" style={{
                          color: k.obtained_points === k.max_points ? '#2ed573' : k.obtained_points === 0 ? '#ff4757' : '#9d7bff',
                        }}>
                          {k.obtained_points}/{k.max_points}
                        </div>
                        {k.groom_value && k.bride_value && (
                          <div style={{ fontSize: '0.7rem', color: '#8a8f9e', marginTop: 3 }}>
                            {k.groom_value} / {k.bride_value}
                          </div>
                        )}
                        {k.has_dosha && k.dosha_name && (
                          <div style={{ fontSize: '0.7rem', color: '#ff4757', marginTop: 2 }}>
                            <i className="fas fa-exclamation-circle" style={{ marginRight: 3 }}></i>{k.dosha_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dosha alerts */}
                  {doshas.length > 0 && (
                    <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                      <h4 style={{ color: '#ff4757', marginBottom: '10px' }}>
                        <i className="fas fa-exclamation-triangle"></i> Dosha Detected
                      </h4>
                      {doshas.map((d, i) => (
                        <p key={i} style={{ color: '#e0e0e0', marginBottom: 4 }}>
                          <i className="fas fa-dot-circle" style={{ color: '#ff4757', marginRight: 8, fontSize: '0.7rem' }}></i>
                          {d}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Manglik analysis */}
                  {(manglikGroom || manglikBride) && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 className="section-subtitle">Manglik (Kuja Dosha) Analysis</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {manglikGroom && (
                          <div style={{
                            background: manglikGroom.is_manglik ? 'rgba(255, 71, 87, 0.08)' : 'rgba(46, 213, 115, 0.08)',
                            padding: 12, borderRadius: 8,
                          }}>
                            <p style={{ color: '#b0b7c3', fontSize: '0.75rem', marginBottom: 4 }}>{groomName || 'Groom'}</p>
                            <p style={{
                              color: manglikGroom.is_manglik ? '#ff4757' : '#2ed573',
                              fontWeight: 600, fontSize: '0.9rem',
                            }}>
                              <i className={`fas ${manglikGroom.is_manglik ? 'fa-exclamation-triangle' : 'fa-check-circle'}`} style={{ marginRight: 6 }}></i>
                              {manglikGroom.is_manglik ? 'Manglik' : 'Non-Manglik'}
                            </p>
                          </div>
                        )}
                        {manglikBride && (
                          <div style={{
                            background: manglikBride.is_manglik ? 'rgba(255, 71, 87, 0.08)' : 'rgba(46, 213, 115, 0.08)',
                            padding: 12, borderRadius: 8,
                          }}>
                            <p style={{ color: '#b0b7c3', fontSize: '0.75rem', marginBottom: 4 }}>{brideName || 'Bride'}</p>
                            <p style={{
                              color: manglikBride.is_manglik ? '#ff4757' : '#2ed573',
                              fontWeight: 600, fontSize: '0.9rem',
                            }}>
                              <i className={`fas ${manglikBride.is_manglik ? 'fa-exclamation-triangle' : 'fa-check-circle'}`} style={{ marginRight: 6 }}></i>
                              {manglikBride.is_manglik ? 'Manglik' : 'Non-Manglik'}
                            </p>
                          </div>
                        )}
                      </div>
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
