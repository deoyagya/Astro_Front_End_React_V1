export default function TextArea({ question, value, onChange, disabled }) {
  return (
    <textarea
      className="sb-textarea"
      placeholder={question.placeholder || ''}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={4}
    />
  );
}
