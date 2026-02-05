# Phase 1: Setup and Environment

## Objective
Secure valid data, set up the development environment, and verify the basic pipeline.

## Tasks

### 1.1 Create local virtual environment
```bash
cd cbh
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate
```

### 1.2 Install dependencies
```bash
pip install -r Pedi-Growth/requirements.txt
```

Required packages:
- `streamlit` - Web UI framework
- `mediapipe` - Pose detection engine
- `opencv-python` - Video/image processing
- `numpy` - Numerical computations
- `matplotlib` - Plotting (optional, Streamlit has built-in charts)

### 1.3 Verify MediaPipe model file
The app requires `pose_landmarker_heavy.task` in `Pedi-Growth/`.
- File size: ~25MB
- Source: Google MediaPipe model hub

### 1.4 Acquire demo videos
Strict requirements:
- Clean background (solid wall or green screen)
- Full body visible (head to feet)
- Frontal or sagittal plane view
- Minimum 3 videos:
  1. Normal gait
  2. Limping gait (hemiplegic)
  3. Toe-walking gait

Store in `Pedi-Growth/videos/` folder.

### 1.5 Test basic pipeline
```bash
cd Pedi-Growth
python verify_processor.py
```
Expected output: `GaitScanner instantiated successfully.`

## Deliverables
- [ ] Local venv activated
- [ ] All dependencies installed
- [ ] Model file present and verified
- [ ] Demo videos acquired
- [ ] Basic pipeline test passes

## Timeline
Estimated: 2-4 hours
