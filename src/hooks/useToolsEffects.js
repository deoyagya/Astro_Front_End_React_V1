export const legacyToolSamples = {
  dasha: [
    { planet: 'Mars', period: 'Mahadasha', years: '2020-2027', current: true },
    { planet: 'Rahu', period: 'Mahadasha', years: '2027-2045', current: false },
  ],
  compatibility: {
    score: '26/36',
    verdict: 'Good Compatibility',
  },
};

/**
 * Legacy tools hook preserved for compatibility.
 *
 * Tool pages are now React-driven, so this hook intentionally does nothing.
 */
export function useToolsEffects() {}
