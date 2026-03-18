import unittest
import numpy as np
from backend.app.engine.smoothing import interpolate_zeros, smooth_angles
from backend.app.engine.analysis import calculate_rom

class TestAnalysisRobustness(unittest.TestCase):
    def test_sparse_data_interpolation(self):
        """Test that large gaps are NOT interpolated."""
        # 100 frames, only detection at index 0 and 50
        data = [0.0] * 100
        data[0] = 150.0
        data[50] = 160.0
        
        # Max gap is 15 by default
        interpolated = interpolate_zeros(data, max_gap=15)
        
        # Should NOT have interpolated the gap of size 49
        self.assertEqual(interpolated[25], 0.0)
        self.assertEqual(interpolated[0], 150.0)
        self.assertEqual(interpolated[50], 160.0)

    def test_small_gap_interpolation(self):
        """Test that small gaps ARE interpolated."""
        data = [0.0] * 20
        data[5] = 100.0
        data[10] = 110.0 # gap of 4
        
        interpolated = interpolate_zeros(data, max_gap=15)
        self.assertNotEqual(interpolated[7], 0.0)
        self.assertAlmostEqual(interpolated[7], 104.0)

    def test_rom_with_sparse_data(self):
        """Test that sparse data results in 0.0 ROM instead of misleading values."""
        # Only 2 points with a LARGE gap (80 frames)
        data = [0.0] * 100
        data[10] = 100.0
        data[90] = 150.0
        
        smoothed = smooth_angles(data)
        rom = calculate_rom(smoothed)
        
        # Should be 0.0 because gap was not filled and valid count < 5
        self.assertEqual(rom, 0.0)

    def test_rom_with_sufficient_data(self):
        """Test that sufficient data results in correct ROM."""
        data = [0.0] * 100
        # 10 points
        for i in range(10, 20):
            data[i] = 100.0 + i
            
        smoothed = smooth_angles(data)
        rom = calculate_rom(smoothed)
        
        print(f"DEBUG: Smoothed data max={max(smoothed)}, min={min([s for s in smoothed if s > 0])}")
        
        self.assertGreater(rom, 0.0)
        self.assertAlmostEqual(rom, 9.0, places=1)

if __name__ == '__main__':
    unittest.main()
