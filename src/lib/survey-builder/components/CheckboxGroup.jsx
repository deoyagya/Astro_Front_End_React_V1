export default function CheckboxGroup({ question, value, onChange, disabled }) {
  const options = question.options || [];
  const selected = Array.isArray(value) ? value : [];

  function toggle(opt) {
    if (selected.includes(opt)) {
      onChange(selected.filter((v) => v !== opt));
    } else {
      onChange([...selected, opt]);
    }
  }

  return (
    <div className="sb-checkbox-group">
      {options.map((opt, i) => (
        <label key={i} className={`sb-checkbox-item ${selected.includes(opt) ? 'sb-checkbox-selected' : ''}`}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => toggle(opt)}
            disabled={disabled}
          />
          <span className="sb-checkbox-box" />
          <span className="sb-checkbox-label">{opt}</span>
        </label>
      ))}
    </div>
  );
}
