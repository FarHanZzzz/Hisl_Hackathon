# Pedi-Growth v3 — Exact Implementation Prompts

> Copy-paste each prompt below to execute the corresponding phase. Prompts are self-contained and reference the project's existing codebase. Execute in order.

---

## Phase 0A — Database Schema Migration

```
You are working on a Next.js + FastAPI project called Pedi-Growth (pediatric gait analysis tool). The database is Supabase (PostgreSQL).

Create the following SQL migration and apply it to the Supabase project:

1. Create a `profiles` table:
   - `id` UUID PRIMARY KEY referencing `auth.users(id)` ON DELETE CASCADE
   - `role` TEXT NOT NULL with CHECK constraint: 'clinician', 'patient', 'admin'
   - `display_name` TEXT
   - `phone` TEXT
   - `language` TEXT DEFAULT 'en' CHECK ('en', 'bn')
   - `created_at` TIMESTAMPTZ DEFAULT now()

2. Create a `sessions` table:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `patient_id` UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE
   - `clinician_id` UUID NOT NULL REFERENCES profiles(id)
   - `title` TEXT, `notes` TEXT, `created_at` TIMESTAMPTZ DEFAULT now()

3. ALTER `jobs` table: ADD COLUMN `session_id` UUID REFERENCES sessions(id) ON DELETE SET NULL

4. ALTER `patients` table: ADD COLUMN `owner_id` UUID REFERENCES profiles(id)

5. Create `patient_access` table:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `patient_id` UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE
   - `profile_id` UUID REFERENCES profiles(id)
   - `access_token` TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')
   - `expires_at` TIMESTAMPTZ DEFAULT (now() + interval '30 days')
   - `created_at` TIMESTAMPTZ DEFAULT now()

6. Create `doctor_availability` table:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `clinician_id` UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - `day_of_week` INT CHECK (0-6), `start_time` TIME NOT NULL, `end_time` TIME NOT NULL
   - `is_active` BOOLEAN DEFAULT TRUE

7. Create `appointments` table:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `patient_id` UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE
   - `clinician_id` UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - `job_id` UUID REFERENCES jobs(id) ON DELETE SET NULL
   - `appointment_date` DATE NOT NULL, `start_time` TIME NOT NULL, `end_time` TIME NOT NULL
   - `status` TEXT CHECK ('scheduled', 'completed', 'cancelled')
   - `meet_link` TEXT, `created_at` TIMESTAMPTZ DEFAULT now()
   - UNIQUE(clinician_id, appointment_date, start_time)

8. Enable RLS on profiles, sessions, patient_access, appointments. Create policies:
   - Admins full access on all tables
   - Users see own profile
   - Appointments visible to related clinician, patient owner, and admin

Do NOT modify any existing data. This is a DDL-only migration.
```

---

## Phase 0B — Backend Authentication

```
You are working on the FastAPI backend at `backend/app/`. The database is Supabase with the schema from Phase 0A (profiles, sessions, patient_access, appointments tables exist).

Implement JWT-based authentication:

1. Create `backend/app/middleware/auth.py`:
   - `get_current_user(request) -> dict`: Extract Bearer token from Authorization header, verify JWT with Supabase Auth, fetch profile from profiles table, return {id, role, display_name, language}. Raise HTTPException(401) if invalid.
   - `get_current_user_optional(request) -> dict | None`: Same but returns None instead of raising if no token. This is for backwards-compatible public routes like video upload.
   - `require_role(*roles)`: FastAPI Depends that checks user.role is in the allowed list. Raise HTTPException(403) if wrong role.

2. Create `backend/app/routes/auth.py` with these endpoints:
   - POST `/api/v1/auth/register` (public): Accept {email, password, display_name, role}. Create user via Supabase Auth, create profile row, return JWT.
   - POST `/api/v1/auth/login` (public): Accept {email, password}. Authenticate via Supabase, return JWT.
   - POST `/api/v1/auth/send-otp` (public): Accept {phone}. Send SMS OTP via Supabase.
   - POST `/api/v1/auth/verify-otp` (public): Accept {phone, otp_code}. Verify OTP, create profile if first time (role=patient), return JWT.
   - GET `/api/v1/me` (authenticated): Return current user profile.
   - PATCH `/api/v1/me` (authenticated): Update display_name, language.

3. Add to `backend/app/services/database.py`:
   - `ProfileService` class: get_by_id, create, update
   - `SessionService` class: create, list_by_patient, get

4. Add to `backend/app/schemas.py`:
   - RegisterRequest, LoginRequest, OTPRequest, OTPVerifyRequest, ProfileResponse Pydantic models

5. Update existing routes to use `get_current_user_optional` dependency (DO NOT break public upload/results endpoints). Protected routes like clinician dashboard use `get_current_user`.

Register the auth router in main.py. Existing functionality must continue to work without a token.
```

