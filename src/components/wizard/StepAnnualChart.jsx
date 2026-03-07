/**
 * StepAnnualChart — Category F: Year picker + annual chart ascendant/planet placements.
 */
import { SIGN_NAMES } from '../../utils/jyotish';
import ChartVisualAid from './ChartVisualAid';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SIGNS = Object.values(SIGN_NAMES);
const SIGN_LIST = Object.entries(SIGN_NAMES).map(([num, name]) => ({ num: Number(num), name }));

export default function StepAnnualChart({ data, onChange, content }) {
  const placements = data.planet_placements || {};

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handlePlanetSign = (planet, sign) => {
    onChange({
      ...data,
      planet_placements: { ...placements, [planet]: sign },
    });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>Annual Chart (Varshaphal)</h2>
        <p>Enter the annual (solar return) chart data for the selected year.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-field">
        <label className="wiz-label">Varsha Ascendant (Annual Rising Sign) <span className="required">*</span></label>
        <div className="wiz-sign-grid">
          {SIGN_LIST.map((sign) => (
            <button
              key={sign.num}
              type="button"
              className={`wiz-sign-btn${data.asc_sign === sign.name ? ' selected' : ''}`}
              onClick={() => handleChange('asc_sign', sign.name)}
            >
              {sign.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <label className="wiz-label">Planet Placements in Annual Chart</label>
        <div className="wiz-planet-grid">
          {PLANETS.map((planet) => (
            <React.Fragment key={planet}>
              <div className="wiz-planet-name">{planet}</div>
              <select
                className="wiz-select wiz-planet-house-select"
                style={{ width: '140px' }}
                value={placements[planet] || ''}
                onChange={(e) => handlePlanetSign(planet, e.target.value)}
              >
                <option value="">Sign...</option>
                {SIGNS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
