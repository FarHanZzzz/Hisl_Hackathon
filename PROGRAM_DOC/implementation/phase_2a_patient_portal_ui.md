# Phase 2A: Patient Portal UI

## Goal
Build the robust, centralized **cross-platform** patient portal. It must be mobile-first for accessibility but fully responsive and functional on desktop browsers. Includes an interactive demo for capturing video and a seamless bridge to book a doctor consultation directly from the results page.

## Design Principles
1. Beautiful, feasible, premium UI that feels trustworthy on **both mobile phones and desktop computers**.
2. Mobile-first UX (Progressive Web App style), offline-resilient upload.
3. No clinical jargon. Completely understandable for parents.

---

## What Gets Created

### Page 1: `/patient/login` & `/patient/home`
SMS OTP login and a simple dashboard.

---

### Page 2: `/patient/capture` — Video Capture with DEMO
**File:** `pages/patient/capture.tsx`
**New Feature:** A built-in instructional demo showing *how* to record the gait.

```
┌────────────────────────────┐
│ Record Gait Video          │
│                            │
│ ┌────────────────────────┐ │
│ │ ▶ WATCH HOW TO RECORD  │ │ <-- Short looping GIF or video demo
│ │   Shows a child walking│ │     sideways across the frame.
│ │   2 meters away.       │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │    ┌─── camera ───┐    │ │
│ │    │  🚶 overlay  │    │ │
│ │    └──────────────┘    │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │   🔴 Start Recording   │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

---

### Page 3: `/patient/upload`
Progressive, chunked upload.

---

### Page 4: `/patient/results/[id]` — Plain-Language Results + Booking CTA
**File:** `pages/patient/results/[id].tsx`

If the result is dire (e.g., High Risk, DMD Risk) or the parent is concerned, they can book a doctor immediately.

```
┌────────────────────────────┐
│ Results for Rahim          │
│                            │
│ ┌────────────────────────┐ │
│ │ 🔴 Needs Attention      │ │
│ │ Your child favors their │ │
│ │ right leg significantly.│ │
│ └────────────────────────┘ │
│                            │
│ This pattern often benefits│
│ from a physical therapist's│
│ assessment.                │
│                            │
│ ┌────────────────────────┐ │
│ │ 👨‍⚕️ Consult a Doctor    │ │ <-- Prominent Call to Action
│ │   Schedule an online   │ │     if severity is 'concern'
│ │   appointment now.     │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

If they click **Consult a Doctor**, they are taken to the Scheduling Flow (Phase 3A).

## Exit Criteria
Parents understand *exactly* how to record the video via the demo overlay, and have a clear, immediate action to book a doctor if the report indicates a problem.
