# Astro Yagya Mobile App — Changelog

All notable changes to the mobile application are documented here.

---

## [M8] My Data Hub Expansion — 8 New Screens — 2026-02-28

### Added
- **My Details screen** — Person Details table showing DOB, TOB, place, timezone, coordinates, Lagna, Rasi, Nakshatra-Pada, Nakshatra Lord, Julian Day, Sun Sign. Orange-accented header matching AstroSage reference design. Uses `POST /v1/chart/create?include_avakhada=true&include_panchang=true`.
- **Avkahada Chakra screen** — Full Avkahada Chakra table showing Paya, Varna, Yoni, Gana, Vasya, Nadi, Tatva, Balance of Dasha, Lagna, Rasi, Nakshatra, Sun Sign, Julian Day. Uses `POST /v1/avakhada`.
- **My Personality screen** — 6-subdomain personality profile (Social, Communication, Behavioral, Anger/Temperament, Health, Financial). Cards with icon, confidence badge, trait chips, and interpretation text. Uses `POST /v1/personality/profile?interpretation_mode=static`.
- **Yogas & Rajyogas screen** — Classical yoga scanner results grouped by type (Raja, Dhana, Pancha Mahapurusha, etc.). Each yoga card shows name, strength indicator, description, involved planets/houses, and source reference. Uses `POST /v1/yogas/scan`.
- **Sade Sati Report screen** — Saturn transit analysis showing active/inactive status badge, Moon sign, current Saturn sign, phase name, phase timeline with date ranges, and remedies. Uses `POST /v1/chart/create?include_sade_sati=true`.
- **Transit screen** — Live planetary transit table (planet, sign, degree, retrograde status) + transit impact hits on natal chart (benefic/malefic nature, houses, descriptions). Uses `POST /v1/transit/table` + `POST /v1/transit/hits` in parallel.
- **New API endpoints** — `YOGA.SCAN`, `TRANSIT.TABLE`, `TRANSIT.HITS`, `PERSONALITY.PROFILE` added to `endpoints.ts`.

### Changed
- **My Data hub reorganized** — 4 sections (My Profile, Analysis, Timing, Account) replacing flat 4-card grid. 10 total nav cards across sections. Section titles with uppercase letter-spacing.
- **Birth Details** — Now accessible directly from My Data hub (My Profile section) in addition to the Tools tab.
- **Card styling** — Slightly smaller padding (24px vs 28px) and font (13px) to accommodate more cards per section.

### Files Created (6)
| File | Description |
|------|-------------|
| `my-data/my-details.tsx` | Person Details table screen |
| `my-data/avkahada-chakra.tsx` | Avkahada Chakra table screen |
| `my-data/my-personality.tsx` | 6-subdomain personality cards |
| `my-data/yogas.tsx` | Grouped yoga scanner results |
| `my-data/sade-sati.tsx` | Sade Sati report with timeline |
| `my-data/transit.tsx` | Live transit table + natal hits |

### Files Modified (2)
| File | Action |
|------|--------|
| `my-data/index.tsx` | Reorganized into 4 sections with 10 nav cards |
| `src/api/endpoints.ts` | Added YOGA, TRANSIT, PERSONALITY endpoint groups |

---

## [M7] Compatibility Results Redesign — Donut Chart, Guna Grid & Dosha Detection — 2026-02-26

### Changed
- **Compatibility score display** — Replaced simple bordered circle with multi-segment SVG donut chart. Each of the 8 gunas gets a proportional arc colored by performance (green >= 75%, orange >= 50%, red < 50%). Center shows total score (e.g., "26/36").
- **Guna breakdown** — Replaced horizontal bar chart with 2x4 tappable grid. Each cell shows guna name and color-coded score. Tap opens explanation modal.
- **Nadi Dosha card** — Moved out of score card into its own GlassCard with warning styling.
- **Score thresholds** — Adjusted from 70/50 to 80/50 for Excellent/Good labels.

### Added
- **Guna explanation modal** — Center-screen modal with guna name, score badge, 3-line description, and dynamic verdict. Tap outside or "Close" to dismiss.
- **Manglik Dosha detection** — Checks Mars house position (1, 2, 4, 7, 8, 12) from chart data for both persons. Shows red warning card with person name and house number.
- **Paid report upsell** — Lock icon + text: "Full compatibility report with detailed analysis available in paid version."
- **8 GUNA_INFO descriptions** — Static descriptions for Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi.
- **Helper functions** — `getScoreColor()`, `getOrdinal()`, `detectManglik()`.

### Files Modified (1)
| File | Action |
|------|--------|
| `compatibility.tsx` | Modified — donut chart, guna grid, modal, Manglik detection, new styles |

---

## [M6.1] Fix SplashScreen Promise Rejection Error — 2026-02-26

### Fixed
- **Two red `ERROR` banners on every app launch** — `SplashScreen.preventAutoHideAsync()` was called at module scope (line 10 of `app/_layout.tsx`) before the native view controller was registered, causing unhandled promise rejections. Added `.catch(() => {})` to both `preventAutoHideAsync()` (line 10) and `hideAsync()` (line 22). Splash screen still works normally — errors only fired on fast startup / web platform race condition.

### Files Modified (1)
| File | Action |
|------|--------|
| `app/_layout.tsx` | Modified — added `.catch(() => {})` to `preventAutoHideAsync()` and `hideAsync()` |

---

## [M6] Fix Chart Data Caching — Active Chart Store + Backend Update — 2026-02-25

