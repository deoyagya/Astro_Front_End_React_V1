/**
 * Rule Builder Configuration — Phase 42
 * =============================================
 * Mirrors backend's primitive_params.py + rule_validator.py enum sets.
 * Provides: enum constants, 81 primitive specs, 12 categories,
 * and data-field tag extraction for prompt variable auto-detection.
 */

// ---------------------------------------------------------------------------
// A.1 — Enum Source Constants
// ---------------------------------------------------------------------------

export const ENUM_SOURCES = {
  planets: [
    'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn',
    'Rahu', 'Ketu', 'Ascendant',
  ],
  houses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  signs: [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ],
  charts: [
    'D1', 'D2', 'D3', 'D4', 'D7', 'D9', 'D10', 'D12',
    'D16', 'D20', 'D24', 'D27', 'D30', 'D40', 'D45', 'D60',
  ],
  nakshatras: [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
    'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
    'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
    'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
    'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
  ],
  dignities: [
    'exalted', 'own', 'mool_trikona', 'friendly', 'neutral', 'enemy', 'debilitated',
  ],
  dasha_levels: ['mahadasha', 'antardasha', 'pratyantardasha'],
  relationships: ['friend', 'neutral', 'enemy', 'great_friend', 'great_enemy'],
  chara_karakas: ['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK'],
  avasthas: ['Bala', 'Kumara', 'Yuva', 'Vriddha', 'Mrita'],
  prashna_points: ['lagna', 'moon'],
  sade_sati_phases: ['rising', 'peak', 'setting', 'none'],
  nakshatra_qualities: ['deva', 'manushya', 'rakshasa'],
  nakshatra_quality_types: ['dhruva', 'chara', 'ugra', 'mishra', 'kshipra', 'mridu', 'tikshna'],
  tara_numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  tara_names: [
    'Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari',
    'Sadhaka', 'Vadha', 'Mitra', 'Parama Mitra',
  ],
  yogas: [
    'Gaja_Kesari', 'Pancha_Mahapurusha', 'Budha_Aditya',
    'Raja_Yoga', 'Dhana_Yoga', 'Viparita_Raja', 'Neecha_Bhanga_Raja',
    'Kemadruma', 'Shakata', 'Chandra_Mangala',
  ],
  conjunction_tiers: ['exact', 'close', 'wide'],
  visha_mrityu_categories: ['visha', 'mrityu', 'both'],
  pancha_mahapurusha_types: ['Ruchaka', 'Bhadra', 'Hamsa', 'Malavya', 'Sasa'],
  dasha_pair_types: ['6_8', '2_12', '1_7', '3_11', '5_9'],
  vimshopaka_schemes: ['shodashavarga', 'saptavarga', 'dashavarga'],
  argala_types: ['dhan', 'sukh', 'labh', 'putr', 'any'],
  war_results: ['winner', 'loser'],
};

// ---------------------------------------------------------------------------
// A.2 — Primitive Param Specs (mirrored from primitive_params.py)
// ---------------------------------------------------------------------------

// Helper constructors (match backend helpers)
const _planet = (multi = false, required = true, label = 'Planet') =>
  ({ type: 'select', multi, source: 'planets', required, label });
const _house = (multi = false, required = true, label = 'House') =>
  ({ type: 'select', multi, source: 'houses', required, label });
const _chart = (required = false) =>
  ({ type: 'select', multi: false, source: 'charts', required, default: 'D1', label: 'Chart' });
const _dignity = (multi = true) =>
  ({ type: 'select', multi, source: 'dignities', required: true, label: 'Dignity' });
const _dashaLevel = () =>
  ({ type: 'select', multi: false, source: 'dasha_levels', required: true, label: 'Dasha Level' });
const _number = (label, required = true) =>
  ({ type: 'number', required, label });
const _boolean = (label, required = true) =>
  ({ type: 'boolean', required, label });
const _text = (label, required = true) =>
  ({ type: 'text', required, label });
const _sign = (multi = true) =>
  ({ type: 'select', multi, source: 'signs', required: true, label: 'Sign(s)' });
const _nakshatra = (multi = true) =>
  ({ type: 'select', multi, source: 'nakshatras', required: true, label: 'Nakshatra(s)' });
const _relationship = (multi = true) =>
  ({ type: 'select', multi, source: 'relationships', required: true, label: 'Relationship' });

