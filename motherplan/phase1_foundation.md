# Phase 1: Project Foundation

> **LLM Execution Notes**: This phase sets up infrastructure. Tasks 1.1–1.3 are ALREADY COMPLETED.
> Start execution at Task 1.4. All paths are relative to project root `d:\Hisl_hackathon_project\`.

---

## Prerequisites
- Python 3.11+ installed
- Node.js 18+ installed
- Supabase project `pedi-growth` is ACTIVE (ID: `ndsbxpfkrgplpyrbcohl`)
- `.env` file exists at project root with `SUPABASE_URL` and `SUPABASE_KEY`

## Completed Tasks (DO NOT RE-RUN)

### ~~1.1 Supabase Project~~ ✅
- Project created: `pedi-growth` (ID: `ndsbxpfkrgplpyrbcohl`)
- Region: `ap-northeast-1` (Tokyo)
- URL: `https://ndsbxpfkrgplpyrbcohl.supabase.co`

### ~~1.2 Database Tables~~ ✅
Three tables exist with correct schema:
- `patients` (id, patient_id, patient_name, age, notes, created_at)
- `jobs` (id, patient_ref→patients.id, status, progress, video_filename, error_message, created_at, completed_at)
- `results` (id, job_id→jobs.id, left_max_flexion, left_min_flexion, left_rom, right_max_flexion, right_min_flexion, right_rom, symmetry_index, asymmetry_percentage, diagnosis, is_high_risk, confidence, detection_rate, frames_processed, frames_detected, left_angle_series, right_angle_series, created_at)
- RLS enabled with open-access policies on all tables
- Indexes: `idx_jobs_status`, `idx_jobs_patient`, `idx_jobs_created`

### ~~1.3 Environment Configuration~~ ✅
- `d:\Hisl_hackathon_project\.env` — Contains real Supabase credentials
- `d:\Hisl_hackathon_project\.env.example` — Template for other developers
- `d:\Hisl_hackathon_project\frontend\.env.local` — Frontend env with NEXT_PUBLIC vars
- `.gitignore` already excludes `.env` and `.env.*` (keeps `.env.example`)

---

## Remaining Tasks (EXECUTE THESE)

### 1.4 Update Worker Model Paths

**What exists now**: `d:\Hisl_hackathon_project\worker\processor.py` — Contains `GaitScanner` class.
The model path may reference `models/pose_landmarker_heavy.task` which no longer exists.

**What to change**: All model path references must point to `models/pose_landmarker_heavy.task` (relative to project root).

**Files to modify**:
- `d:\Hisl_hackathon_project\worker\processor.py` — Find any hardcoded model paths and update to:
  ```python
  import os
  MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'pose_landmarker_heavy.task')
  ```
  Or use an environment variable:
  ```python
  MODEL_PATH = os.getenv('MODELS_DIR', './models') + '/pose_landmarker_heavy.task'
  ```

**Verification**: Run `python -c "from worker.processor import GaitScanner; print('OK')"` from project root. It should not throw FileNotFoundError.

---

### 1.5 Backend Modular Restructure

**What exists now**: `d:\Hisl_hackathon_project\backend\main.py` — A single 339-line file with all routes, CORS, mock data, and background processing.

**Goal**: Split into modular structure. The existing `main.py` is the SOURCE OF TRUTH for current route logic. Do NOT lose any functionality.

#### Step 1: Create directory structure
```
mkdir -p backend/app/routes
mkdir -p backend/app/services
```

#### Step 2: Create `backend/app/__init__.py`
```python
# Empty init
```

#### Step 3: Create `backend/app/config.py`
```python
"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (two levels up from backend/app/)
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

# Supabase
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

# File paths
UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "./uploads"))
RESULTS_DIR: Path = Path(os.getenv("RESULTS_DIR", "./results"))
MODELS_DIR: Path = Path(os.getenv("MODELS_DIR", "./models"))

# API
API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
API_PORT: int = int(os.getenv("API_PORT", "8000"))

# Constraints
MAX_FILE_SIZE_MB: int = 100
MAX_VIDEO_DURATION_SEC: int = 60
ALLOWED_EXTENSIONS: set = {".mp4", ".mov", ".avi", ".webm"}

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)
```

