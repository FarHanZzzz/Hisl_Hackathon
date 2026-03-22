"""
Comprehensive validation tests for gait analysis calculations.

These tests verify the mathematical accuracy and clinical validity of all
calculation functions used in Pedi-Growth gait analysis.

Test Categories:
1. Angle calculations
2. Symmetry Index calculations
3. Signal processing (smoothing, outlier removal)
4. IC-normalization (Initial Contact)
5. Clinical threshold validations
"""

import pytest
import numpy as np
from backend.app.engine.math_utils import (
    calculate_angle_2d,
    calculate_angle_3d_projected,
    calculate_pelvic_tilt,
    calculate_foot_progression_angle,
    calculate_dorsiflexion_angle,
    calculate_shoulder_tilt,
    calculate_trunk_sway,
    detect_initial_contact,
    apply_ic_normalization,
    calculate_ic_normalized_valgus,
    _find_local_minima,
    apply_smoothing,
)
from backend.app.engine.analysis import (
    calculate_rom,
    calculate_symmetry_index,
    calculate_asymmetry,
    calculate_confidence,
    get_diagnosis,
    SI_LOW_THRESHOLD,
    SI_HIGH_THRESHOLD,
    MIN_DETECTION_RATE,
    SCOLIOSIS_DIVERGENCE_THRESHOLD,
    KNEE_VARUM_THRESHOLD,
    KNEE_VALGUM_THRESHOLD,
    EQUINUS_THRESHOLD,
    CALCANEUS_THRESHOLD,
    TRUNK_SWAY_VARIANCE_THRESHOLD,
)
from backend.app.utils import calculate_angle, clean_angle_data
from backend.app.schemas import DiagnosisResult


# =============================================================================
# TEST 1: Basic Angle Calculations
# =============================================================================

class TestAngleCalculations:
    """Test suite for angle calculation accuracy."""
    
    def test_calculate_angle_straight_line(self):
        """Test angle calculation for straight line (should be 180°)."""
        a = [0, 0]
        b = [1, 0]
        c = [2, 0]
        angle = calculate_angle(a, b, c)
        assert angle == pytest.approx(180.0, abs=0.1)
    
    def test_calculate_angle_right_angle(self):
        """Test angle calculation for right angle (should be 90°)."""
        a = [0, 0]
        b = [0, 1]
        c = [1, 1]
        angle = calculate_angle(a, b, c)
        assert angle == pytest.approx(90.0, abs=0.1)
    
    def test_calculate_angle_equilateral_triangle(self):
        """Test angle calculation for equilateral triangle (should be 60°)."""
        a = [0, 0]
        b = [1, 0]
        c = [0.5, np.sqrt(3)/2]
        angle = calculate_angle(a, b, c)
        assert angle == pytest.approx(60.0, abs=0.1)
    
    def test_calculate_angle_none_input(self):
        """Test angle calculation with None input."""
        angle = calculate_angle(None, [0, 0], [1, 0])
        assert angle is None
    
    def test_pelvic_tilt_horizontal(self):
        """Test pelvic tilt when hips are level (should be 0°)."""
        left_hip = np.array([0.4, 0.5])
        right_hip = np.array([0.6, 0.5])
        tilt = calculate_pelvic_tilt(left_hip, right_hip)
        assert tilt == pytest.approx(0.0, abs=0.1)
    
    def test_pelvic_tilt_45_degrees(self):
        """Test pelvic tilt at 45 degrees."""
        left_hip = np.array([0.4, 0.5])
        right_hip = np.array([0.6, 0.7])
        tilt = calculate_pelvic_tilt(left_hip, right_hip)
        assert tilt == pytest.approx(45.0, abs=1.0)
    
    def test_shoulder_tilt_horizontal(self):
        """Test shoulder tilt when shoulders are level (should be 0°)."""
        left_shoulder = np.array([0.3, 0.2])
        right_shoulder = np.array([0.7, 0.2])
        tilt = calculate_shoulder_tilt(left_shoulder, right_shoulder)
        assert tilt == pytest.approx(0.0, abs=0.1)
    
    def test_trunk_sway_vertical(self):
        """Test trunk sway when body is vertical (should be 0°)."""
        left_shoulder = np.array([0.4, 0.2])
        right_shoulder = np.array([0.6, 0.2])
        left_hip = np.array([0.4, 0.8])
        right_hip = np.array([0.6, 0.8])
        sway = calculate_trunk_sway(left_shoulder, right_shoulder, left_hip, right_hip)
        assert sway == pytest.approx(0.0, abs=0.1)


