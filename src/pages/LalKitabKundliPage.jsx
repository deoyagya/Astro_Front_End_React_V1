import PageShell from '../components/PageShell';
import { useMemo, useState, useCallback } from 'react';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { NorthIndianChart } from '../components/chart';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBirthData } from '../hooks/useBirthData';
import { MALEFICS, SIGN_NAMES, formatDegrees } from '../utils/jyotish';

function buildRows(chart) {
  if (!chart?.placements) return [];
  const rows = [];
  for (const [house, houseData] of Object.entries(chart.placements)) {
    for (const planet of houseData.planets || []) {
      const pData = houseData.planetData?.[planet];
      if (!pData) continue;
      rows.push({
        name: planet,
        house: Number(house),
        fixedSign: houseData.sign_name || SIGN_NAMES[houseData.sign] || `Sign ${houseData.sign}`,
        natalSign: pData.original_sign_name || '—',
        degree: pData.degree != null ? formatDegrees(pData.degree) : '—',
        retro: pData.isRetro || false,
        combust: pData.isCombust || false,
      });
    }
  }
  return rows.sort((a, b) => a.house - b.house || a.name.localeCompare(b.name));
}

export default function LalKitabKundliPage() {
  const { user } = useAuth();
  const {
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    birthPlace, setBirthPlace,
    saveBirthData,
    validate,
    buildPayload,
  } = useBirthData({ reportType: 'lal_kitab' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [viewMode, setViewMode] = useState('chart');

  const handleGenerate = useCallback(async () => {
    setError('');
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/v1/chart/lal-kitab', buildPayload());
      setResponse(data);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to generate Lal Kitab Kundli. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [buildPayload, saveBirthData, validate]);

  const chart = response?.lal_kitab || null;
  const rows = useMemo(() => buildRows(chart), [chart]);

  return (
    <PageShell activeNav="kundli">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Lal Kitab Kundli{user?.full_name ? ` for ${user.full_name}` : ''}</h1>
            <p>Generate a fixed-house Lal Kitab birth chart from your birth details.</p>
          </div>

          <div className="two-column birth-chart-layout">
            <div className="form-card">
              <h2>Birth Details</h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="birth-form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <DateInput id="birthDate" value={birthDate} onChange={setBirthDate} />
                  </div>
                  <div className="form-group">
                    <label>Time of Birth</label>
                    <TimeSelectGroup
                      hourId="hour"
                      minuteId="minute"
                      ampmId="ampm"
                      onHourChange={setHour}
                      onMinuteChange={setMinute}
                      onAmpmChange={setAmpm}
                      hourValue={hour}
                      minuteValue={minute}
                      ampmValue={ampm}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ position: 'relative', zIndex: 100 }}>
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

                <button type="button" className="btn-generate" onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-book-open"></i> Generate Lal Kitab Kundli
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="chart-card">
              <h2>Lal Kitab View</h2>
              <p>
                Houses are fixed from Aries to Pisces. Planets stay in their natal houses, but the house signs are normalized for Lal Kitab interpretation.
              </p>

              {chart && (
                <>
                  <div className="chart-style-toggle" style={{ marginBottom: 12 }}>
                    <button className={viewMode === 'chart' ? 'active' : ''} onClick={() => setViewMode('chart')}>
                      <i className="fas fa-chart-pie"></i> Chart View
                    </button>
                    <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                      <i className="fas fa-table"></i> Table View
                    </button>
                  </div>

                  <div
                    style={{
                      background: 'rgba(155, 89, 182, 0.08)',
                      border: '1px solid rgba(155, 89, 182, 0.24)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      marginBottom: 16,
                    }}
                  >
                    <strong style={{ color: '#c7a8ff' }}>BPHS Ascendant Reference:</strong>{' '}
                    <span style={{ color: '#f0eaff' }}>
                      {chart.original_lagna_sign_name} ({chart.original_lagna_sign})
                    </span>
                  </div>
                </>
              )}

              {viewMode === 'chart' && (
                <div className="chart-placeholder">
                  {loading ? (
                    <div className="api-loading">
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>Building Lal Kitab chart...</p>
                    </div>
                  ) : chart ? (
                    <NorthIndianChart
                      chartData={chart}
                      chartLabel="Lal Kitab Kundli"
                      showAscMarker={false}
                    />
                  ) : (
                    <div className="chart-preview">
                      <i className="fas fa-book-open"></i>
                      <p>Enter details and click Generate</p>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'table' && (
                <>
                  {rows.length > 0 ? (
                    <table className="planet-table">
                      <thead>
                        <tr>
                          <th>Planet</th>
                          <th>Lal Kitab House</th>
                          <th>Fixed Sign</th>
                          <th>Natal Sign</th>
                          <th>Degree</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={`${row.house}-${row.name}`}>
                            <td style={{ color: MALEFICS.has(row.name) ? '#ff6b6b' : '#2ed573', fontWeight: 600 }}>{row.name}</td>
                            <td>{row.house}</td>
                            <td>{row.fixedSign}</td>
                            <td>{row.natalSign}</td>
                            <td>{row.degree}</td>
                            <td>
                              {row.retro && <span className="dignity-badge badge-retro" style={{ marginRight: 4 }}>R</span>}
                              {row.combust && <span className="dignity-badge badge-combust">C</span>}
                              {!row.retro && !row.combust && <span style={{ color: '#777' }}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="planet-table">
                      <thead>
                        <tr>
                          <th>Planet</th>
                          <th>Lal Kitab House</th>
                          <th>Fixed Sign</th>
                          <th>Natal Sign</th>
                          <th>Degree</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#c7cfdd' }}>
                            Generate a chart to see placements
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {chart?.methodology?.planet_house_rule && (
                <p className="preview-note">
                  <i className="fas fa-info-circle"></i> {chart.methodology.planet_house_rule}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
