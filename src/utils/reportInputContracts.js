export function formatInputToken(token) {
  if (!token) return '';

  const labelMap = {
    dob: 'Date of birth',
    tob: 'Time of birth',
    place_of_birth: 'Birth place',
    event_type: 'Event type',
    start_date: 'Start date',
    end_date: 'End date',
    vimshottari_dasha: 'Vimshottari dasha',
    transits: 'Transit timing',
    birth_nakshatra: 'Birth nakshatra',
    shadbala: 'Shadbala',
    ashtakavarga: 'Ashtakavarga',
    llm_chart_context: 'Chart context',
    special_points: 'Special points',
    dosha_cancellation_rules: 'Dosha cancellation',
  };

  if (labelMap[token]) return labelMap[token];
  if (/^D\d+$/.test(token)) return token;

  return token
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getActiveInputLevel(contract) {
  if (!contract?.levels) return null;
  return contract.levels[contract.minimum_level] || null;
}

export function getBlockingRequirementLabels(contract, limit = 6) {
  const items = Array.isArray(contract?.blocking_if_missing) ? contract.blocking_if_missing : [];
  return items.slice(0, limit).map(formatInputToken);
}

export function getRecommendedEnhancementLabels(contract, limit = 4) {
  const level = contract?.levels?.recommended;
  const items = Array.isArray(level?.optional_enrichment_fields) ? level.optional_enrichment_fields : [];
  return items.slice(0, limit).map(formatInputToken);
}