export const PRIMITIVE_PARAM_SPECS = {
  // ── Planet Conditions ──
  planet_in_house: {
    category: 'Planet', description: 'Check if planet(s) occupy a specific house',
    params: { planet: _planet(true, true, 'Planet(s)'), house: _house(true, true, 'House(s)'), chart: _chart() },
  },
  planet_dignity: {
    category: 'Planet', description: 'Check planet dignity (exalted, debilitated, etc.)',
    params: { planet: _planet(), dignity: _dignity(), chart: _chart() },
  },
  planet_conjunct: {
    category: 'Planet', description: 'Check if a planet conjoins another planet',
    params: { planet: _planet(), with: _planet(true, true, 'Conjunct With'), house: _house(false, false, 'In House'), chart: _chart() },
  },
  planet_combust: {
    category: 'Planet', description: 'Check if a planet is combust (too close to Sun)',
    params: { planet: _planet(), is_combust: _boolean('Is Combust') },
  },
  planet_retrograde: {
    category: 'Planet', description: 'Check if a planet is retrograde',
    params: { planet: _planet(), is_retrograde: _boolean('Is Retrograde') },
  },
  planet_relationship: {
    category: 'Planet', description: 'Check natural/temporal relationship between planets',
    params: { planet1: _planet(false, true, 'Planet 1'), planet2: _planet(false, true, 'Planet 2'), relationship: _relationship() },
  },
  planet_mutual_aspect: {
    category: 'Planet', description: 'Check if two planets mutually aspect each other',
    params: { planet1: _planet(false, true, 'Planet 1'), planet2: _planet(false, true, 'Planet 2'), chart: _chart() },
  },
  planet_exchange: {
    category: 'Planet', description: 'Check Parivartana (mutual sign exchange)',
    params: { planet1: _planet(false, true, 'Planet 1'), planet2: _planet(false, true, 'Planet 2'), chart: _chart() },
  },
  planet_in_mks: {
    category: 'Planet', description: 'Check if planet in Marana Karaka Sthana',
    params: { planet: _planet(), chart: _chart() },
  },
  planet_vargottama: {
    category: 'Planet', description: 'Check if planet is Vargottama (same sign D1 & D9)',
    params: { planet: _planet(), chart: _chart() },
  },
  planet_gandanta: {
    category: 'Planet', description: 'Check if planet in Gandanta zone (water-fire junction)',
    params: { planet: _planet(), chart: _chart() },
  },
  planet_in_war: {
    category: 'Planet', description: 'Check if planet in planetary war (win/loss)',
    params: { planet: _planet(), war_result: { type: 'select', multi: false, source: 'war_results', required: false, label: 'War Result' }, chart: _chart() },
  },
  rasi_nakshatra_lord_conflict: {
    category: 'Planet', description: 'Check if rasi lord and nakshatra lord are enemies',
    params: { planet: _planet(), chart: _chart() },
  },
  planetary_war: {
    category: 'Planet', description: 'Check if two planets within 1° (Graha Yuddha)',
    params: { planet_a: _planet(false, false, 'Planet A'), planet_b: _planet(false, false, 'Planet B'), max_orb: _number('Max Orb°', false) },
  },
  conjunction_strength: {
    category: 'Planet', description: 'Check degree-based conjunction strength tier',
    params: { planet_a: _planet(false, true, 'Planet A'), planet_b: _planet(false, true, 'Planet B'), tier: { type: 'select', multi: true, source: 'conjunction_tiers', required: true, label: 'Tier(s)' } },
  },
  planetary_maturity: {
    category: 'Planet', description: 'Check if native reached planet maturity age',
    params: { planet: _planet(), native_age: _number('Native Age', false) },
  },
  badhaka_planet_analysis: {
    category: 'Planet', description: 'Check Badhaka planet involvement',
    params: { planet: _planet(false, false, 'Planet (check if Badhaka lord)'), house: _house(true, false, 'House(s)'), chart: _chart() },
  },

  // ── Aspect Conditions ──
  planet_aspects_house: {
    category: 'Aspect', description: 'Check if planet aspects a house (Graha Drishti)',
    params: { planet: _planet(), house: _house(true, true, 'House(s)'), chart: _chart() },
  },
  planet_aspects_planet: {
    category: 'Aspect', description: 'Check if a planet aspects another planet',
    params: { planet: _planet(), target: _planet(false, true, 'Target Planet'), chart: _chart() },
  },
  planet_aspects_house_relationship: {
    category: 'Aspect', description: 'Planet aspect on house with relationship filter',
    params: { planet: _planet(), house: _house(), relationship: _relationship(false) },
  },
  rashi_drishti: {
    category: 'Aspect', description: 'Check Jaimini sign-based aspect (Rashi Drishti)',
    params: { planet: _planet(), house: _house(), chart: _chart() },
  },

  // ── House Conditions ──
  house_lord_in_house: {
    category: 'House', description: 'Check placement of a house lord in another house',
    params: { source_house: _house(false, true, 'Lord of House'), target_house: _house(true, true, 'Placed in House(s)'), chart: _chart() },
  },
  house_strength: {
    category: 'House', description: 'Check overall strength of a house',
    params: { house: _house(), min_score: _number('Min Score', false), max_score: _number('Max Score', false) },
  },
  house_in_sign: {
    category: 'House', description: 'Check if house cusp in specified signs',
    params: { house: _house(), signs: _sign(true), chart: _chart() },
  },
  planet_argala_on_house: {
    category: 'House', description: 'Check if planet(s) create Argala on house',
    params: { planet: _planet(true, true, 'Planet(s)'), target_house: _house(false, true, 'Target House'), argala_type: { type: 'select', multi: false, source: 'argala_types', required: false, default: 'any', label: 'Argala Type' }, chart: _chart() },
  },
  virodha_argala_on_house: {
    category: 'House', description: 'Check Virodha (obstructing) Argala on house',
    params: { planet: _planet(true, true, 'Planet(s)'), target_house: _house(false, true, 'Target House'), obstruction_type: { type: 'select', multi: false, source: 'argala_types', required: false, default: 'any', label: 'Obstruction Type' }, chart: _chart() },
  },
  gulika_in_house: {
    category: 'House', description: 'Check if Gulika/Mandi in specified house(s)',
    params: { house: _house(true, true, 'House(s)'), chart: _chart() },
  },
  gulika_conjunct_planet: {
    category: 'House', description: 'Check if Gulika/Mandi conjunct a planet',
    params: { planet: _planet(), orb_degrees: _number('Orb°', false), chart: _chart() },
  },
  planet_in_bhava_chalit: {
    category: 'House', description: 'Check planet in house by Bhava Chalit system',
    params: { planet: _planet(), house: _house(true, true, 'House(s)'), chart: _chart() },
  },
  planet_bhava_shifted: {
    category: 'House', description: 'Check if Bhava Chalit house differs from Rashi house',
    params: { planet: _planet(), chart: _chart() },
  },
  chalit_house_check: {
    category: 'House', description: 'Check if planet Chalit house differs from Rashi house',
    params: { planet: _planet(false, false), require_differs: _boolean('Require Differs', false) },
  },

  // ── Dasha Conditions ──
  dasha_lord: {
    category: 'Dasha', description: 'Check if current dasha lord is a specific planet',
    params: { level: _dashaLevel(), planet: _planet(true, true, 'Planet(s)') },
  },
  dasha_lord_in_house: {
    category: 'Dasha', description: 'Check which house the dasha lord occupies',
    params: { level: _dashaLevel(), house: _house(true, true, 'House(s)') },
  },
  dasha_lord_aspects_house: {
    category: 'Dasha', description: 'Check if dasha lord aspects a house',
    params: { level: _dashaLevel(), house: _house(true, true, 'House(s)') },
  },
  dasha_lord_is_house_lord: {
    category: 'Dasha', description: 'Check if dasha lord rules a specific house',
    params: { level: _dashaLevel(), house: _house(true, true, 'House(s)') },
  },
  dasha_lord_is_planet: {
    category: 'Dasha', description: 'Check if dasha lord is a specific planet',
    params: { level: _dashaLevel(), planet: _planet(true, true, 'Planet(s)') },
  },
  dasha_lord_is_yoga_karaka: {
    category: 'Dasha', description: 'Check if dasha lord is yoga karaka',
    params: { level: _dashaLevel() },
  },
  dasha_lord_dispositor_chain_ends_in: {
    category: 'Dasha', description: 'Check where dasha lord dispositor chain terminates',
    params: { level: _dashaLevel(), house: _house(true, true, 'House(s)') },
  },
  dasha_lord_is_badhaka: {
    category: 'Dasha', description: 'Check if current dasha lord is Badhaka lord',
    params: { level: _dashaLevel() },
  },
  dasha_sandhi: {
    category: 'Dasha', description: 'Check if dasha near junction (sandhi / transition)',
    params: { level: { type: 'select', multi: false, source: 'dasha_levels', required: false, label: 'Dasha Level' }, threshold_days: _number('Threshold (days)', false) },
  },
  md_ad_pair_relationship: {
    category: 'Dasha', description: 'Check house-distance between MD and AD lords',
    params: { pair_type: { type: 'select', multi: true, source: 'dasha_pair_types', required: true, label: 'Pair Type(s)' } },
  },

  // ── Transit Conditions ──
  transit_planet_in_house: {
    category: 'Transit', description: 'Check if transiting planet in specific house',
    params: { planet: _planet(false, true, 'Transit Planet'), house: _house(true, true, 'House(s)') },
  },
  transit_planet_in_rashi: {
    category: 'Transit', description: 'Check if transiting planet in specific rashi',
    params: { planet: _planet(false, true, 'Transit Planet'), rashi: _sign() },
  },
  transit_planet_in_sign: {
    category: 'Transit', description: 'Check if transiting planet in specific sign',
    params: { planet: _planet(false, true, 'Transit Planet'), sign: _sign() },
  },
  transit_planet_in_nakshatra: {
    category: 'Transit', description: 'Check if transiting planet in specific nakshatra',
    params: { planet: _planet(false, true, 'Transit Planet'), nakshatra: _nakshatra() },
  },
  transit_planet_dignity: {
    category: 'Transit', description: 'Check dignity of a transiting planet',
    params: { planet: _planet(false, true, 'Transit Planet'), dignity: _dignity() },
  },
  transit_planet_sign_lord_relationship: {
    category: 'Transit', description: 'Relationship between transit planet and sign lord',
    params: { planet: _planet(false, true, 'Transit Planet'), relationship: _relationship(false) },
  },
  transit_aspects_house_relationship: {
    category: 'Transit', description: 'Transit planet aspect on house with relationship',
    params: { planet: _planet(false, true, 'Transit Planet'), house: _house(), relationship: _relationship(false) },
  },
  transit_nakshatra_lord_signification: {
    category: 'Transit', description: 'Signification of transit planet nakshatra lord',
    params: { planet: _planet(false, true, 'Transit Planet'), signification: _text('Signification') },
  },
  transit_nakshatra_quality: {
    category: 'Transit', description: 'Quality of nakshatra a transit planet occupies',
    params: { planet: _planet(false, true, 'Transit Planet'), quality: { type: 'select', multi: true, source: 'nakshatra_qualities', required: true, label: 'Quality' } },
  },
  saturn_transit_over_moon: {
    category: 'Transit', description: 'Check Sade Sati phase (Saturn transit over Moon)',
    params: { phase: { type: 'select', multi: true, source: 'sade_sati_phases', required: true, label: 'Phase(s)' } },
  },
  saturn_transit_over_natal: {
    category: 'Transit', description: 'Saturn transit over natal planet',
    params: { planet: _planet(false, true, 'Natal Planet'), orb: _number('Orb°', false) },
  },
  transit_planet_aspects_house: {
    category: 'Transit', description: 'Transit planet aspects natal house (Graha Drishti)',
    params: { planet: _planet(false, true, 'Transit Planet'), house: _house(true, true, 'Natal House(s)'), chart: _chart() },
  },
  transit_planet_aspects_planet: {
    category: 'Transit', description: 'Transit planet aspects natal planet',
    params: { planet: _planet(false, true, 'Transit Planet'), target: _planet(false, true, 'Natal Planet') },
  },
  double_transit: {
    category: 'Transit', description: 'Jupiter AND Saturn both influence house via transit',
    params: { house: _house(true, true, 'House(s)') },
  },
  saturn_return: {
    category: 'Transit', description: 'Transit Saturn in same sign as natal Saturn (~29.5yr)',
    params: { orb: _number('Sign Orb (0=exact)', false) },
  },
  jupiter_return: {
    category: 'Transit', description: 'Transit Jupiter in same sign as natal Jupiter (~12yr)',
    params: { orb: _number('Sign Orb (0=exact)', false) },
  },

  // ── Strength Conditions ──
  shadbala_strength: {
    category: 'Strength', description: 'Check if planet meets Shadbala threshold',
    params: { planet: _planet(), min_rupas: _number('Min Rupas') },
  },
  ashtakavarga_house: {
    category: 'Strength', description: 'Check SAV score for a house',
    params: { house: _house(), min_score: _number('Min Score', false), max_score: _number('Max Score', false) },
  },
  ashtakavarga_score: {
    category: 'Strength', description: 'Check BAV score for planet in house',
    params: { planet: _planet(), house: _house(), min_score: _number('Min Score') },
  },
  ashtakavarga_transit_score: {
    category: 'Strength', description: 'Check transit Ashtakavarga score',
    params: { planet: _planet(false, true, 'Transit Planet'), house: _house(), min_score: _number('Min Score') },
  },
  vimshopaka_strength: {
    category: 'Strength', description: 'Check Vimshopaka Bala across vargas',
    params: { planet: _planet(), scheme: { type: 'select', multi: false, source: 'vimshopaka_schemes', required: true, label: 'Scheme' }, min_score: _number('Min Score', false), max_score: _number('Max Score', false) },
  },
  shodhana_score: {
    category: 'Strength', description: 'Check Ashtakavarga Shodhana (reduced) score',
    params: { house: _house(), planet: _planet(false, false, 'Planet (optional)'), min_score: _number('Min Score', false), max_score: _number('Max Score', false) },
  },
  vargottama: {
    category: 'Strength', description: 'Check if planet same sign in D1 and D9',
    params: { planet: _planet(false, false) },
  },
  pushkara_navamsha: {
    category: 'Strength', description: 'Check if planet in Pushkara Navamsha',
    params: { planet: _planet(false, false) },
  },
  weighted_dignity_score: {
    category: 'Strength', description: 'Check dignity score meets threshold (0-100)',
    params: { planet: _planet(), min_score: _number('Min Score', false), max_score: _number('Max Score', false) },
  },
  ishta_phala_score: {
    category: 'Strength', description: 'Check Ishta Phala (benefic delivery) meets threshold',
    params: { planet: _planet(), min_score: _number('Min Score', false), chart: _chart() },
  },
  kashta_phala_score: {
    category: 'Strength', description: 'Check Kashta Phala (malefic delivery) meets threshold',
    params: { planet: _planet(), min_score: _number('Min Score', false), chart: _chart() },
  },

  // ── Yoga Conditions ──
  yoga_present: {
    category: 'Yoga', description: 'Check if a specific classical yoga is present',
    params: { yoga: { type: 'select', multi: false, source: 'yogas', required: true, label: 'Yoga' } },
  },
  yoga_gaja_kesari: {
    category: 'Yoga', description: 'Gaja Kesari Yoga (Jupiter in kendra from Moon)',
    params: { chart: _chart() },
  },
  yoga_pancha_mahapurusha: {
    category: 'Yoga', description: 'Pancha Mahapurusha Yoga (planet in own/exalted in kendra)',
    params: { sub_type: { type: 'select', multi: false, source: 'pancha_mahapurusha_types', required: false, label: 'Sub-type' }, chart: _chart() },
  },
  yoga_budha_aditya: {
    category: 'Yoga', description: 'Budha Aditya Yoga (Sun+Mercury, Mercury not combust)',
    params: { chart: _chart(), min_distance: _number('Min Sun-Mercury°', false) },
  },
  yoga_dhana: {
    category: 'Yoga', description: 'Dhana Yoga (wealth house lords in mutual connection)',
    params: { chart: _chart(), min_lords: _number('Min Connected Lords', false) },
  },
  parivartana_yoga: {
    category: 'Yoga', description: 'Parivartana (mutual sign exchange) yoga',
    params: { planet_a: _planet(false, false, 'Planet A'), planet_b: _planet(false, false, 'Planet B'), chart: _chart() },
  },
  neecha_bhanga_raja_yoga: {
    category: 'Yoga', description: 'Neecha Bhanga Raja Yoga (debilitation cancellation)',
    params: { planet: _planet(false, false), chart: _chart() },
  },
  planet_neecha_bhanga: {
    category: 'Yoga', description: 'Check if planet has Neecha Bhanga',
    params: { planet: _planet(), chart: _chart() },
  },

  // ── Nakshatra Conditions ──
  nakshatra_lord_signification: {
    category: 'Nakshatra', description: 'Check signification from nakshatra lord',
    params: { planet: _planet(), signification: _text('Signification') },
  },
  tara_bala_score: {
    category: 'Nakshatra', description: 'Check Tara Bala (nakshatra strength from Moon)',
    params: {
      planet: _planet(),
      is_auspicious: _boolean('Is Auspicious'),
      tara_number: { type: 'select', multi: true, source: 'tara_numbers', required: false, label: 'Tara Number(s)' },
      tara_name: { type: 'select', multi: true, source: 'tara_names', required: false, label: 'Tara Name(s)' },
    },
  },
  nakshatra_quality_check: {
    category: 'Nakshatra', description: 'Check planet nakshatra matches BPHS 7-fold quality',
    params: { planet: _planet(), quality: { type: 'select', multi: true, source: 'nakshatra_quality_types', required: true, label: 'Quality' } },
  },
  visha_mrityu_nakshatra: {
    category: 'Nakshatra', description: 'Check if planet in Visha/Mrityu nakshatra',
    params: { planet: _planet(), category: { type: 'select', multi: false, source: 'visha_mrityu_categories', required: false, default: 'both', label: 'Category' } },
  },
  moon_in_nakshatra: {
    category: 'Nakshatra', description: 'Check if natal Moon in specified nakshatras',
    params: { nakshatras: _nakshatra(true) },
  },
  cusp_in_nakshatra: {
    category: 'Nakshatra', description: 'Check if house cusp in specified nakshatras',
    params: { cusp: _house(false, true, 'House Cusp'), nakshatras: _nakshatra(true) },
  },

  // ── Jaimini Conditions ──
  chara_karaka_planet: {
    category: 'Jaimini', description: 'Check if planet holds a Chara Karaka role',
    params: { karaka: { type: 'select', multi: false, source: 'chara_karakas', required: true, label: 'Karaka Role' }, planet: _planet(true, true, 'Expected Planet(s)') },
  },
  chara_karaka_in_house: {
    category: 'Jaimini', description: 'Check if Chara Karaka occupies specific house(s)',
    params: { karaka: { type: 'select', multi: false, source: 'chara_karakas', required: true, label: 'Karaka Role' }, house: _house(true), chart: _chart() },
  },
  karakamsha_sign: {
    category: 'Jaimini', description: "Check if AK's Navamsa sign matches specified sign(s)",
    params: { sign: _sign(true) },
  },
  chara_dasha_sign: {
    category: 'Jaimini', description: 'Check current Jaimini Chara Dasha MD sign',
    params: { sign: _sign(true) },
  },
  chara_dasha_lord: {
    category: 'Jaimini', description: 'Check current Jaimini Chara Dasha MD lord',
    params: { planet: _planet(true, true, 'Planet(s)') },
  },

  // ── Prashna (Horary) ──
  prashna_moon_in_house: {
    category: 'Prashna', description: "Check Moon's house in Prashna chart",
    params: { house: _house(true) },
  },
  mrityu_bhaga_check: {
    category: 'Prashna', description: 'Check if Lagna/Moon falls in Mrityu Bhaga',
    params: { point: { type: 'select', multi: false, source: 'prashna_points', required: true, label: 'Point' }, is_afflicted: _boolean('Is Afflicted') },
  },

  // ── Special Points ──
  eclipse_in_house: {
    category: 'Special Points', description: 'Check if eclipse falls in specific house(s)',
    params: { house: _house(true, true, 'House(s)') },
  },
  eclipse_conjunct_planet: {
    category: 'Special Points', description: 'Check if eclipse conjoins natal planet',
    params: { planet: _planet(true, true, 'Planet(s)') },
  },

  // ── Utility Conditions ──
  dispositor_chain_ends_in: {
    category: 'Utility', description: 'Check where dispositor chain terminates',
    params: { planet: _planet(), house: _house(true, true, 'House(s)') },
  },
  enemy_conjunction: {
    category: 'Utility', description: 'Check if planet in enemy conjunction in house',
    params: { planet: _planet(), house: _house() },
  },
  planets_in_house_enemies: {
    category: 'Utility', description: 'Check if multiple enemy planets occupy a house',
    params: { house: _house(), min_count: _number('Min Enemy Count') },
  },
  avastha_state: {
    category: 'Utility', description: 'Check planet Avastha (Bala/Kumara/Yuva/Vriddha/Mrita)',
    params: { planet: _planet(), avastha: { type: 'select', multi: true, source: 'avasthas', required: true, label: 'Avastha(s)' }, chart: _chart() },
  },
  gandanta_check: {
    category: 'Utility', description: 'Check if planet at water-fire sign junction',
    params: { planet: _planet(false, false), orb: _number('Orb°', false) },
  },
};


