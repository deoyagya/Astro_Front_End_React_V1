export interface ReportPlanet {
  name: string;
  house: string;
  status: 'beneficial' | 'afflicted' | 'mixed' | 'key';
  effect: string;
}

export interface ReportType {
  id: string;
  title: string;
  icon: string; // Ionicons name
  desc: string;
  pages: string;
  price: number;
  badge: string;
  highlights: string[];
  planets: ReportPlanet[];
  warnings?: string[];
  remedies: string[];
  footerNote?: string;
}

export const REPORT_CATALOG: ReportType[] = [
  {
    id: 'career',
    title: 'Career & Finance',
    icon: 'briefcase',
    desc: 'In-depth analysis of your professional path, growth periods, and financial potential based on 10th house, 2nd house, and planetary periods.',
    pages: '25+',
    price: 1499,
    badge: 'Best Seller',
    highlights: [
      'Complete 10th house career analysis with planetary influences',
      'Financial growth windows based on Dasha periods (2024-2034)',
      'Professional strengths & natural career inclinations',
      'Business vs. service aptitude assessment',
      'Wealth accumulation periods & 2nd/11th house analysis',
      'Timing guidance for job changes, promotions & ventures',
    ],
    planets: [
      { name: 'Sun', house: '10th', status: 'beneficial', effect: 'Authority, leadership & government favour' },
      { name: 'Saturn', house: '10th', status: 'afflicted', effect: 'Career discipline, delays & ultimate success' },
      { name: 'Jupiter', house: '2nd', status: 'beneficial', effect: 'Financial growth, wealth & family prosperity' },
      { name: 'Mercury', house: '10th', status: 'beneficial', effect: 'Communication skills & business acumen' },
      { name: 'Mars', house: '6th', status: 'afflicted', effect: 'Competition handling & workplace dynamics' },
      { name: 'Venus', house: '11th', status: 'beneficial', effect: 'Income through arts, luxury & partnerships' },
      { name: 'Rahu', house: '10th', status: 'mixed', effect: 'Unconventional career paths & foreign connections' },
      { name: 'Ketu', house: '4th', status: 'mixed', effect: 'Detachment from comfort, spiritual workplace' },
    ],
    warnings: [
      'Saturn in 10th may cause career delays & setbacks between ages 28-35',
      "Rahu's influence can create confusion about true career calling",
      'Mars in 6th indicates workplace conflicts & intense competition',
      '2nd house affliction may cause financial instability in early career',
    ],
    remedies: [
      'Surya Namaskar & Aditya Hridayam for career authority',
      'Shani mantras & Saturday practices for steady progress',
      'Lakshmi-Kubera prayers for financial abundance',
      'Gemstone recommendations based on your specific chart',
      'Career-specific yantra & ritual guidance',
    ],
    footerNote: 'This is a sample preview. The full report includes personalized analysis based on your exact birth chart with complete remedies, timing windows, and actionable career guidance.',
  },
  {
    id: 'love',
    title: 'Love & Marriage',
    icon: 'heart',
    desc: 'Detailed compatibility analysis, marriage timing, relationship strengths, and challenges based on 7th house, Venus, and Jupiter.',
    pages: '30+',
    price: 1799,
    badge: '',
    highlights: [
      '7th house relationship analysis',
      'Venus & marriage timing windows',
      'Manglik dosha assessment',
    ],
    planets: [
      { name: 'Venus', house: '7th', status: 'key', effect: 'Love & relationship harmony' },
      { name: 'Mars', house: '1st', status: 'key', effect: 'Manglik dosha evaluation' },
      { name: 'Jupiter', house: '7th', status: 'key', effect: 'Marriage blessings & timing' },
    ],
    remedies: [
      'Venus strengthening for harmony',
      'Manglik dosha remedies if applicable',
      'Jupiter mantras for marriage timing',
    ],
  },
  {
    id: 'education',
    title: 'Education & Intelligence',
    icon: 'school',
    desc: 'Analysis of learning abilities, academic success periods, and intellectual strengths through 5th house, Mercury, and Jupiter influences.',
    pages: '20+',
    price: 1299,
    badge: '',
    highlights: [
      '5th house intellect analysis',
      'Mercury & learning abilities',
      'Academic timing windows',
    ],
    planets: [
      { name: 'Mercury', house: '5th', status: 'key', effect: 'Intellectual capacity' },
      { name: 'Jupiter', house: '9th', status: 'key', effect: 'Higher education & wisdom' },
      { name: 'Moon', house: '4th', status: 'key', effect: 'Memory & emotional intelligence' },
    ],
    remedies: [
      'Mercury mantras for concentration',
      'Saraswati prayers for knowledge',
      'Study during favorable planetary hours',
    ],
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    icon: 'leaf',
    desc: 'Understand health predispositions, vitality periods, and preventive measures through 6th house, lagna, and planetary influences.',
    pages: '22+',
    price: 1399,
    badge: 'New',
    highlights: [
      '6th house health analysis',
      'Lagna vitality assessment',
      'Preventive guidance periods',
    ],
    planets: [
      { name: 'Sun', house: '1st', status: 'key', effect: 'Vitality & constitution' },
      { name: 'Moon', house: '4th', status: 'key', effect: 'Mental & emotional wellness' },
      { name: 'Mars', house: '6th', status: 'key', effect: 'Physical strength & energy' },
    ],
    remedies: [
      'Sun mantras for vitality',
      'Pranayama for Moon balance',
      'Dietary guidance per Ayurvedic constitution',
    ],
  },
  {
    id: 'spiritual',
    title: 'Spiritual Growth',
    icon: 'sparkles',
    desc: 'Explore your spiritual path, past life indicators, and evolution through 12th house, Ketu, and spiritual planetary influences.',
    pages: '28+',
    price: 1599,
    badge: '',
    highlights: [
      '12th house spiritual analysis',
      'Ketu & past life indicators',
      'Meditation & dharma path',
    ],
    planets: [
      { name: 'Ketu', house: '12th', status: 'key', effect: 'Spiritual liberation path' },
      { name: 'Jupiter', house: '9th', status: 'key', effect: 'Guru grace & dharma' },
      { name: 'Moon', house: '12th', status: 'key', effect: 'Intuition & inner wisdom' },
    ],
    remedies: [
      'Ketu mantras for spiritual clarity',
      'Meditation during favorable nakshatras',
      'Guru-related prayers & practices',
    ],
  },
  {
    id: 'family',
    title: 'Family & Children',
    icon: 'home',
    desc: 'Analysis of family harmony, child timing, and relationships with parents through 4th house, 5th house, and benefic planets.',
    pages: '26+',
    price: 1499,
    badge: '',
    highlights: [
      '4th house family harmony',
      '5th house children & progeny',
      'Parent relationship analysis',
    ],
    planets: [
      { name: 'Moon', house: '4th', status: 'key', effect: 'Mother & domestic happiness' },
      { name: 'Jupiter', house: '5th', status: 'key', effect: 'Children & progeny blessings' },
      { name: 'Venus', house: '4th', status: 'key', effect: 'Domestic comfort & harmony' },
    ],
    remedies: [
      'Moon mantras for family peace',
      'Jupiter prayers for progeny blessings',
      'Venus remedies for domestic harmony',
    ],
  },
];

export const BUNDLE_ORIGINAL = REPORT_CATALOG.reduce((s, r) => s + r.price, 0);
export const BUNDLE_DISCOUNT = 0.4;
export const BUNDLE_PRICE = Math.round(BUNDLE_ORIGINAL * (1 - BUNDLE_DISCOUNT));

export const PLANET_STATUS_COLORS: Record<string, string> = {
  beneficial: '#2ed573',
  afflicted: '#ff6b6b',
  mixed: '#ffb454',
  key: '#43d0ff',
};
