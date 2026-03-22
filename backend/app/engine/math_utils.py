import numpy as np
from scipy.signal import butter, filtfilt

def apply_smoothing(data: list[float] | np.ndarray, cutoff: float = 6.0, fs: float = 30.0, order: int = 4) -> np.ndarray:
    """
    Applies a zero-phase 4th-order low-pass Butterworth filter.
    Clinical necessity for MediaPipe jitter removal.
    """
    if len(data) <= order * 3:
        # Not enough data to filter safely, return as is or pad (here we just return)
        return np.array(data)
        
    nyquist = 0.5 * fs
    normal_cutoff = cutoff / nyquist
    b, a = butter(order, normal_cutoff, btype='low', analog=False)
    
    # Pad the data to prevent edge artifacts
    return filtfilt(b, a, data)

def project_vector_2d(v: np.ndarray, plane: str) -> np.ndarray:
    """
    Projects a 3D vector (x, y, z) onto a 2D plane.
    plane: 'frontal' (x, y) - ignores z
           'sagittal' (y, z) - ignores x
           'transverse' (x, z) - ignores y
    """
    if plane == 'frontal':
        return np.array([v[0], v[1]])
    elif plane == 'sagittal':
        return np.array([v[1], v[2]])
    elif plane == 'transverse':
        return np.array([v[0], v[2]])
    else:
        raise ValueError("Invalid plane")

def calculate_angle_2d(v1: np.ndarray, v2: np.ndarray) -> float:
    """
    Calculates the angle in degrees between two 2D vectors.
    """
    unit_v1 = v1 / np.linalg.norm(v1) if np.linalg.norm(v1) != 0 else v1
    unit_v2 = v2 / np.linalg.norm(v2) if np.linalg.norm(v2) != 0 else v2
    dot_product = np.dot(unit_v1, unit_v2)
    # Clip to avoid floating point errors out of [-1, 1]
    angle = np.arccos(np.clip(dot_product, -1.0, 1.0))
    return np.degrees(angle)

def calculate_angle_3d_projected(p1: np.ndarray, p_vertex: np.ndarray, p2: np.ndarray, plane: str) -> float:
    """
    Calculates the interior angle at p_vertex formed by p1-p_vertex and p2-p_vertex, projected onto a plane.
    """
    v1 = p1 - p_vertex
    v2 = p2 - p_vertex
    
    v1_proj = project_vector_2d(v1, plane)
    v2_proj = project_vector_2d(v2, plane)
    
    return calculate_angle_2d(v1_proj, v2_proj)

def calculate_pelvic_tilt(left_hip: np.ndarray, right_hip: np.ndarray) -> float:
    """
    Calculates the spatial horizontal tilt angle between Left Hip (23) and Right Hip (24).
    """
    dy = right_hip[1] - left_hip[1]
    dx = right_hip[0] - left_hip[0]
    
    # arctan2(dy, dx) gives angle in radians from positive x-axis.
    angle = np.degrees(np.arctan2(dy, dx))
    
    # We care about the deviation from a flat 0 degrees horizontal line.
    if angle > 90:
        angle -= 180
    elif angle < -90:
        angle += 180
        
    return angle

def calculate_foot_progression_angle(heel: np.ndarray, toe: np.ndarray) -> float:
    """
    Calculates the foot progression angle on the transverse plane (X, Z).
    Calculates angle relative to the depth axis (Z). 
    In MediaPipe, -Z points towards the camera.
    """
    dx = toe[0] - heel[0]
    dz = toe[2] - heel[2]
    
    # We want angle relative to pointing straight at the camera (dx=0, dz<0)
    # arctan2(y, x) -> we map y to dx, x to -dz
    angle = np.degrees(np.arctan2(dx, -dz))
    
    return angle

def calculate_dorsiflexion_angle(knee: np.ndarray, ankle: np.ndarray, heel: np.ndarray, toe: np.ndarray) -> float:
    """
    Calculates the ankle dorsiflexion angle projected on the sagittal plane (Y, Z).
    Tibial vector: Ankle to Knee.
    Foot vector: Heel to Toe.
    
    Standing flat is normally ~90 degrees.
    Plantarflexion > 90 (toes pointed down).
    Dorsiflexion < 90 (toes pointed up).
    """
    tibial = knee - ankle
    foot = toe - heel
    
    tibial_sag = project_vector_2d(tibial, 'sagittal')
    foot_sag = project_vector_2d(foot, 'sagittal')
    
    return calculate_angle_2d(tibial_sag, foot_sag)

