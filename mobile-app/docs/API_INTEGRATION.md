# API Integration Guide

The mobile app communicates with the **vedic-astro-api** FastAPI backend. All endpoint constants are centralized in `src/api/endpoints.ts`, and all HTTP calls go through `src/api/client.ts`.

---

## Backend Connection

| Setting | Value |
|---------|-------|
| Base URL (dev, physical device) | `http://<mac-lan-ip>:8000` |
| Base URL (dev, simulator) | `http://localhost:8000` |
| Base URL (production) | Set in `.env` |
| Auth mechanism | JWT Bearer token |
| Content-Type | `application/json` |
| Timeout | 15 seconds |

The base URL is configured via the `EXPO_PUBLIC_API_BASE_URL` environment variable in `.env`.

---

## API Client Usage

```typescript
import { api } from '@api/client';

// GET request (auth token auto-attached)
const user = await api.get('/v1/auth/me');

// POST request (auth token auto-attached)
const chart = await api.post('/v1/chart/create', { name, date, time, lat, lon, tz_offset });

// Unauthenticated request (skip JWT)
const result = await api.post('/v1/auth/otp/send', { identifier }, { noAuth: true });

// Token management
await api.setToken(jwt);
await api.clearToken();
const token = await api.getToken();
```

### Error Handling

All API errors are normalized to:
```typescript
interface ApiError {
  message: string;    // Human-readable error message
  status: number;     // HTTP status code (0 for network/timeout errors)
  details?: any;      // Raw FastAPI error body
}
```

Special behaviors:
- **401** → auto-clears token, redirects to `/login`
- **422** → FastAPI validation errors joined into a single message
- **Timeout** → `"Request timed out"` after 15s
- **Network error** → `"Network error"` (device offline, server unreachable)

---

## Endpoint Reference

### Authentication (Public — `noAuth: true`)

#### `POST /v1/auth/otp/send`
Send OTP verification code to email or phone.

**Request:**
```json
{ "identifier": "user@example.com" }
```
or
```json
{ "identifier": "+919876543210" }
```

**Response:**
```json
{ "sent": true, "method": "email", "masked": "u***@example.com" }
```

#### `POST /v1/auth/otp/verify`
Verify OTP and get JWT token.

**Request:**
```json
{
  "identifier": "user@example.com",
  "otp_code": "123456",
  "full_name": "Ria Sharma",
  "marketing_consent": true
}
```

**Response:**
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer"
}
```

#### `GET /v1/auth/geo/detect`
Auto-detect country from IP (used for phone dial code).

**Response:**
```json
{ "country_code": "IN", "dial_code": "+91" }
```

---

### User Profile (Authenticated)

#### `GET /v1/auth/me`
Get current authenticated user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": null,
  "full_name": "Ria Sharma",
  "role": "user"
}
```

---

### Chart Calculations (Authenticated)

#### `POST /v1/chart/create`
Generate a Vedic birth chart with optional vargas and dasha.

**Request:**
```json
{
  "name": "Ria Sharma",
  "date": "1990-01-15",
  "time": "06:30",
  "lat": 28.6139,
  "lon": 77.2090,
  "tz_offset": 5.5
}
```

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `include_vargas` | `bool` | Include divisional charts (D2-D60) |
| `include_dasha` | `bool` | Include Vimshottari dasha periods |
| `dasha_depth` | `int` | Dasha sub-period depth (1-5, default 2) |

**Response (simplified):**
```json
{
  "charts": {
    "D1": {
      "placements": {
        "1": {
          "sign": 10,
          "planets": ["Sun", "Mercury"],
          "planetData": {
            "Sun": { "degree": 0.85, "isRetro": false },
            "Mercury": { "degree": 15.23, "isRetro": true }
          }
        }
      }
    }
  },
  "vargas": { "D9": { ... } },
  "dasha": {
    "current_mahadasha": "Jupiter",
    "mahadasha_periods": [
      {
        "planet": "Sun",
        "start_date": "1990-01-15",
        "end_date": "1996-01-15",
        "sub_periods": [ ... ]
      }
    ]
  }
}
```

#### `POST /v1/avakhada`
Get Avakhada (birth star) data for compatibility calculations.

Same request body as `/v1/chart/create`.

**Response:**
```json
{
  "moon_sign": "Taurus",
  "nakshatra": "Rohini",
  "nakshatra_pada": 2,
  "tithi": "Shukla Panchami",
  "yoga": "Siddha",
  "karana": "Balava"
}
```

---

### Predictions (Authenticated)

#### `POST /v1/predict/evaluate`
Get AI-powered predictions based on birth chart.

Same request body as `/v1/chart/create`.

**Response:**
```json
{
  "overall_score": 72,
  "predictions": [
    {
      "domain": "Career",
      "headline": "Strong professional growth ahead",
      "narrative": "Jupiter's transit through your 10th house...",
      "confidence": 85,
      "score": 78
    }
  ]
}
```

---

### Location Search (Authenticated)

#### `GET /v1/location/search?q={query}`
Search for places (used by PlaceAutocomplete).

**Response:**
```json
[
  {
    "name": "New Delhi, India",
    "lat": 28.6139,
    "lon": 77.2090,
    "country": "India",
    "state": "Delhi"
  }
]
```

---

### Reports & Payments (Authenticated)

#### `GET /v1/reports/my`
List user's purchased reports.

#### `GET /v1/reports/{id}/download`
Download a report PDF (streams binary).

#### `GET /v1/report-prices`
Get canonical report pricing.

#### `POST /v1/validate-cart`
Validate cart items and prices server-side.

#### `POST /v1/payment/razorpay/create-order`
Create a Razorpay payment order.

#### `POST /v1/payment/razorpay/verify`
Verify payment and activate subscription.

---

## How Screens Use the API

| Screen | Endpoint(s) | Auth Required |
|--------|-------------|---------------|
| Login | `otp/send`, `otp/verify`, `geo/detect` | No |
| Home | `auth/me` (via AuthContext) | Yes |
| Birth Chart | `chart/create?include_vargas=true` | Yes |
| Dasha | `chart/create?include_dasha=true&dasha_depth=3` | Yes |
| Compatibility | `chart/create` (x2) + `avakhada` (x2) | Yes |
| Horoscope | `predict/evaluate` | Yes |
| Profile | `auth/me` (via AuthContext) | Yes |
| Reports | `reports/my`, `reports/{id}/download` | Yes |

---

## Adding a New Endpoint

1. Add the constant to `src/api/endpoints.ts`:
   ```typescript
   export const MY_FEATURE = {
     DO_THING: '/v1/my-feature/do-thing',
   } as const;
   ```

2. Use it in your screen:
   ```typescript
   import { MY_FEATURE } from '@api/endpoints';
   const result = await api.post(MY_FEATURE.DO_THING, body);
   ```
