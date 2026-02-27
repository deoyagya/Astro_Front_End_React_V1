# Architecture Guide

## Navigation Model

The app uses **expo-router v6** (file-based routing). The file structure under `app/` directly maps to the navigation hierarchy:

```
/login                    → app/login.tsx           (public — no auth needed)
/                         → app/(auth)/(tabs)/index.tsx  (Home tab)
/tools                    → app/(auth)/(tabs)/tools/index.tsx
/tools/birth-chart        → app/(auth)/(tabs)/tools/birth-chart.tsx
/tools/dasha              → app/(auth)/(tabs)/tools/dasha.tsx
/tools/compatibility      → app/(auth)/(tabs)/tools/compatibility.tsx
/tools/horoscope          → app/(auth)/(tabs)/tools/horoscope.tsx
/reports                  → app/(auth)/(tabs)/reports/index.tsx
/profile                  → app/(auth)/(tabs)/profile/index.tsx
```

### Route Groups

| Group | Purpose | Layout File |
|-------|---------|-------------|
| `(auth)` | Auth guard — redirects to `/login` if no token | `app/(auth)/_layout.tsx` |
| `(tabs)` | Bottom tab navigator (Home, Tools, Reports, Profile) | `app/(auth)/(tabs)/_layout.tsx` |
| `tools/` | Stack navigator within Tools tab | `app/(auth)/(tabs)/tools/_layout.tsx` |
| `reports/` | Stack navigator within Reports tab | `app/(auth)/(tabs)/reports/_layout.tsx` |
| `profile/` | Stack navigator within Profile tab | `app/(auth)/(tabs)/profile/_layout.tsx` |

### Route Guard Flow

```
App Launch
  └→ app/_layout.tsx  (load fonts, show splash, wrap in AuthProvider)
       └→ AuthContext checks SecureStore for existing JWT
            ├─ Token found → GET /v1/auth/me → set user → render (auth) group
            └─ No token   → render login.tsx
```

---

## Authentication Flow

### OTP Passwordless Login

The app uses **OTP (one-time password)** authentication — no passwords. Works with both email and phone.

```
┌─────────────┐    POST /v1/auth/otp/send     ┌─────────┐
│  Login       │ ──────────────────────────────→│ Backend │
│  Screen      │    { identifier: "email" }     │         │
│              │                                │         │
│  Enter OTP   │    POST /v1/auth/otp/verify    │         │
│              │ ──────────────────────────────→│         │
│              │    { identifier, otp_code,     │         │
│              │      full_name,                │         │
│              │      marketing_consent }       │         │
│              │                                │         │
│              │ ←──────────────────────────────│         │
│              │    { access_token: "jwt..." }  │         │
└──────────────┘                                └─────────┘
```

**Critical field names** (backend contract):
- Send OTP: `{ identifier: string }` — NOT `email` or `phone`
- Verify OTP: `{ identifier, otp_code, full_name?, marketing_consent? }` — NOT `otp`

### Token Storage

| Store | Key | Purpose |
|-------|-----|---------|
| `expo-secure-store` | `auth_token` | JWT access token (encrypted native keychain) |
| `AsyncStorage` | `chart_style` | User's preferred chart rendering style |

### Auth Context API

```typescript
import { useAuth } from '@context/AuthContext';

const { user, token, isAuthenticated, isReady, login, logout, refreshUser } = useAuth();
```

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Current user object (`id`, `email?`, `phone?`, `full_name?`, `role`) |
| `token` | `string \| null` | JWT access token |
| `isAuthenticated` | `boolean` | `true` when both token AND user are present |
| `isReady` | `boolean` | `false` while checking stored token on app launch |
| `login(token)` | `function` | Store token + fetch user from `/v1/auth/me` |
| `logout()` | `function` | Clear token + reset user state |
| `refreshUser()` | `function` | Re-fetch user from `/v1/auth/me` |

---

## State Management

The app uses **React Context + local state** — no Redux or Zustand.

### Global State (Context)

