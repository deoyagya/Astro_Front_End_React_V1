/**
 * StepDivisionalChart — Dynamic varga chart entry (D9 Navamsa, D10 Dasamsa, etc).
 * Shows planet-in-sign selectors for the relevant divisional chart.
 */
import { SIGN_NAMES } from '../../utils/jyotish';
import ChartVisualAid from './ChartVisualAid';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SIGNS = Object.values(SIGN_NAMES);

export default function StepDivisionalChart({ data, onChange, content, personLabel, chartType = 'D9' }) {
  const placements = data.planet_placements || {};

  const handlePlanetSign = (planet, sign) => {
    onChange({
      ...data,
      chart_type: chartType,
      planet_placements: { ...placements, [planet]: sign },
    });
  };

  const chartLabel = chartType === 'D9' ? 'Navamsa (D9)' : chartType === 'D10' ? 'Dasamsa (D10)' : chartType;

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>{chartLabel} Chart</h2>
        <p>For each planet, select the sign it occupies in the {chartLabel} divisional chart.</p>
      </div>
      <ChartVisualAid content={content} />

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
  );
}
