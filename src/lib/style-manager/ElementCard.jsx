/**
 * ElementCard — Reusable card for editing one styleable element.
 *
 * Shows a live mini-preview of the element + controls for each STYLE_PROPERTY.
 *
 * @module lib/style-manager/ElementCard
 */

import { STYLE_PROPERTIES } from './STYLE_PROPERTIES';
import { ColorControl, TextControl, SelectControl } from './StyleControls';

export function ElementCard({ element, effectiveStyle, onPropertyChange, isOverridden }) {
  return (
    <div className={`sm-element-card ${isOverridden ? 'sm-overridden' : ''}`}>
      <div className="sm-element-header">
        <span className="sm-element-label">{element.label}</span>
        {isOverridden && <span className="sm-override-badge">Modified</span>}
      </div>

      {/* Live mini-preview */}
      <div className="sm-element-preview">
        <span style={{
          ...effectiveStyle,
          display: 'inline-block',
          textTransform: 'capitalize',
          cursor: 'default',
        }}>
          {element.label}
        </span>
      </div>

      {/* Controls */}
      <div className="sm-controls-grid">
        {STYLE_PROPERTIES.map((prop) => {
          const val = effectiveStyle[prop.key];
          if (prop.type === 'color') {
            return (
              <ColorControl
                key={prop.key}
                label={prop.label}
                value={val}
                onChange={(v) => onPropertyChange(element.key, prop.key, v)}
              />
            );
          }
          if (prop.type === 'select') {
            return (
              <SelectControl
                key={prop.key}
                label={prop.label}
                value={val}
                options={prop.options}
                onChange={(v) => onPropertyChange(element.key, prop.key, v)}
              />
            );
          }
          return (
            <TextControl
              key={prop.key}
              label={prop.label}
              value={val}
              placeholder={prop.placeholder}
              onChange={(v) => onPropertyChange(element.key, prop.key, v)}
            />
          );
        })}
      </div>
    </div>
  );
}
