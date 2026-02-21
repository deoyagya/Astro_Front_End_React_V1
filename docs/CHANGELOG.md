# Changelog — Astro Front End React V1

All notable changes to the frontend application are documented here.
Format: Each phase lists **items requested**, **modules modified/created**, and **status**.

---

## Phase 25 — OrderPage Rewrite: Server-Validated Pricing + 2-Column Layout
**Date:** 2026-02-22
**Branch:** `feature/FE-integration` (frontend), `feature/BE-phase1-foundation` (backend)
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | Remove delete/bin icons from report items (checkbox toggle serves the purpose) | Done |
| 2 | Two-column layout — reports on LEFT, Order Summary (sticky) on RIGHT | Done |
| 3 | Backend price validation — server-side price registry, real-time validation on every check/uncheck | Done |
| 4 | Fetch report prices from backend API on page load (eliminate hardcoded prices) | Done |
| 5 | Server-side price enforcement on order creation (prevent tampering) | Done |

### Modules Modified
| Action | File | Repo | Change Summary |
|--------|------|------|----------------|
| CREATE | `app/config/report_prices.py` | Backend | Canonical price registry (6 reports, paisa-denominated), `validate_cart()`, `format_price_display()` |
| MODIFY | `app/api/v1/payment_router.py` | Backend | 2 new endpoints: `GET /report-prices` (public catalog), `POST /validate-cart` (real-time validation); server-side price enforcement in `create-order` |
| CREATE | `tests/unit/test_report_prices.py` | Backend | 21 tests covering price registry, cart validation, formatting, Pydantic models |
| REWRITE | `src/pages/OrderPage.jsx` | Frontend | Removed hardcoded REPORTS array + delete icons; added API fetch on mount, debounced cart validation (300ms), 2-column grid layout, server-validated totals |
| MODIFY | `src/styles/report-pages.css` | Frontend | Added `.order-layout` grid (1fr 380px), `.order-summary-col` sticky, `.reports-loading` spinner, `.validation-note`; removed `.delete-btn`; updated mobile responsive |

### Backend Changes (completed in prior session)
- `report_prices.py` is the single source of truth for all report pricing (paisa denomination)
- `GET /v1/payment/report-prices` returns catalog with `price_paisa` and `price_display`
- `POST /v1/payment/validate-cart` accepts `item_ids`, returns validated items + total
- `POST /v1/payment/razorpay/create-order` enforces: submitted amount must match server-computed total (422 on mismatch)

### Frontend Changes
- Prices fetched from `GET /v1/payment/report-prices` on mount (no more hardcoded array)
- Every checkbox toggle triggers debounced `POST /validate-cart` (300ms)
- Order Summary shows server-validated items and totals with "Prices verified by server" badge
- Place Order button disabled until validation completes
- 2-column grid: report list (left) + sticky summary (right); stacks vertically on mobile (< 768px)
- Cart persisted to localStorage in PaymentPage-compatible format

### Build
Frontend: 74 modules, 281.65 KB JS, 54.47 KB CSS, 0 errors
Backend: 3,254 tests passed, 10 skipped, 0 failures

---

## Phase 24B — Button Theme Consistency + OTP Timer Fix
**Date:** 2026-02-22
**Branch:** `feature/FE-integration` (frontend), `feature/BE-phase1-foundation` (backend)
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | Unify "Place Order" button gradient to consistent purple theme (remove green) | Done |
| 2 | Fix OTP timer mismatch — email/SMS says "5 minutes" but frontend shows 2-minute countdown | Done |
| 3 | Make "Your name" field mandatory at OTP login (was optional); store against user profile | Done |

