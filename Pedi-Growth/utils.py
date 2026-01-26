import numpy as np

def calculate_angle(a, b, c):
    """
    Calculates the angle at point b given three points a, b, and c using numpy.arctan2.
    Ensures the angle is within 0-180 degrees.
    """
    if a is None or b is None or c is None:
        return None

    a = np.array(a) # First
    b = np.array(b) # Mid
    c = np.array(c) # End

    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle
