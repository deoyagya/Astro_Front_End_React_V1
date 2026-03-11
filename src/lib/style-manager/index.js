/**
 * Style Manager — Reusable library for per-screen UI style overrides.
 *
 * This package has ZERO app-specific imports. All dependencies (API client,
 * auth, registry) are injected via props/context.
 *
 * Usage in any React project:
 *
 *   import { StyleProvider, useStyles, AdminStyleEditor } from './lib/style-manager';
 *
 *   // 1. Wrap your app:
 *   <StyleProvider registry={MY_REGISTRY} fetchOverrides={myApiFn}>
 *     <App />
 *   </StyleProvider>
 *
 *   // 2. In any page:
 *   const { getStyle, getOverride } = useStyles('my-screen');
 *   <div style={getStyle('myElement')}>  // inline-style page
 *   <div className="cls" style={getOverride('myElement')}>  // CSS-class page
 *
 *   // 3. Admin editor:
 *   <AdminStyleEditor registry={REG} apiGet={fn} apiPut={fn} apiDelete={fn} />
 *
 * @module lib/style-manager
 */

export { StyleProvider, StyleManagerContext } from './StyleProvider';
export { useStyles } from './useStyles';
export { AdminStyleEditor } from './AdminStyleEditor';
export { GenericPreview } from './GenericPreview';
export { ElementCard } from './ElementCard';
export { ColorControl, TextControl, SelectControl } from './StyleControls';
export { STYLE_PROPERTIES } from './STYLE_PROPERTIES';
