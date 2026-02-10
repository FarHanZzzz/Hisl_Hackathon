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