### Fixed
- **Edit screen showed wrong person's data** — Viewing Chart A, then Chart B, then editing showed B's data. Root cause: `handleViewChart()` called `saveBirthData()` which overwrote a SINGLE AsyncStorage slot (`saved_birth_data`). All screens read from this one slot.
- **Editing a chart created a duplicate** — Backend `POST /v1/charts/save` always creates a new record when any field changes (dedup only matches exact `input_hash`). No PUT endpoint existed to update in-place. So editing name "John" → "Johnny" created a brand new DB entry.
- **Compatibility check corrupted user's birth data** — `saveBirthData()` was called after compatibility check in `handleCheck()`, overwriting the user's primary birth data with Person A's data.

### Added
- **`activeChartStore.ts`** — New module-level in-memory store (same pattern as `dashaNavStore.ts`). Separates "user's own birth data" (AsyncStorage, persistent) from "currently viewed/edited saved chart" (transient, clears on app restart).
- **Backend `update_chart_report()`** — New CRUD function in `chart_crud.py` that updates encrypted birth data + input hash in-place. Clears stale `result_data`. Owner-only access check.
- **Backend `PUT /v1/charts/{chart_id}`** — New endpoint using existing `ChartSaveRequest` schema. Returns `{ updated: true, id }` or 404.
- **Frontend `CHART.UPDATE(id)`** — New endpoint constant for PUT requests.

### Changed
- **`saved-charts.tsx`** — `handleViewChart()` now calls `activeChartStore.set()` instead of `saveBirthData()`. No more AsyncStorage overwrite when viewing charts.
- **`birth-chart.tsx`** — Uses `effectiveData = activeChartStore.getBirthData() ?? savedData` pattern. "Create New Chart" clears activeChartStore before navigating.
- **`dasha.tsx`** — Same `effectiveData` pattern for data source selection.
- **`horoscope.tsx`** — Same `effectiveData` pattern for data source selection.
- **`birth-details.tsx`** — Checks `activeChartStore` for chart ID on load. If editing a saved chart: pre-fills from store + uses PUT to update. If editing user's own data: original flow (saveBirthData + POST).
- **`new-chart.tsx`** — Calls `activeChartStore.clear()` at start of `handleSave` to ensure fresh context.
- **`compatibility.tsx`** — Removed `saveBirthData()` call after compatibility check. No more side effect corrupting user's primary data.

### Backend Files Modified (2)
| File | Action |
|------|--------|
| `app/db/crud/chart_crud.py` | Modified — added `update_chart_report()` function |
| `app/api/v1/router.py` | Modified — added `PUT /v1/charts/{chart_id}` endpoint + import |

### Frontend Files Modified/Created (9 = 1 new + 8 modified)
| File | Action |
|------|--------|
| `src/stores/activeChartStore.ts` | **NEW** — Module-level active chart context (chartId + birthData) |
| `src/api/endpoints.ts` | Modified — added `CHART.UPDATE(id)` |
| `app/(auth)/(tabs)/my-data/saved-charts.tsx` | Modified — use activeChartStore, removed useBirthData import |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Modified — effectiveData pattern, clear store on "Create New Chart" |
| `app/(auth)/(tabs)/tools/dasha.tsx` | Modified — effectiveData pattern |
| `app/(auth)/(tabs)/tools/horoscope.tsx` | Modified — effectiveData pattern |
| `app/(auth)/(tabs)/birth-details.tsx` | Modified — chart ID tracking, PUT vs POST branching |
| `app/(auth)/(tabs)/tools/new-chart.tsx` | Modified — activeChartStore.clear() on save |
| `app/(auth)/(tabs)/tools/compatibility.tsx` | Modified — removed saveBirthData side effect |

---

## [M5.6b] Saved Charts — Tappable Cards + Delete Feature — 2026-02-25

### Changed
- **Entire card tappable** — Saved chart cards are now fully tappable via `<Pressable>` wrapping `<GlassCard>`. Tap loads chart data into `useBirthData` and navigates to birth-chart screen. Removed old "View" button.

### Added
- **Delete chart feature (full-stack)** — Each card has a red "Delete" button (trash icon + "Delete" text) that shows an `Alert` confirmation dialog before deleting. `e.stopPropagation()` prevents card tap from firing during delete.
- **Backend DELETE endpoint** — `DELETE /v1/charts/{chart_id}` — deletes a chart report owned by the authenticated user. Returns `{ deleted: true, id }` or 404 if not found.
- **Backend `delete_chart_report()`** — New CRUD function in `chart_crud.py` that deletes by report_id + user_id ownership check.
- **Frontend `CHART.DELETE(id)`** — New endpoint constant returning `/v1/charts/${id}`.

### Backend Files Modified (2)
| File | Action |
|------|--------|
| `app/db/crud/chart_crud.py` | Modified — added `delete_chart_report()` function |
| `app/api/v1/router.py` | Modified — added `DELETE /v1/charts/{chart_id}` endpoint + import |

### Frontend Files Modified (2)
| File | Action |
|------|--------|
| `src/api/endpoints.ts` | Modified — added `CHART.DELETE(id)` endpoint constant |
| `app/(auth)/(tabs)/my-data/saved-charts.tsx` | Modified — tappable cards, delete button with Alert confirmation, optimistic state removal |

---

## [M5.6] Separate "Create New Chart" Screen — 2026-02-25

