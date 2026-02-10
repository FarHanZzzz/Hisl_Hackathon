# Pedi-Growth — LLM Execution Prompts (Phases 2–5)

> **How to use**: Copy-paste each prompt into a new LLM session when you're ready
> to execute that phase. Each prompt is self-contained with all context needed.
> Execute in order — each phase depends on the previous one completing.

---

## PROMPT 1: Phase 2 — Core Engine (DO THIS FIRST)

```
You are working on the Pedi-Growth project at d:\Hisl_hackathon_project\.

CONTEXT:
- Phase 1 is COMPLETE. The backend is restructured into backend/app/ with:
  - backend/app/config.py (env config)
  - backend/app/schemas.py (Pydantic models — 300 lines)
  - backend/app/utils.py (old utilities — will be superseded)
  - backend/app/engine/scanner.py (GaitScanner class + process_video — 286 lines)
  - backend/app/main.py (FastAPI app with inline routes — 263 lines)
  - backend/requirements.txt (all Python deps including scipy)
- Models exist at: models/pose_landmarker_heavy.task

YOUR TASK — Phase 2: Create 3 new engine files + update scanner.py

IMPORTANT REFERENCES TO READ FIRST:
1. motherplan/phase2_core_engine.md — Contains COMPLETE code for all 3 files
2. PROGRAM_DOC/research_digest.md — Contains clinical thresholds and signal processing params
3. backend/app/engine/scanner.py — Current source of truth for GaitScanner

FILE 1: backend/app/engine/video.py
- Video validation (duration 3-60s, resolution ≥480p, fps check)
- Returns dict with: valid, duration, resolution, fps, frames, errors
- Full code is in phase2_core_engine.md §2.2

FILE 2: backend/app/engine/smoothing.py
- Pipeline: interpolate_zeros → remove_outliers_iqr → smooth (Savitzky-Golay or moving avg)
- Main entry point: smooth_angles(data, method="savgol")
- Uses scipy.signal.savgol_filter with numpy fallback
- FROM RESEARCH: Recommend 4th-order Butterworth at 6 Hz — implement as upgrade option
- Full code is in phase2_core_engine.md §2.3

FILE 3: backend/app/engine/analysis.py
- NEW SI formula: SI = ROM_left / ROM_right (preserves directionality)
- Thresholds: SI < 0.85 = right-dominant, SI > 1.15 = left-dominant
- Functions: calculate_rom, calculate_symmetry_index, calculate_asymmetry,
  calculate_confidence, get_diagnosis
- Import DiagnosisResult, DiagnosisInfo from backend.app.schemas
- Full code is in phase2_core_engine.md §2.4

FILE 4: UPDATE backend/app/engine/__init__.py
- Export: GaitScanner, smooth_angles, validate_video, calculate_symmetry_index,
  calculate_rom, calculate_asymmetry, calculate_confidence, get_diagnosis

FILE 5: UPDATE backend/app/engine/scanner.py
- In process_video(), AFTER collecting raw angles:
  1. Call validate_video() before processing
  2. Call smooth_angles() on raw left/right angle arrays
  3. Call calculate_rom() on smoothed arrays
  4. Call calculate_symmetry_index() with ROM values
  5. Call get_diagnosis() for final result
- Update imports to use from .analysis import ... and from .smoothing import ...

VERIFICATION — Run these after all files are created:
python -c "from backend.app.engine.video import validate_video; print(validate_video('nonexistent.mp4'))"
python -c "from backend.app.engine.smoothing import smooth_angles; print(smooth_angles([0,150,152,0,148,155,0,151]))"
python -c "from backend.app.engine.analysis import calculate_symmetry_index; print(calculate_symmetry_index(20.0, 10.0))"
python -c "from backend.app.engine.analysis import get_diagnosis; print(get_diagnosis(0.70, 90).result)"

All 4 commands must succeed without errors.
```

---

## PROMPT 2: Phase 3 — Backend API + Supabase