### Modules Modified
| Action | File | Repo | Change Summary |
|--------|------|------|----------------|
| MODIFY | `src/styles/report-pages.css` | Frontend | `.place-order-btn` gradient changed from `#2ed573 → #7b5bff` (green→purple) to `#7b5bff → #9d7bff` (purple→purple) |
| MODIFY | `src/pages/LoginPage.jsx` | Frontend | Name field placeholder changed from "Your name (optional)" to "Your full name"; added `required` attribute; added validation in `handleVerify` — blocks submission if name is empty; sends `full_name` as non-null string |
| MODIFY | `app/auth/models.py` | Backend | `OTPVerifyRequest.full_name` changed from `Optional[str] = None` to `str = Field(..., min_length=1, max_length=255)` — now required |
| MODIFY | `app/auth/otp_service.py` | Backend | `OTP_TTL` changed from 300 (5 min) to 120 (2 min); docstring updated |
| MODIFY | `app/services/email_service.py` | Backend | 3 occurrences of "5 minutes" → "2 minutes" (SMTP text, SMTP HTML, SendGrid) |
| MODIFY | `app/services/sms_service.py` | Backend | Twilio message "5 minutes" → "2 minutes" |

### Backend Changes
- OTP now expires server-side at 120 seconds, matching frontend timer (`TIMER_SECONDS = 120`)
- Email subject unchanged (shows code only), body text updated to "2 minutes"
- SMS body updated to "Valid for 2 minutes"
- `full_name` is now a required field in OTP verification — stored on User model (`full_name` column) for all users

### Build
74 modules, 0 errors (frontend). Backend tests: all passing.

---

## Phase 24 — HouseExplorePage UI Improvements
**Date:** 2026-02-21
**Branch:** `feature/FE-integration`
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | Remove North/South Indian chart style toggle from HouseExplorePage; inherit preference from BirthChartPage and persist in localStorage for long-term use | Done |
| 2 | Replace raw birth info format with human-readable display: Name + Place on line 1, formatted Birth Date (DD Month YYYY) + Birth Time (HH:MM AM/PM) on line 2 | Done |
| 3 | Increase all data-rendering font sizes by 30-35% on HouseExplorePage (scoped — other pages unaffected) | Done |
| 4 | Move "Back to Birth Chart" button to bottom of chart column and restyle with purple gradient matching "Place Order" button theme | Done |

### Modules Modified / Created
| Action | File | Change Summary |
|--------|------|----------------|
| MODIFY | `src/pages/BirthChartPage.jsx` | Init chartStyle from localStorage; persist to localStorage on toggle; persist to sessionStorage on house navigation; added `chartStyle` to handleHouseClick dependency array |
| MODIFY | `src/pages/HouseExplorePage.jsx` | Removed chart-style-toggle; read chartStyle from sessionStorage→localStorage→fallback; added `formatDisplayDate()` and `formatDisplayTime()` helpers; revised header to 2-line birth info format; added `house-explore-page` scoping class; moved button to bottom of left column with new `btn-back-to-chart` class |
| MODIFY | `src/styles/tools.css` | Added ~75 lines: 16 scoped `.house-explore-page` font-size overrides (30-35% increase), `.birth-datetime` styling, `.btn-back-to-chart` purple gradient button with hover glow, mobile responsive overrides at 768px |
| MODIFY | `docs/CHANGELOG.md` | Appended Phase 24 entry + updated Status Report |

### Technical Details
- **Chart style persistence**: Dual-storage strategy — `localStorage.setItem('chart_style_preference', style)` for long-term persistence across sessions; `sessionStorage.setItem('chartStylePreference', chartStyle)` for immediate navigation context. HouseExplorePage reads sessionStorage first (current session), then localStorage (returning user), then defaults to 'north'.
- **Font size scoping**: Added `house-explore-page` class to container div. All CSS overrides use `.house-explore-page .selector` pattern for higher specificity, ensuring BirthChartPage, DashaPage, CompatibilityPage, and HoroscopePage are completely unaffected.
- **Date/time formatting**: `formatDisplayDate("1973-08-09")` → "09 August 1973" (splits ISO date, maps month index to full name). `formatDisplayTime("21:41")` → "09:41 PM" (converts 24h to 12h with AM/PM suffix).
- **Button gradient**: `linear-gradient(90deg, #7b5bff, #9d7bff)` matches app's purple theme. Hover effect: `translateY(-2px)` + `box-shadow: 0 5px 20px rgba(123,91,255,0.4)`.

### Backend Changes
None. Frontend-only changes.

### Build
74 modules, 280.70 KB JS (gzip: 82.80 KB), 53.99 KB CSS (gzip: 9.96 KB), 0 errors.

---

