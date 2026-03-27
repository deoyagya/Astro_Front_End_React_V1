/**
 * Screen Style Registry — Single source of truth for styleable UI elements.
 *
 * Each screen entry declares its styleable elements with default values.
 * The admin Style Manager editor reads this registry to render controls.
 * The StyleProvider merges these defaults with DB-stored overrides at runtime.
 *
 * To add a new screen: add a key here, set group/label/icon/categories,
 * and call `useStyles('key')` in the page component.
 *
 * 48 screens • ~350 element definitions
 */

/* ── Shared Element Templates ─────────────────────────────── */

const _badge = (bg, fg = '#fff') => ({
  backgroundColor: bg, color: fg, padding: '4px 12px',
  borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700,
});

const STATUS_BADGES = [
  { key: 'statusBadge_active', label: 'Active', defaults: _badge('#22c55e') },
  { key: 'statusBadge_pending', label: 'Pending', defaults: _badge('#eab308', '#000') },
  { key: 'statusBadge_failed', label: 'Failed', defaults: _badge('#ef4444') },
  { key: 'statusBadge_cancelled', label: 'Cancelled', defaults: _badge('#6b7280') },
];

const ADMIN_TABLE = [
  {
    key: 'tableHeader', label: 'Table Header',
    defaults: { backgroundColor: 'transparent', color: '#9b95aa', padding: '10px 12px', fontSize: '0.82rem', fontWeight: 600, borderRadius: '0' },
  },
  {
    key: 'tableCell', label: 'Table Cell',
    defaults: { backgroundColor: 'transparent', color: '#e8e2f4', padding: '10px 12px', fontSize: '0.88rem', fontWeight: 400, borderRadius: '0' },
  },
];

