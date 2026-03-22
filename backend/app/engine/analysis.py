"""
Gait analysis metrics calculation.

Key difference from old utils.py (now backend/app/utils.py):
- OLD: SI = min(L,R) / max(L,R) — always ≤ 1.0, loses directionality
- NEW: SI = ROM_left / ROM_right — preserves which side is dominant

Clinical Thresholds (Evidence-Based):
- Symmetry Index: 0.85–1.15 normal (±15% asymmetry) [MDPI 2023, Wu & Wu]
- Detection Rate: ≥50% minimum for valid screening [MDPI Sensors 2023]
- Scoliosis: ≥5° shoulder-pelvic divergence [MDPI JCM 2025, 94% sensitivity]
- Knee Valgus: 170–190° normal (±10° from 180°) [POSNA, PubMed]
- Ankle Equinus: >100° (plantarflexion, toes down) [MeloQ Devices 2025]
- Ankle Calcaneus: <75° (dorsiflexion, toes up) [Paragon Orthotic]
- Trunk Sway (DMD): >15° variance (heuristic, requires validation)
"""
from typing import List, Optional
from backend.app.schemas import DiagnosisResult, DiagnosisInfo

# =============================================================================
# CLINICAL THRESHOLDS (Evidence-Based)
# =============================================================================

# Symmetry Index thresholds (ROM_left / ROM_right ratio)
SI_LOW_THRESHOLD = 0.85    # Below = right-dominant asymmetry (high risk)
SI_HIGH_THRESHOLD = 1.15   # Above = left-dominant asymmetry (high risk)
# Equivalent to ±15% asymmetry, validated by MDPI 2023 comparative analysis

# Minimum detection rate for valid screening
MIN_DETECTION_RATE = 50.0  # Below = insufficient data (conservative threshold)

# Scoliosis screening threshold (shoulder-pelvic divergence angle)
SCOLIOSIS_DIVERGENCE_THRESHOLD = 5.0  # degrees [MDPI J Clin Med 2025]
# 5° threshold provides 94% sensitivity for curves ≥20°
# Specificity: 97% at this threshold

# Knee valgus/varum thresholds (frontal plane angle, 180° = neutral)
KNEE_VARUM_THRESHOLD = 170.0   # Below = genu varum (bowlegs)
KNEE_VALGUM_THRESHOLD = 190.0  # Above = genu valgum (knock-knees)
# Based on POSNA guidelines: 2° varus to 20° valgus normal in children

# Ankle dorsiflexion thresholds (sagittal plane projection, 90° = flat foot)
EQUINUS_THRESHOLD = 100.0      # Above = equinus gait (toes down, plantarflexion)
CALCANEUS_THRESHOLD = 75.0     # Below = calcaneus gait (toes up, dorsiflexion)
# Reference: 90° = neutral; >90° = plantarflexion; <90° = dorsiflexion
# Minimum 10° dorsiflexion (80° projection) required for normal gait [MeloQ 2025]

# Trunk sway threshold for DMD screening (variance from vertical)
TRUNK_SWAY_VARIANCE_THRESHOLD = 15.0  # degrees² (heuristic)
# TODO: This threshold requires clinical validation
# Current literature does not establish specific degree thresholds for DMD
# Based on observed waddling gait patterns in neuromuscular conditions


def calculate_rom(angles: List[float]) -> float:
    """
    Calculate Range of Motion = max - min angle.
    A valid ROM requires a minimum number of detected points to be credible.
    
    Args:
        angles: Smoothed angle series for one leg.
    Returns:
        ROM in degrees. Returns 0.0 if insufficient data.
    """
    if not angles or len(angles) < 5:
        return 0.0
    valid = [a for a in angles if a > 0]
    # We need at least some variety in data to call it a 'Range of Motion'
    if len(valid) < 5:
        return 0.0
    return round(max(valid) - min(valid), 2)


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


