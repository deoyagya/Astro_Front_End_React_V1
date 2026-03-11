/**
 * StyleControls — Reusable input controls for the Style Manager editor.
 *
 * ColorControl  — colour picker + hex text input
 * TextControl   — plain text input (fontSize, borderRadius, padding)
 * SelectControl — dropdown (fontWeight)
 *
 * @module lib/style-manager/StyleControls
 */

export function ColorControl({ value, onChange, label }) {
  const hexVal = value || '#000000';
  const safeHex = hexVal.startsWith('#') && hexVal.length <= 7 ? hexVal : '#000000';
  return (
    <div className="sm-control">
      <label className="sm-control-label">{label}</label>
      <div className="sm-color-row">
        <input
          type="color"
          value={safeHex}
          onChange={(e) => onChange(e.target.value)}
          className="sm-color-picker"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="sm-text-input sm-color-text"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function TextControl({ value, onChange, label, placeholder }) {
  return (
    <div className="sm-control">
      <label className="sm-control-label">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="sm-text-input"
        placeholder={placeholder}
      />
    </div>
  );
}

export function SelectControl({ value, onChange, label, options }) {
  return (
    <div className="sm-control">
      <label className="sm-control-label">{label}</label>
      <select
        value={value || 400}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sm-select-input"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