### Fixed
- **"Create New Chart" showed pre-populated form** — Both "Create New Chart" and "Edit Details" navigated to the same `birth-details.tsx` screen using `?from=chart`. expo-router caches Tab screens (component stays mounted), so state persisted between visits. `skipAutoLoad` flag didn't clear stale `savedData` from the hook.

### Added
- **Dedicated `new-chart.tsx` screen** — Lives inside `tools/` Stack navigator where `router.push()` guarantees a fresh component instance every time. All fields start blank (name='', gender=null, dob=1990-01-01, tob=06:00, place=null). Uses `useBirthData({ skipAutoLoad: true })` for save only — no loading.

### Changed
- **`birth-details.tsx` simplified** — Removed `useLocalSearchParams`, `from` param, `skipAutoLoad` logic, blank-form reset block, and `from`-dependent navigation. Now has ONE job: pre-fill from saved data for editing/initial setup. After save: `router.canGoBack() ? router.back() : router.replace('/(auth)/(tabs)')`.
- **10 navigation routes updated** across 6 files — "Create New Chart" paths now use `tools/new-chart`; "Edit Details" paths use `birth-details` (no param); `?from=dasha` and `?from=horoscope` params removed.

### Files Modified/Created (7 = 1 new + 6 modified)
| File | Action |
|------|--------|
| `app/(auth)/(tabs)/tools/new-chart.tsx` | **NEW** — Always-blank chart creation form |
| `app/(auth)/(tabs)/birth-details.tsx` | Modified — removed from param logic, simplified to edit-only |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Modified — 3 route changes (Create → new-chart, Edit/Enter → birth-details) |
| `app/(auth)/(tabs)/my-data/index.tsx` | Modified — "Add New Chart" → tools/new-chart |
| `app/(auth)/(tabs)/my-data/saved-charts.tsx` | Modified — "Create First Chart" → tools/new-chart |
| `app/(auth)/(tabs)/tools/dasha.tsx` | Modified — removed `?from=dasha` from 2 navigation calls |
| `app/(auth)/(tabs)/tools/horoscope.tsx` | Modified — removed `?from=horoscope` from 2 navigation calls |

---

## [M5.5] Fix Startup Warnings — API Log + Deprecated SafeAreaView — 2026-02-25

### Fixed
- **`WARN [API] Base URL resolved to:` yellow banner on startup** — Downgraded `console.warn` to `console.log` in `src/api/client.ts`. Debug message still visible in dev console but no longer triggers the yellow warning banner.
- **`WARN SafeAreaView has been deprecated` warning** — Two files imported `SafeAreaView` from the deprecated `react-native` core instead of the correct `react-native-safe-area-context` package (already installed). Moved imports to match the pattern in `Screen.tsx`.

### Files Modified (3)
| File | Action |
|------|--------|
| `src/api/client.ts` | Modified — `console.warn` → `console.log` for API base URL message |
| `src/components/layout/AppHeader.tsx` | Modified — `SafeAreaView` import moved from `react-native` to `react-native-safe-area-context` |
| `src/components/form/PlaceAutocomplete.tsx` | Modified — `SafeAreaView` import moved from `react-native` to `react-native-safe-area-context` |

---

## [M5.3-fix] Fix POP_TO_TOP Error on Tab Re-Tap — 2026-02-25

### Fixed
- **"The action 'POP_TO_TOP' was not handled by any navigator" error** — M5.3 used `StackActions.popToTop()` dispatched from the Tab Navigator's `navigation` prop. Stack actions dispatched to a Tab navigator bubble UP to parents (not DOWN to children) — no navigator handles it, causing a red error banner. Replaced with `navigation.navigate(route.name, { screen: 'index' })` which the Tab navigator forwards to the nested Stack.
- **Home tab no longer throws on re-tap** — Added `TABS_WITH_STACK` guard set (`tools`, `reports`, `profile`, `my-data`). Home tab (no nested Stack) is excluded — re-tap is a safe no-op.

### Files Modified (1)
| File | Action |
|------|--------|
| `src/components/layout/TabBar.tsx` | Modified — removed `StackActions` import, added `TABS_WITH_STACK` set, replaced `popToTop()` with `navigate(route.name, { screen: 'index' })` |

---

## [M5.4] Gender Field — Backend + Mobile Full-Stack — 2026-02-25

### Added
- **GenderSelector component** — New `src/components/form/GenderSelector.tsx` segmented toggle (♂ Male | ♀ Female) with purple accent, haptic feedback, and optional error display. Follows `ChartStyleToggle` styling pattern.
- **Backend `gender` field** — `AstroRequest` schema now accepts `Optional[Literal["male", "female"]]`. Propagated to `bundle.meta.gender`, LLM chart context (`birth_chart_summary.gender`), and LLM text formatter.
- **6 backend tests** — Gender validation tests: male/female pass, None allowed, "other"/"Male" rejected.

### Changed
- **birth-details form** — Gender selector added between Full Name and Date of Birth. Required field — form won't submit without selection. Pre-fills from saved data, resets for "Create New Chart" flow.
- **useBirthData hook** — `BirthData` interface extended with `gender?: 'male' | 'female'`. Gender persisted to AsyncStorage and backend.
- **All tool pages** — birth-chart, dasha, horoscope API request bodies now include `gender` field.
- **Compatibility page** — Both Person A and Person B forms have gender selectors. Validation enforced on step transitions.
- **Saved Charts display** — Gender symbol (♂/♀) shown on card between name and date.

