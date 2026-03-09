import PageShell from '../components/PageShell';
import { useState, useCallback } from 'react';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';
import { useBirthData, to24Hour } from '../hooks/useBirthData';

/** Recursively render dasha tree nodes */
function DashaNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasSub = node.sub_periods && node.sub_periods.length > 0;
  const isCurrent = node.is_current || false;

  const levelLabels = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma', 'Prana'];
  const levelLabel = levelLabels[depth] || `Level ${depth + 1}`;

  const startDate = node.start ? new Date(node.start).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const endDate = node.end ? new Date(node.end).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div
        className={`dasha-item ${isCurrent ? 'current' : ''}`}
        style={{ cursor: hasSub ? 'pointer' : 'default' }}
        onClick={() => hasSub && setExpanded(!expanded)}
      >
        <div className="period">
          {hasSub && (
            <i className={`fas fa-chevron-${expanded ? 'down' : 'right'}`} style={{ marginRight: 8, fontSize: '0.875rem' }}></i>
          )}
          {node.planet} {levelLabel}
        </div>
        <div className="dates">{startDate} — {endDate}</div>
        {isCurrent && (
          <span style={{ color: '#2ed573', fontSize: '0.9375rem', marginTop: 4, display: 'inline-block' }}>
            <i className="fas fa-clock"></i> Current Period
          </span>
        )}
      </div>
      {expanded && hasSub && (
        <div>
          {node.sub_periods.map((sub, idx) => (
            <DashaNode key={`${sub.planet}-${idx}`} node={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashaPage() {
  const {
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    birthPlace, setBirthPlace,
    saveBirthData,
  } = useBirthData({ reportType: 'dasha' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashaData, setDashaData] = useState(null);

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

    const params = new URLSearchParams({
      include_dasha: 'true',
      dasha_depth: '3',
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
  }, [fullName, birthDate, hour, minute, ampm, birthPlace, saveBirthData]);

  const dashaTree = dashaData?.bundle?.dasha_tree || [];

  // Find current mahadasha and antardasha for the summary
  const currentMD = dashaTree.find(d => d.is_current);
  const currentAD = currentMD?.sub_periods?.find(d => d.is_current);

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
                  <i className="fas fa-info-circle"></i> Full analysis available in paid report
                </p>
              </form>
            </div>

            {/* ─── Right: Dasha Timeline ─── */}
            <div className="chart-card">
              <h2>Your Dasha Timeline</h2>

              {loading ? (
                <div className="api-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Computing Vimshottari Dasha...</p>
                </div>
              ) : dashaTree.length > 0 ? (
                <div className="dasha-timeline" id="dashaTimeline">
                  {dashaTree.map((md, idx) => (
                    <DashaNode key={`${md.planet}-${idx}`} node={md} depth={0} />
                  ))}
                </div>
              ) : (
                <div className="dasha-timeline" style={{ textAlign: 'center', padding: 40, color: '#c7cfdd' }}>
                  <i className="fas fa-clock" style={{ fontSize: '2rem', marginBottom: 10, display: 'block', color: '#7b5bff' }}></i>
                  Enter your birth details and click Calculate to see your dasha timeline
                </div>
              )}

              {/* Current Antardasha summary */}
              {currentAD && (
                <>
                  <h3 className="section-subtitle">Current Antardasha</h3>
                  <div style={{ background: 'rgba(40,44,60,0.6)', padding: '15px', borderRadius: '8px' }}>
                    <p style={{ color: '#c7cfdd' }}>
                      Current Antardasha:{' '}
                      <strong style={{ color: '#fff' }}>
                        {currentAD.planet} ({currentAD.start ? new Date(currentAD.start).getFullYear() : ''}–
                        {currentAD.end ? new Date(currentAD.end).getFullYear() : ''})
                      </strong>
                    </p>
                    {currentMD && (
                      <p style={{ color: '#c7cfdd', marginTop: 10 }}>
                        Mahadasha Lord: <strong style={{ color: '#b794ff' }}>{currentMD.planet}</strong>
                      </p>
                    )}
                  </div>
                </>
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
