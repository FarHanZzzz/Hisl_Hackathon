# Phase 5: Testing and Deployment

## Objective
Ensure reliability, add quality gates, and prepare for demo/production.

## Tasks

### 5.1 Unit tests

#### Angle calculation tests (`test_math.py`)
```python
# Test cases to add:
- test_90_degree_angle       # L-shape
- test_180_degree_straight   # Straight leg
- test_45_degree_angle       # Bent knee
- test_none_inputs           # Handle None gracefully
- test_negative_coords       # Edge case
```

#### Symmetry Index tests
```python
def test_si_symmetric():
    # SI should be 1.0 for equal values
    assert calculate_si(45.0, 45.0) == 1.0

def test_si_asymmetric_left():
    # SI > 1.0 when left > right
    assert calculate_si(50.0, 40.0) == 1.25

def test_si_asymmetric_right():
    # SI < 1.0 when right > left
    assert calculate_si(40.0, 50.0) == 0.8
```

### 5.2 Integration tests

#### Video processing test
```python
def test_process_sample_video():
    scanner = GaitScanner()
    cap = cv2.VideoCapture("test_videos/sample.mp4")
    
    angles_left = []
    angles_right = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        _, (left, right) = scanner.process_frame(frame)
        angles_left.append(left)
        angles_right.append(right)
    
    cap.release()
    
    # Assertions
    assert len(angles_left) > 0
    assert len(angles_right) > 0
    assert any(a > 0 for a in angles_left)
```

### 5.3 Run tests
```bash
cd Pedi-Growth
python -m pytest test_math.py -v
python -m pytest test_integration.py -v
```

### 5.4 Local deployment checklist

#### Pre-demo verification
- [ ] Virtual environment activated
- [ ] All dependencies installed
- [ ] Model file present (`pose_landmarker_heavy.task`)
- [ ] Demo videos in place
- [ ] App starts without errors

#### Start the app
```bash
cd Pedi-Growth
streamlit run app.py
```

#### Verify endpoints
- Local URL: http://localhost:8501
- Network URL: http://<your-ip>:8501

### 5.5 Operational guardrails (Anti-Fail Rules)

1. **No Login Screens**: Hardcode user as "Dr. Farhan" or use simple text input
2. **No Live Webcams**: Use pre-recorded videos only
3. **No Cloud**: Run everything on localhost
4. **Version Control**: One person owns `app.py`, others send snippets
5. **Backup Plan**: Have a recorded demo video ready

### 5.6 Smoke test checklist

```
[ ] App starts without errors
[ ] Video upload works
[ ] Pose detection runs
[ ] Angles are computed (non-zero values)
[ ] Charts update in real-time
[ ] Diagnosis is displayed
[ ] SI threshold logic works
[ ] Face blur works
[ ] No crashes on full video
```

### 5.7 Performance benchmarks

Target metrics:
- **Startup time**: < 10 seconds
- **Frame processing**: > 15 FPS
- **Memory usage**: < 2GB
- **Detection rate**: > 80% of frames

## Troubleshooting

### Common issues

#### "Model file not found"
```
Error: Unable to open file at pose_landmarker_heavy.task
```
Solution: Run from `Pedi-Growth/` directory, or use absolute path.

#### "MediaPipe import error"
```
ImportError: mediapipe.python.solutions
```
Solution: Use Tasks API (`mediapipe.tasks.python.vision`), not legacy API.

#### "Streamlit not found"
```
streamlit: command not found
```
Solution: Use `python -m streamlit run app.py`

## Deliverables
- [ ] All unit tests pass
- [ ] Integration test passes
- [ ] App runs locally without errors
- [ ] Smoke test checklist complete
- [ ] Performance benchmarks met

## Timeline
Estimated: 2-4 hours
