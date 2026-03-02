# Astro Yagya Mobile App — Project Plan

**Repository:** `deoyagya/Astro_Front_End_React_V1` → `mobile-app/`
**Branch:** `feature/FE-integration`
**Backend:** `deoyagya/vedic-astro-api` (FastAPI + PostgreSQL)
**Last Updated:** 2026-02-25

---

## Executive Summary

A cross-platform (iOS, Android, Web) mobile application for Vedic astrology — built on Expo SDK 54, React Native 0.81.5, and expo-router v6. The app connects to the vedic-astro-api backend for chart calculations, predictions, and report generation.

---

## Phase Plan

### M1.0 — Foundation (COMPLETE, 2026-02-21)

**Goal:** Scaffold the Expo project with core infrastructure.

| Task | Deliverable |
|------|-------------|
| Project scaffold | Expo SDK 54, TypeScript strict mode, expo-router v6 |
| Theme system | Dark theme — colors.ts, typography.ts, spacing.ts |
| Core UI components | Screen, GlassCard, GradientButton, FormInput, ErrorBanner, LoadingSpinner |
| API client | Fetch wrapper with JWT injection, 401 auto-logout |
| Path aliases | @components, @hooks, @utils, @api, @context, @theme |
| Build verification | `npx expo export --platform web` passing |

**Files created:** ~20 files (src/theme/, src/components/ui/, src/api/, etc.)

---

### M1.5 — Authentication & Navigation (COMPLETE, 2026-02-21)

**Goal:** OTP-based passwordless login and tab navigation.

| Task | Deliverable |
|------|-------------|
| Login screen | Email/phone dual-mode OTP with country code auto-detection |
| OTP input | 6-digit input with auto-advance and paste support |
| Auth context | JWT token management, auto-refresh, secure storage |
| Tab navigation | 4-tab layout (Home, Tools, Reports, Profile) |
| Onboarding | 4-slide carousel with paginated navigation |
| Protected routes | Auth guard redirecting unauthenticated users |

**Files created:** ~10 files (login.tsx, onboarding.tsx, AuthContext, TabBar, etc.)

---

### M2.0 — Vedic Tools Integration (COMPLETE, 2026-02-22)

**Goal:** Connect all 4 free Vedic tools to the backend API.

| Task | Deliverable |
|------|-------------|
| Birth Chart | SVG South/North Indian charts with planet positions table |
| Dasha Timeline | Expandable tree with 3-level depth, current period highlighting |
| Compatibility | 2-person Guna Milan with 8-guna scoring and Nadi Dosha detection |
| Horoscope | Transit-based predictions with PredictionCard components |
| Chart components | SouthIndianChart + NorthIndianChart SVG renderers |
| Place autocomplete | Debounced typeahead using /v1/location/search |
| Chart style toggle | South/North preference persisted in AsyncStorage |
| Birth data hook | useBirthData — loads from backend then AsyncStorage fallback |

**Files created:** ~15 files (tool screens, chart components, form components, etc.)

---

### M2.5 — Reports & Payments (COMPLETE, 2026-02-22)

**Goal:** Report catalog with Razorpay payment integration.

| Task | Deliverable |
|------|-------------|
| Report catalog | 6 Vedic analysis reports with descriptions and pricing |
| Order page | Cart with server-validated pricing, 2-column grid |
| Payment flow | Razorpay SDK checkout modal with backend verification |
| My Reports | List purchased reports with PDF download |
| Backend integration | create-order, verify, webhook endpoints |

**Files created:** ~5 files (reports/, payment.tsx, my-reports.tsx, order.tsx)

---

### M2.7 — UX Polish & Bug Fixes (COMPLETE, 2026-02-23)

**Goal:** Fix critical bugs discovered during physical device testing.

| Task | Deliverable |
|------|-------------|
| API field names | Fixed date→dob, time→tob across all 4 tool screens |
| Auto-detect URL | expo-constants hostUri for physical device connectivity |
| API retry logic | 2 retries with exponential backoff (1s, 3s), 20s timeout |
| Backend binding | Changed uvicorn from 127.0.0.1:8001 to 0.0.0.0:8000 |
| Onboarding gate | Created app/index.tsx redirect (expo-router initialRouteName fix) |

