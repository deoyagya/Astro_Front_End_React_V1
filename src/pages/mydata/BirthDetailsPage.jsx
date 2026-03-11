/**
 * BirthDetailsPage — Natal summary: Ascendant, Moon, Sun signs + meta.
 *
 * API: POST /v1/chart/create
 * Shows: Ascendant sign/degree/nakshatra, Moon sign/nakshatra, Sun sign/nakshatra,
 *        ayanamsa, engine_version, Julian Day
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { useStyles } from '../../context/StyleContext';
import { api } from '../../api/client';

export default function BirthDetailsPage() {
  const { birthPayload, refreshKey, hasBirthData } = useMyData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    api.post('/v1/chart/create', birthPayload)
      .then((res) => {
        if (!cancelled) {
          setData(res.bundle || res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load birth details');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-baby"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your natal summary will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading birth details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="api-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const meta = data.meta || {};
  const natal = data.natal || {};
  const asc = natal.ascendant || {};
  const planets = natal.planets || {};
  const moon = planets.Moon || planets.moon || {};
  const sun = planets.Sun || planets.sun || {};

  function degStr(deg) {
    if (deg == null) return '---';
    return `${Number(deg).toFixed(2)}\u00B0`;
  }

  const rows = [
    ['Ascendant Sign', asc.sign_name || '---'],
    ['Ascendant Degree', degStr(asc.longitude || asc.degree)],
    ['Ascendant Nakshatra', asc.nakshatra || '---'],
    ['Moon Sign', moon.sign_name || '---'],
    ['Moon Nakshatra', moon.nakshatra || '---'],
    ['Moon Degree', degStr(moon.longitude || moon.degree)],
    ['Sun Sign', sun.sign_name || '---'],
    ['Sun Nakshatra', sun.nakshatra || '---'],
    ['Sun Degree', degStr(sun.longitude || sun.degree)],
    ['Ayanamsa', meta.ayanamsa
      ? `${meta.ayanamsa_system || 'Lahiri'} (${Number(meta.ayanamsa).toFixed(4)})`
      : '---'],
    ['Engine Version', meta.engine_version || '---'],
    ['Julian Day', meta.jd ? `${meta.jd}` : '---'],
  ];

  return (
    <div className="mydata-table">
      <div className="mydata-table-header">
        <i className="fas fa-baby"></i>
        <h3>Birth Details — Natal Summary</h3>
      </div>
      {rows.map(([label, value], idx) => (
        <div key={idx} className="mydata-row">
          <span className="mydata-row-label">{label}</span>
          <span className="mydata-row-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
