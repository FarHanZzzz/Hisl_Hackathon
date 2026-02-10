"""
Shared utility functions for Pedi-Growth.
Consolidated from shared/utils.py — imports now reference backend.app.schemas.
"""

import numpy as np
from typing import Tuple, Optional
from .schemas import (
    SI_LOW_THRESHOLD,
    SI_HIGH_THRESHOLD,
    DiagnosisResult,
    DiagnosisInfo,
)


def calculate_angle(a: list, b: list, c: list) -> Optional[float]:
    """
    Calculates the angle at point b given three points a, b, and c.
    Uses numpy.arctan2 for robust angle calculation.

    Args:
        a: First point (e.g., hip) as [x, y]
        b: Middle point (e.g., knee - vertex) as [x, y]
        c: Third point (e.g., ankle) as [x, y]

    Returns:
        Angle in degrees (0-180), or None if any input is None
    """
    if a is None or b is None or c is None:
        return None

    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle


def calculate_symmetry_index(max_left: float, max_right: float) -> float:
    """
    Calculate Symmetry Index (SI) as per clinical definition.
    SI = max(ROM_left) / max(ROM_right)

    Args:
        max_left: Maximum left knee flexion
        max_right: Maximum right knee flexion

    Returns:
        Symmetry Index (0 if right is 0)
    """
    if max_right <= 0:
        return 0.0
    return max_left / max_right


def get_diagnosis(symmetry_index: float, detection_rate: float) -> DiagnosisInfo:
    """
    Determine diagnosis based on Symmetry Index and detection quality.

    Args:
        symmetry_index: Computed SI value
        detection_rate: Percentage of frames with successful pose detection

    Returns:
        DiagnosisInfo with result, message, and confidence
    """
    # Check for insufficient data
    if detection_rate < 50.0:
        return DiagnosisInfo(
            result=DiagnosisResult.INSUFFICIENT_DATA,
            message="Insufficient pose detection. Please ensure full body is visible.",
            is_high_risk=False,
            confidence=0.0,
        )

    asymmetry_pct = abs(1.0 - symmetry_index) * 100

    # Determine diagnosis
    if symmetry_index < SI_LOW_THRESHOLD or symmetry_index > SI_HIGH_THRESHOLD:
        # High risk
        if symmetry_index < SI_LOW_THRESHOLD:
            side = "left"
            message = f"Significant asymmetry detected. Left leg shows reduced flexion (SI={symmetry_index:.2f}). Possible left-side impairment."
        else:
            side = "right"
            message = f"Significant asymmetry detected. Right leg shows reduced flexion (SI={symmetry_index:.2f}). Possible right-side impairment."

        # Confidence based on detection rate and asymmetry magnitude
        confidence = min(detection_rate / 100, 0.95) * min(asymmetry_pct / 30, 1.0)

        return DiagnosisInfo(
            result=DiagnosisResult.HIGH_RISK,
            message=message,
            is_high_risk=True,
            confidence=confidence,
        )
    else:
        # Normal
        confidence = min(detection_rate / 100, 0.95)

        return DiagnosisInfo(
            result=DiagnosisResult.NORMAL,
            message=f"Gait symmetry within normal clinical limits (SI={symmetry_index:.2f}).",
            is_high_risk=False,
            confidence=confidence,
        )


def clean_angle_data(angles: list) -> Tuple[list, float, float, float]:
    """
    Clean angle data by filtering invalid values.

    Args:
        angles: Raw angle values (may contain None, 0, or invalid values)

    Returns:
        Tuple of (clean_values, max_flexion, min_flexion, range_of_motion)
    """
    clean = [x for x in angles if x is not None and x > 0]

    if not clean:
        return [], 0.0, 0.0, 0.0

    max_flexion = float(np.max(clean))
    min_flexion = float(np.min(clean))
    rom = max_flexion - min_flexion

    return clean, max_flexion, min_flexion, rom