**Files modified:** 7 files

---

### M3.0 — UX Redesign (COMPLETE, 2026-02-23)

**Goal:** Address 9 critical UX issues reported by product owner.

| # | Requirement | Solution |
|---|-------------|----------|
| R1 | Single birth details entry | Central birth-details.tsx screen |
| R2 | Auto-detect after login | Auth layout redirect via hasBirthData() |
| R3 | Remove "Namaste" | Greeting block removed from home screen |
| R4 | Remove search icon | showSearch prop eliminated from AppHeader |
| R5 | Chart display + divisional | D1-D60 pill picker, auto-load from saved data |
| R6 | Save/load charts | AsyncStorage cache + background API refresh |
| R7 | Double icon sizes | 52x52 → 96x96, icon 26 → 48 |
| R8 | 5-level Dasha | dasha_depth=5, auto-expand current at all levels |
| R9 | Astro Yagya logo | Logo + icon across all screens, app rename |

**Implementation order:** Logo → Hook → Birth Details → Auth Redirect → Remove UI → Icons → Chart → Dasha → Horoscope → Logo Integration → Docs

**Files modified:** 21 files (3 new, 18 modified)

---

### M3.1 — Post-Release Bug Fixes (COMPLETE, 2026-02-23)

**Goal:** Fix 3 critical bugs discovered during physical device testing after M3.0 release.

| # | Bug | Root Cause | Fix | File |
|---|-----|-----------|-----|------|
| BF5 | Login logo too small (120×80) + redundant title text | Hero logo dimensions too small; "Astro Yagya" `<Text>` duplicated logo branding | Logo resized to 300×200. Removed `borderRadius`. Removed redundant title `<Text>` and `title` style. | `app/login.tsx` |
| BF6 | FormInput border invisible until tap | `useAnimatedStyle` produced `rgba(123,91,255,0)` (fully transparent) when unfocused, overriding static `#3d506e` border | Added `interpolateColor` import from reanimated. Animated border now transitions `#3d506e` → `#7b5bff` using `interpolateColor()`. Border always visible. | `src/components/form/FormInput.tsx` |
| BF7 | Onboarding slides blank on physical device | `Dimensions.get('window')` at module top-level returns `{width:0, height:0}` before layout completes on physical devices, making all slides zero-width | Replaced `Dimensions` import with `useWindowDimensions()` hook inside component. Slide dimensions passed as inline styles: `{ width, height: height * 0.72 }`. | `app/onboarding.tsx` |

**Files modified:** 3 files

---

### M3.2 — Backend API Data Hookup (COMPLETE, 2026-02-23)

**Goal:** Fix all 3 tool screens (Birth Chart, Dasha, Horoscope) to correctly consume backend API responses.

**Root Cause:** All screens called the backend API successfully but failed to consume the response data because:
1. The API wraps data in a `bundle` key that the mobile code didn't unwrap
2. Field names in the response didn't match what components expected
3. Chart data required transformation before passing to SVG chart components

| Screen | Bugs Found | Key Fix |
|--------|-----------|---------|
| Birth Chart | 4 (bundle unwrap, D1 missing planetData, vargas not transformed, cache storing raw response) | Unwrap bundle, port `enrichD1WithPlanetData()` from web, import/use `vargaToChartData()` for D2+ |
| Dasha | 4 (bundle unwrap, wrong data path, currentMaha not computed, date fields) | Unwrap bundle, fix path to `dasha_tree`, compute currentMaha, date fallbacks |
| Horoscope | 3 (response structure, wrong score path, field mapping) | Singular `prediction` object, `probability_score`, correct PredictionCard props |

**Reference implementation:** Web frontend `BirthChartPage.jsx` (already handles all these correctly)

**Files modified:** 4 files (`birth-chart.tsx`, `dasha.tsx`, `DashaNode.tsx`, `horoscope.tsx`)

---

### M3.3 — Fix Login Timeout on Physical Device (COMPLETE, 2026-02-24)

**Goal:** Fix recurring login timeout on physical devices caused by API URL resolving to phone's localhost.