## Phase 23 — Session Timeout Warning Modal + Auto Token Refresh
**Date:** 2026-02-21
**Branch:** `feature/FE-integration`
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | Display a warning modal with 5-minute countdown before session expires | Done |
| 2 | "Stay Logged In" button extends session by calling refresh endpoint | Done |
| 3 | "End Session" button logs out immediately | Done |
| 4 | Auto-logout when countdown reaches 0:00 | Done |
| 5 | Silent refresh interceptor on 401 (retry before hard redirect) | Done |
| 6 | Cross-tab sync (refresh/logout in one tab syncs to all tabs) | Done |

### Modules Modified / Created
| Action | File | Change Summary |
|--------|------|----------------|
| CREATE | `src/styles/session-timeout.css` | Dark purple themed modal overlay, SVG countdown ring (color transitions: purple > orange > red), button styles, responsive mobile layout |
| CREATE | `src/components/SessionTimeoutModal.jsx` | Presentational countdown component: circular SVG ring, MM:SS timer, "Stay Logged In" / "End Session" buttons, spinner during refresh |
| MODIFY | `src/api/client.js` | Added `attemptSilentRefresh()` and `clearAuthAndRedirect()` helpers; updated all three 401 handlers (apiRequest, api.raw, api.download) with silent refresh + retry-once pattern using `_isRetry` flag |
| MODIFY | `src/context/AuthContext.jsx` | Added session monitor (15s interval checking JWT `exp` claim), countdown timer (1s interval when modal visible), `refreshSession` callback, cross-tab sync via `storage` events, renders `<SessionTimeoutModal>` inside Provider |
| MODIFY | `src/main.jsx` | Added `import './styles/session-timeout.css'` |

### Backend Changes
None. Uses existing `POST /v1/auth/refresh?refresh_token=<token>` endpoint.

### Build
74 modules, 280.18 KB JS bundle, 0 errors.

---

## Phase 22B — Chart Polish: Rashi Labels, Font Consistency, Layout Fix
**Date:** 2026-02-21
**Branch:** `feature/FE-integration`
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | Remove inner square from center of North Indian diamond chart | Done |
| 2 | Replace house numbers (1-12) with rashi name+number format, e.g., "Cap(8)" | Done |
| 3 | Font size consistency: rashi labels 14px, planet text 18px, legend text 14px | Done |
| 4 | HouseExplorePage: show ONLY divisional chart, remove D1 chart from top | Done |

### Modules Modified / Created
| Action | File | Change Summary |
|--------|------|----------------|
| MODIFY | `src/components/NorthIndianChart.jsx` | Removed inner square `<rect>`, removed SIGN_POS labels + HNUM_CLR constant, replaced house numbers with `{SIGN_SHORT[sign]}({sign})` rashi labels in white #e0e0e0 at 14px, legend font 12px to 14px, legendH 50 to 60 |
| MODIFY | `src/components/SouthIndianChart.jsx` | Replaced top-left sign abbreviation + top-right house number with single rashi label `{SIGN_SHORT[sign]}({sign})` in white at 14px, removed HNUM_CLR, legend font to 14px, legendH to 60 |
| MODIFY | `src/pages/HouseExplorePage.jsx` | Removed D1 chart section from left column, shows ONLY applicable divisional chart; when vargaKey is D1 (house 1) shows D1 with selected house highlighted |

### Build
72 modules, 268 KB JS bundle, 0 errors.

---

## Phase 22 — Interactive North Indian Diamond Chart + Chart Interactivity
**Date:** 2026-02-21
**Branch:** `feature/FE-integration`
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | North Indian diamond SVG chart (exact geometry from backend `svg_chart_renderer.py`) | Done |
| 2 | Chart style toggle (North Indian / South Indian) | Done |
| 3 | Click interactivity: clicking any house opens detail panel with planet info | Done |
| 4 | Free vs Premium gating on detail panel (degrees, nakshatra, pada for premium only) | Done |
| 5 | Backport interactivity to South Indian chart | Done |
| 6 | HouseExplorePage for deep-dive per house with divisional charts | Done |

