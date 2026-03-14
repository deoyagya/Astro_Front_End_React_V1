/**
 * Report Landing Page Configs — SEO-rich, high-conversion content for 6 report types.
 * Each config drives the ReportLandingPage component.
 */

const SHARED_WHY_CHOOSE = [
  {
    icon: 'fa-microchip',
    title: 'Swiss Ephemeris Precision',
    description: 'Planetary positions calculated to arc-second accuracy using the same engine trusted by professional astronomers worldwide.',
  },
  {
    icon: 'fa-book-open',
    title: 'Classical Jyotish Sources',
    description: 'Every interpretation is grounded in BPHS, Phaladeepika, and Jaimini Sutras — no generic sun-sign astrology.',
  },
  {
    icon: 'fa-brain',
    title: 'AI Cross-Validated',
    description: 'Dual-LLM pipeline produces interpretations, then a reviewer AI validates claims against your actual chart data.',
  },
  {
    icon: 'fa-gem',
    title: 'Personalized Remedies',
    description: 'Gemstone safety checks, mantra prescriptions, and lifestyle guidance tailored to your specific planetary configuration.',
  },
];

const SHARED_FAQS = [
  {
    q: 'How accurate is the birth chart calculation?',
    a: 'We use Swiss Ephemeris — the gold standard in astronomical computation — with Lahiri ayanamsa for sidereal calculations. Planetary positions are accurate to within arc-seconds. Your chart is computed for your exact birth time and coordinates.',
  },
  {
    q: 'Do I need my exact birth time?',
    a: 'Yes, accurate birth time is important for precise house divisions and Dasha calculations. If you are unsure, use the closest time you know. Even a 15-minute difference can shift house cusps.',
  },
  {
    q: 'How long does it take to receive my report?',
    a: 'Reports are generated within 2-4 hours of placing your order. Complex reports with AI interpretation may take up to 24 hours. You\'ll receive an email notification when ready.',
  },
  {
    q: 'Can I get a refund if unsatisfied?',
    a: 'We offer a 100% satisfaction guarantee. If you feel the report doesn\'t meet your expectations, contact us within 7 days for a full refund.',
  },
  {
    q: 'What Vedic system do you use?',
    a: 'We follow the Parashari system (BPHS — Brihat Parashara Hora Shastra) with Lahiri ayanamsa. Vimshottari Dasha is used for timing predictions. Divisional charts (D1 through D60) are computed for detailed analysis.',
  },
];

// ─── CAREER & FINANCE ───────────────────────────────────────────