---

## Phase 0C — Frontend Authentication + Navigation Bar Overhaul

```
You are working on the Next.js frontend at `frontend/`. The backend auth endpoints from Phase 0B are live. The current Layout component is at `frontend/src/components/Layout.tsx`.

Implement frontend authentication AND overhaul the navigation bar:

1. Create `frontend/src/context/AuthContext.tsx`:
   - AuthProvider wraps the entire app
   - State: user ({id, role, display_name, language} | null), loading (boolean)
   - Methods: login(email, password), loginWithOTP(phone, otp), logout(), isAuthenticated (boolean)
   - On mount: check localStorage for token, call GET /api/v1/me to validate, set user state
   - Store JWT in localStorage

2. Create `frontend/src/hooks/useAuth.ts`: Convenience hook wrapping useContext(AuthContext)

3. Create `frontend/src/components/ProtectedRoute.tsx`:
   - Props: allowedRoles (string array), children
   - If loading: show spinner
   - If not authenticated: redirect to /login
   - If authenticated but wrong role: redirect to appropriate portal (clinician→/clinician/dashboard, patient→/patient/home, admin→/admin/dashboard)

4. Create `frontend/pages/login.tsx`:
   - Dual-mode login with TWO tabs: "Clinician" (email+password) and "Parent" (phone+OTP)
   - Dark theme (bg-slate-950), glass-card styling, cyan-500 accents matching existing app
   - Large touch targets for parent tab (mobile-first)
   - On successful login: redirect based on role

5. Modify `frontend/pages/_app.tsx`: Wrap with <AuthProvider>

6. Update `frontend/src/services/api.ts`:
   - Add axios interceptor to attach Authorization: Bearer <token> header
   - Add functions: loginWithEmail(), sendOTP(), verifyOTP(), getMe()

7. **NAVIGATION BAR OVERHAUL** — Modify `frontend/src/components/Layout.tsx`:
   - REMOVE the existing Home | Dashboard | About pill-style navigation bar entirely
   - When UNAUTHENTICATED: Show only the Pedi-Growth logo (left) + notification bell + "Login" button styled as a cyan-500 pill button
   - When AUTHENTICATED: Show Pedi-Growth logo (left) + notification bell + user avatar circle with display_name + role badge (e.g., "Dr. Farhan | Clinician") + "Logout" button
   - Clicking the avatar or "My Dashboard" redirects to the role-specific dashboard:
     - clinician → /clinician/dashboard
     - patient → /patient/home
     - admin → /admin/dashboard
   - The logo always links to / (public home page)
   - Use the useAuth() hook to check authentication state
   - Keep the existing dark theme, footer, and overall structure

Routing rules:
- / (Home): PUBLIC, anonymous uploads still work
- /results/[id]: PUBLIC
- /login: PUBLIC
- /clinician/*: ProtectedRoute (clinician only)
- /patient/*: ProtectedRoute (patient only)
- /admin/*: ProtectedRoute (admin only)
```

---

## Phase 1A — Component Extraction

