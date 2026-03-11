/**
 * YogasPage — Classical yoga scan results grouped by yoga_type.
 *
 * Data Source Priority:
 *   1. chartBundle.yogas (if already loaded via chart/create?include_yogas=true)
 *   2. POST /v1/yogas/scan (fallback — standalone endpoint)
 *
 * Each yoga: { yoga_name, yoga_type, forming_planets[], mechanism, strength, classical_reference, commentary }
 *
 * Groups the flat list by yoga_type and renders category cards.
 */

import { useState, useEffect } from 'react';
import { useMyData } from '../../context/MyDataContext';
import { useStyles } from '../../context/StyleContext';
import { api } from '../../api/client';

const TYPE_LABELS = {
  special: 'Special Yogas',
  raja: 'Raja Yogas',
  dhana: 'Dhana Yogas',
  viparita: 'Viparita Raja Yogas',
  neecha_bhanga: 'Neecha Bhanga Raja Yogas',
  parivartana: 'Parivartana Yogas',
  chandra: 'Chandra Yogas',
  surya: 'Surya Yogas',
  pancha_mahapurusha: 'Pancha Mahapurusha Yogas',
  gajakesari: 'Gajakesari Yoga',
  budha_aditya: 'Budha Aditya Yoga',
  nabhas: 'Nabhas Yogas',
  lunar: 'Lunar Yogas',
  solar: 'Solar Yogas',
};

function formatTypeLabel(key) {
  if (TYPE_LABELS[key]) return TYPE_LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert the API yogas object (numeric keys) into a flat array. */
function normalizeYogasList(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    return Object.values(raw);
  }
  return [];
}

/** Group flat yoga list by yoga_type. */
function groupByType(yogasList) {
  const groups = {};
  yogasList.forEach((y) => {
    const type = y.yoga_type || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(y);
  });
  return groups;
}

const STRENGTH_COLORS = {
  strong: '#16a34a',
  moderate: '#d97706',
  weak: '#9ca3af',
};

export default function YogasPage() {
  const { birthPayload, refreshKey, hasBirthData, chartBundle } = useMyData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!birthPayload) return;

    // Priority 1: Read from chart bundle if yogas are already available
    const bundleInner = chartBundle?.bundle || chartBundle;
    const bundleYogas = bundleInner?.yogas;
    if (bundleYogas && Array.isArray(bundleYogas) && bundleYogas.length > 0) {
      setData({ yogas: bundleYogas, total_yogas: bundleYogas.length });
      setLoading(false);
      setError('');
      return;
    }

    // Priority 2: Fetch via dedicated yoga scan endpoint
    let cancelled = false;
    setLoading(true);
    setError('');

    api.post('/v1/yogas/scan', birthPayload)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load yogas');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasBirthData) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-om"></i>
        <p>Enter your birth details above and click Load</p>
        <p className="hint">Your yoga analysis will appear here</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="api-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading yogas...</p>
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

  const yogasList = normalizeYogasList(data.yogas || data);

  if (!yogasList.length) {
    return (
      <div className="mydata-placeholder">
        <i className="fas fa-om"></i>
        <p>No yogas found in this chart</p>
      </div>
    );
  }

  const grouped = groupByType(yogasList);
  const typeKeys = Object.keys(grouped);

  return (
    <div>
      {/* Summary badge */}
      <div className="yoga-summary-badge">
        <i className="fas fa-om"></i>
        <span>{data.total_yogas || yogasList.length} Yoga{yogasList.length !== 1 ? 's' : ''} Found</span>
      </div>

      {typeKeys.map((typeKey) => {
        const yogas = grouped[typeKey];

        return (
          <div key={typeKey} className="yoga-category">
            <div className="yoga-category-header">
              <h4>{formatTypeLabel(typeKey)}</h4>
              <span className="yoga-count-badge">
                {yogas.length} found
              </span>
            </div>
            {yogas.map((yoga, idx) => (
              <div key={idx} className="yoga-card yoga-present">
                <div className="yoga-card-name">
                  <i className="fas fa-check-circle"></i>
                  {yoga.yoga_name || yoga.name || 'Unnamed Yoga'}
                  {yoga.strength && (
                    <span
                      className="yoga-strength-badge"
                      style={{ color: STRENGTH_COLORS[yoga.strength] || '#9ca3af' }}
                    >
                      {yoga.strength}
                    </span>
                  )}
                </div>
                {yoga.forming_planets && yoga.forming_planets.length > 0 && (
                  <div className="yoga-card-planets">
                    <strong>Forming Planets:</strong> {yoga.forming_planets.join(', ')}
                  </div>
                )}
                {yoga.mechanism && (
                  <div className="yoga-card-desc">{yoga.mechanism}</div>
                )}
                {yoga.classical_reference && (
                  <div className="yoga-card-ref">
                    <i className="fas fa-book"></i> {yoga.classical_reference}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