export const careerConfig = {
  slug: 'career',
  icon: 'fa-briefcase',
  iconColor: '#ffa502',
  title: 'Career & Finance Report',
  tagline: 'Discover your ideal profession, peak earning years, and the planetary timing that can transform your career trajectory.',
  metaDescription: 'Personalized Vedic astrology career report — 10th house analysis, professional timing windows, financial potential, and classical remedies.',
  priceCents: 1999,
  originalPriceCents: 3499,
  pages: 25,
  deliveryHours: 4,

  insideItems: [
    {
      icon: 'fa-compass',
      title: 'Career Direction Analysis',
      description: 'Deep dive into your 10th house lord, Dasamsa (D10) chart, and planetary yogas that shape your professional destiny.',
      highlights: ['Ideal career fields per Nakshatra lord', 'Business vs. service aptitude', 'Leadership potential assessment'],
    },
    {
      icon: 'fa-chart-line',
      title: 'Financial Growth Timeline',
      description: 'Year-by-year analysis of wealth-building Dashas and transit windows for maximum financial growth.',
      highlights: ['2nd and 11th house wealth analysis', 'Dhana Yogas identification', 'Investment timing windows'],
    },
    {
      icon: 'fa-calendar-check',
      title: 'Promotion & Job Change Windows',
      description: 'Precise timing for career milestones — when to push for promotions, switch jobs, or launch ventures.',
      highlights: ['Saturn return career shifts', 'Jupiter transit opportunities', 'Rahu-Ketu axis career changes'],
    },
    {
      icon: 'fa-exclamation-triangle',
      title: 'Risk & Obstacle Analysis',
      description: 'Identify challenging periods and planetary afflictions that could impact your career and finances.',
      highlights: ['Sade Sati career impact', 'Mars-Saturn conflicts', 'Kemadruma & other doshas'],
    },
    {
      icon: 'fa-gem',
      title: 'Career Remedies',
      description: 'Actionable Vedic remedies to strengthen your professional planets and remove career obstacles.',
      highlights: ['Gemstone recommendations with safety checks', 'Mantra prescriptions', 'Charity and lifestyle modifications'],
    },
    {
      icon: 'fa-users',
      title: 'Boss & Colleague Dynamics',
      description: 'Understand how your 6th, 7th, and 10th house interactions shape workplace relationships.',
      highlights: ['Authority figure compatibility', 'Partnership potential', 'Team dynamics analysis'],
    },
  ],

  sampleSnapshot: {
    title: 'Career & Finance Analysis',
    subtitle: 'Sample — Born 15 Aug 1990, Mumbai',
    score: 78,
    scoreLabel: 'Score',
    scoreColor: '#2ed573',
    metrics: [
      { label: 'Career Strength', value: 82, color: '#2ed573' },
      { label: 'Wealth Potential', value: 71, color: '#ffa502' },
      { label: 'Business Aptitude', value: 65, color: '#7b5bff' },
      { label: 'Authority Yoga', value: 88, color: '#2ed573' },
    ],
    findings: [
      { type: 'positive', text: 'Strong Rajayoga — Sun exalted in 10th house with Jupiter aspect' },
      { type: 'positive', text: 'Dhana Yoga present — 2nd lord conjunct 11th lord in Kendra' },
      { type: 'warning', text: 'Saturn\'s 7.5 year Sade Sati begins 2026 — expect career restructuring' },
      { type: 'neutral', text: 'Mercury Dasha starting 2027 — favorable for communication-based careers' },
    ],
  },

  features: [
    { icon: 'fa-chess-king', title: '10th House Deep Dive', description: 'Complete analysis of your house of profession, including lord placement, aspects, and conjunctions.', color: '#ffa502' },
    { icon: 'fa-chart-bar', title: 'D10 Dasamsa Chart', description: 'Dedicated divisional chart for career — reveals the fine details of your professional path.', color: '#2ed573' },
    { icon: 'fa-coins', title: 'Wealth Combinations', description: 'All Dhana Yogas, Lakshmi Yogas, and financial combinations identified and scored.', color: '#eccc68' },
    { icon: 'fa-clock', title: 'Timing Windows', description: 'Precise Dasha + Transit windows for career moves — 10 years forward.', color: '#70a1ff' },
    { icon: 'fa-shield-alt', title: 'Risk Assessment', description: 'Identify challenging periods, Sade Sati impact, and planetary conflicts.', color: '#ff4757' },
    { icon: 'fa-pray', title: 'Vedic Remedies', description: 'Gemstones, mantras, charity, and lifestyle adjustments for career growth.', color: '#a29bfe' },
  ],

  planetsCovered: ['Sun (Authority)', 'Saturn (Discipline)', 'Mercury (Communication)', 'Jupiter (Expansion)', 'Mars (Drive)', 'Rahu (Ambition)', 'Venus (Luxury)'],
  housesCovered: ['1st (Self)', '2nd (Wealth)', '6th (Competition)', '7th (Partnership)', '10th (Career)', '11th (Income)', 'D10 Dasamsa'],

  testimonials: [
    { name: 'Rahul M.', location: 'Mumbai, India', quote: 'The career report predicted my promotion within 3 months. The timing windows were incredibly accurate — I got the exact month right!', highlight: 'Promotion Predicted' },
    { name: 'Sneha K.', location: 'Bangalore, India', quote: 'I was confused between IT and management. The D10 analysis clearly showed management was my calling. Got into IIM the same year.', highlight: 'Career Clarity' },
    { name: 'James R.', location: 'London, UK', quote: 'As a skeptic, I was amazed. The report identified my entrepreneurial potential and the exact year I should launch — it worked.', highlight: 'Business Launch' },
  ],

  faqs: [
    ...SHARED_FAQS,
    { q: 'Will the report tell me exactly which job to take?', a: 'The report identifies your ideal career fields, professional strengths, and timing windows based on your chart. It provides Vedic guidance on the types of roles and industries aligned with your planets, but final decisions are always yours.' },
    { q: 'I\'m already employed. Is this report still useful?', a: 'Absolutely. The report reveals upcoming promotion windows, salary jump periods, and whether a job change or business venture is supported by your planetary cycles. It\'s especially valuable for timing career moves.' },
  ],

  whyChoose: SHARED_WHY_CHOOSE,
};

// ─── LOVE & MARRIAGE ────────────────────────────────────────────

