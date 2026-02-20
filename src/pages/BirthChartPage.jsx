import PageShell from '../components/PageShell';
import { useMemo, useState, useCallback } from 'react';
import DateInput from '../components/form/DateInput';
import TimeSelectGroup from '../components/form/TimeSelectGroup';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { api } from '../api/client';

const SIGN_NAMES = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

const chartOptions = [
  { value: 'd1', label: 'Rashi (D-1)', description: 'The fundamental birth chart representing the physical body, general health, and overall life pattern.' },
  { value: 'd2', label: 'Hora (D-2)', description: 'Focuses on wealth, financial prosperity, assets, and family lineage.' },
  { value: 'd3', label: 'Drekkana (D-3)', description: 'Analyzes siblings, courage, strength, and short travels.' },
  { value: 'd4', label: 'Chaturthamsa (D-4)', description: 'Examines fixed assets, property, residential home, and overall fortune.' },
  { value: 'd7', label: 'Saptamsa (D-7)', description: 'Relates to children, grandchildren, progeny, and creative capacity.' },
  { value: 'd9', label: 'Navamsa (D-9)', description: 'The most critical sub-chart; it reveals the strength of planets and details regarding marriage, spouse, and spiritual dharma.' },
  { value: 'd10', label: 'Dasamsa (D-10)', description: 'Focuses on career, profession, status in society, and public life.' },
  { value: 'd12', label: 'Dwadashamsa (D-12)', description: 'Provides details about parents, ancestors, and inherited traits or diseases.' },
  { value: 'd16', label: 'Shodashamsa (D-16)', description: 'Examines luxuries, vehicles, conveyances, and general happiness.' },
  { value: 'd20', label: 'Vimshamsa (D-20)', description: 'Relates to spiritual progress, religious inclinations, and devotion to deities.' },
  { value: 'd24', label: 'Chaturvimshamsa (D-24)', description: 'Focuses on education, learning, academic achievements, and knowledge.' },
  { value: 'd27', label: 'Saptavimshamsa (D-27)', description: 'Analyzes physical strength, stamina, and general vitality.' },
  { value: 'd30', label: 'Trimshamsa (D-30)', description: 'Examines misfortunes, health issues, hidden dangers, and bad luck.' },
  { value: 'd40', label: 'Khavedamsha (D-40)', description: 'Investigates auspicious and inauspicious events, often linked to maternal ancestral influences.' },
  { value: 'd45', label: 'Akshavedamsha (D-45)', description: 'Reflects on character, conduct, and finer aspects of moral ethics.' },
  { value: 'd60', label: 'Shashtyamsha (D-60)', description: 'A deeply spiritual chart representing past-life karma and the ultimate outcome of all life events.' },
];