# =============================================================================
# TEST 2: Range of Motion and Symmetry Index
# =============================================================================

class TestROMAndSymmetry:
    """Test suite for ROM and Symmetry Index calculations."""
    
    def test_calculate_rom_basic(self):
        """Test basic ROM calculation."""
        angles = [40, 45, 50, 55, 60]
        rom = calculate_rom(angles)
        assert rom == 20.0  # 60 - 40
    
    def test_calculate_rom_insufficient_data(self):
        """Test ROM with insufficient data points."""
        angles = [40, 45]  # Less than 5 points
        rom = calculate_rom(angles)
        assert rom == 0.0
    
    def test_calculate_rom_with_zeros(self):
        """Test ROM calculation with zero values (missed detections)."""
        angles = [0, 40, 45, 0, 60, 0]
        rom = calculate_rom(angles)
        # Note: Only 3 valid points (40, 45, 60), less than required 5
        # So ROM returns 0.0 for insufficient data
        assert rom == 0.0  # Need at least 5 valid points
    
    def test_calculate_rom_with_sufficient_zeros(self):
        """Test ROM calculation with zeros but sufficient valid data."""
        angles = [0, 40, 45, 50, 55, 60, 0, 65, 70, 0]
        rom = calculate_rom(angles)
        # 7 valid points: 40, 45, 50, 55, 60, 65, 70
        assert rom == 30.0  # 70 - 40
    
    def test_calculate_symmetry_index_perfect(self):
        """Test SI with perfect symmetry (should be 1.0)."""
        si = calculate_symmetry_index(50.0, 50.0)
        assert si == 1.0
    
    def test_calculate_symmetry_index_left_dominant(self):
        """Test SI with left-dominant asymmetry."""
        si = calculate_symmetry_index(60.0, 50.0)
        assert si == 1.2
    
    def test_calculate_symmetry_index_right_dominant(self):
        """Test SI with right-dominant asymmetry."""
        si = calculate_symmetry_index(40.0, 50.0)
        assert si == 0.8
    
    def test_calculate_symmetry_index_division_by_zero(self):
        """Test SI when right ROM is zero."""
        si = calculate_symmetry_index(50.0, 0.0)
        assert si == 0.0
    
    def test_calculate_asymmetry_perfect(self):
        """Test asymmetry percentage with perfect symmetry."""
        asym = calculate_asymmetry(1.0)
        assert asym == 0.0
    
    def test_calculate_asymmetry_15_percent(self):
        """Test asymmetry percentage at 15% threshold."""
        asym = calculate_asymmetry(0.85)
        assert asym == 15.0
    
    def test_calculate_asymmetry_20_percent(self):
        """Test asymmetry percentage at 20%."""
        asym = calculate_asymmetry(0.80)
        assert asym == 20.0


# =============================================================================
# TEST 3: Clinical Thresholds Validation
# =============================================================================

