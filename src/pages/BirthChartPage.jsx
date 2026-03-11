import PageShell from '../components/PageShell';
import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import VedicChart, { CHART_OPTIONS, enrichD1 } from '../components/chart';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBirthData, to24Hour } from '../hooks/useBirthData';
import {
  SIGN_NAMES,
  MALEFICS,
  formatDegrees,
  getSuffix,
  getDignity,
} from '../utils/jyotish';
import { useStyles } from '../context/StyleContext';

/* Form-level chart options (lowercase value for form state, key for API) */
const chartOptions = CHART_OPTIONS.map(o => ({
  value: o.value.toLowerCase(),
  label: o.label,
  key: o.value,
  description: o.description,
}));

export default function BirthChartPage() {
  const { getOverride } = useStyles('birth-chart');
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    fullName, setFullName,
    birthDate, setBirthDate,
    hour, setHour,
    minute, setMinute,
    ampm, setAmpm,
    birthPlace, setBirthPlace,
    saveBirthData,
  } = useBirthData({ reportType: 'full' });

  const [selectedChart, setSelectedChart] = useState('d1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartBundle, setChartBundle] = useState(null);

  const [viewMode, setViewMode] = useState('chart');
  const [selectedHouse, setSelectedHouse] = useState(null);

  const selectedChartMeta = useMemo(
    () => chartOptions.find((option) => option.value === selectedChart),
    [selectedChart]
  );

  const handleGenerate = useCallback(async () => {
    setError('');
    setSelectedHouse(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!birthDate) {
      setError('Please select your date of birth.');
      return;
    }
    if (!birthPlace) {
      setError('Please select a birth place from the dropdown.');
      return;
    }

    const tob = to24Hour(hour, minute, ampm);
    const payload = { name: fullName.trim(), dob: birthDate, tob, place_of_birth: birthPlace.name };
    const params = new URLSearchParams({ include_vargas: 'true', include_dasha: 'false', include_ashtakavarga: 'false' });

    setLoading(true);
    try {
      const data = await api.post(`/v1/chart/create?${params}`, payload);
      setChartBundle(data);
      saveBirthData();
    } catch (err) {
      setError(err.message || 'Failed to generate chart. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fullName, birthDate, hour, minute, ampm, birthPlace, saveBirthData]);

  /* Extract data from bundle */
  const bundle = chartBundle?.bundle || {};
  const natal = bundle.natal || {};
  const planets = natal.planets || {};
  const ascendant = natal.ascendant || {};

  /* Planet table rows (kept here — table view is page-specific) */
  const planetRows = useMemo(() => {
    if (!chartBundle) return [];
    const chartKey = selectedChartMeta?.key || 'D1';
    const isD1 = chartKey === 'D1';
    const vargaData = bundle.vargas?.[chartKey];
    const source = isD1 ? planets : vargaData || {};
    const ascSign = isD1
      ? ascendant.sign
        ? parseInt(ascendant.sign, 10)
        : null
      : vargaData?.Lagna?.sign || null;

    const rows = [];
    const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    for (const pName of order) {
      const pData = source[pName];
      if (!pData || typeof pData !== 'object') continue;
      const sign = parseInt(pData.sign, 10);
      const signName = SIGN_NAMES[sign] || `Sign ${sign}`;
      const house = ascSign ? ((sign - ascSign + 12) % 12) + 1 : '—';
      const lon = pData.longitude != null ? pData.longitude : pData.lon;
      const degInSign = lon != null ? lon % 30 : pData.degree != null ? pData.degree : null;

      rows.push({
        name: pName,
        sign: signName,
        house,
        degree: degInSign != null ? formatDegrees(degInSign) : '—',
        retro: pData.is_retrograde || pData.retrograde || pData.is_retro || false,
        combust: pData.derived?.combustion?.is_combust || false,
        dignity: getDignity(pName, sign),
        nakshatra: pData.nakshatra || null,
      });
    }
    return rows;
  }, [chartBundle, selectedChartMeta, planets, ascendant, bundle]);

  /* Active ascendant */
  const activeAscendant = useMemo(() => {
    if (!chartBundle) return null;
    const chartKey = selectedChartMeta?.key || 'D1';
    if (chartKey === 'D1') return ascendant.sign ? ascendant : null;
    const vargaLagna = bundle.vargas?.[chartKey]?.Lagna;
    if (vargaLagna) return { sign: vargaLagna.sign, longitude: vargaLagna.longitude || vargaLagna.degree };
    return null;
  }, [chartBundle, selectedChartMeta, ascendant, bundle]);

  /* D1 house click → HouseExplorePage */
  const handleHouseClick = useCallback(
    (houseNum) => {
      setSelectedHouse(houseNum);
      if ((selectedChartMeta?.key || 'D1') === 'D1') {
        sessionStorage.setItem('chartBundle', JSON.stringify(chartBundle));
        sessionStorage.setItem(
          'chartBirthInfo',
          JSON.stringify({
            name: fullName,
            dob: birthDate,
            tob: to24Hour(hour, minute, ampm),
            place: birthPlace?.name,
          })
        );
        navigate(`/birth-chart/house/${houseNum}`);
      }
    },
    [selectedChartMeta, chartBundle, fullName, birthDate, hour, minute, ampm, birthPlace, navigate]
  );

  const hasChartData = !!chartBundle;

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Birth Chart (Kundli){user?.full_name ? ` for ${user.full_name}` : ''}</h1>
            <p>Enter your birth details to generate your Vedic birth chart</p>
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

                <div className="birth-form-row">
                  <div className="form-group" style={{ position: 'relative', zIndex: 100 }}>
                    <label>Place of Birth</label>
                    <PlaceAutocomplete
                      id="birthPlace"
                      placeholder="Enter birth city"
                      value={birthPlace?.name || ''}
                      onSelect={setBirthPlace}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="chartType">Select Chart Type</label>
                    <select
                      id="chartType"
                      value={selectedChart}
                      onChange={(e) => {
                        setSelectedChart(e.target.value);
                        setSelectedHouse(null);
                      }}
                    >
                      {chartOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      <i className="fas fa-chart-pie"></i> Generate Chart
                    </>
                  )}
                </button>
                <p className="preview-note">
                  <i className="fas fa-info-circle"></i> Full analysis available in paid report
                </p>
              </form>
            </div>

            <div className="chart-card">
              <h2>{selectedChartMeta ? `Your ${selectedChartMeta.label} Chart` : 'Your Chart'}</h2>
              <p className="preview-note" style={{ marginBottom: 16 }}>
                <i className="fas fa-info-circle"></i>{' '}
                {selectedChartMeta?.description || 'Select a chart type.'}
              </p>

              {/* Chart View / Table View toggle */}
              {hasChartData && (
                <div className="chart-style-toggle" style={{ marginBottom: 12 }}>
                  <button className={viewMode === 'chart' ? 'active' : ''} onClick={() => setViewMode('chart')}>
                    <i className="fas fa-chart-pie"></i> Chart View
                  </button>
                  <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                    <i className="fas fa-table"></i> Table View
                  </button>
                </div>
              )}

              {/* ===== CHART VIEW — via VedicChart library ===== */}
              {viewMode === 'chart' && (
                <>
                  <div className="chart-placeholder" id="chartPlaceholder">
                    {loading ? (
                      <div className="api-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Computing chart...</p>
                      </div>
                    ) : hasChartData ? (
                      <VedicChart
                        chartBundle={chartBundle}
                        chartKey={selectedChartMeta?.key || 'D1'}
                        onHouseClick={handleHouseClick}
                        selectedHouse={selectedHouse}
                        showChartSelector={false}
                        showAscendant={false}
                        chartLabel={selectedChartMeta?.label || 'D1 Chart'}
                      />
                    ) : (
                      <div className="chart-preview">
                        <i className="fas fa-chart-pie"></i>
                        <p>Enter details and click Generate</p>
                      </div>
                    )}
                  </div>

                  {hasChartData && (selectedChartMeta?.key || 'D1') === 'D1' && (
                    <p className="chart-hint-text">
                      <i className="fas fa-hand-pointer"></i> Click any house to open a dedicated divisional chart page for that house.
                    </p>
                  )}
                </>
              )}

              {/* Ascendant info — visible in both views */}
              {activeAscendant && activeAscendant.sign && (
                <div style={{ background: 'rgba(46,213,115,0.08)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
                  <span style={{ color: '#2ed573', fontWeight: 600 }}>
                    <i className="fas fa-compass"></i>{' '}
                    Ascendant: {SIGN_NAMES[parseInt(activeAscendant.sign, 10)] || '—'}
                    {activeAscendant.longitude != null ? ` — ${formatDegrees(activeAscendant.longitude % 30)}` : ''}
                  </span>
                </div>
              )}

              {/* ===== TABLE VIEW ===== */}
              {viewMode === 'table' && (
                <>
                  <h3 className="section-subtitle">
                    Planetary Positions {selectedChartMeta?.key !== 'D1' ? `(${selectedChartMeta?.label})` : ''}
                  </h3>
                  {planetRows.length > 0 ? (
                    <table className="planet-table" id="planetTable">
                      <thead>
                        <tr>
                          <th>Planet</th>
                          <th>Sign</th>
                          <th>House</th>
                          <th>Degree</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {planetRows.map((row) => (
                          <tr key={row.name}>
                            <td style={{ color: MALEFICS.has(row.name) ? '#ff6b6b' : '#2ed573', fontWeight: 600 }}>{row.name}</td>
                            <td>{row.sign}</td>
                            <td>
                              {row.house}
                              {row.house !== '—' ? getSuffix(row.house) : ''}
                            </td>
                            <td>{row.degree}</td>
                            <td>
                              {row.retro && (
                                <span className="dignity-badge badge-retro" style={{ marginRight: 4 }}>
                                  R
                                </span>
                              )}
                              {row.combust && (
                                <span className="dignity-badge badge-combust" style={{ marginRight: 4 }}>
                                  C
                                </span>
                              )}
                              {row.dignity === 'exalted' && <span className="dignity-badge dignity-exalted">Exalted</span>}
                              {row.dignity === 'debilitated' && <span className="dignity-badge dignity-debilitated">Debil.</span>}
                              {row.dignity === 'own' && <span className="dignity-badge dignity-own">Own</span>}
                              {row.dignity === 'neutral' && !row.retro && !row.combust && <span style={{ color: '#555' }}>—</span>}
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
                          <th>Sign</th>
                          <th>House</th>
                          <th>Degree</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: '#c7cfdd' }}>
                            Generate a chart to see positions
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </>
              )}

              <p className="preview-note">
                <i className="fas fa-lock"></i> Full chart with interpretation available in paid report
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