const ADMIN_ACTIONS = [
  {
    key: 'btnPrimary', label: 'Primary Button',
    defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' },
  },
  {
    key: 'btnDanger', label: 'Danger Button',
    defaults: { backgroundColor: '#ef4444', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' },
  },
  {
    key: 'btnSecondary', label: 'Secondary Button',
    defaults: { backgroundColor: '#1e1b30', color: '#9b95aa', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' },
  },
];

const ADMIN_TABS = [
  {
    key: 'tabBtn_active', label: 'Tab — Active',
    defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' },
  },
  {
    key: 'tabBtn_inactive', label: 'Tab — Inactive',
    defaults: { backgroundColor: '#1e1b30', color: '#9b95aa', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' },
  },
];

const ADMIN_FORM = [
  {
    key: 'formInput', label: 'Form Input',
    defaults: { backgroundColor: '#1a1730', color: '#e8e2f4', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '6px' },
  },
  {
    key: 'formSelect', label: 'Form Select',
    defaults: { backgroundColor: '#1a1730', color: '#e8e2f4', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '6px' },
  },
  {
    key: 'formLabel', label: 'Form Label',
    defaults: { backgroundColor: 'transparent', color: '#9b95aa', padding: '0', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0' },
  },
];

const PAGE_TITLE = {
  key: 'pageTitle', label: 'Page Title',
  defaults: { backgroundColor: 'transparent', color: '#e8e2f4', padding: '0', fontSize: '1.8rem', fontWeight: 700, borderRadius: '0' },
};

/* ── Registry ─────────────────────────────────────────────── */

export const SCREEN_STYLE_REGISTRY = {

  /* ═══════════════════════════════════════════════════════════
   *  PUBLIC (3)
   * ═══════════════════════════════════════════════════════════ */

  'home': {
    label: 'Home Page', icon: 'fa-home', group: 'Public',
    categories: [
      {
        name: 'Hero Section',
        elements: [
          { key: 'heroTitle', label: 'Hero Title', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '0', fontSize: '2.5rem', fontWeight: 800, borderRadius: '0' } },
          { key: 'heroSubtitle', label: 'Hero Subtitle', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '0', fontSize: '1.1rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'heroBtnPrimary', label: 'Hero CTA Primary', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '14px 32px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'heroBtnSecondary', label: 'Hero CTA Secondary', defaults: { backgroundColor: 'transparent', color: '#b794ff', padding: '14px 32px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
        ],
      },
      {
        name: 'Content',
        elements: [
          { key: 'sectionTitle', label: 'Section Title', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '0', fontSize: '1.5rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'toolCard', label: 'Tool Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '24px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'areaCard', label: 'Life Area Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '20px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'trustBadge', label: 'Trust Badge', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '20px' } },
        ],
      },
    ],
  },

  'login': {
    label: 'Login Page', icon: 'fa-sign-in-alt', group: 'Public',
    categories: [
      {
        name: 'Form',
        elements: [
          { key: 'formCard', label: 'Form Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '32px', fontSize: '1rem', fontWeight: 400, borderRadius: '16px' } },
          { key: 'formInput', label: 'Input Field', defaults: { backgroundColor: '#1a1d2e', color: '#e8dff5', padding: '12px 16px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '8px' } },
          { key: 'loginBtn', label: 'Login Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '12px 24px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'otpBox', label: 'OTP Input Box', defaults: { backgroundColor: '#1a1d2e', color: '#e8dff5', padding: '12px', fontSize: '1.2rem', fontWeight: 700, borderRadius: '8px' } },
          { key: 'linkText', label: 'Link Text', defaults: { backgroundColor: 'transparent', color: '#b794ff', padding: '0', fontSize: '0.9rem', fontWeight: 500, borderRadius: '0' } },
          { key: 'errorMsg', label: 'Error Message', defaults: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ff4757', padding: '10px 14px', fontSize: '0.85rem', fontWeight: 500, borderRadius: '8px' } },
        ],
      },
    ],
  },

  'pricing': {
    label: 'Pricing Page', icon: 'fa-crown', group: 'Public',
    categories: [
      {
        name: 'Plan Cards',
        elements: [
          { key: 'planCard', label: 'Plan Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '28px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '16px' } },
          { key: 'planTitle', label: 'Plan Title', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '0', fontSize: '1.3rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'planPrice', label: 'Plan Price', defaults: { backgroundColor: 'transparent', color: '#b794ff', padding: '0', fontSize: '2rem', fontWeight: 800, borderRadius: '0' } },
          { key: 'popularBadge', label: 'Most Popular Badge', defaults: _badge('#7c5cfc') },
          { key: 'savingsBadge', label: 'Savings Badge', defaults: _badge('#22c55e') },
          { key: 'ctaBtn', label: 'Subscribe CTA', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '12px 28px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
        ],
      },
      {
        name: 'Features',
        elements: [
          { key: 'featureCheck', label: 'Feature Included', defaults: { backgroundColor: 'transparent', color: '#2ed573', padding: '4px 0', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'featureCross', label: 'Feature Excluded', defaults: { backgroundColor: 'transparent', color: '#6b7280', padding: '4px 0', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'creditPackCard', label: 'Credit Pack Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '20px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px' } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
   *  USER TOOLS (7)
   * ═══════════════════════════════════════════════════════════ */

  'birth-chart': {
    label: 'Birth Chart', icon: 'fa-chart-pie', group: 'User Tools',
    categories: [
      {
        name: 'Planet Display',
        elements: [
          { key: 'planetRow_benefic', label: 'Benefic Planet', defaults: { backgroundColor: 'transparent', color: '#2ed573', padding: '6px 10px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '0' } },
          { key: 'planetRow_malefic', label: 'Malefic Planet', defaults: { backgroundColor: 'transparent', color: '#ff4757', padding: '6px 10px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '0' } },
          { key: 'ascendantBox', label: 'Ascendant Box', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '12px 16px', fontSize: '1rem', fontWeight: 600, borderRadius: '10px' } },
        ],
      },
      {
        name: 'Badges',
        elements: [
          { key: 'dignityBadge_exalted', label: 'Exalted Badge', defaults: _badge('#22c55e') },
          { key: 'dignityBadge_debilitated', label: 'Debilitated Badge', defaults: _badge('#ef4444') },
          { key: 'retroBadge', label: 'Retrograde Badge', defaults: _badge('#ffa502', '#000') },
          { key: 'combustBadge', label: 'Combust Badge', defaults: _badge('#ff6348') },
        ],
      },
      {
        name: 'Actions',
        elements: [
          { key: 'generateBtn', label: 'Generate Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '12px 24px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
        ],
      },
    ],
  },

  'house-explore': {
    label: 'House Explorer', icon: 'fa-th', group: 'User Tools',
    categories: [
      {
        name: 'House Display',
        elements: [
          { key: 'houseTitle', label: 'House Title', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '0', fontSize: '1.4rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'planetCard', label: 'Planet Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'significatorBadge', label: 'Significator Badge', defaults: _badge('#9d7bff') },
        ],
      },
    ],
  },

  'dasha': {
    label: 'Dasha Periods', icon: 'fa-stream', group: 'User Tools',
    categories: [
      {
        name: 'Period Rows',
        elements: [
          { key: 'dashaRow_active', label: 'Current Period', defaults: { backgroundColor: 'rgba(46,213,115,0.1)', color: '#2ed573', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'dashaRow_future', label: 'Future Period', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'dashaRow_past', label: 'Past Period', defaults: { backgroundColor: 'transparent', color: '#6b7280', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
      {
        name: 'Indicators',
        elements: [
          { key: 'periodBadge', label: 'Period Badge', defaults: _badge('#7c5cfc') },
          { key: 'currentIndicator', label: 'Current Indicator', defaults: _badge('#2ed573') },
        ],
      },
    ],
  },

  'compatibility': {
    label: 'Compatibility', icon: 'fa-heart', group: 'User Tools',
    categories: [
      {
        name: 'Scores',
        elements: [
          { key: 'scoreCircle_high', label: 'Score — High', defaults: { backgroundColor: 'rgba(46,213,115,0.15)', color: '#2ed573', padding: '16px', fontSize: '1.5rem', fontWeight: 700, borderRadius: '50%' } },
          { key: 'scoreCircle_medium', label: 'Score — Medium', defaults: { backgroundColor: 'rgba(255,165,2,0.15)', color: '#ffa502', padding: '16px', fontSize: '1.5rem', fontWeight: 700, borderRadius: '50%' } },
          { key: 'scoreCircle_low', label: 'Score — Low', defaults: { backgroundColor: 'rgba(255,71,87,0.15)', color: '#ff4757', padding: '16px', fontSize: '1.5rem', fontWeight: 700, borderRadius: '50%' } },
          { key: 'overallScore', label: 'Overall Score', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '20px', fontSize: '2rem', fontWeight: 800, borderRadius: '16px' } },
        ],
      },
      {
        name: 'Guna Milan',
        elements: [
          { key: 'gunaCell_perfect', label: 'Perfect Match', defaults: { backgroundColor: 'rgba(46,213,115,0.2)', color: '#2ed573', padding: '8px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'gunaCell_partial', label: 'Partial Match', defaults: { backgroundColor: 'rgba(255,165,2,0.2)', color: '#ffa502', padding: '8px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'gunaCell_zero', label: 'No Match', defaults: { backgroundColor: 'rgba(255,71,87,0.2)', color: '#ff4757', padding: '8px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '4px' } },
        ],
      },
      {
        name: 'Dosha',
        elements: [
          { key: 'doshaAlert', label: 'Dosha Alert', defaults: { backgroundColor: 'rgba(255,71,87,0.1)', color: '#ff4757', padding: '12px 16px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'manglikCard_positive', label: 'Manglik — Yes', defaults: { backgroundColor: 'rgba(255,71,87,0.1)', color: '#ff4757', padding: '16px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '10px' } },
          { key: 'manglikCard_negative', label: 'Manglik — No', defaults: { backgroundColor: 'rgba(46,213,115,0.1)', color: '#2ed573', padding: '16px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '10px' } },
        ],
      },
    ],
  },

  'horoscope': {
    label: 'Daily Horoscope', icon: 'fa-star', group: 'User Tools',
    categories: [
      {
        name: 'Predictions',
        elements: [
          { key: 'predictionCard', label: 'Prediction Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '20px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'dateBadge', label: 'Date Badge', defaults: _badge('#7c5cfc') },
        ],
      },
      {
        name: 'Scores',
        elements: [
          { key: 'scoreHigh', label: 'Score — Favorable', defaults: { backgroundColor: 'rgba(46,213,115,0.15)', color: '#2ed573', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'scoreMed', label: 'Score — Moderate', defaults: { backgroundColor: 'rgba(255,165,2,0.15)', color: '#ffa502', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'scoreLow', label: 'Score — Unfavorable', defaults: { backgroundColor: 'rgba(255,71,87,0.15)', color: '#ff4757', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'transitItem', label: 'Transit Item', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '6px 0', fontSize: '0.88rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  'muhurta': {
    label: 'Muhurta Finder', icon: 'fa-clock', group: 'User Tools',
    categories: [
      {
        name: 'Event Chips',
        elements: [
          { key: 'eventChip_marriage', label: 'Marriage', defaults: _badge('#ff6b81') },
          { key: 'eventChip_business', label: 'Business', defaults: _badge('#ffa502', '#000') },
          { key: 'eventChip_travel', label: 'Travel', defaults: _badge('#70a1ff') },
          { key: 'eventChip_griha', label: 'Griha Pravesh', defaults: _badge('#9d7bff') },
          { key: 'eventChip_upanayana', label: 'Upanayana', defaults: _badge('#00cec9') },
          { key: 'eventChip_surgery', label: 'Surgery', defaults: _badge('#e17055') },
          { key: 'eventChip_vehicle', label: 'Vehicle', defaults: _badge('#a29bfe') },
          { key: 'eventChip_property', label: 'Property', defaults: _badge('#fd79a8') },
        ],
      },
      {
        name: 'Quality Badges',
        elements: [
          { key: 'qualityBadge_excellent', label: 'Excellent', defaults: _badge('#2ed573') },
          { key: 'qualityBadge_good', label: 'Good', defaults: _badge('#7bed9f', '#000') },
          { key: 'qualityBadge_average', label: 'Average', defaults: _badge('#ffa502', '#000') },
          { key: 'qualityBadge_poor', label: 'Poor', defaults: _badge('#ff6348') },
          { key: 'qualityBadge_avoid', label: 'Avoid', defaults: _badge('#ff4757') },
        ],
      },
      {
        name: 'Panchang',
        elements: [
          { key: 'panchangChip', label: 'Panchang Chip', defaults: _badge('#1e1b30', '#c7cfdd') },
          { key: 'yogaBadge', label: 'Yoga Badge', defaults: _badge('#7c5cfc') },
          { key: 'doshaBadge', label: 'Dosha Badge', defaults: _badge('#ef4444') },
        ],
      },
    ],
  },

  'chart-wizard': {
    label: 'Chart Wizard', icon: 'fa-magic', group: 'User Tools',
    categories: [
      {
        name: 'Stepper',
        elements: [
          { key: 'stepperDot_active', label: 'Step — Active', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '50%' } },
          { key: 'stepperDot_completed', label: 'Step — Completed', defaults: { backgroundColor: '#22c55e', color: '#fff', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '50%' } },
          { key: 'stepperDot_pending', label: 'Step — Pending', defaults: { backgroundColor: '#1e1b30', color: '#6b7280', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '50%' } },
        ],
      },
      {
        name: 'Content',
        elements: [
          { key: 'categoryCard', label: 'Category Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '20px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'wizNavBtn', label: 'Nav Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'submitBtn', label: 'Submit Button', defaults: { backgroundColor: '#22c55e', color: '#fff', padding: '12px 28px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
   *  REPORTS (2)
   * ═══════════════════════════════════════════════════════════ */

  'reports-catalog': {
    label: 'Reports Catalog', icon: 'fa-file-alt', group: 'Reports',
    categories: [
      {
        name: 'Report Cards',
        elements: [
          { key: 'reportCard', label: 'Report Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '24px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'reportBadge', label: 'Report Badge', defaults: _badge('#7c5cfc') },
          { key: 'reportPrice', label: 'Report Price', defaults: { backgroundColor: 'transparent', color: '#ffa502', padding: '0', fontSize: '1.2rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'reportMeta', label: 'Report Meta', defaults: { backgroundColor: 'transparent', color: '#9b95aa', padding: '0', fontSize: '0.82rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
      {
        name: 'Buttons',
        elements: [
          { key: 'orderBtn', label: 'Order Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'sampleBtn', label: 'View Sample Button', defaults: { backgroundColor: 'transparent', color: '#b794ff', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '8px' } },
        ],
      },
    ],
  },

  'report-detail': {
    label: 'Report Template', icon: 'fa-scroll', group: 'Reports',
    categories: [
      {
        name: 'Content',
        elements: [
          { key: 'reportTitle', label: 'Report Title', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '0', fontSize: '1.6rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'narrativeBlock', label: 'Narrative Block', defaults: { backgroundColor: 'rgba(30,33,48,0.6)', color: '#c7cfdd', padding: '16px 20px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'predictionCard', label: 'Prediction Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'ctaOrderBtn', label: 'Order CTA', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '12px 28px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'sampleBadge', label: 'Sample Badge', defaults: _badge('#ffa502', '#000') },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
   *  USER ACCOUNT (3)
   * ═══════════════════════════════════════════════════════════ */

  'my-reports': {
    label: 'My Reports', icon: 'fa-download', group: 'User Account',
    categories: [
      {
        name: 'Report Items',
        elements: [
          { key: 'reportItem', label: 'Report Item Row', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'downloadBtn', label: 'Download Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
          { key: 'statusReady', label: 'Status — Ready', defaults: _badge('#22c55e') },
          { key: 'statusProcessing', label: 'Status — Processing', defaults: _badge('#ffa502', '#000') },
          { key: 'emptyState', label: 'Empty State', defaults: { backgroundColor: 'transparent', color: '#6b7280', padding: '40px', fontSize: '1rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  'order': {
    label: 'Cart / Order', icon: 'fa-shopping-cart', group: 'User Account',
    categories: [
      {
        name: 'Cart',
        elements: [
          { key: 'cartItem', label: 'Cart Item', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'totalRow', label: 'Total Row', defaults: { backgroundColor: 'rgba(123,91,255,0.1)', color: '#b794ff', padding: '12px 16px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '8px' } },
          { key: 'checkoutBtn', label: 'Checkout Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '14px 28px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'emptyCartMsg', label: 'Empty Cart Message', defaults: { backgroundColor: 'transparent', color: '#6b7280', padding: '40px', fontSize: '1rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  'payment': {
    label: 'Payment Status', icon: 'fa-credit-card', group: 'User Account',
    categories: [
      {
        name: 'Status Cards',
        elements: [
          { key: 'successCard', label: 'Success Card', defaults: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '32px', fontSize: '1rem', fontWeight: 500, borderRadius: '12px' } },
          { key: 'successIcon', label: 'Success Icon', defaults: { backgroundColor: '#22c55e', color: '#fff', padding: '16px', fontSize: '2rem', fontWeight: 400, borderRadius: '50%' } },
          { key: 'cancelledCard', label: 'Cancelled Card', defaults: { backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '32px', fontSize: '1rem', fontWeight: 500, borderRadius: '12px' } },
          { key: 'cancelIcon', label: 'Cancel Icon', defaults: { backgroundColor: '#fbbf24', color: '#000', padding: '16px', fontSize: '2rem', fontWeight: 400, borderRadius: '50%' } },
          { key: 'loadingSpinner', label: 'Loading Spinner', defaults: { backgroundColor: 'transparent', color: '#ffa502', padding: '20px', fontSize: '2rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'securityBadge', label: 'Security Badge', defaults: { backgroundColor: 'rgba(123,91,255,0.1)', color: '#9b95aa', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 500, borderRadius: '6px' } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
   *  MY DATA (11)
   * ═══════════════════════════════════════════════════════════ */

  'mydata-layout': {
    label: 'My Data Layout', icon: 'fa-columns', group: 'My Data',
    categories: [
      {
        name: 'Navigation',
        elements: [
          { key: 'tabActive', label: 'Tab — Active', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
          { key: 'tabInactive', label: 'Tab — Inactive', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 400, borderRadius: '6px' } },
        ],
      },
      {
        name: 'Birth Form',
        elements: [
          { key: 'birthFormCard', label: 'Birth Form Card', defaults: { backgroundColor: '#1a1d2e', color: '#e8dff5', padding: '20px 24px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'loadChartBtn', label: 'Load Chart Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' } },
        ],
      },
    ],
  },

  'mydata-details': {
    label: 'My Details', icon: 'fa-id-card', group: 'My Data',
    categories: [
      {
        name: 'Table',
        elements: [
          { key: 'detailRow', label: 'Detail Row', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'sectionTitle', label: 'Section Title', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '0', fontSize: '1.15rem', fontWeight: 600, borderRadius: '0' } },
          { key: 'planetRow', label: 'Planet Row', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  'mydata-avakhada': {
    label: 'Avakhada Chakra', icon: 'fa-dharmachakra', group: 'My Data',
    categories: [
      {
        name: 'Chakra Table',
        elements: [
          { key: 'chakraCell', label: 'Chakra Cell', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'cellHighlight', label: 'Highlighted Cell', defaults: { backgroundColor: 'rgba(123,91,255,0.1)', color: '#b794ff', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'sectionTitle', label: 'Section Title', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '0', fontSize: '1.15rem', fontWeight: 600, borderRadius: '0' } },
        ],
      },
    ],
  },

  'mydata-personality': {
    label: 'My Personality', icon: 'fa-brain', group: 'My Data',
    categories: [
      {
        name: 'Trait Cards',
        elements: [
          { key: 'traitCard', label: 'Trait Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '20px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'traitBar', label: 'Trait Score Bar', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'traitLabel', label: 'Trait Label', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '0', fontSize: '0.85rem', fontWeight: 500, borderRadius: '0' } },
          { key: 'sectionTitle', label: 'Section Title', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '0', fontSize: '1.15rem', fontWeight: 600, borderRadius: '0' } },
        ],
      },
    ],
  },

  'mydata-saved-charts': {
    label: 'Saved Charts', icon: 'fa-bookmark', group: 'My Data',
    categories: [
      {
        name: 'Chart List',
        elements: [
          { key: 'chartCard', label: 'Chart Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'loadBtn', label: 'Load Button', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
          { key: 'deleteBtn', label: 'Delete Button', defaults: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#ff4757', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
          { key: 'emptyState', label: 'Empty State', defaults: { backgroundColor: 'transparent', color: '#6b7280', padding: '40px', fontSize: '1rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  'mydata-birth-details': {
    label: 'Birth Details', icon: 'fa-baby', group: 'My Data',
    categories: [
      {
        name: 'Details',
        elements: [
          { key: 'detailRow', label: 'Detail Row', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'editBtn', label: 'Edit Button', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
          { key: 'saveBtn', label: 'Save Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
        ],
      },
    ],
  },

  'mydata-yogas': {
    label: 'Yogas & Rajyogas', icon: 'fa-sun', group: 'My Data',
    categories: [
      {
        name: 'Yoga Cards',
        elements: [
          { key: 'yogaCard', label: 'Yoga Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'yogaTypeBadge', label: 'Yoga Type Badge', defaults: _badge('#7c5cfc') },
          { key: 'yogaStrength_strong', label: 'Strength — Strong', defaults: _badge('#16a34a') },
          { key: 'yogaStrength_moderate', label: 'Strength — Moderate', defaults: _badge('#d97706', '#000') },
          { key: 'yogaStrength_weak', label: 'Strength — Weak', defaults: _badge('#9ca3af', '#000') },
        ],
      },
    ],
  },

  'mydata-sade-sati': {
    label: 'Sade Sati', icon: 'fa-moon', group: 'My Data',
    categories: [
      {
        name: 'Phases',
        elements: [
          { key: 'phaseCard', label: 'Phase Card', defaults: { backgroundColor: 'rgba(30,33,48,0.9)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'phaseActive', label: 'Active Phase', defaults: { backgroundColor: 'rgba(255,82,82,0.1)', color: '#ff5252', padding: '16px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '10px' } },
          { key: 'timelineBar', label: 'Timeline Bar', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '4px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'statusBadge_active', label: 'Status — Active', defaults: _badge('#ff5252') },
          { key: 'statusBadge_inactive', label: 'Status — Inactive', defaults: _badge('#50c878') },
        ],
      },
    ],
  },

  'mydata-transit': {
    label: 'Transit', icon: 'fa-globe', group: 'My Data',
    categories: [
      {
        name: 'Transit Display',
        elements: [
          { key: 'transitRow', label: 'Transit Row', defaults: { backgroundColor: 'transparent', color: '#e8dff5', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'planetIcon', label: 'Planet Icon', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '8px', fontSize: '1rem', fontWeight: 400, borderRadius: '50%' } },
          { key: 'signBadge', label: 'Sign Badge', defaults: _badge('#7c5cfc') },
          { key: 'aspectBadge', label: 'Aspect Badge', defaults: _badge('#ffa502', '#000') },
        ],
      },
    ],
  },

  'mydata-temporal': {
    label: 'Temporal Forecast', icon: 'fa-hourglass-half', group: 'My Data',
    categories: [
      {
        name: 'Area Cards',
        elements: [
          { key: 'areaCard_opportunity', label: 'Opportunity Card', defaults: { backgroundColor: 'rgba(46,213,115,0.08)', color: '#2ed573', padding: '20px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'areaCard_threat', label: 'Threat Card', defaults: { backgroundColor: 'rgba(255,71,87,0.08)', color: '#ff4757', padding: '20px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px' } },
          { key: 'areaCard_mixed', label: 'Mixed Card', defaults: { backgroundColor: 'rgba(255,165,2,0.08)', color: '#ffa502', padding: '20px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px' } },
        ],
      },
      {
        name: 'Score Bars',
        elements: [
          { key: 'scoreBarOpp', label: 'Opportunity Score Bar', defaults: { backgroundColor: '#2ed573', color: '#fff', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'scoreBarThreat', label: 'Threat Score Bar', defaults: { backgroundColor: '#ff4757', color: '#fff', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px' } },
        ],
      },
      {
        name: 'Filters & Badges',
        elements: [
          { key: 'filterActive', label: 'Filter — Active', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, borderRadius: '16px' } },
          { key: 'filterInactive', label: 'Filter — Inactive', defaults: { backgroundColor: '#1e1b30', color: '#c7cfdd', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 400, borderRadius: '16px' } },
          { key: 'transitBadge', label: 'Transit Badge', defaults: _badge('#70a1ff') },
          { key: 'sadeSatiBadge', label: 'Sade Sati Badge', defaults: _badge('#ff4757') },
          { key: 'llmCard', label: 'AI Interpretation Card', defaults: { backgroundColor: 'rgba(123,91,255,0.08)', color: '#e8eaf0', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
        ],
      },
    ],
  },

  'mydata-subscription': {
    label: 'Subscription', icon: 'fa-crown', group: 'My Data',
    categories: [
      {
        name: 'Plan Display',
        elements: [
          { key: 'planBadge', label: 'Plan Badge', defaults: _badge('#7c5cfc') },
          { key: 'usageBar', label: 'Usage Bar', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '4px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'upgradeBtn', label: 'Upgrade Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '12px 28px', fontSize: '1rem', fontWeight: 600, borderRadius: '8px' } },
          { key: 'featureRow', label: 'Feature Row', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '8px 0', fontSize: '0.9rem', fontWeight: 400, borderRadius: '0' } },
          { key: 'creditBalance', label: 'Credit Balance', defaults: { backgroundColor: 'rgba(255,165,2,0.1)', color: '#ffa502', padding: '16px', fontSize: '1.5rem', fontWeight: 700, borderRadius: '12px' } },
          { key: 'billingRow', label: 'Billing Row', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '10px 0', fontSize: '0.88rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
   *  ADMIN (17)
   * ═══════════════════════════════════════════════════════════ */

  'admin-orders': {
    label: 'Order Management', icon: 'fa-receipt', group: 'Admin',
    categories: [
      {
        name: 'Status Badges',
        elements: [
          { key: 'statusBadge_paid', label: 'Paid', defaults: _badge('#22c55e') },
          { key: 'statusBadge_active', label: 'Active', defaults: _badge('#22c55e') },
          { key: 'statusBadge_pending', label: 'Pending', defaults: _badge('#eab308', '#000') },
          { key: 'statusBadge_failed', label: 'Failed', defaults: _badge('#ef4444') },
          { key: 'statusBadge_refunded', label: 'Refunded', defaults: _badge('#3b82f6') },
          { key: 'statusBadge_cancelled', label: 'Cancelled', defaults: _badge('#6b7280') },
          { key: 'statusBadge_delivered', label: 'Delivered', defaults: _badge('#06b6d4') },
        ],
      },
      {
        name: 'Table',
        elements: [...ADMIN_TABLE],
      },
      {
        name: 'Action Buttons',
        elements: [
          { key: 'actionBtn_view', label: 'View Button', defaults: { backgroundColor: '#3b82f6', color: '#fff', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'actionBtn_refund', label: 'Refund Button', defaults: { backgroundColor: '#ef4444', color: '#fff', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'actionBtn_deliver', label: 'Deliver Button', defaults: { backgroundColor: '#06b6d4', color: '#fff', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, borderRadius: '4px' } },
          { key: 'actionBtn_cancel', label: 'Cancel Button', defaults: { backgroundColor: '#6b7280', color: '#fff', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, borderRadius: '4px' } },
        ],
      },
      {
        name: 'Navigation',
        elements: [...ADMIN_TABS],
      },
      {
        name: 'Typography',
        elements: [PAGE_TITLE],
      },
      {
        name: 'Inputs',
        elements: [
          { key: 'dateInput', label: 'Date Picker', defaults: { backgroundColor: '#1a1730', color: '#e8e2f4', padding: '6px 10px', fontSize: '0.85rem', fontWeight: 400, borderRadius: '6px' } },
          { key: 'selectInput', label: 'Dropdown Select', defaults: { backgroundColor: '#1a1730', color: '#e8e2f4', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 400, borderRadius: '6px' } },
          { key: 'refreshBtn', label: 'Refresh Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 400, borderRadius: '6px' } },
        ],
      },
    ],
  },

  'admin-subscriptions': {
    label: 'Subscriptions', icon: 'fa-credit-card', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Navigation', elements: [...ADMIN_TABS] },
      {
        name: 'Status Badges',
        elements: [
          ...STATUS_BADGES,
          { key: 'planBadge_free', label: 'Plan — Free', defaults: _badge('#6b7280') },
          { key: 'planBadge_basic', label: 'Plan — Basic', defaults: _badge('#3b82f6') },
          { key: 'planBadge_premium', label: 'Plan — Premium', defaults: _badge('#9d7bff') },
          { key: 'planBadge_elite', label: 'Plan — Elite', defaults: _badge('#ffa502', '#000') },
          { key: 'couponBadge', label: 'Coupon Badge', defaults: _badge('#22c55e') },
        ],
      },
      {
        name: 'Stats',
        elements: [
          { key: 'statsCard', label: 'Stats Card', defaults: { backgroundColor: 'rgba(30,27,48,0.6)', color: '#e8e2f4', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
        ],
      },
      { name: 'Typography', elements: [PAGE_TITLE] },
    ],
  },

  'admin-themes': {
    label: 'Themes', icon: 'fa-layer-group', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Toggles',
        elements: [
          { key: 'toggleActive', label: 'Toggle — Active', defaults: _badge('#22c55e') },
          { key: 'toggleInactive', label: 'Toggle — Inactive', defaults: _badge('#6b7280') },
        ],
      },
    ],
  },

  'admin-life-areas': {
    label: 'Life Areas', icon: 'fa-sitemap', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Badges',
        elements: [
          { key: 'iconBadge', label: 'Icon Badge', defaults: _badge('#9d7bff') },
        ],
      },
    ],
  },

  'admin-life-areas-list': {
    label: 'Life Areas List', icon: 'fa-sitemap', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
    ],
  },

  'admin-questions': {
    label: 'Add Question', icon: 'fa-plus-circle', group: 'Admin',
    categories: [
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
    ],
  },

  'admin-question-list': {
    label: 'Question List', icon: 'fa-question-circle', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Filters',
        elements: [
          { key: 'filterSelect', label: 'Filter Select', defaults: { backgroundColor: '#1a1730', color: '#e8e2f4', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 400, borderRadius: '6px' } },
        ],
      },
    ],
  },

  'admin-reports': {
    label: 'Reports Config', icon: 'fa-file-invoice', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
    ],
  },

  'admin-report-wizard': {
    label: 'Report Wizard', icon: 'fa-file-invoice', group: 'Admin',
    categories: [
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      {
        name: 'Wizard',
        elements: [
          { key: 'stepperDot', label: 'Stepper Dot', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '50%' } },
          { key: 'previewCard', label: 'Preview Card', defaults: { backgroundColor: 'rgba(30,27,48,0.6)', color: '#e8e2f4', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
        ],
      },
    ],
  },

  'admin-prompts': {
    label: 'Prompts', icon: 'fa-robot', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Navigation', elements: [...ADMIN_TABS] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Code',
        elements: [
          { key: 'versionBadge', label: 'Version Badge', defaults: _badge('#3b82f6') },
          { key: 'codeBlock', label: 'Code Block', defaults: { backgroundColor: '#0f0d1a', color: '#e8e2f4', padding: '12px 16px', fontSize: '0.82rem', fontWeight: 400, borderRadius: '8px' } },
        ],
      },
    ],
  },

  'admin-muhurta': {
    label: 'Muhurta Config', icon: 'fa-clock', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Config',
        elements: [
          { key: 'colorSwatch', label: 'Color Swatch', defaults: { backgroundColor: '#ff6b81', color: '#fff', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, borderRadius: '4px' } },
          { key: 'priceBadge', label: 'Price Badge', defaults: { backgroundColor: 'rgba(255,165,2,0.15)', color: '#ffa502', padding: '4px 10px', fontSize: '0.82rem', fontWeight: 600, borderRadius: '6px' } },
        ],
      },
    ],
  },

  'admin-observability': {
    label: 'Observability', icon: 'fa-tachometer-alt', group: 'Admin',
    categories: [
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Gauges',
        elements: [
          { key: 'gaugeGreen', label: 'Gauge — Green Zone', defaults: { backgroundColor: 'transparent', color: '#2ed573', padding: '0', fontSize: '1.2rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'gaugeYellow', label: 'Gauge — Yellow Zone', defaults: { backgroundColor: 'transparent', color: '#ffa502', padding: '0', fontSize: '1.2rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'gaugeRed', label: 'Gauge — Red Zone', defaults: { backgroundColor: 'transparent', color: '#ff4757', padding: '0', fontSize: '1.2rem', fontWeight: 700, borderRadius: '0' } },
        ],
      },
      {
        name: 'Cards & Alerts',
        elements: [
          { key: 'metricCard', label: 'Metric Card', defaults: { backgroundColor: 'rgba(30,27,48,0.6)', color: '#e8e2f4', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'alertBadge_critical', label: 'Alert — Critical', defaults: _badge('#ef4444') },
          { key: 'alertBadge_warning', label: 'Alert — Warning', defaults: _badge('#ffa502', '#000') },
        ],
      },
    ],
  },

  'admin-ai-settings': {
    label: 'AI Settings', icon: 'fa-key', group: 'Admin',
    categories: [
      { name: 'Typography', elements: [PAGE_TITLE] },
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      {
        name: 'Cards',
        elements: [
          { key: 'slotCard', label: 'Slot Card', defaults: { backgroundColor: 'rgba(26,31,46,0.92)', color: '#e8eaf0', padding: '24px', fontSize: '0.95rem', fontWeight: 400, borderRadius: '18px' } },
          { key: 'statusBadge_database', label: 'Status — Database', defaults: _badge('#22c55e') },
          { key: 'statusBadge_environment', label: 'Status — Environment', defaults: _badge('#f59e0b', '#111827') },
          { key: 'statusBadge_none', label: 'Status — None', defaults: _badge('#64748b') },
        ],
      },
    ],
  },

  'admin-pipeline': {
    label: 'Pipeline Wizard', icon: 'fa-flask', group: 'Admin',
    categories: [
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Pipeline',
        elements: [
          { key: 'stepCard', label: 'Step Card', defaults: { backgroundColor: 'rgba(30,27,48,0.6)', color: '#e8e2f4', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
        ],
      },
    ],
  },

  'admin-rule-cv': {
    label: 'Rule CV Wizard', icon: 'fa-balance-scale', group: 'Admin',
    categories: [
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Verdicts',
        elements: [
          { key: 'verdictPass', label: 'Verdict — Pass', defaults: _badge('#22c55e') },
          { key: 'verdictFail', label: 'Verdict — Fail', defaults: _badge('#ef4444') },
          { key: 'ruleCard', label: 'Rule Card', defaults: { backgroundColor: 'rgba(30,27,48,0.6)', color: '#e8e2f4', padding: '16px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
        ],
      },
    ],
  },

  'admin-rule-builder': {
    label: 'Rule Builder', icon: 'fa-project-diagram', group: 'Admin',
    categories: [
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Builder',
        elements: [
          { key: 'ruleNode', label: 'Rule Node', defaults: { backgroundColor: 'rgba(30,27,48,0.6)', color: '#e8e2f4', padding: '12px 16px', fontSize: '0.88rem', fontWeight: 400, borderRadius: '8px' } },
          { key: 'conditionChip', label: 'Condition Chip', defaults: _badge('#7c5cfc') },
        ],
      },
    ],
  },

  'admin-wizard-content': {
    label: 'Wizard Content', icon: 'fa-photo-video', group: 'Admin',
    categories: [
      { name: 'Table', elements: [...ADMIN_TABLE] },
      { name: 'Form', elements: [...ADMIN_FORM] },
      { name: 'Actions', elements: [...ADMIN_ACTIONS] },
      { name: 'Typography', elements: [PAGE_TITLE] },
      {
        name: 'Media',
        elements: [
          { key: 'mediaPreview', label: 'Media Preview', defaults: { backgroundColor: '#0f0d1a', color: '#c7cfdd', padding: '16px', fontSize: '0.85rem', fontWeight: 400, borderRadius: '8px' } },
        ],
      },
    ],
  },

  'admin-style-manager': {
    label: 'Style Manager', icon: 'fa-palette', group: 'Admin',
    categories: [
      { name: 'Typography', elements: [PAGE_TITLE] },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
   *  GLOBAL COMPONENTS (3)
   * ═══════════════════════════════════════════════════════════ */

  'chat-widget': {
    label: 'Chat Widget', icon: 'fa-comments', group: 'Global Components',
    categories: [
      {
        name: 'Chrome',
        elements: [
          { key: 'triggerBtn', label: 'Chat Trigger Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '14px', fontSize: '1.2rem', fontWeight: 400, borderRadius: '50%' } },
          { key: 'headerBar', label: 'Chat Header', defaults: { backgroundColor: '#1e1b30', color: '#e8eaf0', padding: '14px 16px', fontSize: '0.95rem', fontWeight: 600, borderRadius: '0' } },
          { key: 'inputBar', label: 'Input Bar', defaults: { backgroundColor: '#0f0d1a', color: '#e8eaf0', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '8px' } },
        ],
      },
      {
        name: 'Messages',
        elements: [
          { key: 'bubbleUser', label: 'User Bubble', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px 12px 0 12px' } },
          { key: 'bubbleAssistant', label: 'Assistant Bubble', defaults: { backgroundColor: '#1e1b30', color: '#e8eaf0', padding: '10px 14px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '12px 12px 12px 0' } },
          { key: 'typingDots', label: 'Typing Dots', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '2px', fontSize: '0.6rem', fontWeight: 400, borderRadius: '50%' } },
        ],
      },
      {
        name: 'Chips',
        elements: [
          { key: 'areaChip', label: 'Life Area Chip', defaults: _badge('#1e1b30', '#b794ff') },
          { key: 'templateChip', label: 'Template Chip', defaults: _badge('#1e1b30', '#c7cfdd') },
          { key: 'ctaUpgrade', label: 'Upgrade CTA', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
        ],
      },
    ],
  },

  'site-header': {
    label: 'Site Header', icon: 'fa-bars', group: 'Global Components',
    categories: [
      {
        name: 'Navigation',
        elements: [
          { key: 'navLink', label: 'Nav Link', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '0' } },
          { key: 'navLink_active', label: 'Nav Link — Active', defaults: { backgroundColor: 'transparent', color: '#b794ff', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '0' } },
          { key: 'adminMenuBtn', label: 'Admin Menu Button', defaults: { backgroundColor: 'rgba(123,91,255,0.15)', color: '#b794ff', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px' } },
          { key: 'userDropdownBtn', label: 'User Dropdown', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 500, borderRadius: '6px' } },
          { key: 'logoutBtn', label: 'Logout Button', defaults: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#ff4757', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 500, borderRadius: '6px' } },
        ],
      },
      {
        name: 'Branding',
        elements: [
          { key: 'logoTitle', label: 'Logo Title', defaults: { backgroundColor: 'transparent', color: '#e8eaf0', padding: '0', fontSize: '1.2rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'logoSubtitle', label: 'Logo Subtitle', defaults: { backgroundColor: 'transparent', color: '#9b95aa', padding: '0', fontSize: '0.7rem', fontWeight: 400, borderRadius: '0' } },
        ],
      },
    ],
  },

  'session-timeout': {
    label: 'Session Timeout', icon: 'fa-hourglass-end', group: 'Global Components',
    categories: [
      {
        name: 'Modal',
        elements: [
          { key: 'modalCard', label: 'Modal Card', defaults: { backgroundColor: '#1a1d2e', color: '#e8eaf0', padding: '40px', fontSize: '1rem', fontWeight: 400, borderRadius: '20px' } },
          { key: 'timerRing', label: 'Timer Ring', defaults: { backgroundColor: 'transparent', color: '#9d7bff', padding: '0', fontSize: '2.5rem', fontWeight: 700, borderRadius: '0' } },
          { key: 'stayBtn', label: 'Stay Logged In Button', defaults: { backgroundColor: '#7c5cfc', color: '#fff', padding: '14px 28px', fontSize: '0.95rem', fontWeight: 600, borderRadius: '10px' } },
          { key: 'endBtn', label: 'End Session Button', defaults: { backgroundColor: 'transparent', color: '#c7cfdd', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 400, borderRadius: '10px' } },
          { key: 'warningText', label: 'Warning Text', defaults: { backgroundColor: 'transparent', color: '#ff4757', padding: '0', fontSize: '0.88rem', fontWeight: 500, borderRadius: '0' } },
        ],
      },
    ],
  },
};