### Backend Files Modified (4)
| File | Action |
|------|--------|
| `app/utils/schema.py` | Modified — added `gender` Literal field to AstroRequest |
| `app/core/headless_engine.py` | Modified — added `gender` to bundle meta dict |
| `app/core/llm_chart_context.py` | Modified — added gender to birth_chart_summary + text formatter |
| `tests/unit/test_schema_validators.py` | Modified — added 6 gender validation tests |

### Frontend Files Modified (7 = 1 new + 6 modified)
| File | Action |
|------|--------|
| `src/components/form/GenderSelector.tsx` | **NEW** — Segmented toggle component |
| `src/hooks/useBirthData.ts` | Modified — gender in BirthData interface + backend load |
| `app/(auth)/(tabs)/birth-details.tsx` | Modified — gender state, validation, form JSX, save call |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Modified — gender in API body + deps |
| `app/(auth)/(tabs)/tools/dasha.tsx` | Modified — gender in API body + deps |
| `app/(auth)/(tabs)/tools/horoscope.tsx` | Modified — gender in API body + deps |
| `app/(auth)/(tabs)/tools/compatibility.tsx` | Modified — gender in PersonData, both forms, validation, makeBody |
| `app/(auth)/(tabs)/my-data/saved-charts.tsx` | Modified — gender display + saveBirthData |

---

## [M5.3] Tab Navigation — Re-tap Resets to Root Screen — 2026-02-25

### Fixed
- **Re-tapping focused tab now resets nested stack** — Previously, tapping the already-active tab did nothing (stale cached screen remained). Added `StackActions.popToTop()` in the `isFocused` branch of `handlePress`. Now: Tools → Birth Chart → tap "Tools" tab → returns to Tools index. Safe no-op for tabs without nested stacks.

### Files Modified (1)
| File | Action |
|------|--------|
| `src/components/layout/TabBar.tsx` | Modified — added `StackActions` import + `else if (isFocused)` branch with `popToTop()` |

---

## [M5.2] OTP Login — Auto-Fill Name + Consent Default — 2026-02-25

### Fixed
- **Returning users' Full Name auto-populated** — `handleSendOtp()` now captures the OTP Send API response and sets `fullName` state from `result.full_name` (returned by backend for existing users). Previously the response was discarded.
- **`handleResend()` already had this fix** — Resend handler at line 124 already captured `result.full_name`; only the initial send was missing it.

### Changed
- **Marketing consent defaults to ON** — Changed `useState(false)` → `useState(true)` for `marketingConsent` state.

### Files Modified (1)
| File | Action |
|------|--------|
| `app/login.tsx` | Modified — captured OTP send response + set fullName; marketingConsent default `true` |

---

## [M4.5-fix] Stale Chart After New Chart Creation — 2026-02-25

### Fixed
- **Race condition eliminated** — `saveBirthData()` fires POST to backend (fire-and-forget). When `reload()` ran, it hit backend GET first (Priority 1), which returned the previous person's data because POST hadn't completed. **Fix:** Swapped priority order in `loadData()` — AsyncStorage first (always has the freshest save from `saveBirthData`), backend as fallback only.
- **Stale React state cleared** — Even after `savedData` updated, old `chartData`/`natalPlanets` React state persisted visually. **Fix:** Added `chart_needs_refresh` flag pattern — `birth-details.tsx` sets flag in AsyncStorage after save; `birth-chart.tsx` checks flag on focus and clears stale states (`chartData`, `natalPlanets`, `selectedHouse`).

### Files Modified (3)
| File | Action |
|------|--------|
| `src/hooks/useBirthData.ts` | Modified — swapped priority: AsyncStorage first → backend fallback; syncs backend data to AsyncStorage |
| `app/(auth)/(tabs)/birth-details.tsx` | Modified — sets `chart_needs_refresh` flag + clears `cached_chart_response` after save |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Modified — checks `chart_needs_refresh` flag on focus, clears stale chartData/natalPlanets/selectedHouse |

---

## [M5.1] Report Language Preference in Profile — 2026-02-25

### Added
- **Report language selector** — New GlassCard section in Profile screen with language-outline icon showing current selection. Supports 14 languages: English (USA), Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, Urdu, Sanskrit.
- **Bottom sheet language picker** — Modal with scrollable list, checkmark on active selection, haptic feedback on tap.
- **Persistent preference** — Selected language stored in AsyncStorage (`report_language` key). Defaults to English.
- **Scope hint** — Subtitle text clarifies: "Report language applies to generated PDF reports only, not app screens."

### Files Modified (1)
| File | Action |
|------|--------|
| `app/(auth)/(tabs)/profile/index.tsx` | Modified — added REPORT_LANGUAGES constant, state, picker Modal, GlassCard section |

---

## [M5] Dasha 5-Screen Drill-Down Navigation — 2026-02-25

### Changed
- **Dasha screen rewritten** — Replaced recursive expand/collapse tree (DashaNode) with a flat scrollable list of Mahadasha period cards. Auto-scrolls to current Mahadasha via `ScrollView` ref + `onLayout`. Current period highlighted with green accent and "Current" badge.