def calculate_shoulder_tilt(left_shoulder: np.ndarray, right_shoulder: np.ndarray) -> float:
    """
    Calculates the spatial horizontal tilt angle between Left Shoulder (11) and Right Shoulder (12).
    """
    dy = right_shoulder[1] - left_shoulder[1]
    dx = right_shoulder[0] - left_shoulder[0]
    
    angle = np.degrees(np.arctan2(dy, dx))
    
    # We care about the deviation from a flat 0 degrees horizontal line.
    if angle > 90:
        angle -= 180
    elif angle < -90:
        angle += 180
        
    return angle

def calculate_trunk_sway(left_shoulder: np.ndarray, right_shoulder: np.ndarray, left_hip: np.ndarray, right_hip: np.ndarray) -> float:
    """
    Calculates the trunk sway angle (deviation from vertical) using midpoints.
    """
    shoulder_mid = (left_shoulder + right_shoulder) / 2.0
    hip_mid = (left_hip + right_hip) / 2.0

    # y goes down in image coords, so hip_y > shoulder_y
    dy = hip_mid[1] - shoulder_mid[1]
    dx = hip_mid[0] - shoulder_mid[0]

    angle_from_horizontal = np.degrees(np.arctan2(dy, dx))

    # Deviation from vertical (90 degrees). Perfect upright = 0 sway.
    sway = 90.0 - angle_from_horizontal

    return sway


# =============================================================================
# INITIAL CONTACT (IC) DETECTION AND NORMALIZATION
# For improved knee valgus accuracy (reduces MediaPipe error from ±19° to <5°)
# Research: PMC11399566 (2024) - IC-normalization eliminates systematic bias
# =============================================================================

def detect_initial_contact(
    left_ankle_y: list[float],
    right_ankle_y: list[float],
    left_knee_y: list[float],
    right_knee_y: list[float],
    fps: float = 30.0
) -> tuple[list[int], list[int]]:
    """
    Detect initial contact (IC) frames for left and right legs using ankle-knee relationship.
    
    Biomechanical Basis:
    - Initial contact occurs when the foot first touches the ground
    - At IC: ankle Y position reaches local minimum (lowest point in gait cycle)
    - Ankle is below knee level during stance phase
    
    Args:
        left_ankle_y: Y-coordinates of left ankle over time (normalized 0-1)
        right_ankle_y: Y-coordinates of right ankle over time
        left_knee_y: Y-coordinates of left knee over time
        right_knee_y: Y-coordinates of right knee over time
        fps: Video frame rate (default 30 fps)
    
    Returns:
        Tuple of (left_ic_indices, right_ic_indices) - frame indices of IC events
    """
    if not left_ankle_y or len(left_ankle_y) < 10:
        return [], []
    
    arr_left_ankle = np.array(left_ankle_y)
    arr_right_ankle = np.array(right_ankle_y)
    arr_left_knee = np.array(left_knee_y)
    arr_right_knee = np.array(right_knee_y)
    
    # Find local minima in ankle Y trajectory (ankle reaches lowest point at IC)
    # In image coordinates, Y increases downward, so minima = lowest physical position
    left_ic_indices = _find_local_minima(arr_left_ankle, min_distance=int(fps * 0.3))
    right_ic_indices = _find_local_minima(arr_right_ankle, min_distance=int(fps * 0.3))
    
    # Validate: at IC, ankle should be below or level with knee
    left_ic_valid = []
    for idx in left_ic_indices:
        if idx < len(arr_left_knee) and arr_left_ankle[idx] >= arr_left_knee[idx] * 0.95:
            left_ic_valid.append(idx)
    
    right_ic_valid = []
    for idx in right_ic_indices:
        if idx < len(arr_right_knee) and arr_right_ankle[idx] >= arr_right_knee[idx] * 0.95:
            right_ic_valid.append(idx)
    
    # If no valid IC found, use first detected minimum
    if not left_ic_valid and left_ic_indices:
        left_ic_valid = [left_ic_indices[0]]
    if not right_ic_valid and right_ic_indices:
        right_ic_valid = [right_ic_indices[0]]
    
    return left_ic_valid, right_ic_valid