export const loveConfig = {
  slug: 'love',
  icon: 'fa-heart',
  iconColor: '#ff6b81',
  title: 'Love & Marriage Report',
  tagline: 'Understand your relationship karma, ideal partner qualities, and the cosmic timing for love, marriage, and lasting partnership.',
  metaDescription: 'Vedic astrology love and marriage report — 7th house analysis, Venus strength, Manglik check, compatibility insights, and marriage timing.',
  priceCents: 2499,
  originalPriceCents: 4499,
  pages: 30,
  deliveryHours: 4,

  insideItems: [
    {
      icon: 'fa-ring',
      title: 'Marriage Timing Analysis',
      description: 'Precise Dasha and transit windows for marriage — when the stars align for partnership.',
      highlights: ['Jupiter transit over 7th house', 'Venus Dasha/Antardasha periods', 'Navamsa activation windows'],
    },
    {
      icon: 'fa-venus-mars',
      title: 'Partner Profile',
      description: 'Vedic indicators of your ideal partner — their appearance, nature, profession, and direction of origin.',
      highlights: ['7th lord placement analysis', 'Navamsa partner indicators', 'Upapada Lagna assessment'],
    },
    {
      icon: 'fa-balance-scale',
      title: 'Relationship Karma',
      description: 'Past-life relationship patterns from Rahu-Ketu axis and 12th house analysis.',
      highlights: ['Karmic debts in love', 'Soul mate vs. karmic partner', 'Venus combustion effects'],
    },
    {
      icon: 'fa-exclamation-circle',
      title: 'Manglik & Dosha Check',
      description: 'Complete Mangal Dosha analysis with severity scoring and cancellation conditions.',
      highlights: ['Mars in 1st/4th/7th/8th/12th', 'Dosha cancellation check', 'Remedies if Manglik'],
    },
    {
      icon: 'fa-chart-pie',
      title: 'D9 Navamsa Deep Dive',
      description: 'The marriage chart — reveals the quality and nature of your married life.',
      highlights: ['Navamsa lagna lord strength', 'Venus dignity in D9', 'Post-marriage life quality'],
    },
    {
      icon: 'fa-gem',
      title: 'Love Remedies',
      description: 'Strengthen Venus and 7th house through gemstones, mantras, and Vedic practices.',
      highlights: ['Diamond/Opal suitability check', 'Shukra mantra prescription', 'Friday fasting guidance'],
    },
  ],

  sampleSnapshot: {
    title: 'Love & Marriage Analysis',
    subtitle: 'Sample — Born 22 Mar 1992, Delhi',
    score: 72,
    scoreLabel: 'Score',
    scoreColor: '#ff6b81',
    metrics: [
      { label: 'Venus Strength', value: 68, color: '#ff6b81' },
      { label: 'Marriage Yoga', value: 85, color: '#2ed573' },
      { label: 'Partner Quality', value: 76, color: '#7b5bff' },
      { label: 'Manglik Status', value: 30, color: '#ff4757' },
    ],
    findings: [
      { type: 'positive', text: 'Strong marriage yoga — Jupiter aspects 7th house from 1st' },
      { type: 'positive', text: 'Marriage window active 2026-2027 — Venus Mahadasha + Jupiter transit' },
      { type: 'warning', text: 'Mild Manglik Dosha — Mars in 4th house (partially cancelled by Jupiter aspect)' },
      { type: 'neutral', text: 'Partner likely from professional field — 7th lord in 10th house' },
    ],
  },

  features: [
    { icon: 'fa-heart', title: '7th House Analysis', description: 'Complete analysis of the house of marriage, partnership, and spouse characteristics.', color: '#ff6b81' },
    { icon: 'fa-moon', title: 'Navamsa Insights', description: 'D9 chart reveals married life quality, spouse nature, and post-marriage changes.', color: '#dfe6e9' },
    { icon: 'fa-fire', title: 'Manglik Assessment', description: 'Full Mars dosha check with cancellation conditions and severity scoring.', color: '#ff4757' },
    { icon: 'fa-clock', title: 'Marriage Timing', description: 'Year and month-level windows for marriage based on Dasha + transits.', color: '#70a1ff' },
    { icon: 'fa-user-friends', title: 'Compatibility Factors', description: 'What to look for in a partner based on your Nakshatra and 7th lord.', color: '#2ed573' },
    { icon: 'fa-pray', title: 'Love Remedies', description: 'Venus strengthening through gemstones, mantras, and classical remedies.', color: '#a29bfe' },
  ],

  planetsCovered: ['Venus (Love)', 'Jupiter (Marriage)', 'Mars (Passion)', 'Moon (Emotions)', 'Rahu (Unconventional)', 'Ketu (Past Life)', 'Saturn (Commitment)'],
  housesCovered: ['1st (Self)', '5th (Romance)', '7th (Marriage)', '8th (Intimacy)', '12th (Bed Pleasures)', 'D9 Navamsa', 'Upapada Lagna'],

  testimonials: [
    { name: 'Priya & Ankit', location: 'Delhi, India', quote: 'The report predicted our marriage timing within 2 months of accuracy. The partner description matched my husband perfectly!', highlight: 'Timing Accurate' },
    { name: 'Meera S.', location: 'Chennai, India', quote: 'I was worried about Manglik Dosha. The report showed it was cancelled and explained why. Got married peacefully at 28 as predicted.', highlight: 'Manglik Resolved' },
    { name: 'David L.', location: 'Toronto, Canada', quote: 'The Navamsa analysis was eye-opening. It described the dynamics of my relationship with scary accuracy.', highlight: 'D9 Insight' },
  ],

  faqs: [
    ...SHARED_FAQS,
    { q: 'I am already married. Is this report useful?', a: 'Yes! The report covers married life quality, relationship timing cycles, and remedies to strengthen your partnership. The Navamsa analysis is especially relevant for understanding post-marriage dynamics.' },
    { q: 'Does it check for Manglik Dosha?', a: 'Yes, comprehensive Mangal Dosha analysis including all classical positions (1st, 4th, 7th, 8th, 12th houses), cancellation conditions per BPHS, severity scoring, and specific remedies if applicable.' },
  ],

  whyChoose: SHARED_WHY_CHOOSE,
};

// ─── EDUCATION & INTELLIGENCE ───────────────────────────────────

