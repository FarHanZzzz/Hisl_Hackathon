# Phase 5: Performance Optimization

## Objective
Make the app run smoothly on i3 7th gen hardware with responsive UI.

## 5.1 Switch to Lite Model
Change default model in `processor.py`:
```python
# Before
def __init__(self, model_path='pose_landmarker_heavy.task'):

# After
def __init__(self, model_path='pose_landmarker_lite.task'):
```

Expected improvement: ~3-5 FPS (heavy) to ~15-20 FPS (lite) on i3 7th gen.

## 5.2 Frame Skip for Display
Process ALL frames for angle data, but only update the Streamlit UI every 3rd frame:
```python
if frames_processed % 3 == 0:
    video_placeholder.image(...)
    chart_placeholder.line_chart(...)
    progress_bar.progress(...)
```

This reduces Streamlit re-render overhead by 66%.

## 5.3 Angle Smoothing
Apply a 5-point moving average to reduce jitter:
```python
def smooth_angles(angles, window=5):
    if len(angles) < window:
        return angles
    kernel = np.ones(window) / window
    smoothed = np.convolve(angles, kernel, mode='valid')
    # Pad the beginning to keep array length
    pad = angles[:window-1]
    return list(pad) + list(smoothed)
```

Apply smoothing to the chart data (not the raw collection):
```python
chart_data = {
    "Left Knee": smooth_angles(left_angles),
    "Right Knee": smooth_angles(right_angles),
}
```

## 5.4 Reduce Video Resolution for Display
Resize frames before sending to Streamlit (display only, not for processing):
```python
display_frame = cv2.resize(processed_frame_rgb, (640, 360))
video_placeholder.image(display_frame, channels="RGB", use_container_width=True)
```

## 5.5 Model Fallback Logic
Allow users to pick model via sidebar:
```python
model_choice = st.sidebar.selectbox("AI Model", ["Lite (Fast)", "Full (Balanced)", "Heavy (Accurate)"])
model_map = {
    "Lite (Fast)": "pose_landmarker_lite.task",
    "Full (Balanced)": "pose_landmarker_full.task",
    "Heavy (Accurate)": "pose_landmarker_heavy.task",
}
```

## Performance Targets
| Metric | Before | After |
|--------|--------|-------|
| Model load time | ~8s | ~3s |
| Frame processing | 3-5 FPS | 15-20 FPS |
| UI update lag | Every frame | Every 3rd |
| Chart smoothness | Jittery | Smooth |

## Deliverables
- [ ] Lite model set as default
- [ ] Frame skip implemented
- [ ] Angle smoothing applied
- [ ] Display resolution reduced
- [ ] Model selector in sidebar
