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


def get_diagnosis(si: float, detection_rate: float, knee_valgus_angle: float = 180.0, pelvic_tilt_variance: float = 0.0, max_pelvic_tilt: float = 0.0, most_equinus: float = 90.0, most_calcaneus: float = 90.0) -> DiagnosisInfo:
    """
    Determine clinical diagnosis from symmetry index, detection rate, and orthopedic features.
    
    Decision tree:
        1. If detection_rate < 50% → INSUFFICIENT_DATA
        2. If SI < 0.85 or SI > 1.15 → HIGH_RISK
        3. Determine Rickets heuristics (Genu Varus / Valgus)
        4. Determine LLD / Trendelenburg compensation
        5. Determine Clubfoot kinematics (Equinus / Calcaneus)
    
    Args:
        si: Symmetry index.
        detection_rate: Percentage of frames with pose detection.
        knee_valgus_angle: Average frontal plane knee angle.
        pelvic_tilt_variance: Variance of the pelvic tilt over time.
        max_pelvic_tilt: Max absolute tilt deviation from horizontal.
        most_equinus: Worst-case minimum dorsiflexion angle.
        most_calcaneus: Worst-case maximum dorsiflexion angle.
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
        
    orthopedic_alerts = []
    
    # Phase 2: Rickets heuristics
    if knee_valgus_angle < 170.0:
        orthopedic_alerts.append(f"Genu Varum Detected (Bowlegs, {knee_valgus_angle:.1f}°)")
    elif knee_valgus_angle > 190.0:
        orthopedic_alerts.append(f"Genu Valgum Detected (Knock-knees, {knee_valgus_angle:.1f}°)")
    else:
        orthopedic_alerts.append(f"Normal Mechanical Axis ({knee_valgus_angle:.1f}°)")
        
    # Phase 3: LLD heuristics (Trendelenburg gait)
    if pelvic_tilt_variance > 10.0 or max_pelvic_tilt > 8.0:
        orthopedic_alerts.append(f"Trendelenburg Gait / Potential LLD (Max tilt: {max_pelvic_tilt:.1f}°, Var: {pelvic_tilt_variance:.1f})")
        
    # Phase 4: Clubfoot kinematics (Equinus / Calcaneus)
    if most_equinus > 100.0:
        orthopedic_alerts.append(f"Equinus Gait Detected (Limited Dorsiflexion, Min: {most_equinus:.1f}°)")
    elif most_calcaneus < 75.0:
        orthopedic_alerts.append(f"Calcaneus Gait Detected (Excessive Dorsiflexion, Max: {most_calcaneus:.1f}°)")
        
    orthopedic_str = " | ".join(orthopedic_alerts)
    
    if si < SI_LOW_THRESHOLD or si > SI_HIGH_THRESHOLD:
        direction = "left-dominant" if si > SI_HIGH_THRESHOLD else "right-dominant"
        asymmetry = calculate_asymmetry(si)
        return DiagnosisInfo(
            result=DiagnosisResult.HIGH_RISK,
            message=f"Significant gait asymmetry detected ({direction}, "
                    f"SI={si:.2f}, asymmetry={asymmetry:.1f}%). {orthopedic_str}",
            is_high_risk=True,
            confidence=confidence
        )
    
    return DiagnosisInfo(
        result=DiagnosisResult.NORMAL,
        message=f"Gait symmetry within normal clinical limits (SI={si:.2f}). {orthopedic_str}",
        is_high_risk=False,
        confidence=confidence
    )