```
You are working on the Next.js frontend at `frontend/`. The file `frontend/pages/results/[id].tsx` is 1,128 lines long and contains 6 inline component definitions that need to be extracted into standalone files. This is a PURE REFACTOR — no features, no logic changes, no behavior changes. The page must look and work EXACTLY the same after.

1. Create directory `frontend/src/components/clinical/`

2. Extract these components — MOVE (not copy) the code, then replace with imports:

   a. `frontend/src/components/clinical/ParentInsightsPanel.tsx` (lines 15-214):
      - The ParentInsightsPanel component with all its insight calculation logic
      - Props interface: { result: Result }
      - Import Result from '../../types'

   b. `frontend/src/components/clinical/OrthopedicSummaryCard.tsx` (lines 217-274):
      - The OrthopedicSummaryCard with Rickets/LLD/Clubfoot eval badges
      - Props: { result: Result }

   c. `frontend/src/components/clinical/OrthopedicGraphArea.tsx` (lines 276-332):
      - The orthopedic kinematics chart (Valgus, Pelvic Tilt, Dorsiflexion)
      - Props: { chartData: any[]; result: Result }

   d. `frontend/src/components/clinical/NeuromuscularSummaryCard.tsx` (lines 335-401):
      - The DMD/Trunk Sway/Scoliosis eval badges
      - Props: { result: Result }

   e. `frontend/src/components/clinical/NeuromuscularGraphArea.tsx` (lines 403-460):
      - The neuromuscular kinematics chart (Trunk Sway, Shoulder Tilt, Pelvic Tilt)
      - Props: { chartData: any[]; result: Result }

   f. `frontend/src/components/clinical/AISummaryCard.tsx` (lines 988-1112):
      - The AI Clinical Summary section
      - Props: { summary: AISummary | null; loading: boolean; error: string | null; onRetry: () => void }

3. Update `pages/results/[id].tsx`:
   - Delete all 6 inline component definitions
   - Add imports from '../../src/components/clinical/...'
   - Use the components exactly as before: <ParentInsightsPanel result={firstResult} />, etc.
   - Target: ~700 lines after extraction

4. Each extracted file must:
   - Have an explicit TypeScript Props interface
   - Import types from the correct relative path
   - Export as a named export
   - Include all necessary imports (React hooks, recharts, etc.)

5. Run `npm run dev` and verify it compiles without errors. Zero visual changes.
```

---

## Phase 1B — Tabbed Clinical Report + Quick Summary + Interactive Video + Diagnostics UI + Video Fix

