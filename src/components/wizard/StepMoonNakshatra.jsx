/**
 * StepMoonNakshatra — 27-nakshatra dropdown + 4-pada selector.
 */
import ChartVisualAid from './ChartVisualAid';

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Moola',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const PADAS = [1, 2, 3, 4];

export default function StepMoonNakshatra({ data, onChange, content, personLabel }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>Moon Nakshatra</h2>
        <p>Select the nakshatra (birth star) where the Moon is placed, and its pada (quarter).</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-nakshatra-row">
        <div className="wiz-field">
          <label className="wiz-label">Nakshatra <span className="required">*</span></label>
          <select
            className="wiz-select"
            value={data.moon_nakshatra || ''}
            onChange={(e) => handleChange('moon_nakshatra', e.target.value)}
          >
            <option value="">Select nakshatra...</option>
            {NAKSHATRAS.map((n, i) => (
              <option key={n} value={n}>{i + 1}. {n}</option>
            ))}
          </select>
        </div>
        <div className="wiz-field">
          <label className="wiz-label">Pada</label>
          <select
            className="wiz-select"
            value={data.moon_nakshatra_pada || ''}
            onChange={(e) => handleChange('moon_nakshatra_pada', Number(e.target.value))}
          >
            <option value="">Pada...</option>
            {PADAS.map((p) => (
              <option key={p} value={p}>Pada {p}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
