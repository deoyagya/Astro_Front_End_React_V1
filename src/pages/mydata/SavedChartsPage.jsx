/**
 * SavedChartsPage — List of user's saved charts with "Load" action.
 *
 * API: GET /v1/charts/saved?limit=20
 * Independent of birthPayload — fetches on mount.
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { api } from '../../api/client';

export default function SavedChartsPage() {
  const { loadBirthData } = useMyData();
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.get('/v1/charts/saved?limit=20')
      .then((res) => {
        if (!cancelled) {
          setCharts(res.charts || res || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load saved charts');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading saved charts...</p>
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

  if (!charts.length) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-archive"></i>
        <p>No saved charts found</p>
        <p className="hint">Charts you generate will appear here</p>
      </div>
    );
  }

  function handleLoad(chart) {
    const bd = chart.birth_data || {};
    const payload = {
      name: bd.name || '',
      dob: bd.dob || '',
      tob: bd.tob || '',
      place_of_birth: bd.place_of_birth || '',
      lat: bd.lat,
      lon: bd.lon,
      tz_id: bd.tz_id || bd.timezone || '',
      gender: bd.gender || '',
    };
    loadBirthData(payload);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="mydata-table">
      <div className="mydata-table-header">
        <i className="fas fa-archive"></i>
        <h3>Saved Charts</h3>
      </div>
      {charts.map((chart) => {
        const bd = chart.birth_data || {};
        return (
          <div key={chart.id} className="saved-chart-item">
            <div className="saved-chart-info">
              <h4>{bd.name || 'Unnamed Chart'}</h4>
              <p>DOB: {bd.dob || '---'} &middot; {bd.place_of_birth || '---'}</p>
              <p className="hint">Created: {formatDate(chart.created_at)}</p>
            </div>
            <div className="saved-chart-actions">
              <button
                className="btn-load-chart"
                onClick={() => handleLoad(chart)}
              >
                <i className="fas fa-upload"></i> Load
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
