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
