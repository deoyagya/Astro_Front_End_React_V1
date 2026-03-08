# Phase 2 — Mobile App Implementation Blueprint

> Generated: 2026-03-08 | For: Astro Yagya Mobile (Expo Router + React Native)
> Covers: AI Chat, Muhurta Finder, Temporal Forecast, Subscription Management
> Backend: vedic-astro-api (FastAPI) | 29 endpoints across 4 routers

---

## NEW FILES TO CREATE

```
mobile-app/
├── app/(auth)/(tabs)/
│   ├── consult/                          ← NEW TAB (Tab 3)
│   │   ├── _layout.tsx                   ← Stack navigator
│   │   ├── index.tsx                     ← Consult landing (3 feature cards)
│   │   ├── chat-areas.tsx                ← Chat: life area picker
│   │   ├── chat-templates.tsx            ← Chat: question template picker
│   │   ├── chat-thread.tsx               ← Chat: active conversation
│   │   ├── temporal-forecast.tsx         ← Temporal: 13-area card grid
│   │   └── temporal-timeline.tsx         ← Temporal: single-area timeline chart
│   └── tools/
│       ├── muhurta.tsx                   ← Muhurta: event picker + date form
│       ├── muhurta-results.tsx           ← Muhurta: ranked window list
│       └── muhurta-detail.tsx            ← Muhurta: single window detail + validate
├── app/(auth)/(tabs)/my-data/
│   └── subscription.tsx                  ← Subscription management
├── src/
│   ├── api/endpoints.ts                  ← ADD: CHAT, MUHURTA, TEMPORAL, SUBSCRIPTION
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx            ← Message bubble (user/ai)
│   │   │   ├── TemplateChip.tsx          ← Tappable question chip
│   │   │   └── QuotaBadge.tsx            ← Remaining questions badge
│   │   ├── muhurta/
│   │   │   ├── EventCard.tsx             ← Event type card (icon + price)
│   │   │   ├── WindowCard.tsx            ← Auspicious window result card
│   │   │   └── PanchangSummary.tsx       ← Tithi/Nakshatra/Yoga row
│   │   ├── temporal/
│   │   │   ├── LifeAreaCard.tsx          ← Opp/Threat card (score bar)
│   │   │   └── TimelineChart.tsx         ← SVG area chart (victory-native)
│   │   └── subscription/
│   │       ├── PlanCard.tsx              ← Plan tier card
│   │       ├── CreditPackCard.tsx        ← Credit pack purchase card
│   │       └── FeatureBadge.tsx          ← Feature limit badge
│   ├── hooks/
│   │   └── usePremiumGate.ts            ← Reusable premium check hook
│   └── stores/
│       └── chatSessionStore.ts           ← Active chat session state
```

---

## 0. SHARED: ENDPOINT CONSTANTS + PREMIUM GATE

### File: `src/api/endpoints.ts` — ADD these blocks

```typescript
// ── Chat (9 endpoints) ──
export const CHAT = {
  LIFE_AREAS:     '/v1/chat/life-areas',
  START:          '/v1/chat/start',
  SESSIONS:       '/v1/chat/sessions',
  SESSION:        (id: string) => `/v1/chat/sessions/${id}`,
  ASK:            (id: string) => `/v1/chat/sessions/${id}/ask`,
  FOLLOW_UP:      (id: string) => `/v1/chat/sessions/${id}/follow-up`,
  END:            (id: string) => `/v1/chat/sessions/${id}/end`,
  TEMPLATES:      (key: string) => `/v1/chat/templates/${key}`,
  QUOTA:          '/v1/chat/quota',
} as const;

// ── Muhurta (6 endpoints) ──
export const MUHURTA = {
  EVENTS:         '/v1/muhurta/events',
  PANCHANG:       '/v1/muhurta/panchang',
  DAILY:          '/v1/muhurta/daily',
  FIND:           '/v1/muhurta/find',
  VALIDATE:       '/v1/muhurta/validate',
  REPORT:         '/v1/muhurta/report',
} as const;

// ── Temporal Forecast (4 endpoints) ──
export const TEMPORAL = {
  LIFE_AREAS:     '/v1/temporal-forecast/life-areas',
  COMPUTE:        '/v1/temporal-forecast/compute',
  INTERPRET:      '/v1/temporal-forecast/interpret',
  TIMELINE:       '/v1/temporal-forecast/timeline',
} as const;

// ── Subscription (10 endpoints) ──
export const SUBSCRIPTION = {
  PLANS:          '/v1/subscription/plans',
  CHECKOUT:       '/v1/subscription/checkout',
  VERIFY:         '/v1/subscription/verify',
  CURRENT:        '/v1/subscription/current',
  CANCEL:         '/v1/subscription/cancel',
  CHANGE_PLAN:    '/v1/subscription/change-plan',
  VALIDATE_COUPON:'/v1/subscription/validate-coupon',
  CREDIT_PACKS:   '/v1/subscription/credit-packs',
  PURCHASE_CREDITS:'/v1/subscription/purchase-credits',
  CREDIT_BALANCE: '/v1/subscription/credit-balance',
} as const;

// ── Muhurta Payment ──
export const MUHURTA_PAYMENT = {
  CREATE_ORDER:   '/v1/payment/razorpay/muhurta-order',
} as const;
```

