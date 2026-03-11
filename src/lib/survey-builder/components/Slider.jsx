export default function Slider({ question, value, onChange, disabled }) {
  const { min = 0, max = 100, step = 1 } = question.validation || {};
  const current = value != null ? Number(value) : min;

  return (
    <div className="sb-slider-wrap">
      <input
        type="range"
        className="sb-slider"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
      <div className="sb-slider-labels">
        <span>{min}</span>
        <span className="sb-slider-value">{current}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
