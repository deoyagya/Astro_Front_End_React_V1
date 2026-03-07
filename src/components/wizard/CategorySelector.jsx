/**
 * CategorySelector — Step 0: Choose 1 of 6 consultation categories.
 * Fetches categories from GET /v1/wizard/categories, with hardcoded fallback.
 */
import { useState, useEffect } from 'react';
import { api } from '../../api/client';

const FALLBACK_CATEGORIES = [
  { id: 'A', label: 'Chart Reading',      icon: 'fa-star',        description: 'Single chart analysis for career, health, education and 13 more life areas.', step_count: 10, color: '#7b5bff' },
  { id: 'B', label: 'Compatibility Match', icon: 'fa-heart',       description: 'Dual chart matching for marriage, partnership and relationship compatibility.', step_count: 15, color: '#ff6b81' },
  { id: 'C', label: 'Family Harmony',     icon: 'fa-users',       description: 'Multi-chart analysis for family dynamics, shared karma and group compatibility.', step_count: 12, color: '#ffa502' },
  { id: 'D', label: 'Auspicious Timing',  icon: 'fa-clock',       description: 'Find the best date and time for weddings, business launches, travel and more.', step_count: 5, color: '#2ed573' },
  { id: 'E', label: 'Quick Answer',       icon: 'fa-bolt',        description: 'Prashna (horary) reading — instant answer to a pressing question. No birth data needed.', step_count: 3, color: '#70a1ff' },
  { id: 'F', label: 'Annual Forecast',    icon: 'fa-calendar-alt', description: 'Varshaphal / Solar Return analysis for the year ahead.', step_count: 11, color: '#eccc68' },
];

export default function CategorySelector({ onSelect, selectedCategory }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    api.get('/v1/wizard/categories')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch(() => { /* use fallback */ });
  }, []);

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        <h2>What type of reading do you need?</h2>
        <p>Choose a consultation category to begin your guided chart entry.</p>
      </div>
      <div className="wiz-categories">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`wiz-cat-card${selectedCategory === cat.id ? ' selected' : ''}`}
            onClick={() => onSelect(cat.id)}
          >
            <span className="wiz-cat-icon" style={{ color: cat.color || '#7b5bff' }}>
              <i className={`fas ${cat.icon}`}></i>
            </span>
            <div className="wiz-cat-label">{cat.label}</div>
            <div className="wiz-cat-desc">{cat.description}</div>
            <div className="wiz-cat-steps">{cat.step_count} steps</div>
          </div>
        ))}
      </div>
    </div>
  );
}