// ---------------------------------------------------------------------------
// A.3 — Category Registry
// ---------------------------------------------------------------------------

export const PRIMITIVE_CATEGORIES = [
  { id: 'Planet',         label: 'Planet Conditions',     icon: 'fa-sun',             color: '#f59e0b' },
  { id: 'Aspect',         label: 'Aspect Conditions',     icon: 'fa-arrows-alt',      color: '#3b82f6' },
  { id: 'House',          label: 'House Conditions',      icon: 'fa-home',            color: '#10b981' },
  { id: 'Dasha',          label: 'Dasha Conditions',      icon: 'fa-clock',           color: '#8b5cf6' },
  { id: 'Transit',        label: 'Transit Conditions',    icon: 'fa-route',           color: '#ef4444' },
  { id: 'Strength',       label: 'Strength Conditions',   icon: 'fa-dumbbell',        color: '#06b6d4' },
  { id: 'Yoga',           label: 'Yoga Conditions',       icon: 'fa-om',              color: '#f97316' },
  { id: 'Nakshatra',      label: 'Nakshatra Conditions',  icon: 'fa-star',            color: '#a855f7' },
  { id: 'Jaimini',        label: 'Jaimini Conditions',    icon: 'fa-dharmachakra',    color: '#ec4899' },
  { id: 'Prashna',        label: 'Prashna (Horary)',      icon: 'fa-question-circle', color: '#14b8a6' },
  { id: 'Special Points', label: 'Special Points',        icon: 'fa-crosshairs',      color: '#64748b' },
  { id: 'Utility',        label: 'Utility Conditions',    icon: 'fa-wrench',          color: '#78716c' },
];

