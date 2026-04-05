# Phase 1C: Clinician Portal Pages

## Goal
Build the clinician-facing pages that handle patient management, analysis creation, and now **consultation appointments**.

## Dependencies
- Phase 0C (auth + ProtectedRoute)
- Phase 1B (tabbed report exists)

---

## What Gets Created

### Page 1: `/clinician/dashboard` — Overview & Quick Stats
Displays welcome, quick stats, recent activity, and **Upcoming Consultations** for the day.

### Page 2: `/clinician/patients` and `/clinician/patients/[patientId]`
Patient registry and single patient profile showing longitudinal history.

### Page 3: `/clinician/analysis/new`
Dedicated page for uploading or recording videos for clinical ingestion.

### Page 4: `/clinician/appointments` — Consultations Management
**File:** `pages/clinician/appointments.tsx`
**Purpose:** A calendar/list view where the clinician manages their schedule.

```
┌─────────────────────────────────────────────────────────────────┐
│ My Schedule & Consultations                                      │
│                                                                   │
│ ┌──────────────────┐  ┌───────────────────────────────────────┐ │
│ │  Availability    │  │ Upcoming Appointments                 │ │
│ │  Set your working│  │                                       │ │
│ │  hours:          │  │ Today:                                │ │
│ │  Mon: 9AM - 5PM  │  │ 10:00 AM - Rahim (High Risk)  [Join]  │ │
│ │  Tue: 9AM - 5PM  │  │ 02:00 PM - Fatima (Normal)    [Join]  │ │
│ │  [Edit Hours]    │  │                                       │ │
│ │                  │  │ Tomorrow:                             │ │
│ │                  │  │ 09:30 AM - Karim (DMD Risk)   [Link]  │ │
│ └──────────────────┘  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```
Clinicians can see when patients have booked them, review the flagged report (`job_id` linked to the appointment), and join the consultation.

### Layout Update: Sidebar Navigation
```
┌──────────┬──────────────────────────────────────────────────────┐
│ Pedi-    │  Header bar                                          │
│ Growth   │                                                      │
├──────────┤                                                      │
│          │                                                      │
│ 🏠 Dash  │     Main content area                                │
│ 👥 Pts   │     (page renders here)                              │
│ 📹 New   │                                                      │
│ 📅 Appts │ <-- NEW: Appointments page                           │
│          │                                                      │
│──────────│                                                      │
│ 👤 Dr.F  │                                                      │
│ ⚙️ Settings                                                     │
│ ↩️ Logout │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

---

### Sub-Phase 1C.1: Patient Records Search & Filter

**Problem:** The patient records page (`/clinician/patients`) has no way to quickly find a specific patient when the list grows large.

**Fix:**
- [ ] Add a **Search bar** at the top of the patient list:
  - Real-time search as you type (debounced at 300ms)
  - Searches by: patient name, patient ID, date of analysis
  - Shows "No results found" state with clear messaging
- [ ] Add a **Filter button** next to the search bar that opens a dropdown/panel with:
  - **Diagnosis filter:** Normal, High Risk, DMD Risk, All
  - **Date range filter:** Last 7 days, Last 30 days, Last 3 months, All time, Custom range
  - **Severity filter:** Low, Moderate, High, Critical
  - **Sort by:** Most Recent (default), Name A-Z, Name Z-A, Highest Risk First
- [ ] Active filters show as dismissible pill badges below the search bar (e.g., `✕ High Risk` `✕ Last 30 days`)
- [ ] Filter and search state persists during the session (doesn't reset on navigation)

---

## Exit Criteria
Clinicians can manage their available hours and view patient-booked appointments in their portal without time clashes. Patient records are searchable and filterable for quick access.
