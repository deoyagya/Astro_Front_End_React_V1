# Astro Yagya Mobile App — Status Report

**Last Updated:** 2026-02-25 (Night)
**Branch:** `feature/FE-integration`
**Build Status:** Passing (zero errors)

---

## Phase Summary

| Phase | Name | Status | Date |
|-------|------|--------|------|
| M1.0 | Foundation | COMPLETE | 2026-02-21 |
| M1.5 | Auth & Navigation | COMPLETE | 2026-02-21 |
| M2.0 | Vedic Tools Integration | COMPLETE | 2026-02-22 |
| M2.5 | Reports & Payments | COMPLETE | 2026-02-22 |
| M2.7 | UX Polish & Bug Fixes | COMPLETE | 2026-02-23 |
| M3.0 | UX Redesign (9 Fixes) | COMPLETE | 2026-02-23 |
| M3.1 | Post-Release Bug Fixes | COMPLETE | 2026-02-23 |
| M3.2 | Backend API Data Hookup | COMPLETE | 2026-02-23 |
| M3.3 | Fix Login Timeout on Physical Device | COMPLETE | 2026-02-24 |
| M4 | Birth Chart UX + My Data Hub | COMPLETE | 2026-02-24 |
| M4.1 | Fix Tiny Chart Text on Physical Devices | COMPLETE | 2026-02-25 |
| M4.2 | Remove Redundant "Refresh Chart" Button | COMPLETE | 2026-02-25 |
| M4.3 | Smart Text Fitting — Prevent Overflow & Overlap | COMPLETE | 2026-02-25 |
| M4.3-fix | North Indian Chart Text Misalignment Fix | COMPLETE | 2026-02-25 |
| M4.4 | North Indian Chart — Rashi Number Only | COMPLETE | 2026-02-25 |
| M4.5 | Create New Chart Flow — Blank Form + Redirect | COMPLETE | 2026-02-25 |
| M5 | Dasha 5-Screen Drill-Down Navigation | COMPLETE | 2026-02-25 |
| M5.1 | Report Language Preference in Profile | COMPLETE | 2026-02-25 |
| M5.2 | OTP Login — Auto-Fill Name + Consent Default | COMPLETE | 2026-02-25 |
| M5.3 | Tab Navigation — Re-tap Resets to Root | COMPLETE | 2026-02-25 |
| M4.5-fix | Stale Chart After New Chart Creation | COMPLETE | 2026-02-25 |
| M5.4 | Gender Field — Backend + Mobile Full-Stack | COMPLETE | 2026-02-25 |
| M5.5 | Fix Startup Warnings — API Log + SafeAreaView | COMPLETE | 2026-02-25 |
| M5.3-fix | Fix POP_TO_TOP Error on Tab Re-Tap | COMPLETE | 2026-02-25 |
| M5.6 | Separate "Create New Chart" Screen | COMPLETE | 2026-02-25 |
| M5.6b | Saved Charts — Tappable Cards + Delete Feature | COMPLETE | 2026-02-25 |
| M6 | Fix Chart Data Caching — Active Chart Store + Backend Update | COMPLETE | 2026-02-25 |
| M6.1 | Fix SplashScreen Promise Rejection Error | COMPLETE | 2026-02-26 |
| M7 | Compatibility Results Redesign — Donut Chart, Guna Grid & Dosha Detection | COMPLETE | 2026-02-26 |
| M8 | My Data Hub Expansion — 8 New Screens | COMPLETE | 2026-02-28 |

---

