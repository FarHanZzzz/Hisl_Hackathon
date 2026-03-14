"""Job CRUD endpoints for gait analysis."""
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field
from typing import Optional
from ..services.database import PatientService, JobService
from ..services.processor import process_job_async

logger = logging.getLogger(__name__)

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


def _handle_db_error(e: Exception, operation: str):
    """Convert database/connection errors to proper HTTP exceptions."""
    error_msg = str(e)
    logger.error(f"Database error during {operation}: {error_msg}")
    
    # Connection / DNS errors
    if "Name or service not known" in error_msg or "ConnectError" in type(e).__name__:
        raise HTTPException(
            status_code=503,
            detail="Database service is currently unavailable. "
                   "The Supabase project may be paused or unreachable. "
                   "Please check your Supabase dashboard."
        )
    # Generic fallback
    raise HTTPException(
        status_code=503,
        detail=f"Database error: {error_msg}"
    )


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
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        _handle_db_error(e, "create_job")


@router.get("/{job_id}")
async def get_job(job_id: str):
    """
    Get job status and results.
    Frontend polls this endpoint every 1 second during processing.
    
    Returns job with nested result if status is "completed".
    """
    try:
        job_svc = JobService()
        job = job_svc.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        _handle_db_error(e, "get_job")


@router.get("")
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200)
):
    """List all jobs, optionally filtered by status."""
    try:
        job_svc = JobService()
        return job_svc.list_all(status=status, limit=limit)
    except HTTPException:
        raise
    except Exception as e:
        _handle_db_error(e, "list_jobs")


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a completed or failed job.
    Cannot delete jobs that are still queued or processing.
    """
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        _handle_db_error(e, "delete_job")
