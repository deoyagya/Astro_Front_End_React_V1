export default function Dropdown({ question, value, onChange, disabled }) {
  const options = question.options || [];
  return (
    <select
      className="sb-select"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <option value="">-- Select --</option>
      {options.map((opt, i) => (
        <option key={i} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
