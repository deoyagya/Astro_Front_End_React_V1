# Astro Yagya Mobile App — Traceability Matrix

**Last Updated:** 2026-02-23

This document maps every requirement to the tasks and files that implement it, across all mobile development phases (M1–M3).

---

## M3.0 UX Redesign Traceability

| Req# | Requirement | Tasks | Files Modified |
|------|-------------|-------|----------------|
| R1 | Single birth details entry point | T3, T7, T8, T9 | `birth-details.tsx`, `birth-chart.tsx`, `dasha.tsx`, `horoscope.tsx` |
| R2 | Auto-detect birth data after login | T2, T3, T4 | `useBirthData.ts`, `birth-details.tsx`, `(auth)/_layout.tsx`, `(tabs)/_layout.tsx`, `AuthContext.tsx` |
| R3 | Remove "Namaste" greeting | T5 | `AppHeader.tsx`, `index.tsx` |
| R4 | Remove dead search icon | T5 | `AppHeader.tsx`, `index.tsx` |
| R5 | Birth chart display with divisional picker | T7 | `birth-chart.tsx` |
| R6 | Save & load charts (cache) | T2, T7 | `useBirthData.ts`, `birth-chart.tsx` |
| R7 | Double quick action icon size | T6 | `index.tsx` |
| R8 | 5-level Dasha with current highlight | T8 | `dasha.tsx`, `DashaNode.tsx` |
| R9 | Logo integration (Astro Yagya) | T1, T10 | `logo.png`, `icon.png`, `AppHeader.tsx`, `login.tsx`, `onboarding.tsx`, `app.json`, `profile/index.tsx`, `payment.tsx`, `app.ts`, `tsconfig.json`, `babel.config.js` |

---

## M3.0 Task → File Matrix

| Task | Description | Files |
|------|-------------|-------|
| T1 | Logo setup | `assets/logo.png`, `assets/icon.png`, `tsconfig.json`, `babel.config.js` |
| T2 | useBirthData enhancement | `src/hooks/useBirthData.ts` |
| T3 | Birth Details screen | `app/(auth)/(tabs)/birth-details.tsx` (NEW) |
| T4 | Tabs + Auth redirect | `app/(auth)/(tabs)/_layout.tsx`, `app/(auth)/_layout.tsx`, `src/context/AuthContext.tsx` |
| T5 | Remove Namaste + search | `src/components/layout/AppHeader.tsx`, `app/(auth)/(tabs)/index.tsx` |
| T6 | Double icon sizes | `app/(auth)/(tabs)/index.tsx` |
| T7 | Birth Chart rewrite | `app/(auth)/(tabs)/tools/birth-chart.tsx` |
| T8 | Dasha 5-level rewrite | `app/(auth)/(tabs)/tools/dasha.tsx`, `src/components/dasha/DashaNode.tsx` |
| T9 | Horoscope auto-load | `app/(auth)/(tabs)/tools/horoscope.tsx` |
| T10 | Logo across screens | `AppHeader.tsx`, `login.tsx`, `onboarding.tsx`, `app.json`, `profile/index.tsx`, `payment.tsx`, `src/constants/app.ts` |
| T11 | Documentation | `docs/Mobility/` (4 files) |

---

## M3.2 Backend API Data Hookup Traceability

