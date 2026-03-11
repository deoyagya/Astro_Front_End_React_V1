export default function RadioGroup({ question, value, onChange, disabled }) {
  const options = question.options || [];
  return (
    <div className="sb-radio-group">
      {options.map((opt, i) => (
        <label key={i} className={`sb-radio-item ${value === opt ? 'sb-radio-selected' : ''}`}>
          <input
            type="radio"
            name={question.id}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            disabled={disabled}
          />
          <span className="sb-radio-circle" />
          <span className="sb-radio-label">{opt}</span>
        </label>
      ))}
    </div>
  );
}