## M8 My Data Hub Expansion — 8 New Screens — Task Completion

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Add YOGA, TRANSIT, PERSONALITY endpoints | `endpoints.ts` | COMPLETE |
| 2 | Create My Details screen (Person Details table) | `my-data/my-details.tsx` (NEW) | COMPLETE |
| 3 | Create Avkahada Chakra screen | `my-data/avkahada-chakra.tsx` (NEW) | COMPLETE |
| 4 | Create My Personality screen (6 subdomains) | `my-data/my-personality.tsx` (NEW) | COMPLETE |
| 5 | Create Yogas & Rajyogas screen (grouped by type) | `my-data/yogas.tsx` (NEW) | COMPLETE |
| 6 | Create Sade Sati Report screen (status + timeline) | `my-data/sade-sati.tsx` (NEW) | COMPLETE |
| 7 | Create Transit screen (table + hits) | `my-data/transit.tsx` (NEW) | COMPLETE |
| 8 | Reorganize My Data hub (4 sections, 10 cards) | `my-data/index.tsx` | COMPLETE |
| 9 | Build verification (2.81 MB, zero errors) | — | COMPLETE |

---

## M7 Compatibility Results Redesign — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Add SVG + Modal imports | `compatibility.tsx` | COMPLETE |
| 2 | Add GUNA_INFO descriptions (8 gunas) | `compatibility.tsx` | COMPLETE |
| 3 | Add `getScoreColor()`, `getOrdinal()`, `detectManglik()` helpers | `compatibility.tsx` | COMPLETE |
| 4 | Add `selectedGuna` state + manglik detection in `handleCheck` | `compatibility.tsx` | COMPLETE |
| 5 | Replace score circle with SVG donut chart (8 colored segments) | `compatibility.tsx` | COMPLETE |
| 6 | Replace horizontal bars with 2x4 tappable guna grid | `compatibility.tsx` | COMPLETE |
| 7 | Add Manglik Dosha + Nadi Dosha warning cards | `compatibility.tsx` | COMPLETE |
| 8 | Add guna explanation modal (description + dynamic verdict) | `compatibility.tsx` | COMPLETE |
| 9 | Add paid report upsell row | `compatibility.tsx` | COMPLETE |
| 10 | Build verification (2.77 MB, zero errors) | — | COMPLETE |

---

## M6.1 Fix SplashScreen Promise Rejection Error — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Add `.catch(() => {})` to `SplashScreen.preventAutoHideAsync()` (line 10) | `app/_layout.tsx` | COMPLETE |
| 2 | Add `.catch(() => {})` to `SplashScreen.hideAsync()` (line 22) | `app/_layout.tsx` | COMPLETE |

---

## M6 Fix Chart Data Caching — Active Chart Store + Backend Update — Task Completion

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create `activeChartStore.ts` (module-level store) | `src/stores/activeChartStore.ts` (NEW) | COMPLETE |
| 2 | Add `update_chart_report()` CRUD function | `chart_crud.py` | COMPLETE |
| 3 | Add `PUT /v1/charts/{chart_id}` endpoint | `router.py` | COMPLETE |
| 4 | Add `CHART.UPDATE(id)` endpoint constant | `endpoints.ts` | COMPLETE |
| 5 | Modify `saved-charts.tsx` — use activeChartStore | `saved-charts.tsx` | COMPLETE |
| 6 | Modify `birth-chart.tsx` — effectiveData pattern | `birth-chart.tsx` | COMPLETE |
| 7 | Modify `dasha.tsx` — effectiveData pattern | `dasha.tsx` | COMPLETE |
| 8 | Modify `horoscope.tsx` — effectiveData pattern | `horoscope.tsx` | COMPLETE |
| 9 | Modify `birth-details.tsx` — chart ID tracking + PUT on save | `birth-details.tsx` | COMPLETE |
| 10 | Modify `new-chart.tsx` — clear activeChartStore | `new-chart.tsx` | COMPLETE |
| 11 | Modify `compatibility.tsx` — remove saveBirthData side effect | `compatibility.tsx` | COMPLETE |
| 12 | Run backend tests (3,382 passed) + frontend build (2.76 MB) | — | COMPLETE |

---

