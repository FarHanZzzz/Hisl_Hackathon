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

