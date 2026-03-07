/**
 * StepTransits — Current transit positions of slow-moving planets.
 */
import { SIGN_NAMES } from '../../utils/jyotish';
import ChartVisualAid from './ChartVisualAid';

const SIGNS = Object.values(SIGN_NAMES);
const TRANSIT_PLANETS = [
  { key: 'transit_saturn', label: 'Saturn' },
  { key: 'transit_jupiter', label: 'Jupiter' },
  { key: 'transit_rahu', label: 'Rahu' },
  { key: 'transit_ketu', label: 'Ketu' },
];

export default function StepTransits({ data, onChange, content }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>Current Transits</h2>
        <p>Select the current sign of each slow-moving planet. These affect timing predictions.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-planet-grid">
        {TRANSIT_PLANETS.map(({ key, label }) => (
          <React.Fragment key={key}>
            <div className="wiz-planet-name">{label}</div>
            <select
              className="wiz-select wiz-planet-house-select"
              style={{ width: '140px' }}
              value={data[key] || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            >
              <option value="">Sign...</option>
              {SIGNS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </React.Fragment>
        ))}
      </div>
      <div className="wiz-hint" style={{ marginTop: '0.75rem' }}>
        Leave blank to use today's ephemeris data (if available from your birth chart).
      </div>
    </div>
  );
}
