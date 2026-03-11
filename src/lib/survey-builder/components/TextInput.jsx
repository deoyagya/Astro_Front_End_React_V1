export default function TextInput({ question, value, onChange, disabled }) {
  return (
    <input
      type="text"
      className="sb-input"
      placeholder={question.placeholder || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}
