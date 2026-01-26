import mediapipe as mp
try:
    import mediapipe.python.solutions as mp_solutions
    print("Found mediapipe.python.solutions")
    print(dir(mp_solutions.pose))
except ImportError as e:
    print(f"ImportError: {e}")