// Category color lookup (fast path)
const _catColorMap = {};
PRIMITIVE_CATEGORIES.forEach(c => { _catColorMap[c.id] = c.color; });


// ---------------------------------------------------------------------------
// A.4 — Data Field Tag Extraction
// ---------------------------------------------------------------------------

/**
 * Recursively walk a RDL rule tree and extract prompt variable tags.
 * Returns array of { tag: string, label: string, color: string }
 */
export function extractDataFieldTags(ruleTree) {
  if (!ruleTree || typeof ruleTree !== 'object') return [];
  const seen = new Set();
  const result = [];
  _walkTree(ruleTree, seen, result);
  return result;
}

function _walkTree(node, seen, result) {
  if (!node || typeof node !== 'object') return;
  const t = node.type;
  if (t === 'AND' || t === 'OR') {
    (node.sub_rules || []).forEach(s => _walkTree(s, seen, result));
    return;
  }
  if (t === 'NOT') {
    (node.sub_rules || []).forEach(s => _walkTree(s, seen, result));
    return;
  }
  // Primitive node → extract tags
  const tags = _extractFromPrimitive(t, node);
  for (const tag of tags) {
    if (!seen.has(tag.tag)) {
      seen.add(tag.tag);
      result.push(tag);
    }
  }
}