## M5.6b Saved Charts — Tappable Cards + Delete Feature — Task Completion

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Add `delete_chart_report()` CRUD function | `chart_crud.py` | COMPLETE |
| 2 | Add `DELETE /v1/charts/{chart_id}` endpoint | `router.py` | COMPLETE |
| 3 | Add `CHART.DELETE(id)` endpoint constant | `endpoints.ts` | COMPLETE |
| 4 | Make saved chart cards fully tappable (Pressable wrapper) | `saved-charts.tsx` | COMPLETE |
| 5 | Add delete button with Alert confirmation + optimistic removal | `saved-charts.tsx` | COMPLETE |

---

## M5.6 Separate "Create New Chart" Screen — Task Completion

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create dedicated `new-chart.tsx` with always-blank form | `tools/new-chart.tsx` (NEW) | COMPLETE |
| 2 | Simplify `birth-details.tsx` — remove from param, skipAutoLoad, blank reset | `birth-details.tsx` | COMPLETE |
| 3 | Update "Create New Chart" route in birth-chart.tsx | `birth-chart.tsx` | COMPLETE |
| 4 | Update "Edit Details" / "Enter Details" routes (remove params) | `birth-chart.tsx` | COMPLETE |
| 5 | Update "Add New Chart" route in my-data hub | `my-data/index.tsx` | COMPLETE |
| 6 | Update "Create First Chart" route in saved-charts | `saved-charts.tsx` | COMPLETE |
| 7 | Remove `?from=dasha` from dasha navigation calls | `dasha.tsx` | COMPLETE |
| 8 | Remove `?from=horoscope` from horoscope navigation calls | `horoscope.tsx` | COMPLETE |

---

## M5.3-fix Fix POP_TO_TOP Error on Tab Re-Tap — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Remove `StackActions` import | `TabBar.tsx` | COMPLETE |
| 2 | Add `TABS_WITH_STACK` constant (tools, reports, profile, my-data) | `TabBar.tsx` | COMPLETE |
| 3 | Replace `popToTop()` with `navigate(route.name, { screen: 'index' })` | `TabBar.tsx` | COMPLETE |

---

## M5.5 Fix Startup Warnings — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Downgrade API base URL log from `console.warn` to `console.log` | `client.ts` | COMPLETE |
| 2 | Move `SafeAreaView` import to `react-native-safe-area-context` | `AppHeader.tsx` | COMPLETE |
| 3 | Move `SafeAreaView` import to `react-native-safe-area-context` | `PlaceAutocomplete.tsx` | COMPLETE |

---

## M5.4 Gender Field — Backend + Mobile Full-Stack — Task Completion

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Add `gender` Literal field to AstroRequest schema | `schema.py` | COMPLETE |
| 2 | Propagate gender to bundle meta dict | `headless_engine.py` | COMPLETE |
| 3 | Include gender in LLM chart context + text formatter | `llm_chart_context.py` | COMPLETE |
| 4 | Add 6 gender validation backend tests | `test_schema_validators.py` | COMPLETE |
| 5 | Create GenderSelector segmented toggle component | `GenderSelector.tsx` (NEW) | COMPLETE |
| 6 | Add gender to BirthData interface + backend load | `useBirthData.ts` | COMPLETE |
| 7 | Add gender selector to birth-details form + validation | `birth-details.tsx` | COMPLETE |
| 8 | Pass gender in birth-chart API call | `birth-chart.tsx` | COMPLETE |
| 9 | Pass gender in dasha API call | `dasha.tsx` | COMPLETE |
| 10 | Pass gender in horoscope API call | `horoscope.tsx` | COMPLETE |
| 11 | Add gender to both persons in compatibility + validation | `compatibility.tsx` | COMPLETE |
| 12 | Display gender on saved chart cards + pass in saveBirthData | `saved-charts.tsx` | COMPLETE |

---

## M4.5-fix Stale Chart After New Chart Creation — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Swap priority in loadData() — AsyncStorage first, backend fallback | `useBirthData.ts` | COMPLETE |
| 2 | Add `chart_needs_refresh` flag after save + clear chart cache | `birth-details.tsx` | COMPLETE |
| 3 | Check refresh flag on focus, clear stale chartData/natalPlanets/selectedHouse | `birth-chart.tsx` | COMPLETE |

