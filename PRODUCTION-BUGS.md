# Production Bug Report

> Generated after thorough investigation of the full codebase.
> All bugs confirmed by tracing code paths end-to-end. Sorted by severity.

---

## CRITICAL BUGS (App-Breaking in Production)

### BUG-01: Missing `trust proxy` — Rate Limiters Block ALL Users Globally

**Files:** `backend/src/index.js`, `backend/src/middleware/rateLimiter.js`
**Impact:** After ~5 login attempts from ANY user worldwide, ALL users are locked out for 15 minutes.

**Root cause:** Render (and most cloud hosts) places a reverse proxy in front of your app. Without `app.set('trust proxy', 1)`, Express sees every request as coming from the **same IP** (the proxy's IP). The `loginLimiter` allows only 5 attempts per IP per 15 minutes — so 5 total login attempts from anyone on the planet locks out everyone.

This is almost certainly why the user saw "too many attempts" errors and why login appeared broken after a few tries.

**Affected rate limiters (all share the same global-IP problem):**

| Limiter | Limit | Effect when misconfigured |
|---------|-------|--------------------------|
| `loginLimiter` | 5 per 15 min | ALL logins blocked after 5 total attempts |
| `authLimiter` | 10 per 15 min | ALL registrations blocked after 10 attempts |
| `verificationLimiter` | 5 per 15 min | ALL email verifications blocked |
| `passwordResetLimiter` | 3 per hour | ALL password resets blocked after 3 attempts |
| `bookingLimiter` | 10 per hour | ALL public bookings blocked |
| `apiLimiter` | 100 per 15 min | ALL API calls blocked |

**Fix:**
```javascript
// backend/src/index.js — add BEFORE middleware
app.set('trust proxy', 1);
```

---

### BUG-02: 401 Interceptor Does Hard `window.location.href` Redirect

**File:** `frontend/src/services/api.js` (lines 14-25)

```javascript
if (error.response?.status === 401) {
  localStorage.removeItem('user');
  localStorage.removeItem('businessId');
  window.location.href = '/login';  // HARD REDIRECT — kills React
}
```

**Impact:** This is the root cause of multiple user-reported symptoms:
- "Creating account..." button stuck forever (React state abandoned mid-operation)
- "Creating Business..." stuck forever (same reason)
- No error messages displayed to user (redirect happens before catch block runs)
- Business setup redirects to login without explanation

**Why it's destructive:** `window.location.href` is a full page navigation that destroys the React tree. Any `try/catch/finally` in components never completes. Loading states freeze. Error states never render. The user sees a blank flash followed by the login page with no explanation.

**Cascade scenario:**
1. User submits business setup form
2. `POST /api/businesses` sends with cookie
3. Cookie missing/expired → 401
4. Interceptor fires → `window.location.href = '/login'`
5. BusinessSetup's `catch` block never runs → no error shown
6. BusinessSetup's `finally` block never runs → `setLoading(false)` never called
7. User lands on login page confused

**Fix:** Replace the hard redirect with a soft mechanism that lets components handle 401 gracefully:

```javascript
// Option A: Use React Router navigation (doesn't kill React tree)
// Option B: Set a flag and let AuthContext handle it
// Option C: Only redirect for non-auth endpoints (don't redirect on /login or /register 401s)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Don't redirect on auth endpoints — let the component handle the error
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                             requestUrl.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('user');
        localStorage.removeItem('businessId');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

### BUG-03: Auth State Based on Stale localStorage — False Authentication

**File:** `frontend/src/context/AuthContext.jsx` (lines 26-49)

```javascript
const initAuth = () => {
  const currentUser = getCurrentUser();   // reads localStorage
  const authStatus = checkAuth();          // also reads localStorage
  if (currentUser && authStatus) {
    setUser(currentUser);
    setIsAuthenticated(true);              // ASSUMES authenticated
  }
};
```

**Impact:** The app assumes the user is authenticated if localStorage has a `user` entry. But authentication is actually stored in an **httpOnly cookie** that JavaScript cannot read. If the cookie expired (after 7 days) but localStorage wasn't cleared, the app thinks the user is logged in. Every API call then returns 401, triggering the cascade from BUG-02.

**Why this causes problems on production specifically:**
- On localhost, the cookie domain matches perfectly and rarely expires during testing
- On production, cookies can fail to set (cross-origin), expire, or get cleared by browser policies
- The app has no way to detect that the cookie is gone

**Fix:** On app load, make a lightweight verification call to the server:

```javascript
const initAuth = async () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    try {
      // Verify the cookie is still valid
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch {
      // Cookie expired or invalid — clear stale data
      localStorage.removeItem('user');
      localStorage.removeItem('businessId');
      setUser(null);
      setIsAuthenticated(false);
    }
  }
  setLoading(false);
};
```

**Important:** The 401 interceptor (BUG-02) must be fixed first, otherwise this `/auth/me` call returning 401 would trigger the hard redirect before the catch block runs.

---

### BUG-04: Password Validation Mismatch — Frontend vs Backend

**Files:**
- `frontend/src/pages/Register.jsx` (lines 44-48) — only checks length >= 8
- `backend/src/middleware/validation.js` (lines 42-93) — requires uppercase, lowercase, number, AND special character

**Frontend validation:**
```javascript
if (formData.password.length < 8) {
  newErrors.password = 'Password must be at least 8 characters';
}
// That's it — no strength checks
```

**Backend validation (middleware runs BEFORE controller):**
```javascript
if (passwordToValidate.length < 8) { ... }           // 8+ chars
if (!/[A-Z]/.test(passwordToValidate)) { ... }        // uppercase
if (!/[a-z]/.test(passwordToValidate)) { ... }        // lowercase
if (!/\d/.test(passwordToValidate)) { ... }            // number
if (!/[!@#$%^&*()...].test(passwordToValidate)) { ... } // special char
```

**Impact:** A user can enter `password123` which passes frontend validation, submit the form, and get a 400 error from the backend. Each failed attempt also counts against the `authLimiter` rate limit (BUG-01). After 10 such attempts, registration is blocked entirely.

The user never sees a clear password requirements message because the frontend validation passed and the backend 400 error message may not be displayed prominently.

**Fix:** Match the frontend validation to the backend rules:

```javascript
// Register.jsx — add these checks
if (!/[A-Z]/.test(formData.password)) {
  newErrors.password = 'Password must contain at least one uppercase letter';
} else if (!/[a-z]/.test(formData.password)) {
  newErrors.password = 'Password must contain at least one lowercase letter';
} else if (!/\d/.test(formData.password)) {
  newErrors.password = 'Password must contain at least one number';
} else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
  newErrors.password = 'Password must contain at least one special character';
}
```

---

### BUG-05: VerifyEmail.jsx Uses Raw `axios` Instead of Configured API Client

**File:** `frontend/src/pages/VerifyEmail.jsx` (lines 4, 6, 24)

```javascript
import axios from 'axios';  // RAW AXIOS
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// ...
const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
```

**Impact:**
- `withCredentials: true` is NOT set → httpOnly cookie not sent
- Constructs its own `API_URL` instead of using the shared `api` instance → could point to a different URL
- The fallback `http://localhost:5000/api` would be baked into the production build if `VITE_API_URL` is not set during build
- Does not benefit from the global error interceptor

**Fix:** Replace with the configured API client:

```javascript
import api from '../services/api';
// ...
const response = await api.post('/auth/verify-email', { token });
```

---

## HIGH PRIORITY BUGS (Significant Production Impact)

### BUG-06: BusinessContext Fetches on Mount Regardless of Auth State

**File:** `frontend/src/context/BusinessContext.jsx` (lines 62-64)

```javascript
useEffect(() => {
  fetchBusiness();
}, []);
```

**Impact:** When `BusinessProvider` mounts (e.g., at `/setup` or `/dashboard`), it immediately reads `businessId` from localStorage and tries to fetch. If there's a stale `businessId` from a previous session and the cookie is invalid, this triggers a 401 → the hard redirect (BUG-02) → user lands on login with no explanation.

**Fix:** Only fetch when there's a valid business ID, and handle the "no business" case without error:

```javascript
useEffect(() => {
  const businessId = getBusinessId();
  if (businessId) {
    fetchBusiness();
  } else {
    setLoading(false);
  }
}, []);
```

(Note: `fetchBusiness()` already handles the missing businessId case, but it's better to be explicit and avoid the async call entirely.)

---

### BUG-07: Email Service Fails Silently in Production

**File:** `backend/src/services/emailService.js` (lines 8-18)

```javascript
if (process.env.NODE_ENV === 'production') {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,         // could be undefined
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,       // could be undefined
      pass: process.env.EMAIL_PASSWORD,   // could be undefined
    },
  });
}
```

**Impact:** If any email env var is missing on Render, the transporter is created with `undefined` values. Email sending fails at runtime but the error is caught and swallowed in the auth controller (lines 71-76). Users never receive:
- Verification emails (user reports this)
- Password reset emails
- Welcome emails
- Appointment reminders

The registration "succeeds" but the user has no way to verify their email.

**Fix:** Validate email config at startup:

```javascript
if (process.env.NODE_ENV === 'production') {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD must be set in production');
    return null; // Gracefully degrade instead of creating a broken transporter
  }
  // ... create transporter
}
```

---

### BUG-08: JWT_SECRET Not Validated at Startup

**File:** `backend/src/utils/tokenGenerator.js` (lines 14, 26)

```javascript
export const generateJWT = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, ...);
};
```

**Impact:** If `JWT_SECRET` is not set on Render, `jwt.sign()` uses `undefined` as the secret. Tokens are generated but are essentially useless — any subsequent `jwt.verify()` with a different undefined value would fail, causing 401 on all protected routes.

Unlike `DATABASE_URL` which has a startup check in `database.js`, `JWT_SECRET` has no validation anywhere.

**Fix:** Add validation at startup:

```javascript
// backend/src/index.js or tokenGenerator.js
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

### BUG-09: Error Message Field Mismatch Between Backend and Frontend

**Files:**
- Backend returns errors in `error` field: `res.json({ success: false, error: '...' })`
- Frontend BusinessSetup checks `message` field first: `err.response?.data?.message || 'fallback'`

**Example in `BusinessSetup.jsx` (line 109):**
```javascript
setError(err.response?.data?.message || 'Failed to create business. Please try again.');
```

**But backend `createBusiness` returns (line 170-171):**
```javascript
res.status(500).json({
  success: false,
  error: 'Error creating business',   // <-- .error, NOT .message
  message: error.message,              // <-- this is the raw JS error message
});
```

**Impact:** The BusinessSetup page would display the raw JavaScript error message (like `"relation \"businesses\" does not exist"`) instead of the user-friendly error, because `.message` exists but contains the wrong thing. In Login.jsx and Register.jsx this is handled correctly (they check `.error` too), but BusinessSetup doesn't.

**Fix:** Standardize error extraction across all pages or fix the BusinessSetup handler:

```javascript
setError(
  err.response?.data?.error ||
  err.response?.data?.message ||
  'Failed to create business. Please try again.'
);
```

---

## MEDIUM PRIORITY BUGS (UX & Quality Issues)

### BUG-10: Branding Inconsistency — "AppointMe" vs "TimeSnap.io"

**Files:**
- `frontend/src/pages/Login.jsx` (line 84): `<h1>AppointMe</h1>`
- `frontend/src/pages/Register.jsx` (line 141, 221): `<h1>TimeSnap.io</h1>`
- `frontend/src/pages/VerifyEmail.jsx` (line 67): `TimeSnap.io`

**Impact:** Users see different app names on different pages, which looks unprofessional and confusing.

**Fix:** Pick one name and use it consistently across all pages.

---

### BUG-11: Register Flow Navigates to `/dashboard` Instead of `/setup`

**File:** `frontend/src/pages/Register.jsx` (line 70)

```javascript
await register(registerData);
navigate('/dashboard');
```

**Flow:** Register → navigate to `/dashboard` → DashboardLayout checks `hasCompletedSetup` → false → redirects to `/setup`.

**Impact:** This causes an unnecessary redirect chain: `/register` → `/dashboard` → `/setup`. The user briefly sees the dashboard loading spinner before being bounced to setup. This is a wasted round-trip that also triggers `BusinessProvider` to mount and `fetchBusiness()` to fire unnecessarily.

**Fix:**
```javascript
navigate('/setup');  // Go directly to business setup
```

---

### BUG-12: `auth.js` Middleware Exposes Internal Error Details

**File:** `backend/src/middleware/auth.js` (line 51)

```javascript
return res.status(401).json({
  success: false,
  error: 'Not authorized to access this route',
  message: error.message,  // LEAKS: "Invalid or expired token", JWT details, etc.
});
```

**Impact:** Exposes internal error messages to the client, which could help attackers understand token validation logic.

**Fix:** Remove `message: error.message` from the response. Log it server-side instead.

---

### BUG-13: Dead Code — Controller Password Check Never Reached

**File:** `backend/src/controllers/authController.js` (lines 405-412)

```javascript
if (newPassword.length < 6) {
  return res.status(400).json({
    success: false,
    error: 'Password must be at least 6 characters',
  });
}
```

**Route definition** (`authRoutes.js` line 34):
```
router.post('/reset-password', passwordResetLimiter, validateToken, validatePassword, resetPassword);
```

The `validatePassword` middleware requires 8+ chars with uppercase, lowercase, number, and special character. This controller check (6+ chars) will never execute because the middleware rejects first. The message is also misleading (says 6 chars when the real minimum is 8).

**Fix:** Remove the dead code from the controller.

---

### BUG-14: CLIENT_URL Fallback to Localhost in Multiple Backend Files

**Files where `CLIENT_URL` fallback to localhost exists:**
- `backend/src/index.js` line 30: CORS origin
- `backend/src/config/socket.js` line 13: Socket.IO CORS
- `backend/src/services/emailService.js` line 49: Verification email links
- `backend/src/controllers/businessController.js` line 164: Booking URL in response

**Impact:** If `CLIENT_URL` is not set on Render:
- CORS blocks all frontend requests
- Socket.IO rejects all connections
- Verification emails contain `http://localhost:5173/verify-email?token=...` links
- Booking URLs point to localhost

**Fix:** Add a startup check for `CLIENT_URL` in production:

```javascript
if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
  console.error('CLIENT_URL must be set in production');
  process.exit(1);
}
```

---

### BUG-15: Rate Limiter Counts Validation Failures Against User

**File:** `backend/src/routes/authRoutes.js` (line 30-31)

```javascript
router.post('/register', authLimiter, validateEmail, validatePassword, validateRegistration, register);
router.post('/login', loginLimiter, validateEmail, login);
```

**Impact:** Rate limiters run BEFORE validation middleware. If a user submits a malformed email (400 from `validateEmail`) or weak password (400 from `validatePassword`), it still counts against their rate limit. Combined with BUG-01 (global IP issue), validation errors from one user eat into everyone's rate limit budget.

**Fix:** Consider moving rate limiters after validation, or using a more granular rate limiting strategy (e.g., rate limit by email address for login, not just IP).

---

## ENVIRONMENT CONFIGURATION CHECKLIST

These are not code bugs but missing configuration on Render that will cause failures:

### Backend Web Service (Environment Variables)
| Variable | Required | Current Risk |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Render auto-sets for Node.js services |
| `DATABASE_URL` | Yes | Server crashes on startup if missing (has validation) |
| `JWT_SECRET` | Yes | **No validation** — silent failure (BUG-08) |
| `CLIENT_URL` | Yes | Falls back to `http://localhost:5173` (BUG-14) |
| `BASE_URL` | Yes | Used in email templates |
| `EMAIL_HOST` | Yes | No validation — silent email failure (BUG-07) |
| `EMAIL_USER` | Yes | No validation — silent email failure (BUG-07) |
| `EMAIL_PASSWORD` | Yes | No validation — silent email failure (BUG-07) |
| `EMAIL_FROM` | Recommended | Falls back to `EMAIL_USER` |

### Frontend Static Site (Build Environment Variables)
| Variable | Required | Current Risk |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Falls back to `http://localhost:5000/api` — baked into the build |

---

## RECOMMENDED FIX ORDER

1. **BUG-01** (trust proxy) — One line, fixes rate limiting for everyone
2. **BUG-02** (401 interceptor) — Fixes cascading failures, stuck forms
3. **BUG-03** (stale localStorage auth) — Fixes false authentication
4. **BUG-04** (password validation) — Fixes registration failures
5. **BUG-08** (JWT_SECRET check) — Prevents silent auth failure
6. **BUG-05** (VerifyEmail raw axios) — Fixes email verification
7. **BUG-07** (email config validation) — Surfaces email issues at startup
8. **BUG-09** (error message field) — Fixes error display in BusinessSetup
9. **BUG-14** (CLIENT_URL validation) — Prevents localhost fallback in production
10. Remaining bugs in severity order

---

## BUG FIX STATUS TRACKER

### Original Bugs (BUG-01 to BUG-15)

- [x] **BUG-01** — Missing `trust proxy` — `app.set('trust proxy', 1)` added at line 40
- [x] **BUG-02** — 401 interceptor hard redirect — Auth endpoints now excluded from redirect *(partial: hard redirect still used for non-auth 401s, acceptable for session expiry)*
- [x] **BUG-03** — Stale localStorage auth — `/auth/me` verification call on mount
- [x] **BUG-04** — Password validation mismatch — Frontend now matches backend rules
- [x] **BUG-05** — VerifyEmail raw axios — Now uses configured `api` client
- [x] **BUG-06** — BusinessContext unconditional fetch — Now checks `businessId` first
- [x] **BUG-07** — Email service silent failure — Config validated in production
- [x] **BUG-08** — JWT_SECRET not validated — Validated at startup in `tokenGenerator.js` and `index.js`
- [x] **BUG-09** — Error message field mismatch — BusinessSetup now checks `.error` then `.message`
- [x] **BUG-10** — Branding inconsistency — Consistently "TimeSnap.io" everywhere
- [x] **BUG-11** — Register navigates to `/dashboard` — Now navigates directly to `/setup`
- [x] **BUG-12** — Auth middleware leaks `error.message` — Removed from response, logged server-side
- [x] **BUG-13** — Dead code password check — Removed from controller
- [x] **BUG-14** — CLIENT_URL localhost fallback — Production startup validation added
- [x] **BUG-15** — Rate limiter before validation — Validation middleware now runs first

---

## SECURITY AUDIT FINDINGS

> Discovered during pre-launch security scan. Sorted by severity.

### HIGH Priority

- [x] **SEC-01: Socket.IO `join-business` Has No Server-Side Authentication**
  - **File:** `backend/src/config/socket.js` (line 23)
  - **Impact:** Any client can establish a WebSocket connection and emit `join-business` with any `businessId` to receive all real-time notifications for that business — including client names, appointment dates, and times. No authentication is checked at the connection or room-join level.
  - **Fix:** Authenticate the Socket.IO handshake by extracting and verifying the JWT from the cookie. Verify business ownership before allowing `socket.join()`.
  - **Status:** Fixed — JWT cookie verified on handshake via `io.use()` middleware, business ownership checked on `join-business` via DB query.

- [x] **SEC-02: Full Business Object Leaked via Unauthenticated `/businesses/slug/:slug` Endpoint**
  - **File:** `backend/src/controllers/businessController.js` (line 269), `backend/src/routes/businessRoutes.js` (line 16)
  - **Impact:** The endpoint returns the entire business database row without field filtering — including `ownerId`, internal `settings` JSON (`autoConfirm`, `emailConfirmationTimeout`, `minBookingNotice`, `maxAdvanceBooking`, `cancellationNotice`, `allowEmployeeBooking`, etc.), `defaultCapacity`, and `defaultSlotInterval`. The safe public endpoint at `/api/public/business/:slug` already exists with proper field projection.
  - **Fix:** Either remove the unauthenticated route (since `/api/public/business/:slug` serves the same purpose safely), or apply explicit field selection matching the public controller.
  - **Status:** Fixed — applied explicit field projection matching the public controller. Also removed `error.message` leak from the 500 handler.

### MEDIUM Priority

- [x] **SEC-03: HTML Injection in Outgoing Email Templates**
  - **File:** `backend/src/services/emailService.js` (contact email section)
  - **Impact:** The `contactClient` endpoint allows business owners to send emails to clients. The `message` and `subject` fields are embedded into HTML email templates via bare template literals with no HTML encoding. A business owner could inject arbitrary HTML (fake password reset buttons, phishing links) sent to clients under the platform's email infrastructure.
  - **Fix:** HTML-encode all user-supplied values before embedding in email HTML — replace `&` with `&amp;`, `<` with `&lt;`, `>` with `&gt;`, `"` with `&quot;`.
  - **Status:** Fixed — added `escapeHtml()` utility and applied it to all user-supplied values (clientName, businessName, serviceName, message, subject, etc.) across all 6 email templates: confirmation, reminder, cancellation, reschedule, business alert, and contact.

- [x] **SEC-04: `error.message` Leaked in 500 Responses Across Multiple Controllers**
  - **Files:** `businessController.js`, `serviceController.js`, `employeeController.js`, `analyticsController.js` — all 500 error handlers
  - **Impact:** Raw database error messages, ORM query strings, table names, and Node.js internals are exposed to clients in production. The auth middleware (BUG-12) was fixed, but these controllers still leak via `message: error.message` without a `NODE_ENV` guard.
  - **Fix:** Apply the same pattern used in `appointmentController.js`: `error: process.env.NODE_ENV === 'development' ? error.message : undefined`
  - **Status:** Fixed — removed `error.message` from all 31 error responses across businessController (6), serviceController (7), employeeController (9), and analyticsController (9).

- [x] **SEC-05: No Rate Limiting on Public Slot/Confirm/Cancel Endpoints**
  - **File:** `backend/src/routes/publicBookingRoutes.js` (lines 35-65)
  - **Impact:** `/available-slots`, `/available-slots-range`, `/confirm-appointment`, and `/cancel-appointment` have no rate limiting. Each slot request triggers multiple DB queries. Attackers can abuse these for denial-of-service or brute-force enumeration.
  - **Fix:** Apply `bookingLimiter` or `apiLimiter` to these endpoints.
  - **Status:** Fixed — `apiLimiter` applied to slot/business/employee lookup endpoints, `bookingLimiter` applied to confirm and cancel endpoints.

- [x] **SEC-06: `sql.raw()` with Settings-Derived Value (Potential SQL Injection)**
  - **File:** `backend/src/services/emailConfirmationScheduler.js` (line 60)
  - **Impact:** `emailConfirmationTimeout` from business `settings` JSON is embedded literally into SQL via `sql.raw(String(emailConfirmationTimeout))`. If a business owner sets a malicious value in their settings, it bypasses Drizzle's parameterization.
  - **Fix:** Add explicit integer validation: `const timeout = Math.max(1, parseInt(emailConfirmationTimeout, 10) || 15);` — or compute the cutoff timestamp in JavaScript and pass it as a regular parameter.
  - **Status:** Fixed — removed `sql.raw()`, now computes cutoff timestamp in JS with parseInt validation and passes it as a parameterized value.

### LOW Priority

- [x] **SEC-07: Client Email Addresses Logged Unconditionally in Schedulers**
  - **Files:** `backend/src/services/emailConfirmationScheduler.js` (line 82), `backend/src/services/reminderScheduler.js` (line 77)
  - **Impact:** Client PII (email addresses) written to stdout on every scheduler run. In production, logs are often forwarded to third-party log aggregation services.
  - **Fix:** Log appointment IDs only, or redact emails to `c***@domain.com`.

- [x] **SEC-08: Contact Email Body Logged Unconditionally in Production**
  - **File:** `backend/src/services/emailService.js` (lines 997-1028)
  - **Impact:** Unlike every other email logging block in the file (gated on `NODE_ENV !== 'production'`), the contact email logging runs unconditionally — including full recipient address, subject, and message body.
  - **Fix:** Gate with `if (process.env.NODE_ENV !== 'production')`.

- [x] **SEC-09: `clientPhone` Accepts Arbitrary Strings — No Format Validation**
  - **File:** `backend/src/controllers/appointmentController.js` (line 64)
  - **Impact:** Phone field validated for presence but not format. Arbitrary strings (including very long strings) are accepted and stored. A phone regex already exists in `validation.js`.
  - **Fix:** Apply the same phone regex used elsewhere: `/^[\d\s\-\+\(\)]+$/`

- [x] **SEC-10: Untracked `prisma.config.ts.bak` File in Repository**
  - **File:** `backend/prisma.config.ts.bak` (untracked)
  - **Impact:** Backup file may contain real `DATABASE_URL` or credentials. Risk of accidental `git add .` committing it.
  - **Fix:** Verify it contains no real credentials, then delete it or add `*.bak` to `.gitignore`.

---

## PERFORMANCE BUGS (Scalability & Reliability)

### PERF-01: Analytics Uses JavaScript Aggregation Instead of SQL

**File:** `backend/src/controllers/analyticsController.js` (all 8 endpoint functions)

**Impact:** Every analytics function fetches the entire dataset into Node.js memory and aggregates with `.filter()`, `.reduce()`, and `.forEach()` loops instead of SQL `GROUP BY`, `COUNT()`, and `SUM()`. This creates O(n*m) complexity for service/employee performance endpoints.

**Worst offenders:**
| Function | Problem |
|----------|---------|
| `getEmployeePerformance` | Fetches ALL employees + ALL appointments + ALL services, then nested loops with 7+ `.filter()` calls per employee |
| `getServicePerformance` | Fetches ALL services + ALL appointments, then `.filter()` per service |
| `getAnalyticsOverview` | 5 separate `.filter()` passes over entire appointment array for status counts |
| `getClientAnalytics` | Fetches ALL appointments ever (not just date range) for first-visit tracking |
| `getRevenueOverTime` | Manual revenue grouping and summing in JS |

**At scale (10k+ appointments, 50 employees):** `getEmployeePerformance` performs ~17.5 million filter operations per request.

**Fix:** Rewrite each function using Drizzle ORM's SQL aggregation helpers or raw SQL with `GROUP BY`, `COUNT()`, `SUM()`, `EXTRACT()`, and window functions. The Drizzle ORM already supports these.

---

### PERF-02: No Server-Side Pagination for Appointments

**Files:** `backend/src/controllers/appointmentController.js` (lines 632-726), `frontend/src/services/appointmentsService.js`, `frontend/src/pages/dashboard/Appointments.jsx`

**Impact:** The `GET /api/appointments/business/:businessId` endpoint returns ALL matching appointments with no `LIMIT`/`OFFSET`. The frontend sends `page` and `limit` params but the backend ignores them entirely. Client-side pagination (25/page) merely slices the already-fetched full array.

**Cascade effect:**
- Large JSON payloads over the network for businesses with 1000+ appointments
- All filtering, sorting, and search happens in React after full data load
- The "All" tab loads every appointment the business has ever had
- Overview page makes 4 separate unbounded API calls on mount

**Fix:** Implement server-side pagination in the backend endpoint — accept `page`/`limit` params, apply SQL `LIMIT`/`OFFSET`, and return `{ data, total, page, totalPages }`. Move search and date filtering to SQL `WHERE` clauses.

---

### PERF-03: Missing Composite Database Indexes

**File:** `backend/src/config/schema.js` / `backend/drizzle/schema.ts`

**Impact:** While individual column indexes exist, critical composite indexes for common query patterns are missing. This forces sequential scans on large tables.

**Missing indexes (priority order):**

| Table | Missing Index | Used By | Priority |
|-------|--------------|---------|----------|
| `appointments` | `(business_id, appointment_date, status)` | Analytics, slot checks, appointment listings | CRITICAL |
| `appointments` | `email_confirmation_token` | Email confirmation endpoint (full table scan) | HIGH |
| `appointments` | `(business_id, created_at)` | Email confirmation scheduler (runs every 5 min) | HIGH |
| `appointments` | `(business_id, appointment_date, end_time)` | Auto-complete scheduler | MEDIUM |
| `notifications` | `recipient_email` | Notification lookups | MEDIUM |

**Fix:** Add these indexes via a Drizzle migration. The composite `(business_id, appointment_date, status)` index alone would dramatically improve analytics, slot availability, and appointment listing queries.

---

### PERF-04: Email Failures Are Silent With No Retry or Fallback

**Files:** `backend/src/controllers/authController.js`, `backend/src/controllers/appointmentController.js`, `backend/src/services/reminderScheduler.js`

**Impact:** All email sends are wrapped in try-catch blocks that log and swallow errors. When emails fail:
- **Verification emails:** User registers but can never verify (no retry, no resend button)
- **Confirmation emails:** Appointment is created but client gets no details
- **Cancellation/reschedule emails:** Client is not notified of changes to their appointment
- **Reminder emails:** Client misses their appointment
- **Password reset emails:** User sees "email sent" success message but nothing arrives

There is no retry mechanism, no email queue, no delivery tracking, and no user notification that an email failed.

**Fix (phased approach):**
1. **Immediate:** Return email send status in API responses so frontend can show "email could not be sent" warnings
2. **Short-term:** Add a retry mechanism (2-3 attempts with exponential backoff) for critical emails (verification, confirmation, password reset)
3. **Long-term:** Implement an email queue (e.g., BullMQ with Redis) with dead-letter tracking and admin alerts for repeated failures

---

## PERFORMANCE BUG FIX STATUS TRACKER

- [x] **PERF-01** — Analytics JS aggregation — Rewritten: all 7 analytics functions now use SQL COUNT FILTER/GROUP BY/SUM/JOIN instead of JS .filter()/.reduce() loops
- [x] **PERF-02** — No server-side pagination — Backend now uses SQL LIMIT/OFFSET with server-side search, tab filtering, employee filtering, and sorting. Frontend Appointments page delegates all filtering/pagination to the server. Tab counts computed via single SQL COUNT FILTER query.
- [ ] **PERF-03** — Missing composite indexes — Add via Drizzle migration
- [ ] **PERF-04** — Silent email failures — Add retry mechanism and user feedback
