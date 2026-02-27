# Component Catalog

All components live under `src/components/` and are organized by category.

---

## Layout Components

### `Screen`
**File:** `layout/Screen.tsx`

Wraps every screen with `SafeAreaView`, status bar config, and horizontal padding.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | — | Screen content |
| `edges` | `('top'\|'bottom'\|'left'\|'right')[]` | No | `['top']` | Safe area edges |
| `noPadding` | `boolean` | No | `false` | Remove horizontal padding |

```tsx
import { Screen } from '@components/layout/Screen';

<Screen>
  <Text>My screen content</Text>
</Screen>
```

### `KeyboardAvoidingWrapper`
**File:** `layout/KeyboardAvoidingWrapper.tsx`

Platform-aware keyboard avoidance. Uses `padding` behavior on iOS, `height` on Android.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Form content |

### `TabBar`
**File:** `layout/TabBar.tsx`

Custom bottom tab bar with blur background and haptic feedback. Used internally by the `(tabs)/_layout.tsx` — not imported directly by screens.

---

## UI Components

### `GlassCard`
**File:** `ui/GlassCard.tsx`

Glass-morphism card with animated press scale and optional haptic feedback.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | — | Card content |
| `onPress` | `() => void` | No | — | Makes card tappable |
| `style` | `StyleProp<ViewStyle>` | No | — | Custom container styles |
| `noPadding` | `boolean` | No | `false` | Remove default padding |
| `noHaptic` | `boolean` | No | `false` | Disable haptic feedback |

```tsx
import { GlassCard } from '@components/ui/GlassCard';

<GlassCard onPress={() => console.log('tapped')}>
  <Text>Card content</Text>
</GlassCard>
```

### `GradientButton`
**File:** `ui/GradientButton.tsx`

Primary CTA button with linear gradient background.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | — | Button label |
| `onPress` | `() => void` | Yes | — | Tap handler |
| `loading` | `boolean` | No | `false` | Show spinner, disable taps |
| `disabled` | `boolean` | No | `false` | Grey out, disable taps |
| `variant` | `'primary' \| 'secondary'` | No | `'primary'` | Gradient style |
| `style` | `StyleProp<ViewStyle>` | No | — | Container overrides |

```tsx
<GradientButton
  title="Generate Chart"
  onPress={handleGenerate}
  loading={isLoading}
  disabled={!place}
/>
```

### `ErrorBanner`
**File:** `ui/ErrorBanner.tsx`

Dismissible error/warning banner.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | Yes | — | Error message text |
| `onDismiss` | `() => void` | No | — | Close button handler |
| `variant` | `'error' \| 'warning'` | No | `'error'` | Color variant |

### `LoadingSpinner`
**File:** `ui/LoadingSpinner.tsx`

Centered activity indicator with optional message.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | No | — | Text below spinner |
| `size` | `'small' \| 'large'` | No | `'large'` | Spinner size |

---

## Form Components

### `FormInput`
**File:** `form/FormInput.tsx`

Text input with animated focus border, label, error display, and optional icon. Extends `TextInputProps`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Label above input |
| `error` | `string` | No | Error message below input (turns border red) |
| `icon` | `ReactNode` | No | Left icon |
| `...rest` | `TextInputProps` | — | All standard RN TextInput props |

```tsx
<FormInput
  label="Name"
  placeholder="Enter name"
  value={name}
  onChangeText={setName}
  autoCapitalize="words"
/>
```

### `DatePicker`
**File:** `form/DatePicker.tsx`

Date selector with platform-aware behavior.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Label text |
| `value` | `Date` | Yes | Current date |
| `onChange` | `(date: Date) => void` | Yes | Selection callback |
| `error` | `string` | No | Error message |

**iOS behavior:** Opens a bottom-sheet `Modal` with spinner + Done/Cancel buttons.
**Android behavior:** Native date dialog that auto-dismisses on selection.

### `TimePicker`
**File:** `form/TimePicker.tsx`

Same API and behavior as DatePicker but for time selection.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Label text |
| `value` | `Date` | Yes | Current time |
| `onChange` | `(date: Date) => void` | Yes | Selection callback |
| `error` | `string` | No | Error message |

### `OtpInput`
**File:** `form/OtpInput.tsx`

Multi-box OTP entry with auto-advance, paste support, and haptic on complete.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `length` | `number` | No | `6` | Number of OTP digits |
| `onComplete` | `(code: string) => void` | Yes | — | Called when all digits entered |

### `PlaceAutocomplete`
**File:** `form/PlaceAutocomplete.tsx`

Location search with debounced API typeahead. Calls `GET /v1/location/search?q=...`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Label text |
| `value` | `string` | Yes | Display text for selected place |
| `onSelect` | `(place: Place) => void` | Yes | Selection callback |
| `error` | `string` | No | Error message |

**Place type:**
```typescript
interface Place {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}
```

---

## Card Components

### `ToolCard`
**File:** `cards/ToolCard.tsx`

Grid card for the Tools list screen.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Tool name |
| `description` | `string` | Yes | Short description |
| `icon` | `string` | Yes | Ionicons icon name |
| `onPress` | `() => void` | Yes | Navigation handler |

### `PredictionCard`
**File:** `cards/PredictionCard.tsx`

Expandable prediction result card for the Horoscope screen.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `domain` | `string` | Yes | Prediction domain (Career, Health, etc.) |
| `headline` | `string` | Yes | Summary headline |
| `narrative` | `string` | Yes | Detailed text |
| `score` | `number` | No | Confidence score (colors: green/yellow/red) |

---

## Chart Components

### `SouthIndianChart`
**File:** `charts/SouthIndianChart.tsx`

SVG-rendered 4x4 grid Vedic chart using `react-native-svg`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `chartData` | `D1ChartData` | Yes | House placements from API |
| `onHousePress` | `(house: number) => void` | No | House tap handler |
| `selectedHouse` | `number \| null` | No | Currently selected house |
| `d9Vargas` | `any` | No | Navamsha overlay data |

### `NorthIndianChart`
**File:** `charts/NorthIndianChart.tsx`

SVG-rendered diamond Vedic chart. Same props interface as SouthIndianChart.

### `ChartStyleToggle`
**File:** `charts/ChartStyleToggle.tsx`

Segmented control to switch between chart styles.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `'South Indian' \| 'North Indian'` | Yes | Current style |
| `onChange` | `(style) => void` | Yes | Style change handler |

---

## Specialized Components

### `DashaNode`
**File:** `dasha/DashaNode.tsx`

Recursive dasha period tree node. Expands/collapses to show sub-periods.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `node` | `DashaPeriod` | Yes | — | Period data from API |
| `depth` | `number` | No | `0` | Nesting depth (controls indentation) |
| `isCurrent` | `boolean` | No | `false` | Highlight as active period |
