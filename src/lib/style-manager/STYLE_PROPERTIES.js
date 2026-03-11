/**
 * STYLE_PROPERTIES — Editable CSS properties for the Style Manager.
 *
 * Each entry defines one CSS property that can be customised per-element.
 * Consumed by the admin editor controls and the registry default definitions.
 *
 * @module lib/style-manager/STYLE_PROPERTIES
 */

export const STYLE_PROPERTIES = [
  { key: 'backgroundColor', label: 'Background', type: 'color' },
  { key: 'color', label: 'Font Color', type: 'color' },
  { key: 'fontSize', label: 'Font Size', type: 'text', placeholder: '0.82rem' },
  { key: 'fontWeight', label: 'Font Weight', type: 'select', options: [400, 500, 600, 700, 800, 900] },
  { key: 'borderRadius', label: 'Border Radius', type: 'text', placeholder: '4px' },
  { key: 'padding', label: 'Padding', type: 'text', placeholder: '4px 12px' },
];
