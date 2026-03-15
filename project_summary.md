# Pedi-Growth Project Summary (For LLM Agents)

This document is designed to give any AI assistant or LLM a complete, immediately actionable understanding of the Pedi-Growth project codebase, architecture, and current state.

---

## 1. Core Concept & Hackathon Context
Pedi-Growth is a **local-first clinical screening tool** built for a hackathon. The narrative context is a triage tool for community health workers in resource-constrained settings (e.g., Bangladesh) to early-detect Cerebral Palsy and developmental delays from simple smartphone videos.

### Key Constraints & Philosophies:
- **No Cloud Inference**: All video processing and computer vision (MediaPipe) MUST run locally.
- **Privacy First**: Faces are blurred locally before any data is saved.
- **Asynchronous Flow**: Video processing is heavy, so it's decoupled using background tasks rather than blocking the API.

---

## 2. Architecture & Tech Stack
The project uses a split Service Architecture:

1.  **Frontend (Next.js 14, React 18, TailwindCSS, TypeScript)**
    - Runs on port `3000`.
    - Handles UI, uploads, polling for job status, and displaying charts/metrics (using Recharts).
    - **Crucial Detail**: It proxies all `/api/*` requests to the backend via `next.config.js` rewrites. There are NO Next.js API routes (`pages/api` is not used for backend logic).
2.  **Backend (Python 3.10+, FastAPI, OpenCV, MediaPipe)**
    - Runs on port `8000`.
    - Receives video uploads, queues them, processes frames using MediaPipe Pose Landmarker, calculates knee angles and clinical metrics, and serves static files (the processed videos).
    - Generates AI clinical summaries via OpenRouter (if configured).
3.  **Database (Supabase / PostgreSQL)**
    - Used via the Supabase Python Client.
    - Stores metadata only. Video files live on the local disk (`uploads/` and `results/`).

---

## 3. Database Schema (Supabase)
Three primary tables linked via foreign keys:
1.  **`patients`**: `id` (UUID pk), `patient_id` (User-friendly ID, unique), `patient_name`, `age`, `notes`.
2.  **`jobs`**: `id` (UUID pk), `patient_ref` (FK to `patients`), `status` (queued, processing, completed, failed), `progress`, `video_filename`, `error_message`.
3.  **`results`**: `id` (UUID pk), `job_id` (FK to `jobs`), plus all calculated metrics (`left_max_flexion`, `symmetry_index`, `diagnosis`, `detection_rate`, `left_angle_series` as JSONB, etc.).

---

## 4. End-to-End Data Flow (The Processing Pipeline)
When a user uploads a video, here is the exact execution path:

1.  **Upload (`backend/app/routes/upload.py`)**: The frontend `FormData` hits `POST /api/v1/upload`. The backend saves the raw video to `uploads/` and returns the generated filename.
2.  **Job Creation (`backend/app/routes/jobs.py`)**: Frontend hits `POST /api/v1/jobs` with the filename and patient details. The backend creates a DB record (status: 'queued') and fires a FastAPI `BackgroundTask`.
3.  **Background Processing (`backend/app/engine/scanner.py` & `backend/app/services/processor.py`)**:
    - The worker updates DB status to 'processing'.
    - `GaitScanner` reads the video via OpenCV.
    - **Frame Loop**: For every frame, MediaPipe extracts landmarks. Faces are blurred. Knee angles are calculated. An annotated frame is written to a temporary AVI file.
    - **Post-Processing**: ffmpeg converts the AVI to a web-compatible MP4 saved in `results/`.
4.  **Signal Analysis (`backend/app/engine/smoothing.py` & `analysis.py`)**: Raw angle arrays are cleaned (outliers removed, Savitzky-Golay filter applied). Metrics like Range of Motion (ROM) and the Symmetry Index (SI = ROM_left / ROM_right) are calculated.
5.  **Completion**: Results are saved to the `results` table. Job status is set to 'completed'.
6.  **Frontend Polling (`frontend/src/hooks/useJob.ts`)**: The UI polls `GET /api/v1/jobs/{id}` every 1 second and transitions to the results view once completed.

---

## 5. Directory Structure Guide (Where to find things)

### Backend (`/backend/app/`)
*   `main.py`: FastAPI entry point, CORS config, static route mounts.
*   `routes/`: API endpoints (`jobs.py`, `upload.py`, `ai_summary.py`).
*   `services/`: Business logic bridging routes and the engine (`database.py` for DB queries, `processor.py` for the background worker loop).
*   `engine/`: Core analysis logic.
    *   `scanner.py`: The MediaPipe OpenCV frame loop.
    *   `analysis.py`: Clinical metric formulas and diagnosis logic.
    *   `smoothing.py`: Array/signal processing maths.
    *   `video.py`: Validation checks (length, FPS) before processing begins.
*   `config.py`: Loads variables from the root `.env` file.

### Frontend (`/frontend/`)
*   `pages/index.tsx`: Main upload dashboard.
*   `pages/results/[id].tsx`: The dashboard showing charts and the processed video.
*   `src/components/`: Modular React components (`JobHistoryTable.tsx`, `AngleChart.tsx`, `VisualLocalization.tsx`).
*   `src/services/api.ts`: Axios client defining all outgoing requests to `/api/v1/*`.
*   `next.config.js`: Contains the critical rewrite rule pointing `/api/` to `localhost:8000`.

---

## 6. Recent Fixes & Current State Notes
**Recent Fix (March 2026)**:
*   **Supabase Connection Errors**: A bug was fixed where if the free-tier Supabase project is paused (DNS resolves to "Name or service not known"), the backend would crash with a generic 500 error.
*   **The Fix**: `backend/app/routes/jobs.py` now includes a `_handle_db_error()` wrapper. It catches `ConnectError` and HTTPX connection errors, returning a clean HTTP `503 Service Unavailable` with a descriptive payload telling the user to unpause their Supabase dashboard.

**How to Run**:
The root `package.json` contains a `concurrently` script. Running `npm run dev` at the project root boots both the Next.js frontend and the FastAPI backend (within its `venv`) simultaneously.