class TestClinicalThresholds:
    """Test suite for clinical threshold accuracy."""
    
    def test_symmetry_index_thresholds(self):
        """Verify SI thresholds are evidence-based."""
        assert SI_LOW_THRESHOLD == 0.85   # ±15% asymmetry
        assert SI_HIGH_THRESHOLD == 1.15  # ±15% asymmetry
    
    def test_scoliosis_threshold(self):
        """Verify scoliosis threshold is 5° (94% sensitivity)."""
        assert SCOLIOSIS_DIVERGENCE_THRESHOLD == 5.0
    
    def test_knee_thresholds(self):
        """Verify knee valgus/varum thresholds."""
        assert KNEE_VARUM_THRESHOLD == 170.0
        assert KNEE_VALGUM_THRESHOLD == 190.0
    
    def test_ankle_thresholds(self):
        """Verify ankle dorsiflexion thresholds."""
        assert EQUINUS_THRESHOLD == 100.0
        assert CALCANEUS_THRESHOLD == 75.0
    
    def test_detection_rate_threshold(self):
        """Verify minimum detection rate."""
        assert MIN_DETECTION_RATE == 50.0
    
    def test_diagnosis_normal_gait(self):
        """Test diagnosis for normal gait."""
        diagnosis = get_diagnosis(
            si=1.0,
            detection_rate=80.0,
            knee_valgus_angle=180.0
        )
        assert diagnosis.result == DiagnosisResult.NORMAL
        assert diagnosis.is_high_risk == False
    
    def test_diagnosis_high_risk_asymmetry(self):
        """Test diagnosis for high risk due to asymmetry."""
        diagnosis = get_diagnosis(
            si=0.80,  # Below 0.85 threshold
            detection_rate=80.0,
            knee_valgus_angle=180.0
        )
        assert diagnosis.result == DiagnosisResult.HIGH_RISK
        assert diagnosis.is_high_risk == True
    
    def test_diagnosis_insufficient_data(self):
        """Test diagnosis for insufficient data."""
        diagnosis = get_diagnosis(
            si=1.0,
            detection_rate=40.0,  # Below 50% threshold
            knee_valgus_angle=180.0
        )
        assert diagnosis.result == DiagnosisResult.INSUFFICIENT_DATA
        assert diagnosis.is_high_risk == False
    
    def test_diagnosis_genu_varum(self):
        """Test diagnosis for genu varum (bowlegs)."""
        diagnosis = get_diagnosis(
            si=1.0,
            detection_rate=80.0,
            knee_valgus_angle=165.0  # Below 170°
        )
        assert diagnosis.is_high_risk == True
        assert "Genu Varum" in diagnosis.message
    
    def test_diagnosis_genu_valgum(self):
        """Test diagnosis for genu valgum (knock-knees)."""
        diagnosis = get_diagnosis(
            si=1.0,
            detection_rate=80.0,
            knee_valgus_angle=195.0  # Above 190°
        )
        assert diagnosis.is_high_risk == True
        assert "Genu Valgum" in diagnosis.message


# =============================================================================
# TEST 4: Signal Processing
# =============================================================================

class TestSignalProcessing:
    """Test suite for signal processing functions."""
    
    def test_apply_smoothing_basic(self):
        """Test basic smoothing application."""
        data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        smoothed = apply_smoothing(data, cutoff=6.0, fs=30.0)
        assert len(smoothed) == len(data)
        assert isinstance(smoothed, np.ndarray)
    
    def test_apply_smoothing_short_data(self):
        """Test smoothing with insufficient data."""
        data = [10, 20, 30]
        smoothed = apply_smoothing(data, cutoff=6.0, fs=30.0)
        # Should return as-is for very short data
        assert len(smoothed) == len(data)
    
    def test_apply_smoothing_preserves_trend(self):
        """Test that smoothing preserves overall trend."""
        # Linear trend with noise
        np.random.seed(42)
        trend = np.linspace(0, 100, 100)
        noise = np.random.normal(0, 5, 100)
        noisy_data = trend + noise
        
        smoothed = apply_smoothing(noisy_data, cutoff=6.0, fs=30.0)
        
        # Smoothed data should correlate with original trend
        correlation = np.corrcoef(smoothed, trend)[0, 1]
        assert correlation > 0.9


# =============================================================================
# TEST 5: Initial Contact Detection and Normalization
# =============================================================================