def _find_local_minima(data: np.ndarray, min_distance: int = 10) -> list[int]:
    """
    Find local minima in 1D signal with minimum distance constraint.
    
    Args:
        data: 1D numpy array
        min_distance: Minimum number of samples between minima
    
    Returns:
        List of indices where local minima occur
    """
    if len(data) < 3:
        return []
    
    minima = []
    i = 1
    while i < len(data) - 1:
        # Check if current point is a local minimum
        if data[i] < data[i-1] and data[i] < data[i+1]:
            # Check minimum distance from previous minimum
            if not minima or (i - minima[-1]) >= min_distance:
                minima.append(i)
            else:
                # Replace previous minimum if current is lower
                if data[i] < data[minima[-1]]:
                    minima[-1] = i
        i += 1
    
    return minima


def apply_ic_normalization(
    angle_array: list[float],
    ic_indices: list[int],
    method: str = "mean"
) -> list[float]:
    """
    Apply Initial Contact normalization to angle array.
    
    Research Basis:
    - MediaPipe Pose shows ±18.83° absolute error for knee valgus vs. VICON
    - IC-normalization (subtracting IC angle) reduces error to <5°
    - Removes systematic bias from absolute angle measurements
    [PMC11399566 (2024)]
    
    Args:
        angle_array: Raw angle measurements over time
        ic_indices: Frame indices of initial contact events
        method: Normalization method
            - "mean": Subtract mean angle at IC frames
            - "first": Subtract angle at first IC frame
            - "median": Subtract median angle at IC frames
    
    Returns:
        IC-normalized angle array (same length as input)
    """
    if not angle_array or not ic_indices:
        return angle_array
    
    arr = np.array(angle_array, dtype=float)
    
    # Get IC angles (only valid, non-zero values)
    ic_angles = [arr[idx] for idx in ic_indices if idx < len(arr) and arr[idx] > 0]
    
    if not ic_angles:
        return angle_array
    
    # Calculate reference angle based on method
    if method == "mean":
        reference_angle = np.mean(ic_angles)
    elif method == "median":
        reference_angle = np.median(ic_angles)
    elif method == "first":
        reference_angle = ic_angles[0]
    else:
        reference_angle = np.mean(ic_angles)
    
    # Normalize: subtract reference angle from all measurements
    normalized = arr - reference_angle
    
    # Preserve zero values (missed detections)
    zero_mask = arr == 0
    normalized[zero_mask] = 0.0
    
    return normalized.tolist()


def calculate_ic_normalized_valgus(
    left_valgus_angles: list[float],
    right_valgus_angles: list[float],
    left_ankle_y: list[float],
    right_ankle_y: list[float],
    left_knee_y: list[float],
    right_knee_y: list[float],
    fps: float = 30.0
) -> tuple[float, float, list[float], list[float]]:
    """
    Calculate IC-normalized knee valgus angles for both legs.
    
    This is the recommended method for knee valgus analysis with MediaPipe,
    as it eliminates systematic bias and reduces error from ±19° to <5°.
    
    Args:
        left_valgus_angles: Raw left knee valgus angles over time
        right_valgus_angles: Raw right knee valgus angles over time
        left_ankle_y: Left ankle Y-coordinates for IC detection
        right_ankle_y: Right ankle Y-coordinates for IC detection
        left_knee_y: Left knee Y-coordinates for IC validation
        right_knee_y: Right knee Y-coordinates for IC validation
        fps: Video frame rate
    
    Returns:
        Tuple of (avg_left_valgus, avg_right_valgus, left_normalized_array, right_normalized_array)
    """
    # Detect initial contact frames
    left_ic, right_ic = detect_initial_contact(
        left_ankle_y, right_ankle_y, left_knee_y, right_knee_y, fps
    )
    
    # Apply IC normalization
    left_normalized = apply_ic_normalization(left_valgus_angles, left_ic, method="mean")
    right_normalized = apply_ic_normalization(right_valgus_angles, right_ic, method="mean")
    
    # Calculate average normalized valgus (only valid values)
    left_valid = [v for v in left_normalized if v != 0.0]
    right_valid = [v for v in right_normalized if v != 0.0]
    
    avg_left = np.mean(left_valid) if left_valid else 0.0
    avg_right = np.mean(right_valid) if right_valid else 0.0
    
    return avg_left, avg_right, left_normalized, right_normalized