```
You are working on the Next.js frontend at `frontend/`. Phase 1A extracted components into `frontend/src/components/clinical/`. The existing results page is at `frontend/pages/results/[id].tsx`. The app uses a dark theme (bg-slate-950, cyan-500 accents, Outfit/Inter fonts).

Build the new tabbed clinical report with 4 major enhancements:

=== CORE: TABBED REPORT ===

1. Create `frontend/src/components/clinical/ReportTabs.tsx`:
   - 4 tab buttons: ★ Executive Summary, ▶ Kinematic Playback, 🦴 Orthopedic, 🧠 Neuromuscular
   - Active tab: bg-cyan-500/10, text-cyan-400, 2px bottom border cyan-500
   - Inactive: text-slate-400, hover:text-slate-200
   - URL hash sync (#summary, #kinematic, #orthopedic, #neuromuscular) for deep links
   - Smooth CSS transitions between tabs
   - Keyboard arrow key navigation

2. Create `frontend/src/components/clinical/ExecutiveSummary.tsx` (Tab 1):
   - Redesigned ParentInsightsPanel (see 1B.1 below)
   - 5 Metric Cards grid
   - Educational Note (high-risk only)
   - AI Summary Card

3. Create `frontend/src/components/clinical/KinematicPlayback.tsx` (Tab 2):
   - Interactive Video Player (see 1B.2 below)
   - Knee Flexion/Extension chart
   - VisualLocalization body diagram
   - Bilateral Comparison cards

4. Create `frontend/src/components/clinical/OrthopedicDiagnostics.tsx` (Tab 3):
   - Premium diagnostics cards (see 1B.3 below)
   - Kinematics chart with gait phase labels

5. Create `frontend/src/components/clinical/NeuromuscularDiagnostics.tsx` (Tab 4):
   - Premium diagnostics cards (see 1B.3 below)
   - Kinematics chart with gait phase labels

6. Create `frontend/pages/clinician/reports/[jobId].tsx`:
   - Fetch job data using the same getJob API
   - Always visible: HeaderActions (Back, Print, Export, Share), DiagnosisBanner + Symmetry Ring, Patient Info Bar
   - Below: <ReportTabs> with 4 tab contents
   - Wrap in ProtectedRoute (clinician only) if auth exists, otherwise keep public

=== 1B.1: QUICK SUMMARY LAYOUT REDESIGN ===

Redesign the ParentInsightsPanel component completely:
- DO NOT collapse by default. Show everything open.
- Top: Overview severity bar — large colored badge (🟢 Healthy / 🟡 Areas to Monitor / 🔴 Needs Attention), count of flagged areas, one-sentence verdict
- Middle: 2-column grid (desktop) / stacked (mobile) of insight cards, each with:
  - Left: colored icon in a rounded square
  - Title (e.g., "Knee Alignment", "Walking Symmetry")
  - Severity pill badge (Good/Mild/Concern)
  - 2-3 sentence summary visible by default
  - "Read More ▸" button that expands to show the full detailed explanation
  - The specific metric value displayed prominently (e.g., "168.6°")
- Bottom: "Suggested Next Steps" section with clear CTAs

=== 1B.2: INTERACTIVE VIDEO WITH CLICKABLE PROBLEM MARKERS ===

Enhance the video player in KinematicPlayback:
- Render the <video> element as before but overlay a transparent interactive canvas/div on top
- At the specific frames where issues are detected (derive from angle arrays + thresholds already in the result data), show pulsing circular markers:
  - Position markers at the approximate body part location (knee area = 60% from top, ankle = 85%, trunk = 30%)
  - Color-coded: amber for mild, red for concern
  - Animate with a subtle pulse CSS animation
- When a marker is CLICKED, show a slide-out panel (or modal) containing:
  - Problem name (e.g., "Knee Valgus Detected")
  - Measured value vs. normal range (e.g., "168.6° — Normal: 175°-185°")
  - 2-sentence plain-English explanation
  - "View in Diagnostics Tab ▸" link to switch tabs
- Below the video: a custom timeline bar showing colored segments where problems occur (e.g., red segment from 30%-45% of gait cycle)
- Use the existing result data arrays (knee_valgus_angle_array, trunk_sway_array, etc.) — sample them to find frames exceeding thresholds

=== 1B.3: PREMIUM DIAGNOSTICS CARD UI ===

Redesign OrthopedicSummaryCard and NeuromuscularSummaryCard to look like a premium clinical dashboard:

For EACH evaluation card (e.g., Rickets Eval, LLD Eval, Clubfoot Eval, DMD Status, Trunk Sway, Scoliosis):
- Dark card background: bg-slate-900/80 with border border-slate-700/50
- Top-left: Status icon (⚠️ triangle for alert, ⚡ pulse for significant, ✅ check for normal) in a colored circle
- Top-right: Status badge pill — "ALERT" (bg-red-500/20 text-red-400), "SIGNIFICANT" (bg-amber-500/20 text-amber-400), "NORMAL" (bg-emerald-500/20 text-emerald-400)
- Title: Evaluation name (e.g., "Rickets Eval") in white, bold
- Subtitle: Description (e.g., "Genu Varum / Bowlegs detected")
- Large metric: The key number displayed very prominently (e.g., "168.6°" in 3xl font), with unit label (VALGUS ANGLE, MAX TILT, DORSIFLEXION)
- Bottom: "VIEW DETAIL >" button that toggles an expandable section showing:
  - Normal range comparison
  - Clinical interpretation
  - Threshold explanation
  - Recommended actions

Cards in a 3-column grid on desktop, stacked on mobile.

Below the cards: Keep the existing line charts but style them with the same dark theme:
- Title: "Kinematics Over Gait Cycle" with subtitle "Real-time biomechanical data visualization"
- Chart background: transparent/dark
- Add gait phase labels below the X-axis: "STANCE PHASE" and "SWING PHASE" separated at 60%
- Legend pills for each line (colored dots with labels)

=== 1B.4: CONSISTENT VIDEO LOADING ===

Fix the video player to work on ALL devices:
- Add `playsInline` and `webkit-playsinline` attributes to the <video> element
- Use multiple <source> elements: MP4 first, then WebM
- Keep the HEAD request check but add a retry: if it fails, wait 2 seconds and try once more
- Set explicit crossOrigin="anonymous"
- Ensure the Next.js rewrites in next.config.js proxy video files correctly with proper Content-Type
- Make the video container responsive: use aspect-video class, object-contain
- On iOS Safari: use #t=0.001 trick for thumbnail display

The entire report should use the dark theme: bg-slate-950 base, slate-900 cards, cyan-500 accents, Outfit for headings, Inter for body text.
```