| Bug# | Description | Screen | Root Cause | File Modified | Change |
|------|-------------|--------|-----------|---------------|--------|
| BC1 | Bundle not unwrapped | Birth Chart | `setChartData(data)` stored full response; `chartData.charts?.D1` → undefined | `birth-chart.tsx` | `const bundle = data?.bundle \|\| data; setChartData(bundle)` |
| BC2 | D1 missing planetData | Birth Chart | Backend D1 placements have no `planetData` key | `birth-chart.tsx` | Ported `enrichD1WithPlanetData()` from web BirthChartPage.jsx; injects degree/isRetro/isCombust from `natal.planets` |
| BC3 | Vargas not transformed | Birth Chart | `vargaToChartData()` existed in jyotish.ts but never imported/called | `birth-chart.tsx` | Imported `vargaToChartData`, applied to all D2+ charts in `useMemo` |
| BC4 | Cache stored raw response | Birth Chart | Full API response cached instead of unwrapped bundle | `birth-chart.tsx` | Cache now stores bundle; load also extracts `natalPlanets` |
| DA1 | Bundle not unwrapped | Dasha | Same as BC1 | `dasha.tsx` | `const bundle = data?.bundle \|\| data; setDashaData(bundle)` |
| DA2 | Wrong data path | Dasha | Read `dasha?.mahadasha_periods` but backend has `dasha_tree` | `dasha.tsx` | Changed to `dashaData?.dasha_tree \|\| []` |
| DA3 | currentMaha not computed | Dasha | Read non-existent `dasha?.current_mahadasha` | `dasha.tsx` | Added `useMemo` computing current from tree periods |
| DA4 | Date fields wrong | Dasha | Backend uses `start`/`end`, DashaNode read `start_date`/`end_date` | `DashaNode.tsx` | Added fallbacks: `node.start_date \|\| node.start` |
| HO1 | Response structure mismatch | Horoscope | `/predict/evaluate` returns singular `prediction`, not plural array | `horoscope.tsx` | `predictions?.prediction` wrapped in `[prediction]` |
| HO2 | Wrong score path | Horoscope | `overall_score` doesn't exist | `horoscope.tsx` | Changed to `prediction?.probability_score` |
| HO3 | PredictionCard field mapping | Horoscope | Wrong props: domain/narrative/score | `horoscope.tsx` | domain→`subdomain_name`, narrative→`interpretation`, score→`probability_score` |

---

## M3.1 Bug Fix Traceability

| Bug# | Description | Root Cause | File Modified | Change |
|------|-------------|-----------|---------------|--------|
| BF5 | Login logo too small + redundant title | Hero logo 120×80 too small; `<Text>` title duplicated logo branding | `app/login.tsx` | Logo 120×80 → 300×200. Removed `borderRadius`. Removed "Astro Yagya" `<Text>` title + `title` style. |
| BF6 | FormInput border invisible until tap | `animatedBorder` produced `rgba(123,91,255,0)` (transparent) when unfocused, overriding static `#3d506e` border | `src/components/form/FormInput.tsx` | Added `interpolateColor` from reanimated. Animated border: `interpolateColor(value, [0,1], ['#3d506e','#7b5bff'])`. Border always visible. |
| BF7 | Onboarding slides blank on physical device | `Dimensions.get('window')` at module top-level returns `{width:0, height:0}` before layout on physical devices | `app/onboarding.tsx` | Replaced `Dimensions` import with `useWindowDimensions()` hook. Slide dims passed inline: `{ width, height: height * 0.72 }`. |

---

## Cross-Phase File Traceability

### Core Infrastructure (M1.0)

| File | Purpose | Phase |
|------|---------|-------|
| `src/api/client.ts` | API client (retry, auto-URL, JWT) | M1.0, M2.7 |
| `src/api/endpoints.ts` | Backend route constants | M1.0 |
| `src/context/AuthContext.tsx` | Auth state management | M1.5, M3.0 |
| `src/theme/colors.ts` | Dark theme color palette | M1.0 |
| `src/theme/typography.ts` | Typography scale | M1.0 |
| `src/theme/spacing.ts` | Spacing & radius tokens | M1.0 |
| `tsconfig.json` | TypeScript config + path aliases | M1.0, M3.0 |
| `babel.config.js` | Babel + module-resolver aliases | M1.0, M3.0 |
| `app.json` | Expo config | M1.0, M3.0 |

### Layout & Navigation (M1.5)