### File: `src/hooks/usePremiumGate.ts` — NEW

```typescript
import { useAuth } from '@context/AuthContext';

export function usePremiumGate() {
  const { user } = useAuth();
  const role = user?.role || 'free';
  const isPremium = role === 'premium' || role === 'elite' || role === 'admin';
  const isBasicPlus = role !== 'free';
  return { isPremium, isBasicPlus, role };
}
```

---

## 1. AI CHAT — 3 Screens

### Premium gate: Paid members only (basic+/premium/elite/admin)

### Screen 1A: `consult/chat-areas.tsx` — Life Area Picker

**Purpose**: User picks 1 of 13 life areas to start a chat session.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Load life areas | `GET` | `/v1/chat/life-areas` | Authenticated |
| Load quota | `GET` | `/v1/chat/quota` | Authenticated |
| Load past sessions | `GET` | `/v1/chat/sessions?limit=5` | Authenticated |

**Component tree**:
```
Screen
  AppHeader
  QuotaBadge                      ← "12/30 questions remaining"
  ScrollView
    Text "What area of life?"
    FlatList (2-column grid)
      GlassCard × 13              ← icon + name + domain label
        onPress → navigate to chat-templates with life_area_key
    Text "Recent Sessions"
    FlatList (horizontal)
      GlassCard × N               ← session.life_area_name + question_count + status
        onPress → navigate to chat-thread with session_id (resume)
```

**State**:
```typescript
const [areas, setAreas] = useState<LifeArea[]>([]);
const [quota, setQuota] = useState<Quota | null>(null);
const [sessions, setSessions] = useState<ChatSession[]>([]);
const [loading, setLoading] = useState(true);
```

**Data flow**:
1. On mount → parallel fetch: `api.get(CHAT.LIFE_AREAS)`, `api.get(CHAT.QUOTA)`, `api.get(CHAT.SESSIONS + '?limit=5')`
2. Tap area card → `router.push({ pathname: 'consult/chat-templates', params: { life_area_key: area.key, area_name: area.name } })`
3. Tap recent session → `router.push({ pathname: 'consult/chat-thread', params: { session_id: session.id } })`

---

### Screen 1B: `consult/chat-templates.tsx` — Question Template Picker

**Purpose**: User picks a predefined question template to start or continue a chat.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Load templates | `GET` | `/v1/chat/templates/{life_area_key}` | Authenticated |
| Start session | `POST` | `/v1/chat/start` | Authenticated |

**Receives params**: `life_area_key`, `area_name`

**Component tree**:
```
Screen
  AppHeader (back button)
  ScrollView
    Text "{area_name}"
    Text "Choose a question"
    FlatList
      TemplateChip × N            ← question_text + credit_cost badge
        onPress → startSession() then navigate to chat-thread
```

**State**:
```typescript
const [templates, setTemplates] = useState<Template[]>([]);
const [starting, setStarting] = useState(false);
```