---

## Phase 1C — Clinician Portal Pages + Patient Search & Filter

```
You are working on the Next.js frontend at `frontend/`. Auth context and ProtectedRoute from Phase 0C exist. The tabbed report from Phase 1B exists. The app uses dark theme (bg-slate-950, cyan-500 accents).

Build the clinician portal with 4 pages + sidebar layout + search/filter:

1. Create `frontend/src/components/ClinicianLayout.tsx`:
   - Sidebar navigation (fixed left, 240px width on desktop, collapsible on mobile):
     - Top: Pedi-Growth logo + "Clinical Portal" subtitle
     - User card: Avatar circle + name + "Clinician" role badge
     - Nav items with icons: 🏠 Dashboard, 👥 Patients, 📹 New Analysis, 📅 Appointments
     - Active item: bg-cyan-500/10, text-cyan-400, left border accent
     - Bottom section: ⚙️ Settings, ❓ Help, "Export Report" button (cyan-500 bg)
   - Main content area: right of sidebar, full remaining width
   - Dark theme consistent with app

2. Create `frontend/pages/clinician/dashboard.tsx`:
   - Welcome header: "Good morning, Dr. {name}"
   - 4 stat cards in a row: Total Patients, Analyses This Week, Pending Reviews, Appointments Today
   - Recent Activity feed (list of recent analyses with patient name, date, diagnosis badge)
   - Upcoming Consultations section: today's appointments with time, patient name, risk badge, [Join] button

3. Create `frontend/pages/clinician/patients.tsx`:
   - **SEARCH BAR** at the top: Full-width input with search icon, placeholder "Search patients by name, ID, or date...", debounced at 300ms, real-time filtering
   - **FILTER BUTTON** next to search bar: Opens a dropdown panel with:
     - Diagnosis filter: buttons/chips for All, Normal, High Risk, DMD Risk
     - Date range: Last 7 days, Last 30 days, Last 3 months, All Time
     - Sort: Most Recent, Name A-Z, Name Z-A, Highest Risk First
   - Active filters shown as dismissible pill badges below the search bar (e.g., "✕ High Risk" "✕ Last 30 days")
   - Patient list: Card-based or table layout with columns: Patient ID, Name, Last Analysis Date, Diagnosis (badge), Risk Level, Actions (View Report)
   - "No results found" empty state with illustration

4. Create `frontend/pages/clinician/patients/[patientId].tsx`:
   - Patient profile header (name, ID, age, contact)
   - Longitudinal analysis history: list of all past analyses with date, diagnosis, symmetry score
   - Click any analysis to open the tabbed report

5. Create `frontend/pages/clinician/analysis/new.tsx`:
   - Upload area (drag & drop or file picker) for video files
   - Patient selector dropdown (existing patients or create new)
   - Clinical notes textarea
   - Submit button that calls the existing upload API

6. Create `frontend/pages/clinician/appointments.tsx`:
   - Left panel: "My Availability" — editable weekly schedule (day + start time + end time per day)
   - Right panel: "Upcoming Appointments" — grouped by date, showing time, patient name, diagnosis badge, [Join Meeting] button, link to the analysis report

All pages wrap content in <ClinicianLayout> and <ProtectedRoute allowedRoles={['clinician']}>. Use existing API endpoints where possible, mock data where endpoints don't exist yet.
```

---

## Phase 2A — Patient Portal UI

