# Phase 2: Core Engine (Video Processing)

> **LLM Execution Notes**: This phase refactors the existing `backend/app/engine/scanner.py` into a modular
> structure with improved signal processing and metrics. All paths relative to `d:\Hisl_hackathon_project\`.

---

## Prerequisites (from Phase 1)
- [ ] Phase 1 complete — backend modular structure exists
- [ ] `models/pose_landmarker_heavy.task` exists (7.3 MB)
- [ ] Python dependencies installed: `mediapipe`, `opencv-python`, `numpy`, `scipy`

## Existing Code Reference

**Source of truth**: `d:\Hisl_hackathon_project\backend\app\engine\scanner.py` (286 lines)
- Contains `GaitScanner` class with `process_frame()` method
- Contains `process_video()` function as main entry point
- Uses MediaPipe Pose Landmarker in IMAGE mode
- Calculates knee angles via `arctan2`
- Applies face blur via bounding box from landmarks 0–10

**Utilities**: `d:\Hisl_hackathon_project\backend\app\utils.py` (134 lines)
- `calculate_angle(a, b, c)` — 2D angle from three points
- `get_symmetry_index(left, right)` — ratio of min/max (ALWAYS ≤ 1.0, loses directionality)
- `get_diagnosis(si, detection_rate)` — returns DiagnosisInfo
- `clean_angles(angles)` — removes zeros

**Schemas**: `d:\Hisl_hackathon_project\backend\app\schemas.py` (300 lines)
- `PatientInfo`, `AnalysisRequest`, `AnalysisResult`, `AnalysisMetrics`
- `DiagnosisResult` enum: `normal`, `high_risk`, `insufficient_data`
- Constants: `SYMMETRY_THRESHOLD = 0.85`, `ALERT_THRESHOLD = 30`

---

## Tasks

### 2.1 Create Engine Module Structure

Create these directories and files:
```bash
# Already exists: backend/app/engine/
```

Update `d:\Hisl_hackathon_project\backend\app\engine\__init__.py`:
```python
"""Core gait analysis engine."""
from .scanner import GaitScanner
from .analysis import calculate_symmetry_index, calculate_asymmetry, calculate_confidence
from .smoothing import smooth_angles
from .video import validate_video
```

### 2.2 Create `backend/app/engine/video.py` — Video Validation

**Full file**: `d:\Hisl_hackathon_project\backend\app\engine\video.py`
```python
"""Video I/O validation and helpers."""
import cv2
from pathlib import Path
from typing import Dict, Any

MAX_DURATION_SEC = 60
MIN_DURATION_SEC = 3
MIN_RESOLUTION = 480


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
```

### 2.3 Create `backend/app/engine/smoothing.py` — Signal Processing

**Full file**: `d:\Hisl_hackathon_project\backend\app\engine\smoothing.py`
```python
"""Signal processing for gait angle data."""
import numpy as np
from typing import List

# Try scipy for advanced filtering; fall back to numpy-only if unavailable
try:
    from scipy.signal import savgol_filter
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def interpolate_zeros(data: List[float]) -> List[float]:
    """
    Replace zero values (missed detections) with linearly interpolated values.
    Must be called BEFORE smoothing or outlier removal.
    
    Args:
        data: Raw angle series, zeros indicate missed frames.
    Returns:
        Angle series with zeros replaced by interpolated values.
    """
    if not data:
        return data
    arr = np.array(data, dtype=float)
    zeros = arr == 0
    if zeros.all() or not zeros.any():
        return data
    arr[zeros] = np.interp(
        np.where(zeros)[0],
        np.where(~zeros)[0],
        arr[~zeros]
    )
    return arr.tolist()


def remove_outliers_iqr(data: List[float], multiplier: float = 1.5) -> List[float]:
    """
    Remove statistical outliers using IQR method.
    Outlier values are replaced with NaN, then linearly interpolated.
    
    Args:
        data: Angle series (zeros already interpolated).
        multiplier: IQR multiplier for outlier bounds (default 1.5).
    Returns:
        Cleaned angle series.
    """
    if len(data) < 4:
        return data
    arr = np.array(data, dtype=float)
    q1, q3 = np.percentile(arr, [25, 75])
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    outliers = (arr < lower) | (arr > upper)
    if outliers.any() and not outliers.all():
        arr[outliers] = np.nan
        # Interpolate NaN values
        nans = np.isnan(arr)
        arr[nans] = np.interp(
            np.where(nans)[0],
            np.where(~nans)[0],
            arr[~nans]
        )
    return arr.tolist()


def moving_average(data: List[float], window: int = 5) -> List[float]:
    """
    Apply moving average smoothing.
    Uses 'same' mode to preserve array length.
    
    Args:
        data: Angle series.
        window: Window size (must be odd, default 5).
    Returns:
        Smoothed angle series (same length as input).
    """
    if len(data) < window:
        return data
    arr = np.array(data, dtype=float)
    kernel = np.ones(window) / window
    # Use 'same' mode + handle edges
    smoothed = np.convolve(arr, kernel, mode='same')
    return smoothed.tolist()