function _extractFromPrimitive(type, node) {
  const spec = PRIMITIVE_PARAM_SPECS[type];
  if (!spec) return [];
  const cat = spec.category || 'Utility';
  const color = _catColorMap[cat] || '#8a8f9d';
  const tags = [];

  const _add = (tag, label) => tags.push({ tag, label, color });
  const _lower = (v) => String(v || '').toLowerCase().replace(/\s+/g, '_');
  const _arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);

  // Planet-based primitives
  if (type === 'planet_in_house') {
    _arr(node.planet).forEach(p => _add(`${_lower(p)}_house_position`, `${p}'s house position`));
    _arr(node.house).forEach(h => _add(`house_${h}_occupants`, `House ${h} occupants`));
  } else if (type === 'planet_dignity') {
    _arr(node.planet || [node.planet]).forEach(p => _add(`${_lower(p)}_dignity`, `${p}'s dignity status`));
  } else if (type === 'planet_conjunct') {
    _add(`${_lower(node.planet)}_conjunctions`, `${node.planet}'s conjunctions`);
  } else if (type === 'planet_combust') {
    _add(`${_lower(node.planet)}_combustion`, `${node.planet} combustion status`);
  } else if (type === 'planet_retrograde') {
    _add(`${_lower(node.planet)}_retrograde`, `${node.planet} retrograde status`);
  } else if (type === 'planet_aspects_house') {
    _add(`${_lower(node.planet)}_aspects`, `${node.planet}'s aspects`);
    _arr(node.house).forEach(h => _add(`house_${h}_aspected_by`, `House ${h} aspected by`));
  } else if (type === 'planet_aspects_planet') {
    _add(`${_lower(node.planet)}_aspects`, `${node.planet}'s aspects`);
    _add(`${_lower(node.target)}_aspected_by`, `${node.target} aspected by`);
  } else if (type === 'house_lord_in_house') {
    const h = node.source_house || node.house;
    _add(`house_${h}_lord`, `Lord of house ${h}`);
    _add(`house_${h}_lord_placement`, `House ${h} lord placement`);
  } else if (type === 'house_strength') {
    _add(`house_${node.house}_strength`, `House ${node.house} strength`);
  } else if (type.startsWith('dasha_lord')) {
    const level = node.level || 'mahadasha';
    _add(`${_lower(level)}_lord`, `Current ${level} lord`);
    if (type === 'dasha_lord_in_house') {
      _add(`${_lower(level)}_lord_house`, `${level} lord house placement`);
    } else if (type === 'dasha_lord_aspects_house') {
      _add(`${_lower(level)}_lord_aspects`, `${level} lord aspects`);
    }
  } else if (type === 'dasha_sandhi') {
    _add('dasha_junction_status', 'Dasha junction (sandhi) status');
  } else if (type === 'md_ad_pair_relationship') {
    _add('md_ad_relationship', 'MD-AD pair relationship');
  } else if (type.startsWith('transit_planet')) {
    const p = node.planet;
    _add(`transit_${_lower(p)}_position`, `Transit ${p} position`);
    if (type === 'transit_planet_in_house') {
      _arr(node.house).forEach(h => _add(`house_${h}_transits`, `House ${h} transits`));
    }
  } else if (type === 'saturn_transit_over_moon') {
    _add('sade_sati_status', 'Sade Sati / Dhaiya status');
    _add('natal_moon_sign', 'Natal Moon sign');
  } else if (type === 'double_transit') {
    _add('jupiter_transit_position', 'Transit Jupiter position');
    _add('saturn_transit_position', 'Transit Saturn position');
  } else if (type === 'shadbala_strength') {
    _add(`${_lower(node.planet)}_shadbala`, `${node.planet} Shadbala strength`);
  } else if (type.startsWith('ashtakavarga')) {
    _add(`house_${node.house}_sav`, `House ${node.house} SAV bindus`);
  } else if (type === 'vimshopaka_strength') {
    _add(`${_lower(node.planet)}_vimshopaka`, `${node.planet} Vimshopaka Bala`);
  } else if (type.startsWith('yoga_') || type === 'yoga_present') {
    const y = node.yoga || node.sub_type || type.replace('yoga_', '');
    _add(`${_lower(y)}_yoga_status`, `${y} yoga status`);
  } else if (type === 'parivartana_yoga' || type === 'neecha_bhanga_raja_yoga' || type === 'planet_neecha_bhanga') {
    _add(`${type}_status`, `${type.replace(/_/g, ' ')} status`);
  } else if (type === 'moon_in_nakshatra') {
    _add('moon_nakshatra', 'Moon nakshatra');
  } else if (type.startsWith('chara_karaka')) {
    _add(`${_lower(node.karaka)}_karaka`, `${node.karaka} Chara Karaka`);
  } else if (type === 'karakamsha_sign') {
    _add('karakamsha_sign', 'Karakamsha sign (AK in D9)');
  } else if (type.startsWith('chara_dasha')) {
    _add('chara_dasha_current', 'Current Jaimini Chara Dasha');
  } else if (type === 'planet_in_mks') {
    _add(`${_lower(node.planet)}_mks_status`, `${node.planet} MKS status`);
  } else if (type === 'planet_vargottama') {
    _add(`${_lower(node.planet)}_vargottama`, `${node.planet} Vargottama status`);
  } else if (type === 'planet_gandanta') {
    _add(`${_lower(node.planet)}_gandanta`, `${node.planet} Gandanta status`);
  } else if (type === 'ishta_phala_score') {
    _add(`${_lower(node.planet)}_ishta_phala`, `${node.planet} Ishta Phala`);
  } else if (type === 'kashta_phala_score') {
    _add(`${_lower(node.planet)}_kashta_phala`, `${node.planet} Kashta Phala`);
  } else if (type === 'planet_argala_on_house' || type === 'virodha_argala_on_house') {
    _add(`house_${node.target_house}_argala`, `House ${node.target_house} Argala`);
  } else if (type === 'eclipse_in_house') {
    _add('eclipse_house', 'Eclipse house position');
  } else if (type === 'tara_bala_score') {
    _add(`${_lower(node.planet)}_tara_bala`, `${node.planet} Tara Bala`);
  } else {
    // Generic fallback: use primitive name as tag
    _add(`${type}_result`, `${type.replace(/_/g, ' ')} result`);
  }

  return tags;
}
