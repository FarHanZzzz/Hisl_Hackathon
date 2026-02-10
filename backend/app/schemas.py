"""
Pydantic schemas for Pedi-Growth API.
Consolidated from shared/schemas.py — single source of truth for all data models.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class JobStatus(str, Enum):
    """Job processing status."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DiagnosisResult(str, Enum):
    """Diagnosis classification."""
    NORMAL = "normal"
    HIGH_RISK = "high_risk"
    INSUFFICIENT_DATA = "insufficient_data"


# =============================================================================
# REQUEST SCHEMAS
# =============================================================================

class PatientInfo(BaseModel):
    """Patient information for analysis."""
    patient_id: str = Field(..., min_length=1, description="Unique patient identifier")
    patient_name: Optional[str] = Field(None, description="Patient name (optional)")
    age: Optional[int] = Field(None, ge=0, le=18, description="Patient age in years")
    notes: Optional[str] = Field(None, description="Additional clinical notes")


class AnalysisRequest(BaseModel):
    """Request to start a new gait analysis."""
    patient: PatientInfo
    video_filename: str = Field(..., description="Uploaded video filename")
    enable_sam3: bool = Field(False, description="Enable background removal optimization")


# =============================================================================
# RESPONSE SCHEMAS
# =============================================================================

class AngleData(BaseModel):
    """Time-series angle data for a single leg."""
    values: List[float] = Field(default_factory=list, description="Angle values per frame")
    max_flexion: float = Field(0.0, description="Maximum flexion angle")
    min_flexion: float = Field(0.0, description="Minimum flexion angle")
    range_of_motion: float = Field(0.0, description="ROM = max - min")


class AnalysisMetrics(BaseModel):
    """Computed metrics from gait analysis."""
    left_knee: AngleData = Field(default_factory=AngleData)
    right_knee: AngleData = Field(default_factory=AngleData)
    symmetry_index: float = Field(0.0, description="SI = max_left / max_right")
    asymmetry_percentage: float = Field(0.0, description="Asymmetry as percentage")
    frames_processed: int = Field(0, description="Total frames analyzed")
    frames_detected: int = Field(0, description="Frames with successful detection")
    detection_rate: float = Field(0.0, description="Detection rate percentage")


class DiagnosisInfo(BaseModel):
    """Diagnosis information."""
    result: DiagnosisResult = Field(DiagnosisResult.INSUFFICIENT_DATA)
    message: str = Field("", description="Human-readable diagnosis message")
    is_high_risk: bool = Field(False)
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score")


class AnalysisResult(BaseModel):
    """Complete analysis result."""
    job_id: str = Field(..., description="Unique job identifier")
    patient: PatientInfo
    metrics: Optional[AnalysisMetrics] = None
    diagnosis: Optional[DiagnosisInfo] = None
    video_filename: str = Field("")
    processed_video_url: Optional[str] = Field(None, description="URL to processed video")
    report_url: Optional[str] = Field(None, description="URL to PDF report")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class JobResponse(BaseModel):
    """Response for job status queries."""
    job_id: str
    status: JobStatus
    progress: float = Field(0.0, ge=0.0, le=1.0, description="Progress 0-1")
    result: Optional[AnalysisResult] = None
    error_message: Optional[str] = None


class JobCreateResponse(BaseModel):
    """Response when creating a new job."""
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    message: str = "Job created successfully"


# =============================================================================
# CONSTANTS
# =============================================================================

# Diagnostic thresholds
SI_LOW_THRESHOLD = 0.85
SI_HIGH_THRESHOLD = 1.15
ANGLE_DIFF_ALERT = 30  # degrees

# Supported video formats
SUPPORTED_VIDEO_FORMATS = [".mp4", ".mov", ".avi", ".webm"]

# Maximum video duration (seconds)
MAX_VIDEO_DURATION = 120

# Maximum file size (MB)
MAX_FILE_SIZE_MB = 100
