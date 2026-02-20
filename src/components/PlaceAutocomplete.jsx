import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;
const MAX_RESULTS = 8;

/**
 * PlaceAutocomplete — Debounced typeahead for birth place input.
 *
 * Props:
 *   id          — input element ID
 *   placeholder — input placeholder text
 *   onSelect    — callback: ({ name, lat, lon, timezone }) => void
 *   value       — controlled value (optional)
 *
 * Uses: GET /v1/location/search?query=<text> (Photon geocoding via backend)
 */
export default function PlaceAutocomplete({ id, placeholder, onSelect, value: controlledValue }) {
  const [query, setQuery] = useState(controlledValue || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) setQuery(controlledValue);
  }, [controlledValue]);

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
  const handleSearch = useCallback(
    (text) => {
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
    },
    []
  );

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    handleSearch(text);
  };

  const handleSelect = (item) => {
    const displayName = formatPlace(item);
    setQuery(displayName);
    setIsOpen(false);
    setResults([]);
    if (onSelect) {
      onSelect({
        name: displayName,
        lat: item.lat || item.geometry?.coordinates?.[1],
        lon: item.lon || item.geometry?.coordinates?.[0],
        timezone: item.tz_offset || item.timezone || null,
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

  const formatPlace = (item) => {
    // Backend returns { name, state, country } or { properties: { name, state, country } }
    const props = item.properties || item;
    const parts = [props.name, props.state, props.country].filter(Boolean);
    return parts.join(', ');
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
              className={`place-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <i className="fas fa-map-marker-alt"></i>
              <span>{formatPlace(item)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
