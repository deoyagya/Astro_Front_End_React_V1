/**
 * ChartModal — Full-screen modal for viewing D1 and divisional charts.
 *
 * Props:
 *   isOpen       — boolean, controls visibility
 *   onClose      — callback to close modal
 *   chartBundle  — full chart/create API response (with vargas)
 */

import { useState, useMemo, useEffect } from 'react';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import {
  SIGN_NAMES,
  vargaToChartData,
  getSignLord,
  formatDegrees,
} from '../utils/jyotish';

/* Divisional chart options */
const CHART_OPTIONS = [
  { value: 'D1', label: 'Rashi (D-1)' },
  { value: 'D2', label: 'Hora (D-2)' },
  { value: 'D3', label: 'Drekkana (D-3)' },
  { value: 'D4', label: 'Chaturthamsa (D-4)' },
  { value: 'D7', label: 'Saptamsa (D-7)' },
  { value: 'D9', label: 'Navamsa (D-9)' },
  { value: 'D10', label: 'Dasamsa (D-10)' },
  { value: 'D12', label: 'Dwadashamsa (D-12)' },
  { value: 'D16', label: 'Shodashamsa (D-16)' },
  { value: 'D20', label: 'Vimshamsa (D-20)' },
  { value: 'D24', label: 'Chaturvimshamsa (D-24)' },
  { value: 'D27', label: 'Saptavimshamsa (D-27)' },
  { value: 'D30', label: 'Trimshamsa (D-30)' },
  { value: 'D40', label: 'Khavedamsha (D-40)' },
  { value: 'D45', label: 'Akshavedamsha (D-45)' },
  { value: 'D60', label: 'Shashtyamsha (D-60)' },
];

/**
 * Enrich D1 chart placements with per-planet metadata.
 */
function enrichD1(d1Chart, natalPlanets) {
  if (!d1Chart?.placements || !natalPlanets) return d1Chart;
  const enriched = JSON.parse(JSON.stringify(d1Chart));
  for (const [, hData] of Object.entries(enriched.placements)) {
    hData.planetData = hData.planetData || {};
    for (const pName of hData.planets || []) {
      if (pName === 'Lagna') continue;
      const pNatal = natalPlanets[pName];
      if (!pNatal) continue;
      const lon = pNatal.longitude ?? pNatal.lon;
      const degInSign = lon != null ? lon % 30 : pNatal.degree ?? null;
      hData.planetData[pName] = {
        degree: degInSign,
        longitude: lon,
        isRetro: pNatal.is_retrograde || pNatal.retrograde || pNatal.is_retro || false,
        isCombust: pNatal.derived?.combustion?.is_combust || false,
        sign: parseInt(pNatal.sign, 10),
      };
    }
  }
  return enriched;
}

export default function ChartModal({ isOpen, onClose, chartBundle }) {
  const [selectedChart, setSelectedChart] = useState('D1');
  const [chartStyle, setChartStyle] = useState(
    () => localStorage.getItem('chart_style_preference') || 'north'
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const bundle = chartBundle?.bundle || chartBundle || {};
  const natal = bundle.natal || {};
  const planets = natal.planets || {};
  const ascendant = natal.ascendant || {};
  const d9Vargas = bundle.vargas?.D9 || null;

  /* Build active chart data based on selection */
  const activeChartData = useMemo(() => {
    if (!chartBundle) return null;

    if (selectedChart === 'D1' && bundle.charts?.D1?.placements) {
      return enrichD1(bundle.charts.D1, planets);
    }

    const vargaData = bundle.vargas?.[selectedChart];
    if (vargaData) {
      const option = CHART_OPTIONS.find((o) => o.value === selectedChart);
      return vargaToChartData(vargaData, option?.label || selectedChart);
    }

    // Fallback to D1
    if (bundle.charts?.D1?.placements) {
      return enrichD1(bundle.charts.D1, planets);
    }
    return null;
  }, [chartBundle, selectedChart, bundle, planets]);

  /* Available chart options (filter to only those with data) */
  const availableCharts = useMemo(() => {
    if (!chartBundle) return [];
    return CHART_OPTIONS.filter((opt) => {
      if (opt.value === 'D1') return !!bundle.charts?.D1;
      return !!bundle.vargas?.[opt.value];
    });
  }, [chartBundle, bundle]);

  const handleStyleChange = (style) => {
    setChartStyle(style);
    localStorage.setItem('chart_style_preference', style);
  };

  if (!isOpen || !chartBundle) return null;

  const ascSign = ascendant.sign ? parseInt(ascendant.sign, 10) : null;
  const selectedLabel = CHART_OPTIONS.find((o) => o.value === selectedChart)?.label || selectedChart;

  return (
    <div className="chart-modal-overlay" onClick={onClose}>
      <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chart-modal-header">
          <div className="chart-modal-title">
            <i className="fas fa-chart-pie"></i>
            <h2>{selectedLabel}</h2>
          </div>
          <button className="chart-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Controls */}
        <div className="chart-modal-controls">
          <div className="chart-modal-selector">
            <label>Chart Type:</label>
            <select
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
            >
              {availableCharts.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="chart-modal-style-toggle">
            <button
              className={chartStyle === 'north' ? 'active' : ''}
              onClick={() => handleStyleChange('north')}
            >
              North Indian
            </button>
            <button
              className={chartStyle === 'south' ? 'active' : ''}
              onClick={() => handleStyleChange('south')}
            >
              South Indian
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-modal-body">
          {activeChartData ? (
            <div className="chart-modal-chart">
              {chartStyle === 'north' ? (
                <NorthIndianChart
                  chartData={activeChartData}
                  chartLabel={selectedLabel}
                  d9Vargas={d9Vargas}
                />
              ) : (
                <SouthIndianChart
                  chartData={activeChartData}
                  d9Vargas={d9Vargas}
                />
              )}
            </div>
          ) : (
            <div className="chart-modal-empty">
              <i className="fas fa-chart-pie"></i>
              <p>No data available for {selectedLabel}</p>
            </div>
          )}

          {/* Ascendant info */}
          {ascSign && selectedChart === 'D1' && (
            <div className="chart-modal-asc-info">
              <i className="fas fa-compass"></i>
              <span>
                Ascendant: {SIGN_NAMES[ascSign] || '---'}
                {' '}&mdash; Lord: {getSignLord(ascSign)}
                {ascendant.longitude != null ? ` | ${formatDegrees(ascendant.longitude % 30)}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