def savitzky_golay(data: List[float], window: int = 7, order: int = 3) -> List[float]:
    """
    Apply Savitzky-Golay filter for peak-preserving smoothing.
    Falls back to moving_average if scipy is not installed.
    
    Args:
        data: Angle series.
        window: Window size (must be odd, default 7).
        order: Polynomial order (must be < window, default 3).
    Returns:
        Smoothed angle series.
    """
    if not HAS_SCIPY:
        return moving_average(data, window)
    if len(data) < window:
        return data
    return savgol_filter(data, window, order).tolist()


def smooth_angles(data: List[float], method: str = "savgol") -> List[float]:
    """
    Full smoothing pipeline: interpolate zeros → remove outliers → smooth.
    This is the main entry point for the smoothing module.
    
    Args:
        data: Raw angle series from GaitScanner.
        method: "savgol" (default) or "moving_avg".
    Returns:
        Cleaned and smoothed angle series.
    """
    if not data or len(data) < 3:
        return data
    
    # Step 1: Replace zeros with interpolated values
    result = interpolate_zeros(data)
    
    # Step 2: Remove statistical outliers
    result = remove_outliers_iqr(result)
    
    # Step 3: Apply smoothing filter
    if method == "savgol":
        result = savitzky_golay(result)
    else:
        result = moving_average(result)
    
    return result
```

### 2.4 Create `backend/app/engine/analysis.py` — Improved Metrics

**Full file**: `d:\Hisl_hackathon_project\backend\app\engine\analysis.py`
```python
"""
Gait analysis metrics calculation.

Key difference from old utils.py (now backend/app/utils.py):
- OLD: SI = min(L,R) / max(L,R) — always ≤ 1.0, loses directionality
- NEW: SI = ROM_left / ROM_right — preserves which side is dominant
"""
from typing import List, Optional
from backend.app.schemas import DiagnosisResult, DiagnosisInfo

# Clinical thresholds
SI_LOW_THRESHOLD = 0.85   # Below this = high risk (right-dominant)
SI_HIGH_THRESHOLD = 1.15  # Above this = high risk (left-dominant)
MIN_DETECTION_RATE = 50.0 # Below this = insufficient data


def calculate_rom(angles: List[float]) -> float:
    """
    Calculate Range of Motion = max - min angle.
    
    Args:
        angles: Smoothed angle series for one leg.
    Returns:
        ROM in degrees. Returns 0.0 if insufficient data.
    """
    if not angles or len(angles) < 2:
        return 0.0
    valid = [a for a in angles if a > 0]
    if not valid:
        return 0.0
    return max(valid) - min(valid)


def calculate_symmetry_index(rom_left: float, rom_right: float) -> float:
    """
    Symmetry Index = ROM_left / ROM_right.
    
    Interpretation:
        SI = 1.0  → Perfect symmetry
        SI > 1.15 → Left-dominant asymmetry (abnormal)
        SI < 0.85 → Right-dominant asymmetry (abnormal)
        SI = 0.0  → Cannot calculate (division by zero)
    
    Args:
        rom_left: Range of motion for left leg (degrees).
        rom_right: Range of motion for right leg (degrees).
    Returns:
        Symmetry index as a float.
    """
    if rom_right <= 0:
        return 0.0
    return round(rom_left / rom_right, 4)


def calculate_asymmetry(si: float) -> float:
    """
    Asymmetry percentage = |1 - SI| × 100.
    
    Args:
        si: Symmetry index.
    Returns:
        Asymmetry as a percentage.
    """
    return round(abs(1.0 - si) * 100, 2)


def calculate_confidence(detection_rate: float, si: float) -> float:
    """
    Confidence score based on data quality and clinical significance.
    
    Formula:
        confidence = quality_factor * 0.7 + significance_factor * 0.3
    Where:
        quality_factor = min(detection_rate / 100, 1.0)
        significance_factor = min(|1 - SI| / 0.30, 1.0)
    
    Args:
        detection_rate: Percentage of frames with successful pose detection.
        si: Symmetry index.
    Returns:
        Confidence score between 0.0 and 1.0.
    """
    quality = min(detection_rate / 100.0, 1.0)
    significance = min(abs(1.0 - si) / 0.30, 1.0)
    return round(quality * 0.7 + significance * 0.3, 3)


