# Models Directory

Place MediaPipe model files here.

## Required Model

- **pose_landmarker_heavy.task** - MediaPipe Pose Landmarker model

### Download

1. Go to [MediaPipe Pose Landmarker Models](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models)
2. Download `pose_landmarker_heavy.task` (recommended for accuracy)
3. Place the file in this directory

The model path is configured in `backend/app/engine/scanner.py` — it resolves to `models/pose_landmarker_heavy.task` by default.

### Alternative Models

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| pose_landmarker_lite.task | ~6MB | Fastest | Lower |
| pose_landmarker_full.task | ~12MB | Medium | Medium |
| pose_landmarker_heavy.task | ~25MB | Slowest | Highest |

For clinical applications, we recommend `pose_landmarker_heavy.task` for best accuracy.
