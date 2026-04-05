# Pedi-Growth v3 — Implementation Summary

> A complete breakdown of every phase, what needs to be built, and the execution order.

---

## Execution Order

```
Phase 0A → 0B → 0C → 1A → 1B → 1C → 2A → 2B → 3A → 3B
```

Each phase depends on the previous one. Additionally, **Phase 3 (AI Copilot)** can be worked on in parallel once Phase 2A is complete.

---

## Locked Technology Decisions

| Decision | Choice |
|----------|--------|
| Auth | SMS OTP (patients) + Email/Password (clinicians/admins) |
| Router | Next.js Pages Router (keep existing) |
| Task Queue | FastAPI `BackgroundTasks` (for hackathon) |
| Languages | English + Bengali |
| Platform | Cross-Platform Responsive Web App (Mobile + Desktop) |

---

## Phase 0A — Database Schema

> **Goal:** Create foundational database tables for users, sessions, patient sharing, and scheduling.

### What Needs to Be Done

- [ ] Create `profiles` table — links to Supabase Auth; stores `role` (clinician / patient / admin), `display_name`, `phone`, `language`
- [ ] Create `sessions` table — groups analyses under a clinical visit (references `patients` and `profiles`)
- [ ] Alter `jobs` table — add `session_id` column (FK → sessions)
- [ ] Alter `patients` table — add `owner_id` column (FK → profiles)
- [ ] Create `patient_access` table — secure shareable links with `access_token` and `expires_at`
- [ ] Create `doctor_availability` table — clinician weekly availability slots (day of week, start/end time)
- [ ] Create `appointments` table — booked consultations with `UNIQUE(clinician_id, appointment_date, start_time)` to prevent double-booking
- [ ] Set up Row Level Security (RLS) policies:
  - Admins get full access to everything
  - Users can only see their own profile
  - Appointments visible to related clinicians/patients/admins

> **⚠️ NOTE:** The RLS policy for appointments has an **incomplete placeholder** for bridging patient login to patient record — this logic needs to be finalized.

---

## Phase 0B — Backend Authentication

> **Goal:** Add JWT-based auth middleware to FastAPI so every API request knows WHO is making it and WHAT role they have.

### What Needs to Be Done

- [ ] Create `backend/app/middleware/auth.py`:
  - `get_current_user()` — extract JWT from header, validate with Supabase, return profile
  - `require_role(*roles)` — restrict endpoints by role
  - `get_current_user_optional()` — for backwards-compatible public routes
- [ ] Create `backend/app/routes/auth.py` with endpoints:
  - `POST /api/v1/auth/register` — email/password for clinicians
  - `POST /api/v1/auth/login` — returns JWT
  - `POST /api/v1/auth/send-otp` — SMS OTP for patients
  - `POST /api/v1/auth/verify-otp` — verify OTP → returns JWT
  - `GET /api/v1/me` — get current user profile
  - `PATCH /api/v1/me` — update profile
- [ ] Add `ProfileService` and `SessionService` classes to `backend/app/services/database.py`
- [ ] Add auth-related Pydantic models to `backend/app/schemas.py` (`RegisterRequest`, `LoginRequest`, `OTPRequest`, `OTPVerifyRequest`, `ProfileResponse`)
- [ ] Update existing routes to use `get_current_user_optional` (preserve public upload flow)

> **⚠️ WARNING:** Existing public routes (video upload, results viewing) must NOT break. Use `get_current_user_optional` for backward compatibility.

---

## Phase 0C — Frontend Authentication

> **Goal:** Add login/logout flow, protect clinician/patient pages, store auth state in React context.

### What Needs to Be Done

- [ ] Create `src/context/AuthContext.tsx` — holds `user`, `loading`, `login()`, `loginWithOTP()`, `logout()`, `isAuthenticated`
- [ ] Create `src/hooks/useAuth.ts` — convenience hook wrapping the context
- [ ] Create `src/components/ProtectedRoute.tsx` — redirects based on auth state and role
- [ ] Create `pages/login.tsx` — dual-mode login:
  - **Clinician tab:** email + password
  - **Parent tab:** phone number + OTP
  - Design: dark theme, glass-card style, large touch targets
- [ ] Wrap `_app.tsx` with `<AuthProvider>`
- [ ] Update `src/services/api.ts`:
  - Add JWT interceptor to attach `Authorization: Bearer <token>` to all requests
  - Add `loginWithEmail()`, `sendOTP()`, `verifyOTP()`, `getMe()` API functions