### Added
- **Module-level dasha store** (`dashaNavStore.ts`) — Caches full 5-level dasha tree after API fetch. Provides `getAtPath(path)` for dot-separated index traversal (e.g., `path=3.5.2` → tree[3].sub_periods[5].sub_periods[2].sub_periods).
- **DashaPeriodCard component** (`DashaPeriodCard.tsx`) — Shared tappable card with planet name, date range, level label, current badge, and drill-down chevron. Used by both dasha.tsx and dasha-level.tsx.
- **Generic sub-level screen** (`dasha-level.tsx`) — Single screen serving Antardasha through Prana (levels 2–5). Reads `path` query param, traverses cached tree, shows breadcrumb header, current period detection, and "Back" button.
- **Path alias** — `@stores/*` added to `tsconfig.json` and `babel.config.js` for `src/stores/` directory.

### Architecture
- **Screen 1** (dasha.tsx): All Mahadashas → tap pushes `dasha-level?path={idx}`
- **Screens 2–5** (dasha-level.tsx): Sub-periods at each level → tap pushes `dasha-level?path={parent}.{idx}`
- **Navigation**: Expo Router `push()` for forward (supports same-route stacking), `back()` for return
- **Data strategy**: Single API fetch with `dasha_depth=5`, zero additional requests for drill-down

### Files Modified/Created (5)
| File | Action |
|------|--------|
| `src/stores/dashaNavStore.ts` | **New** — Module-level tree cache + path-based traversal |
| `src/components/dasha/DashaPeriodCard.tsx` | **New** — Shared period card component |
| `app/(auth)/(tabs)/tools/dasha.tsx` | **Rewritten** — Flat Mahadasha list with auto-scroll |
| `app/(auth)/(tabs)/tools/dasha-level.tsx` | **New** — Generic sub-level screen for levels 2–5 |
| `tsconfig.json`, `babel.config.js` | Modified — added `@stores` path alias |

---

## [M4.5] Create New Chart Flow — Blank Form + Redirect — 2026-02-25

### Fixed
- **"Create New Chart" form pre-populated** — birth-details is a hidden tab that stays mounted; `savedData` persisted from initial load. Added `from` to useEffect dependency array; when `from === 'chart'`, all 5 form fields (name, dob, tob, place, placeText) are explicitly reset to blank.
- **No redirect to chart display after save** — `router.canGoBack()` unreliable with hidden tab navigation. When `from === 'chart'` or `from === 'saved-charts'`, explicitly navigates to `/(auth)/(tabs)/tools/birth-chart`.
- **Saved Charts not refreshing** — Replaced `useEffect` with `useFocusEffect` in saved-charts.tsx so chart list refetches every time the screen gains focus.

### Files Modified (2)
| File | Action |
|------|--------|
| `app/(auth)/(tabs)/birth-details.tsx` | Modified — form reset on `from=chart`, explicit navigation after save |
| `app/(auth)/(tabs)/my-data/saved-charts.tsx` | Modified — `useEffect` → `useFocusEffect` for chart list refresh |

---

## [M4.4] North Indian Chart — Rashi Number Only — 2026-02-25

### Changed
- **Removed sign abbreviations from rashi labels** — North Indian chart now shows just the rashi number (e.g., `8`) instead of `Cap( 8)`. Reduces clutter in limited house space and improves planet text readability.
- **Removed unused `SIGN_SHORT` import** from NorthIndianChart.tsx.

### Files Modified (1)
| File | Action |
|------|--------|
| `src/components/charts/NorthIndianChart.tsx` | Modified — rashi label shows number only, removed SIGN_SHORT import |

---

## [M4.3-fix] North Indian Chart Text Misalignment Fix — 2026-02-25

### Fixed
- **Planet text misaligned in North Indian houses** — Centroid-based `startY = cy - (...)` formula used fixed geometric centroids that don't account for rashi labels, ASC markers, or usable vertical space. House 1 was off by -49px (text hugging ASC marker), House 7 by +30px (text pushed toward rashi label).
- **Solution: Bounds-based centering** — Replaced `CENTROIDS` constant with `HOUSE_BOUNDS` (per-house `cx`, `topY`, `botY`). New formula: `startY = topY + (botY - topY - totalTextH) / 2 + fit.fontSize` — same proven approach as South Indian chart. Text now centers within each house's actual usable space.

### Files Modified (1)
| File | Action |
|------|--------|
| `src/components/charts/NorthIndianChart.tsx` | Modified — replaced CENTROIDS with HOUSE_BOUNDS, bounds-based centering formula |

---

## [M4.3] Smart Text Fitting — Prevent Overflow & Overlap — 2026-02-25

### Added
- **Adaptive step-down algorithm** (`chartTextFit.ts`) — Precomputed lookup tables for fontSize, lineHeight, and truncation level based on planet count per house. Separate tables for North Indian (triangle vs diamond houses) and South Indian (regular vs ASC cells). Every configuration mathematically proven to fit within house boundaries.
- **Centralized label builder** (`buildChartLabel()` in `jyotish.ts`) — Three truncation levels: `full` (abbr + degree + suffix), `compact` (abbr + degree), `minimal` (abbr + suffix). Replaces duplicate `buildLabel()` functions in both chart files.
- **Vertical centering** — South Indian chart planet text now centers within the safe zone between rashi label and cell bottom, instead of using a fixed offset.

### Files Modified/Created (4)
| File | Action |
|------|--------|
| `src/utils/chartTextFit.ts` | **New** — Step-down lookup tables for adaptive sizing |
| `src/utils/jyotish.ts` | Modified — added `buildChartLabel()` with 3 truncation levels |
| `src/components/charts/NorthIndianChart.tsx` | Modified — uses `fitNorthIndian()` + `buildChartLabel()`, removed local `buildLabel()` |
| `src/components/charts/SouthIndianChart.tsx` | Modified — uses `fitSouthIndian()` + `buildChartLabel()`, removed local `buildLabel()`, vertical centering |

