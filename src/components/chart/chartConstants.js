/**
 * Shared chart constants — theme, fonts, geometry, divisional chart options.
 * Single source of truth for all chart rendering components.
 */

/* ===== THEME COLORS (site palette) ===== */
export const LINE     = '#7b5bff';
export const LINE_DIM = '#5a42cc';
export const ACCENT   = '#9d7bff';
export const BG       = '#0d0f1a';
export const HOVER_BG = 'rgba(123,91,255,0.12)';
export const SEL_BG   = 'rgba(123,91,255,0.22)';
export const LAGNA_BG = 'rgba(123,91,255,0.06)';
export const MALEFIC  = '#ff6b6b';
export const BENEFIC  = '#2ed573';
export const DEG_CLR  = '#b0b7c3';

/* ===== FONTS ===== */
export const FONT = "'Segoe UI', Arial, sans-serif";
export const MONO = "'Segoe UI', 'Courier New', monospace";

/* ===== FONT SIZES ===== */
export const SIGN_FONT      = 18;   // corner labels — readable at 50% scale
export const PLANET_FONT    = 26;   // prominent planet text — 62% larger than original
export const PLANET_LH      = 34;   // line-height for planet stacking
export const ASC_FONT       = 16;
export const LABEL_FONT     = 16;
export const LEGEND_FONT    = 18;
export const LEGEND_H       = 80;
export const MIN_PLANET_FONT = 13;

/* ===== SVG GEOMETRY — 600×600 ===== */
export const S = 600;
export const M = S / 2;

/* ===== DIVISIONAL CHART OPTIONS ===== */
export const CHART_OPTIONS = [
  { value: 'D1',  label: 'Rashi (D-1)',            description: 'The fundamental birth chart representing the physical body, general health, and overall life pattern.' },
  { value: 'D2',  label: 'Hora (D-2)',             description: 'Focuses on wealth, financial prosperity, assets, and family lineage.' },
  { value: 'D3',  label: 'Drekkana (D-3)',         description: 'Analyzes siblings, courage, strength, and short travels.' },
  { value: 'D4',  label: 'Chaturthamsa (D-4)',     description: 'Examines fixed assets, property, residential home, and overall fortune.' },
  { value: 'D7',  label: 'Saptamsa (D-7)',         description: 'Relates to children, grandchildren, progeny, and creative capacity.' },
  { value: 'D9',  label: 'Navamsa (D-9)',          description: 'The most critical sub-chart; reveals strength of planets and details regarding marriage, spouse, and spiritual dharma.' },
  { value: 'D10', label: 'Dasamsa (D-10)',         description: 'Focuses on career, profession, status in society, and public life.' },
  { value: 'D12', label: 'Dwadashamsa (D-12)',     description: 'Provides details about parents, ancestors, and inherited traits or diseases.' },
  { value: 'D16', label: 'Shodashamsa (D-16)',     description: 'Examines luxuries, vehicles, conveyances, and general happiness.' },
  { value: 'D20', label: 'Vimshamsa (D-20)',       description: 'Relates to spiritual progress, religious inclinations, and devotion to deities.' },
  { value: 'D24', label: 'Chaturvimshamsa (D-24)', description: 'Focuses on education, learning, academic achievements, and knowledge.' },
  { value: 'D27', label: 'Saptavimshamsa (D-27)',  description: 'Analyzes physical strength, stamina, and general vitality.' },
  { value: 'D30', label: 'Trimshamsa (D-30)',      description: 'Examines misfortunes, health issues, hidden dangers, and bad luck.' },
  { value: 'D40', label: 'Khavedamsha (D-40)',     description: 'Investigates auspicious and inauspicious events, often linked to maternal ancestral influences.' },
  { value: 'D45', label: 'Akshavedamsha (D-45)',   description: 'Reflects on character, conduct, and finer aspects of moral ethics.' },
  { value: 'D60', label: 'Shashtyamsha (D-60)',    description: 'A deeply spiritual chart representing past-life karma and the ultimate outcome of all life events.' },
];

/* ===== VARGA LABEL LOOKUP ===== */
export const VARGA_LABELS = Object.fromEntries(
  CHART_OPTIONS.map(o => [o.value, o.label])
);
