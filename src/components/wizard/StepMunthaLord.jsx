/**
 * StepMunthaLord — Category F: Muntha sign + year lord selection.
 */
import { SIGN_NAMES } from '../../utils/jyotish';
import ChartVisualAid from './ChartVisualAid';

const SIGN_LIST = Object.entries(SIGN_NAMES).map(([num, name]) => ({ num: Number(num), name }));
const YEAR_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export default function StepMunthaLord({ data, onChange, content }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>Muntha &amp; Year Lord</h2>
        <p>Select the Muntha position and the year lord for this Varshaphal analysis.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-field">
        <label className="wiz-label">Muntha Sign</label>
        <div className="wiz-sign-grid">
          {SIGN_LIST.map((sign) => (
            <button
              key={sign.num}
              type="button"
              className={`wiz-sign-btn${data.muntha_sign === sign.name ? ' selected' : ''}`}
              onClick={() => handleChange('muntha_sign', sign.name)}
            >
              {sign.name}
            </button>
          ))}
        </div>
      </div>

      <div className="wiz-row" style={{ marginTop: '1rem' }}>
        <div className="wiz-field">
          <label className="wiz-label">Muntha House</label>
          <select
            className="wiz-select"
            value={data.muntha_house || ''}
            onChange={(e) => handleChange('muntha_house', e.target.value)}
          >
            <option value="">Select house...</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>House {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="wiz-field">
          <label className="wiz-label">Year Lord</label>
          <select
            className="wiz-select"
            value={data.year_lord || ''}
            onChange={(e) => handleChange('year_lord', e.target.value)}
          >
            <option value="">Select year lord...</option>
            {YEAR_LORDS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