---

## M5.3 Tab Navigation — Re-tap Resets to Root — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Add `StackActions` import from `@react-navigation/native` | `TabBar.tsx` | COMPLETE |
| 2 | Add `else if (isFocused)` branch with `popToTop()` | `TabBar.tsx` | COMPLETE |

---

## M5.2 OTP Login — Auto-Fill Name + Consent Default — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Capture OTP send response + set fullName from `result.full_name` | `login.tsx` | COMPLETE |
| 2 | Change marketingConsent default from `false` to `true` | `login.tsx` | COMPLETE |

---

## M5.1 Report Language Preference — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Add REPORT_LANGUAGES constant (14 languages) | `profile/index.tsx` | COMPLETE |
| 2 | Add language picker bottom sheet Modal | `profile/index.tsx` | COMPLETE |
| 3 | Persist selection in AsyncStorage | `profile/index.tsx` | COMPLETE |

---

## M5 Dasha 5-Screen Drill-Down — Task Completion

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Create dashaNavStore (module-level tree cache) | `src/stores/dashaNavStore.ts` | COMPLETE |
| 2 | Create DashaPeriodCard component | `src/components/dasha/DashaPeriodCard.tsx` | COMPLETE |
| 3 | Rewrite dasha.tsx (Screen 1: Mahadasha list) | `app/(auth)/(tabs)/tools/dasha.tsx` | COMPLETE |
| 4 | Create dasha-level.tsx (Screens 2–5: generic sub-level) | `app/(auth)/(tabs)/tools/dasha-level.tsx` | COMPLETE |
| 5 | Add @stores path alias | `tsconfig.json`, `babel.config.js` | COMPLETE |
| 6 | Build verification | — | COMPLETE |

---

## M4.5 Create New Chart Flow — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Reset form fields when `from=chart` | `birth-details.tsx` | COMPLETE |
| 2 | Explicit navigate to birth-chart after save | `birth-details.tsx` | COMPLETE |
| 3 | Saved Charts refetch on focus | `saved-charts.tsx` | COMPLETE |

---

## M4.4 Rashi Number Only — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Replace sign abbreviation with number | `NorthIndianChart.tsx` | COMPLETE |
| 2 | Remove unused SIGN_SHORT import | `NorthIndianChart.tsx` | COMPLETE |

---

## M4.3-fix North Indian Text Misalignment — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Replace CENTROIDS with HOUSE_BOUNDS | `NorthIndianChart.tsx` | COMPLETE |
| 2 | Implement bounds-based centering formula | `NorthIndianChart.tsx` | COMPLETE |

---

## M4.3 Smart Text Fitting — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Create chartTextFit.ts with step-down lookup tables | `src/utils/chartTextFit.ts` | COMPLETE |
| 2 | Add buildChartLabel() to jyotish.ts | `src/utils/jyotish.ts` | COMPLETE |
| 3 | Integrate adaptive sizing in NorthIndianChart | `NorthIndianChart.tsx` | COMPLETE |
| 4 | Integrate adaptive sizing + centering in SouthIndianChart | `SouthIndianChart.tsx` | COMPLETE |

---

## M4.2 Remove Redundant Refresh Button — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Remove "Refresh Chart" button block | `birth-chart.tsx` | COMPLETE |

---

## M4.1 Fix Tiny Chart Text — Task Completion

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Increase font sizes in NorthIndianChart | `NorthIndianChart.tsx` | COMPLETE |
| 2 | Increase font sizes in SouthIndianChart | `SouthIndianChart.tsx` | COMPLETE |

---

## M4 Birth Chart UX + My Data Hub — Task Completion

