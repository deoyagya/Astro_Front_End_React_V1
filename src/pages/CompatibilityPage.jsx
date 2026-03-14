import PageShell from '../components/PageShell';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData, to24Hour, sanitizeGeo } from '../hooks/useBirthData';
import '../styles/rule-cv-wizard.css';
import { useStyles } from '../context/StyleContext';

const STEPS = [
  { label: 'Person A', icon: 'fa-user' },
  { label: 'Person B', icon: 'fa-user-friends' },
  { label: 'Results',  icon: 'fa-heart' },
];

export default function CompatibilityPage() {
  const { getOverride } = useStyles('compatibility');
  const navigate = useNavigate();

  // Wizard step (1-indexed)
  const [step, setStep] = useState(1);

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

  // ─── Step-level validation ───────────────────────────────────
  const validateStepA = useCallback(() => {
    if (!nameA.trim()) return 'Please enter Person A\'s name.';
    if (!genderA) return 'Please select Person A\'s gender.';
    if (!dobA) return 'Please select Person A\'s date of birth.';
    if (!hourA || !minuteA || !ampmA) return 'Please select Person A\'s time of birth (hour, minute, and AM/PM).';
    if (!placeA) return 'Please select Person A\'s birth place.';
    return null;
  }, [nameA, genderA, dobA, hourA, minuteA, ampmA, placeA]);

  const validateStepB = useCallback(() => {
    if (!nameB.trim()) return 'Please enter Person B\'s name.';
    if (!genderB) return 'Please select Person B\'s gender.';
    if (!dobB) return 'Please select Person B\'s date of birth.';
    if (!hourB || !minuteB || !ampmB) return 'Please select Person B\'s time of birth (hour, minute, and AM/PM).';
    if (!placeB) return 'Please select Person B\'s birth place.';
    return null;
  }, [nameB, genderB, dobB, hourB, minuteB, ampmB, placeB]);

  // ─── Navigation handlers ─────────────────────────────────────
  const handleNext = useCallback(() => {
    setError('');
    if (step === 1) {
      const err = validateStepA();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStepB();
      if (err) { setError(err); return; }
      setStep(3);
    }
  }, [step, validateStepA, validateStepB]);

  const handleBack = useCallback(() => {
    setError('');
    if (step === 2) setStep(1);
    else if (step === 3) { setResult(null); setStep(2); }
  }, [step]);

  const handleStepClick = useCallback((targetStep) => {
    // Only allow clicking on completed steps (going back)
    if (targetStep < step) {
      setError('');
      if (targetStep === 1) { setStep(1); }
      else if (targetStep === 2) { setResult(null); setStep(2); }
    }
  }, [step]);

  // ─── API call — triggered when entering Step 3 ──────────────
  const fetchCompatibility = useCallback(async () => {
    const personA = {
      name: nameA.trim(),
      gender: genderA,
      dob: dobA,
      tob: to24Hour(hourA, minuteA, ampmA),
      place_of_birth: placeA.name,
      ...sanitizeGeo(placeA),
    };
    const personB = {
      name: nameB.trim(),
      gender: genderB,
      dob: dobB,
      tob: to24Hour(hourB, minuteB, ampmB),
      place_of_birth: placeB.name,
      ...sanitizeGeo(placeB),
    };

    // Determine groom vs bride based on gender
    let groom, bride;
    if (genderA === 'male' && genderB === 'female') {
      groom = personA; bride = personB;
    } else if (genderA === 'female' && genderB === 'male') {
      groom = personB; bride = personA;
    } else {
      groom = personA; bride = personB;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.post('/v1/compatibility/check', { groom, bride });
      setResult(data);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to compute compatibility.');
    } finally {
      setLoading(false);
    }
  }, [nameA, genderA, dobA, hourA, minuteA, ampmA, placeA, nameB, genderB, dobB, hourB, minuteB, ampmB, placeB, saveBirthData]);

  // Auto-fetch when step transitions to 3
  useEffect(() => {
    if (step === 3 && !result && !loading && !error) {
      fetchCompatibility();
    }
  }, [step, result, loading, error, fetchCompatibility]);

  // ─── Derived display values ──────────────────────────────────
  const totalPoints = result?.total_points ?? 0;
  const maxPoints = result?.max_points ?? 36;
  const percentage = result?.percentage ?? 0;
  const verdictDesc = result?.verdict_description ?? '';
  const kootas = result?.kootas ?? [];
  const doshas = result?.doshas ?? [];
  const manglikGroom = result?.manglik_groom;
  const manglikBride = result?.manglik_bride;

  let matchColor = '#ff4757';
  let matchLabel = 'Challenging Match';
  if (percentage >= 70) { matchColor = '#2ed573'; matchLabel = 'Excellent Compatibility'; }
  else if (percentage >= 50) { matchColor = '#ffa502'; matchLabel = 'Good Compatibility'; }

  const groomName = (genderA === 'female' && genderB === 'male') ? nameB : nameA;
  const brideName = (genderA === 'female' && genderB === 'male') ? nameA : nameB;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Compatibility (Kundli Milan)</h1>
            <p>Check relationship compatibility with Ashtakoot and Guna matching</p>
          </div>

          {/* ─── Stepper + Step Content (same max-width for alignment) ─── */}
          <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* ─── Stepper ─── */}
          <div className="cv-wizard-stepper">
            {STEPS.map((s, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    className={`cv-wizard-step${isActive ? ' active' : ''}${isCompleted ? ' completed clickable' : ''}`}
                    onClick={() => isCompleted && handleStepClick(stepNum)}
                  >
                    <div className="cv-wizard-step-circle">
                      {isCompleted ? <i className="fas fa-check" style={{ fontSize: '0.875rem' }}></i> : stepNum}
                    </div>
                    <div className="cv-wizard-step-label">{s.label}</div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`cv-wizard-step-connector${isCompleted ? ' completed' : ''}`}></div>
                  )}
                </div>
              );
            })}
          </div>

            {/* ═══ STEP 1: Person A ═══ */}
            {step === 1 && (
              <div className="form-card" style={{ animation: 'fadeIn 0.3s ease' }}>
                <h2><i className="fas fa-user" style={{ marginRight: 10, color: '#7b5bff' }}></i>Person A Details</h2>
                <p style={{ color: '#a0a8b8', marginBottom: 20, fontSize: '1rem' }}>
                  Enter the first person's birth details
                </p>
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

                {error && (
                  <div className="api-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>{error}</p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="button" className="btn-generate" onClick={handleNext}>
                    Next: Person B <i className="fas fa-arrow-right" style={{ marginLeft: 8 }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Person B ═══ */}
            {step === 2 && (
              <div className="form-card" style={{ animation: 'fadeIn 0.3s ease' }}>
                <h2><i className="fas fa-user-friends" style={{ marginRight: 10, color: '#7b5bff' }}></i>Person B Details</h2>
                <p style={{ color: '#a0a8b8', marginBottom: 20, fontSize: '1rem' }}>
                  Enter the second person's birth details
                </p>

                {/* Mini summary of Person A */}
                <div style={{
                  background: 'rgba(123, 91, 255, 0.08)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <i className="fas fa-check-circle" style={{ color: '#2ed573' }}></i>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{nameA}</span>
                    <span style={{ color: '#a0a8b8', marginLeft: 8, fontSize: '0.875rem' }}>
                      ({genderA === 'male' ? 'Male' : 'Female'}) &middot; {dobA} &middot; {placeA?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{ background: 'none', border: 'none', color: '#b794ff', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Edit
                  </button>
                </div>

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
                    <DateInput id="dobB" value={dobB} onChange={setDobB} />
                  </div>
                  <div className="form-group">
                    <label>Time of Birth</label>
                    <TimeSelectGroup
                      hourId="hourB" minuteId="minuteB" ampmId="ampmB"
                      onHourChange={setHourB} onMinuteChange={setMinuteB} onAmpmChange={setAmpmB}
                      hourValue={hourB} minuteValue={minuteB} ampmValue={ampmB}
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

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="btn-generate"
                    style={{
                      background: 'rgba(40, 44, 60, 0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#b0b7c3',
                      flex: '0 0 auto',
                      width: 'auto',
                      padding: '0 24px',
                    }}
                  >
                    <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Back
                  </button>
                  <button type="button" className="btn-generate" style={{ flex: 1 }} onClick={handleNext}>
                    <i className="fas fa-heart" style={{ marginRight: 8 }}></i> Check Compatibility
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: Results ═══ */}
            {step === 3 && (
              <div className="chart-card" style={{ animation: 'fadeIn 0.3s ease' }}>

                {loading ? (
                  <div className="api-loading" style={{ padding: 60, textAlign: 'center' }}>
                    <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#7b5bff', marginBottom: 16 }}></i>
                    <p style={{ color: '#b0b7c3' }}>Computing compatibility for {nameA} &amp; {nameB}...</p>
                  </div>
                ) : error ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div className="api-error">
                      <i className="fas fa-exclamation-circle"></i>
                      <p>{error}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-generate"
                      onClick={handleBack}
                      style={{
                        background: 'rgba(40, 44, 60, 0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#b0b7c3',
                        marginTop: 16,
                        width: 'auto',
                        padding: '0 32px',
                      }}
                    >
                      <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i> Go Back &amp; Retry
                    </button>
                  </div>
                ) : result ? (
                  <>
                    <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Compatibility Score</h2>

                    {/* Score circle */}
                    <div className="compatibility-score">
                      <div className="score-circle">
                        <span>{totalPoints}/{maxPoints}</span>
                      </div>
                      <p style={{ color: matchColor, marginTop: '10px', fontWeight: 600 }}>
                        {percentage}% Match - {matchLabel}
                      </p>
                      {verdictDesc && (
                        <p style={{ color: '#c7cfdd', fontSize: '1rem', marginTop: '5px' }}>{verdictDesc}</p>
                      )}
                    </div>

                    {/* Partner names with roles */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 20, padding: '10px 0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#7ec8f8', fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Groom</p>
                        <p style={{ color: '#e0e0e0', fontWeight: 600 }}>{groomName || 'Person A'}</p>
                      </div>
                      <div style={{ color: '#7b5bff', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-heart"></i>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#f8a4c8', fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Bride</p>
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
                            color: k.obtained_points === k.max_points ? '#2ed573' : k.obtained_points === 0 ? '#ff4757' : '#c4b0ff',
                            fontSize: '1.25rem',
                          }}>
                            {k.obtained_points}/{k.max_points}
                          </div>
                          {k.groom_value && k.bride_value && (
                            <div style={{ fontSize: '0.875rem', color: '#a0a8b8', marginTop: 4 }}>
                              {k.groom_value} / {k.bride_value}
                            </div>
                          )}
                          {k.has_dosha && k.dosha_name && (
                            <div style={{ fontSize: '0.875rem', color: '#ff6b6b', marginTop: 4, fontWeight: 500 }}>
                              <i className="fas fa-exclamation-circle" style={{ marginRight: 4 }}></i>{k.dosha_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Dosha alerts */}
                    {doshas.length > 0 && (
                      <div style={{ background: 'rgba(255, 71, 87, 0.1)', padding: '18px', borderRadius: '10px', marginTop: '20px' }}>
                        <h4 style={{ color: '#ff6b6b', marginBottom: '12px', fontSize: '1.125rem' }}>
                          <i className="fas fa-exclamation-triangle" style={{ marginRight: 8 }}></i> Dosha Detected
                        </h4>
                        {doshas.map((d, i) => (
                          <p key={i} style={{ color: '#e8eaf0', marginBottom: 6, fontSize: '1rem' }}>
                            <i className="fas fa-dot-circle" style={{ color: '#ff6b6b', marginRight: 8, fontSize: '0.875rem' }}></i>
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
                              <p style={{ color: '#c7cfdd', fontSize: '0.9375rem', marginBottom: 6, fontWeight: 500 }}>{groomName || 'Groom'}</p>
                              <p style={{
                                color: manglikGroom.is_manglik ? '#ff4757' : '#2ed573',
                                fontWeight: 600, fontSize: '1rem',
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
                              <p style={{ color: '#c7cfdd', fontSize: '0.9375rem', marginBottom: 6, fontWeight: 500 }}>{brideName || 'Bride'}</p>
                              <p style={{
                                color: manglikBride.is_manglik ? '#ff4757' : '#2ed573',
                                fontWeight: 600, fontSize: '1rem',
                              }}>
                                <i className={`fas ${manglikBride.is_manglik ? 'fa-exclamation-triangle' : 'fa-check-circle'}`} style={{ marginRight: 6 }}></i>
                                {manglikBride.is_manglik ? 'Manglik' : 'Non-Manglik'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                      <button
                        type="button"
                        className="btn-generate"
                        onClick={() => { setResult(null); setStep(1); }}
                        style={{
                          flex: 1,
                          background: 'rgba(40, 44, 60, 0.8)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#b0b7c3',
                        }}
                      >
                        <i className="fas fa-redo" style={{ marginRight: 8 }}></i> Start Over
                      </button>
                      <button
                        type="button"
                        className="btn-generate"
                        style={{ flex: 1 }}
                        onClick={() => navigate('/order')}
                      >
                        <i className="fas fa-shopping-cart" style={{ marginRight: 8 }}></i> Order Full Report
                      </button>
                    </div>

                    <p className="preview-note" style={{ marginTop: '16px' }}>
                      <i className="fas fa-lock"></i> Full compatibility report with detailed analysis in paid version
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