---

## [M4.2] Remove Redundant "Refresh Chart" Button — 2026-02-25

### Removed
- **"Refresh Chart" button** from birth-chart.tsx — Redundant because chart auto-fetches on mount, "Edit Details" triggers re-fetch, and divisional chart pills re-render on tap.

### Files Modified (1)
| File | Action |
|------|--------|
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Modified — removed Refresh button block (lines 322–329) |

---

## [M4.1] Fix Tiny Chart Text on Physical Devices — 2026-02-25

### Fixed
- **Chart SVG font sizes too small on mobile** — Planet text (18→26), rashi labels (14→22), ASC markers (12→18 North, 10→16 South), center labels (13→20), and line height spacing (26/24→34) all increased ~57% in both `NorthIndianChart.tsx` and `SouthIndianChart.tsx`. Legend text preserved at original size. Both charts share `viewBox="0 0 600 660"` so the increase brings text to readable size on 5–6" phone screens.

### Files Modified (2)
| File | Action |
|------|--------|
| `src/components/charts/NorthIndianChart.tsx` | Modified — increased 5 font sizes + lineH |
| `src/components/charts/SouthIndianChart.tsx` | Modified — increased 6 font sizes + lineH |

---

## [M4] Birth Chart UX + My Data Hub — 2026-02-24

### Changed
- **Planet degree display rounded** — Planet Positions table now shows whole degrees (`15°`) instead of DMS notation (`15° 23' 45"`). `formatDegrees()` simplified to `Math.round(lon)°`. SVG chart labels (which already used `toDegreeStr()`) are unaffected.
- **"South Indian" / "North Indian" toggle → "Chart Display" / "Table View"** — Repurposed `ChartStyleToggle` component into `ChartViewToggle`. "Chart Display" (default) shows the chart SVG; "Table View" shows the Planet Positions table. Each mode is mutually exclusive.
- **Chart format now controlled by Profile** — South Indian vs North Indian chart format is determined solely by the Profile Preferences toggle (persisted in AsyncStorage). The birth chart screen reads this preference reactively via `useFocusEffect`. No inline South/North toggle remains.
- **"birth-details" tab renamed to "My Data"** — Bottom tab bar now shows 5 tabs: Home, Tools, Reports, Profile, My Data. The raw "birth-details" label no longer appears (hidden via `HIDDEN_ROUTES` set in `TabBar.tsx`).

### Added
- **My Data hub screen** (`my-data/index.tsx`) — 4 navigation cards in a 2×2 grid: Saved Charts, Add New Chart, Purchase History, Download Reports.
- **Saved Charts screen** (`my-data/saved-charts.tsx`) — Lists charts from `/v1/charts/saved` API with name, DOB, place, and "View" button to load chart.
- **Purchase History screen** (`my-data/purchase-history.tsx`) — Lists orders from `/v1/payment/razorpay/orders` with date, status badge, amount, and report items.
- **"My Data" in hamburger menu** — Added folder icon entry between "My Reports" and "Profile".

### Files Modified/Created (10)
| File | Action |
|------|--------|
| `src/utils/jyotish.ts` | Modified — `formatDegrees()` simplified to whole degrees |
| `src/components/charts/ChartStyleToggle.tsx` | Modified — renamed to `ChartViewToggle`, labels "Chart Display" / "Table View" |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Modified — view mode toggle, conditional chart/table render, `useFocusEffect` for profile preference |
| `app/(auth)/(tabs)/my-data/_layout.tsx` | **New** — Stack layout for My Data section |
| `app/(auth)/(tabs)/my-data/index.tsx` | **New** — Hub screen with 4 navigation cards |
| `app/(auth)/(tabs)/my-data/saved-charts.tsx` | **New** — Saved charts list |
| `app/(auth)/(tabs)/my-data/purchase-history.tsx` | **New** — Purchase history list |
| `src/components/layout/TabBar.tsx` | Modified — added `my-data` icon/label, `HIDDEN_ROUTES` filter for `birth-details` |
| `app/(auth)/(tabs)/_layout.tsx` | Modified — registered `my-data` tab |
| `src/components/layout/AppHeader.tsx` | Modified — added "My Data" to hamburger menu |

---

## [M3.3] Fix Login Timeout on Physical Device — 2026-02-24

### Fixed
- **API URL resolves to phone's localhost** — `resolveBaseUrl()` in `client.ts` relied on `Constants.expoConfig?.hostUri` which returns `undefined` or `localhost` across sessions/network changes on physical devices. Fallback was `http://localhost:8000` — the phone's own localhost, unreachable. Added additional SDK fallback paths (`manifest2.extra.expoGo.debuggerHost`, `manifest.debuggerHost`) and set explicit `EXPO_PUBLIC_API_BASE_URL` env var as safety net.
- **No debug visibility for URL resolution** — Added `console.warn('[API] Base URL resolved to:', BASE_URL)` in `__DEV__` mode so the resolved URL is always visible in Expo terminal/console.

### Files Modified (2)
| File | Change |
|------|--------|
| `src/api/client.ts` | Added manifest2/manifest debuggerHost fallbacks, added `console.warn` debug logging |
| `.env` | Set `EXPO_PUBLIC_API_BASE_URL=http://192.168.2.108:8000` (Mac LAN IP) |

