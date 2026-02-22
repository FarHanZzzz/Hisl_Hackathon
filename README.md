# 🦿 Pedi-Growth — AI-Powered Pediatric Gait Analysis

> **Full-stack clinical screening tool** that uses computer vision (MediaPipe) to analyze walking videos of children, detect gait asymmetries, and generate AI-powered clinical summaries.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Supabase Database Setup](#supabase-database-setup)
- [MediaPipe Model Setup](#mediapipe-model-setup)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Next.js Frontend  │  proxy  │    FastAPI Backend        │
│   (Port 3000)       │────────▶│    (Port 8000)            │
│                     │ /api/*  │                          │
│  • React 18 + TS    │         │  • Video Upload          │
│  • TailwindCSS      │         │  • MediaPipe Processing  │
│  • Recharts         │         │  • OpenRouter AI Summary │
│  • Axios            │         │  • Static file serving   │
└─────────────────────┘         └───────────┬──────────────┘
                                            │
                                ┌───────────▼──────────────┐
                                │     Supabase (Postgres)  │
                                │  • patients table        │
                                │  • jobs table            │
                                │  • results table         │
                                └──────────────────────────┘
```

The frontend proxies all `/api/*` requests to the backend via Next.js rewrites (see `frontend/next.config.js`). The backend serves processed videos and uploaded files as static files at `/uploads/*` and `/results/*`.

---

## System Requirements

### MANDATORY — Install these FIRST before anything else

| Requirement | Version | Check Command | Install |
|-------------|---------|---------------|---------|
| **Python** | ≥ 3.10 | `python3 --version` | [python.org](https://www.python.org/downloads/) |
| **Node.js** | ≥ 18.x | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 9.x | `npm --version` | Comes with Node.js |
| **ffmpeg** | ≥ 4.x | `ffmpeg -version` | `sudo apt install ffmpeg` (Linux) / `brew install ffmpeg` (Mac) |
| **pip** | Latest | `pip --version` | `python3 -m ensurepip` |

### Why each is needed
- **Python 3.10+**: Backend API, computer vision engine, ML inference
- **Node.js 18+**: Frontend framework (Next.js), package management
- **ffmpeg**: Post-processing OpenCV video output into browser-compatible MP4 (H.264)
- **pip**: Installing Python dependencies

---

## Quick Start

> ⚠️ **LLM agents**: Follow these steps IN ORDER. Do NOT skip any step.

### Step 1: Clone and enter the project
```bash
cd /path/to/Hisl_Hackathon
```

### Step 2: Set up Python virtual environment
```bash
python3 -m venv venv
source venv/bin/activate       # Linux/Mac
# OR: .\venv\Scripts\activate  # Windows
```

### Step 3: Install Python dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 4: Install Node.js dependencies
```bash
npm install                    # Root (installs concurrently)
cd frontend && npm install     # Frontend packages
cd ..
```
Or use the convenience script:
```bash
npm run install:all
```

### Step 5: Set up environment variables
```bash
cp .env.example .env
# Edit .env and fill in your actual values (see Environment Variables section)
```

### Step 6: Download MediaPipe model
```bash
# Download from: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models
# Place pose_landmarker_heavy.task (or _lite.task) in the models/ directory
```

### Step 7: Set up Supabase database
Create the required tables in your Supabase project (see [Database Setup](#supabase-database-setup)).

### Step 8: Start the application
```bash
npm run dev
```
This runs BOTH frontend and backend concurrently:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Individual start commands (if needed)
```bash
# Frontend only
cd frontend && npm run dev

# Backend only (from project root, with venv activated)
source venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

---

## Environment Variables

Create a `.env` file in the **project root** (not in `/backend` or `/frontend`):

```env
# ===== REQUIRED =====

# Supabase — Get from: https://supabase.com/dashboard → Project Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key

# ===== OPTIONAL (for AI Summary feature) =====

# OpenRouter — Get from: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-...your-key
OPENROUTER_MODEL=google/gemini-3.1-pro-preview   # Default model
```

### What each variable does:
| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | ✅ Yes | Supabase project URL for database operations |
| `SUPABASE_KEY` | ✅ Yes | Supabase anon/public key for authentication |
| `OPENROUTER_API_KEY` | ❌ Optional | Powers the AI Clinical Summary feature |
| `OPENROUTER_MODEL` | ❌ Optional | Which LLM to use via OpenRouter (default: Gemini) |

> **Without Supabase credentials**, the app will crash on startup.
> **Without OpenRouter key**, the app works but the AI Summary button will fail.

---

## Supabase Database Setup

Create these three tables in your Supabase SQL Editor (`https://supabase.com/dashboard → SQL Editor`):

```sql
-- 1. Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT UNIQUE NOT NULL,
  patient_name TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 18),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_ref UUID REFERENCES patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  progress FLOAT DEFAULT 0.0,
  video_filename TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 3. Results table (one-to-one with jobs)
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  left_max_flexion FLOAT DEFAULT 0,
  left_min_flexion FLOAT DEFAULT 0,
  left_rom FLOAT DEFAULT 0,
  right_max_flexion FLOAT DEFAULT 0,
  right_min_flexion FLOAT DEFAULT 0,
  right_rom FLOAT DEFAULT 0,
  symmetry_index FLOAT DEFAULT 0,
  asymmetry_percentage FLOAT DEFAULT 0,
  diagnosis TEXT DEFAULT 'insufficient_data'
    CHECK (diagnosis IN ('normal', 'high_risk', 'insufficient_data')),
  is_high_risk BOOLEAN DEFAULT false,
  confidence FLOAT DEFAULT 0,
  detection_rate FLOAT DEFAULT 0,
  frames_processed INTEGER DEFAULT 0,
  frames_detected INTEGER DEFAULT 0,
  left_angle_series JSONB DEFAULT '[]',
  right_angle_series JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (recommended)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (adjust for production)
CREATE POLICY "Allow all" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON results FOR ALL USING (true) WITH CHECK (true);
```

---

## MediaPipe Model Setup

The gait analysis engine requires a MediaPipe Pose Landmarker model file.

1. Go to [MediaPipe Pose Landmarker Models](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models)
2. Download one of these models:

| Model | File | Size | Accuracy |
|-------|------|------|----------|
| **Heavy (recommended)** | `pose_landmarker_heavy.task` | ~30MB | Highest |
| Lite (faster) | `pose_landmarker_lite.task` | ~6MB | Lower |

3. Place the downloaded file in the `models/` directory at the project root.

The scanner auto-detects the model from `models/pose_landmarker_heavy.task` first, falling back to `models/pose_landmarker_lite.task`.

---

## Project Structure

```
Hisl_Hackathon/
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Template for .env
├── package.json                 # Root: concurrently script to run both servers
│
├── backend/
│   ├── requirements.txt         # Python dependencies
│   └── app/
│       ├── main.py              # FastAPI app entry point
│       ├── config.py            # Environment config loader
│       ├── dependencies.py      # Supabase client singleton
│       ├── schemas.py           # Pydantic models + constants
│       ├── utils.py             # Shared utilities (angle calculation)
│       ├── routes/
│       │   ├── health.py        # GET /health
│       │   ├── upload.py        # POST /api/v1/upload
│       │   ├── jobs.py          # CRUD /api/v1/jobs
│       │   └── ai_summary.py   # POST /api/v1/summary/{job_id}
│       ├── services/
│       │   ├── database.py      # Supabase CRUD (patients, jobs, results)
│       │   └── processor.py     # Background job processing bridge
│       └── engine/
│           ├── scanner.py       # MediaPipe pose detection + video processing
│           ├── analysis.py      # Symmetry index, ROM, diagnosis calculation
│           ├── smoothing.py     # Signal processing (Savitzky-Golay, IQR)
│           └── video.py         # Video validation (duration, resolution, FPS)
│
├── frontend/
│   ├── package.json             # Node dependencies
│   ├── next.config.js           # API proxy rewrite to backend
│   ├── tailwind.config.js       # TailwindCSS theme (dark mode, custom colors)
│   ├── pages/
│   │   ├── _app.tsx             # App wrapper
│   │   ├── _document.tsx        # Custom document (Google Fonts, Material Icons)
│   │   ├── index.tsx            # Home page: upload form + job history
│   │   └── results/[id].tsx     # Results page: metrics, video, charts, AI summary
│   └── src/
│       ├── components/
│       │   ├── Layout.tsx       # App shell (header, nav, dark mode toggle)
│       │   ├── UploadForm.tsx   # Patient info + video upload form
│       │   ├── ProgressBar.tsx  # Processing progress indicator
│       │   ├── MetricCard.tsx   # Reusable metric display card
│       │   ├── AngleChart.tsx   # Knee angle chart component
│       │   ├── DiagnosisBanner.tsx  # Risk/normal status banner
│       │   ├── VisualLocalization.tsx  # Body diagram with highlights
│       │   └── JobHistoryTable.tsx    # List of past analyses
│       ├── services/
│       │   └── api.ts           # Axios API client (all backend calls)
│       ├── hooks/
│       │   └── useJob.ts        # React hook for job polling
│       └── types/
│           └── index.ts         # TypeScript interfaces matching backend schemas
│
├── models/                      # MediaPipe model files (gitignored by size)
│   ├── pose_landmarker_heavy.task
│   └── README.md
│
├── uploads/                     # Uploaded videos (created at runtime, gitignored)
├── results/                     # Processed videos + outputs (created at runtime, gitignored)
└── venv/                        # Python virtual environment (gitignored)
```

---

## API Reference

All backend endpoints are documented at **http://localhost:8000/docs** (Swagger UI).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/upload` | Upload a video file (multipart/form-data) |
| `POST` | `/api/v1/jobs` | Create analysis job → starts background processing |
| `GET` | `/api/v1/jobs/{job_id}` | Get job status + results (poll every 1s) |
| `GET` | `/api/v1/jobs` | List all jobs |
| `DELETE` | `/api/v1/jobs/{job_id}` | Delete a completed/failed job |
| `POST` | `/api/v1/summary/{job_id}` | Generate AI clinical summary |
| `GET` | `/uploads/{filename}` | Static: uploaded videos |
| `GET` | `/results/{filename}` | Static: processed videos |

---

## How It Works

### Processing Pipeline
```
1. User fills patient form + uploads video (.mp4/.mov/.avi/.webm, ≤100MB, 3-60s)
2. Backend saves video to uploads/, creates job in Supabase (status: "queued")
3. Background task starts:
   a. Validates video (duration, resolution, FPS)
   b. MediaPipe Pose Landmarker detects body landmarks per frame
   c. Calculates knee angles (left + right) per frame
   d. Blurs face for privacy
   e. Draws skeleton overlay on video
   f. Saves processed video: OpenCV writes temp AVI → ffmpeg converts to browser-compatible MP4
   g. Applies signal processing: interpolate zeros → IQR outlier removal → Savitzky-Golay smoothing
   h. Calculates metrics: ROM, Symmetry Index, Asymmetry %, detection rate
   i. Determines diagnosis: NORMAL / HIGH_RISK / INSUFFICIENT_DATA
   j. Saves results to Supabase, updates job status to "completed"
4. Frontend polls GET /api/v1/jobs/{id} every 1s until completed
5. Results page shows: metrics cards, processed video, knee angle chart, body diagram
6. AI Summary (optional): sends metrics to OpenRouter LLM for parent-friendly explanation
```

### Clinical Thresholds
| Metric | Normal Range | High Risk |
|--------|-------------|-----------|
| Symmetry Index | 0.85 – 1.15 | < 0.85 or > 1.15 |
| Asymmetry % | < 15% | ≥ 15% |
| Detection Rate | ≥ 50% | < 50% → Insufficient Data |
| Normal Knee ROM | 40° – 60° | Outside this range |

---

## Troubleshooting

### "SUPABASE_URL and SUPABASE_KEY must be set"
→ Create a `.env` file in the project root with valid Supabase credentials.

### "pose_landmarker_heavy.task not found"
→ Download the model from [MediaPipe](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models) and place it in `models/`.

### "No video with supported format and MIME type found"
→ ffmpeg is required. Install it: `sudo apt install ffmpeg` (Linux) or `brew install ffmpeg` (Mac).

### Backend not reloading
→ Make sure you're running from the project root with venv activated:
```bash
source venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend can't reach backend (API errors)
→ Both servers must be running. The frontend proxies `/api/*` to `localhost:8000`. Check that the backend is running on port 8000.

---

## For LLM Agents

If you are an LLM being asked to set up and run this project, execute these commands in order:

```bash
# 1. System dependencies
sudo apt update && sudo apt install -y python3 python3-venv python3-pip nodejs npm ffmpeg

# 2. Python setup
cd /path/to/Hisl_Hackathon
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 3. Node setup
npm install
cd frontend && npm install && cd ..

# 4. Environment (ask user for credentials)
cp .env.example .env
# MUST fill in: SUPABASE_URL, SUPABASE_KEY
# OPTIONAL: OPENROUTER_API_KEY

# 5. MediaPipe model (must exist in models/)
ls models/pose_landmarker_heavy.task || echo "ERROR: Download model from https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models"

# 6. Start
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```
