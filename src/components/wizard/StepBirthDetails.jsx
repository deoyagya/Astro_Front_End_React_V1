/**
 * StepBirthDetails — Name, DOB, TOB, Place of birth.
 * Reused across all person-based categories (A, B, C, D optional, F).
 */
import PlaceAutocomplete from '../PlaceAutocomplete';
import ChartVisualAid from './ChartVisualAid';

export default function StepBirthDetails({ data, onChange, content, personLabel }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handlePlaceSelect = (place) => {
    onChange({
      ...data,
      pob: place.label || place.name || '',
      lat: place.lat,
      lon: place.lon,
      tz_id: place.tz_id || place.timezone || '',
    });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>Birth Details</h2>
        <p>Enter the birth information as accurately as possible.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-field">
        <label className="wiz-label">Full Name <span className="required">*</span></label>
        <input
          type="text"
          className="wiz-input"
          placeholder="Enter name"
          value={data.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="wiz-row">
        <div className="wiz-field">
          <label className="wiz-label">Date of Birth <span className="required">*</span></label>
          <input
            type="date"
            className="wiz-input"
            value={data.dob || ''}
            onChange={(e) => handleChange('dob', e.target.value)}
          />
        </div>
        <div className="wiz-field">
          <label className="wiz-label">Time of Birth <span className="required">*</span></label>
          <input
            type="time"
            className="wiz-input"
            value={data.tob || ''}
            onChange={(e) => handleChange('tob', e.target.value)}
          />
        </div>
      </div>

      <div className="wiz-field">
        <label className="wiz-label">Place of Birth <span className="required">*</span></label>
        <PlaceAutocomplete
          value={data.pob || ''}
          onSelect={handlePlaceSelect}
          onChange={(val) => handleChange('pob', val)}
          placeholder="Start typing a city name..."
        />
        <div className="wiz-hint">Select from the dropdown for accurate coordinates.</div>
      </div>
    </div>
  );
}
