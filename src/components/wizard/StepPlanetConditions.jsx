/**
 * StepPlanetConditions — Toggle retrograde, combust, exalted, debilitated per planet.
 */
import { useState } from 'react';
import ChartVisualAid from './ChartVisualAid';

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const CONDITIONS = [
  { key: 'is_retrograde', label: 'Retrograde', icon: 'R' },
  { key: 'is_combust', label: 'Combust', icon: 'C' },
  { key: 'is_exalted', label: 'Exalted', icon: '\u2191' },
  { key: 'is_debilitated', label: 'Debilitated', icon: '\u2193' },
];

export default function StepPlanetConditions({ data, onChange, content, personLabel }) {
  const flags = data.planet_flags || {};

  const toggleFlag = (planet, flagKey) => {
    const pFlags = flags[planet] || {};
    const updated = {
      ...flags,
      [planet]: { ...pFlags, [flagKey]: !pFlags[flagKey] },
    };
    onChange({ ...data, planet_flags: updated });
  };

  return (
    <div className="wiz-step">
      <div className="wiz-step-header">
        {personLabel && <div className="wiz-person-label"><i className="fas fa-user"></i> {personLabel}</div>}
        <h2>Planet Conditions</h2>
        <p>Mark any special conditions for each planet. Skip if unknown — defaults to normal.</p>
      </div>
      <ChartVisualAid content={content} />

      {PLANETS.map((planet) => {
        // Sun cannot be retrograde; Rahu/Ketu are always retrograde
        const pFlags = flags[planet] || {};
        return (
          <div key={planet} style={{ marginBottom: '0.75rem' }}>
            <div style={{ color: '#e0e0e0', fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              {planet}
            </div>
            <div className="wiz-toggle-grid">
              {CONDITIONS.map((cond) => {
                const isActive = !!pFlags[cond.key];
                return (
                  <div
                    key={cond.key}
                    className={`wiz-toggle-item${isActive ? ' active' : ''}`}
                    onClick={() => toggleFlag(planet, cond.key)}
                  >
                    <div className="wiz-toggle-check">{isActive ? '\u2713' : ''}</div>
                    <span className="wiz-toggle-label">{cond.icon} {cond.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
