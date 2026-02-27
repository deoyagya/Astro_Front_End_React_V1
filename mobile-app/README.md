# Vedic Astro Mobile App

Cross-platform iOS & Android mobile app for Vedic astrology calculations, charts, and AI-powered predictions. Built with **Expo SDK 54**, **React Native 0.81**, and **React 19**.

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Copy environment file and set your backend URL
cp .env.example .env
# Edit .env → set EXPO_PUBLIC_API_BASE_URL to your backend

# 3. Start development server
npx expo start

# 4. Run on devices
# iPhone/Android → Scan QR code with Expo Go app
# iOS Simulator  → Press 'i' in terminal
# Android Emu    → Press 'a' in terminal
# Web browser    → Press 'w' in terminal
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL | `http://192.168.2.108:8000` |

> **Physical device testing:** Use your Mac's LAN IP (not `localhost`). Find it with `ipconfig getifaddr en0`.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | 54 |
| UI Runtime | React Native | 0.81.5 |
| React | React | 19.1.0 |
| Navigation | expo-router (file-based) | 6.x |
| Animations | react-native-reanimated | 4.1.1 |
| Charts | react-native-svg | 15.12.1 |
| Auth Storage | expo-secure-store | 15.x |
| Fonts | @expo-google-fonts/inter | 0.4.2 |
| Haptics | expo-haptics | 15.x |
| Glassmorphism | expo-blur + expo-linear-gradient | 15.x |

---

## Project Structure

```
mobile-app/
├── app/                          # Expo Router — file-based navigation
│   ├── _layout.tsx               # Root: fonts, splash, SafeArea, AuthProvider
│   ├── login.tsx                 # OTP login (email or phone)
│   └── (auth)/                   # Auth-guarded group
│       ├── _layout.tsx           # Redirect to /login if unauthenticated
│       └── (tabs)/               # Tab navigator
│           ├── _layout.tsx       # Custom TabBar (Home, Tools, Reports, Profile)
│           ├── index.tsx         # Home dashboard (greeting, affirmation, quick actions)
│           ├── tools/
│           │   ├── _layout.tsx   # Stack navigator for tool screens
│           │   ├── index.tsx     # Tools grid (4 tools)
│           │   ├── birth-chart.tsx
│           │   ├── dasha.tsx
│           │   ├── compatibility.tsx
│           │   └── horoscope.tsx
│           ├── reports/
│           │   ├── _layout.tsx
│           │   └── index.tsx     # "Coming Soon" placeholder
│           └── profile/
│               ├── _layout.tsx
│               └── index.tsx     # User info, chart style toggle, logout
│
├── src/                          # Shared source code (non-route)
│   ├── api/
│   │   ├── client.ts             # Fetch wrapper (JWT, 401 handling, timeouts)
│   │   └── endpoints.ts          # All backend endpoint constants
│   ├── components/
│   │   ├── cards/                # PredictionCard, ToolCard
│   │   ├── charts/               # NorthIndianChart, SouthIndianChart, ChartStyleToggle
│   │   ├── dasha/                # DashaNode (recursive tree)
│   │   ├── form/                 # DatePicker, TimePicker, FormInput, OtpInput, PlaceAutocomplete
│   │   ├── layout/               # Screen, KeyboardAvoidingWrapper, TabBar
│   │   └── ui/                   # GlassCard, GradientButton, LoadingSpinner, ErrorBanner
│   ├── context/
│   │   └── AuthContext.tsx        # Auth state (user, token, login, logout, refreshUser)
│   ├── hooks/                    # useApi, useDebounce, useHaptics, useAnimatedPress, useSecureStorage
│   ├── theme/                    # colors, typography, spacing, shadows, index
│   ├── utils/
│   │   └── jyotish.ts            # Vedic astrology helpers (sign names, dignities, degrees)
│   └── data/
│       └── content.ts            # Static content (affirmations, tips)
│
├── .env                          # Environment config (not committed)
├── app.json                      # Expo configuration
├── babel.config.js               # Babel + module-resolver aliases
├── tsconfig.json                 # TypeScript + path aliases
└── package.json                  # Dependencies
```

---

## Path Aliases

Both TypeScript (`tsconfig.json`) and runtime (`babel.config.js`) support these:

| Alias | Maps To |
|-------|---------|
| `@` | `./src` |
| `@components` | `./src/components` |
| `@hooks` | `./src/hooks` |
| `@utils` | `./src/utils` |
| `@api` | `./src/api` |
| `@context` | `./src/context` |
| `@theme` | `./src/theme` |

**Usage:** `import { GlassCard } from '@components/ui/GlassCard';`

---

## Design System

### Color Palette (Dark Theme Only)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#050914` | App background |
| `panel` | `#0f1728` | Card/glass backgrounds |
| `accent` | `#7b5bff` | Primary purple |
| `accent2` | `#43d0ff` | Secondary cyan |
| `text` | `#f5f8ff` | Primary text |
| `muted` | `#9aa7c6` | Secondary text, labels |
| `success` / `benefic` | `#43d983` / `#2ed573` | Positive states, benefic planets |
| `error` / `malefic` | `#ff4757` / `#ff6b6b` | Error states, malefic planets |

### Typography

All text uses the **Inter** font. Pre-built styles in `typography.styles`:

| Style | Size | Weight | Use For |
|-------|------|--------|---------|
| `h1` | 32px | Bold | Login screen title only |
| `h2` | 24px | Bold | Tool screen titles |
| `h3` | 20px | SemiBold | Section titles, card headers |
| `body` | 16px | Regular | Body text |
| `bodySmall` | 14px | Regular | Secondary info |
| `caption` | 12px | Regular | Table headers, fine print |
| `label` | 14px | Medium | Form labels |
| `button` | 16px | SemiBold | Button text |

### Spacing (4-point Grid)

`xs:4  sm:8  md:12  lg:16  xl:20  xxl:24  xxxl:28  xxxxl:40`

---

## Backend API

Connects to the **vedic-astro-api** FastAPI backend. See [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) for full endpoint reference.

Key patterns:
- JWT Bearer token in `Authorization` header (managed by `api/client.ts`)
- 401 responses auto-clear token and redirect to `/login`
- OTP passwordless auth (single `identifier` field for email and phone)
- Chart/prediction endpoints accept: `{ name, date, time, lat, lon, tz_offset }`

---

## Further Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow, auth lifecycle, navigation, state management |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | Component catalog with props and usage examples |
| [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md) | Backend endpoints, request/response shapes, error handling |
| [docs/GOTCHAS.md](docs/GOTCHAS.md) | Platform quirks, known issues, debugging tips |
