import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

/* ===== Display format helpers ===== */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** "1973-08-09" → "09 August 1973" */
function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  const monthName = MONTH_NAMES[parseInt(m, 10) - 1] || '';
  return `${d} ${monthName} ${y}`;
}

/** "21:41" → "09:41 PM" */
function formatDisplayTime(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, '0')}:${mStr} ${suffix}`;
}

import PageShell from '../components/PageShell';
import VedicChart, { enrichD1, VARGA_LABELS } from '../components/chart';
import { SIGN_NAMES } from '../utils/jyotish';

/* ===== House → Life Area mapping ===== */
const HOUSE_LIFE_AREAS = {
  1:  ['Self & Personality', 'Physical Appearance', 'Health & Vitality', 'Early Childhood'],
  2:  ['Wealth & Income', 'Family Values', 'Speech & Communication', 'Food & Diet'],
  3:  ['Siblings', 'Courage & Willpower', 'Short Travels', 'Communication Skills'],
  4:  ['Mother', 'Home & Property', 'Education', 'Emotional Well-being', 'Vehicles'],
  5:  ['Children', 'Romance & Love', 'Intelligence', 'Creative Expression', 'Past Life Merits'],
  6:  ['Health Issues', 'Enemies & Obstacles', 'Daily Work', 'Service', 'Debts'],
  7:  ['Marriage & Partnerships', 'Spouse', 'Business Partners', 'Foreign Travel'],
  8:  ['Longevity', 'Transformation', 'Hidden Knowledge', 'Inheritance', 'Sudden Events'],
  9:  ['Fortune & Luck', 'Father', 'Dharma & Religion', 'Higher Education', 'Long Journeys'],
  10: ['Career & Profession', 'Status & Reputation', 'Authority', 'Government Relations'],
  11: ['Gains & Profits', 'Social Network', 'Elder Siblings', 'Aspirations', 'Income Sources'],
  12: ['Losses & Expenses', 'Foreign Settlement', 'Spirituality', 'Liberation', 'Isolation'],
};

/* ===== House → default divisional chart mapping ===== */
const HOUSE_TO_VARGA = {
  1: 'D1', 2: 'D2', 3: 'D3', 4: 'D4', 5: 'D7', 6: 'D30',
  7: 'D9', 8: 'D12', 9: 'D9', 10: 'D10', 11: 'D16', 12: 'D12',
};

export default function HouseExplorePage() {
  const { houseNum: houseParam } = useParams();
  const houseNum = parseInt(houseParam, 10);
  const navigate = useNavigate();

  const [selectedLifeArea, setSelectedLifeArea] = useState(null);
  const [timelineYears, setTimelineYears] = useState(2);

  // Load bundle from sessionStorage
  const chartBundle = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('chartBundle');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  const birthInfo = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('chartBirthInfo');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  const bundle = chartBundle?.bundle || {};
  const natal = bundle.natal || {};
  const planets = natal.planets || {};

  // D1 chart data (for house info extraction)
  const d1ChartData = useMemo(() => {
    const raw = bundle.charts?.D1;
    if (!raw?.placements) return null;
    return enrichD1(raw, planets);
  }, [bundle, planets]);

  // Determine the corresponding divisional chart for this house
  const vargaKey = HOUSE_TO_VARGA[houseNum] || 'D1';
  const vargaLabel = VARGA_LABELS[vargaKey] || vargaKey;

  // Life areas for this house
  const lifeAreas = HOUSE_LIFE_AREAS[houseNum] || [];

  // Sign name for the house
  const houseData = d1ChartData?.placements?.[String(houseNum)] || {};
  const signNum = houseData.sign || houseNum;
  const signName = SIGN_NAMES[signNum] || '';

  if (!chartBundle || !houseNum || houseNum < 1 || houseNum > 12) {
    return (
      <PageShell activeNav="tools">
        <section className="tool-page">
          <div className="container">
            <div className="form-card" style={{ textAlign: 'center', padding: 40 }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ffa502', marginBottom: 16 }}></i>
              <h2>No Chart Data</h2>
              <p style={{ color: '#c7cfdd' }}>Please generate a birth chart first.</p>
              <button className="btn-generate" style={{ marginTop: 16 }} onClick={() => navigate('/birth-chart')}>
                <i className="fas fa-arrow-left"></i> Go to Birth Chart
              </button>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="tools">
      <section className="tool-page">
        <div className="container house-explore-page">
          {/* Header */}
          <div className="tool-header">
            <h1>House {houseNum} — {signName}</h1>
            <p>{birthInfo.name} &bull; {birthInfo.place}</p>
            <p className="birth-datetime">
              Birth Date: {formatDisplayDate(birthInfo.dob)}, Birth Time: {formatDisplayTime(birthInfo.tob)}
            </p>
          </div>

          <div className="house-explore-layout">

            {/* ===== LEFT COLUMN: Divisional Chart ===== */}
            <div className="house-explore-left">
              <div className="chart-section">
                <h3 className="chart-section-title">
                  <i className="fas fa-layer-group"></i> {vargaLabel} Chart
                  <span className="chart-hint"> — House {houseNum}</span>
                </h3>
                <div className="chart-svg-wrapper">
                  <VedicChart
                    chartBundle={chartBundle}
                    chartKey={vargaKey}
                    onHouseClick={(h) => navigate(`/birth-chart/house/${h}`)}
                    selectedHouse={vargaKey === 'D1' ? houseNum : null}
                    showControls={false}
                    showAscendant={false}
                    chartLabel={vargaLabel}
                  />
                </div>
              </div>

              <button className="btn-back-to-chart" onClick={() => navigate('/birth-chart')}>
                <i className="fas fa-arrow-left"></i> Back to Birth Chart
              </button>
            </div>

            {/* ===== RIGHT COLUMN: Life Areas + Time Slider ===== */}
            <div className="house-explore-right">

              {/* Life Areas dropdown/list */}
              <div className="life-areas-card">
                <h4><i className="fas fa-compass"></i> Life Areas for House {houseNum}</h4>
                <p className="life-areas-subtitle">
                  Select a life area to see predictions for the coming years
                </p>
                <div className="life-areas-list">
                  {lifeAreas.map((area) => (
                    <button
                      key={area}
                      className={`life-area-btn${selectedLifeArea === area ? ' active' : ''}`}
                      onClick={() => setSelectedLifeArea(area === selectedLifeArea ? null : area)}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slider */}
              {selectedLifeArea && (
                <div className="time-slider-card">
                  <label className="time-slider-label">
                    <i className="fas fa-clock"></i> Timeline: Next <strong>{timelineYears}</strong> year{timelineYears !== 1 ? 's' : ''}
                  </label>
                  <input
                    type="range"
                    min={1} max={5} step={1}
                    value={timelineYears}
                    onChange={(e) => setTimelineYears(parseInt(e.target.value, 10))}
                    className="time-slider"
                  />
                  <div className="time-slider-labels">
                    {[1,2,3,4,5].map((y) => (
                      <span key={y} className={timelineYears === y ? 'active' : ''}>{y} yr</span>
                    ))}
                  </div>

                  {/* Prediction area */}
                  <div className="life-area-prediction">
                    <div className="prediction-header">
                      <i className="fas fa-star" style={{ color: '#c9a84c' }}></i>
                      <strong>{selectedLifeArea}</strong>
                      <span className="prediction-meta">House {houseNum} &bull; {signName} &bull; {vargaLabel}</span>
                    </div>
                    <div className="prediction-body">
                      <p>
                        Predictions for <strong>{selectedLifeArea}</strong> over the next {timelineYears} year{timelineYears !== 1 ? 's' : ''} will appear here when connected to the prediction engine.
                      </p>
                      <div className="prediction-placeholder">
                        <i className="fas fa-hourglass-half"></i>
                        <span>Prediction engine integration coming soon</span>
                      </div>
                    </div>
                    <p className="preview-note" style={{ marginTop: 12 }}>
                      <i className="fas fa-magic"></i> Full AI-powered predictions available in your personalized reports
                    </p>
                  </div>
                </div>
              )}

              {/* House info card */}
              <div className="house-info-card">
                <h4>House {houseNum} Details</h4>
                <div className="house-info-row">
                  <span className="house-info-label">Sign:</span>
                  <span className="house-info-value">{signName}</span>
                </div>
                <div className="house-info-row">
                  <span className="house-info-label">Planets:</span>
                  <span className="house-info-value">
                    {(houseData.planets || []).filter(p => p !== 'Lagna').join(', ') || 'None'}
                  </span>
                </div>
                <div className="house-info-row">
                  <span className="house-info-label">Division Chart:</span>
                  <span className="house-info-value">{vargaLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
