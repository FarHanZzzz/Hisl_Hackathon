# Pedi-Growth: AI-Powered Pediatric Gait Analysis

A clinical gait analysis tool for early detection of Cerebral Palsy and developmental delays in children. Uses computer vision (MediaPipe) to analyze walking patterns and compute symmetry metrics.

## Project Structure

```
Hisl_hackathon_project/
├── backend/                     # Python Backend (FastAPI + Engine)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entry point
│   │   ├── config.py           # Environment configuration
│   │   ├── schemas.py          # Pydantic data models
│   │   ├── utils.py            # Shared utility functions
│   │   ├── routes/             # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── health.py       # Health check (Phase 3)
│   │   │   ├── upload.py       # Video upload (Phase 3)
│   │   │   └── jobs.py         # Job CRUD (Phase 3)
│   │   ├── services/           # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── database.py     # Supabase CRUD (Phase 3)
│   │   │   ├── storage.py      # File I/O (Phase 3)
│   │   │   └── processor.py    # Background job bridge (Phase 3)
│   │   └── engine/             # Gait analysis core
│   │       ├── __init__.py
│   │       ├── scanner.py      # GaitScanner + process_video
│   │       ├── analysis.py     # Metric calculations (Phase 2)
│   │       ├── smoothing.py    # Signal processing (Phase 2)
│   │       └── video.py        # Video validation (Phase 2)
│   ├── __init__.py
│   └── requirements.txt        # All Python dependencies
├── frontend/                    # Next.js Web UI
│   ├── pages/                  # React pages
│   │   └── index.tsx           # Main page
│   ├── src/                    # Components & hooks (Phase 4)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── styles/
│   ├── package.json
│   └── tsconfig.json
├── models/                      # ML model files
│   ├── pose_landmarker_heavy.task  (30 MB)
│   └── pose_landmarker_lite.task   (5.5 MB)
├── motherplan/                  # Planning & documentation
│   ├── TDD.md                  # Technical Design Document
│   ├── phase1_foundation.md
│   ├── phase2_core_engine.md
│   ├── phase3_backend.md
│   ├── phase4_frontend.md
│   ├── phase5_deployment.md
│   └── stitch_ui_guide.md      # Stitch MCP UI prompts
├── tests/                       # Test suite (Phase 5)
├── uploads/                     # Video uploads (runtime, gitignored)
├── results/                     # Processed results (runtime, gitignored)
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Template for .env
├── ANALYSIS.md                  # Original codebase analysis
├── ORGANOGRAM.md                # This file
└── .gitignore
```

## Quick Start

```bash
# 1. Install backend dependencies
pip install -r backend/requirements.txt

# 2. Run backend API (from project root)
uvicorn backend.app.main:app --reload --port 8000

# 3. Install frontend dependencies
cd frontend && npm install

# 4. Run frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Model Setup

The app requires MediaPipe Pose Landmarker model files in `models/`:
- `pose_landmarker_heavy.task` — High accuracy (30 MB) ✅ Present
- `pose_landmarker_lite.task` — Faster inference (5.5 MB) ✅ Present

Download from [MediaPipe Models](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models) if missing.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/upload` | Upload video file |
| POST | `/api/v1/jobs` | Create analysis job |
| GET | `/api/v1/jobs/{id}` | Get job status/results |
| GET | `/api/v1/jobs` | List all jobs |
| DELETE | `/api/v1/jobs/{id}` | Delete a job |

## Key Metrics

- **Symmetry Index (SI)**: `SI = max(left_flexion) / max(right_flexion)`
  - Normal: 0.85 ≤ SI ≤ 1.15
  - High Risk: SI < 0.85 or SI > 1.15
- **Asymmetry %**: `|1 - SI| × 100`
- **Detection Rate**: Percentage of frames with successful pose detection
- **Range of Motion (ROM)**: max_angle - min_angle per leg

## Video Requirements

- **Format**: MP4, MOV, AVI, WebM
- **Duration**: 5–60 seconds of walking
- **Max size**: 100 MB
- **Subject**: Full body visible (head to feet)
- **View**: Frontal or sagittal plane

## Architecture

```
┌─────────────┐     ┌──────────────────────────┐
│   Frontend   │────▶│      Backend (FastAPI)    │
│  (Next.js)   │     │  ┌────────┐ ┌─────────┐  │
└─────────────┘     │  │ Routes │ │ Services│  │
                    │  └────────┘ └─────────┘  │
                    │       │           │       │
                    │  ┌────▼───────────▼────┐  │
                    │  │       Engine        │  │
                    │  │ (MediaPipe Scanner) │  │
                    │  └────────────────────┘  │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Supabase (Cloud)   │
                    │  PostgreSQL + Auth  │
                    └─────────────────────┘
```

## Clinical Disclaimer

This tool is for **screening and triage purposes only**. Results should be reviewed by a qualified healthcare professional. It does not replace professional medical diagnosis.

## License

MIT License

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) — Pose detection
- [FastAPI](https://fastapi.tiangolo.com/) — Backend API
- [Next.js](https://nextjs.org/) — Frontend framework
- [Supabase](https://supabase.com/) — Database & auth
