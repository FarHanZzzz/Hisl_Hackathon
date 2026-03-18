"""Signal processing for gait angle data."""
import numpy as np
from typing import List

# Try scipy for advanced filtering; fall back to numpy-only if unavailable
try:
    from scipy.signal import savgol_filter
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def interpolate_zeros(data: List[float], max_gap: int = 15) -> List[float]:
    """
    Replace zero values (missed detections) with linearly interpolated values,
    but ONLY for gaps smaller than max_gap. Large gaps remain zero to avoid 
    misleading 'flat' segments.
    
    Args:
        data: Raw angle series, zeros indicate missed frames.
        max_gap: Maximum number of consecutive zeros to interpolate.
    Returns:
        Angle series with small gaps interpolated.
    """
    if not data or len(data) < 2:
        return data
        
    arr = np.array(data, dtype=float)
    zeros = arr == 0
    if not zeros.any() or zeros.all():
        return data

    # Find indices of non-zero elements
    valid_indices = np.where(~zeros)[0]
    
    # If we have very few points, don't interpolate at all
    if len(valid_indices) < 2:
        return data

    # Identify gaps
    new_arr = arr.copy()
    for i in range(len(valid_indices) - 1):
        start_idx = valid_indices[i]
        end_idx = valid_indices[i+1]
        gap_size = end_idx - start_idx - 1
        
        if 0 < gap_size <= max_gap:
            # Short gap, safe to interpolate
            interp_range = np.arange(start_idx + 1, end_idx)
            new_arr[interp_range] = np.interp(
                interp_range,
                [start_idx, end_idx],
                [arr[start_idx], arr[end_idx]]
            )
            
    return new_arr.tolist()


def remove_outliers_iqr(data: List[float], multiplier: float = 1.5) -> List[float]:
    """
    Remove statistical outliers using IQR method, considering ONLY non-zero values.
    Outlier values are replaced with NaN, then linearly interpolated.
    """
    if not data or len(data) < 4:
        return data
        
    arr = np.array(data, dtype=float)
    valid_mask = arr > 0
    valid_data = arr[valid_mask]
    
    if len(valid_data) < 4:
        return data
        
    q1, q3 = np.percentile(valid_data, [25, 75])
    iqr = q3 - q1
    lower = q1 - multiplier * iqr
    upper = q3 + multiplier * iqr
    
    # Identify outliers only among the valid data
    outliers_mask = valid_mask & ((arr < lower) | (arr > upper))
    
    if outliers_mask.any():
        arr[outliers_mask] = np.nan
        # Interpolate NaN values using remaining valid data
        nans = np.isnan(arr)
        if not nans.all():
            arr[nans] = np.interp(
                np.where(nans)[0],
                np.where(~nans & valid_mask)[0],
                arr[~nans & valid_mask]
            )
            # Ensure we don't accidentally fill the original zeros that were not outliers
            # Wait, if we interpolate NaN, we might fill the whole array if we are not careful.
            # Actually, we ONLY want to fill the specific points that WERE outliers.
            # So we should only update arr where outliers_mask was True.
            arr_with_fixed_outliers = np.array(data, dtype=float)
            arr_with_fixed_outliers[outliers_mask] = arr[outliers_mask]
            return arr_with_fixed_outliers.tolist()
            
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
    Full smoothing pipeline: interpolate small gaps → remove outliers → segment-wise smoothing.
    Processing segments individually prevents 'ringing' artifacts at detection boundaries.
    """
    if not data or len(data) < 3:
        return data
    
    # Step 1: Replace small gaps of zeros with interpolated values
    # Large gaps remain zero to mark detection breaks.
    data_interp = interpolate_zeros(data)
    
    # Step 2: Remove statistical outliers (ignores zeros)
    data_cleaned = remove_outliers_iqr(data_interp)
    
    # Step 3: Segment-wise smoothing
    arr = np.array(data_cleaned, dtype=float)
    zeros = arr == 0
    if zeros.all():
        return data_cleaned
        
    final_output = np.zeros_like(arr)
    
    # Identify contiguous non-zero segments
    is_data = ~zeros
    # Find transitions
    diff = np.diff(is_data.astype(int), prepend=0, append=0)
    starts = np.where(diff == 1)[0]
    ends = np.where(diff == -1)[0]
    
    for start, end in zip(starts, ends):
        segment = arr[start:end].tolist()
        if len(segment) < 3:
            # Too short to smooth, just copy
            final_output[start:end] = segment
            continue
            
        # Smooth this specific segment
        if method == "savgol":
            smoothed_segment = savitzky_golay(segment)
        else:
            smoothed_segment = moving_average(segment)
            
        final_output[start:end] = smoothed_segment
        
    return final_output.tolist()
