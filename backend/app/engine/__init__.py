"""Core gait analysis engine."""
from .analysis import (
    calculate_symmetry_index,
    calculate_rom,
    calculate_asymmetry,
    calculate_confidence,
    get_diagnosis,
)
from .smoothing import smooth_angles
from .video import validate_video

# GaitScanner requires mediapipe — import lazily to allow
# other submodules to work without it installed.
try:
    from .scanner import GaitScanner
except ImportError:
    GaitScanner = None