| Context | Location | Provides |
|---------|----------|----------|
| `AuthContext` | `src/context/AuthContext.tsx` | User, token, login/logout |

### Local State (Per-Screen)

Each tool screen manages its own form state:
- `dob` / `tob` — Date objects for birth date & time
- `place` / `placeText` — Selected location from PlaceAutocomplete
- `loading` / `error` — API request state
- `chartData` / `dashaData` / `predictions` — API response data

### Persisted State (AsyncStorage)

| Key | Type | Purpose |
|-----|------|---------|
| `chart_style` | `'South Indian' \| 'North Indian'` | Chart rendering preference |

---

## Data Flow Pattern

Every tool screen follows the same pattern:

```
┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│ Form Inputs  │────→│ handleGenerate │────→│  api.post() │
│ (DOB, TOB,   │     │ - Validate     │     │  + JWT      │
│  Place)      │     │ - Build body   │     │  + timeout  │
└──────────────┘     │ - Use user.    │     └──────┬──────┘
                     │   full_name    │            │
                     └────────────────┘            ▼
┌──────────────┐                           ┌─────────────┐
│ Chart / Table│←──────────────────────────│ API Response │
│ / Prediction │     setChartData(data)    │   JSON       │
│   Display    │                           └─────────────┘
└──────────────┘
```

**Request body shape** (used by all tool screens):

```typescript
{
  name: string,          // from AuthContext user.full_name
  date: "YYYY-MM-DD",   // formatted from DatePicker
  time: "HH:MM",        // formatted from TimePicker
  lat: number,           // from PlaceAutocomplete
  lon: number,           // from PlaceAutocomplete
  tz_offset: number,     // timezone offset (default 5.5 for IST)
}
```

---

## API Client Architecture

`src/api/client.ts` is a thin fetch wrapper with:

1. **Auto JWT injection** — reads token from SecureStore on every request
2. **401 auto-logout** — clears token and redirects to `/login`
3. **Timeout** — 15s AbortController (configurable per-request)
4. **Error normalization** — FastAPI validation errors → single message string
5. **`noAuth` option** — skip JWT for public endpoints (OTP send/verify)

```typescript
import { api } from '@api/client';

// Authenticated request (auto-attaches JWT)
const chart = await api.post('/v1/chart/create', body);

// Unauthenticated request
const result = await api.post('/v1/auth/otp/send', { identifier }, { noAuth: true });

// Token management
await api.setToken(jwt);
await api.clearToken();
const token = await api.getToken();
```

---

## Chart Rendering

Two chart styles are supported, both using `react-native-svg`:

| Component | Style | Description |
|-----------|-------|-------------|
| `SouthIndianChart` | 4x4 grid | Traditional square chart with 12 houses |
| `NorthIndianChart` | Diamond | North Indian diamond layout |

Both accept the same props:
```typescript
interface ChartProps {
  chartData: D1ChartData;     // placements from API
  onHousePress?: (house: number) => void;
  selectedHouse?: number | null;
  d9Vargas?: any;             // Navamsha overlay data
}
```

Chart style preference is persisted in `AsyncStorage` under key `chart_style` and can be toggled via:
- `ChartStyleToggle` component on the Birth Chart screen
- Profile screen's "Chart Style" setting

---

## Adding a New Tool Screen

1. Create `app/(auth)/(tabs)/tools/my-tool.tsx`
2. Follow the existing pattern:
   ```typescript
   import { useAuth } from '@context/AuthContext';

   export default function MyToolScreen() {
     const { user } = useAuth();
     const [dob, setDob] = useState(new Date(1990, 0, 1));
     // ... standard form state ...

     const handleSubmit = async () => {
       const body = {
         name: user?.full_name || 'Chart',
         date: formatDate(dob),
         time: formatTime(tob),
         lat: place.lat,
         lon: place.lon,
         tz_offset: 5.5,
       };
       const data = await api.post(ENDPOINT, body);
       // ... display results ...
     };
   }
   ```
3. Add the route to `TOOLS` array in `tools/index.tsx`
4. Add the endpoint to `src/api/endpoints.ts`