```
You are working on the Next.js frontend at `frontend/`. Auth exists from Phase 0C. The app uses dark theme (bg-slate-950, cyan-500 accents).

Build a mobile-first, cross-platform patient portal:

1. Create `frontend/src/components/PatientLayout.tsx`:
   - Mobile-first: bottom tab navigation (Home, Record, Results, Profile)
   - Desktop: slim top navigation bar
   - Dark gradient background, friendly warm tones mixed with the clinical cyan

2. Create `frontend/pages/patient/home.tsx`:
   - Welcome message: "Hello, {name}" with avatar
   - Quick action cards: "Record New Video", "View Past Results"
   - Recent results list with simple status badges (🟢 Healthy, 🟡 Needs Attention, 🔴 Urgent)
   - All text in plain language, no medical jargon

3. Create `frontend/pages/patient/capture.tsx`:
   - Top: Instructional demo area — a short looping video/GIF showing HOW to record (child walking sideways, 2 meters away, well-lit room)
   - Middle: Camera viewfinder with semi-transparent walking-person silhouette overlay guide
   - Bottom: Large round "🔴 Start Recording" button (minimum 64px touch target)
   - During recording: timer, "Stop" button, quality indicators
   - After recording: preview with "Use This Video" or "Record Again" options

4. Create `frontend/pages/patient/upload.tsx`:
   - Animated progress bar with percentage
   - "Please keep this screen open" warning
   - File size and estimated time remaining
   - Success state: "Analysis in progress! You'll be notified when results are ready."

5. Create `frontend/pages/patient/results/[id].tsx`:
   - Simplified results view (NOT the full clinical report):
     - Large severity badge at top: "Your Child's Walking Looks Healthy 🟢" or "Some Areas Need Attention 🟡"
     - 3-4 key insights in card format (plain English, no numbers unless essential)
     - If high risk or concern: PROMINENT "👨‍⚕️ Consult a Doctor" CTA button — large, full-width, with reassuring text "Schedule a free online appointment now"
     - Clicking the CTA navigates to /patient/book-consultation/[jobId] (Phase 3A)

Design principles: Beautiful, trustworthy, premium feel. No clinical jargon anywhere. Large touch targets. Accessible colors with sufficient contrast.
```

---

## Phase 2B — Bengali Localization + LLM Translation

```
You are working on the full-stack Pedi-Growth project. Frontend is Next.js at `frontend/`, backend is FastAPI at `backend/app/`. The patient portal from Phase 2A exists.

Implement Bengali (বাংলা) localization with two layers:

=== LAYER 1: STATIC STRINGS (i18n) ===

1. Install next-i18next in the frontend: `npm install next-i18next`

2. Create translation JSON files:
   - `frontend/public/locales/en/common.json` — shared strings (nav, buttons)
   - `frontend/public/locales/en/patient.json` — patient portal strings
   - `frontend/public/locales/bn/common.json` — Bengali translations
   - `frontend/public/locales/bn/patient.json` — Bengali translations
   Include keys: welcome, record_video, past_results, healthy, needs_attention, share_with_doctor, upload_progress, upload_keep_open, next_step, consult_doctor, book_appointment

3. Configure next-i18next in next.config.js and create next-i18next.config.js

4. Update all patient portal components to use `const { t } = useTranslation('patient')` and replace hardcoded strings with `t('key')`

=== LAYER 2: DYNAMIC CONTENT (LLM) ===

5. Modify `backend/app/routes/ai_summary.py`:
   - Add `lang: str = Query("en", regex="^(en|bn)$")` parameter
   - If lang == "bn": use a Bengali system prompt instructing the LLM to generate in clear, simple Bengali using everyday words (no English medical terms). Tone: warm, reassuring, empathetic.
   - If lang == "en": use existing English prompt

6. Create or modify GET `/api/v1/patient/results/{job_id}` endpoint:
   - Accept `lang` query parameter
   - If bn: generate Bengali insight texts via LLM for the ParentInsightsPanel

=== UI CHANGES ===

7. Create `frontend/src/components/LanguageToggle.tsx`:
   - A toggle button: shows "বাংলায় দেখুন" when in English, "View in English" when in Bengali
   - Uses i18n.changeLanguage() to switch
   - Also updates the user's profile.language via PATCH /api/v1/me

8. Place the LanguageToggle on: login page, patient home, patient results page

9. Add Bengali font to `frontend/pages/_document.tsx`:
   - Google Fonts link: Noto Sans Bengali (weights 400, 500, 600, 700)
   - CSS: [lang="bn"] { font-family: 'Noto Sans Bengali', sans-serif; }

10. Store language preference in localStorage for non-authenticated users, in profiles.language for authenticated users
```

