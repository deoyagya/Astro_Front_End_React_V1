// Auth
export const AUTH = {
  OTP_SEND: '/v1/auth/otp/send',
  OTP_RESEND: '/v1/auth/otp/resend',
  OTP_VERIFY: '/v1/auth/otp/verify',
  ME: '/v1/auth/me',
  REFRESH: '/v1/auth/refresh', // unused — token refresh not yet implemented
  GEO_DETECT: '/v1/auth/geo/detect',
  DIAL_CODES: '/v1/auth/geo/dial-codes', // unused — dial code picker UI not built
} as const;

// Chart
export const CHART = {
  CREATE: '/v1/chart/create',
  AVAKHADA: '/v1/avakhada',
  SAVED: '/v1/charts/saved',
  SAVE: '/v1/charts/save',
  DELETE: (id: string) => `/v1/charts/${id}`,
  UPDATE: (id: string) => `/v1/charts/${id}`,
} as const;

// Predict
export const PREDICT = {
  EVALUATE: '/v1/predict/evaluate',
  REPORT: '/v1/predict/report', // unused — report generation uses order flow
} as const;

// Location
export const LOCATION = {
  SEARCH: '/v1/location/search',
} as const;

// Reports
export const REPORTS = {
  MY: '/v1/reports/my',
  DOWNLOAD: (id: string) => `/v1/reports/${id}/download`,
} as const;

// Yoga
export const YOGA = {
  SCAN: '/v1/yogas/scan',
} as const;

// Transit
export const TRANSIT = {
  TABLE: '/v1/transit/table',
  HITS: '/v1/transit/hits',
} as const;

// Personality
export const PERSONALITY = {
  PROFILE: '/v1/personality/profile',
} as const;

// Payment
export const PAYMENT = {
  CREATE_ORDER: '/v1/payment/razorpay/create-order',
  VERIFY: '/v1/payment/razorpay/verify',
  REPORT_PRICES: '/v1/payment/report-prices',
  VALIDATE_CART: '/v1/payment/validate-cart',
  ORDERS: '/v1/payment/razorpay/orders',
} as const;

// Compatibility
export const COMPATIBILITY = {
  CHECK: '/v1/compatibility/check',
  ANALYZE: '/v1/compatibility/analyze',
} as const;

// Chat (9 endpoints)
export const CHAT = {
  LIFE_AREAS: '/v1/chat/life-areas',
  START: '/v1/chat/start',
  SESSIONS: '/v1/chat/sessions',
  SESSION: (id: string) => `/v1/chat/sessions/${id}`,
  ASK: (id: string) => `/v1/chat/sessions/${id}/ask`,
  FOLLOW_UP: (id: string) => `/v1/chat/sessions/${id}/follow-up`,
  END: (id: string) => `/v1/chat/sessions/${id}/end`,
  TEMPLATES: (key: string) => `/v1/chat/templates/${key}`,
  QUOTA: '/v1/chat/quota',
} as const;

// Muhurta (6 endpoints)
export const MUHURTA = {
  EVENTS: '/v1/muhurta/events',
  PANCHANG: '/v1/muhurta/panchang', // unused — standalone panchang screen not built
  DAILY: '/v1/muhurta/daily', // unused — daily muhurta screen not built
  FIND: '/v1/muhurta/find',
  VALIDATE: '/v1/muhurta/validate',
  REPORT: '/v1/muhurta/report',
} as const;

// Temporal Forecast (4 endpoints)
export const TEMPORAL = {
  LIFE_AREAS: '/v1/temporal-forecast/life-areas', // unused — chat uses CHAT.LIFE_AREAS instead
  COMPUTE: '/v1/temporal-forecast/compute',
  INTERPRET: '/v1/temporal-forecast/interpret',
  TIMELINE: '/v1/temporal-forecast/timeline',
} as const;

// Subscription (10 endpoints)
export const SUBSCRIPTION = {
  PLANS: '/v1/subscription/plans',
  CHECKOUT: '/v1/subscription/checkout',
  VERIFY: '/v1/subscription/verify', // unused — Razorpay native SDK not integrated
  CURRENT: '/v1/subscription/current',
  CANCEL: '/v1/subscription/cancel',
  CHANGE_PLAN: '/v1/subscription/change-plan', // unused — plan change goes through checkout
  VALIDATE_COUPON: '/v1/subscription/validate-coupon',
  CREDIT_PACKS: '/v1/subscription/credit-packs',
  PURCHASE_CREDITS: '/v1/subscription/purchase-credits',
  CREDIT_BALANCE: '/v1/subscription/credit-balance',
} as const;

// Muhurta Payment
export const MUHURTA_PAYMENT = {
  CREATE_ORDER: '/v1/payment/razorpay/muhurta-order', // unused — muhurta payment not gated yet
} as const;