#### Step 4: Create `backend/app/dependencies.py`
```python
"""Shared dependencies — Supabase client singleton."""
from functools import lru_cache
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY

@lru_cache()
def get_supabase() -> Client:
    """Returns a cached Supabase client instance."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)
```

#### Step 5: Create `backend/app/routes/__init__.py`
```python
# Empty init
```

#### Step 6: Create `backend/app/routes/health.py`
```python
"""Health check endpoint."""
from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "pedi-growth-api",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
```

#### Step 7: Create `backend/app/routes/upload.py`
Refer to Phase 3, Task 3.3 for the complete upload route implementation.
For now, create a stub:
```python
"""Video upload endpoint — implemented in Phase 3."""
from fastapi import APIRouter
router = APIRouter(prefix="/api/v1", tags=["upload"])

# Placeholder: Full implementation comes in Phase 3
```

#### Step 8: Create `backend/app/routes/jobs.py`
Refer to Phase 3, Task 3.2 for the complete jobs route implementation.
For now, create a stub:
```python
"""Job CRUD endpoints — implemented in Phase 3."""
from fastapi import APIRouter
router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])

# Placeholder: Full implementation comes in Phase 3
```

#### Step 9: Create `backend/app/services/__init__.py`
```python
# Empty init
```

#### Step 10: Create `backend/app/services/database.py`
Stub for now — full implementation in Phase 3, Task 3.1:
```python
"""Supabase database service — implemented in Phase 3."""
```

#### Step 11: Create `backend/app/services/storage.py`
```python
"""File storage service for uploads and results."""
from pathlib import Path
from ..config import UPLOAD_DIR, RESULTS_DIR

def get_upload_path(filename: str) -> Path:
    return UPLOAD_DIR / filename

def get_result_path(filename: str) -> Path:
    return RESULTS_DIR / filename
```

#### Step 12: Create `backend/app/main.py`
```python
"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import health, upload, jobs

app = FastAPI(
    title="Pedi-Growth API",
    description="Pediatric Gait Analysis API",
    version="1.0.0"
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(jobs.router)
```

#### Step 13: Update `backend/requirements.txt`
```
fastapi>=0.100.0
uvicorn[standard]>=0.20.0
python-dotenv>=1.0.0
supabase>=2.0.0
python-multipart>=0.0.6
aiofiles>=23.0.0
```

**IMPORTANT**: Keep the OLD `backend/main.py` as `backend/main_old.py` for reference. Do NOT delete it until Phase 3 is complete and all routes are migrated.

---

### 1.6 Install Backend Dependencies

Run from project root:
```bash
cd d:\Hisl_hackathon_project
pip install -r backend/requirements.txt
```

---

## Verification Checklist

Run these commands from `d:\Hisl_hackathon_project\`:

| Check | Command | Expected |
|-------|---------|----------|
| Config loads | `python -c "from backend.app.config import SUPABASE_URL; print(SUPABASE_URL[:20])"` | Prints `https://ndsbxpfkrg` |
| Supabase connects | `python -c "from backend.app.dependencies import get_supabase; c=get_supabase(); print('OK')"` | Prints `OK` |
| App starts | `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000` | Server starts on port 8000 |
| Health endpoint | `curl http://localhost:8000/health` | Returns `{"status":"healthy",...}` |
| Worker model exists | `python -c "import os; assert os.path.exists('models/pose_landmarker_heavy.task')"` | No error |

---

## Outputs of This Phase
After completion, the following NEW files should exist:
```
backend/app/__init__.py
backend/app/config.py
backend/app/dependencies.py
backend/app/main.py
backend/app/routes/__init__.py
backend/app/routes/health.py
backend/app/routes/upload.py       (stub)
backend/app/routes/jobs.py         (stub)
backend/app/services/__init__.py
backend/app/services/database.py   (stub)
backend/app/services/storage.py
backend/main_old.py                (renamed from main.py)
```