---

## [M3] UX Redesign — 2026-02-23

### Added
- **Central Birth Details screen** (`birth-details.tsx`) — single entry point for all birth data
- **Auto-redirect after login** — new users without birth data are sent to birth-details before seeing the home screen
- **Divisional chart picker** — horizontal scrollable pills (D1–D60) on Birth Chart screen
- **Chart caching** — full API response cached in AsyncStorage for instant re-load
- **5-level Dasha depth** — Mahadasha through Prana (was 3 levels)
- **Auto-expand current period** — DashaNode now auto-opens current period at ALL depth levels
- **No-data guard** — all tool screens show a friendly CTA when no birth data exists
- **"Edit Birth Details" button** — present on Chart, Dasha, and Horoscope screens
- **"Refresh" buttons** — re-fetch data without navigating away
- **Astro Yagya logo** — `assets/logo.png` (1536x1024) and `assets/icon.png` (1024x1024)
- **Splash screen** — app.json configured with logo on dark background
- **App icon** — 1024x1024 square crop of logo

### Changed
- **App name** — "Vedic Astro" renamed to **"Astro Yagya"** everywhere (app.json, headers, menu, login, onboarding, profile, payment, constants)
- **AppHeader** — planet icon replaced with logo image (32x32 header, 44x44 menu); search icon removed; user name removed from menu
- **Home screen** — removed "Namaste, {firstName}" greeting and date display
- **Quick action icons** — doubled from 52x52 to **96x96** containers, icon size 26 to **48**
- **Birth Chart screen** — complete rewrite: removed form, auto-loads from saved birth data, added divisional chart picker
- **Dasha screen** — complete rewrite: removed form, auto-loads with `dasha_depth=5`
- **Horoscope screen** — complete rewrite: removed form, auto-loads predictions
- **DashaNode component** — changed `useState(depth === 0 && isCurrent)` to `useState(isCurrent)` for auto-expand at all levels
- **AuthContext** — clears `birth_data_entered` and `cached_chart_response` on logout
- **Onboarding slide 1** — planet icon replaced with logo image
- **Login screen** — planet/gradient replaced with logo image

### Removed
- `showSearch` prop from `AppHeader` (dead search icon removed)
- Form components (DatePicker, TimePicker, PlaceAutocomplete) from Birth Chart, Dasha, and Horoscope screens
- "Namaste" greeting from home screen
- User name display from hamburger menu header

### Files Modified (18)
| File | Action |
|------|--------|
| `src/hooks/useBirthData.ts` | Modified — added `hasBirthData()`, `CHART_CACHE_KEY`, `BIRTH_DATA_ENTERED_KEY` |
| `app/(auth)/(tabs)/birth-details.tsx` | **New** — central birth data entry screen |
| `app/(auth)/(tabs)/_layout.tsx` | Modified — added hidden birth-details tab |
| `app/(auth)/_layout.tsx` | Modified — birth data check + redirect |
| `src/context/AuthContext.tsx` | Modified — clear birth flags on logout |
| `src/components/layout/AppHeader.tsx` | Modified — logo image, removed search, removed user name |
| `app/(auth)/(tabs)/index.tsx` | Modified — removed greeting, doubled icons |
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | **Rewritten** — auto-load, divisional picker, cache |
| `app/(auth)/(tabs)/tools/dasha.tsx` | **Rewritten** — auto-load, 5-level depth |
| `app/(auth)/(tabs)/tools/horoscope.tsx` | **Rewritten** — auto-load predictions |
| `src/components/dasha/DashaNode.tsx` | Modified — auto-expand all current levels |
| `app/login.tsx` | Modified — logo image, renamed to Astro Yagya |
| `app/onboarding.tsx` | Modified — logo image on slide 1 |
| `app.json` | Modified — name, icon, splash |
| `app/(auth)/(tabs)/profile/index.tsx` | Modified — version text |
| `src/constants/app.ts` | Modified — APP_NAME |
| `app/(auth)/(tabs)/reports/payment.tsx` | Modified — Razorpay display name |
| `assets/logo.png` | **New** — approved logo |
| `assets/icon.png` | **New** — 1024x1024 square icon |
| `tsconfig.json` | Modified — @assets path alias |
| `babel.config.js` | Modified — @assets alias |

---

## [M3.2] Backend API Data Hookup — 2026-02-23