### Routing After Auth

| Route | Access |
|-------|--------|
| `/` (Home) | PUBLIC — anonymous uploads still work |
| `/results/[id]` | PUBLIC — anyone with link can view |
| `/login` | PUBLIC — dual auth portal |
| `/clinician/*` | Protected — clinician only |
| `/patient/*` | Protected — patient only |

### Sub-Phase 0C.1: Navigation Bar Overhaul
- [ ] Remove the `Home | Dashboard | About` navigation pill bar from the Layout header
- [ ] Replace with a **Login button** (unauthenticated) or **user avatar + role badge + Logout** (authenticated)
- [ ] Clicking the avatar/dashboard link redirects to the user's role-specific dashboard (clinician → `/clinician/dashboard`, patient → `/patient/home`, admin → `/admin/dashboard`)

---

## Phase 1A — Component Extraction (Pure Refactor)

> **Goal:** Extract 6 inline components from the 1,128-line `results/[id].tsx` into standalone files. No behavior changes.

### What Needs to Be Done

- [ ] Create `src/components/clinical/` directory
- [ ] Extract these components with explicit TypeScript `Props` interfaces:

| New File | Source (from `[id].tsx`) |
|----------|------------------------|
| `ParentInsightsPanel.tsx` | Lines 15–214 (~200 lines) |
| `OrthopedicSummaryCard.tsx` | Lines 217–274 (~60 lines) |
| `OrthopedicGraphArea.tsx` | Lines 276–332 (~60 lines) |
| `NeuromuscularSummaryCard.tsx` | Lines 335–401 (~70 lines) |
| `NeuromuscularGraphArea.tsx` | Lines 403–460 (~60 lines) |
| `AISummaryCard.tsx` | Lines 988–1112 (~130 lines) |

- [ ] Update `pages/results/[id].tsx` to import from new files
- [ ] Verify page renders identically (visual diff) — target ~700 lines down from ~1,128

> **📝 Rules:** **Move, don't copy.** Each component gets a typed `Props` interface. No logic changes. All calculations stay exactly as they are.

---

## Phase 1B — Tabbed Clinical Report

> **Goal:** Replace the infinite-scroll results page with a 4-tab segmented clinical report.

### What Needs to Be Done

- [ ] Create `src/components/clinical/ReportTabs.tsx` — tab container with:
  - 4 tabs: ★ Summary, ▶ Kinematic, 🦴 Orthopedic, 🧠 Neuromuscular
  - Active tab underline/highlight indicator
  - URL hash sync (`#summary`, `#kinematic`, etc.)
  - Keyboard navigation (arrow keys)
- [ ] Create `src/components/clinical/ExecutiveSummary.tsx` — Tab 1:
  - ParentInsightsPanel (collapsible)
  - 5 Metric Cards (SI, ROM, Max Flexion, Asymmetry, Data Quality)
  - Educational Note (high-risk only)
  - AI Clinical Summary Card
- [ ] Create `src/components/clinical/KinematicPlayback.tsx` — Tab 2:
  - Processed Video Player
  - Knee Flexion/Extension Chart
  - Visual Localization Body Diagram
  - Bilateral Comparison cards
- [ ] Create `src/components/clinical/OrthopedicDiagnostics.tsx` — Tab 3:
  - OrthopedicSummaryCard + Graph
  - **NEW:** Clinical Interpretation Note (explanation of thresholds)
- [ ] Create `src/components/clinical/NeuromuscularDiagnostics.tsx` — Tab 4:
  - NeuromuscularSummaryCard + Graph
  - **NEW:** Clinical Interpretation Note
- [ ] Create `pages/clinician/reports/[jobId].tsx` — new report page wrapped in `<ProtectedRoute>`

> **💡 TIP:** The old `pages/results/[id].tsx` can be retired after this phase. The always-visible header includes: DiagnosisBanner, Symmetry Score Ring, and Patient Info Bar.

### Sub-Phase 1B.1: Quick Summary Report Layout Redesign
- [ ] Redesign ParentInsightsPanel with a structured card-based layout: overview severity bar at top, 2-column insight cards with icon + title + severity badge + metric value, "Read More" expanders, and a "Next Steps" CTA section at bottom
- [ ] Summary should NOT be collapsed by default — it's the first thing parents see

