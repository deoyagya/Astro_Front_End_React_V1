// Auth
export const AUTH = {
  OTP_SEND: '/v1/auth/otp/send',
  OTP_RESEND: '/v1/auth/otp/resend',
  OTP_VERIFY: '/v1/auth/otp/verify',
  ME: '/v1/auth/me',
  REFRESH: '/v1/auth/refresh',
  GEO_DETECT: '/v1/auth/geo/detect',
  DIAL_CODES: '/v1/auth/geo/dial-codes',
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
  REPORT: '/v1/predict/report',
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
  REPORT_PRICES: '/v1/report-prices',
  VALIDATE_CART: '/v1/validate-cart',
  ORDERS: '/v1/payment/razorpay/orders',
} as const;
