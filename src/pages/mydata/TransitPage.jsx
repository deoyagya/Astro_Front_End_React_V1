/**
 * TransitPage — Current transit positions + transit-to-natal hits.
 *
 * APIs: POST /v1/transit/table  +  POST /v1/transit/hits  (parallel)
 * Shows: 2-col grid — left = transit planet positions, right = transit hits
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { api } from '../../api/client';

export default function TransitPage() {
  const { birthPayload, refreshKey, hasBirthData } = useMyData();
  const [transitPlanets, setTransitPlanets] = useState(null);
  const [transitHits, setTransitHits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      api.post('/v1/transit/table', birthPayload),
      api.post('/v1/transit/hits', birthPayload),
    ])
      .then(([tableRes, hitsRes]) => {
        if (!cancelled) {
          setTransitPlanets(tableRes.transit_planets || tableRes);
          setTransitHits(hitsRes.transit_hits || hitsRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load transit data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-globe"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your transit analysis will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading transit data...</p>
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

  if (!transitPlanets && !transitHits) return null;

  // Collect all hits from the various hit arrays
  const allHits = [];
  if (transitHits && typeof transitHits === 'object') {
    Object.entries(transitHits).forEach(([hitType, hits]) => {
      if (Array.isArray(hits)) {
        hits.forEach((hit) => {
          allHits.push({ ...hit, _hitType: hitType });
        });
      }
    });
  }

  function degStr(deg) {
    if (deg == null) return '---';
    return `${Number(deg).toFixed(2)}\u00B0`;
  }

  function formatHitType(key) {
    return key
      .replace(/_hits$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="transit-grid">
      {/* Left column: Transit Positions */}
      <div className="mydata-table">
        <div className="mydata-table-header">
          <i className="fas fa-globe"></i>
          <h3>Transit Positions</h3>
        </div>
        {transitPlanets && typeof transitPlanets === 'object' ? (
          Object.entries(transitPlanets).map(([planet, info]) => {
            if (!info || typeof info !== 'object') return null;
            return (
              <div key={planet} className="mydata-row">
                <span className="mydata-row-label">{planet}</span>
                <span className="mydata-row-value">
                  {info.sign_name || '---'} {degStr(info.longitude)} — {info.nakshatra || '---'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="mydata-row">
            <span className="mydata-row-label">No transit data</span>
            <span className="mydata-row-value">---</span>
          </div>
        )}
      </div>

      {/* Right column: Transit Hits */}
      <div className="mydata-table">
        <div className="mydata-table-header">
          <i className="fas fa-crosshairs"></i>
          <h3>Transit Hits</h3>
        </div>
        {allHits.length === 0 ? (
          <div className="mydata-row">
            <span className="mydata-row-label">No active transit hits</span>
            <span className="mydata-row-value">---</span>
          </div>
        ) : (
          allHits.map((hit, idx) => (
            <div key={idx} className="mydata-row">
              <span className="mydata-row-label">
                {hit.transit_planet || '---'} {formatHitType(hit._hitType)} {hit.natal_planet || '---'}
              </span>
              <span className="mydata-row-value">
                {hit.aspect_type || hit._hitType.replace(/_hits$/, '')}
                {hit.orb != null && ` (orb: ${Number(hit.orb).toFixed(2)}\u00B0)`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
