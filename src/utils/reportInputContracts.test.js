import {
  formatInputToken,
  getActiveInputLevel,
  getBlockingRequirementLabels,
  getRecommendedEnhancementLabels,
} from './reportInputContracts';

describe('reportInputContracts utils', () => {
  const contract = {
    minimum_level: 'required',
    blocking_if_missing: ['name', 'dob', 'tob', 'place_of_birth', 'D1', 'D10'],
    levels: {
      required: {
        label: 'Minimum required',
        required_user_fields: ['name', 'dob', 'tob', 'place_of_birth'],
        required_computed_charts: ['D1', 'D10'],
        optional_enrichment_fields: [],
      },
      recommended: {
        label: 'Recommended',
        required_user_fields: ['name', 'dob', 'tob', 'place_of_birth'],
        required_computed_charts: ['D1', 'D10'],
        optional_enrichment_fields: ['vimshottari_dasha', 'transits', 'shadbala'],
      },
    },
  };

  it('formats human-friendly field labels', () => {
    expect(formatInputToken('dob')).toBe('Date of birth');
    expect(formatInputToken('place_of_birth')).toBe('Birth place');
    expect(formatInputToken('D10')).toBe('D10');
  });

  it('returns the active minimum level', () => {
    expect(getActiveInputLevel(contract)).toEqual(contract.levels.required);
  });

  it('returns blocking labels in display format', () => {
    expect(getBlockingRequirementLabels(contract, 3)).toEqual([
      'Name',
      'Date of birth',
      'Time of birth',
    ]);
  });

  it('returns recommended enrichment labels in display format', () => {
    expect(getRecommendedEnhancementLabels(contract, 2)).toEqual([
      'Vimshottari dasha',
      'Transit timing',
    ]);
  });
});
