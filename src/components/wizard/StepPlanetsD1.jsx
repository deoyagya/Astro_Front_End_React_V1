/**
 * StepPlanetsD1 — Interactive planet placement in houses (1-12).
 * Each planet gets a house number selector.
 */
import ChartVisualAid from './ChartVisualAid';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const HOUSES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function StepPlanetsD1({ data, onChange, content, personLabel }) {
  const placements = data.planet_placements || {};

  const handlePlanetHouse = (planet, house) => {
    onChange({
      ...data,
      planet_placements: { ...placements, [planet]: house },
    });
  };

  const placedCount = Object.values(placements).filter(Boolean).length;

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>Planet Placements (D1 — Rashi Chart)</h2>
        <p>For each planet, select the house number (1–12) where it appears in the birth chart.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-planet-grid">
        {PLANETS.map((planet) => (
          <React.Fragment key={planet}>
            <div className="wiz-planet-name">{planet}</div>
            <select
              className="wiz-select wiz-planet-house-select"
              value={placements[planet] || ''}
              onChange={(e) => handlePlanetHouse(planet, e.target.value)}
            >
              <option value="">House...</option>
              {HOUSES.map((h) => (
                <option key={h} value={String(h)}>House {h}</option>
              ))}
            </select>
          </React.Fragment>
        ))}
      </div>
      <div className="wiz-hint" style={{ marginTop: '0.75rem' }}>
        {placedCount} of {PLANETS.length} planets placed
      </div>
    </div>
  );
}
