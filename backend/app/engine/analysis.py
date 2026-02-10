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
