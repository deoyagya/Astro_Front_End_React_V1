import { useState } from 'react';

export default function StarRating({ question, value, onChange, disabled }) {
  const maxStars = question.validation?.max || 5;
  const [hover, setHover] = useState(0);
  const current = Number(value) || 0;

  return (
    <div className="sb-star-rating">
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          className={`sb-star ${star <= (hover || current) ? 'sb-star-filled' : ''}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          disabled={disabled}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <i className={`fa${star <= (hover || current) ? 's' : 'r'} fa-star`} />
        </button>
      ))}
      {current > 0 && <span className="sb-star-label">{current}/{maxStars}</span>}
    </div>
  );
}