```
You are working on the Pedi-Growth project at d:\Hisl_hackathon_project\.

CONTEXT:
- Phase 2 is COMPLETE. The engine now has:
  - backend/app/engine/scanner.py (GaitScanner + process_video with smoothing pipeline)
  - backend/app/engine/analysis.py (SI formula, diagnosis logic)
  - backend/app/engine/smoothing.py (signal processing)
  - backend/app/engine/video.py (validation)
- backend/app/main.py currently has ALL routes inline and uses an in-memory jobs_store dict
- Supabase is configured: tables (patients, jobs, results) exist with RLS
- Credentials in .env: SUPABASE_URL, SUPABASE_KEY

YOUR TASK — Phase 3: Split routes, add Supabase persistence

IMPORTANT REFERENCES TO READ FIRST:
1. motherplan/phase3_backend.md — Complete code for all files
2. backend/app/main.py — Current source of truth (inline routes to extract)
3. backend/app/config.py — Already loads SUPABASE_URL and SUPABASE_KEY

FILE 1: backend/app/dependencies.py
- Supabase client singleton using @lru_cache
- Function: get_supabase() -> Client
- Uses config.SUPABASE_URL and config.SUPABASE_KEY

FILE 2: backend/app/services/database.py
- Classes: PatientService, JobService, ResultService
- Each takes supabase client in __init__
- PatientService: get_or_create(patient_id, name, age, notes)
- JobService: create(patient_ref, video_filename), update_status(), get(), list_all()
- ResultService: create(job_id, metrics_dict), get_by_job()

FILE 3: backend/app/routes/health.py
- Extract GET /health from main.py
- APIRouter(prefix="", tags=["health"])

FILE 4: backend/app/routes/upload.py
- Extract POST /api/v1/upload from main.py
- APIRouter(prefix="/api/v1", tags=["upload"])
- Keep file validation logic (extension, size check)

FILE 5: backend/app/routes/jobs.py
- Extract all job endpoints from main.py
- POST /api/v1/jobs — creates patient + job in Supabase, queues processing
- GET /api/v1/jobs/{id} — reads from Supabase
- GET /api/v1/jobs — lists from Supabase
- DELETE /api/v1/jobs/{id} — deletes from Supabase
- Background task: calls process_video() then writes results to Supabase

FILE 6: UPDATE backend/app/routes/__init__.py
- Empty or import routers

FILE 7: UPDATE backend/app/main.py
- Remove ALL inline route logic
- Import and include routers: health.router, upload.router, jobs.router
- Keep CORS middleware and static file mounting

VERIFICATION:
1. Start server: uvicorn backend.app.main:app --port 8000 --reload
2. Test health: curl http://localhost:8000/health → {"status": "healthy"}
3. Test upload: Upload a small MP4 via /api/v1/upload
4. Test job: POST /api/v1/jobs with patient info → check job appears in Supabase dashboard
5. Verify: Job transitions queued → processing → completed in Supabase
```

---

## PROMPT 3: Stitch UI Generation (CAN RUN PARALLEL TO PHASE 2-3)

```
You are working on the Pedi-Growth project at d:\Hisl_hackathon_project\.

YOUR TASK: Generate UI screens using the Stitch MCP server.

IMPORTANT REFERENCE: Read PROGRAM_DOC/stitch_ui_guide.md — it has exact prompts for 5 screens.

STEP 1: Create a Stitch project
- Call mcp_stitch_create_project with title: "Pedi-Growth Gait Analysis"
- Save the projectId

STEP 2: Generate screens (one at a time, each takes ~2 min)
Use mcp_stitch_generate_screen_from_text with deviceType: "DESKTOP"

Generate in this order:
1. Home Page — Upload + Patient Form (prompt in stitch_ui_guide.md §Screen 1)
2. Results Dashboard — Normal result (prompt in §Screen 3)
3. Results Dashboard — High Risk result (prompt in §Screen 4)
4. Processing State — Modal overlay (prompt in §Screen 2)
5. Mobile View — Responsive home (deviceType: "MOBILE", prompt in §Screen 5)

STEP 3: After each generation
- Call mcp_stitch_get_screen to retrieve the generated code
- Save each screen's code to a temporary file for Phase 4 integration
- Note the design tokens (colors, fonts, spacing) for consistency

DO NOT integrate into the frontend yet — that's Phase 4.
Just generate and save the outputs.
```

---

## PROMPT 4: Phase 4 — Frontend Dashboard

