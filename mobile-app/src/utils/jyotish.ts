/**
 * Vedic Jyotish utility functions — shared constants and helpers
 * for chart rendering and house detail panels.
 * Ported from web src/utils/jyotish.js (pure logic, no DOM deps).
 */

/* ===== SIGN NAMES (1-indexed) ===== */
export const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

/* ===== SIGN LORDS ===== */
const SIGN_LORDS: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon',
  5: 'Sun', 6: 'Mercury', 7: 'Venus', 8: 'Mars',
  9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter',
};

/* ===== 27 NAKSHATRAS (in zodiacal order) ===== */
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Moola',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/* ===== DIGNITY TABLES ===== */
const EXALTATION: Record<string, number> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};
const DEBILITATION: Record<string, number> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1,
};
const OWN_SIGNS: Record<string, number[]> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
  Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

/* ===== MALEFIC PLANETS (for color coding) ===== */
export const MALEFICS = new Set(['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']);

/* ===== 2-LETTER ABBREVIATIONS ===== */
export const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
  Lagna: 'As',
};

/* ===== SIGN SHORT NAMES (3 letters) ===== */
export const SIGN_SHORT: Record<number, string> = {
  1: 'Ari', 2: 'Tau', 3: 'Gem', 4: 'Can',
  5: 'Leo', 6: 'Vir', 7: 'Lib', 8: 'Sco',
  9: 'Sag', 10: 'Cap', 11: 'Aqu', 12: 'Pis',
};

/* ===== SUPERSCRIPT DIGITS for degree display in chart ===== */
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3',
  '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077',
  '8': '\u2078', '9': '\u2079',
};

/**
 * Convert a number to superscript Unicode string.
 * e.g. 20 → "²⁰", 5 → "⁵"
 */
export function toSuperscript(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return '';
  return String(Math.floor(num))
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] || ch)
    .join('');
}

/**
 * Compact degree string for SVG chart display.
 * e.g. 20 → "20°", 5 → "5°"
 */
export function toDegreeStr(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return '';
  return `${Math.round(num)}°`;
}

/* ===== STATUS SYMBOLS (for chart display) ===== */
export const STATUS_SYMBOLS = {
  retro: '*',
  combust: '^',
  exalted: '\u2191',    // ↑
  debilitated: '\u2193', // ↓
  vargottama: '\u25A1',  // □
};

interface PlanetInfo {
  isRetro?: boolean;
  isCombust?: boolean;
  isVargottama?: boolean;
  dignity?: string;
}

/**
 * Build a compact status suffix string for a planet in the chart.
 * e.g. "*↑" for retrograde + exalted
 */
export function getPlanetStatusSuffix(planetInfo: PlanetInfo | null): string {
  if (!planetInfo) return '';
  const parts: string[] = [];
  if (planetInfo.isRetro) parts.push(STATUS_SYMBOLS.retro);
  if (planetInfo.isCombust) parts.push(STATUS_SYMBOLS.combust);
  if (planetInfo.isVargottama) parts.push(STATUS_SYMBOLS.vargottama);
  if (planetInfo.dignity === 'exalted') parts.push(STATUS_SYMBOLS.exalted);
  if (planetInfo.dignity === 'debilitated') parts.push(STATUS_SYMBOLS.debilitated);
  return parts.join('');
}

/**
 * Check if a planet is Vargottama (same sign in D1 and D9).
 */
export function isVargottama(d1Sign: number, d9Sign: number): boolean {
  if (!d1Sign || !d9Sign) return false;
  return d1Sign === d9Sign;
}

/**
 * Build a planet label for chart SVG display with adaptive truncation.
 * Centralizes the label logic previously duplicated in both chart components.
 *
 * Truncation levels:
 *  - 'full'    → "Su20°*↑"  (abbr + degree + status)
 *  - 'compact' → "Su20°"    (abbr + degree, no status)
 *  - 'minimal' → "Su*↑"     (abbr + status, no degree)
 */
export type TruncateLevel = 'full' | 'compact' | 'minimal';

