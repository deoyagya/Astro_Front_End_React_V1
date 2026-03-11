/**
 * StyleContext — Thin app wrapper over the reusable style-manager library.
 *
 * Passes the app's API client and screen registry to the library's
 * StyleProvider. Components import from here (not from the lib directly).
 *
 * Phase 50B: Reusable architecture — lib has zero app imports.
 */

import { useCallback } from 'react';
import { StyleProvider as LibProvider, StyleManagerContext, useStyles } from '../lib/style-manager';
import { SCREEN_STYLE_REGISTRY } from '../config/screenStyleRegistry';
import { api } from '../api/client';

/**
 * App-level StyleProvider — wraps the lib with our API + registry.
 */
export function StyleProvider({ children }) {
  const fetchOverrides = useCallback(async () => {
    const data = await api.get('/v1/styles/active');
    return data.styles || {};
  }, []);

  return (
    <LibProvider registry={SCREEN_STYLE_REGISTRY} fetchOverrides={fetchOverrides}>
      {children}
    </LibProvider>
  );
}

// Re-export the context and hook for use by components
export { StyleManagerContext as StyleContext, useStyles };