export const educationConfig = {
  slug: 'education',
  icon: 'fa-graduation-cap',
  iconColor: '#70a1ff',
  title: 'Education & Intelligence Report',
  tagline: 'Unlock your intellectual potential — ideal study fields, competitive exam timing, and the planetary blueprint of your learning style.',
  metaDescription: 'Vedic astrology education report — 5th house analysis, Mercury-Jupiter strength, academic timing, competitive exam windows, and study remedies.',
  priceCents: 1499,
  originalPriceCents: 2999,
  pages: 20,
  deliveryHours: 4,

  insideItems: [
    {
      icon: 'fa-brain',
      title: 'Intellectual Blueprint',
      description: 'Mercury, Jupiter, and 5th house analysis reveals your learning style, memory power, and intellectual strengths.',
      highlights: ['Analytical vs. creative intelligence', 'Language aptitude', 'Research potential'],
    },
    {
      icon: 'fa-university',
      title: 'Ideal Study Fields',
      description: 'Which academic streams align with your planetary configuration — science, arts, commerce, or technology.',
      highlights: ['STEM vs. humanities indicators', 'Professional degree suitability', 'Higher education abroad yoga'],
    },
    {
      icon: 'fa-trophy',
      title: 'Competitive Exam Windows',
      description: 'Precise Dasha and transit timing for exam success — UPSC, CAT, GATE, JEE, NEET, and beyond.',
      highlights: ['Mercury-Jupiter activation periods', 'Saturn reward windows', 'Rahu-driven breakthrough timing'],
    },
    {
      icon: 'fa-plane',
      title: 'Foreign Education Yoga',
      description: 'Analysis of 9th and 12th house for overseas study opportunities and scholarship potential.',
      highlights: ['Rahu in 9th/12th analysis', 'Visa timing windows', 'Study abroad success indicators'],
    },
    {
      icon: 'fa-lightbulb',
      title: 'Focus & Concentration',
      description: 'Planetary factors affecting attention, focus, and exam stress — with remedies to boost mental clarity.',
      highlights: ['Moon stability for focus', 'Ketu concentration effects', 'Mercury retrograde study impact'],
    },
    {
      icon: 'fa-gem',
      title: 'Academic Remedies',
      description: 'Boost intellectual planets through gemstones, Saraswati mantras, and classical Vedic practices.',
      highlights: ['Emerald for Mercury', 'Yellow Sapphire for Jupiter', 'Saraswati Vandana prescription'],
    },
  ],

  sampleSnapshot: {
    title: 'Education & Intelligence Analysis',
    subtitle: 'Sample — Born 5 Jun 1998, Jaipur',
    score: 81,
    scoreLabel: 'Score',
    scoreColor: '#70a1ff',
    metrics: [
      { label: 'Mercury Strength', value: 85, color: '#2ed573' },
      { label: 'Jupiter Wisdom', value: 72, color: '#eccc68' },
      { label: 'Focus & Memory', value: 78, color: '#7b5bff' },
      { label: 'Exam Success', value: 88, color: '#2ed573' },
    ],
    findings: [
      { type: 'positive', text: 'Vidya Yoga present — Mercury conjunct Jupiter in 5th house' },
      { type: 'positive', text: 'Strong competitive exam window 2026 — Rahu-Mercury Dasha active' },
      { type: 'warning', text: 'Saturn aspecting 5th house — may need extra effort in theoretical subjects' },
      { type: 'neutral', text: 'Technical and analytical fields strongly favored — Mars in 3rd house' },
    ],
  },

  features: [
    { icon: 'fa-brain', title: '5th House Analysis', description: 'The house of intelligence — complete planetary influence assessment.', color: '#70a1ff' },
    { icon: 'fa-mercury', title: 'Mercury Assessment', description: 'Budha\'s strength, aspects, and dignity determine communication and analytical ability.', color: '#2ed573' },
    { icon: 'fa-star', title: 'Jupiter Wisdom', description: 'Guru\'s placement reveals higher learning potential and teaching ability.', color: '#eccc68' },
    { icon: 'fa-clock', title: 'Exam Timing', description: 'Precise windows for competitive exam success based on Dasha + transits.', color: '#ffa502' },
    { icon: 'fa-plane', title: 'Foreign Education', description: '9th-12th house analysis for overseas study potential.', color: '#a29bfe' },
    { icon: 'fa-pray', title: 'Study Remedies', description: 'Saraswati mantras, gemstones, and lifestyle changes to boost academics.', color: '#ff6b81' },
  ],

  planetsCovered: ['Mercury (Intellect)', 'Jupiter (Wisdom)', 'Moon (Memory)', 'Ketu (Focus)', 'Rahu (Innovation)', 'Sun (Authority)', 'Saturn (Discipline)'],
  housesCovered: ['2nd (Speech)', '3rd (Skill)', '4th (Education)', '5th (Intelligence)', '9th (Higher Learning)', '12th (Foreign)', 'D24 Chaturvimsamsa'],

  testimonials: [
    { name: 'Aarav P.', location: 'Kota, India', quote: 'The report said my strongest exam window was Nov 2025. I cleared JEE Advanced that exact month. Unbelievable accuracy.', highlight: 'JEE Cleared' },
    { name: 'Kavya D.', location: 'Hyderabad, India', quote: 'Was torn between medicine and engineering. The 5th house analysis clearly showed medical aptitude. Now in AIIMS.', highlight: 'Stream Clarity' },
    { name: 'Rohan T.', location: 'Pune, India', quote: 'The Saraswati mantra and emerald recommendation genuinely helped my concentration during CAT prep.', highlight: 'Remedies Worked' },
  ],

  faqs: [
    ...SHARED_FAQS,
    { q: 'I\'m a working professional. Is this report useful for me?', a: 'Yes! The report covers lifelong learning patterns, skill development timing, and certification/exam windows. It\'s valuable whether you\'re a student or a professional seeking career-boosting qualifications.' },
    { q: 'Can it predict specific exam results?', a: 'The report identifies favorable windows for exam success based on planetary periods and transits. It cannot guarantee specific results, but it shows when your intellectual planets are strongest — the ideal time to attempt competitive exams.' },
  ],

  whyChoose: SHARED_WHY_CHOOSE,
};

