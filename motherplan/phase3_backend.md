# Phase 3: Backend API

> **LLM Execution Notes**: This phase replaces the stub route files from Phase 1 with full
> implementations. The OLD `backend/main_old.py` is the reference for existing endpoint behavior.
> All paths relative to `d:\Hisl_hackathon_project\`.

---

## Prerequisites (from Phases 1–2)
- [ ] Phase 1 complete — `backend/app/` structure exists, `config.py` and `dependencies.py` work
- [ ] Phase 2 complete — `backend/app/engine/` module works, `process_video()` updated
- [ ] Supabase connected — `get_supabase()` returns a working client
- [ ] Environment: `pip install -r backend/requirements.txt` completed

## Existing Code Reference
- **OLD routes**: `d:\Hisl_hackathon_project\backend\main_old.py` (339 lines) — Contains all original endpoints and mock data logic
- **Schemas**: `d:\Hisl_hackathon_project\shared\schemas.py` — Pydantic models for requests/responses
- **Config**: `d:\Hisl_hackathon_project\backend\app\config.py` — From Phase 1

---

## Tasks

### 3.1 Implement `backend/app/services/database.py` — Supabase CRUD

**Replace stub** at `d:\Hisl_hackathon_project\backend\app\services\database.py`:

```python
"""
Supabase database service — CRUD operations for patients, jobs, results.

Tables (already exist in Supabase):
    patients: id(UUID PK), patient_id(TEXT UNIQUE), patient_name, age, notes, created_at
    jobs:     id(UUID PK), patient_ref(FK→patients), status, progress, video_filename, error_message, created_at, completed_at
    results:  id(UUID PK), job_id(FK→jobs UNIQUE), left_max_flexion, ..., left_angle_series(JSONB), right_angle_series(JSONB), created_at
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from ..dependencies import get_supabase


class PatientService:
    """CRUD for the patients table."""
    
    def __init__(self):
        self.db = get_supabase()
        self.table = "patients"
    
    def get_or_create(self, patient_id: str, patient_name: str = None, 
                      age: int = None, notes: str = None) -> Dict[str, Any]:
        """
        Find existing patient by patient_id, or create a new one.
        Returns the patient row as a dict.
        """
        # Try to find existing
        result = (self.db.table(self.table)
                  .select("*")
                  .eq("patient_id", patient_id)
                  .execute())
        if result.data:
            return result.data[0]
        
        # Create new patient
        data = {"patient_id": patient_id}
        if patient_name:
            data["patient_name"] = patient_name
        if age is not None:
            data["age"] = age
        if notes:
            data["notes"] = notes
        
        return self.db.table(self.table).insert(data).execute().data[0]
    
    def get(self, patient_uuid: str) -> Optional[Dict[str, Any]]:
        """Get patient by UUID."""
        result = self.db.table(self.table).select("*").eq("id", patient_uuid).execute()
        return result.data[0] if result.data else None


class JobService:
    """CRUD for the jobs table."""
    
    def __init__(self):
        self.db = get_supabase()
        self.table = "jobs"
    
    def create(self, patient_ref: str, video_filename: str) -> Dict[str, Any]:
        """Create a new analysis job. Returns the created row."""
        return self.db.table(self.table).insert({
            "patient_ref": patient_ref,
            "video_filename": video_filename,
            "status": "queued",
            "progress": 0.0
        }).execute().data[0]
    
    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by UUID, including nested results if completed."""
        result = (self.db.table(self.table)
                  .select("*, results(*)")
                  .eq("id", job_id)
                  .execute())
        return result.data[0] if result.data else None
    
    def update(self, job_id: str, **kwargs) -> Dict[str, Any]:
        """
        Update job fields. Common updates:
            status="processing", progress=0.5
            status="completed", progress=1.0, completed_at=now
            status="failed", error_message="..."
        """
        if "status" in kwargs and kwargs["status"] == "completed":
            kwargs["completed_at"] = datetime.now(timezone.utc).isoformat()
        return (self.db.table(self.table)
                .update(kwargs)
                .eq("id", job_id)
                .execute().data[0])
    
    def list_all(self, status: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List jobs, optionally filtered by status, ordered by newest first."""
        query = (self.db.table(self.table)
                 .select("*")
                 .order("created_at", desc=True)
                 .limit(limit))
        if status:
            query = query.eq("status", status)
        return query.execute().data
    
    def delete(self, job_id: str) -> None:
        """Delete a job by UUID. CASCADE deletes associated result."""
        self.db.table(self.table).delete().eq("id", job_id).execute()


class ResultService:
    """CRUD for the results table."""
    
    def __init__(self):
        self.db = get_supabase()
        self.table = "results"
    
    def create(self, job_id: str, **kwargs) -> Dict[str, Any]:
        """
        Save analysis results for a job.
        
        Expected kwargs:
            left_max_flexion, left_min_flexion, left_rom,
            right_max_flexion, right_min_flexion, right_rom,
            symmetry_index, asymmetry_percentage,
            diagnosis (str: "normal"|"high_risk"|"insufficient_data"),
            is_high_risk (bool), confidence (float),
            detection_rate, frames_processed, frames_detected,
            left_angle_series (list), right_angle_series (list)
        """
        data = {"job_id": job_id, **kwargs}
        return self.db.table(self.table).insert(data).execute().data[0]
    
    def get_by_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get result by job UUID."""
        result = self.db.table(self.table).select("*").eq("job_id", job_id).execute()
        return result.data[0] if result.data else None
```

### 3.2 Implement `backend/app/routes/upload.py` — File Upload

**Replace stub** at `d:\Hisl_hackathon_project\backend\app\routes\upload.py`:

```python
"""Video upload endpoint."""
from fastapi import APIRouter, File, UploadFile, HTTPException
from pathlib import Path
import uuid
import shutil
from ..config import UPLOAD_DIR, MAX_FILE_SIZE_MB, ALLOWED_EXTENSIONS

router = APIRouter(prefix="/api/v1", tags=["upload"])


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for gait analysis.
    
    Validations:
        - Extension must be one of: .mp4, .mov, .avi, .webm
        - File size must be ≤ 100 MB
    
    Returns:
        filename: Unique filename (UUID prefix + original name)
        size_mb: File size in megabytes
    """
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename to prevent collisions
    unique_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = UPLOAD_DIR / unique_name
    
    # Save file to disk
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Validate file size AFTER saving (to get exact size)
    size_mb = file_path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        file_path.unlink()  # Clean up oversized file
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f} MB (max {MAX_FILE_SIZE_MB} MB)"
        )
    
    return {
        "filename": unique_name,
        "size_mb": round(size_mb, 2)
    }
```

### 3.3 Implement `backend/app/routes/jobs.py` — Job CRUD

**Replace stub** at `d:\Hisl_hackathon_project\backend\app\routes\jobs.py`:

```python
"""Job CRUD endpoints for gait analysis."""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import Optional
from ..services.database import PatientService, JobService
from ..services.processor import process_job_async

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


# --- Request/Response Models ---

class PatientInput(BaseModel):
    patient_id: str = Field(..., description="User-facing patient identifier")
    patient_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=18)
    notes: Optional[str] = None

class CreateJobRequest(BaseModel):
    patient: PatientInput
    video_filename: str = Field(..., description="Filename returned from /upload")

class CreateJobResponse(BaseModel):
    job_id: str
    status: str = "queued"
    message: str = "Analysis job created"


# --- Endpoints ---

@router.post("", response_model=CreateJobResponse)
async def create_job(request: CreateJobRequest, background_tasks: BackgroundTasks):
    """
    Create a new gait analysis job.
    
    Flow:
        1. Get or create patient record in Supabase
        2. Create job record with status "queued"
        3. Queue background processing task
        4. Return job_id for polling
    """
    patient_svc = PatientService()
    job_svc = JobService()
    
    # Step 1: Get or create patient
    patient = patient_svc.get_or_create(
        patient_id=request.patient.patient_id,
        patient_name=request.patient.patient_name,
        age=request.patient.age,
        notes=request.patient.notes
    )
    
    # Step 2: Create job record
    job = job_svc.create(
        patient_ref=patient["id"],
        video_filename=request.video_filename
    )
    
    # Step 3: Queue background processing
    background_tasks.add_task(process_job_async, job["id"])
    
    return CreateJobResponse(job_id=job["id"])


@router.get("/{job_id}")
async def get_job(job_id: str):
    """
    Get job status and results.
    Frontend polls this endpoint every 1 second during processing.
    
    Returns job with nested result if status is "completed".
    """
    job_svc = JobService()
    job = job_svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("")
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200)
):
    """List all jobs, optionally filtered by status."""
    job_svc = JobService()
    return job_svc.list_all(status=status, limit=limit)


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a completed or failed job.
    Cannot delete jobs that are still queued or processing.
    """
    job_svc = JobService()
    job = job_svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] not in ("completed", "failed"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete job with status '{job['status']}'. "
                   f"Only 'completed' or 'failed' jobs can be deleted."
        )
    job_svc.delete(job_id)
    return {"message": f"Job {job_id} deleted"}
