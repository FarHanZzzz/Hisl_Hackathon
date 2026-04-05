# Phase 0C: Frontend Authentication

## Goal
Add login/logout flow to the frontend. Protect clinician and patient pages. Store auth state in React context.

## Dependencies
- Phase 0B (backend auth endpoints must be live)

## What Gets Created

### File 1: `src/context/AuthContext.tsx`
React context that holds the authenticated user state across the entire app.

```
AuthProvider wraps _app.tsx
├── user: { id, role, display_name, language } | null
├── loading: boolean
├── login(email, password): Promise<void>
├── loginWithOTP(phone, otp): Promise<void>
├── logout(): void
└── isAuthenticated: boolean
```

**Why:** Every page and component needs to know "who am I?" and "what role am I?" without passing props everywhere.

---

### File 2: `src/hooks/useAuth.ts`
Convenience hook wrapping the context.

```typescript
const { user, login, logout, loading } = useAuth();
```

---

### File 3: `src/components/ProtectedRoute.tsx`
Wrapper component that redirects unauthenticated users.

```
<ProtectedRoute allowedRoles={['clinician']}>
  <ClinicianDashboard />
</ProtectedRoute>
```

- If not logged in → redirect to `/login`
- If logged in but wrong role → redirect to appropriate portal
- Shows loading spinner while checking auth state

---

### File 4: `pages/login.tsx`
Dual-mode login page with two tabs.

```
┌─────────────────────────────────────┐
│         Welcome to Pedi-Growth      │
│                                     │
│  ┌──────────────┬────────────────┐  │
│  │  Clinician   │    Parent      │  │
│  └──────────────┴────────────────┘  │
│                                     │
│  [Clinician Tab]                    │
│  ┌─────────────────────────────┐    │
│  │ Email: ________________     │    │
│  │ Password: ______________    │    │
│  │                             │    │
│  │ [ Sign In ]                 │    │
│  │ Don't have an account?      │    │
│  │ Register →                  │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Parent Tab]                       │
│  ┌─────────────────────────────┐    │
│  │ Phone: +880 ___________     │    │
│  │                             │    │
│  │ [ Send OTP ]                │    │
│  │                             │    │
│  │ Enter OTP: ______           │    │
│  │ [ Verify & Login ]          │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Design:** Dark theme matching existing app. Glass-card style. Large touch targets for the parent tab (mobile-first).

---

### File 5: Modify `pages/_app.tsx`
Wrap the app with `AuthProvider`.

```tsx
// Before:
<Component {...pageProps} />

// After:
<AuthProvider>
  <Component {...pageProps} />
</AuthProvider>
```

---

### File 6: Modify `src/services/api.ts`
Add auth header to all API calls.

```typescript
// Add interceptor to attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getStoredToken(); // from localStorage or cookie
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

Add new auth API functions:
```typescript
export const loginWithEmail = (email: string, password: string) => ...
export const sendOTP = (phone: string) => ...
export const verifyOTP = (phone: string, otp: string) => ...
export const getMe = () => ...
```

---

## Routing Logic After Auth

```
User opens app
├── / (Home) → Remains PUBLIC & functional (anonymous uploads still work)
├── /results/[id] → Remains PUBLIC (anyone with link can see report)
├── /login → Dual patient/clinician auth portal
├── /clinician/* → Wrapped in <ProtectedRoute> (clinician only)
└── /patient/* → Wrapped in <ProtectedRoute> (patient only)
```

## Verification
- [ ] Clinician can register with email/password
- [ ] Clinician can login and see their profile via `GET /me`
- [ ] Parent can login via SMS OTP
- [ ] Unauthenticated user is redirected to `/login`
- [ ] Clinician cannot access `/patient/*` routes
- [ ] Patient cannot access `/clinician/*` routes

---

### Sub-Phase 0C.1: Navigation Bar Overhaul

**Problem:** The current Layout header contains a static `Home | Dashboard | About` pill-style navigation bar that does not reflect user roles and has no login/logout awareness.

**Fix:**
- [ ] Remove the existing `Home | Dashboard | About` navigation pill bar entirely from the Layout header.
- [ ] Replace it with a **Login button** (when unauthenticated) and a **user avatar/name + role badge** (when authenticated).
- [ ] When a logged-in user clicks their avatar or the "Dashboard" link, they are redirected to their **role-specific dashboard**:
  - Clinician → `/clinician/dashboard`
  - Patient → `/patient/home`
  - Admin → `/admin/dashboard`
- [ ] Add a **Logout** button visible when authenticated.
- [ ] The Pedi-Growth logo on the left remains and always links to `/` (the public home page).

**Layout Header (After):**
```
┌──────────────────────────────────────────────────────────────┐
│ [🏥 Pedi-Growth]                          [🔔] [Login ▸]    │  ← unauthenticated
│ [🏥 Pedi-Growth]              [🔔] [Dr. Farhan 👤] [Logout] │  ← authenticated
└──────────────────────────────────────────────────────────────┘
```

---

## Exit Criteria
Users can register, login, and are routed to the correct portal based on their role. The old navigation bar is gone and replaced with role-aware auth controls.
