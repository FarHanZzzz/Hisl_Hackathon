import unittest
from utils import calculate_angle

class TestMath(unittest.TestCase):
    def test_calculate_angle_90_degree(self):
        # 90 degree L-shape
        # a = (0, 1)  (top)
        # b = (0, 0)  (corner - intersection)
        # c = (1, 0)  (right)
        
        # Note: arctan2(y, x). 
        # Vector ba = (0-0, 1-0) = (0, 1). Angle is 90 deg.
        # Vector bc = (1-0, 0-0) = (1, 0). Angle is 0 deg.
        # Diff is 90.
        
        a = [0, 1]
        b = [0, 0]
        c = [1, 0]
        
        angle = calculate_angle(a, b, c)
        print(f"Calculated angle: {angle}")
        self.assertAlmostEqual(angle, 90.0, places=5)

if __name__ == '__main__':
    unittest.main()