// ─── HEALTH & WELLNESS ──────────────────────────────────────────

export const healthConfig = {
  slug: 'health',
  icon: 'fa-heartbeat',
  iconColor: '#ff4757',
  title: 'Health & Wellness Report',
  tagline: 'Map your physical constitution, identify vulnerable periods, and take preventive action with classical Ayurvedic-Jyotish guidance.',
  metaDescription: 'Vedic astrology health report — Lagna strength, 6th/8th house analysis, dosha constitution, disease timing, and Ayurvedic-Jyotish remedies.',
  priceCents: 1799,
  originalPriceCents: 3499,
  pages: 25,
  deliveryHours: 4,

  insideItems: [
    {
      icon: 'fa-dna',
      title: 'Constitutional Analysis',
      description: 'Your Ayurvedic Prakriti (Vata/Pitta/Kapha) derived from Lagna lord, Moon sign, and planetary dominance.',
      highlights: ['Elemental balance assessment', 'Dosha constitution mapping', 'Metabolic type indicators'],
    },
    {
      icon: 'fa-stethoscope',
      title: 'Vulnerable Body Areas',
      description: 'Each zodiac sign governs specific body parts. Identify areas needing attention from afflicted houses.',
      highlights: ['Sign-to-body mapping', 'Afflicted planet organ links', '6th and 8th house analysis'],
    },
    {
      icon: 'fa-calendar-times',
      title: 'Health Risk Windows',
      description: 'Dasha periods and transits that may trigger health challenges — with advance warning.',
      highlights: ['Sade Sati health impact', 'Mars-Saturn affliction periods', 'Eclipse sensitivity windows'],
    },
    {
      icon: 'fa-apple-alt',
      title: 'Dietary Guidance',
      description: 'Ayurvedic food recommendations based on your planetary constitution and current Dasha.',
      highlights: ['Planet-specific food lists', 'Fasting recommendations', 'Seasonal diet adjustments'],
    },
    {
      icon: 'fa-spa',
      title: 'Mental Wellness',
      description: 'Moon, Mercury, and 4th house analysis for emotional resilience and mental health indicators.',
      highlights: ['Stress vulnerability periods', 'Moon stability assessment', 'Anxiety and sleep patterns'],
    },
    {
      icon: 'fa-gem',
      title: 'Health Remedies',
      description: 'Gemstone therapy, Ayurvedic herbs, mantras, and lifestyle modifications for vitality.',
      highlights: ['Ruby for heart vitality (Sun)', 'Coral for blood & immunity (Mars)', 'Maha Mrityunjaya Mantra'],
    },
  ],

  sampleSnapshot: {
    title: 'Health & Wellness Analysis',
    subtitle: 'Sample — Born 10 Dec 1985, Patna',
    score: 69,
    scoreLabel: 'Score',
    scoreColor: '#ffa502',
    metrics: [
      { label: 'Lagna Strength', value: 74, color: '#2ed573' },
      { label: 'Vitality Index', value: 65, color: '#ffa502' },
      { label: 'Mental Wellness', value: 72, color: '#7b5bff' },
      { label: 'Longevity Yoga', value: 80, color: '#2ed573' },
    ],
    findings: [
      { type: 'positive', text: 'Ayur Yoga present — strong lagna lord with Jupiter aspect indicates good longevity' },
      { type: 'warning', text: 'Mars afflicting 6th house — watch for digestive issues and inflammation' },
      { type: 'warning', text: 'Sade Sati phase 2026-2028 — increased stress on joints and nervous system' },
      { type: 'neutral', text: 'Pitta-Vata constitution — benefit from cooling foods and regular routine' },
    ],
  },

  features: [
    { icon: 'fa-shield-alt', title: 'Lagna Vitality', description: 'Ascendant strength determines your overall physical constitution and resilience.', color: '#ff4757' },
    { icon: 'fa-lungs', title: '6th House Analysis', description: 'The house of disease — which afflictions to watch for and when.', color: '#ffa502' },
    { icon: 'fa-skull-crossbones', title: '8th House Insight', description: 'Chronic conditions, surgery indications, and transformation health events.', color: '#636e72' },
    { icon: 'fa-clock', title: 'Health Timing', description: 'Vulnerable periods and recovery windows mapped to Dasha cycles.', color: '#70a1ff' },
    { icon: 'fa-leaf', title: 'Ayurvedic Sync', description: 'Planetary constitution linked to Ayurvedic dosha for holistic wellness.', color: '#2ed573' },
    { icon: 'fa-pray', title: 'Health Remedies', description: 'Gemstones, mantras, herbs, and lifestyle adjustments for vitality.', color: '#a29bfe' },
  ],

  planetsCovered: ['Sun (Vitality)', 'Moon (Mind)', 'Mars (Blood)', 'Saturn (Bones)', 'Mercury (Nerves)', 'Ketu (Immunity)', 'Rahu (Chronic)'],
  housesCovered: ['1st (Body)', '6th (Disease)', '8th (Chronic)', '12th (Hospitalization)', 'D30 Trimsamsa', 'Badhaka House'],

  testimonials: [
    { name: 'Dr. Sanjay R.', location: 'Lucknow, India', quote: 'As a physician, I was impressed by the accuracy. The report identified my knee weakness (Saturn in 10th) years before it manifested.', highlight: 'MD Verified' },
    { name: 'Ananya B.', location: 'Kolkata, India', quote: 'The Ayurvedic diet recommendations transformed my digestion. The planetary food guidance was specific and actionable.', highlight: 'Diet Helped' },
    { name: 'Vikram S.', location: 'Dubai, UAE', quote: 'The stress vulnerability window was spot on. I took preventive measures and sailed through a tough Saturn period.', highlight: 'Prevention Worked' },
  ],

  faqs: [
    ...SHARED_FAQS,
    { q: 'Is this a substitute for medical advice?', a: 'No. This report provides Vedic astrological health insights for awareness and preventive guidance only. Always consult qualified medical professionals for health concerns. The report complements — never replaces — medical advice.' },
    { q: 'How can planets affect health?', a: 'In Vedic astrology, each planet governs specific body systems (Sun = heart, Moon = mind, Mars = blood, etc.). When these planets are afflicted by aspect or conjunction, the corresponding body area may be vulnerable during specific Dasha periods.' },
  ],

  whyChoose: SHARED_WHY_CHOOSE,
};

