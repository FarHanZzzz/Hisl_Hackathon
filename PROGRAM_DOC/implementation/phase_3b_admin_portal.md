# Phase 3B: Global Admin Portal

## Goal
Build an omnipotent Admin Portal that can access every feature, manage all users (Clinicians and Patients), oversee all hardware/software analytics, and manually add/manage patients when necessary.

## Dependencies
- Phase 0B (Auth middleware must support `admin` role)

## Design Principles
This is the "Control Center." It should be data-heavy, powerful, and clean.

## What Gets Created

### Page 1: `/admin/dashboard` — System Overview
**File:** `pages/admin/dashboard.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin Control Center                      [ + Add New Clinician] │
│                                                                   │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│ │ 1,204    │  │ 45       │  │ 8,932    │  │ 99.9%    │         │
│ │ Total    │  │ Clinicians│  │ Total    │  │ Sys Uptime│         │
│ │ Patients │  │          │  │ Scans    │  │          │         │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                   │
│ System Health & API Metrics (Graph)                               │
│ [██████████████████████████████████████████████████████████]      │
│                                                                   │
│ Quick Actions:                                                    │
│ [ Manage Users ]   [ Global Patient Registry ]  [ Consultations ] │
└─────────────────────────────────────────────────────────────────┘
```

### Page 2: `/admin/users` — Role Management
**File:** `pages/admin/users.tsx`
- View all Clinicians and Patients.
- Elevate users to Admin.
- Reset passwords / Disable accounts.

### Page 3: `/admin/patients/new` — Omnipotent Patient Creation
**File:** `pages/admin/patients/new.tsx`
- Allows the Admin to add a new patient directly into the system without requiring the patient to do it via mobile.
- Admins can assign a patient to a specific Clinician.
- Admins can trigger analysis on behalf of any patient.

### Security / Middleware
```python
# Backend Enforcement
def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
```

Frontend Enforcement:
```tsx
<ProtectedRoute allowedRoles={['admin']}>
   <AdminDashboard />
</ProtectedRoute>
```

## Exit Criteria
An admin can log in, view system-wide stats, create a patient account manually, and assign that patient to a clinician. The admin portal is strictly protected and visually distinct from the clinician and patient portals.