| # | Task | Req | File(s) | Status |
|---|------|-----|---------|--------|
| 1 | Round planet degrees to whole number | R1 | `jyotish.ts` | COMPLETE |
| 2 | Repurpose ChartStyleToggle → ChartViewToggle | R3, R4 | `ChartStyleToggle.tsx` | COMPLETE |
| 3 | Birth chart: view mode toggle + conditional render | R3, R4 | `birth-chart.tsx` | COMPLETE |
| 4 | Birth chart: profile preference via useFocusEffect | R5 | `birth-chart.tsx` | COMPLETE |
| 5 | My Data tab layout + hub screen | R2 | `my-data/_layout.tsx`, `my-data/index.tsx` | COMPLETE |
| 6 | Saved Charts screen | R2 | `my-data/saved-charts.tsx` | COMPLETE |
| 7 | Purchase History screen | R2 | `my-data/purchase-history.tsx` | COMPLETE |
| 8 | Tab bar: add My Data, hide birth-details | R2 | `TabBar.tsx`, `_layout.tsx` | COMPLETE |
| 9 | AppHeader: add My Data to hamburger menu | R2 | `AppHeader.tsx` | COMPLETE |

---

## M3.3 Fix Login Timeout on Physical Device — Task Completion

| # | Task | Root Cause | File | Status |
|---|------|-----------|------|--------|
| T1 | Improve URL auto-detection | `resolveBaseUrl()` fell back to `localhost:8000` (phone's localhost) when `hostUri` was undefined | `src/api/client.ts` | COMPLETE |
| T2 | Add debug logging | No visibility into which URL was resolved at runtime | `src/api/client.ts` | COMPLETE |
| T3 | Set explicit env var | Auto-detect unreliable across sessions/network changes | `.env` | COMPLETE |

---

## M3.2 Backend API Data Hookup — Task Completion

| # | Bug | Screen | Root Cause | File | Status |
|---|-----|--------|-----------|------|--------|
| BC1 | Bundle not unwrapped | Birth Chart | `setChartData(data)` stored `{bundle:{...}}` instead of `data.bundle` | `birth-chart.tsx` | COMPLETE |
| BC2 | D1 missing planetData | Birth Chart | Backend's D1 placements have no `planetData` key; needed enrichment from `natal.planets` | `birth-chart.tsx` | COMPLETE |
| BC3 | Vargas not transformed | Birth Chart | `vargaToChartData()` existed in jyotish.ts but was never called for D2+ charts | `birth-chart.tsx` | COMPLETE |
| BC4 | Cache stored raw response | Birth Chart | Cached full API response instead of unwrapped bundle | `birth-chart.tsx` | COMPLETE |
| DA1 | Bundle not unwrapped | Dasha | Same as BC1 — `setDashaData(data)` instead of `data.bundle` | `dasha.tsx` | COMPLETE |
| DA2 | Wrong data path | Dasha | Read `dasha?.mahadasha_periods` but backend has `dasha_tree` | `dasha.tsx` | COMPLETE |
| DA3 | currentMaha not computed | Dasha | Read non-existent `dasha?.current_mahadasha`; now computed from tree | `dasha.tsx` | COMPLETE |
| DA4 | Date fields wrong | Dasha | Backend uses `start`/`end` but DashaNode read `start_date`/`end_date` | `DashaNode.tsx` | COMPLETE |
| HO1 | Response structure mismatch | Horoscope | `/predict/evaluate` returns singular `prediction`, not plural `predictions` array | `horoscope.tsx` | COMPLETE |
| HO2 | Wrong score path | Horoscope | `overall_score` doesn't exist; correct is `prediction.probability_score` | `horoscope.tsx` | COMPLETE |
| HO3 | PredictionCard field mapping | Horoscope | domain→subdomain_name, narrative→interpretation, score→probability_score | `horoscope.tsx` | COMPLETE |

---

## M3.1 Post-Release Bug Fixes — Task Completion

| # | Bug | Root Cause | File | Status |
|---|-----|-----------|------|--------|
| BF5 | Login logo too small + redundant title | Logo was 120×80, too small for hero screen | `app/login.tsx` | COMPLETE |
| BF6 | FormInput border invisible until tap | `animatedBorder` produced `rgba(123,91,255,0)` (transparent) when unfocused, overriding static border | `src/components/form/FormInput.tsx` | COMPLETE |
| BF7 | Onboarding slides blank on physical device | `Dimensions.get('window')` at module top-level returns `{width:0, height:0}` before layout on physical devices | `app/onboarding.tsx` | COMPLETE |

---

## M3.0 UX Redesign — Task Completion

| # | Task | Status | Files |
|---|------|--------|-------|
| 1 | Logo setup (copy files, path alias) | COMPLETE | assets/logo.png, assets/icon.png, tsconfig.json, babel.config.js |
| 2 | useBirthData hook enhancement | COMPLETE | src/hooks/useBirthData.ts |
| 3 | Birth Details screen (NEW) | COMPLETE | app/(auth)/(tabs)/birth-details.tsx |
| 4 | Tabs layout + Auth redirect | COMPLETE | app/(auth)/(tabs)/_layout.tsx, app/(auth)/_layout.tsx, src/context/AuthContext.tsx |
| 5 | Remove Namaste + search icon | COMPLETE | src/components/layout/AppHeader.tsx, app/(auth)/(tabs)/index.tsx |
| 6 | Double quick action icons | COMPLETE | app/(auth)/(tabs)/index.tsx |
| 7 | Birth Chart display rewrite | COMPLETE | app/(auth)/(tabs)/tools/birth-chart.tsx |
| 8 | 5-level Dasha rewrite | COMPLETE | app/(auth)/(tabs)/tools/dasha.tsx, src/components/dasha/DashaNode.tsx |
| 9 | Horoscope auto-load rewrite | COMPLETE | app/(auth)/(tabs)/tools/horoscope.tsx |
| 10 | Logo integration across screens | COMPLETE | AppHeader, login, onboarding, app.json, profile, payment, constants |
| 11 | Documentation | COMPLETE | docs/Mobility/ (4 files) |

---

## M3.0 Requirement Verification

| Req | Requirement | Status | Verification |
|-----|-------------|--------|--------------|
| R1 | Single birth details entry point | DONE | birth-details.tsx is only form; Chart/Dasha/Horoscope have no forms |
| R2 | Auto-detect birth data after login | DONE | Auth layout checks hasBirthData(), redirects if missing |
| R3 | Remove "Namaste" | DONE | Home screen has no greeting text |
| R4 | Remove dead search icon | DONE | showSearch prop removed from AppHeader |
| R5 | Birth chart display with divisional picker | DONE | 15 divisional charts (D1-D60) via horizontal pill picker |
| R6 | Save & load charts | DONE | AsyncStorage cache + background API refresh |
| R7 | Double icon sizes | DONE | 52x52 to 96x96 containers, icons 26 to 48 |
| R8 | 5-level Dasha with current highlight | DONE | dasha_depth=5, auto-expand current at all levels |
| R9 | Logo integration | DONE | Logo in header, menu, login, onboarding, app icon, splash |

---

## Tech Stack

| Component | Version |
|-----------|---------|
| Expo SDK | 54 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| expo-router | 6.x |
| TypeScript | 5.x (strict) |
| Target Platforms | iOS, Android, Web |

---

## Known Limitations

1. **Compatibility screen** still has its own 2-person form (by design — requires 2 sets of birth data)
2. **Chart cache** stores only the most recent chart response (single-user assumption)
3. **Divisional charts D2-D60** availability depends on backend `include_vargas=true` response
4. **Logo aspect ratio** — original 1536x1024 (3:2); icon.png cropped to 1024x1024 square

---

## Next Steps (Potential M6)

- Push notification for daily horoscope
- Offline mode with full chart caching
- Report language integration — pass `report_language` preference to PDF generation endpoints
- Social sharing of chart images
- Deep linking for specific charts
