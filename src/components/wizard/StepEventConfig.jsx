/**
 * StepEventConfig — Category D: Event type, date range, location.
 */
import { useState, useEffect } from 'react';
import PlaceAutocomplete from '../PlaceAutocomplete';
import ChartVisualAid from './ChartVisualAid';
import { api } from '../../api/client';

const FALLBACK_EVENTS = [
  { value: 'marriage',          label: 'Marriage' },
  { value: 'business_launch',   label: 'Business Launch' },
  { value: 'travel',            label: 'Travel' },
  { value: 'griha_pravesh',     label: 'Griha Pravesh' },
  { value: 'upanayana',         label: 'Upanayana' },
  { value: 'surgery',           label: 'Surgery' },
  { value: 'vehicle_purchase',  label: 'Vehicle Purchase' },
  { value: 'property_purchase', label: 'Property Purchase' },
];

export default function StepEventConfig({ data, onChange, content }) {
  const [events, setEvents] = useState(FALLBACK_EVENTS);

  useEffect(() => {
    api.get('/v1/muhurta/events')
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setEvents(res.map((e) => ({ value: e.event_type || e.value, label: e.label || e.event_type })));
        }
      })
      .catch(() => {});
  }, []);

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
        <h2>Event Details</h2>
        <p>Describe the event you want to find an auspicious date for.</p>
      </div>
      <ChartVisualAid content={content} />

      <div className="wiz-field">
        <label className="wiz-label">Event Type <span className="required">*</span></label>
        <select
          className="wiz-select"
          value={data.event_type || ''}
          onChange={(e) => handleChange('event_type', e.target.value)}
        >
          <option value="">Select event type...</option>
          {events.map((ev) => (
            <option key={ev.value} value={ev.value}>{ev.label}</option>
          ))}
        </select>
      </div>

      <div className="wiz-field">
        <label className="wiz-label">Event Description</label>
        <textarea
          className="wiz-textarea"
          placeholder="Describe the event (optional)..."
          value={data.event_description || ''}
          onChange={(e) => handleChange('event_description', e.target.value)}
          rows={2}
        />
      </div>

      <div className="wiz-field">
        <label className="wiz-label">Event Location <span className="required">*</span></label>
        <PlaceAutocomplete
          value={data.place || ''}
          onSelect={handlePlaceSelect}
          onChange={(val) => handleChange('place', val)}
          placeholder="Where will the event take place?"
        />
      </div>

      <div className="wiz-row">
        <div className="wiz-field">
          <label className="wiz-label">Start Date <span className="required">*</span></label>
          <input
            type="date"
            className="wiz-input"
            value={data.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
          />
        </div>
        <div className="wiz-field">
          <label className="wiz-label">End Date <span className="required">*</span></label>
          <input
            type="date"
            className="wiz-input"
            value={data.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
