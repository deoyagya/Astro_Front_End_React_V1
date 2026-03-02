/**
 * SadeSatiPage — Sade Sati & Dhaiya period analysis.
 *
 * API: POST /v1/chart/create?include_sade_sati=true
 * Shows: Current status badge, Sade Sati periods table, Dhaiya periods table
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { api } from '../../api/client';

export default function SadeSatiPage() {
  const { birthPayload, refreshKey, hasBirthData } = useMyData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    api.post('/v1/chart/create?include_sade_sati=true', birthPayload)
      .then((res) => {
        if (!cancelled) {
          const bundle = res.bundle || res;
          setData(bundle.sade_sati || bundle);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load Sade Sati data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-moon"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your Sade Sati analysis will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading Sade Sati data...</p>
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

  const isActive = data.current_status &&
    (data.current_status.toLowerCase().includes('active') ||
     data.current_status.toLowerCase().includes('running') ||
     data.current_status.toLowerCase().includes('yes'));

  const sadeSatiPeriods = data.sade_sati_periods || [];
  const dhaiyaPeriods = data.dhaiya_periods || [];

  return (
    <div>
      {/* Status Banner */}
      <div className={`sade-sati-status ${isActive ? 'active' : 'inactive'}`}>
        <i className={`fas ${isActive ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
        <span>{data.current_status || (isActive ? 'Sade Sati Active' : 'Sade Sati Not Active')}</span>
        {data.moon_sign && <span className="hint"> (Moon Sign: {data.moon_sign})</span>}
      </div>

      {/* Sade Sati Periods */}
      <div className="mydata-table">
        <div className="mydata-table-header">
          <i className="fas fa-moon"></i>
          <h3>Sade Sati Periods</h3>
        </div>
        {sadeSatiPeriods.length === 0 ? (
          <div className="mydata-row">
            <span className="mydata-row-label">No Sade Sati periods found</span>
            <span className="mydata-row-value">---</span>
          </div>
        ) : (
          sadeSatiPeriods.map((period, idx) => (
            <div key={idx} className="mydata-row">
              <span className="mydata-row-label">
                {period.phase || period.type || `Period ${idx + 1}`}
              </span>
              <span className="mydata-row-value">
                {period.start_date || '---'} to {period.end_date || '---'}
                {period.saturn_sign_name && ` (Saturn in ${period.saturn_sign_name})`}
                {period.duration_years && ` — ${period.duration_years} yrs`}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Dhaiya Periods */}
      <div className="mydata-table">
        <div className="mydata-table-header">
          <i className="fas fa-star-half-alt"></i>
          <h3>Dhaiya Periods</h3>
        </div>
        {dhaiyaPeriods.length === 0 ? (
          <div className="mydata-row">
            <span className="mydata-row-label">No Dhaiya periods found</span>
            <span className="mydata-row-value">---</span>
          </div>
        ) : (
          dhaiyaPeriods.map((period, idx) => (
            <div key={idx} className="mydata-row">
              <span className="mydata-row-label">
                {period.phase || period.type || `Period ${idx + 1}`}
              </span>
              <span className="mydata-row-value">
                {period.start_date || '---'} to {period.end_date || '---'}
                {period.saturn_sign_name && ` (Saturn in ${period.saturn_sign_name})`}
                {period.duration_years && ` — ${period.duration_years} yrs`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