**Data flow**:
1. On mount → `api.get(CHAT.TEMPLATES(life_area_key))`
2. Tap template → call `api.post(CHAT.START, { life_area_key, birth_data: savedBirthData, mode: 'text' })`
3. On success → get `session_id` from response → `router.replace({ pathname: 'consult/chat-thread', params: { session_id, template_id: template.id } })`

**`birth_data` construction** (from `useBirthData` hook):
```typescript
const birthPayload = {
  dob: savedData.dob,           // "1990-01-15"
  tob_h: savedData.tob_h,      // 6
  tob_m: savedData.tob_m,      // 30
  lat: savedData.lat,           // 28.6139
  lon: savedData.lon,           // 77.2090
  tz_id: savedData.tz_id,      // "Asia/Kolkata"
  place_of_birth: savedData.place_of_birth,
};
```

---

### Screen 1C: `consult/chat-thread.tsx` — Active Chat Conversation

**Purpose**: Full-screen chat UI. Ask predefined questions, type follow-ups, see AI responses.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Load session + messages | `GET` | `/v1/chat/sessions/{session_id}` | Authenticated |
| Ask predefined question | `POST` | `/v1/chat/sessions/{session_id}/ask` | Authenticated |
| Ask follow-up | `POST` | `/v1/chat/sessions/{session_id}/follow-up` | Authenticated |
| End session | `POST` | `/v1/chat/sessions/{session_id}/end` | Authenticated |
| Load quota | `GET` | `/v1/chat/quota` | Authenticated |

**Receives params**: `session_id`, optionally `template_id` (first question to auto-ask)

**Component tree**:
```
Screen (no padding — full bleed)
  View (header bar)
    Text "{life_area_name}"
    QuotaBadge
    Pressable "End Session" → confirm modal → api.post(CHAT.END(session_id))
  FlatList (inverted=false, chat messages)
    ChatBubble × N
      role='user' → right-aligned, accent bg
      role='assistant' → left-aligned, panel bg
      shows: content, follow_up_suggestions (chips), timestamp
  KeyboardAvoidingWrapper
    View (input bar)
      TextInput (placeholder "Ask a follow-up...")
      Pressable (send icon) → handleFollowUp()
```

**State**:
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [session, setSession] = useState<ChatSession | null>(null);
const [inputText, setInputText] = useState('');
const [sending, setSending] = useState(false);
const [quota, setQuota] = useState<Quota | null>(null);
```

**Data flow**:
1. On mount → `api.get(CHAT.SESSION(session_id))` → populate messages + session
2. If `template_id` param exists → auto-fire `api.post(CHAT.ASK(session_id), { template_id })` → append response to messages
3. Tap follow-up suggestion chip → `api.post(CHAT.FOLLOW_UP(session_id), { text: chip.text })` → append to messages
4. Type + send → `api.post(CHAT.FOLLOW_UP(session_id), { text: inputText })` → append to messages
5. Each response returns `follow_up_suggestions` array → render as tappable chips below AI bubble
6. End session → `api.post(CHAT.END(session_id))` → navigate back to chat-areas

**Request bodies**:
```typescript
// Ask predefined question
{ template_id: "uuid-string", is_voice: false }

// Ask follow-up
{ text: "What about next year?", is_voice: false }
```

**Error handling**:
- 429 → "You've reached your question limit. Upgrade for more."
- Session ended → disable input, show "Session ended" banner

---

## 2. MUHURTA FINDER — 3 Screens

### Premium gate: Paid events require payment; free events open to all.

### Screen 2A: `tools/muhurta.tsx` — Event Picker + Date Form

**Purpose**: User selects an event type, picks a date range + location, submits to find windows.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Load event types | `GET` | `/v1/muhurta/events` | Public |
| Find windows | `POST` | `/v1/muhurta/find` | Public |

**Component tree**:
```
Screen
  AppHeader
  ScrollView
    Text "Find Auspicious Time"
    FlatList (2-column grid)
      EventCard × N               ← icon + label + price badge (Free / ₹99)
        onPress → setSelectedEvent(event)
    --- (selected event form appears below) ---
    GlassCard (form)
      DatePicker label="Start Date"    ← start_date (YYYY-MM-DD, no past)
      DatePicker label="End Date"      ← end_date
      PlaceAutocomplete label="Location" ← lat, lon, tz_id
      Toggle "Personalize with birth data"
        (if on) → use savedData from useBirthData()
    GradientButton "Find Windows"
      onPress → handleFind()
      loading={finding}