**Root Cause:** `resolveBaseUrl()` in `src/api/client.ts` runs once at module load. On physical devices, it relies on `Constants.expoConfig?.hostUri` to discover the Mac's IP. When this returns `undefined` or `localhost`, the fallback is `http://localhost:8000` — the phone's own localhost, unreachable.

| Task | Fix |
|------|-----|
| Improve URL auto-detection | Added `manifest2.extra.expoGo.debuggerHost` (SDK 49+) and `manifest.debuggerHost` (older SDKs) as additional fallback sources |
| Add debug logging | `console.warn('[API] Base URL resolved to:', BASE_URL)` in `__DEV__` mode |
| Set explicit env var | `EXPO_PUBLIC_API_BASE_URL=http://192.168.2.108:8000` in `.env` — takes priority over auto-detection |

**Files modified:** 2 files (`src/api/client.ts`, `.env`)

---

### M4 — Birth Chart UX + My Data Hub (COMPLETE, 2026-02-24)

**Goal:** Address 5 UX issues from physical device testing — degree precision, tab naming, chart toggle semantics, and adding a data management hub.

| # | Requirement | Fix |
|---|-------------|-----|
| R1 | Degree column too precise (DD° MM' SS") | `formatDegrees()` simplified to `Math.round(lon)°` |
| R2 | "birth-details" raw label in bottom tab | New "My Data" tab with hub screen (4 navigation cards), Saved Charts, Purchase History screens |
| R3 | "South Indian" toggle misleading | Renamed to "Table View" — shows planet positions table |
| R4 | "North Indian" toggle misleading | Renamed to "Chart Display" — shows chart SVG (default) |
| R5 | Chart format should come from Profile | `useFocusEffect` reads `chart_style` from AsyncStorage; inline toggle removed |

**New screens:** `my-data/_layout.tsx`, `my-data/index.tsx`, `my-data/saved-charts.tsx`, `my-data/purchase-history.tsx`

**Files modified:** 6 existing + 4 new = 10 total

---

### M4.1 — Fix Tiny Chart Text on Physical Devices (COMPLETE, 2026-02-25)

**Goal:** Make chart SVG text readable on 5–6" phone screens.

| Element | Before | After |
|---------|--------|-------|
| Planet text | 18px | 26px |
| Rashi labels | 14px | 22px |
| ASC markers | 10–12px | 16–18px |
| Center labels | 13px | 20px |
| Line height | 24–26px | 34px |

**Files modified:** 2 (`NorthIndianChart.tsx`, `SouthIndianChart.tsx`)

---

### M4.2 — Remove Redundant "Refresh Chart" Button (COMPLETE, 2026-02-25)

**Goal:** Clean up birth-chart.tsx by removing the unnecessary "Refresh Chart" button (chart auto-fetches on mount, Edit Details triggers re-fetch, divisional pills re-render on tap).

**Files modified:** 1 (`birth-chart.tsx`)

---

### M4.3 — Smart Text Fitting — Prevent Overflow & Overlap (COMPLETE, 2026-02-25)

**Goal:** Prevent planet text from overflowing into adjacent houses when 3+ planets occupy one house. Critical data integrity fix — text for house N must never bleed into house N±1.

| Component | Description |
|-----------|-------------|
| `chartTextFit.ts` (NEW) | Step-down lookup tables: fontSize/lineH/truncation by planet count. Separate tables for North Indian (triangle vs diamond) and South Indian (regular vs ASC cells). Every row mathematically proven ≤ budget. |
| `buildChartLabel()` | Centralized label builder with 3 truncation levels: full (abbr+degree+suffix), compact (abbr+degree), minimal (abbr+suffix) |
| Vertical centering | South Indian chart centers text within safe zone between rashi label and cell bottom |

**Files modified:** 2 existing + 1 new = 3 total

---

### M4.3-fix — North Indian Chart Text Misalignment Fix (COMPLETE, 2026-02-25)

**Goal:** Fix planet text positioning in North Indian houses. Centroid-based formula was off by up to 49px (House 1) because geometric centroids don't account for rashi labels and ASC markers.

**Solution:** Replaced `CENTROIDS` with `HOUSE_BOUNDS` (per-house `cx`, `topY`, `botY`). New bounds-based centering formula: `startY = topY + (botY - topY - totalTextH) / 2 + fit.fontSize`.

**Files modified:** 1 (`NorthIndianChart.tsx`)

---

### M4.4 — North Indian Chart — Rashi Number Only (COMPLETE, 2026-02-25)

**Goal:** Replace cluttered sign abbreviations (e.g., `Cap( 8)`) with just the rashi number on each house edge.

**Files modified:** 1 (`NorthIndianChart.tsx`)

---

### M4.5 — Create New Chart Flow — Blank Form + Redirect (COMPLETE, 2026-02-25)

**Goal:** Fix 3 issues in the "Create New Chart" flow:

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | Form pre-populated for new chart | Hidden tab stays mounted; savedData persisted | Added `from` to useEffect deps; explicit field reset when `from=chart` |
| 2 | No redirect to chart after save | `router.canGoBack()` unreliable with hidden tabs | Explicit `router.navigate()` to birth-chart when `from=chart` |
| 3 | Saved Charts stale after save | `useEffect` only runs on mount | Changed to `useFocusEffect` for refetch on every visit |

**Files modified:** 2 (`birth-details.tsx`, `saved-charts.tsx`)

---

### M5 — Dasha 5-Screen Drill-Down Navigation (COMPLETE, 2026-02-25)

**Goal:** Replace cramped recursive expand/collapse tree with 5 separate full-screen drill-down levels (Mahadasha → Antardasha → Pratyantardasha → Sookshma → Prana).

**Architecture:**
- **Data strategy:** Fetch full tree (depth=5) once. Store in module-level cache. Navigate via index-based path params (`?path=3.5.2`). Zero additional API calls.
- **Navigation:** `router.push()` for forward (same-route stacking), `router.back()` for return.

| Screen | Level | File | Behavior |
|--------|-------|------|----------|
| 1 | Mahadasha | `dasha.tsx` | Flat list, auto-scroll to current, tap → push `dasha-level?path={idx}` |
| 2–5 | Antardasha–Prana | `dasha-level.tsx` | Breadcrumb header, current detection, tap → push deeper, "Back" button |

**New infrastructure:**
- `dashaNavStore.ts` — Module-level tree cache with `getAtPath(path)` traversal
- `DashaPeriodCard.tsx` — Shared tappable card (planet, dates, level, current badge, chevron)
- `@stores` path alias in tsconfig.json + babel.config.js

**Files modified:** 2 existing + 3 new = 5 total

---

### M5.1 — Report Language Preference in Profile (COMPLETE, 2026-02-25)

**Goal:** Allow users to select preferred language for PDF report generation. 14 languages supported: English, Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu, Sanskrit.

**Implementation:** GlassCard with language icon → bottom sheet Modal picker → AsyncStorage persistence (`report_language` key). Scope limited to report generation only — does not affect app UI language.

**Files modified:** 1 (`profile/index.tsx`)

---

### M5.2 — OTP Login — Auto-Fill Name + Consent Default (COMPLETE, 2026-02-25)

**Goal:** Auto-populate Full Name for returning users on OTP screen and default marketing consent to ON.

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | Returning users must re-type their name | `handleSendOtp()` discarded the OTP Send response which includes `full_name` | Capture response, set `fullName` state from `result.full_name` |
| 2 | Marketing consent defaults OFF | `useState(false)` | Changed to `useState(true)` |

**Files modified:** 1 (`login.tsx`)

---

### M5.3 — Tab Navigation — Re-tap Resets to Root (COMPLETE, 2026-02-25)

**Goal:** Re-tapping the focused tab should reset its nested stack to the root screen (e.g., Tools → Birth Chart → tap "Tools" → returns to Tools index).

**Root Cause:** `handlePress` in `TabBar.tsx` only called `navigation.navigate()` when `!isFocused`. The `isFocused` branch was empty — no `popToTop`, no stack reset.

**Fix:** Added `import { StackActions } from '@react-navigation/native'` and `else if (isFocused) { navigation.dispatch(StackActions.popToTop()); }`. Safe no-op for tabs without nested stacks.

**Files modified:** 1 (`TabBar.tsx`)

---

### M4.5-fix — Stale Chart After New Chart Creation (COMPLETE, 2026-02-25)

**Goal:** Permanently fix stale chart displayed after creating a new chart via "Create New Chart" flow.

**Root Causes:**
1. **Race condition** — `saveBirthData()` fires POST to backend (fire-and-forget). When `reload()` ran `loadData()`, it hit backend GET first (Priority 1), returning the previous person's data because POST hadn't completed yet. AsyncStorage (Priority 2) had the correct new data but was never reached.
2. **Stale React state** — Even after `savedData` updated, old `chartData`/`natalPlanets` React state persisted visually.

**Fix:**
1. Swapped priority in `loadData()` — AsyncStorage first (always has freshest save), backend as cross-device fallback
2. Added `chart_needs_refresh` flag pattern — birth-details sets flag after save; birth-chart checks on focus and clears stale states

**Files modified:** 3 (`useBirthData.ts`, `birth-details.tsx`, `birth-chart.tsx`)

---

### M5.4 — Gender Field — Backend + Mobile Full-Stack (COMPLETE, 2026-02-25)

**Goal:** Add Gender (Male/Female) to birth data across backend API and all mobile forms. Critical for Vedic astrology — Manglik Dosha, marriage compatibility, and gender-specific dasha interpretations.

**Backend changes:**
- `AstroRequest` schema: `gender: Optional[Literal["male", "female"]]` (backward-compatible)
- Bundle meta: `bundle.meta.gender` populated from request
- LLM context: `birth_chart_summary.gender` + text formatter prefix
- 6 new validation tests (3382 total, 10 skipped)

**Frontend changes:**
- New `GenderSelector` component: segmented toggle (♂ Male | ♀ Female) matching `ChartStyleToggle` pattern
- `BirthData` interface: added `gender?: 'male' | 'female'`
- `birth-details.tsx`: required gender selector between Name and DOB, pre-fills from saved data
- All tool pages (birth-chart, dasha, horoscope): gender in API request body
- `compatibility.tsx`: gender selectors for both Person A & B with validation
- `saved-charts.tsx`: gender symbol (♂/♀) displayed on card

**No DB migration needed** — gender goes into encrypted `input_data` dict.

**Files modified:** 4 backend + 8 frontend = 12 total (1 new)

---

### M5.5 — Fix Startup Warnings — API Log + Deprecated SafeAreaView (COMPLETE, 2026-02-25)

**Goal:** Eliminate 2 yellow warning banners on app startup.

| # | Warning | Root Cause | Fix |
|---|---------|-----------|-----|
| 1 | `WARN [API] Base URL resolved to:` | Debug message used `console.warn` instead of `console.log` | Downgraded to `console.log` — still visible in dev console, no yellow banner |
| 2 | `WARN SafeAreaView has been deprecated` | 2 files imported from `react-native` core instead of `react-native-safe-area-context` | Moved imports to correct package (matching `Screen.tsx` pattern) |

**Files modified:** 3 (`client.ts`, `AppHeader.tsx`, `PlaceAutocomplete.tsx`)

---

### M5.3-fix — Fix POP_TO_TOP Error on Tab Re-Tap (COMPLETE, 2026-02-25)

**Goal:** Fix "The action 'POP_TO_TOP' was not handled by any navigator" error introduced in M5.3.

**Root Cause:** M5.3 dispatched `StackActions.popToTop()` from the Tab Navigator's `navigation` prop. Stack actions dispatched to a Tab navigator bubble UP to parents (not DOWN to children) — no navigator handles it, causing a red error banner. Additionally, the Home tab has no nested Stack navigator, so popToTop would always fail there.

**Navigation hierarchy:**
```
Root Stack → Auth Stack → Tab Navigator (navigation prop here)
                            ├── index (Home) — single screen, NO nested Stack
                            ├── tools/_layout.tsx — Stack navigator
                            ├── reports/_layout.tsx — Stack navigator
                            ├── profile/_layout.tsx — Stack navigator
                            └── my-data/_layout.tsx — Stack navigator
```

**Fix:** Replaced `StackActions.popToTop()` with `navigation.navigate(route.name, { screen: 'index' })` — a universal action all navigators understand. Added `TABS_WITH_STACK` guard to skip Home tab (no nested Stack).

**Files modified:** 1 (`TabBar.tsx`)

---

### M5.6 — Separate "Create New Chart" Screen (COMPLETE, 2026-02-25)

**Goal:** Ensure "Create New Chart" always shows a completely blank form, regardless of which chart was loaded previously.

**Root Cause (triple):**
1. Both "Create New Chart" and "Edit Details" navigated to the same `birth-details.tsx` using `?from=chart` — no reliable way to distinguish create (blank) vs edit (pre-fill)
2. expo-router caches Tab screens — component stays mounted, state persists between navigations
3. `skipAutoLoad` flag skipped loading but didn't clear stale `savedData` from previous visits

**Solution:** Created dedicated `tools/new-chart.tsx` inside the tools Stack navigator (where `router.push()` guarantees a fresh component instance every time). Simplified `birth-details.tsx` to only handle editing/initial setup.

| Source | Button | Old Route | New Route |
|--------|--------|-----------|-----------|
| birth-chart.tsx | "Create New Chart" | `birth-details?from=chart` | `tools/new-chart` (push) |
| birth-chart.tsx | "Edit Details" | `birth-details?from=chart` | `birth-details` (no param) |
| birth-chart.tsx | "Enter Details" | `birth-details?from=chart` | `birth-details` (no param) |
| my-data/index.tsx | "Add New Chart" | `birth-details?from=my-data` | `tools/new-chart` |
| saved-charts.tsx | "Create First Chart" | `birth-details?from=saved-charts` | `tools/new-chart` |
| dasha.tsx | 2 nav calls | `birth-details?from=dasha` | `birth-details` (no param) |
| horoscope.tsx | 2 nav calls | `birth-details?from=horoscope` | `birth-details` (no param) |

**Files modified:** 6 existing + 1 new = 7 total

---

### M5.6b — Saved Charts — Tappable Cards + Delete Feature (COMPLETE, 2026-02-25)

**Goal:** Make saved chart cards fully tappable to view charts, and add delete functionality with confirmation.

**Full-stack implementation:**
- **Backend:** `delete_chart_report()` CRUD function + `DELETE /v1/charts/{chart_id}` endpoint with user ownership check
- **Frontend:** `CHART.DELETE(id)` endpoint constant + tappable cards via `<Pressable>` wrapper + delete button with `Alert` confirmation + optimistic state removal
- **Backend tests:** 3,382 passing, 10 skipped (after adding delete endpoint)

**Files modified:** 2 backend + 2 frontend = 4 total

---

### M6 — Fix Chart Data Caching — Active Chart Store + Backend Update (COMPLETE, 2026-02-25)

**Goal:** Fix two critical bugs: (1) edit screen showing wrong person's data, (2) editing a chart creates a duplicate instead of updating.

**Root Causes:**
1. ONE AsyncStorage slot (`saved_birth_data`) for ALL chart operations — viewing someone else's chart overwrote user's own data
2. No chart ID tracking anywhere in frontend — impossible to know "which chart am I editing?"
3. No backend update endpoint — only create-or-deduplicate
4. `saveBirthData()` called from `handleViewChart()` (viewing) and `compatibility.tsx` (after check) — side effects corrupting user data

**Architecture: Active Chart Store**

| Concern | Storage | Written by | Read by |
|---------|---------|-----------|---------|
| User's own birth data | `saved_birth_data` in AsyncStorage | birth-details.tsx, new-chart.tsx | useBirthData hook |
| Currently active chart | `activeChartStore` (module-level) | saved-charts.tsx (tap to view) | birth-chart, dasha, horoscope, birth-details |
| Chart ID for updates | `activeChartStore.chartId` | saved-charts.tsx | birth-details.tsx (PUT vs POST decision) |

**Backend changes:**
- `update_chart_report()` — In-place update of encrypted birth data + input hash, owner-only
- `PUT /v1/charts/{chart_id}` — Uses existing `ChartSaveRequest` schema

**Frontend pattern:** `effectiveData = activeChartStore.getBirthData() ?? savedData` on all tool screens

**Files modified:** 2 backend + 8 frontend + 1 new = 11 total

---

### M6.1 — Fix SplashScreen Promise Rejection Error (COMPLETE, 2026-02-26)

**Goal:** Eliminate two red `ERROR` banners on every app launch.

**Root Cause:** `SplashScreen.preventAutoHideAsync()` called at module scope (line 10 of `app/_layout.tsx`) before the native view controller was registered, causing unhandled promise rejections.

**Fix:** Added `.catch(() => {})` to both `preventAutoHideAsync()` (line 10) and `hideAsync()` (line 22). Splash screen still works normally — errors only fired on fast startup / web platform race condition.

**Files modified:** 1 (`app/_layout.tsx`)

---

### M7 — Compatibility Results Redesign — Donut Chart, Guna Grid & Dosha Detection (COMPLETE, 2026-02-26)

**Goal:** Redesign the compatibility results screen with a multi-segment donut chart, tappable guna grid with explanation modal, and Manglik Dosha detection.

**Changes:**

| # | Feature | Description |
|---|---------|-------------|
| 1 | SVG Donut Chart | 8 proportional segments (by max points), colored by performance (green/orange/red). Center shows "X/36". Uses `react-native-svg` Circle + strokeDasharray. |
| 2 | Guna Grid | 2x4 tappable cells replacing horizontal bars. Each shows name + color-coded score. |
| 3 | Explanation Modal | Tap any guna cell → centered modal with description (3 lines), score badge, dynamic verdict, Close button. Tap-outside-to-dismiss via Pressable overlay. |
| 4 | Manglik Dosha | `detectManglik()` checks Mars house position (1,2,4,7,8,12) from chart response. Red warning card with person name + house number. |
| 5 | Nadi Dosha | Moved to its own GlassCard with amber warning styling. |
| 6 | Paid Report Upsell | Lock icon + "Full compatibility report with detailed analysis available in paid version". |

**Files modified:** 1 (`compatibility.tsx`)

---

### M8 — My Data Hub Expansion — 8 New Screens (COMPLETE, 2026-02-28)

**Goal:** Expand the My Data tab from 4 cards to 10 cards across 4 organized sections, with 6 new data screens.

**New Screens:**

| Screen | Data Source | Key Features |
|--------|-----------|-------------|
| My Details | `POST /v1/chart/create?include_avakhada=true&include_panchang=true` | Person Details table (DOB, TOB, place, lagna, rasi, nakshatra, JD) |
| Avkahada Chakra | `POST /v1/avakhada` | Full chakra table (Paya, Varna, Yoni, Gana, Vasya, Nadi, etc.) |
| My Personality | `POST /v1/personality/profile?interpretation_mode=static` | 6-subdomain cards with icons, confidence badges, trait chips |
| Yogas & Rajyogas | `POST /v1/yogas/scan` | Grouped by type, strength indicators, source references |
| Sade Sati Report | `POST /v1/chart/create?include_sade_sati=true` | Active/inactive status, phase timeline, remedies |
| Transit | `POST /v1/transit/table` + `POST /v1/transit/hits` | Live transit positions table + natal impact hits |

**Hub Reorganization (4 sections):**
```
MY PROFILE — My Details, Avkahada Chakra, Birth Details, Saved Charts
ANALYSIS   — My Personality, Yogas & Rajyogas
TIMING     — Sade Sati Report, Transit
ACCOUNT    — Purchase History, Download Reports
```

**Pattern:** All screens use `effectiveData = activeChartStore.getBirthData() ?? savedData` for active chart support.

**New endpoints added:** `YOGA.SCAN`, `TRANSIT.TABLE`, `TRANSIT.HITS`, `PERSONALITY.PROFILE`

**Files modified:** 2 existing + 6 new = 8 total

---

## Architecture Overview

```
mobile-app/
├── app/                          # expo-router file-based routing
│   ├── _layout.tsx               # Root stack
│   ├── index.tsx                 # Redirect gate (onboarding check)
│   ├── login.tsx                 # OTP login
│   ├── onboarding.tsx            # 4-slide carousel
│   └── (auth)/                   # Authenticated routes
│       ├── _layout.tsx           # Auth guard + birth data redirect
│       └── (tabs)/               # Tab navigation
│           ├── _layout.tsx       # Tab bar config
│           ├── index.tsx         # Home screen
│           ├── birth-details.tsx # Central birth data entry
│           ├── tools/            # Free tools
│           │   ├── birth-chart.tsx
│           │   ├── new-chart.tsx       # M5.6: Always-blank chart creation form
│           │   ├── dasha.tsx          # M5: Mahadasha list (Screen 1)
│           │   ├── dasha-level.tsx    # M5: Sub-level drill-down (Screens 2–5)
│           │   ├── compatibility.tsx
│           │   └── horoscope.tsx
│           ├── reports/          # Paid reports
│           │   ├── index.tsx     # Catalog
│           │   ├── order.tsx     # Cart + checkout
│           │   ├── payment.tsx   # Razorpay
│           │   └── my-reports.tsx
│           ├── my-data/          # User data hub (M4)
│           │   ├── index.tsx     # Hub with 4 nav cards
│           │   ├── saved-charts.tsx
│           │   └── purchase-history.tsx
│           └── profile/          # Settings
│               └── index.tsx
├── src/
│   ├── api/                      # API client + endpoints
│   ├── components/               # Reusable UI
│   │   ├── layout/               # Screen, AppHeader, TabBar
│   │   ├── ui/                   # GlassCard, GradientButton, etc.
│   │   ├── form/                 # FormInput, DatePicker, GenderSelector, etc.
│   │   ├── charts/               # SVG chart renderers
│   │   ├── dasha/                # DashaNode, DashaPeriodCard (M5)
│   │   └── cards/                # PredictionCard
│   ├── context/                  # AuthContext
│   ├── hooks/                    # useBirthData
│   ├── stores/                   # Module-level stores (M5, M6)
│   │   ├── dashaNavStore.ts      # Dasha tree cache + path traversal
│   │   └── activeChartStore.ts   # M6: Active chart context (chartId + birthData)
│   ├── utils/                    # jyotish constants, chartTextFit (M4.3)
│   ├── theme/                    # colors, typography, spacing
│   └── constants/                # app.ts
├── assets/                       # logo.png, icon.png
├── docs/Mobility/                # Documentation
└── app.json                      # Expo config
```

---

## Backend API Dependencies

| Endpoint | Used By | Purpose |
|----------|---------|---------|
| POST /v1/chart/create | Birth Chart, Dasha, Compatibility | Generate chart with vargas/dasha |
| POST /v1/avakhada | Compatibility | Avakhada Chakra for Guna Milan |
| GET /v1/charts/saved | hasBirthData(), useBirthData | Check for existing birth data |
| POST /v1/charts/save | useBirthData | Persist birth data to backend |
| DELETE /v1/charts/{id} | Saved Charts | Delete a saved chart (M5.6b) |
| PUT /v1/charts/{id} | Birth Details | Update existing saved chart in-place (M6) |
| POST /v1/predict/evaluate | Horoscope | Transit predictions |
| GET /v1/location/search | PlaceAutocomplete | Place name search |
| POST /v1/auth/otp/send | Login | Send OTP |
| POST /v1/auth/otp/verify | Login | Verify OTP + get JWT |
| GET /v1/auth/me | AuthContext | Get current user |
| POST /v1/auth/refresh | AuthContext | Refresh JWT token |
| GET /v1/auth/geo/detect | Login | Auto-detect country dial code |
| POST /v1/payment/razorpay/create-order | Payment | Create Razorpay order |
| POST /v1/payment/razorpay/verify | Payment | Verify payment |
| GET /v1/reports/my | My Reports | List purchased reports |
| GET /v1/reports/{id}/download | My Reports | Download PDF |
| GET /v1/report-prices | Order | Get report pricing |
| POST /v1/validate-cart | Order | Validate cart totals |

---

## Quality Metrics

| Metric | Value |
|--------|-------|
| Build status | Passing (zero errors) |
| Bundle size (web) | ~2.76 MB |
| TypeScript | Strict mode |
| Screens | 15 (added new-chart in M5.6) |
| Components | ~28 (added DashaPeriodCard, chartTextFit utils, GenderSelector) |
| Hooks | 1 (useBirthData) |
| Stores | 2 (dashaNavStore, activeChartStore — module-level) |
| Path aliases | 8 (@components, @hooks, @utils, @api, @context, @theme, @assets, @stores) |