### Fixed
- **Birth Chart: Bundle not unwrapped** — `setChartData(data)` stored the full API response `{ bundle: {...}, manifest: {...} }` instead of unwrapping `data.bundle`. All subsequent `chartData.charts?.D1` reads returned `undefined`. Now correctly unwraps: `const bundle = data?.bundle || data`.
- **Birth Chart: D1 placements missing planetData** — Backend's `charts.D1.placements[h]` contains `{ sign, planets: [...] }` but NO `planetData` key. Chart SVG components read `hData.planetData?.[pName]?.degree` → `null`. Ported `enrichD1WithPlanetData()` from web `BirthChartPage.jsx` — deep-clones D1 placements and injects degree, isRetro, isCombust from `natal.planets`.
- **Birth Chart: Vargas not transformed** — Backend returns per-planet varga data `{ D9: { Sun: { sign, degree }, ... } }` but SouthIndianChart expects per-house placements. `vargaToChartData()` existed in `jyotish.ts` but was never called. Now imported and used for all D2+ divisional charts.
- **Birth Chart: Cache stored raw response** — Cache now stores unwrapped bundle; cached data load also extracts `natalPlanets`.
- **Dasha: Bundle not unwrapped** — Same issue as Birth Chart. Fixed with `const bundle = data?.bundle || data`.
- **Dasha: Wrong data path** — Code read `dashaData?.dasha?.mahadasha_periods` but backend returns `bundle.dasha_tree` (array). Fixed to `dashaData?.dasha_tree || []`.
- **Dasha: currentMaha not computed** — Was reading non-existent `dashaData?.dasha?.current_mahadasha`. Now computed via `useMemo` by finding the period where `now >= start && now <= end`.
- **DashaNode: Date fields wrong** — Backend uses `start`/`end` (ISO strings) but DashaNode read `node.start_date`/`node.end_date` → blank dates. Added fallback: `node.start_date || node.start`.
- **Horoscope: Response structure mismatch** — `/predict/evaluate` returns `{ prediction: {...} }` (singular object), not `{ predictions: [...] }` (plural array). Fixed data access to `predictions?.prediction`, wrapped in array.
- **Horoscope: Wrong score path** — `predictions?.overall_score` → `undefined`. Correct path: `prediction.probability_score`.
- **Horoscope: PredictionCard field mapping** — Fixed: `domain`→`subdomain_name`, `narrative`→`interpretation`, `score`→`probability_score`.

### Files Modified (4)
| File | Change |
|------|--------|
| `app/(auth)/(tabs)/tools/birth-chart.tsx` | Unwrap bundle, add `enrichD1WithPlanetData()`, import/use `vargaToChartData` for D2+, add `natalPlanets` state, fix cache |
| `app/(auth)/(tabs)/tools/dasha.tsx` | Unwrap bundle, fix data path to `dasha_tree`, compute `currentMaha` via useMemo |
| `src/components/dasha/DashaNode.tsx` | Date field fallbacks: `node.start_date \|\| node.start`, sub_periods access: `node.sub_periods \|\| node.children \|\| []` |
| `app/(auth)/(tabs)/tools/horoscope.tsx` | Singular `prediction` object, `probability_score`, PredictionCard field mapping |

---

## [M3.1] Post-Release Bug Fixes — 2026-02-23

### Fixed
- **Login logo too small** — hero logo was 120×80, now **300×200**. Removed redundant "Astro Yagya" `<Text>` title below logo (logo already displays the brand name). Removed `borderRadius` from logo image.
- **FormInput border invisible until tap** — animated border produced `rgba(123,91,255,0)` (fully transparent) when unfocused, overriding the static `#3d506e` border. Replaced with `interpolateColor()` from reanimated — now smoothly transitions from `#3d506e` (unfocused) → `#7b5bff` (focused). Border is always visible.
- **Onboarding slides blank on physical device** — `Dimensions.get('window')` at module top-level returns `{width:0, height:0}` before layout completes on physical devices, making all slides zero-width (invisible). Replaced with `useWindowDimensions()` hook inside the component. Slide dimensions now passed as inline styles.

### Files Modified (3)
| File | Change |
|------|--------|
| `app/login.tsx` | Logo 120×80 → 300×200, removed title text, removed `borderRadius`, removed `title` style |
| `src/components/form/FormInput.tsx` | Added `interpolateColor` import, replaced transparent animation with grey→purple transition |
| `app/onboarding.tsx` | `Dimensions.get('window')` → `useWindowDimensions()` hook, inline slide dimensions |

---

## [M2.7] UX Polish & Bug Fixes — 2026-02-23

### Fixed
- API field name mismatches — all tool screens sent wrong fields (`date`/`time`/`lat`/`lon`) instead of (`dob`/`tob`/`place_of_birth`)
- Backend uvicorn binding — changed from `127.0.0.1:8001` to `0.0.0.0:8000` for physical device access
- Auto-detect API URL via `expo-constants` hostUri — no more hardcoded IPs in `.env`
- API retry logic — 2 retries with exponential backoff (1s, 3s), 20s timeout
- Onboarding not showing — created `app/index.tsx` redirect gate

---

## [M2.5] Reports & Payments — 2026-02-22

### Added
- Report catalog with 6 Vedic analysis reports
- Order page with server-validated pricing
- Razorpay checkout integration
- My Reports page with PDF download
- Payment verification flow

---

## [M2.0] Vedic Tools Integration — 2026-02-22

### Added
- Birth Chart screen with South/North Indian SVG charts
- Dasha Timeline screen with expandable tree
- Compatibility (Guna Milan) screen with 8-guna scoring
- Horoscope predictions screen with PredictionCard components
- Chart style toggle (persisted in AsyncStorage)
- Place autocomplete with debounced API search

---

## [M1.5] Authentication & Navigation — 2026-02-21

### Added
- OTP-based passwordless login (email + phone)
- Country code auto-detection via geo API
- Auth context with JWT token management
- Protected route wrappers
- Tab-based navigation (Home, Tools, Reports, Profile)
- Onboarding carousel (4 slides)

---

## [M1.0] Foundation — 2026-02-21

### Added
- Expo SDK 54 + React Native 0.81.5 project scaffold
- File-based routing with expo-router v6
- Dark theme system (colors, typography, spacing)
- Core UI components: Screen, GlassCard, GradientButton, FormInput, ErrorBanner, LoadingSpinner
- API client with JWT injection, auto-logout on 401
- TypeScript strict mode with path aliases
