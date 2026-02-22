# LLM Agent Setup Guide — Pedi-Growth

> **This file is designed for LLM agents (Claude, Gemini, GPT, etc.) to immediately understand and set up this project.**
> Read this file FIRST before making any changes to the codebase.

---

## STOP — Read This First

This is a **full-stack medical screening application** with:
- **Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS (port 3000)
- **Backend**: FastAPI + Python 3.10+ (port 8000)
- **Database**: Supabase (hosted PostgreSQL)
- **ML Engine**: MediaPipe Pose Landmarker (local inference)
- **AI Summary**: OpenRouter API (LLM-powered clinical explanation)
- **Video Processing**: OpenCV + ffmpeg

The frontend proxies `/api/*` requests to the backend via Next.js rewrites.

---

## Prerequisites Checklist

Before running ANYTHING, verify ALL of these exist:

```bash
# Run these checks:
python3 --version    # Need ≥ 3.10
node --version       # Need ≥ 18
npm --version        # Need ≥ 9
ffmpeg -version      # Need ≥ 4 (CRITICAL for video playback)
```

If any are missing:
```bash
# Ubuntu/Debian:
sudo apt update && sudo apt install -y python3 python3-venv python3-pip nodejs npm ffmpeg

# macOS:
brew install python node ffmpeg
```

---

## Setup Steps (Execute in Order)

### 1. Python Virtual Environment
```bash
cd <PROJECT_ROOT>              # The directory containing this file
python3 -m venv venv
source venv/bin/activate       # Linux/Mac
# .\venv\Scripts\activate      # Windows
pip install -r backend/requirements.txt
```

### 2. Node.js Dependencies
```bash
npm install                    # Root level (installs concurrently)
cd frontend && npm install     # Frontend packages
cd ..
```

### 3. Environment Variables
The `.env` file must exist at the project root. If missing:
```bash
cp .env.example .env
```

**Required variables** (ask the user for these):
```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_KEY=<anon-key>
```

**Optional** (for AI summary feature):
```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-3.1-pro-preview
```

### 4. MediaPipe Model
Check if model exists:
```bash
ls models/pose_landmarker_heavy.task
```
If missing, the user must download it from:
https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models

### 5. Supabase Database Tables
The database needs three tables: `patients`, `jobs`, `results`. 
Run the SQL from `README.md` → "Supabase Database Setup" section in the Supabase SQL Editor.

### 6. Start the Application
```bash
npm run dev
```
This runs both servers. Verify:
- Frontend: http://localhost:3000
- Backend health: `curl http://localhost:8000/health`

---

## Key Files to Know

| What | File | Purpose |
|------|------|---------|
| **Backend entry** | `backend/app/main.py` | FastAPI app, CORS, static files, routers |
| **Config** | `backend/app/config.py` | Loads `.env`, defines paths |
| **DB client** | `backend/app/dependencies.py` | Supabase client singleton |
| **Job processing** | `backend/app/services/processor.py` | Background task: video → analysis → save |
| **ML engine** | `backend/app/engine/scanner.py` | MediaPipe pose detection + video output |
| **AI summary** | `backend/app/routes/ai_summary.py` | OpenRouter LLM call for clinical summary |
| **API client** | `frontend/src/services/api.ts` | All frontend→backend API calls |
| **Results page** | `frontend/pages/results/[id].tsx` | Main results display page |
| **Home page** | `frontend/pages/index.tsx` | Upload form + job history |
| **Types** | `frontend/src/types/index.ts` | TypeScript interfaces (match backend schemas) |
| **API proxy** | `frontend/next.config.js` | Rewrites `/api/*` → `localhost:8000` |

---

## API Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/health` | — | `{ status, service, timestamp }` |
| `POST` | `/api/v1/upload` | `multipart/form-data: file` | `{ filename, size_mb }` |
| `POST` | `/api/v1/jobs` | `{ patient: { patient_id, patient_name?, age?, notes? }, video_filename }` | `{ job_id, status, message }` |
| `GET` | `/api/v1/jobs/{id}` | — | Job object with nested `results` |
| `GET` | `/api/v1/jobs` | `?status=&limit=` | Array of jobs |
| `DELETE` | `/api/v1/jobs/{id}` | — | `{ message }` |
| `POST` | `/api/v1/summary/{id}` | — | AI summary JSON |

---

## Database Schema (Supabase)

```
patients
├── id: UUID (PK)
├── patient_id: TEXT (UNIQUE) ← user-facing identifier
├── patient_name: TEXT
├── age: INT (0-18)
├── notes: TEXT
└── created_at: TIMESTAMPTZ

jobs
├── id: UUID (PK)
├── patient_ref: UUID (FK → patients.id, CASCADE)
├── status: TEXT ('queued' | 'processing' | 'completed' | 'failed')
├── progress: FLOAT (0.0 → 1.0)
├── video_filename: TEXT
├── error_message: TEXT
├── created_at: TIMESTAMPTZ
└── completed_at: TIMESTAMPTZ

results (one-to-one with jobs)
├── id: UUID (PK)
├── job_id: UUID (FK → jobs.id, UNIQUE, CASCADE)
├── left_max_flexion, left_min_flexion, left_rom: FLOAT
├── right_max_flexion, right_min_flexion, right_rom: FLOAT
├── symmetry_index: FLOAT
├── asymmetry_percentage: FLOAT
├── diagnosis: TEXT ('normal' | 'high_risk' | 'insufficient_data')
├── is_high_risk: BOOLEAN
├── confidence: FLOAT
├── detection_rate: FLOAT
├── frames_processed, frames_detected: INT
├── left_angle_series, right_angle_series: JSONB
└── created_at: TIMESTAMPTZ
```

---

## Processing Pipeline

```
Upload Video → Validate (3-60s, ≥240p, ≤100MB)
    → MediaPipe Pose Landmarker (per-frame)
        → Extract left/right knee angles
        → Blur face for privacy
        → Draw skeleton overlay
    → Write temp AVI → ffmpeg → browser-compatible MP4 (H.264 + faststart)
    → Signal processing: interpolate zeros → IQR outlier removal → Savitzky-Golay smoothing
    → Calculate: ROM, Symmetry Index, Asymmetry %, detection rate
    → Diagnose: SI < 0.85 or > 1.15 → HIGH_RISK; detection < 50% → INSUFFICIENT_DATA
    → Save results to Supabase
```

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| App crashes on start | Missing `.env` | `cp .env.example .env` and fill in Supabase creds |
| "model not found" | Missing MediaPipe model | Download to `models/` directory |
| Video shows "No supported MIME type" | Missing ffmpeg | `sudo apt install ffmpeg` |
| Frontend API errors | Backend not running | Run `npm run dev` from project root |
| AI Summary fails | Missing OpenRouter key | Add `OPENROUTER_API_KEY` to `.env` |

---

## Runtime Directories (Auto-created)

- `uploads/` — Raw uploaded videos (gitignored)
- `results/` — Processed videos with skeleton overlay (gitignored)
- `venv/` — Python virtual environment (gitignored)