```

### 3.4 Implement `backend/app/services/processor.py` — Background Processing

**Replace stub** at `d:\Hisl_hackathon_project\backend\app\services\processor.py`:

```python
"""
Background processing bridge between FastAPI and worker module.

Called by BackgroundTasks when a new job is created.
Runs the video through the gait analysis pipeline and saves results to Supabase.
"""
import traceback
from pathlib import Path
from ..config import UPLOAD_DIR, RESULTS_DIR
from .database import JobService, ResultService


def process_job_async(job_id: str) -> None:
    """
    Process a gait analysis job in the background.
    
    Steps:
        1. Update job status to "processing"
        2. Import and run worker.processor.process_video()
        3. Save results to Supabase results table
        4. Update job status to "completed"
        5. On error: update job status to "failed" with error message
    
    IMPORTANT: This function runs in a background thread, NOT an async context.
    Do not use await. All Supabase calls are synchronous via httpx.
    """
    job_svc = JobService()
    result_svc = ResultService()
    
    try:
        # Get job details
        job = job_svc.get(job_id)
        if not job:
            return
        
        video_path = UPLOAD_DIR / job["video_filename"]
        if not video_path.exists():
            job_svc.update(job_id, status="failed", 
                          error_message=f"Video file not found: {job['video_filename']}")
            return
        
        # Update status
        job_svc.update(job_id, status="processing", progress=0.0)
        
        # Import worker (deferred to avoid circular imports + MediaPipe startup cost)
        from worker.processor import process_video
        
        # Define progress callback
        def on_progress(fraction: float):
            """Called by process_video with progress 0.0 → 1.0"""
            try:
                job_svc.update(job_id, progress=min(fraction, 0.99))
            except Exception:
                pass  # Don't fail processing due to progress update errors
        
        # Run analysis
        analysis_result = process_video(
            video_path=str(video_path),
            job_id=job_id,
            output_dir=RESULTS_DIR,
            progress_callback=on_progress
        )
        
        # Save result to Supabase
        result_svc.create(
            job_id=job_id,
            left_max_flexion=analysis_result.metrics.left_knee.max_flexion if analysis_result.metrics else None,
            left_min_flexion=analysis_result.metrics.left_knee.min_flexion if analysis_result.metrics else None,
            left_rom=analysis_result.metrics.left_knee.range_of_motion if analysis_result.metrics else None,
            right_max_flexion=analysis_result.metrics.right_knee.max_flexion if analysis_result.metrics else None,
            right_min_flexion=analysis_result.metrics.right_knee.min_flexion if analysis_result.metrics else None,
            right_rom=analysis_result.metrics.right_knee.range_of_motion if analysis_result.metrics else None,
            symmetry_index=analysis_result.metrics.symmetry_index if analysis_result.metrics else None,
            asymmetry_percentage=analysis_result.metrics.asymmetry_percentage if analysis_result.metrics else None,
            diagnosis=analysis_result.diagnosis.result.value if analysis_result.diagnosis else None,
            is_high_risk=analysis_result.diagnosis.is_high_risk if analysis_result.diagnosis else False,
            confidence=analysis_result.diagnosis.confidence if analysis_result.diagnosis else 0.0,
            detection_rate=analysis_result.metrics.detection_rate if analysis_result.metrics else 0.0,
            frames_processed=analysis_result.metrics.frames_processed if analysis_result.metrics else 0,
            frames_detected=analysis_result.metrics.frames_detected if analysis_result.metrics else 0,
            left_angle_series=analysis_result.metrics.left_angles if hasattr(analysis_result.metrics, 'left_angles') else None,
            right_angle_series=analysis_result.metrics.right_angles if hasattr(analysis_result.metrics, 'right_angles') else None,
        )
        
        # Mark complete
        job_svc.update(job_id, status="completed", progress=1.0)
        
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        try:
            job_svc.update(job_id, status="failed", error_message=error_msg[:2000])
        except Exception:
            pass  # Last resort: can't even update the status
```

---

## Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| App starts | `uvicorn backend.app.main:app --reload --port 8000` | Server running |
| Health | `curl http://localhost:8000/health` | `{"status":"healthy",...}` |
| Upload valid | `curl -F "file=@test.mp4" http://localhost:8000/api/v1/upload` | `{"filename":"...", "size_mb":...}` |
| Upload invalid | `curl -F "file=@test.txt" http://localhost:8000/api/v1/upload` | 400 error |
| Create job | `curl -X POST -H "Content-Type: application/json" -d '{"patient":{"patient_id":"P001"},"video_filename":"test.mp4"}' http://localhost:8000/api/v1/jobs` | `{"job_id":"...","status":"queued"}` |
| List jobs | `curl http://localhost:8000/api/v1/jobs` | Array of jobs |
| Supabase data | Check Supabase dashboard → patients table has P001 row | Row exists |
| OpenAPI docs | Open `http://localhost:8000/docs` | Swagger UI loads |

---

## Outputs of This Phase
Modified files:
```
backend/app/routes/upload.py       (full implementation, was stub)
backend/app/routes/jobs.py         (full implementation, was stub)
backend/app/services/database.py   (full implementation, was stub)
backend/app/services/processor.py  (NEW — background processing bridge)
```