### Sub-Phase 1B.2: Interactive Video with Clickable Problem Markers
- [ ] Overlay pulsing, color-coded **problem markers** on the video at body parts where issues are detected (knee, ankle, trunk)
- [ ] Clicking a marker opens a detail panel: problem name, measured angle vs. normal range, plain-English explanation, gait cycle %
- [ ] Show colored segments on the video timeline so users can scrub directly to problem areas

### Sub-Phase 1B.3: Premium Diagnostics Card UI
- [ ] Redesign Orthopedic & Neuromuscular sections with dark card backgrounds, ALERT/SIGNIFICANT/NORMAL pill badges, large metric values, and "VIEW DETAIL >" expandable buttons
- [ ] Match the premium clinical dashboard reference design (dark theme, color-coded status badges, kinematics chart with gait phase labels)

### Sub-Phase 1B.4: Consistent Processed Video Loading
- [ ] Fix video failing to load on certain devices: proper MP4→WebM fallback chain, `playsInline` for iOS, correct `Content-Type` headers, retry mechanism, responsive aspect ratio
- [ ] Test on Chrome, Firefox, Safari (iOS + macOS), and Edge

---

## Phase 1C — Clinician Portal Pages

> **Goal:** Build the clinician-facing pages for patient management, analysis, and consultation appointments.

### What Needs to Be Done

- [ ] Create `/clinician/dashboard` — overview with quick stats, recent activity, and **"Upcoming Consultations"** for the day
- [ ] Create `/clinician/patients` and `/clinician/patients/[patientId]` — patient registry + single patient profile with longitudinal history
- [ ] Create `/clinician/analysis/new` — dedicated video upload/recording page for clinical ingestion
- [ ] Create `/clinician/appointments` — calendar/list view:
  - Left panel: set availability hours (per day-of-week)
  - Right panel: upcoming appointments with Join/Link buttons
  - Links to the flagged report (`job_id`)
- [ ] Update sidebar navigation to include all new pages:
  - 🏠 Dashboard, 👥 Patients, 📹 New Analysis, 📅 Appointments
  - Bottom: Profile, Settings, Logout

### Sub-Phase 1C.1: Patient Records Search & Filter
- [ ] Add a **Search bar** (real-time, debounced) searching by patient name, ID, and date
- [ ] Add a **Filter button** with dropdowns for: Diagnosis (Normal/High Risk/DMD Risk), Date Range, Severity, and Sort order
- [ ] Active filters show as dismissible pill badges; state persists during session

---

## Phase 2A — Patient Portal UI

> **Goal:** Build a cross-platform, mobile-first patient portal with video capture demo and doctor booking CTA.

### What Needs to Be Done

- [ ] Create `/patient/login` and `/patient/home` — SMS OTP login + simple dashboard
- [ ] Create `/patient/capture` — video capture page with:
  - **Built-in demo** (looping GIF/video showing HOW to record the gait)
  - Camera overlay with walking guide
  - Large "Start Recording" button (mobile-first touch targets)
- [ ] Create `/patient/upload` — progressive, chunked upload with progress indicator
- [ ] Create `/patient/results/[id]` — plain-language results:
  - Severity badges ("Needs Attention", "Healthy")
  - No clinical jargon
  - **Prominent "Consult a Doctor" CTA** if severity is concerning → links to scheduling flow (Phase 3A)

> **⚠️ IMPORTANT:** Design must feel premium and trustworthy on both mobile and desktop. No clinical jargon — everything must be understandable for parents.

---

## Phase 2B — Bengali Localization + LLM Translation

> **Goal:** Enable the entire patient portal in Bengali (বাংলা).

### What Needs to Be Done

#### Layer 1: Static Strings (i18n)
- [ ] Set up `next-i18next`
- [ ] Create `public/locales/en/common.json` and `public/locales/en/patient.json`
- [ ] Create `public/locales/bn/common.json` and `public/locales/bn/patient.json`
- [ ] Use `useTranslation('patient')` hook in all patient portal components

#### Layer 2: Dynamic Content (LLM Translation)
- [ ] Update `routes/ai_summary.py` — add `lang` parameter (`en` or `bn`); modify system prompt for Bengali generation
- [ ] Create `/api/v1/patient/results/{job_id}` endpoint with `lang` param for translated insights
- [ ] Generate Bengali insights via LLM for ParentInsightsPanel

