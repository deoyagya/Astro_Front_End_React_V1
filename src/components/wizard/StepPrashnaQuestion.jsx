/**
 * StepPrashnaQuestion — Category E: Question + domain + current location.
 * No birth data needed — chart computed at query moment.
 */
import PlaceAutocomplete from '../PlaceAutocomplete';
import ChartVisualAid from './ChartVisualAid';

const DOMAINS = [
  { value: 'career', label: 'Career & Work' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'relationship', label: 'Relationships' },
  { value: 'finance', label: 'Finance & Wealth' },
  { value: 'education', label: 'Education & Learning' },
  { value: 'travel', label: 'Travel' },
  { value: 'legal', label: 'Legal Matters' },
  { value: 'spiritual', label: 'Spiritual Growth' },
  { value: 'general', label: 'General / Other' },
];

export default function StepPrashnaQuestion({ data, onChange, content }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handlePlaceSelect = (place) => {
    onChange({
      ...data,
      place: place.label || place.name || '',
      lat: place.lat,
      lon: place.lon,
      tz_id: place.tz_id || place.timezone || '',
    });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>Your Question</h2>
        <p>Ask a clear, specific yes/no or outcome question. The chart will be cast for this moment.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-field">
        <label className="wiz-label">Domain <span className="required">*</span></label>
        <select
          className="wiz-select"
          value={data.domain || ''}
          onChange={(e) => handleChange('domain', e.target.value)}
        >
          <option value="">Select domain...</option>
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className="wiz-field">
        <label className="wiz-label">Your Question <span className="required">*</span></label>
        <textarea
          className="wiz-textarea"
          placeholder="e.g., Will I get the job I interviewed for yesterday?"
          value={data.query_text || ''}
          onChange={(e) => handleChange('query_text', e.target.value)}
          rows={3}
        />
      </div>

      <div className="wiz-field">
        <label className="wiz-label">Your Current Location <span className="required">*</span></label>
        <PlaceAutocomplete
          value={data.place || ''}
          onSelect={handlePlaceSelect}
          onChange={(val) => handleChange('place', val)}
          placeholder="Where are you right now?"
        />
        <div className="wiz-hint">The Prashna chart is cast for your current location and time.</div>
      </div>
    </div>
  );
}
