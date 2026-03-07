/**
 * StepDasha — Current Mahadasha / Antardasha planet selectors.
 */
import ChartVisualAid from './ChartVisualAid';

const DASHA_PLANETS = ['Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus'];

export default function StepDasha({ data, onChange, content, personLabel }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>Current Dasha Period</h2>
        <p>Select the current Vimshottari Mahadasha and Antardasha planets.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-row">
        <div className="wiz-field">
          <label className="wiz-label">Mahadasha (MD) <span className="required">*</span></label>
          <select
            className="wiz-select"
            value={data.current_md || ''}
            onChange={(e) => handleChange('current_md', e.target.value)}
          >
            <option value="">Select MD planet...</option>
            {DASHA_PLANETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="wiz-field">
          <label className="wiz-label">Antardasha (AD)</label>
          <select
            className="wiz-select"
            value={data.current_ad || ''}
            onChange={(e) => handleChange('current_ad', e.target.value)}
          >
            <option value="">Select AD planet...</option>
            {DASHA_PLANETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="wiz-row">
        <div className="wiz-field">
          <label className="wiz-label">MD Start Date</label>
          <input
            type="date"
            className="wiz-input"
            value={data.md_start || ''}
            onChange={(e) => handleChange('md_start', e.target.value)}
          />
        </div>
        <div className="wiz-field">
          <label className="wiz-label">MD End Date</label>
          <input
            type="date"
            className="wiz-input"
            value={data.md_end || ''}
            onChange={(e) => handleChange('md_end', e.target.value)}
          />
        </div>
      </div>

      <div className="wiz-hint">
        Tip: Check your printed Kundli for the Dasha table or "Vimshottari" section.
      </div>
    </div>
  );
}