class TestICNormalization:
    """Test suite for IC detection and normalization."""
    
    def test_find_local_minima_basic(self):
        """Test basic local minima detection."""
        data = np.array([5, 3, 4, 2, 5, 1, 6])
        minima = _find_local_minima(data, min_distance=1)
        assert 1 in minima  # Index of value 3
        assert 3 in minima  # Index of value 2
        assert 5 in minima  # Index of value 1
    
    def test_find_local_minima_with_distance(self):
        """Test local minima with minimum distance constraint."""
        data = np.array([5, 3, 4, 2, 5, 1, 6])
        minima = _find_local_minima(data, min_distance=3)
        # Should only find the most prominent minima
        assert len(minima) <= 2
    
    def test_detect_initial_contact_synthetic(self):
        """Test IC detection with synthetic gait data."""
        # Create synthetic ankle Y trajectory (simulating gait cycles)
        fps = 30.0
        t = np.linspace(0, 2 * np.pi * 3, 90)  # 3 gait cycles
        # Ankle Y follows sinusoidal pattern with minima at IC
        left_ankle_y = (np.sin(t) + 1) / 2  # Normalized 0-1
        right_ankle_y = (np.sin(t + np.pi) + 1) / 2  # Opposite phase
        
        left_knee_y = left_ankle_y * 0.9  # Knee always above ankle
        right_knee_y = right_ankle_y * 0.9
        
        left_ic, right_ic = detect_initial_contact(
            left_ankle_y.tolist(), right_ankle_y.tolist(),
            left_knee_y.tolist(), right_knee_y.tolist(),
            fps
        )
        
        # Should detect at least one IC per leg
        assert len(left_ic) >= 1
        assert len(right_ic) >= 1
    
    def test_apply_ic_normalization_mean(self):
        """Test IC normalization with mean method."""
        # Simulate valgus angles with systematic bias
        angles = [185, 186, 187, 188, 189, 190, 191, 192]
        ic_indices = [0, 1]  # First two frames are IC
        
        normalized = apply_ic_normalization(angles, ic_indices, method="mean")
        
        # Mean of first two: (185 + 186) / 2 = 185.5
        # After normalization, first value should be close to 0
        assert abs(normalized[0] - (-0.5)) < 0.1
        assert abs(normalized[1] - 0.5) < 0.1
    
    def test_apply_ic_normalization_preserves_zeros(self):
        """Test that IC normalization preserves zero values."""
        angles = [185, 0, 187, 0, 189]
        ic_indices = [0]
        
        normalized = apply_ic_normalization(angles, ic_indices, method="first")
        
        # Zeros should remain zeros
        assert normalized[1] == 0.0
        assert normalized[3] == 0.0
    
    def test_apply_ic_normalization_no_ic(self):
        """Test IC normalization with no IC detected."""
        angles = [185, 186, 187]
        ic_indices = []
        
        normalized = apply_ic_normalization(angles, ic_indices)
        
        # Should return original data when no IC
        assert normalized == angles
    
    def test_calculate_ic_normalized_valgus(self):
        """Test complete IC-normalized valgus calculation."""
        # Simulate gait data with systematic bias
        fps = 30.0
        n_frames = 90
        
        # Create synthetic data
        left_valgus = [185 + np.random.normal(0, 2) for _ in range(n_frames)]
        right_valgus = [183 + np.random.normal(0, 2) for _ in range(n_frames)]
        
        # Ankle Y coordinates (sinusoidal for gait cycles)
        t = np.linspace(0, 2 * np.pi * 3, n_frames)
        left_ankle_y = ((np.sin(t) + 1) / 2).tolist()
        right_ankle_y = ((np.sin(t + np.pi) + 1) / 2).tolist()
        left_knee_y = [y * 0.9 for y in left_ankle_y]
        right_knee_y = [y * 0.9 for y in right_ankle_y]
        
        avg_l, avg_r, left_norm, right_norm = calculate_ic_normalized_valgus(
            left_valgus, right_valgus,
            left_ankle_y, right_ankle_y,
            left_knee_y, right_knee_y,
            fps
        )
        
        # After IC normalization, the difference should reflect true asymmetry
        # not systematic bias
        assert isinstance(avg_l, float)
        assert isinstance(avg_r, float)
        assert len(left_norm) == n_frames
        assert len(right_norm) == n_frames


# =============================================================================
# TEST 6: Confidence Score Calculation
# =============================================================================

class TestConfidenceScore:
    """Test suite for confidence score calculation."""
    
    def test_confidence_perfect_data(self):
        """Test confidence with perfect data."""
        conf = calculate_confidence(detection_rate=100.0, si=1.0)
        assert 0.7 <= conf <= 1.0  # High quality, low significance
    
    def test_confidence_poor_detection(self):
        """Test confidence with poor detection rate."""
        conf = calculate_confidence(detection_rate=50.0, si=1.0)
        assert conf < 0.5
    
    def test_confidence_high_asymmetry(self):
        """Test confidence with high asymmetry."""
        conf = calculate_confidence(detection_rate=90.0, si=0.70)
        assert conf > 0.7  # High quality + high significance
    
    def test_confidence_range(self):
        """Test that confidence is always in valid range."""
        for dr in [0, 25, 50, 75, 100]:
            for si in [0.5, 0.85, 1.0, 1.15, 1.5]:
                conf = calculate_confidence(detection_rate=dr, si=si)
                assert 0.0 <= conf <= 1.0


