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

## Exit Criteria
Clinicians can manage their available hours and view patient-booked appointments in their portal without time clashes.
