"""
Pedi-Growth Backend API
FastAPI application for video upload, job management, and results retrieval.

Run: uvicorn backend.app.main:app --reload --port 8000
(from project root: d:\Hisl_hackathon_project)
"""

import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import UPLOAD_DIR, RESULTS_DIR, CORS_ORIGINS
from backend.app.schemas import (
    JobStatus,
    JobResponse,
    JobCreateResponse,
    PatientInfo,
    AnalysisRequest,
    AnalysisResult,
    AnalysisMetrics,
    AngleData,
    DiagnosisInfo,
    DiagnosisResult,
    SUPPORTED_VIDEO_FORMATS,
    MAX_FILE_SIZE_MB,
)

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Pedi-Growth API",
    description="AI-Powered Pediatric Gait Analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads and results
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")

# In-memory job store (will be replaced with Supabase in Phase 3)
jobs_store: dict[str, dict] = {}


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "pedi-growth-api",
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# VIDEO UPLOAD
# =============================================================================

@app.post("/api/v1/upload", response_model=dict)
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for analysis.
    Returns the filename to use when creating an analysis job.
    """
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_VIDEO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Supported: {SUPPORTED_VIDEO_FORMATS}",
        )

    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{unique_id}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Get file size
    file_size_mb = file_path.stat().st_size / (1024 * 1024)

    if file_size_mb > MAX_FILE_SIZE_MB:
        file_path.unlink()  # Delete oversized file
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB",
        )

    return {
        "filename": safe_filename,
        "original_filename": file.filename,
        "size_mb": round(file_size_mb, 2),
        "upload_url": f"/uploads/{safe_filename}",
    }


# =============================================================================
# JOB MANAGEMENT
# =============================================================================

@app.post("/api/v1/jobs", response_model=JobCreateResponse)
async def create_job(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
):
    """
    Create a new gait analysis job.
    The job will be processed asynchronously in the background.
    """
    # Validate video file exists
    video_path = UPLOAD_DIR / request.video_filename
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    # Generate job ID
    job_id = str(uuid.uuid4())

    # Create job record
    job_data = {
        "job_id": job_id,
        "status": JobStatus.QUEUED,
        "progress": 0.0,
        "patient": request.patient.model_dump(),
        "video_filename": request.video_filename,
        "enable_sam3": request.enable_sam3,
        "created_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "result": None,
        "error_message": None,
    }

    # Store job
    jobs_store[job_id] = job_data

    # Queue background processing
    background_tasks.add_task(process_job_async, job_id)

    return JobCreateResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        message="Job created successfully. Processing will begin shortly.",
    )


@app.get("/api/v1/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job status and results."""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_store[job_id]

    return JobResponse(
        job_id=job["job_id"],
        status=job["status"],
        progress=job["progress"],
        result=job.get("result"),
        error_message=job.get("error_message"),
    )


@app.get("/api/v1/jobs", response_model=list[JobResponse])
async def list_jobs(
    status: Optional[JobStatus] = None,
    limit: int = 50,
):
    """List all jobs, optionally filtered by status."""
    jobs = list(jobs_store.values())

    if status:
        jobs = [j for j in jobs if j["status"] == status]

    # Sort by created_at descending
    jobs.sort(key=lambda x: x["created_at"], reverse=True)

    return [
        JobResponse(
            job_id=j["job_id"],
            status=j["status"],
            progress=j["progress"],
            result=j.get("result"),
            error_message=j.get("error_message"),
        )
        for j in jobs[:limit]
    ]


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and its associated files."""
    if job_id not in jobs_store:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs_store[job_id]

    # Only allow deletion of completed or failed jobs
    if job["status"] not in [JobStatus.COMPLETED, JobStatus.FAILED]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete job that is still processing",
        )

    # Delete associated files
    video_path = UPLOAD_DIR / job["video_filename"]
    if video_path.exists():
        video_path.unlink()

    # Delete from store
    del jobs_store[job_id]

    return {"message": "Job deleted successfully"}


# =============================================================================
# BACKGROUND PROCESSING (STUB — will be replaced by real engine in Phase 3)
# =============================================================================

async def process_job_async(job_id: str):
    """
    Background task to process a job.
    Currently uses mock data. Phase 3 will wire this to engine/scanner.py.
    """
    import asyncio

    if job_id not in jobs_store:
        return

    job = jobs_store[job_id]
    job["status"] = JobStatus.PROCESSING

    try:
        # Simulate processing stages
        for progress in [0.1, 0.3, 0.5, 0.7, 0.9, 1.0]:
            await asyncio.sleep(0.5)  # Simulate work
            job["progress"] = progress

        # Create mock result (Phase 3 will use real engine output)
        job["result"] = AnalysisResult(
            job_id=job_id,
            patient=PatientInfo(**job["patient"]),
            metrics=AnalysisMetrics(
                left_knee=AngleData(
                    values=[120.0, 125.0, 130.0, 128.0, 122.0],
                    max_flexion=130.0,
                    min_flexion=120.0,
                    range_of_motion=10.0,
                ),
                right_knee=AngleData(
                    values=[118.0, 123.0, 128.0, 126.0, 120.0],
                    max_flexion=128.0,
                    min_flexion=118.0,
                    range_of_motion=10.0,
                ),
                symmetry_index=1.016,
                asymmetry_percentage=1.6,
                frames_processed=100,
                frames_detected=95,
                detection_rate=95.0,
            ),
            diagnosis=DiagnosisInfo(
                result=DiagnosisResult.NORMAL,
                message="Gait symmetry within normal clinical limits (SI=1.02).",
                is_high_risk=False,
                confidence=0.9,
            ),
            video_filename=job["video_filename"],
        ).model_dump()

        job["status"] = JobStatus.COMPLETED
        job["completed_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        job["status"] = JobStatus.FAILED
        job["error_message"] = str(e)


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
