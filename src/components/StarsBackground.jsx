import { useState } from 'react';

function createStars(total = 150) {
  return Array.from({ length: total }, (_, index) => {
    const size = Math.random() * 3;
    return {
      id: `star-${index}`,
      style: {
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: `${Math.random() * 0.3 + 0.1}`,
      },
    };
  });
}

export default function StarsBackground() {
  const [stars] = useState(() => createStars());

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((star) => (
        <div key={star.id} className="star" style={star.style} />
      ))}
    </div>
  );
}