/** Convert 12h AM/PM → 24h time string "HH:MM" */
function to24Hour(hour, minute, ampm) {
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (ampm === 'AM' && h === 12) h = 0;
  else if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format longitude degrees to "DD° MM' SS"" */
function formatDegrees(lon) {
  if (lon === undefined || lon === null) return '—';
  const deg = Math.floor(lon);
  const fracMin = (lon - deg) * 60;
  const min = Math.floor(fracMin);
  const sec = Math.round((fracMin - min) * 60);
  return `${deg}° ${min}' ${sec}"`;
}

/**
 * South Indian chart grid renderer.
 * Draws a 4×4 grid with the 12 houses in the South Indian layout.
 */
function SouthIndianChart({ chartData }) {
  if (!chartData) return null;

  const placements = chartData.placements || {};

  // South Indian fixed layout: sign positions in 4×4 grid
  // Row 0: houses 12, 1, 2, 3
  // Row 1: houses 11, -, -, 4
  // Row 2: houses 10, -, -, 5
  // Row 3: houses 9, 8, 7, 6
  const layout = [
    [12, 1, 2, 3],
    [11, null, null, 4],
    [10, null, null, 5],
    [9, 8, 7, 6],
  ];

  const cellSize = 95;
  const padding = 5;
  const totalWidth = cellSize * 4 + padding * 2;
  const totalHeight = cellSize * 4 + padding * 2;

  return (
    <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="south-indian-chart" style={{ width: '100%', maxWidth: 420, height: 'auto' }}>
      <rect x={0} y={0} width={totalWidth} height={totalHeight} fill="rgba(0,0,0,0.2)" rx={8} />
      {layout.map((row, ri) =>
        row.map((houseNum, ci) => {
          if (houseNum === null) return null;
          const x = padding + ci * cellSize;
          const y = padding + ri * cellSize;
          const hData = placements[String(houseNum)] || {};
          const signNum = hData.sign || houseNum;
          const signName = SIGN_NAMES[signNum] || '';
          const planets = hData.planets || [];
          const isLagna = planets.includes('Lagna');

          return (
            <g key={houseNum}>
              <rect
                x={x} y={y} width={cellSize} height={cellSize}
                fill={isLagna ? 'rgba(123,91,255,0.15)' : 'rgba(30,33,48,0.6)'}
                stroke="#3a3f50" strokeWidth={1} rx={4}
              />
              {/* Sign name at top */}
              <text x={x + cellSize / 2} y={y + 14} textAnchor="middle" fill="#9d7bff" fontSize={10} fontWeight="600">
                {signName}
              </text>
              {/* House number */}
              <text x={x + cellSize - 8} y={y + 14} textAnchor="end" fill="#555" fontSize={8}>
                H{houseNum}
              </text>
              {/* Planet abbreviations */}
              {planets.filter(p => p !== 'Lagna').map((p, idx) => (
                <text
                  key={p}
                  x={x + cellSize / 2}
                  y={y + 30 + idx * 14}
                  textAnchor="middle"
                  fill={p === 'Sun' || p === 'Mars' || p === 'Saturn' || p === 'Rahu' || p === 'Ketu' ? '#ff6b6b' : '#e0e0e0'}
                  fontSize={11}
                  fontWeight="500"
                >
                  {p}
                </text>
              ))}
              {isLagna && (
                <text x={x + 8} y={y + cellSize - 6} fill="#2ed573" fontSize={8} fontWeight="700">
                  ASC
                </text>
              )}
            </g>
          );
        })
      )}
      {/* Center label */}
      <text x={totalWidth / 2} y={totalHeight / 2 - 6} textAnchor="middle" fill="#9d7bff" fontSize={11} fontWeight="600">
        {chartData.ui?.chart_label || 'D1 Chart'}
      </text>
      <text x={totalWidth / 2} y={totalHeight / 2 + 10} textAnchor="middle" fill="#666" fontSize={9}>
        South Indian
      </text>
    </svg>
  );
}

export default function BirthChartPage() {
  const [selectedChart, setSelectedChart] = useState('d1');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [hour, setHour] = useState('06');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');
  const [birthPlace, setBirthPlace] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartBundle, setChartBundle] = useState(null);

  const selectedChartMeta = useMemo(
    () => chartOptions.find((option) => option.value === selectedChart),
    [selectedChart]
  );

  const handleGenerate = useCallback(async () => {
    setError('');

    // Validation
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!birthDate) { setError('Please select your date of birth.'); return; }
    if (!birthPlace) { setError('Please select a birth place from the dropdown.'); return; }

    // Build request
    const tob = to24Hour(hour, minute, ampm);
    const isD1 = selectedChart === 'd1';

    const payload = {
      name: fullName.trim(),
      dob: birthDate,
      tob,
      place_of_birth: birthPlace.name,
      ...(birthPlace.lat != null && birthPlace.lon != null && birthPlace.timezone
        ? { lat: birthPlace.lat, lon: birthPlace.lon, tz_id: birthPlace.timezone }
        : {}),
    };

    const params = new URLSearchParams({
      include_vargas: String(!isD1),
      include_dasha: 'false',
      include_ashtakavarga: 'false',
    });

    setLoading(true);
    try {
      const data = await api.post(`/v1/chart/create?${params}`, payload);
      setChartBundle(data);
    } catch (err) {
      setError(err.message || 'Failed to generate chart. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fullName, birthDate, hour, minute, ampm, birthPlace, selectedChart]);

  // Extract data from bundle
  const bundle = chartBundle?.bundle || {};
  const natal = bundle.natal || {};
  const planets = natal.planets || {};
  const ascendant = natal.ascendant || {};
  const d1Chart = bundle.charts?.D1 || null;

  // Build planet table data
  const planetRows = useMemo(() => {
    if (!chartBundle) return [];
    const ascSign = ascendant.sign ? parseInt(ascendant.sign, 10) : null;
    const rows = [];

    // Main 9 planets in traditional order
    const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    for (const pName of order) {
      const pData = planets[pName];
      if (!pData || typeof pData !== 'object') continue;
      const sign = parseInt(pData.sign, 10);
      const signName = SIGN_NAMES[sign] || `Sign ${sign}`;
      // House = planet sign - asc sign + 1 (whole sign)
      let house = ascSign ? ((sign - ascSign + 12) % 12) + 1 : '—';
      const lon = pData.longitude != null ? pData.longitude : pData.lon;
      // Degree within sign: lon % 30
      const degInSign = lon != null ? (lon % 30) : null;

      rows.push({
        name: pName,
        sign: signName,
        house: house,
        degree: degInSign != null ? formatDegrees(degInSign) : '—',
        retro: pData.retrograde || pData.is_retro || false,
        nakshatra: pData.nakshatra || null,
      });
    }
    return rows;
  }, [chartBundle, planets, ascendant]);

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container">
          <div className="tool-header">
            <h1>Birth Chart (Kundli)</h1>
            <p>Enter your birth details to generate your Vedic birth chart</p>
          </div>

          <div className="two-column birth-chart-layout">

            {/* ─── Left: Form ─── */}
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
                    <DateInput id="birthDate" onChange={setBirthDate} />
                  </div>
                  <div className="form-group">
                    <label>Time of Birth</label>
                    <TimeSelectGroup
                      hourId="hour" minuteId="minute" ampmId="ampm"
                      onHourChange={setHour}
                      onMinuteChange={setMinute}
                      onAmpmChange={setAmpm}
                    />
                  </div>
                </div>

                <div className="birth-form-row">
                  <div className="form-group">
                    <label>Place of Birth</label>
                    <PlaceAutocomplete
                      id="birthPlace"
                      placeholder="Enter birth city"
                      onSelect={setBirthPlace}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="chartType">Select Chart Type</label>
                    <select
                      id="chartType"
                      value={selectedChart}
                      onChange={(e) => setSelectedChart(e.target.value)}
                    >
                      {chartOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
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

                <button
                  type="button"
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                  ) : (
                    <><i className="fas fa-chart-pie"></i> Generate Chart</>
                  )}
                </button>
                <p className="preview-note">
                  <i className="fas fa-info-circle"></i> Full analysis available in paid report
                </p>
              </form>
            </div>

            {/* ─── Right: Chart & Table ─── */}
            <div className="chart-card">
              <h2>{selectedChartMeta ? `Your ${selectedChartMeta.label} Chart` : 'Your Chart'}</h2>
              <p className="preview-note" style={{ marginBottom: '16px' }}>
                <i className="fas fa-info-circle"></i>{' '}
                {selectedChartMeta ? selectedChartMeta.description : 'Select a chart type to view its purpose and interpretation focus.'}
              </p>

              {/* Chart visualization */}
              <div className="chart-placeholder" id="chartPlaceholder">
                {loading ? (
                  <div className="api-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Computing chart...</p>
                  </div>
                ) : d1Chart ? (
                  <SouthIndianChart chartData={d1Chart} />
                ) : (
                  <div className="chart-preview">
                    <i className="fas fa-chart-pie"></i>
                    <p>Enter details and click Generate</p>
                  </div>
                )}
              </div>

              {/* Ascendant info */}
              {chartBundle && ascendant.sign && (
                <div style={{ background: 'rgba(46,213,115,0.08)', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
                  <span style={{ color: '#2ed573', fontWeight: 600 }}>
                    <i className="fas fa-compass"></i>{' '}
                    Ascendant (Lagna): {SIGN_NAMES[parseInt(ascendant.sign, 10)] || '—'}
                    {ascendant.longitude != null ? ` — ${formatDegrees(ascendant.longitude % 30)}` : ''}
                  </span>
                </div>
              )}

              {/* Planet table */}
              <h3 className="section-subtitle">Planetary Positions</h3>
              {planetRows.length > 0 ? (
                <table className="planet-table" id="planetTable">
                  <thead>
                    <tr>
                      <th>Planet</th>
                      <th>Sign</th>
                      <th>House</th>
                      <th>Degree</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planetRows.map((row) => (
                      <tr key={row.name}>
                        <td>
                          {row.name}
                          {row.retro && <span style={{ color: '#ff6b6b', fontSize: '0.75rem', marginLeft: 6 }}>(R)</span>}
                        </td>
                        <td>{row.sign}</td>
                        <td>{row.house}{row.house !== '—' ? getSuffix(row.house) : ''}</td>
                        <td>{row.degree}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="planet-table">
                  <thead>
                    <tr><th>Planet</th><th>Sign</th><th>House</th><th>Degree</th></tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: '#b0b7c3' }}>Generate a chart to see planetary positions</td></tr>
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

/** Ordinal suffix for house numbers */
function getSuffix(n) {
  const num = typeof n === 'number' ? n : parseInt(n, 10);
  if (num === 1) return 'st';
  if (num === 2) return 'nd';
  if (num === 3) return 'rd';
  return 'th';
}
