/**
 * VedicChart — Unified chart rendering component.
 *
 * Drop this into ANY screen to get a fully functional Vedic chart
 * with North/South style toggle, divisional chart selector,
 * ascendant info, and mobile-responsive layout.
 *
 * Usage:
 *   <VedicChart chartBundle={bundle} />                    // Minimal
 *   <VedicChart chartBundle={bundle} chartKey="D9" />      // Specific varga
 *   <VedicChart chartBundle={bundle} showControls={false}/> // Bare chart
 *   <VedicChart chartBundle={bundle} onHouseClick={fn} />   // Interactive
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import { resolveChartData, getAvailableCharts } from './chartUtils';
import { CHART_OPTIONS } from './chartConstants';
import { SIGN_NAMES, getSignLord, formatDegrees } from '../../utils/jyotish';
import './vedic-chart.css';

export default function VedicChart({
  chartBundle,
  chartKey: externalChartKey = null,
  onHouseClick,
  selectedHouse,
  showControls = true,
  showStyleToggle = true,
  showChartSelector = true,
  showAscendant = true,
  showLegend,        // undefined = auto (shown only when not in compact)
  chartLabel: customLabel = null,
  compact = false,   // true = tighter padding, smaller controls
  className = '',
}) {
  const [internalChartKey, setInternalChartKey] = useState('D1');
  const [chartStyle, setChartStyle] = useState(
    () => localStorage.getItem('chart_style_preference') || 'north'
  );

  // External chartKey takes precedence
  const activeKey = externalChartKey || internalChartKey;

  const bundle = chartBundle?.bundle || chartBundle || {};
  const natal = bundle.natal || {};
  const planets = natal.planets || {};
  const ascendant = natal.ascendant || {};
  const d9Vargas = bundle.vargas?.D9 || null;

  // Resolve chart data for the active key
  const chartData = useMemo(
    () => resolveChartData(chartBundle, activeKey, planets),
    [chartBundle, activeKey, planets]
  );

  // Available charts (filtered to those with data)
  const availableCharts = useMemo(
    () => getAvailableCharts(chartBundle),
    [chartBundle]
  );

  // Determine display label
  const displayLabel = customLabel
    || CHART_OPTIONS.find(o => o.value === activeKey)?.label
    || activeKey;

  const handleStyleChange = useCallback((style) => {
    setChartStyle(style);
    localStorage.setItem('chart_style_preference', style);
  }, []);

  // Close on Escape when used in modal context (parent can override)
  const ascSign = ascendant.sign ? parseInt(ascendant.sign, 10) : null;

  if (!chartBundle) return null;

  const ChartComponent = chartStyle === 'north' ? NorthIndianChart : SouthIndianChart;
  const showAscInfo = showAscendant && ascSign && activeKey === 'D1';

  return (
    <div className={`vc-root${compact ? ' vc-compact' : ''} ${className}`.trim()}>
      {/* Controls row */}
      {showControls && (showChartSelector || showStyleToggle) && (
        <div className="vc-controls">
          {showChartSelector && !externalChartKey && availableCharts.length > 1 && (
            <div className="vc-selector">
              <label>Chart:</label>
              <select
                value={activeKey}
                onChange={(e) => setInternalChartKey(e.target.value)}
              >
                {availableCharts.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {showStyleToggle && (
            <div className="vc-style-toggle">
              <button
                className={chartStyle === 'north' ? 'active' : ''}
                onClick={() => handleStyleChange('north')}
              >
                North
              </button>
              <button
                className={chartStyle === 'south' ? 'active' : ''}
                onClick={() => handleStyleChange('south')}
              >
                South
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chart SVG */}
      <div className="vc-chart-wrapper">
        {chartData ? (
          <ChartComponent
            chartData={chartData}
            chartLabel={displayLabel}
            onHouseClick={onHouseClick}
            selectedHouse={selectedHouse}
            d9Vargas={d9Vargas}
          />
        ) : (
          <div className="vc-empty">
            <i className="fas fa-chart-pie"></i>
            <p>No data for {displayLabel}</p>
          </div>
        )}
      </div>

      {/* Ascendant info */}
      {showAscInfo && (
        <div className="vc-asc-info">
          <i className="fas fa-compass"></i>
          <span>
            Ascendant: {SIGN_NAMES[ascSign] || '---'}
            {' '}&mdash; Lord: {getSignLord(ascSign)}
            {ascendant.longitude != null ? ` | ${formatDegrees(ascendant.longitude % 30)}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/* Re-export everything consumers might need */
export { default as NorthIndianChart } from './NorthIndianChart';
export { default as SouthIndianChart } from './SouthIndianChart';
export { CHART_OPTIONS, VARGA_LABELS } from './chartConstants';
export { enrichD1, resolveChartData, getAvailableCharts, buildLabel } from './chartUtils';
