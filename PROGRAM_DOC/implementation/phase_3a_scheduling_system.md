# Phase 3A: Consultation Scheduling System

## Goal
Provide a frictionless, clash-free appointment booking system triggered from the Patient Portal, connecting rural patients directly with available clinicians.

## Dependencies
- Phase 2A (Patient Results page with "Consult a Doctor" CTA)
- Phase 0A (Appointments database schema)

## How It Works (The Centralized Flow)

1. Parent views a concerning report on mobile.
2. Parent taps **"Consult a Doctor"**.
3. Mobile app queries available clinicians and their open time slots.
4. Parent selects a Date and Time.
5. System locks that time slot globally (preventing double booking / time clashes).
6. Clinician sees the appointment on their dashboard (`/clinician/appointments`).

## What Gets Created

### Page 1: `/patient/book-consultation/[jobId]`
**File:** `pages/patient/book-consultation/[jobId].tsx`

```
┌────────────────────────────┐
│ Schedule Consultation      │
│                            │
│ Report: Apr 1 (Needs Attn) │
│                            │
│ Step 1: Select a Doctor    │
│ [ Dr. Hasan (Available) ▼] │
│                            │
│ Step 2: Select Date        │
│ [ THU, Apr 4 ] [ FRI, Apr 5]│
│                            │
│ Step 3: Select Time        │
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │10:00│ │11:30│ │02:00│    │
│ │ AM  │ │ AM  │ │ PM  │    │
│ └─────┘ └─────┘ └─────┘    │
│  (Clashing times grayed out)│
│                            │
│ ┌────────────────────────┐ │
│ │ ✅ Confirm Appointment  │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

### Backend Endpoints
- `GET /api/v1/scheduling/available-slots?doctor_id=123&date=YYYY-MM-DD`
  - Calculates slots by overlapping `doctor_availability` with existing `appointments`.
- `POST /api/v1/scheduling/book`
  - Creates the appointment. Handles race conditions using PostgreSQL unique constraints (`UNIQUE(clinician_id, appointment_date, start_time)`).

## UX Considerations
- The UI must be highly attractive and easy to tap on mobile.
- Use horizontal scrolling for dates and cleanly separated, large rounded buttons for time slots.
- Show localized timezone info clearly if applicable (though prioritizing Bangladesh local time).

## Exit Criteria
A patient can successfully book an appointment, and a clinician cannot be double-booked for the exact same time slot.