---

## Phase 3 — AI Co-pilot & Intelligent Onboarding

```
You are working on the full-stack Pedi-Growth project. Frontend is Next.js at `frontend/`, backend is FastAPI at `backend/app/`. The patient portal from Phase 2A exists.

Implement two AI-powered features:

=== FEATURE 1: "WAITING ROOM" AI CO-PILOT ===

1. Create `backend/app/routes/copilot.py`:
   - POST `/api/copilot/chat` endpoint
   - Request body: { report_id: string, message: string, session_id: string }
   - Logic:
     a. Fetch the diagnostic report data from Supabase using report_id
     b. Extract key MediaPipe metrics (trunk sway angles, knee valgus, symmetry index, etc.)
     c. Construct a system prompt: "You are a paediatric AI assistant. The parent is waiting for a doctor. You recently analyzed a video and found: [insert actual metrics]. Explain this gently. Do not give a final medical diagnosis. Answer their questions in simple terms."
     d. Use ConversationBufferMemory tied to session_id for follow-up context
     e. Call the LLM (use existing AI service configuration) and return the response
   - Register router in main.py

2. Create `frontend/src/components/patient/AICopilotChat.tsx`:
   - Floating chat widget (bottom-right corner, expandable)
   - Chat UI: message bubbles (user on right in cyan, AI on left in slate), input box at bottom, send button
   - "Typing..." indicator with animated dots
   - Initial greeting auto-sent when component mounts: "Hi, I'm the Pedi-Growth AI. I noticed some patterns in your child's walking analysis. Do you have any questions while we connect you with a specialist?"
   - Calls POST /api/copilot/chat with the report_id from the current results page

3. Place <AICopilotChat /> on:
   - `/patient/results/[id]` — automatically opens if severity is "concern"
   - Triggered when user clicks "Consult Specialist Now"

=== FEATURE 2: INTELLIGENT ONBOARDING WALKTHROUGH ===

4. Install react-joyride: `npm install react-joyride`

5. Create `frontend/src/components/walkthrough/PatientOnboarding.tsx`:
   - Steps:
     - Step 1 (target: dashboard welcome): "Welcome to Pedi-Growth! This is your dashboard where you can track your child's progress."
     - Step 2 (target: record video button): "To begin, tap here. You'll need your smartphone camera."
     - Step 3 (target: upload area): "Make sure the room is well-lit. Record your child walking towards the camera for at least 5 seconds."
   - Style tooltips as friendly chat bubbles with the Pedi-Growth cyan theme
   - Use primaryColor: '#0ea5e9' (cyan-500)
   - Show only on first login (check localStorage flag 'onboarding_completed')
   - "Skip" and "Next" buttons

6. Include <PatientOnboarding /> on the patient home page, only when `localStorage.getItem('onboarding_completed')` is not set
```

---

## Phase 3A — Consultation Scheduling System