def get_diagnosis(si: float, detection_rate: float) -> DiagnosisInfo:
    """
    Determine clinical diagnosis from symmetry index and detection rate.
    
    Decision tree:
        1. If detection_rate < 50% → INSUFFICIENT_DATA
        2. If SI < 0.85 or SI > 1.15 → HIGH_RISK
        3. Otherwise → NORMAL
    
    Args:
        si: Symmetry index.
        detection_rate: Percentage of frames with pose detection.
    Returns:
        DiagnosisInfo with result, message, is_high_risk, and confidence.
    """
    confidence = calculate_confidence(detection_rate, si)
    
    if detection_rate < MIN_DETECTION_RATE:
        return DiagnosisInfo(
            result=DiagnosisResult.INSUFFICIENT_DATA,
            message=f"Insufficient pose detection ({detection_rate:.0f}%). "
                    f"Ensure full body is visible in the video.",
            is_high_risk=False,
            confidence=confidence
        )
    
    if si < SI_LOW_THRESHOLD or si > SI_HIGH_THRESHOLD:
        direction = "left-dominant" if si > SI_HIGH_THRESHOLD else "right-dominant"
        asymmetry = calculate_asymmetry(si)
        return DiagnosisInfo(
            result=DiagnosisResult.HIGH_RISK,
            message=f"Significant gait asymmetry detected ({direction}, "
                    f"SI={si:.2f}, asymmetry={asymmetry:.1f}%). "
                    f"Specialist evaluation recommended.",
            is_high_risk=True,
            confidence=confidence
        )
    
    return DiagnosisInfo(
        result=DiagnosisResult.NORMAL,
        message=f"Gait symmetry within normal clinical limits (SI={si:.2f}).",
        is_high_risk=False,
        confidence=confidence
    )
```

### 2.5 Update `GaitScanner` in `backend/app/engine/scanner.py`

**Source**: Already migrated to `d:\Hisl_hackathon_project\backend\app\engine\scanner.py`
**Action**: Update to use new engine submodules

**Changes to make during migration**:
1. Update model path to use `config.MODELS_DIR` or env var
2. Keep all existing MediaPipe logic (process_frame, face blur, skeleton drawing)
3. Do NOT change the angle calculation formula (keep arctan2 approach)
4. Add `__init__` parameter for model path override

```python
# At top of scanner.py, add:
import os
DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', 'models', 'pose_landmarker_heavy.task'
)

class GaitScanner:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or DEFAULT_MODEL_PATH
        # ... rest of existing __init__ with self.model_path instead of hardcoded path
```

### 2.6 Update `process_video()` — Main Entry Point

**Modify** `d:\Hisl_hackathon_project\backend\app\engine\scanner.py` to:
1. Import from `backend.app.engine` submodules instead of inline code
2. Apply smoothing pipeline to raw angles before metric calculation
3. Use new `calculate_symmetry_index` (directional) instead of old one

Key changes in `process_video()`:
```python
from backend.app.engine.scanner import GaitScanner
from backend.app.engine.smoothing import smooth_angles
from backend.app.engine.analysis import (
    calculate_rom, calculate_symmetry_index, 
    calculate_asymmetry, calculate_confidence, get_diagnosis
)
from backend.app.engine.video import validate_video

def process_video(video_path, job_id, output_dir=None, progress_callback=None):
    # Step 0: Validate video
    validation = validate_video(video_path)
    if not validation["valid"]:
        raise ValueError(f"Invalid video: {', '.join(validation['errors'])}")
    
    # ... existing frame loop using GaitScanner ...
    
    # After collecting raw_left_angles and raw_right_angles:
    # Step N: Smooth angles
    left_smooth = smooth_angles(raw_left_angles)
    right_smooth = smooth_angles(raw_right_angles)
    
    # Step N+1: Calculate metrics with NEW formulas
    left_rom = calculate_rom(left_smooth)
    right_rom = calculate_rom(right_smooth)
    si = calculate_symmetry_index(left_rom, right_rom)
    asymmetry = calculate_asymmetry(si)
    detection_rate = (frames_detected / frames_total) * 100
    diagnosis = get_diagnosis(si, detection_rate)
    
    # ... build and return AnalysisResult ...
```

### 2.7 Verify `backend/requirements.txt`

**File**: Already consolidated at `d:\Hisl_hackathon_project\backend\requirements.txt`

Ensure it includes scipy:
```bash
pip install -r backend/requirements.txt
```

---

## Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Module imports | `python -c "from backend.app.engine.scanner import GaitScanner; print('OK')"` | `OK` |
| Video validation | `python -c "from backend.app.engine.video import validate_video; print(validate_video('nonexistent.mp4'))"` | `{'valid': False, 'errors': ['File not found: ...']}` |
| Smoothing works | `python -c "from backend.app.engine.smoothing import smooth_angles; print(smooth_angles([0,150,152,0,148,155,0,151]))"` | List of smoothed values, no zeros |
| SI directional | `python -c "from backend.app.engine.analysis import calculate_symmetry_index; print(calculate_symmetry_index(20.0, 10.0))"` | `2.0` (greater than 1.0) |
| Confidence range | `python -c "from backend.app.engine.analysis import calculate_confidence; c=calculate_confidence(95, 1.0); assert 0<=c<=1; print(c)"` | Value between 0 and 1 |
| Diagnosis logic | `python -c "from backend.app.engine.analysis import get_diagnosis; print(get_diagnosis(0.70, 90).result)"` | `DiagnosisResult.HIGH_RISK` |

---

## Outputs of This Phase
New files:
```
backend/app/engine/__init__.py   (updated exports)
backend/app/engine/scanner.py    (updated to use engine submodules)
backend/app/engine/analysis.py   (new metric calculations)
backend/app/engine/smoothing.py  (new signal processing)
backend/app/engine/video.py      (new video validation)
```