```

**State**:
```typescript
const [events, setEvents] = useState<MuhurtaEvent[]>([]);
const [selectedEvent, setSelectedEvent] = useState<MuhurtaEvent | null>(null);
const [startDate, setStartDate] = useState(new Date());
const [endDate, setEndDate] = useState(() => {
  const d = new Date(); d.setDate(d.getDate() + 30); return d;
});
const [location, setLocation] = useState<{ lat: number; lon: number; tz_id: string } | null>(null);
const [personalize, setPersonalize] = useState(false);
const [finding, setFinding] = useState(false);
```

**Request body** (`POST /v1/muhurta/find`):
```typescript
{
  event_type: selectedEvent.event_key,        // e.g., "marriage"
  start_date: formatDate(startDate),          // "2026-04-01"
  end_date: formatDate(endDate),              // "2026-04-30"
  lat: location.lat,                          // 28.6139
  lon: location.lon,                          // 77.2090
  tz_id: location.tz_id,                      // "Asia/Kolkata"
  birth_data: personalize ? {                 // OPTIONAL
    name: savedData.name,
    dob: savedData.dob,
    tob: `${savedData.tob_h}:${String(savedData.tob_m).padStart(2,'0')}`,
    place_of_birth: savedData.place_of_birth,
    lat: savedData.lat,
    lon: savedData.lon,
    tz_id: savedData.tz_id,
  } : undefined,
}
```

**On success** → navigate to muhurta-results:
```typescript
router.push({
  pathname: '/(auth)/(tabs)/tools/muhurta-results',
  params: { resultJson: JSON.stringify(result) }
});
```

**Payment gate**: If `result.payment_required === true`, show paywall modal before results:
```typescript
if (result.payment_required) {
  // Show pricing: result.pricing.price_display
  // "Pay ₹99 to view results" → Razorpay flow
  // POST /v1/payment/razorpay/muhurta-order
}
```

---

### Screen 2B: `tools/muhurta-results.tsx` — Ranked Window List

**Purpose**: Display ranked auspicious windows found by the scanner.

**Receives**: `resultJson` param (serialized find response)

**Component tree**:
```
Screen
  AppHeader (back button)
  ScrollView
    View (summary header)
      Text "{event_label} — {total_windows} windows found"
      Text "Mode: {mode}" (generic / personalized)
    FlatList
      WindowCard × N               ← date, time range, score bar, quality badge
        quality colors:
          excellent → colors.success (#43d983)
          good → colors.benefic (#2ed573)
          average → colors.warning (#ffb454)
          poor → colors.error (#ff4757)
          avoid → colors.malefic (#ff6b6b)
        PanchangSummary             ← tithi + nakshatra + yoga (single row)
        onPress → navigate to muhurta-detail with window index
    GradientButton "Email Report"
      onPress → emailReport()
```

**Email report** (`POST /v1/muhurta/report`):
```typescript
{
  event_type: result.event_type,
  start_date: result.date_range.start,
  end_date: result.date_range.end,
  lat: result.location.lat,
  lon: result.location.lon,
  tz_id: result.location.tz_id,
  birth_data: result.birth_person || undefined,
  email: user.email,
}
```

---

### Screen 2C: `tools/muhurta-detail.tsx` — Single Window Detail + Validate

**Purpose**: Deep dive into one window — full panchang, validate, doshas, special yogas.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Validate moment | `POST` | `/v1/muhurta/validate` | Public |
| Get panchang | `POST` | `/v1/muhurta/panchang` | Public |

**Receives**: `windowJson` param (serialized single window object), `event_type`

**Component tree**:
```
Screen
  AppHeader (back button)
  ScrollView
    GlassCard (header)
      Text "{window.date} • {window.start_time}–{window.end_time}"
      Score bar (0-100) with quality badge
    GlassCard "Panchang"
      PanchangSummary (full)        ← tithi, nakshatra, yoga, karana, vara
      Quality badges per element
    GlassCard "Special Yogas"
      FlatList → yoga name chips (if any)
    GlassCard "Doshas / Warnings"
      FlatList → dosha descriptions (red-tinted)
    GlassCard "Inauspicious Periods"
      Rahu Kalam, Yamagandam, Gulika times
    GlassCard "Personalization" (if birth_data was provided)
      Tara Bala score + Chandra Bala score
    GradientButton "Validate This Moment"
      onPress → validate()
    --- validation result (if loaded) ---
    GlassCard "Validation Verdict"
      verdict badge (auspicious / moderate / inauspicious)
      reasoning text
      audit trail accordion
```

**Validate request** (`POST /v1/muhurta/validate`):
```typescript
{
  event_type: eventType,
  date: window.date,              // "2026-04-15"
  time: window.start_time,       // "09:30"
  lat: location.lat,
  lon: location.lon,
  tz_id: location.tz_id,
  birth_data: birthData || undefined,
}
```

---

## 3. TEMPORAL FORECAST — 2 Screens

### Premium gate: Premium/Elite/Admin only.

### Screen 3A: `consult/temporal-forecast.tsx` — 13-Area Card Grid

**Purpose**: Show opportunity/threat classification across 13 life areas for today.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Load life areas | `GET` | `/v1/temporal-forecast/life-areas` | Authenticated |
| Compute forecast | `POST` | `/v1/temporal-forecast/compute` | Premium+ |
| Compute + interpret | `POST` | `/v1/temporal-forecast/interpret` | Premium+ |

**Component tree**:
```
Screen
  AppHeader
  ScrollView
    View (summary header)
      Text "Temporal Forecast"
      Text "Transit Date: {today}"
      View (filter chips: All | Opportunity | Threat | Mixed)
    View (overall stats bar)
      "{opp_count} opp • {threat_count} threat • {mixed_count} mixed"
    FlatList
      LifeAreaCard × 13 (or filtered)
        icon + life_area_name + domain label
        Type badge (Opportunity / Threat / Mixed) + intensity badge
        Score bar (green left / red right)
        summary text
        onPress → navigate to temporal-timeline with life_area_id
```

**Request body** (`POST /v1/temporal-forecast/compute` or `/interpret`):
```typescript
{
  lat: chartBundle.bundle.request.lat,
  lon: chartBundle.bundle.request.lon,
  tz_id: chartBundle.bundle.request.tz_id,
  asc_sign: parseSignNum(natal.ascendant.sign),
  moon_sign: parseSignNum(natal.planets.Moon.sign),
  md_planet: currentDasha.md_planet,
  ad_planet: currentDasha.ad_planet,
  ad_start: currentDasha.ad_start,
  ad_end: currentDasha.ad_end,
  natal_planet_signs: extractNatalPlanetSigns(natal.planets),
}
```

**`extractNatalPlanetSigns` helper**:
```typescript
function extractNatalPlanetSigns(planets: Record<string, any>): Record<string, number> | null {
  const result: Record<string, number> = {};
  for (const [name, info] of Object.entries(planets)) {
    if (info?.sign_number) result[name] = info.sign_number;
  }
  return Object.keys(result).length > 0 ? result : null;
}
```

---

### Screen 3B: `consult/temporal-timeline.tsx` — Single-Area Timeline Chart

**Purpose**: Date-range chart showing how opportunity/threat evolves over time for one life area.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Load timeline | `POST` | `/v1/temporal-forecast/timeline` | Premium+ |

**Receives params**: `life_area_id`, `life_area_name`, `chartParamsJson` (serialized birth/dasha params)

**Component tree**:
```
Screen
  AppHeader (back button)
  ScrollView
    Text "{life_area_name} Timeline"
    GlassCard "Range"
      Slider (7 stops: 3mo → 20yr)
      Range label: "{RANGE_PRESETS[idx].label}"
      End labels: "Now" ← slider → "20 Years"
    GradientButton "Load Timeline"
      loading={timelineLoading}
    --- (after load) ---
    GlassCard "Peaks"
      View (row)
        Badge "Peak Opp: {date} ({score})"   ← green
        Badge "Peak Threat: {date} ({score})" ← red
    GlassCard "Stats"
      "{opp_count} opportunity • {threat_count} threat • {mixed_count} mixed"
      "Every {interval_days} days"
    TimelineChart                    ← victory-native VictoryArea
      X axis: dates
      Y axis: 0-100
      Green area: opportunity_score
      Red area: threat_score
      Peak dot markers
      Tap point → tooltip with date, type, intensity, score, trigger
```

**Range presets** (same as web):
```typescript
const RANGE_PRESETS = [
  { label: '3 Months',  days: 90,   interval: 7  },
  { label: '6 Months',  days: 180,  interval: 7  },
  { label: '1 Year',    days: 365,  interval: 14 },
  { label: '2 Years',   days: 730,  interval: 14 },
  { label: '5 Years',   days: 1825, interval: 60 },
  { label: '10 Years',  days: 3650, interval: 60 },
  { label: '20 Years',  days: 7300, interval: 90 },
];
```

**Request body** (`POST /v1/temporal-forecast/timeline`):
```typescript
{
  lat: chartParams.lat,
  lon: chartParams.lon,
  tz_id: chartParams.tz_id,
  asc_sign: chartParams.asc_sign,
  moon_sign: chartParams.moon_sign,
  md_planet: chartParams.md_planet,
  ad_planet: chartParams.ad_planet,
  ad_start: chartParams.ad_start,
  ad_end: chartParams.ad_end,
  natal_planet_signs: chartParams.natal_planet_signs,
  life_area_id: lifeAreaId,          // e.g., "601"
  scan_start: todayStr,              // "2026-03-08"
  scan_end: endDateStr,              // computed from preset
  interval_days: preset.interval,    // 7, 14, 60, or 90
}
```

**Chart library**: Install `victory-native` + `react-native-svg` (Recharts is web-only):
```bash
npx expo install victory-native react-native-svg
```

---

## 4. SUBSCRIPTION MANAGEMENT — 3 Screens

### Premium gate: None (all authenticated users can view/manage).

### Screen 4A: `my-data/subscription.tsx` — Current Plan + Overview

**Purpose**: Show current plan, features, credit balance, and actions.

**API calls**:
| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Current subscription | `GET` | `/v1/subscription/current` | Authenticated |
| Credit balance | `GET` | `/v1/subscription/credit-balance` | Authenticated |
| List plans | `GET` | `/v1/subscription/plans` | Public |
| Credit packs | `GET` | `/v1/subscription/credit-packs` | Public |
| Cancel | `POST` | `/v1/subscription/cancel` | Authenticated |
| Change plan | `POST` | `/v1/subscription/change-plan` | Authenticated |
| Checkout | `POST` | `/v1/subscription/checkout` | Authenticated |
| Verify payment | `POST` | `/v1/subscription/verify` | Authenticated |
| Validate coupon | `POST` | `/v1/subscription/validate-coupon` | Authenticated |
| Purchase credits | `POST` | `/v1/subscription/purchase-credits` | Authenticated |

**Component tree**:
```
Screen
  AppHeader
  ScrollView
    GlassCard "Current Plan"
      Plan name + badge (Free / Basic / Premium / Elite)
      Status (active / cancelled / expired)
      Billing cycle (monthly / yearly)
      Period end date
      Features list (from features_json)
        FeatureBadge × N          ← "10 Chat Questions", "3 Saved Charts"
    GlassCard "Credit Balance"
      FlatList
        FeatureBadge × N          ← feature_key: balance + expiry
    GlassCard "Credit Packs"
      FlatList (horizontal)
        CreditPackCard × N        ← name + credits + price
          onPress → handlePurchaseCredits(pack)
    --- Actions ---
    GradientButton "Change Plan"
      onPress → showPlanPicker()
    GradientButton variant="secondary" "Cancel Subscription"
      onPress → showCancelConfirm()
```

**Change plan flow** (modal):
1. Show plan picker (all plans from `GET /v1/subscription/plans`)
2. User selects plan + billing cycle
3. Optional coupon input → `POST /v1/subscription/validate-coupon` → show discount
4. Confirm → `POST /v1/subscription/checkout` → get Razorpay order
5. Open Razorpay SDK → on success get payment_id + signature
6. `POST /v1/subscription/verify` → confirm subscription activated
7. Refresh current subscription

**Checkout request** (`POST /v1/subscription/checkout`):
```typescript
{
  plan_slug: selectedPlan.slug,     // "premium"
  billing_cycle: "monthly",        // or "yearly"
  coupon_code: couponCode || undefined,
}
```

**Verify request** (`POST /v1/subscription/verify`):
```typescript
{
  payment_id: razorpayResponse.razorpay_payment_id,
  subscription_id: razorpayResponse.razorpay_subscription_id,
  signature: razorpayResponse.razorpay_signature,
}
```

**Cancel request** (`POST /v1/subscription/cancel`):
```typescript
{
  reason: "User requested cancellation",
  immediate: false,                 // end of billing period
}
```

**Purchase credits** (`POST /v1/subscription/purchase-credits`):
```typescript
{
  pack_id: pack.id,                 // UUID of credit pack
}
// Returns Razorpay order → same Razorpay SDK flow
```

**Razorpay integration** (React Native SDK):
```bash
npm install react-native-razorpay
```

```typescript
import RazorpayCheckout from 'react-native-razorpay';

const options = {
  key: checkoutResponse.razorpay_key_id,
  subscription_id: checkoutResponse.subscription_id,
  name: 'Astro Yagya',
  description: `${checkoutResponse.plan_name} - ${checkoutResponse.billing_cycle}`,
  currency: 'INR',
  amount: checkoutResponse.final_amount_paisa,
  prefill: { email: user.email, contact: user.phone },
  theme: { color: '#7b5bff' },
};

RazorpayCheckout.open(options)
  .then((data) => {
    // data.razorpay_payment_id, data.razorpay_subscription_id, data.razorpay_signature
    return api.post(SUBSCRIPTION.VERIFY, {
      payment_id: data.razorpay_payment_id,
      subscription_id: data.razorpay_subscription_id,
      signature: data.razorpay_signature,
    });
  })
  .then((verified) => {
    if (verified.verified) showSuccess("Subscription activated!");
    refreshSubscription();
  })
  .catch((error) => setError(error.description || 'Payment failed'));
```

---

## 5. CONSULT TAB — Navigation Wiring

### File: `app/(auth)/(tabs)/consult/_layout.tsx` — NEW

```typescript
import { Stack } from 'expo-router';
import { colors } from '@theme/colors';

export default function ConsultLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="chat-areas" />
      <Stack.Screen name="chat-templates" />
      <Stack.Screen name="chat-thread" />
      <Stack.Screen name="temporal-forecast" />
      <Stack.Screen name="temporal-timeline" />
    </Stack>
  );
}
```

### File: `app/(auth)/(tabs)/consult/index.tsx` — Consult Landing

```
Screen
  AppHeader
  ScrollView
    Text "Premium Consultation"
    GlassCard "AI Vedic Chat"        ← icon: chatbubbles
      "Ask questions about 13 life areas"
      onPress → router.push('consult/chat-areas')
    GlassCard "Temporal Forecast"    ← icon: trending-up
      "See opportunity & threat windows"
      onPress → router.push('consult/temporal-forecast')
    GlassCard "Chart Wizard"         ← icon: sparkles (Phase 2B)
      "Step-by-step consultation"
      onPress → TODO (Phase 2B)
    PremiumGate                      ← if not premium, show upgrade CTA
```

### Tab Bar Addition — modify `app/(auth)/(tabs)/_layout.tsx`

Add "Consult" as Tab 3 (between Tools and Reports):
```typescript
<Tabs.Screen
  name="consult"
  options={{
    title: 'Consult',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="chatbubble-ellipses" size={size} color={color} />
    ),
  }}
/>
```

### Tools Stack Addition — modify `app/(auth)/(tabs)/tools/_layout.tsx`

Add Muhurta screens:
```typescript
<Stack.Screen name="muhurta" />
<Stack.Screen name="muhurta-results" />
<Stack.Screen name="muhurta-detail" />
```

### My Data Stack Addition — modify `app/(auth)/(tabs)/my-data/_layout.tsx`

Add Subscription screen:
```typescript
<Stack.Screen name="subscription" />
```

---

## 6. NEW PACKAGES TO INSTALL

```bash
cd mobile-app

# Charts for temporal timeline
npx expo install victory-native react-native-svg

# Razorpay for subscription payments
npm install react-native-razorpay

# Already installed (verify):
# expo-haptics, @react-native-async-storage/async-storage,
# react-native-reanimated, expo-linear-gradient
```

---

## 7. IMPLEMENTATION ORDER

| # | Task | Screens | Est. Effort |
|---|------|---------|-------------|
| 1 | Add endpoint constants to `endpoints.ts` | 0 | 0.5 day |
| 2 | Create `usePremiumGate` hook | 0 | 0.5 day |
| 3 | Consult tab + layout + landing | 1 | 1 day |
| 4 | **Subscription Management** (4A) | 1 + plan modal | 3 days |
| 5 | **Muhurta Finder** (2A, 2B, 2C) | 3 + components | 5 days |
| 6 | **Temporal Forecast** (3A, 3B) | 2 + chart component | 4 days |
| 7 | **AI Chat** (1A, 1B, 1C) | 3 + components | 5 days |
| 8 | Polish + edge cases + testing | — | 2 days |
| **TOTAL** | | **11 screens** | **~21 days** |

**Recommended build order**: Subscription first (revenue gate for all others) → Muhurta (simplest UX) → Temporal (reuse web patterns) → Chat (most complex).

---

## 8. API ENDPOINT SUMMARY TABLE

| Feature | # | Method | Path | Auth | Screen |
|---------|---|--------|------|------|--------|
| **Chat** | 1 | GET | `/v1/chat/life-areas` | Auth | chat-areas |
| | 2 | POST | `/v1/chat/start` | Auth | chat-templates |
| | 3 | GET | `/v1/chat/sessions` | Auth | chat-areas |
| | 4 | GET | `/v1/chat/sessions/{id}` | Auth | chat-thread |
| | 5 | POST | `/v1/chat/sessions/{id}/ask` | Auth | chat-thread |
| | 6 | POST | `/v1/chat/sessions/{id}/follow-up` | Auth | chat-thread |
| | 7 | POST | `/v1/chat/sessions/{id}/end` | Auth | chat-thread |
| | 8 | GET | `/v1/chat/templates/{key}` | Auth | chat-templates |
| | 9 | GET | `/v1/chat/quota` | Auth | chat-areas, chat-thread |
| **Muhurta** | 10 | GET | `/v1/muhurta/events` | Public | muhurta |
| | 11 | POST | `/v1/muhurta/panchang` | Public | muhurta-detail |
| | 12 | POST | `/v1/muhurta/daily` | Public | (optional) |
| | 13 | POST | `/v1/muhurta/find` | Public | muhurta |
| | 14 | POST | `/v1/muhurta/validate` | Public | muhurta-detail |
| | 15 | POST | `/v1/muhurta/report` | Public | muhurta-results |
| | 16 | POST | `/v1/payment/razorpay/muhurta-order` | Auth | muhurta (paywall) |
| **Temporal** | 17 | GET | `/v1/temporal-forecast/life-areas` | Auth | temporal-forecast |
| | 18 | POST | `/v1/temporal-forecast/compute` | Premium | temporal-forecast |
| | 19 | POST | `/v1/temporal-forecast/interpret` | Premium | temporal-forecast |
| | 20 | POST | `/v1/temporal-forecast/timeline` | Premium | temporal-timeline |
| **Subscription** | 21 | GET | `/v1/subscription/plans` | Public | subscription |
| | 22 | POST | `/v1/subscription/checkout` | Auth | subscription |
| | 23 | POST | `/v1/subscription/verify` | Auth | subscription |
| | 24 | GET | `/v1/subscription/current` | Auth | subscription |
| | 25 | POST | `/v1/subscription/cancel` | Auth | subscription |
| | 26 | POST | `/v1/subscription/change-plan` | Auth | subscription |
| | 27 | POST | `/v1/subscription/validate-coupon` | Auth | subscription |
| | 28 | GET | `/v1/subscription/credit-packs` | Public | subscription |
| | 29 | POST | `/v1/subscription/purchase-credits` | Auth | subscription |
| | 30 | GET | `/v1/subscription/credit-balance` | Auth | subscription |