### Modules Modified / Created
| Action | File | Change Summary |
|--------|------|----------------|
| CREATE | `src/components/NorthIndianChart.jsx` | SVG 600x600 diamond chart with 12 house polygons (4 diamonds + 8 triangles), hover glow, click highlight, planet placement at centroids, purple theme |
| CREATE | `src/components/SouthIndianChart.jsx` | Extracted from BirthChartPage into standalone component, added onHouseClick + selectedHouse props, consistent purple theme with NorthIndianChart |
| CREATE | `src/components/HouseDetailPanel.jsx` | Click-to-expand planet detail panel: shows sign, lord, planets with degrees/nakshatra/pada/dignity (premium-gated), retro/combust badges |
| CREATE | `src/pages/HouseExplorePage.jsx` | House deep-dive page at `/birth-chart/house/:houseNum`: divisional chart, life areas selector, time slider, prediction placeholder |
| CREATE | `src/utils/jyotish.js` | Shared Vedic utility: SIGN_NAMES, SIGN_SHORT, SIGN_LORDS, PLANET_ABBR, MALEFICS, NAKSHATRAS, getNakshatra(), getDignity(), isVargottama(), formatDegrees(), toDegreeStr(), vargaToChartData() |
| MODIFY | `src/pages/BirthChartPage.jsx` | Added chart style toggle (North/South), integrated NorthIndianChart + SouthIndianChart components, house click navigates to HouseExplorePage, D1 enrichment with planet metadata |
| MODIFY | `src/App.jsx` | Added route `/birth-chart/house/:houseNum` for HouseExplorePage |
| MODIFY | `src/styles/tools.css` | Added chart-style-toggle, ni-house, house-detail-panel, house-explore-layout, life-areas, time-slider CSS (~300 lines) |
| MODIFY | `src/styles/components.css` | Added chart-svg-wrapper, chart-section-title styles |

### Build
72 modules, 268 KB JS bundle, 0 errors.

---

## Phase 21 — Order Persistence, User Data & Report Storage
**Date:** 2026-02-20
**Branch:** `feature/FE-integration` (frontend) / `feature/BE-phase1-foundation` (backend)
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | User `full_name` and `marketing_consent` fields for newsletters | Done |
| 2 | Order + OrderItem DB models with Razorpay ID tracking | Done (backend) |
| 3 | Subscription activation after verified payment | Done (backend) |
| 4 | Report PDF storage on filesystem (Railway Volume) | Done (backend) |
| 5 | My Reports page with download functionality | Done |
| 6 | Newsletter consent checkbox at OTP login | Done |

### Modules Modified / Created (Frontend)
| Action | File | Change Summary |
|--------|------|----------------|
| CREATE | `src/pages/MyReportsPage.jsx` | Lists purchased reports from `GET /v1/reports/my`, download via `api.download()`, empty state with CTA |
| MODIFY | `src/api/client.js` | Added `api.download(endpoint, filename)` helper: raw fetch, blob creation, browser download trigger |
| MODIFY | `src/App.jsx` | Added `/my-reports` protected route |
| MODIFY | `src/components/SiteHeader.jsx` | Added "My Reports" nav item with download icon when authenticated |
| MODIFY | `src/pages/PaymentPage.jsx` | Changed post-payment redirect from `/reports` to `/my-reports` |
| MODIFY | `src/pages/LoginPage.jsx` | Added full name input + marketing consent checkbox at OTP entry step |

### Modules Modified / Created (Backend)
| Action | File | Change Summary |
|--------|------|----------------|
| MODIFY | `app/db/models.py` | Added `full_name`, `marketing_consent` to User; Order, OrderItem, ReportFile models |
| CREATE | `app/db/crud/order_crud.py` | Order CRUD operations |
| CREATE | `app/db/crud/report_file_crud.py` | ReportFile CRUD with authorization |
| CREATE | `app/services/subscription_service.py` | Idempotent subscription activation + role upgrade |
| CREATE | `app/services/report_storage_service.py` | Filesystem PDF storage with sanitized user directories |
| CREATE | `app/api/v1/reports_router.py` | GET /my (list), GET /{id}/download (stream with auth) |
| MODIFY | `app/api/v1/payment_router.py` | Wired order persistence + subscription activation in create/verify/webhook |
| MODIFY | `app/api/v1/router.py` | Auto-save PDFs for authenticated users via `_auto_save_pdf()` |

