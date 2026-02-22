import PageShell from '../components/PageShell';
import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import NorthIndianChart from '../components/NorthIndianChart';
import SouthIndianChart from '../components/SouthIndianChart';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBirthData, to24Hour } from '../hooks/useBirthData';
import {
  SIGN_NAMES,
  MALEFICS,
  formatDegrees,
  getSuffix,
  vargaToChartData,
  getDignity,
} from '../utils/jyotish';

/* ===== Divisional chart options ===== */
const chartOptions = [
  { value: 'd1', label: 'Rashi (D-1)', key: 'D1', description: 'The fundamental birth chart representing the physical body, general health, and overall life pattern.' },
  { value: 'd2', label: 'Hora (D-2)', key: 'D2', description: 'Focuses on wealth, financial prosperity, assets, and family lineage.' },
  { value: 'd3', label: 'Drekkana (D-3)', key: 'D3', description: 'Analyzes siblings, courage, strength, and short travels.' },
  { value: 'd4', label: 'Chaturthamsa (D-4)', key: 'D4', description: 'Examines fixed assets, property, residential home, and overall fortune.' },
  { value: 'd7', label: 'Saptamsa (D-7)', key: 'D7', description: 'Relates to children, grandchildren, progeny, and creative capacity.' },
  { value: 'd9', label: 'Navamsa (D-9)', key: 'D9', description: 'The most critical sub-chart; it reveals the strength of planets and details regarding marriage, spouse, and spiritual dharma.' },
  { value: 'd10', label: 'Dasamsa (D-10)', key: 'D10', description: 'Focuses on career, profession, status in society, and public life.' },
  { value: 'd12', label: 'Dwadashamsa (D-12)', key: 'D12', description: 'Provides details about parents, ancestors, and inherited traits or diseases.' },
  { value: 'd16', label: 'Shodashamsa (D-16)', key: 'D16', description: 'Examines luxuries, vehicles, conveyances, and general happiness.' },
  { value: 'd20', label: 'Vimshamsa (D-20)', key: 'D20', description: 'Relates to spiritual progress, religious inclinations, and devotion to deities.' },
  { value: 'd24', label: 'Chaturvimshamsa (D-24)', key: 'D24', description: 'Focuses on education, learning, academic achievements, and knowledge.' },
  { value: 'd27', label: 'Saptavimshamsa (D-27)', key: 'D27', description: 'Analyzes physical strength, stamina, and general vitality.' },
  { value: 'd30', label: 'Trimshamsa (D-30)', key: 'D30', description: 'Examines misfortunes, health issues, hidden dangers, and bad luck.' },
  { value: 'd40', label: 'Khavedamsha (D-40)', key: 'D40', description: 'Investigates auspicious and inauspicious events, often linked to maternal ancestral influences.' },
  { value: 'd45', label: 'Akshavedamsha (D-45)', key: 'D45', description: 'Reflects on character, conduct, and finer aspects of moral ethics.' },
  { value: 'd60', label: 'Shashtyamsha (D-60)', key: 'D60', description: 'A deeply spiritual chart representing past-life karma and the ultimate outcome of all life events.' },
];

/**
 * Enrich D1 chart placements with per-planet metadata
 * (degree, retro, combust, dignity) from natal planets data.
 */
function enrichD1WithPlanetData(d1Chart, natalPlanets) {
  if (!d1Chart?.placements || !natalPlanets) return d1Chart;
  const enriched = JSON.parse(JSON.stringify(d1Chart));
  for (const [, hData] of Object.entries(enriched.placements)) {
    hData.planetData = hData.planetData || {};
    for (const pName of hData.planets || []) {
      if (pName === 'Lagna') continue;
      const pNatal = natalPlanets[pName];
      if (!pNatal) continue;
      const lon = pNatal.longitude ?? pNatal.lon;
      const degInSign = lon != null ? lon % 30 : pNatal.degree ?? null;
      hData.planetData[pName] = {
        degree: degInSign,
        longitude: lon,
        isRetro: pNatal.is_retrograde || pNatal.retrograde || pNatal.is_retro || false,
        isCombust: pNatal.derived?.combustion?.is_combust || false,
        sign: parseInt(pNatal.sign, 10),
      };
    }
  }
  return enriched;
}