#### UI Changes
- [ ] Add `LanguageToggle` component — appears on login page, results page, and patient portal
- [ ] Persist language preference in user's `profiles.language` field
- [ ] Add Bengali font (`Noto Sans Bengali`) to `_document.tsx`
- [ ] Add CSS: `[lang="bn"] { font-family: 'Noto Sans Bengali', sans-serif; }`

---

## Phase 3 — AI Co-pilot & Intelligent Onboarding

> **Goal:** Transform the app from a static report viewer into an interactive, supportive journey.

### What Needs to Be Done

#### Feature 1: "Waiting Room" AI Co-pilot
- [ ] Create `POST /api/copilot/chat` backend endpoint:
  - Injects actual extracted MediaPipe data into the LLM system prompt
  - Uses `ConversationBufferMemory` tied to `session_id` for follow-up questions
  - Empathetic tone; does NOT give final medical diagnosis
- [ ] Create `<AICopilotChat />` frontend component:
  - Floating chat widget or embedded below the alert banner
  - Auto-opens with initial greeting when report finishes or user clicks "Consult Specialist"
  - Typing indicator, standard chat UI

#### Feature 2: Intelligent Onboarding Walkthrough
- [ ] Install `react-joyride` (or `intro.js`)
- [ ] Create `PatientOnboarding.tsx` with guided steps:
  - Step 1: Dashboard overview
  - Step 2: Start Analysis button
  - Step 3: Upload instructions (lighting, walking direction, clothing)
- [ ] Style tooltips as chat bubbles from the Pedi-Growth AI mascot

---

## Phase 3A — Consultation Scheduling System

> **Goal:** Frictionless, clash-free appointment booking from the Patient Portal.

### What Needs to Be Done

- [ ] Create `/patient/book-consultation/[jobId]` page:
  - Step 1: Select a Doctor (dropdown of available clinicians)
  - Step 2: Select Date (horizontal scrolling date picker)
  - Step 3: Select Time (large rounded buttons; clashing times grayed out)
  - Confirm Appointment button
- [ ] Create backend endpoints:
  - `GET /api/v1/scheduling/available-slots?doctor_id=X&date=YYYY-MM-DD` — overlaps `doctor_availability` with existing `appointments`
  - `POST /api/v1/scheduling/book` — creates appointment; uses PostgreSQL `UNIQUE` constraint to handle race conditions

> **🚨 CAUTION:** Double-booking prevention relies on the `UNIQUE(clinician_id, appointment_date, start_time)` database constraint. Backend must handle constraint violations gracefully and return user-friendly error messages.

---

## Phase 3B — Global Admin Portal

> **Goal:** Omnipotent admin portal for managing users, patients, and system metrics.

### What Needs to Be Done

- [ ] Create `/admin/dashboard` — system overview:
  - Stat cards: Total Patients, Clinicians, Total Scans, System Uptime
  - System Health & API Metrics graph
  - Quick action buttons
- [ ] Create `/admin/users` — role management:
  - View all clinicians and patients
  - Elevate users to admin
  - Reset passwords / disable accounts
- [ ] Create `/admin/patients/new` — omnipotent patient creation:
  - Admin can add patients directly without mobile signup
  - Assign patients to specific clinicians
  - Trigger analysis on behalf of any patient
- [ ] Add backend `require_admin` middleware:
  ```python
  def require_admin(user=Depends(get_current_user)):
      if user["role"] != "admin":
          raise HTTPException(status_code=403, detail="Admin access required")
  ```
- [ ] Wrap all admin pages with `<ProtectedRoute allowedRoles={['admin']}>`

---

## Total Files to Create / Modify

| Category | New Files | Modified Files |
|----------|-----------|---------------|
| Database | 0 (SQL migrations) | `jobs`, `patients` tables |
| Backend | ~8 new files | `database.py`, `schemas.py`, existing routes |
| Frontend Auth | ~5 new files | `_app.tsx`, `api.ts` |
| Clinical Components | ~10 new files | `results/[id].tsx` (refactored) |
| Clinician Pages | ~5 new pages | Layout sidebar |
| Patient Pages | ~5 new pages | — |
| Localization | ~5 new files | `_document.tsx`, patient components |
| AI Copilot | ~3 new files | — |
| Scheduling | ~2 new files + endpoints | — |
| Admin | ~3 new pages + middleware | — |

> **Estimated total: ~45+ new files across backend and frontend.**

---

## What's Being Fixed & Why It Matters

