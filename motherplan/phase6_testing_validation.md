# Phase 6: Testing and Validation

## Objective
Verify that all fixes work correctly and the app is operational.

## 6.1 Unit Tests

### Angle Calculation Tests
Run existing test suite:
```bash
cd Pedi-Growth
python -m pytest test_math.py -v
```

Expected: All 20 tests pass.

### Symmetry Index Tests
Verify SI formula: SI = max_left / max_right
- SI(45, 45) == 1.0
- SI(50, 40) == 1.25
- SI(40, 50) == 0.8
- SI(45, 0) == 0.0

### Diagnosis Threshold Tests
- SI = 0.80 -> HIGH RISK
- SI = 1.20 -> HIGH RISK
- SI = 0.90 -> NORMAL
- SI = 1.10 -> NORMAL
- SI = 0.85 -> NORMAL (borderline)
- SI = 1.15 -> NORMAL (borderline)

## 6.2 Integration Test

### App Startup Test
```bash
cd Pedi-Growth
python -m streamlit run app.py --server.headless true
```

Verify:
- [ ] App starts without errors
- [ ] Welcome screen displays correctly
- [ ] Video tutorial section is visible
- [ ] No crash on `st.set_page_config`

### Model Initialization Test
```bash
cd Pedi-Growth
python -c "
from processor import GaitScanner
scanner = GaitScanner()
print('GaitScanner initialized successfully')
print(f'Model loaded: pose_landmarker_lite.task')
"
```

## 6.3 Smoke Test Checklist

```
[ ] App starts without errors on http://localhost:8501
[ ] Welcome screen shows with video tutorial
[ ] Patient ID validation works (warns if empty)
[ ] Video upload accepts MP4/MOV/AVI
[ ] Skeleton overlay toggles on/off
[ ] Progress bar updates during processing
[ ] Angle chart updates (smoothed, not jittery)
[ ] Detection rate displayed
[ ] Post-analysis metrics displayed correctly
[ ] Diagnosis banner shows (green or red)
[ ] Interpretation guide expander works
[ ] Temp files cleaned up after processing
[ ] No Python errors in terminal
```

## 6.4 Performance Validation

On i3 7th gen with lite model:
- [ ] Model loads in under 5 seconds
- [ ] Frame processing > 10 FPS
- [ ] UI does not freeze during processing
- [ ] Total analysis of 10s video < 30 seconds

## Deliverables
- [ ] All unit tests pass
- [ ] App starts without errors
- [ ] Smoke test checklist complete
- [ ] Performance targets met