### Build
Frontend: 68 modules, 254.84 KB JS bundle, 0 errors.
Backend: 3,232 tests passing, 10 skipped.

---

## Phase 20 — Full-Stack Frontend-Backend Integration
**Date:** 2026-02-20
**Branch:** `feature/FE-integration` (frontend) / `feature/BE-phase1-foundation` (backend)
**Status:** COMPLETE

### Items Requested
| # | Requirement | Status |
|---|-------------|--------|
| 1 | API client with JWT auth header injection and error handling | Done |
| 2 | AuthContext for React state management (user, token, login, logout) | Done |
| 3 | ProtectedRoute component for authenticated-only pages | Done |
| 4 | OTP passwordless login (email + SMS via Twilio) | Done |
| 5 | IP geolocation for country code auto-detection | Done (backend) |
| 6 | PlaceAutocomplete (debounced typeahead for birth city) | Done |
| 7 | Birth Chart page connected to `POST /v1/chart/create` | Done |
| 8 | Dasha page connected to `POST /v1/chart/create?include_dasha=true` | Done |
| 9 | Compatibility page connected to dual chart creation + avakhada | Done |
| 10 | Horoscope page connected to `POST /v1/predict/evaluate` | Done |
| 11 | 6 report pages using shared ReportTemplate connected to `/v1/predict/report` | Done |
| 12 | Razorpay payment flow (order creation, SDK checkout, webhook verification) | Done |
| 13 | ReportsPage React rewrite with sample modal + cart | Done |
| 14 | CORS configuration for frontend origin | Done (backend) |
| 15 | Dead code elimination (unused hooks) | Done |

### Modules Modified / Created (Frontend)
| Action | File | Change Summary |
|--------|------|----------------|
| CREATE | `src/api/client.js` | Fetch wrapper: base URL from env, JWT headers, 401 auto-logout, JSON parsing, error normalization |
| CREATE | `src/context/AuthContext.jsx` | React Context: user, token, isAuthenticated, loading, login, logout, refreshUser |
| CREATE | `src/components/ProtectedRoute.jsx` | Route guard: redirects to /login with return URL if not authenticated |
| CREATE | `src/components/PlaceAutocomplete.jsx` | Debounced typeahead (300ms, min 3 chars) using `GET /v1/location/search` |
| CREATE | `src/components/ReportTemplate.jsx` | Shared report page template used by all 6 report pages |
| CREATE | `src/pages/MyReportsPage.jsx` | (Added in Phase 21) |
| CREATE | `.env.example` | Template with `VITE_API_BASE_URL` and `VITE_RAZORPAY_KEY_ID` |
| MODIFY | `src/App.jsx` | Wrapped with AuthProvider, added ProtectedRoute to all tool/report routes |
| MODIFY | `src/pages/LoginPage.jsx` | Complete rewrite: dual-mode OTP (email/phone), country code dropdown, 6-digit OTP boxes, timer |
| MODIFY | `src/pages/BirthChartPage.jsx` | Connected to `POST /v1/chart/create`, SVG chart from API response, PlaceAutocomplete |
| MODIFY | `src/pages/DashaPage.jsx` | Connected to `POST /v1/chart/create?include_dasha=true`, expandable tree UI |
| MODIFY | `src/pages/CompatibilityPage.jsx` | Dual-person forms, Guna Milan from avakhada comparison |
| MODIFY | `src/pages/HoroscopePage.jsx` | Transit hits + prediction cards from `POST /v1/predict/evaluate` |
| MODIFY | `src/pages/ReportsPage.jsx` | React rewrite: report catalog cards, sample modal, cart integration |
| MODIFY | `src/pages/OrderPage.jsx` | Cart items from context, Razorpay order creation via API |
| MODIFY | `src/pages/PaymentPage.jsx` | Razorpay SDK checkout modal + payment verification |
| MODIFY | `src/pages/CareerReportPage.jsx` | Rewired to use shared ReportTemplate |
| MODIFY | `src/pages/LoveMarriageReportPage.jsx` | Rewired to use shared ReportTemplate |
| MODIFY | `src/pages/EducationReportPage.jsx` | Rewired to use shared ReportTemplate |
| MODIFY | `src/pages/HealthReportPage.jsx` | Rewired to use shared ReportTemplate |
| MODIFY | `src/pages/SpiritualGrowthReportPage.jsx` | Rewired to use shared ReportTemplate |
| MODIFY | `src/pages/FamilyChildrenReportPage.jsx` | Rewired to use shared ReportTemplate |
| MODIFY | `src/components/SiteHeader.jsx` | Conditional Login/Logout + user badge when authenticated |
| MODIFY | `src/styles/login.css` | Phone input with country code prefix, OTP boxes, input type toggle (~197 lines added) |
| MODIFY | `src/styles/tools.css` | PlaceAutocomplete dropdown, dasha tree, compatibility cards (~142 lines added) |
| MODIFY | `src/styles/components.css` | Loading spinner, notification styles (~57 lines added) |

