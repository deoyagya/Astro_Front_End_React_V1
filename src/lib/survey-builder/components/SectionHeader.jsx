export default function SectionHeader({ question }) {
  return (
    <div className="sb-section-header">
      <h3>{question.label}</h3>
      {question.description && <p>{question.description}</p>}
    </div>
  );
}
