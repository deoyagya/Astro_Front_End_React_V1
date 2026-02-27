/**
 * Active Chart Store — module-level, in-memory, transient.
 *
 * Separates "user's own birth data" (AsyncStorage via useBirthData) from
 * "currently viewed/edited saved chart" (this store).
 *
 * Pattern matches dashaNavStore.ts — synchronous, no React overhead.
 * Intentionally NOT persisted: clears on app restart.
 */

interface BirthData {
  name: string;
  dob: string;
  tob: string;
  gender?: 'male' | 'female';
  place_of_birth?: string;
  lat?: number;
  lon?: number;
}

let _chartId: string | null = null;
let _birthData: BirthData | null = null;

export const activeChartStore = {
  /** Set when viewing a saved chart from the list */
  set: (chartId: string, data: BirthData) => {
    _chartId = chartId;
    _birthData = data;
  },

  /** Get the active chart's birth data (null = use user's own via useBirthData) */
  getBirthData: (): BirthData | null => _birthData,

  /** Get the active chart's backend ID (null = no specific chart loaded) */
  getChartId: (): string | null => _chartId,

  /** Clear — called when creating a new chart or returning to user's own data */
  clear: () => {
    _chartId = null;
    _birthData = null;
  },

  /** Check if a saved chart is currently active */
  isActive: (): boolean => _chartId !== null,
};
