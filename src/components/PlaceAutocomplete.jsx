import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;
const MAX_RESULTS = 8;

/**
 * PlaceAutocomplete — Debounced typeahead for birth place input.
 *
 * Backend API: GET /v1/location/search?query=<text>
 * Response:    [{ display_name, lat, lon, osm_value }, ...]
 *
 * Props:
 *   id          — input element ID
 *   placeholder — input placeholder text
 *   value       — externally controlled display value (optional)
 *   onSelect    — callback: ({ name, lat, lon, timezone }) => void
 */
export default function PlaceAutocomplete({ id, placeholder, onSelect, value = '' }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside → close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const handleSearch = useCallback((text) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < MIN_CHARS) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get(`/v1/location/search?query=${encodeURIComponent(text)}`);
        const items = (Array.isArray(data) ? data : []).slice(0, MAX_RESULTS);
        setResults(items);
        setIsOpen(items.length > 0);
        setActiveIndex(-1);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    handleSearch(text);
  };

  const handleSelect = (item) => {
    // Backend returns: { display_name, lat, lon, osm_value }
    const displayName = item.display_name || '';
    setQuery(displayName);
    setIsOpen(false);
    setResults([]);
    if (onSelect) {
      onSelect({
        name: displayName,
        lat: item.lat,
        lon: item.lon,
        timezone: null, // resolved by backend from lat/lon via resolve_location
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="place-autocomplete" ref={containerRef}>
      <div className="place-input-wrapper">
        <input
          type="text"
          id={id}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || 'Enter birth city'}
          autoComplete="off"
        />
        {loading && <i className="fas fa-spinner fa-spin place-loading"></i>}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="place-dropdown">
          {results.map((item, idx) => (
            <li
              key={idx}
              className={`place-item${idx === activeIndex ? ' active' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <i className="fas fa-map-marker-alt"></i>
              <span>{item.display_name || 'Unknown'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