def get_diagnosis(
    si: float, 
    detection_rate: float, 
    knee_valgus_angle: float = 180.0, 
    pelvic_tilt_variance: float = 0.0, 
    max_pelvic_tilt: float = 0.0, 
    most_equinus: float = 90.0, 
    most_calcaneus: float = 90.0,
    trunk_sway_variance: float = 0.0,
    smoothed_shoulder_tilts: list[float] = None,
    smoothed_pelvic_tilts: list[float] = None
) -> DiagnosisInfo:
    """
    Determine clinical diagnosis from symmetry index, detection rate, and orthopedic features.
    
    Decision tree:
        1. If detection_rate < 50% → INSUFFICIENT_DATA
        2. If SI < 0.85 or SI > 1.15 → HIGH_RISK
        3. Determine Rickets heuristics (Genu Varus / Valgus)
        4. Determine LLD / Trendelenburg compensation
        5. Determine Clubfoot kinematics (Equinus / Calcaneus)
        6. Determine Neuromuscular kinematics (DMD Waddling / Toe-Walking)
    
    Args:
        si: Symmetry index.
        detection_rate: Percentage of frames with pose detection.
        knee_valgus_angle: Average frontal plane knee angle.
        pelvic_tilt_variance: Variance of the pelvic tilt over time.
        max_pelvic_tilt: Max absolute tilt deviation from horizontal.
        most_equinus: Worst-case minimum dorsiflexion angle.
        most_calcaneus: Worst-case maximum dorsiflexion angle.
        trunk_sway_variance: Variance of trunk sway for DMD detection.
        smoothed_shoulder_tilts: Array of shoulder tilts for Phase 3.
        smoothed_pelvic_tilts: Array of pelvic tilts for Phase 3.
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
    is_high_risk_flag = False
    
    # Phase 2: Rickets heuristics
    # Knee valgus angle: frontal plane angle where 180° = neutral alignment
    # Genu varum (bowlegs): <170° (interior angle <170°)
    # Genu valgum (knock-knees): >190° (interior angle >190°)
    # Thresholds based on POSNA guidelines and PubMed normative data
    if knee_valgus_angle < KNEE_VARUM_THRESHOLD:
        orthopedic_alerts.append(f"Genu Varum Detected (Bowlegs, {knee_valgus_angle:.1f}°)")
        is_high_risk_flag = True
    elif knee_valgus_angle > KNEE_VALGUM_THRESHOLD:
        orthopedic_alerts.append(f"Genu Valgum Detected (Knock-knees, {knee_valgus_angle:.1f}°)")
        is_high_risk_flag = True
        
    # Phase 3: LLD heuristics (Trendelenburg gait)
    # Pelvic tilt variance >10° or amplitude >8° suggests leg length discrepancy
    if pelvic_tilt_variance > 10.0 or max_pelvic_tilt > 8.0:
        orthopedic_alerts.append(f"Trendelenburg Gait / Potential LLD (Max tilt: {max_pelvic_tilt:.1f}°, Var: {pelvic_tilt_variance:.1f})")
        is_high_risk_flag = True

    # Phase 4: Clubfoot kinematics (Equinus / Calcaneus)
    # Ankle dorsiflexion measured as sagittal plane projection angle
    # Reference: 90° = neutral (flat foot), >90° = plantarflexion (toes down), <90° = dorsiflexion (toes up)
    # Equinus: minimum dorsiflexion >100° (never gets heel down during gait cycle)
    # Calcaneus: maximum dorsiflexion <75° (never points toes down during gait cycle)
    if most_equinus > EQUINUS_THRESHOLD:
        orthopedic_alerts.append(f"Equinus Gait Detected (Limited Dorsiflexion, Min: {most_equinus:.1f}°)")
        is_high_risk_flag = True
    elif most_calcaneus < CALCANEUS_THRESHOLD:
        orthopedic_alerts.append(f"Calcaneus Gait Detected (Excessive Dorsiflexion, Max: {most_calcaneus:.1f}°)")
        is_high_risk_flag = True
        
    # Phase 7 (Subphase 2): Neuromuscular DMD Logic
    neuromuscular_alerts = []
    has_dmd = False
    # Trunk sway variance threshold is heuristic (requires clinical validation)
    # DMD waddling gait characterized by excessive lateral trunk motion
    if trunk_sway_variance > TRUNK_SWAY_VARIANCE_THRESHOLD:
        neuromuscular_alerts.append(f"DMD Waddling Profile Detected (Trunk Sway Var: {trunk_sway_variance:.1f})")
        has_dmd = True
    if most_equinus > 110.0:
        neuromuscular_alerts.append(f"DMD Toe-Walking Risk (Severe Continuous Plantarflexion: {most_equinus:.1f}°)")
        has_dmd = True

    # Phase 7 (Subphase 3): Early-Onset Scoliosis Screening (Postural Asymmetry Vector)
    has_scoliosis = False
    if smoothed_shoulder_tilts and smoothed_pelvic_tilts and len(smoothed_shoulder_tilts) == len(smoothed_pelvic_tilts):
        divergences = [abs(s - p) for s, p in zip(smoothed_shoulder_tilts, smoothed_pelvic_tilts)]
        avg_divergence = sum(divergences) / len(divergences) if divergences else 0.0

        # Evidence-based threshold: 5° provides 94% sensitivity for curves ≥20°
        # [MDPI Journal of Clinical Medicine 2025]
        if avg_divergence > SCOLIOSIS_DIVERGENCE_THRESHOLD:
            neuromuscular_alerts.append(f"Scoliosis Risk Protocol Recommended (Postural Asymmetry: {avg_divergence:.1f}°)")
            has_scoliosis = True
            
    is_asymmetric = si < SI_LOW_THRESHOLD or si > SI_HIGH_THRESHOLD
    if is_asymmetric:
        is_high_risk_flag = True
        
    # Determine final category
    if has_dmd:
        final_category = DiagnosisResult.DMD_RISK
        is_high_risk_flag = True
    elif has_scoliosis:
        final_category = DiagnosisResult.SCOLIOSIS_RISK
        is_high_risk_flag = True
    elif is_high_risk_flag:
        final_category = DiagnosisResult.HIGH_RISK
    else:
        final_category = DiagnosisResult.NORMAL

    # Build final message
    if is_asymmetric:
        direction = "left-dominant" if si > SI_HIGH_THRESHOLD else "right-dominant"
        asymmetry = calculate_asymmetry(si)
        base_msg = f"Significant gait asymmetry detected ({direction}, SI={si:.2f}, asymmetry={asymmetry:.1f}%)."
    else:
        base_msg = f"Gait symmetry within normal clinical limits (SI={si:.2f})."
        
    all_alerts = orthopedic_alerts + neuromuscular_alerts
    if all_alerts:
        final_msg = f"{base_msg} Alerts: {' | '.join(all_alerts)}"
    else:
        final_msg = base_msg
        
    return DiagnosisInfo(
        result=final_category,
        message=final_msg,
        is_high_risk=is_high_risk_flag,
        confidence=confidence
    )