# =============================================================================
# TEST 7: Edge Cases and Error Handling
# =============================================================================

class TestEdgeCases:
    """Test suite for edge cases and error handling."""
    
    def test_empty_angle_array(self):
        """Test handling of empty angle arrays."""
        rom = calculate_rom([])
        assert rom == 0.0
    
    def test_all_zeros_angle_array(self):
        """Test handling of all-zero angle arrays."""
        rom = calculate_rom([0, 0, 0, 0, 0])
        assert rom == 0.0
    
    def test_single_value_rom(self):
        """Test ROM with single valid value."""
        rom = calculate_rom([50, 0, 0, 0, 0])
        assert rom == 0.0  # Need at least 5 valid points
    
    def test_negative_angles(self):
        """Test handling of negative angles (shouldn't occur but test anyway)."""
        angles = [-10, 40, 50, 60, 70, 80, 90]
        rom = calculate_rom(angles)
        # Negative values are filtered out (x > 0)
        # Valid: 40, 50, 60, 70, 80, 90 (6 points, meets minimum 5)
        assert rom == 50.0  # 90 - 40
    
    def test_very_large_rom(self):
        """Test ROM with very large range."""
        angles = [0, 20, 40, 60, 80, 100, 120]
        rom = calculate_rom(angles)
        # Valid: 20, 40, 60, 80, 100, 120 (6 points, meets minimum 5)
        # Note: 0 is filtered out as invalid
        assert rom == 100.0  # 120 - 20


# =============================================================================
# TEST 8: Integration Tests
# =============================================================================

class TestIntegration:
    """Integration tests for complete analysis pipeline."""
    
    def test_normal_gait_pipeline(self):
        """Test complete pipeline with normal gait data."""
        # Simulate normal gait
        left_rom = 50.0
        right_rom = 52.0
        si = calculate_symmetry_index(left_rom, right_rom)
        asym = calculate_asymmetry(si)
        
        # Should be within normal limits
        assert SI_LOW_THRESHOLD <= si <= SI_HIGH_THRESHOLD
        assert asym < 15.0
    
    def test_asymmetric_gait_pipeline(self):
        """Test complete pipeline with asymmetric gait data."""
        # Simulate asymmetric gait
        left_rom = 40.0
        right_rom = 60.0
        si = calculate_symmetry_index(left_rom, right_rom)
        asym = calculate_asymmetry(si)
        
        # Should be flagged as asymmetric
        assert si < SI_LOW_THRESHOLD or si > SI_HIGH_THRESHOLD
        assert asym >= 15.0
    
    def test_scoliosis_screening_pipeline(self):
        """Test scoliosis screening with various divergence angles."""
        # Normal shoulder-pelvic alignment
        diagnosis_normal = get_diagnosis(
            si=1.0,
            detection_rate=80.0,
            knee_valgus_angle=180.0,
            smoothed_shoulder_tilts=[2, 3, 2, 3, 2],
            smoothed_pelvic_tilts=[1, 2, 1, 2, 1]
        )
        # Average divergence: ~1°, should not trigger scoliosis
        assert "Scoliosis" not in diagnosis_normal.message
        
        # High shoulder-pelvic divergence
        diagnosis_scoliosis = get_diagnosis(
            si=1.0,
            detection_rate=80.0,
            knee_valgus_angle=180.0,
            smoothed_shoulder_tilts=[10, 12, 11, 13, 12],
            smoothed_pelvic_tilts=[2, 3, 2, 3, 2]
        )
        # Average divergence: ~9°, should trigger scoliosis screening
        assert "Scoliosis" in diagnosis_scoliosis.message or diagnosis_scoliosis.is_high_risk


# =============================================================================
# Run Tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