| File | Purpose | Phase |
|------|---------|-------|
| `app/_layout.tsx` | Root stack layout | M1.5, M2.7 |
| `app/index.tsx` | Root redirect gate | M2.7 |
| `app/(auth)/_layout.tsx` | Auth layout + birth data redirect | M1.5, M3.0 |
| `app/(auth)/(tabs)/_layout.tsx` | Tab layout | M1.5, M3.0 |
| `src/components/layout/Screen.tsx` | Safe area wrapper | M1.0 |
| `src/components/layout/AppHeader.tsx` | App header + hamburger menu | M1.5, M3.0 |
| `src/components/layout/TabBar.tsx` | Custom tab bar | M1.5 |

### UI Components (M1.0–M2.0)

| File | Purpose | Phase |
|------|---------|-------|
| `src/components/ui/GlassCard.tsx` | Glass morphism card | M1.0 |
| `src/components/ui/GradientButton.tsx` | Gradient action button | M1.0 |
| `src/components/ui/ErrorBanner.tsx` | Error display banner | M1.0 |
| `src/components/ui/LoadingSpinner.tsx` | Loading indicator | M1.0 |
| `src/components/form/FormInput.tsx` | Styled text input | M1.0, M3.1 |
| `src/components/form/DatePicker.tsx` | Date picker wrapper | M2.0 |
| `src/components/form/TimePicker.tsx` | Time picker wrapper | M2.0 |
| `src/components/form/PlaceAutocomplete.tsx` | Place search autocomplete | M2.0 |
| `src/components/form/OtpInput.tsx` | 6-digit OTP input | M1.5 |

### Chart Components (M2.0)

| File | Purpose | Phase |
|------|---------|-------|
| `src/components/charts/SouthIndianChart.tsx` | SVG 4x4 grid chart | M2.0 |
| `src/components/charts/NorthIndianChart.tsx` | SVG diamond chart | M2.0 |
| `src/components/charts/ChartStyleToggle.tsx` | South/North toggle | M2.0 |
| `src/components/dasha/DashaNode.tsx` | Recursive dasha tree node | M2.0, M3.0, M3.2 |
| `src/components/cards/PredictionCard.tsx` | Prediction display card | M2.0 |

### Screens (M1.5–M3.0)

| File | Purpose | Phase |
|------|---------|-------|
| `app/login.tsx` | OTP login screen | M1.5, M3.0, M3.1 |
| `app/onboarding.tsx` | Onboarding carousel | M1.5, M3.0, M3.1 |
| `app/(auth)/(tabs)/index.tsx` | Home screen | M1.5, M3.0 |
| `app/(auth)/(tabs)/birth-details.tsx` | Birth data entry (NEW) | M3.0 |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Birth chart display | M2.0, M3.0, M3.2 |
| `app/(auth)/(tabs)/tools/dasha.tsx` | Dasha timeline | M2.0, M3.0, M3.2 |
| `app/(auth)/(tabs)/tools/compatibility.tsx` | Compatibility matching | M2.0, M2.7 |
| `app/(auth)/(tabs)/tools/horoscope.tsx` | Horoscope predictions | M2.0, M3.0, M3.2 |
| `app/(auth)/(tabs)/reports/` | Report catalog + orders | M2.5 |
| `app/(auth)/(tabs)/reports/payment.tsx` | Razorpay checkout | M2.5, M3.0 |
| `app/(auth)/(tabs)/reports/my-reports.tsx` | Downloaded reports | M2.5 |
| `app/(auth)/(tabs)/profile/index.tsx` | User profile + settings | M1.5, M3.0 |

### Hooks & Utils (M2.0–M3.0)

| File | Purpose | Phase |
|------|---------|-------|
| `src/hooks/useBirthData.ts` | Birth data persistence + hasBirthData() | M2.0, M3.0 |
| `src/utils/jyotish.ts` | Vedic astrology constants + helpers | M2.0 |
| `src/constants/app.ts` | App name + version | M1.0, M3.0 |

### Assets (M3.0)

| File | Purpose | Phase |
|------|---------|-------|
| `assets/logo.png` | Astro Yagya logo (1536x1024) | M3.0 |
| `assets/icon.png` | App icon (1024x1024) | M3.0 |
