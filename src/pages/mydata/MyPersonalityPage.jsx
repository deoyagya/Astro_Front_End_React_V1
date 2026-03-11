/**
 * MyPersonalityPage — Personality profile cards (6 subdomains).
 *
 * API: POST /v1/personality/profile?interpretation_mode=static
 * Shows: 6 personality subdomain cards in a 2-col grid
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { useStyles } from '../../context/StyleContext';
import { api } from '../../api/client';

const SUBDOMAIN_MAP = {
  301: { label: 'Social', icon: 'fa-users' },
  302: { label: 'Communication', icon: 'fa-comments' },
  303: { label: 'Behavioral', icon: 'fa-brain' },
  304: { label: 'Anger', icon: 'fa-fire-alt' },
  305: { label: 'Health', icon: 'fa-heartbeat' },
  306: { label: 'Financial', icon: 'fa-coins' },
};

function sentimentClass(sentiment) {
  if (!sentiment) return 'neutral';
  const s = sentiment.toLowerCase();
  if (s === 'favorable' || s === 'positive') return 'favorable';
  if (s === 'mixed' || s === 'moderate') return 'mixed';
  if (s === 'unfavorable' || s === 'negative') return 'unfavorable';
  return 'neutral';
}

export default function MyPersonalityPage() {
  const { birthPayload, refreshKey, hasBirthData } = useMyData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    api.post('/v1/personality/profile?interpretation_mode=static', birthPayload)
      .then((res) => {
        if (!cancelled) {
          setData(res.predictions || res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load personality profile');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-theater-masks"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your personality profile will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading personality profile...</p>
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

  const subdomainIds = [301, 302, 303, 304, 305, 306];

  return (
    <div className="personality-grid">
      {subdomainIds.map((id) => {
        const prediction = data[id] || data[String(id)];
        if (!prediction) return null;

        const meta = SUBDOMAIN_MAP[id] || { label: prediction.subdomain_label || `Subdomain ${id}`, icon: 'fa-star' };
        const title = prediction.subdomain_label || meta.label;
        const badge = sentimentClass(prediction.sentiment);

        return (
          <div key={id} className="personality-card">
            <div className="personality-card-header">
              <i className={`fas ${meta.icon}`}></i>
              <h4>{title}</h4>
              <span className={`personality-card-score ${badge}`}>
                {prediction.sentiment || 'Neutral'}
              </span>
            </div>
            <div className="personality-card-body">
              {prediction.headline && <h5>{prediction.headline}</h5>}
              <p>{prediction.interpretation || 'No interpretation available.'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