| # | What's Being Fixed | Impact |
|---|-------------------|--------|
| 1 | **No user authentication exists** — anyone can access anything, no concept of "who is logged in" | Clinicians, patients, and admins will each have their own secure login. Patient data is protected. Nobody sees what they shouldn't. |
| 2 | **No role separation** — clinicians and parents see the exact same interface | Each user type gets a purpose-built portal. Clinicians get clinical tools; parents get simple, jargon-free views. |
| 3 | **The results page is a single 1,128-line monster file** — impossible to maintain or extend | Code is split into 6 clean, reusable components. Future changes are isolated and won't break unrelated sections. |
| 4 | **Results require endless scrolling** — clinicians must scroll through 1,000+ lines to find the section they need | A 4-tab layout lets clinicians jump directly to Summary, Kinematic, Orthopedic, or Neuromuscular findings instantly. |
| 5 | **No clinician workspace** — doctors have no dashboard, patient list, or way to manage their work | Clinicians get a full portal: dashboard with stats, patient registry, analysis upload page, and appointment management. |
| 6 | **No patient portal** — parents have no dedicated, mobile-friendly experience | Parents get a simple, mobile-first portal to record videos, view results in plain language, and take action on concerning findings. |
| 7 | **Parents don't know how to record the video properly** — leading to poor-quality submissions and bad analysis results | A built-in video demo shows parents exactly how to position and record their child's gait before they start filming. |
| 8 | **High-risk results leave parents anxious with no next step** — the report just says "High Risk" and stops | A prominent "Consult a Doctor" button appears on concerning results, letting parents immediately book a specialist appointment. |
| 9 | **No appointment scheduling** — no way for patients to book or clinicians to manage consultations | A full scheduling system with date/time picker, clash prevention, and availability management connects patients directly to doctors. |
| 10 | **Doctors can be double-booked** — no mechanism prevents two patients from booking the same time slot | Database-level constraints and smart slot calculation ensure a clinician can never be booked for overlapping appointments. |
| 11 | **The app only works in English** — unusable for Bengali-speaking parents in rural Bangladesh | The entire patient portal becomes available in Bengali, including AI-generated summaries translated into simple, everyday Bengali. |
| 12 | **Parents are left alone after receiving a scary report** — no support while waiting for a doctor | An AI co-pilot chat greets the parent, explains the findings in gentle terms, and answers their questions while they wait for the doctor. |
| 13 | **New users have no guidance** — first-time patients don't know how the app works | An intelligent walkthrough guides new users step-by-step through the dashboard, video recording, and upload process. |
| 14 | **No admin oversight** — nobody can see system-wide stats, manage users, or intervene when needed | An admin portal provides full control: user management, patient creation, system health monitoring, and the ability to act on behalf of any user. |
| 15 | **Database has no structure for user identity, sessions, or sharing** — everything is anonymous | New tables for profiles, sessions, patient access tokens, and appointments establish a proper data foundation for the entire system. |
| 16 | **RLS policies are incomplete** — the appointment visibility logic has a placeholder that needs finishing | Finalizing RLS ensures patients only see their own appointments and clinicians only see theirs, while admins can see everything. |
| 17 | **The navigation bar shows Home/Dashboard/About with no login awareness** — users can't log in or see their role | The nav bar is replaced with role-aware auth controls: Login button when logged out, user avatar + role badge + Logout when logged in, with redirect to the correct dashboard per role. |
| 18 | **The Quick Summary is a collapsed wall of text** — parents can't scan it quickly to understand what matters | A structured card-based layout with severity indicators, titled insight cards, prominent metrics, and clear Next Steps makes it instantly understandable. |
| 19 | **The processed video is passive** — users watch but can't interact to understand where the problems are | Clickable markers appear on the video at problem body parts. Clicking a marker shows the issue name, measured angle vs. normal, and what it means in plain English. |
| 20 | **Diagnostics sections look basic and clinical** — plain colored boxes don't convey the seriousness or professionalism expected | Premium dark-themed cards with ALERT/SIGNIFICANT/NORMAL badges, large metric values, and expandable "View Detail" panels make diagnostics look and feel like a real clinical dashboard. |
| 21 | **No way to search or filter patient records** — clinicians must scroll through the entire patient list manually | A search bar + filter button with diagnosis, date range, and severity filters let clinicians find any patient instantly. |
| 22 | **Processed video doesn't load consistently** — fails on some devices and browsers due to format/CORS/proxy issues | Proper fallback chain (MP4→WebM), iOS compatibility fixes, correct headers, and retry logic ensure the video plays everywhere. |