export function buildChartLabel(
  pName: string,
  chartData: any,
  d9Vargas: any,
  truncate: TruncateLevel = 'full',
): { label: string; isMalefic: boolean } {
  const placements = chartData.placements || {};
  let pInfo: any = null;
  let signNum: number | null = null;

  for (const hData of Object.values(placements) as any[]) {
    if ((hData.planets || []).includes(pName)) {
      signNum = hData.sign;
      pInfo = hData.planetData?.[pName] || null;
      break;
    }
  }

  const degree = pInfo?.degree ?? null;
  const isRetro = pInfo?.isRetro || false;
  const isCombust = pInfo?.isCombust || false;
  const dignity = signNum ? getDignity(pName, signNum) : 'neutral';

  let isVarg = false;
  if (d9Vargas && signNum) {
    const d9 = d9Vargas[pName];
    if (d9?.sign) isVarg = isVargottama(signNum, d9.sign);
  }

  const abbr = PLANET_ABBR[pName] || pName.slice(0, 2);
  const degStr = degree != null ? toDegreeStr(degree) : '';
  const suffix = getPlanetStatusSuffix({ isRetro, isCombust, isVargottama: isVarg, dignity });

  let label: string;
  switch (truncate) {
    case 'minimal':
      label = `${abbr}${suffix}`;
      break;
    case 'compact':
      label = `${abbr}${degStr}`;
      break;
    case 'full':
    default:
      label = `${abbr}${degStr}${suffix}`;
      break;
  }

  return { label, isMalefic: MALEFICS.has(pName) };
}

interface VargaPlanetEntry {
  sign?: number;
  degree?: number;
  longitude?: number;
  is_retrograde?: boolean;
  is_retro?: boolean;
  retrograde?: boolean;
}

interface HousePlacement {
  house: number;
  sign: number;
  sign_name: string;
  planets: string[];
  planetData: Record<string, any>;
}

/**
 * Convert varga planet-keyed data into house-keyed placements format.
 */
export function vargaToChartData(
  vargaPlanetData: Record<string, VargaPlanetEntry> | null | undefined,
  chartLabel: string = 'Chart'
) {
  if (!vargaPlanetData || typeof vargaPlanetData !== 'object') return null;

  const lagnaData = vargaPlanetData.Lagna || {};
  const lagnaSign = lagnaData.sign || 1;

  const placements: Record<string, HousePlacement> = {};
  for (let h = 1; h <= 12; h++) {
    const sign = ((lagnaSign - 1 + h - 1) % 12) + 1;
    placements[String(h)] = {
      house: h,
      sign,
      sign_name: SIGN_NAMES[sign] || `Sign ${sign}`,
      planets: [],
      planetData: {},
    };
  }

  placements['1'].planets.push('Lagna');

  const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  for (const pName of planetOrder) {
    const pData = vargaPlanetData[pName];
    if (!pData || !pData.sign) continue;
    const pSign = pData.sign;
    const house = ((pSign - lagnaSign + 12) % 12) + 1;
    if (placements[String(house)]) {
      placements[String(house)].planets.push(pName);
      placements[String(house)].planetData[pName] = {
        degree: pData.degree,
        longitude: pData.longitude,
        isRetro: pData.is_retrograde || pData.is_retro || pData.retrograde || false,
        sign: pData.sign,
      };
    }
  }

  return {
    placements,
    lagna_sign: lagnaSign,
    lagna_sign_name: SIGN_NAMES[lagnaSign] || '',
    ui: { chart_label: chartLabel },
  };
}

/**
 * Get nakshatra name and pada from absolute longitude (0–360°).
 */
export function getNakshatra(longitude: number) {
  if (longitude == null || isNaN(longitude)) return null;
  const lon = ((longitude % 360) + 360) % 360;
  const nakshatraSpan = 360 / 27;
  const index = Math.floor(lon / nakshatraSpan);
  const posInNak = lon - index * nakshatraSpan;
  const pada = Math.floor(posInNak / (nakshatraSpan / 4)) + 1;
  return {
    name: NAKSHATRAS[index] || `Nak ${index + 1}`,
    pada: Math.min(pada, 4),
    index,
  };
}

/** Return the planetary lord of a sign (1–12). */
export function getSignLord(signNum: number): string {
  return SIGN_LORDS[signNum] || '—';
}

/**
 * Get dignity status of a planet in a sign.
 */
export function getDignity(
  planetName: string,
  signNum: number
): 'exalted' | 'own' | 'debilitated' | 'neutral' {
  if (!planetName || !signNum) return 'neutral';
  if (planetName === 'Rahu' || planetName === 'Ketu') return 'neutral';
  if (EXALTATION[planetName] === signNum) return 'exalted';
  if (DEBILITATION[planetName] === signNum) return 'debilitated';
  if (OWN_SIGNS[planetName]?.includes(signNum)) return 'own';
  return 'neutral';
}

/**
 * Format longitude degrees — rounded to nearest whole degree.
 */
export function formatDegrees(lon: number | null | undefined): string {
  if (lon == null || isNaN(lon)) return '—';
  return `${Math.round(lon)}°`;
}

/** Ordinal suffix for house numbers (1st, 2nd, 3rd, 4th...) */
export function getSuffix(n: number | string): string {
  const num = typeof n === 'number' ? n : parseInt(n, 10);
  if (num === 1) return 'st';
  if (num === 2) return 'nd';
  if (num === 3) return 'rd';
  return 'th';
}