```
You are working on the Pedi-Growth project at d:\Hisl_hackathon_project\.

CONTEXT:
- Phase 3 is COMPLETE. Backend API works with Supabase persistence.
- API endpoints: /health, /api/v1/upload, /api/v1/jobs (CRUD)
- Stitch screens have been generated (design reference)
- Frontend exists at frontend/ with Next.js + TailwindCSS + TypeScript
- Current frontend/pages/index.tsx is a working but basic upload page (382 lines)

YOUR TASK — Phase 4: Build modern dashboard from Stitch designs

IMPORTANT REFERENCES TO READ FIRST:
1. motherplan/phase4_frontend.md — Complete component specs
2. PROGRAM_DOC/stitch_ui_guide.md — Design tokens and component descriptions
3. frontend/pages/index.tsx — Current working page (preserve functionality)

STEP 1: Create TypeScript types
- frontend/src/types/index.ts
- Match backend schemas: PatientInfo, JobResponse, AnalysisResult, DiagnosisInfo
- Keep in sync with backend/app/schemas.py

STEP 2: Create API service
- frontend/src/services/api.ts
- Axios client with base URL from NEXT_PUBLIC_API_URL
- Functions: uploadVideo(), createJob(), getJob(), listJobs(), deleteJob()

STEP 3: Create hooks
- frontend/src/hooks/useUpload.ts — file upload with progress
- frontend/src/hooks/useJob.ts — job polling (GET every 1s until completed/failed)

STEP 4: Create components (adapt from Stitch output)
- frontend/src/components/Layout.tsx — Page shell
- frontend/src/components/UploadForm.tsx — Patient form + drag-and-drop
- frontend/src/components/ProgressBar.tsx — Processing overlay
- frontend/src/components/DiagnosisBanner.tsx — Normal/High Risk/Insufficient banner
- frontend/src/components/MetricCard.tsx — Single metric display
- frontend/src/components/AngleChart.tsx — Recharts left vs right time series
- frontend/src/components/JobHistoryTable.tsx — Past analyses table

STEP 5: Update pages
- pages/index.tsx — Home with UploadForm + JobHistoryTable
- pages/results/[id].tsx — Full results with DiagnosisBanner + MetricCards + AngleChart

DESIGN TOKENS (from Stitch guide):
- Primary: #3B82F6 (blue), Success: #10B981 (green), Danger: #EF4444 (red)
- Font: 'Inter', sans-serif
- Card padding: 1.5rem, border-radius: 0.75rem

MANDATORY UI ELEMENTS (from research_digest.md):
- Footer disclaimer: "This tool does not provide medical diagnoses."
- Alert box on HIGH_RISK results: "Please refer for specialist evaluation."
- Detection rate and confidence visible on all results
- Use "movement tracking" language, NOT "screening" or "diagnosis"

VERIFICATION:
1. npm run dev → loads at localhost:3000 without errors
2. Upload page renders with form + drag-drop zone
3. After analysis, results page shows metrics + chart + diagnosis banner
4. Mobile responsive (test at 375px width)
```

---

## PROMPT 5: Phase 5 — Testing & Deployment

```
You are working on the Pedi-Growth project at d:\Hisl_hackathon_project\.

CONTEXT:
- All phases 1-4 are COMPLETE. App works end-to-end.
- Backend: FastAPI with Supabase persistence, engine with smoothing + analysis
- Frontend: Next.js with components, hooks, API client

YOUR TASK — Phase 5: Add tests + deploy

IMPORTANT REFERENCE: motherplan/phase5_deployment.md — Complete test code

STEP 1: Create test suite
- tests/__init__.py
- tests/conftest.py — Fixtures (sample angles, mock Supabase)
- tests/test_analysis.py — 15+ tests for analysis.py (ROM, SI, confidence, diagnosis)
- tests/test_smoothing.py — Tests for smoothing pipeline
- tests/test_api.py — FastAPI TestClient tests (health, upload, jobs)
- Full test code is in phase5_deployment.md §5.2-5.5

STEP 2: Run tests
- pip install pytest pytest-asyncio httpx
- pytest tests/ -v -k "not integration"
- All must pass

STEP 3: Vercel deployment
- Create frontend/vercel.json
- Set root directory to "frontend"
- Add NEXT_PUBLIC_API_URL env var
- Deploy

STEP 4: CI/CD (optional)
- .github/workflows/test.yml
- Run Python tests + TypeScript check on push to main

VERIFICATION:
- pytest tests/ -v → all green
- Frontend deployed on Vercel and accessible
- API responds correctly from deployed frontend
```

---

## Execution Checklist

| # | Prompt | When | Depends On |
|---|---|---|---|
| **1** | Phase 2: Core Engine | **NOW** | Phase 1 ✅ |
| **2** | Phase 3: Backend API | After Prompt 1 passes verification | Prompt 1 |
| **3** | Stitch UI Generation | **Anytime** (parallel OK) | Nothing |
| **4** | Phase 4: Frontend | After Prompts 2 + 3 both done | Prompts 2 & 3 |
| **5** | Phase 5: Tests + Deploy | After Prompt 4 | Prompt 4 |