```
You are working on the full-stack Pedi-Growth project. Frontend is Next.js at `frontend/`, backend is FastAPI at `backend/app/`. The database has `doctor_availability` and `appointments` tables from Phase 0A. The patient results page has a "Consult a Doctor" CTA.

Build the scheduling system:

=== BACKEND ===

1. Create `backend/app/routes/scheduling.py`:

   a. GET `/api/v1/scheduling/clinicians`:
      - Returns list of clinicians with availability (from doctor_availability table)
      - Each clinician: {id, display_name, available_days}

   b. GET `/api/v1/scheduling/available-slots?doctor_id={id}&date={YYYY-MM-DD}`:
      - Check the doctor's availability for that day_of_week
      - Get existing appointments for that doctor on that date
      - Calculate 30-minute slots from start_time to end_time
      - Remove slots that overlap with existing appointments
      - Return: [{start_time, end_time, available: boolean}]

   c. POST `/api/v1/scheduling/book`:
      - Body: {patient_id, clinician_id, job_id, appointment_date, start_time, end_time}
      - Insert into appointments table
      - Handle UNIQUE constraint violation (double-booking) gracefully — return 409 Conflict with "This time slot was just booked by someone else. Please select another."
      - Return the created appointment

2. Register router in main.py

=== FRONTEND ===

3. Create `frontend/pages/patient/book-consultation/[jobId].tsx`:
   - Dark theme matching patient portal
   - Header: "Schedule Consultation" with the linked report reference (date, diagnosis)

   - Step 1: Select a Doctor
     - Dropdown or card list of available clinicians
     - Show doctor name and next available date

   - Step 2: Select Date
     - Horizontal scrolling date picker (next 14 days)
     - Large rounded date cards, disabled days where doctor is unavailable
     - Today highlighted

   - Step 3: Select Time
     - Grid of 30-minute time slot buttons (large, rounded, min 48px height for mobile)
     - Available: cyan-500 outline, clickable
     - Booked/Clashing: grayed out, disabled, shows "Booked" label
     - Selected: filled cyan-500 bg

   - Confirm button: "✅ Confirm Appointment"
   - Success modal: "Your appointment is confirmed! [Date, Time, Doctor]. You will receive a notification reminder."

   - Mobile-first: all touch targets minimum 44px, horizontal scrolling for dates, clean spacing
```

---

## Phase 3B — Global Admin Portal

```
You are working on the Next.js frontend at `frontend/`. Auth and ProtectedRoute from Phase 0C exist. Backend auth middleware supports admin role.

Build the admin portal:

1. Create `frontend/src/components/AdminLayout.tsx`:
   - Similar to ClinicianLayout but distinct branding: "Admin Control Center"
   - Sidebar: dark slate-950 bg, red/orange accent instead of cyan for admin identity
   - Nav items: 📊 Dashboard, 👥 Manage Users, 🏥 Patient Registry, 📅 All Consultations

2. Create `frontend/pages/admin/dashboard.tsx`:
   - 4 stat cards across the top: Total Patients (count), Active Clinicians (count), Total Scans (count), System Uptime (percentage)
   - System Health & API Metrics chart (line chart showing requests/day over last 7 days — mock data is fine)
   - Quick Actions: "Add New Clinician" button, "Global Patient Registry" link, "View All Consultations" link

3. Create `frontend/pages/admin/users.tsx`:
   - Table of all users with columns: Name, Email/Phone, Role (badge), Status (Active/Disabled), Last Login, Actions
   - Actions dropdown per user: View Profile, Elevate to Admin, Reset Password, Disable Account
   - Search bar at top + filter by role (All, Clinician, Patient, Admin)

4. Create `frontend/pages/admin/patients/new.tsx`:
   - Form: Patient Name, Phone Number, Assign to Clinician (dropdown), Clinical Notes
   - "Create Patient" button — calls backend to create patient + profile
   - Admin can trigger an analysis upload on behalf of any patient

5. All pages wrap in <AdminLayout> and <ProtectedRoute allowedRoles={['admin']}>
6. Use dark theme with red-500/orange-500 accent color to distinguish from clinician portal

For backend: Ensure all admin endpoints use require_role('admin') dependency.
```

---

## Summary of Prompt Usage

| Phase | Prompt # | Dependencies |
|-------|---------|--------------|
| 0A | 1 | None |
| 0B | 2 | Phase 0A |
| 0C | 3 | Phase 0B |
| 1A | 4 | Phase 0C (parallel OK) |
| 1B | 5 | Phase 1A |
| 1C | 6 | Phase 0C + 1B |
| 2A | 7 | Phase 1C |
| 2B | 8 | Phase 2A |
| 3  | 9 | Phase 2A |
| 3A | 10 | Phase 2A + 0A |
| 3B | 11 | Phase 0B |
