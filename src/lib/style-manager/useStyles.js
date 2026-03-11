/**
 * useStyles — Hook returning dual style API for any screen.
 *
 * Returns:
 *   getStyle(key)    — { ...defaults, ...dbOverrides } — for inline-style pages
 *   getOverride(key) — dbOverrides only (or {})        — for CSS-class pages
 *
 * @module lib/style-manager/useStyles
 */

import { useCallback, useContext } from 'react';
import { StyleManagerContext } from './StyleProvider';

/**
 * Find the default styles for a specific element in the registry.
 */
function findDefaults(registry, screenKey, elementKey) {
  const screen = registry[screenKey];
  if (!screen) return {};
  for (const cat of screen.categories) {
    const el = cat.elements.find((e) => e.key === elementKey);
    if (el) return el.defaults;
  }
  return {};
}

/**
 * Hook: useStyles(screenKey)
 *
 * Usage:
 *   const { getStyle, getOverride } = useStyles('birth-chart');
 *
 *   // Inline-style pages — always returns full style object:
 *   <div style={getStyle('planetRow_benefic')}>
 *
 *   // CSS-class pages — returns only DB overrides (or {} when none):
 *   <div className="login-card" style={getOverride('formCard')}>
 */
export function useStyles(screenKey) {
  const { overrides, registry } = useContext(StyleManagerContext);

  const getStyle = useCallback(
    (elementKey) => {
      const defaults = findDefaults(registry, screenKey, elementKey);
      const elOverrides = overrides[screenKey]?.[elementKey] || {};
      return { ...defaults, ...elOverrides };
    },
    [screenKey, overrides, registry],
  );

  const getOverride = useCallback(
    (elementKey) => overrides[screenKey]?.[elementKey] || {},
    [screenKey, overrides],
  );

  return { getStyle, getOverride };
}
