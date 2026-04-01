# Pedi-Growth v3: Implementation Master Plan

## Locked Decisions

| Decision | Choice |
|----------|--------|
| Auth | SMS OTP (patients) + Email/Password (clinicians/admins) |
| Router | Next.js Pages Router (stay) |
| Task Queue | Keep FastAPI `BackgroundTasks` for hackathon |
| Languages | English + Bengali |
| Platform | Cross-Platform Responsive Web App (Mobile + Desktop functionality) |
| Scope | Phase 0, 1, 2, and 3 (Full Centralized System including Scheduling & Admin) |

---

## Phase Index

| Phase | Title | Goal | Files |
|-------|-------|------|-------|
| **0A** | Database Schema | Tables: profiles, sessions, patient_access, appointments | [Phase 0A](./phase_0a_database_schema.md) |
| **0B** | Backend Auth | JWT middleware, login/register endpoints | [Phase 0B](./phase_0b_backend_auth.md) |
| **0C** | Frontend Auth | AuthContext, login page, ProtectedRoute | [Phase 0C](./phase_0c_frontend_auth.md) |
| **1A** | Component Extraction | Pull 5 inline components out of the 1128-line results page | [Phase 1A](./phase_1a_component_extraction.md) |
| **1B** | Tabbed Report | Build ReportTabs + 4-tab segmented clinical report | [Phase 1B](./phase_1b_tabbed_report.md) |
| **1C** | Clinician Pages | Dashboard, Patients, Analysis, Appointments, Layout sidebar | [Phase 1C](./phase_1c_clinician_pages.md) |
| **2A** | Patient Portal UI | Mobile-first capture (with demo), results (with Doctor Consult CTA) | [Phase 2A](./phase_2a_patient_portal_ui.md) |
| **2B** | Bengali + LLM | i18n setup, LLM summary in Bengali | [Phase 2B](./phase_2b_bengali_llm.md) |
| **3A** | Scheduling System | Consultation booking flow (date/time slot picker to avoid clash) | [Phase 3A](./phase_3a_scheduling_system.md) |
| **3B** | Admin Portal | Omnipotent portal to manage users, patients, system metrics | [Phase 3B](./phase_3b_admin_portal.md) |

---

## Execution Order

```
Phase 0A → 0B → 0C → 1A → 1B → 1C → 2A → 2B → 3A → 3B
```

Each phase builds on the previous one. No phase can be started until its dependencies are complete.
