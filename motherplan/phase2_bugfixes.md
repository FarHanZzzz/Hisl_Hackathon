# Phase 2: Bug Fixes

## Objective
Fix all 6 identified bugs that prevent the app from running correctly.

## Bug 1: CRASH -- st.set_page_config() called after st.markdown()

**File**: `Pedi-Growth/app.py`
**Problem**: `st.set_page_config()` is on line 71, but `st.markdown()` (CSS injection) is on line 30. Streamlit requires `set_page_config` to be the absolute first Streamlit command.
**Fix**: Move `st.set_page_config()` to the very first line after imports.

## Bug 2: show_skeleton toggle is ignored

**File**: `Pedi-Growth/app.py` and `Pedi-Growth/processor.py`
**Problem**: The sidebar checkbox `show_skeleton` is never passed to `process_frame()`. Skeleton always draws.
**Fix**:
- Add `show_skeleton` parameter to `process_frame()` in `processor.py`
- Pass the checkbox value when calling `scanner.process_frame(frame, show_skeleton=show_skeleton)`

## Bug 3: Slow frame display (UI lag)

**File**: `Pedi-Growth/app.py`
**Problem**: Every frame updates both the video display and line chart via Streamlit, causing massive lag.
**Fix**: Only update the Streamlit display every 3rd frame. Still process all frames for angle data.
```python
if frames_processed % 3 == 0:
    video_placeholder.image(...)
    chart_placeholder.line_chart(...)
```

## Bug 4: Temp file leak

**File**: `Pedi-Growth/app.py`
**Problem**: The uploaded video is saved to a temp file but never deleted after processing.
**Fix**: Add `os.unlink(video_path)` in the `finally` block after `cap.release()`.

## Bug 5: Hardcoded asymmetry threshold

**File**: `Pedi-Growth/processor.py`
**Problem**: The asymmetry alert threshold is hardcoded as `30` in processor.py, while `ANGLE_DIFF_ALERT = 30` exists in app.py but is never used.
**Fix**: Accept `angle_diff_alert` as a parameter in `process_frame()` and pass it from app.py.

## Bug 6: No angle smoothing

**File**: `Pedi-Growth/app.py`
**Problem**: Raw MediaPipe angles are jittery frame-to-frame, producing noisy charts.
**Fix**: Apply a simple moving average (window=5) before displaying chart data. Use `scipy.signal.savgol_filter` or a simple rolling mean on the angle arrays before charting.

## Verification
After all fixes:
```bash
cd Pedi-Growth
python -m streamlit run app.py --server.headless true
```
- App should start without errors
- Skeleton toggle should work
- Display should not lag excessively
- No temp files left after processing

## Deliverables
- [ ] Bug 1 fixed (set_page_config first)
- [ ] Bug 2 fixed (show_skeleton passed through)
- [ ] Bug 3 fixed (frame skipping for display)
- [ ] Bug 4 fixed (temp file cleanup)
- [ ] Bug 5 fixed (configurable threshold)
- [ ] Bug 6 fixed (angle smoothing)