// ─── SPIRITUAL GROWTH ───────────────────────────────────────────

export const spiritualConfig = {
  slug: 'spiritual',
  icon: 'fa-om',
  iconColor: '#a29bfe',
  title: 'Spiritual Growth Report',
  tagline: 'Discover your soul\'s purpose, past-life karma patterns, and the planetary blueprint guiding your spiritual evolution.',
  metaDescription: 'Vedic astrology spiritual report — 12th house, Ketu analysis, Moksha houses, past-life karma, meditation guidance, and spiritual timing.',
  priceCents: 1999,
  originalPriceCents: 3999,
  pages: 25,
  deliveryHours: 4,

  insideItems: [
    {
      icon: 'fa-infinity',
      title: 'Soul Purpose (Dharma)',
      description: 'Your Atmakaraka, Sun placement, and 9th house reveal the deeper purpose behind this incarnation.',
      highlights: ['Atmakaraka planet identification', 'Dharma trikon analysis (1-5-9)', 'Life mission indicators'],
    },
    {
      icon: 'fa-yin-yang',
      title: 'Past-Life Karma',
      description: 'Rahu-Ketu axis analysis reveals karmic debts, recurring patterns, and soul lessons.',
      highlights: ['Rahu desires vs. Ketu detachment', 'Karmic debt indicators', '12th house past-life residue'],
    },
    {
      icon: 'fa-peace',
      title: 'Moksha Potential',
      description: '4th, 8th, and 12th house (Moksha trikon) analysis reveals your liberation potential.',
      highlights: ['Ketu in Moksha houses', 'Jupiter\'s grace indicators', 'Spiritual liberation timing'],
    },
    {
      icon: 'fa-dharmachakra',
      title: 'Meditation & Practice Guide',
      description: 'Which spiritual practices align with your planetary configuration — yoga, meditation, mantra, or devotion.',
      highlights: ['Bhakti vs. Jnana vs. Karma path', 'Ideal meditation techniques', 'Mantra siddhi potential'],
    },
    {
      icon: 'fa-calendar-star',
      title: 'Spiritual Awakening Windows',
      description: 'Dasha periods and transits that trigger spiritual breakthroughs and consciousness shifts.',
      highlights: ['Ketu Dasha spiritual acceleration', 'Jupiter transit blessings', '12th house activation periods'],
    },
    {
      icon: 'fa-gem',
      title: 'Spiritual Remedies',
      description: 'Deity worship, pilgrimage recommendations, and spiritual practices aligned with your chart.',
      highlights: ['Ishta Devata identification', 'Pilgrimage site recommendations', 'Spiritual gemstone guidance'],
    },
  ],

  sampleSnapshot: {
    title: 'Spiritual Growth Analysis',
    subtitle: 'Sample — Born 1 Jan 1980, Varanasi',
    score: 85,
    scoreLabel: 'Score',
    scoreColor: '#a29bfe',
    metrics: [
      { label: 'Moksha Potential', value: 88, color: '#a29bfe' },
      { label: 'Ketu Strength', value: 82, color: '#636e72' },
      { label: 'Jupiter Grace', value: 90, color: '#eccc68' },
      { label: 'Past-Life Karma', value: 65, color: '#ffa502' },
    ],
    findings: [
      { type: 'positive', text: 'Powerful Moksha Yoga — Ketu in 12th house with Jupiter aspect' },
      { type: 'positive', text: 'Atmakaraka Saturn — soul seeks mastery through discipline and service' },
      { type: 'warning', text: 'Rahu in 6th — karmic debt related to service and health; resolve through seva' },
      { type: 'neutral', text: 'Spiritual acceleration period 2026-2028 — Ketu Mahadasha window' },
    ],
  },

  features: [
    { icon: 'fa-om', title: '12th House Analysis', description: 'The house of liberation — your gateway to spiritual transcendence.', color: '#a29bfe' },
    { icon: 'fa-moon', title: 'Ketu Assessment', description: 'The planet of detachment — reveals your spiritual maturity and past-life wisdom.', color: '#636e72' },
    { icon: 'fa-sun', title: 'Atmakaraka Study', description: 'Your soul planet — the highest degree planet reveals your soul\'s deepest desire.', color: '#ffa502' },
    { icon: 'fa-clock', title: 'Awakening Windows', description: 'Precise timing for spiritual breakthroughs based on Dasha + transits.', color: '#70a1ff' },
    { icon: 'fa-praying-hands', title: 'Practice Guidance', description: 'Customized meditation, yoga, and devotional practice recommendations.', color: '#2ed573' },
    { icon: 'fa-gem', title: 'Sacred Remedies', description: 'Deity worship, pilgrimage, and spiritual gemstone recommendations.', color: '#eccc68' },
  ],

  planetsCovered: ['Ketu (Liberation)', 'Jupiter (Guru)', 'Sun (Atma)', 'Moon (Manas)', 'Saturn (Karma)', 'Rahu (Desire)', 'Venus (Devotion)'],
  housesCovered: ['4th (Inner Peace)', '5th (Mantra)', '8th (Transformation)', '9th (Dharma)', '12th (Moksha)', 'D20 Vimsamsa', 'Atmakaraka'],

  testimonials: [
    { name: 'Swami Anand', location: 'Rishikesh, India', quote: 'This report understood my spiritual journey better than most human astrologers. The Ketu analysis was profound and deeply accurate.', highlight: 'Guru Approved' },
    { name: 'Lakshmi N.', location: 'Madurai, India', quote: 'The Ishta Devata identification matched my lifelong devotion to Goddess Lalita. The report felt divinely guided.', highlight: 'Devata Matched' },
    { name: 'Michael T.', location: 'San Francisco, USA', quote: 'As a meditation practitioner, the practice guidance was invaluable. It explained why Vipassana works best for my chart.', highlight: 'Practice Clarity' },
  ],

  faqs: [
    ...SHARED_FAQS,
    { q: 'I\'m not religious. Is this report relevant?', a: 'Absolutely. Spiritual growth in Vedic astrology encompasses self-awareness, meditation, consciousness expansion, and understanding life patterns — it\'s not limited to religious practice. The report meets you where you are on your journey.' },
    { q: 'What is Atmakaraka and why does it matter?', a: 'Atmakaraka is the planet with the highest degree in your chart — it represents your soul\'s deepest desire and the primary lesson of this lifetime. Understanding it provides profound clarity about your life purpose.' },
  ],

  whyChoose: SHARED_WHY_CHOOSE,
};

