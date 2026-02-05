"""
Unit tests for Pedi-Growth mathematical functions.
Tests angle calculation and symmetry index logic.
"""

import unittest
from utils import calculate_angle


class TestAngleCalculation(unittest.TestCase):
    """Tests for the calculate_angle function."""
    
    def test_90_degree_angle(self):
        """Test 90 degree L-shape configuration."""
        # L-shape: vertical to horizontal
        a = [0, 1]  # top
        b = [0, 0]  # corner (vertex)
        c = [1, 0]  # right
        
        angle = calculate_angle(a, b, c)
        self.assertAlmostEqual(angle, 90.0, places=5)
    
    def test_180_degree_straight_line(self):
        """Test 180 degree straight line (fully extended leg)."""
        a = [0, 0]   # hip
        b = [0, 1]   # knee (middle)
        c = [0, 2]   # ankle
        
        angle = calculate_angle(a, b, c)
        self.assertAlmostEqual(angle, 180.0, places=5)
    
    def test_45_degree_angle(self):
        """Test 45 degree angle (bent knee)."""
        import math
        a = [0, 1]
        b = [0, 0]
        c = [1, 1]  # 45 degree diagonal
        
        angle = calculate_angle(a, b, c)
        self.assertAlmostEqual(angle, 45.0, places=3)
    
    def test_none_inputs(self):
        """Test handling of None inputs."""
        self.assertIsNone(calculate_angle(None, [0, 0], [1, 0]))
        self.assertIsNone(calculate_angle([0, 0], None, [1, 0]))
        self.assertIsNone(calculate_angle([0, 0], [0, 0], None))
    
    def test_collinear_points(self):
        """Test collinear points (straight line)."""
        a = [0, 0]
        b = [1, 1]
        c = [2, 2]
        
        angle = calculate_angle(a, b, c)
        self.assertAlmostEqual(angle, 180.0, places=5)
    
    def test_negative_coordinates(self):
        """Test with negative coordinates."""
        a = [-1, 0]
        b = [0, 0]
        c = [0, 1]
        
        angle = calculate_angle(a, b, c)
        self.assertAlmostEqual(angle, 90.0, places=5)
    
    def test_typical_knee_flexion(self):
        """Test typical knee flexion angle during walking (~120-150 degrees)."""
        # Simulate hip-knee-ankle during mid-swing
        a = [0.5, 0.5]    # hip
        b = [0.5, 0.75]   # knee
        c = [0.4, 0.95]   # ankle (slightly forward)
        
        angle = calculate_angle(a, b, c)
        # Should be > 90 and < 180 for normal walking
        self.assertGreater(angle, 90)
        self.assertLess(angle, 180)


class TestSymmetryIndex(unittest.TestCase):
    """Tests for Symmetry Index calculation logic."""
    
    def calculate_si(self, max_left, max_right):
        """Helper to calculate SI as defined in the app."""
        if max_right <= 0:
            return 0.0
        return max_left / max_right
    
    def test_si_perfect_symmetry(self):
        """SI should be 1.0 for equal values."""
        si = self.calculate_si(45.0, 45.0)
        self.assertEqual(si, 1.0)
    
    def test_si_left_greater(self):
        """SI > 1.0 when left > right (possible right impairment)."""
        si = self.calculate_si(50.0, 40.0)
        self.assertEqual(si, 1.25)
    
    def test_si_right_greater(self):
        """SI < 1.0 when right > left (possible left impairment)."""
        si = self.calculate_si(40.0, 50.0)
        self.assertEqual(si, 0.8)
    
    def test_si_zero_right(self):
        """SI should be 0 when right is zero (avoid division by zero)."""
        si = self.calculate_si(45.0, 0.0)
        self.assertEqual(si, 0.0)
    
    def test_si_threshold_low(self):
        """Test SI below low threshold (0.85)."""
        si = self.calculate_si(42.5, 50.0)  # 0.85
        self.assertLessEqual(si, 0.85)
    
    def test_si_threshold_high(self):
        """Test SI above high threshold (1.15)."""
        si = self.calculate_si(57.5, 50.0)  # 1.15
        self.assertGreaterEqual(si, 1.15)
    
    def test_si_normal_range(self):
        """Test SI within normal range (0.85-1.15)."""
        # 10% asymmetry should be normal
        si = self.calculate_si(45.0, 50.0)  # 0.9
        self.assertGreater(si, 0.85)
        self.assertLess(si, 1.15)


class TestDiagnosisLogic(unittest.TestCase):
    """Tests for diagnosis determination logic."""
    
    SI_LOW_THRESHOLD = 0.85
    SI_HIGH_THRESHOLD = 1.15
    
    def get_diagnosis(self, symmetry_index):
        """Helper to determine diagnosis."""
        asymmetry_pct = abs(1.0 - symmetry_index) * 100
        is_high_risk = symmetry_index < self.SI_LOW_THRESHOLD or symmetry_index > self.SI_HIGH_THRESHOLD
        return is_high_risk, asymmetry_pct
    
    def test_normal_diagnosis(self):
        """Test normal diagnosis for symmetric gait."""
        is_high_risk, _ = self.get_diagnosis(1.0)
        self.assertFalse(is_high_risk)
    
    def test_high_risk_low_si(self):
        """Test high risk diagnosis for low SI."""
        is_high_risk, _ = self.get_diagnosis(0.80)
        self.assertTrue(is_high_risk)
    
    def test_high_risk_high_si(self):
        """Test high risk diagnosis for high SI."""
        is_high_risk, _ = self.get_diagnosis(1.20)
        self.assertTrue(is_high_risk)
    
    def test_borderline_low(self):
        """Test borderline case at low threshold."""
        is_high_risk, _ = self.get_diagnosis(0.85)
        self.assertFalse(is_high_risk)  # 0.85 is at threshold, not below
    
    def test_borderline_high(self):
        """Test borderline case at high threshold."""
        is_high_risk, _ = self.get_diagnosis(1.15)
        self.assertFalse(is_high_risk)  # 1.15 is at threshold, not above
    
    def test_asymmetry_percentage(self):
        """Test asymmetry percentage calculation."""
        _, asymmetry_pct = self.get_diagnosis(0.80)
        self.assertAlmostEqual(asymmetry_pct, 20.0, places=1)
        
        _, asymmetry_pct = self.get_diagnosis(1.20)
        self.assertAlmostEqual(asymmetry_pct, 20.0, places=1)


if __name__ == '__main__':
    unittest.main(verbosity=2)
