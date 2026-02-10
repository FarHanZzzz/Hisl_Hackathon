# Pedi-Growth — Motherplan

## Quick Links

| Document | Purpose |
|----------|---------|
| [TDD.md](./TDD.md) | **Master document** — ERD, API spec, architecture |
| [phase1_foundation.md](./phase1_foundation.md) | Supabase + environment setup |
| [phase2_core_engine.md](./phase2_core_engine.md) | Video processing + metrics |
| [phase3_backend.md](./phase3_backend.md) | FastAPI + Supabase CRUD |
| [phase4_frontend.md](./phase4_frontend.md) | Next.js dashboard |
| [phase5_deployment.md](./phase5_deployment.md) | Tests + Local Dev + Vercel |

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + React + TypeScript + TailwindCSS |
| Backend | Python 3.11 + FastAPI |
| Database | Supabase (PostgreSQL) |
| Processing | MediaPipe + OpenCV |
| Deployment | Local Dev + Vercel |

---

## Phase Status

| Phase | Name | Status |
|-------|------|--------|
| TDD | Technical Design Document | ✅ Complete |
| 1 | Project Foundation | 🟡 Ready |
| 2 | Core Engine | ⬜ Pending |
| 3 | Backend API | ⬜ Pending |
| 4 | Frontend Dashboard | ⬜ Pending |
| 5 | Testing & Deployment | ⬜ Pending |

---

## Database Schema (ERD)
```
PATIENTS ||--o{ JOBS : "has many"
JOBS ||--o| RESULTS : "has one"
```

See [TDD.md](./TDD.md) for full SQL schema.