### Modules Modified / Created (Backend)
| Action | File | Change Summary |
|--------|------|----------------|
| CREATE | `app/auth/otp_service.py` | OTP generation (6-digit), Redis storage (5 min TTL), rate limiting |
| CREATE | `app/services/email_service.py` | Send OTP via SMTP/SendGrid |
| CREATE | `app/services/sms_service.py` | Send OTP via Twilio |
| CREATE | `app/services/geo_service.py` | IP geolocation via ip-api.com |
| CREATE | `app/api/v1/payment_router.py` | Razorpay create-order, verify, webhook endpoints |
| MODIFY | `app/api/v1/auth_router.py` | Added OTP send/verify/resend endpoints + geo/detect |
| MODIFY | `app/auth/models.py` | OTPSendRequest, OTPVerifyRequest, GeoResponse schemas |
| MODIFY | `app/config/app_settings.py` | Twilio, SendGrid, GeoIP, CORS settings |
| MODIFY | `app/db/models.py` | Phone field on User model |
| MODIFY | `app/main.py` | CORS origins, payment_router inclusion |

### Build
Frontend: 67 modules, 249 KB JS bundle, 0 errors.
Backend: 3,165 tests passing, 10 skipped.

---

## Initial Commit — Astro Front End React V1
**Date:** 2026-02-20
**Branch:** `main`
**Status:** COMPLETE

### Description
Initial client-side React prototype with all pages, styles, and static UI. Zero backend integration — all data hardcoded, no API calls, no auth state management.

### Modules Created
| File | Purpose |
|------|---------|
| `src/App.jsx` | React Router setup with all page routes |
| `src/main.jsx` | React 18 entry point with BrowserRouter |
| `src/pages/HomePage.jsx` | Landing page with hero, features, testimonials |
| `src/pages/LoginPage.jsx` | Static email+password login form |
| `src/pages/BirthChartPage.jsx` | Static birth chart form (no API) |
| `src/pages/DashaPage.jsx` | Static dasha display (no API) |
| `src/pages/CompatibilityPage.jsx` | Static compatibility form (no API) |
| `src/pages/HoroscopePage.jsx` | Static horoscope display (no API) |
| `src/pages/ReportsPage.jsx` | Static report catalog |
| `src/pages/OrderPage.jsx` | Static cart with `window.alert()` payment |
| `src/pages/PaymentPage.jsx` | Placeholder payment page |
| `src/pages/CareerReportPage.jsx` | Static career report |
| `src/pages/LoveMarriageReportPage.jsx` | Static love/marriage report |
| `src/pages/EducationReportPage.jsx` | Static education report |
| `src/pages/HealthReportPage.jsx` | Static health report |
| `src/pages/SpiritualGrowthReportPage.jsx` | Static spiritual growth report |
| `src/pages/FamilyChildrenReportPage.jsx` | Static family/children report |
| `src/components/PageShell.jsx` | Page wrapper (header + footer + content) |
| `src/components/SiteHeader.jsx` | Navigation header |
| `src/components/SiteFooter.jsx` | Footer with links |
| `src/components/LegalModals.jsx` | Terms & privacy modal |
| `src/components/form/DateInput.jsx` | Date input component |
| `src/components/form/TimeSelectGroup.jsx` | Time selector component |
| `src/hooks/useLoginEffects.js` | Login page JS effects |
| `src/hooks/useReportsEffects.js` | Reports page JS effects |
| `src/hooks/useSharedEffects.js` | Shared UI effects (notifications, stars, modals) |
| `src/hooks/useToolsEffects.js` | Tools page JS effects |
| `src/styles/style.css` | Global styles |
| `src/styles/components.css` | Component styles |
| `src/styles/landing.css` | Home page styles |
| `src/styles/login.css` | Login page styles |
| `src/styles/reports.css` | Reports page styles |
| `src/styles/report-pages.css` | Individual report page styles |
| `src/styles/tools.css` | Tools page styles |

