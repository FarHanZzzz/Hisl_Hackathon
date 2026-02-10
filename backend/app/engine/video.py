"""Video I/O validation and helpers."""
import cv2
from pathlib import Path
from typing import Dict, Any

MAX_DURATION_SEC = 60
MIN_DURATION_SEC = 3
MIN_RESOLUTION = 240  # Accept 240p+ (was 480, too strict for typical test videos)


def validate_video(path: str) -> Dict[str, Any]:
    """
    Validate a video file before processing.
    
    Args:
        path: Absolute path to the video file.
        
    Returns:
        dict with keys: valid (bool), duration, resolution, fps, frames, errors (list[str])
    """
    path = str(path)
    if not Path(path).exists():
        return {"valid": False, "errors": [f"File not found: {path}"]}
    
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return {"valid": False, "errors": ["Cannot open video file"]}
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    duration = frame_count / fps if fps > 0 else 0
    
    errors = []
    if duration < MIN_DURATION_SEC:
        errors.append(f"Video too short: {duration:.1f}s (min {MIN_DURATION_SEC}s)")
    if duration > MAX_DURATION_SEC:
        errors.append(f"Video too long: {duration:.1f}s (max {MAX_DURATION_SEC}s)")
    if width < MIN_RESOLUTION or height < MIN_RESOLUTION:
        errors.append(f"Resolution too low: {width}x{height} (min {MIN_RESOLUTION}p)")
    if fps <= 0:
        errors.append("Invalid FPS value")
    
    return {
        "valid": len(errors) == 0,
        "duration": round(duration, 2),
        "resolution": f"{width}x{height}",
        "fps": round(fps, 2),
        "frames": frame_count,
        "errors": errors
    }
