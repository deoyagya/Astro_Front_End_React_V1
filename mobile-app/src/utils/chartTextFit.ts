/**
 * chartTextFit — Adaptive text sizing for Vedic chart SVGs.
 *
 * Prevents planet labels from overflowing house boundaries by
 * scaling fontSize and lineHeight based on planet count per house.
 *
 * Both NorthIndianChart and SouthIndianChart import from here.
 */

export type TruncateLevel = 'full' | 'compact' | 'minimal';

export interface HouseTextFit {
  fontSize: number;
  lineHeight: number;
  truncate: TruncateLevel;
}

// ─── North Indian house categories ───────────────────────────
// Triangular corner/side houses have ~80px usable vertical space.
// Diamond (cardinal) houses have ~150px usable vertical space.
const TRIANGLE_HOUSES = new Set([2, 3, 5, 6, 8, 9, 11, 12]);

// Step-down tables: [maxPlanets, fontSize, lineHeight, truncateLevel]
type FitEntry = [number, number, number, TruncateLevel];

// Triangle houses (2,3,5,6,8,9,11,12) — 80px budget
const NORTH_TRIANGLE_FIT: FitEntry[] = [
  [1, 26, 34, 'full'],
  [2, 22, 28, 'full'],
  [3, 18, 24, 'full'],
  [4, 15, 20, 'compact'],
  [Infinity, 13, 16, 'minimal'], // 5+
];

// Diamond houses (1,4,7,10) — 150px budget
const NORTH_DIAMOND_FIT: FitEntry[] = [
  [4, 26, 34, 'full'],
  [5, 22, 28, 'full'],
  [6, 18, 24, 'full'],
  [Infinity, 15, 20, 'compact'], // 7+
];

// South Indian regular cells (no ASC) — 116px budget
const SOUTH_REGULAR_FIT: FitEntry[] = [
  [2, 26, 34, 'full'],
  [3, 22, 28, 'full'],
  [4, 18, 24, 'full'],
  [5, 15, 20, 'compact'],
  [Infinity, 13, 16, 'minimal'], // 6+
];

// South Indian ASC cells — 100px budget
const SOUTH_ASC_FIT: FitEntry[] = [
  [1, 26, 34, 'full'],
  [2, 22, 28, 'full'],
  [3, 18, 24, 'full'],
  [4, 15, 20, 'compact'],
  [5, 13, 17, 'minimal'],
  [Infinity, 13, 15, 'minimal'], // 6+
];

// Default (empty house)
const DEFAULT_FIT: HouseTextFit = { fontSize: 26, lineHeight: 34, truncate: 'full' };

function resolve(table: FitEntry[], count: number): HouseTextFit {
  for (const [maxN, fs, lh, trunc] of table) {
    if (count <= maxN) {
      return { fontSize: fs, lineHeight: lh, truncate: trunc };
    }
  }
  return { fontSize: 13, lineHeight: 16, truncate: 'minimal' };
}

/**
 * Compute text metrics for a North Indian chart house.
 */
export function fitNorthIndian(houseNum: number, count: number): HouseTextFit {
  if (count <= 0) return DEFAULT_FIT;
  const table = TRIANGLE_HOUSES.has(houseNum) ? NORTH_TRIANGLE_FIT : NORTH_DIAMOND_FIT;
  return resolve(table, count);
}

/**
 * Compute text metrics for a South Indian chart cell.
 */
export function fitSouthIndian(count: number, hasAsc: boolean): HouseTextFit {
  if (count <= 0) return DEFAULT_FIT;
  const table = hasAsc ? SOUTH_ASC_FIT : SOUTH_REGULAR_FIT;
  return resolve(table, count);
}
