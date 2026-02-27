# Gotchas, Platform Quirks & Debugging

A collection of hard-won lessons from development. Read this before making changes.

---

## Critical: API Field Names

The backend uses non-obvious field names that differ from what you might expect:

| What You'd Expect | Actual Backend Field | Endpoint |
|-------------------|---------------------|----------|
| `email` or `phone` | `identifier` | `POST /v1/auth/otp/send` |
| `otp` | `otp_code` | `POST /v1/auth/otp/verify` |
| `name` (optional param) | `name` (required in body) | All chart/predict endpoints |

**If login returns 422 errors**, check that you're sending `identifier` (not `email`/`phone`) and `otp_code` (not `otp`).

---

## iOS-Specific

### DatePicker / TimePicker
The native iOS `DateTimePicker` with `display="spinner"` has **no built-in dismiss mechanism**. Our implementation wraps it in a `Modal` with Done/Cancel buttons. If you see a spinner that can't be dismissed, check that the Modal wrapper is present.

### Safe Area
Always wrap screens in `<Screen>` component which handles safe area insets. Without it, content will render behind the notch/Dynamic Island.

### Haptics
`expo-haptics` throws on iOS Simulator for certain haptic types. The `useHaptics` hook silently catches these errors.

---

## Android-Specific

### DateTimePicker
Android uses a native dialog that auto-dismisses on selection. The Modal wrapper logic is skipped via `Platform.OS` check.

### Keyboard Avoiding
`KeyboardAvoidingWrapper` uses `behavior="height"` on Android vs `behavior="padding"` on iOS. Using the wrong behavior causes the keyboard to push content off-screen.

### Back Button
Expo Router handles the hardware back button automatically via `react-native-screens`.

---

## Expo / React Native

### Path Aliases
Path aliases (`@components/...`) are configured in **two places**:
1. `tsconfig.json` — for TypeScript type checking
2. `babel.config.js` — for runtime resolution via `babel-plugin-module-resolver`

**If you see "Cannot resolve module" errors**, check both files have matching aliases.

### Reanimated Plugin Order
`react-native-reanimated/plugin` must be the **last** plugin in `babel.config.js`. Moving it elsewhere causes cryptic build failures.

### react-native-worklets
Reanimated v4 requires `react-native-worklets` as a peer dependency. If the bundler says "Cannot find module 'react-native-worklets/plugin'", install it:
```bash
npx expo install react-native-worklets
```

### `--legacy-peer-deps`
Some packages haven't updated peer deps for React 19 / Expo 54. Use `--legacy-peer-deps` when installing:
```bash
npm install some-package --legacy-peer-deps
```

### Metro Cache
When you see stale errors after fixing them, clear Metro's cache:
```bash
npx expo start --clear
```

---

## Physical Device Testing

### Backend URL
Physical devices **cannot reach `localhost`**. You must use your Mac's LAN IP address:

```bash
# Find your Mac's IP
ipconfig getifaddr en0
# Example output: 192.168.2.108

# Set in .env
EXPO_PUBLIC_API_BASE_URL=http://192.168.2.108:8000
```

### Expo Go vs Dev Build
- **Expo Go** is the quickest way to test (scan QR code)
- Expo Go must match the SDK version of the project (currently SDK 54)
- If you see "This app was built for a different Expo SDK version", update Expo Go from the App Store

### QR Code Scanning
- **iPhone**: Open the **Expo Go app** first, then scan from within it. The iPhone Camera app may show "No usable data found"
- **Android**: Camera app usually works, but Expo Go scanner is more reliable

---

## TypeScript Quirks

### Boolean Style Expressions
React Native style arrays reject `""` (empty string) as a style value. This pattern is broken:

```typescript
// WRONG — when error is "", this evaluates to "" (falsy string)
style={[styles.input, error && styles.inputError]}

// CORRECT — double-bang forces boolean
style={[styles.input, !!error && styles.inputError]}
```

This affects `FormInput`, `DatePicker`, `TimePicker`, and `OtpInput`.

### Type `any` Usage
Several components use `any` for API response data (e.g., `chartData`, `dashaData`, `predictions`). This is intentional for rapid development. Future work: define typed interfaces matching the backend's response schemas.

---

## Timezone Handling

All chart endpoints require a `tz_offset` parameter (decimal hours from UTC).

Currently hardcoded to `5.5` (IST — Indian Standard Time) across all tool screens. For international users, this needs to be:
1. Auto-detected from the selected place's timezone
2. Or calculated from the `lon` (longitude) value

This is a known simplification — see the backend's location service for timezone lookup capability.

---

## State Persistence

| Data | Storage | Lifetime |
|------|---------|----------|
| JWT token | `expo-secure-store` | Until logout or 401 |
| Chart style preference | `AsyncStorage` | Permanent |
| Form inputs (DOB, TOB, place) | React state | Lost on screen unmount |

**Note:** Form inputs are not persisted. If the user navigates away and back, they need to re-enter everything. Consider persisting birth details in AsyncStorage or a user profile endpoint for better UX.

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Failed to load data" | API unreachable (wrong URL, server down, CORS) | Check `.env` URL, verify backend is running |
| "Session expired" | JWT expired or invalid | User needs to re-login (auto-redirect should handle this) |
| "Request timed out" | Server took >15s to respond | Check server performance, increase timeout in client.ts |
| "Network error" | Device offline or DNS failure | Check WiFi/cellular connection |
| "Cannot resolve module '@components/...'" | Path alias misconfiguration | Check both `tsconfig.json` and `babel.config.js` |
| "This app was built for a different Expo SDK" | Expo Go version mismatch | Update Expo Go from App Store |

---

## Development Tools

### Expo Web Preview
For quick UI verification without a device:
```bash
npx expo start --web --port 8081
```
**Limitation:** Web doesn't support `expo-haptics`, `expo-secure-store` (uses fallback), or native DateTimePicker (uses HTML inputs).

### React Native Debugger
Press `j` in the Expo CLI terminal to open the JavaScript debugger.

### Backend API Docs
The backend serves interactive API docs at:
- Swagger UI: `http://<backend-url>/docs`
- ReDoc: `http://<backend-url>/redoc`
- OpenAPI JSON: `http://<backend-url>/openapi.json`