// ─── FAMILY & CHILDREN ──────────────────────────────────────────

export const familyConfig = {
  slug: 'family',
  icon: 'fa-home',
  iconColor: '#2ed573',
  title: 'Family & Children Report',
  tagline: 'Understand family dynamics, property matters, fertility timing, and the planetary influences shaping your home and children.',
  metaDescription: 'Vedic astrology family report — 4th house, 5th house analysis, children timing, property yoga, family harmony, and parent-child dynamics.',
  priceCents: 1999,
  originalPriceCents: 3499,
  pages: 25,
  deliveryHours: 4,

  insideItems: [
    {
      icon: 'fa-baby',
      title: 'Children & Fertility',
      description: '5th house and Saptamsa (D7) analysis for conception timing, number of children, and their nature.',
      highlights: ['Putra Yoga identification', 'Conception timing windows', 'Gender and nature indicators'],
    },
    {
      icon: 'fa-house-user',
      title: 'Home & Property',
      description: '4th house analysis reveals property acquisition timing, land yoga, and home happiness.',
      highlights: ['Property purchase windows', 'Real estate investment timing', 'Vehicle acquisition yoga'],
    },
    {
      icon: 'fa-people-arrows',
      title: 'Parent Dynamics',
      description: 'Relationship with mother (4th house), father (9th house), and in-laws (8th house).',
      highlights: ['Mother\'s health & relationship', 'Father\'s influence analysis', 'In-law compatibility'],
    },
    {
      icon: 'fa-peace',
      title: 'Family Harmony Index',
      description: 'Assess the overall harmony potential in your household — conflicts, support, and bonding periods.',
      highlights: ['4th lord strength assessment', 'Venus-Moon family harmony', 'Mars family conflict periods'],
    },
    {
      icon: 'fa-child',
      title: 'Child\'s Potential',
      description: 'Indicators about your children\'s academic potential, health, and career from your own chart.',
      highlights: ['5th lord placement effects', 'Child\'s education indicators', 'Parent-child Dasha syncing'],
    },
    {
      icon: 'fa-gem',
      title: 'Family Remedies',
      description: 'Strengthen family bonds through Vedic practices, gemstones, and home Vastu recommendations.',
      highlights: ['Pearl for maternal bond (Moon)', 'Santan Gopal mantra for children', 'Home Vastu alignment tips'],
    },
  ],

  sampleSnapshot: {
    title: 'Family & Children Analysis',
    subtitle: 'Sample — Born 20 Jul 1988, Ahmedabad',
    score: 76,
    scoreLabel: 'Score',
    scoreColor: '#2ed573',
    metrics: [
      { label: '4th House', value: 80, color: '#2ed573' },
      { label: 'Putra Yoga', value: 75, color: '#eccc68' },
      { label: 'Property Yoga', value: 70, color: '#7b5bff' },
      { label: 'Family Harmony', value: 82, color: '#2ed573' },
    ],
    findings: [
      { type: 'positive', text: 'Strong Putra Yoga — Jupiter aspects 5th house from 9th (excellent for children)' },
      { type: 'positive', text: 'Property acquisition window 2026-2027 — 4th lord in own sign with transit support' },
      { type: 'warning', text: 'Mars in 4th — occasional domestic friction; remedy through Hanuman worship' },
      { type: 'neutral', text: 'Two children indicated — 5th lord strong, Saptamsa confirms' },
    ],
  },

  features: [
    { icon: 'fa-home', title: '4th House Analysis', description: 'Home, mother, property, vehicles, and domestic happiness assessment.', color: '#2ed573' },
    { icon: 'fa-baby', title: '5th House Fertility', description: 'Children, conception timing, and creative expression analysis.', color: '#eccc68' },
    { icon: 'fa-building', title: 'Property Yoga', description: 'Land, real estate, and vehicle acquisition timing windows.', color: '#7b5bff' },
    { icon: 'fa-clock', title: 'Family Timing', description: 'Key family events — children, property, relocations — mapped to Dasha.', color: '#70a1ff' },
    { icon: 'fa-chart-pie', title: 'D7 Saptamsa', description: 'Divisional chart dedicated to children and progeny analysis.', color: '#a29bfe' },
    { icon: 'fa-pray', title: 'Family Remedies', description: 'Mantras for children, home Vastu tips, and relationship strengthening.', color: '#ff6b81' },
  ],

  planetsCovered: ['Moon (Mother)', 'Sun (Father)', 'Jupiter (Children)', 'Venus (Comforts)', 'Mars (Property)', 'Saturn (Inheritance)', 'Mercury (Siblings)'],
  housesCovered: ['2nd (Family)', '3rd (Siblings)', '4th (Home)', '5th (Children)', '9th (Father)', 'D7 Saptamsa', 'D4 Chaturthamsa'],

  testimonials: [
    { name: 'Neha & Raj', location: 'Surat, India', quote: 'After 3 years of trying, the Santan Gopal mantra from the report helped. Our daughter was born in the exact window predicted.', highlight: 'Fertility Window' },
    { name: 'Suresh P.', location: 'Nagpur, India', quote: 'The property timing window was perfect. Bought our dream home in 2025 as the report suggested — prices were right and financing smooth.', highlight: 'Property Timing' },
    { name: 'Deepa M.', location: 'Coimbatore, India', quote: 'Understanding the Mars-in-4th dynamic helped me manage family conflicts better. The remedies genuinely improved our home atmosphere.', highlight: 'Harmony Improved' },
  ],

  faqs: [
    ...SHARED_FAQS,
    { q: 'Can Vedic astrology predict the number of children?', a: 'Classical Jyotish provides indicators about progeny based on the 5th house, its lord, Jupiter\'s placement, and the Saptamsa (D7) chart. While not deterministic, these indicators have been remarkably consistent across traditional practice.' },
    { q: 'I don\'t own property yet. Is this report useful?', a: 'Absolutely. The report identifies your best windows for property acquisition, investment in real estate, and timing for major home-related decisions. It\'s most valuable when planning ahead.' },
  ],

  whyChoose: SHARED_WHY_CHOOSE,
};