export default function BirthChartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* Form state — pre-filled from saved data via useBirthData hook */
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

  const [chartStyle, setChartStyle] = useState(() => localStorage.getItem('chart_style_preference') || 'north');
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

  /* ===== Extract data from bundle ===== */
  const bundle = chartBundle?.bundle || {};
  const natal = bundle.natal || {};
  const planets = natal.planets || {};
  const ascendant = natal.ascendant || {};
  const d9Vargas = bundle.vargas?.D9 || null;

  /* ===== Active chart data ===== */
  const activeChartData = useMemo(() => {
    if (!chartBundle) return null;
    const chartKey = selectedChartMeta?.key || 'D1';
    const chartLabel = selectedChartMeta?.label || 'D1 Chart';

    if (chartKey === 'D1' && bundle.charts?.D1?.placements) {
      return enrichD1WithPlanetData(bundle.charts.D1, planets);
    }
    const vargaData = bundle.vargas?.[chartKey];
    if (vargaData) return vargaToChartData(vargaData, chartLabel);
    return bundle.charts?.D1 ? enrichD1WithPlanetData(bundle.charts.D1, planets) : null;
  }, [chartBundle, selectedChartMeta, bundle, planets]);

  /* ===== Planet table rows ===== */
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

  /* ===== Active ascendant ===== */
  const activeAscendant = useMemo(() => {
    if (!chartBundle) return null;
    const chartKey = selectedChartMeta?.key || 'D1';
    if (chartKey === 'D1') return ascendant.sign ? ascendant : null;
    const vargaLagna = bundle.vargas?.[chartKey]?.Lagna;
    if (vargaLagna) return { sign: vargaLagna.sign, longitude: vargaLagna.longitude || vargaLagna.degree };
    return null;
  }, [chartBundle, selectedChartMeta, ascendant, bundle]);

  /**
   * D1 house click → navigate to HouseExplorePage with the mapped divisional chart view.
   */
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
        sessionStorage.setItem('chartStylePreference', chartStyle);
        navigate(`/birth-chart/house/${houseNum}`);
      }
    },
    [selectedChartMeta, chartBundle, fullName, birthDate, hour, minute, ampm, birthPlace, navigate, chartStyle]
  );

  const handleStyleChange = (style) => {
    setChartStyle(style);
    setSelectedHouse(null);
    localStorage.setItem('chart_style_preference', style);
  };

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

              {activeChartData && (
                <div className="chart-style-toggle">
                  <button className={chartStyle === 'north' ? 'active' : ''} onClick={() => handleStyleChange('north')}>
                    North Indian
                  </button>
                  <button className={chartStyle === 'south' ? 'active' : ''} onClick={() => handleStyleChange('south')}>
                    South Indian
                  </button>
                </div>
              )}

              <div className="chart-placeholder" id="chartPlaceholder">
                {loading ? (
                  <div className="api-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Computing chart...</p>
                  </div>
                ) : activeChartData ? (
                  chartStyle === 'north' ? (
                    <NorthIndianChart
                      chartData={activeChartData}
                      chartLabel={selectedChartMeta?.label || 'D1 Chart'}
                      onHouseClick={handleHouseClick}
                      selectedHouse={selectedHouse}
                      d9Vargas={d9Vargas}
                    />
                  ) : (
                    <SouthIndianChart
                      chartData={activeChartData}
                      onHouseClick={handleHouseClick}
                      selectedHouse={selectedHouse}
                      d9Vargas={d9Vargas}
                    />
                  )
                ) : (
                  <div className="chart-preview">
                    <i className="fas fa-chart-pie"></i>
                    <p>Enter details and click Generate</p>
                  </div>
                )}
              </div>

              {activeChartData && (selectedChartMeta?.key || 'D1') === 'D1' && (
                <p className="chart-hint-text">
                  <i className="fas fa-hand-pointer"></i> Click any house to open a dedicated divisional chart page for that house.
                </p>
              )}

              {activeAscendant && activeAscendant.sign && (
                <div style={{ background: 'rgba(46,213,115,0.08)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
                  <span style={{ color: '#2ed573', fontWeight: 600 }}>
                    <i className="fas fa-compass"></i>{' '}
                    Ascendant: {SIGN_NAMES[parseInt(activeAscendant.sign, 10)] || '—'}
                    {activeAscendant.longitude != null ? ` — ${formatDegrees(activeAscendant.longitude % 30)}` : ''}
                  </span>
                </div>
              )}

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
                      <td colSpan={5} style={{ textAlign: 'center', color: '#b0b7c3' }}>
                        Generate a chart to see positions
                      </td>
                    </tr>
                  </tbody>
                </table>
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