### Tech Stack
React 18.3.1, React Router 6.28.0, Vite 5.4.10

---

# Status Report

**Last Updated:** 2026-02-22

## Overall Project Status

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| Initial | Client-side React prototype (all static) | COMPLETE | 2026-02-20 |
| Phase 20 | Full-Stack Frontend-Backend Integration | COMPLETE | 2026-02-20 |
| Phase 21 | Order Persistence, User Data & Report Storage | COMPLETE | 2026-02-20 |
| Phase 22 | Interactive North/South Indian Charts + Interactivity | COMPLETE | 2026-02-21 |
| Phase 22B | Chart Polish: Rashi Labels, Fonts, Layout | COMPLETE | 2026-02-21 |
| Phase 23 | Session Timeout Warning Modal + Auto Token Refresh | COMPLETE | 2026-02-21 |
| Phase 24 | HouseExplorePage UI Improvements | COMPLETE | 2026-02-21 |
| Phase 24B | Button Theme Consistency + OTP Timer Fix | COMPLETE | 2026-02-22 |
| Phase 25 | OrderPage Rewrite: Server-Validated Pricing + 2-Column Layout | COMPLETE | 2026-02-22 |

## Current Build Stats
- **Modules:** 74
- **JS Bundle:** 281.65 KB (gzip: 83.09 KB)
- **CSS Bundle:** 54.47 KB (gzip: 10.03 KB)
- **Build Time:** ~0.7s
- **Build Errors:** 0

## File Inventory (as of Phase 25)

### New Files (not yet committed)
| File | Phase | Lines |
|------|-------|-------|
| `src/components/NorthIndianChart.jsx` | 22 | ~230 |
| `src/components/SouthIndianChart.jsx` | 22 | ~233 |
| `src/components/HouseDetailPanel.jsx` | 22 | ~130 |
| `src/components/SessionTimeoutModal.jsx` | 23 | ~82 |
| `src/pages/HouseExplorePage.jsx` | 22 | ~275 |
| `src/utils/jyotish.js` | 22 | ~180 |
| `src/styles/session-timeout.css` | 23 | ~181 |

### Modified Files (uncommitted changes)
| File | Phases Modified In |
|------|-------------------|
| `src/api/client.js` | 21, 23 |
| `src/context/AuthContext.jsx` | 23 |
| `src/main.jsx` | 23 |
| `src/App.jsx` | 22 |
| `src/components/SiteHeader.jsx` | 22 |
| `src/components/PlaceAutocomplete.jsx` | 22 (bug fix) |
| `src/pages/BirthChartPage.jsx` | 22, 24 |
| `src/pages/HouseExplorePage.jsx` | 22, 22B, 24 |
| `src/pages/LoginPage.jsx` | 21 |
| `src/pages/OrderPage.jsx` | 22, 25 (rewrite) |
| `src/pages/CompatibilityPage.jsx` | 22 (cleanup) |
| `src/pages/DashaPage.jsx` | 22 (cleanup) |
| `src/pages/HoroscopePage.jsx` | 22 (cleanup) |
| `src/styles/tools.css` | 22, 22B, 24 |
| `src/styles/report-pages.css` | 24B, 25 |
| `src/styles/components.css` | 22 |

## Backend Test Suite
- **Total Tests:** 3,254
- **Skipped:** 10
- **Passing:** 3,244
- **Backend Branch:** `feature/BE-phase1-foundation`

## Backend Files Modified (Phase 25)
| File | Change |
|------|--------|
| `app/config/report_prices.py` | NEW — canonical price registry |
| `app/api/v1/payment_router.py` | 2 new endpoints + price enforcement |
| `tests/unit/test_report_prices.py` | NEW — 21 tests |
