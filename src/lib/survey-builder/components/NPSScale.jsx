export default function NPSScale({ question, value, onChange, disabled }) {
  const min = question.validation?.min ?? 0;
  const max = question.validation?.max ?? 10;
  const current = value != null ? Number(value) : null;

  return (
    <div className="sb-nps">
      <div className="sb-nps-scale">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <button
            key={n}
            type="button"
            className={`sb-nps-btn ${current === n ? 'sb-nps-active' : ''} ${
              n <= 6 ? 'sb-nps-detractor' : n <= 8 ? 'sb-nps-passive' : 'sb-nps-promoter'
            }`}
            onClick={() => !disabled && onChange(n)}
            disabled={disabled}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="sb-nps-labels">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
}
