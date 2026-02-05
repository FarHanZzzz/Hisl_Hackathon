# Phase 2: The Engine (Core MVP)

## Objective
Build the functional MVP with correct math logic and real-time visualization.

## Tasks

### 2.1 Fix Symmetry Index formula
Current implementation:
```python
symmetry_score = min(max_left, max_right) / max(max_left, max_right)
```

Correct implementation (per narrative):
```python
# SI = max(ROM_left) / max(ROM_right)
symmetry_index = max_left_flexion / max_right_flexion if max_right_flexion > 0 else 0
```

Diagnostic thresholds:
- **Healthy**: SI between 0.85 and 1.15 (symmetric)
- **Pathological**: SI < 0.85 or SI > 1.15 (asymmetry detected)

### 2.2 Implement angle calculation (already done)
The geometry formula is correctly implemented in `utils.py`:
```python
theta = arctan2(Cy - By, Cx - Bx) - arctan2(Ay - By, Ax - Bx)
```
Where:
- A = Hip landmark
- B = Knee landmark (vertex)
- C = Ankle landmark

### 2.3 Build Streamlit UI shell
Required components:
- **Sidebar**: Patient ID input, video uploader, configuration
- **Main area**: 
  - Live video feed with skeleton overlay
  - Real-time angle charts (Left vs Right knee)
  - Post-analysis report with diagnosis

### 2.4 Real-time frame updates
Ensure video frames update smoothly:
- Use `st.empty()` placeholders for video and charts
- Process frames in a loop and update placeholders
- Handle frame rate (target: 15-30 FPS display)

### 2.5 Add diagnostic labels
Based on asymmetry percentage:
- `> 15%` asymmetry: **"DIAGNOSIS: HIGH RISK"** (Red)
- `<= 15%` asymmetry: **"DIAGNOSIS: NORMAL"** (Green)

## Code changes required

### File: `Pedi-Growth/app.py`
1. Add Patient ID input in sidebar
2. Fix SI formula to use ratio (not min/max normalization)
3. Add both-sided threshold check (< 0.85 OR > 1.15)
4. Add explicit diagnosis label with color coding

### File: `Pedi-Growth/processor.py`
1. No changes needed for core logic
2. (Optional) Add ROM tracking over time

## Deliverables
- [ ] SI formula corrected
- [ ] Patient ID field added
- [ ] Diagnosis labels implemented
- [ ] Real-time visualization working
- [ ] Angle charts updating smoothly

## Timeline
Estimated: 4-6 hours
