# Phase 4: The Dashboard (UI Polish)

## Objective
Polish the UI and add "The Wow Factor" for demo presentation.

## Tasks

### 4.1 Diagnosis display logic
Based on Symmetry Index:

```python
def get_diagnosis(symmetry_index):
    if symmetry_index < 0.85 or symmetry_index > 1.15:
        return "HIGH RISK", "red"
    else:
        return "NORMAL", "green"
```

Display:
- **HIGH RISK**: Red banner, large text, warning icon
- **NORMAL**: Green banner, checkmark icon

### 4.2 Enhanced metrics display
Show three key metrics:
1. **Left Max Flexion** (degrees)
2. **Right Max Flexion** (degrees)
3. **Symmetry Index** (ratio)

Additional derived metrics:
- **Asymmetry %**: `abs(1 - SI) * 100`
- **Range of Motion (ROM)**: max - min angle per leg
- **Detection Rate**: % of frames with successful pose detection

### 4.3 Angle charts visualization
Requirements:
- Left knee angle: Green line
- Right knee angle: Red line
- Clear legend
- Time (frames) on X-axis
- Angle (degrees) on Y-axis

Interpretation guide:
- **Healthy gait**: Both lines show similar sine-wave pattern
- **Pathological gait**: One line is flat or significantly different

### 4.4 Report section
Post-analysis report should include:
- Patient ID
- Timestamp
- Video filename
- Key metrics (SI, max flexion L/R)
- Diagnosis verdict
- Confidence indicator (based on detection rate)

### 4.5 UI layout improvements
```
+------------------------------------------+
| Pedi-Growth: Clinical Gait Analysis      |
+------------------------------------------+
| [Sidebar]        | [Main Content]        |
| - Patient ID     | +------------------+  |
| - Upload Video   | | Live Video Feed  |  |
| - Config         | +------------------+  |
|                  | +------------------+  |
|                  | | Angle Chart      |  |
|                  | +------------------+  |
|                  | +------------------+  |
|                  | | Diagnosis Report |  |
|                  | +------------------+  |
+------------------------------------------+
```

### 4.6 Color coding and alerts
- **Asymmetry > 30°**: Flash "ASYMMETRY ALERT" on video
- **SI < 0.85**: Red diagnosis banner
- **SI > 1.15**: Red diagnosis banner
- **0.85 <= SI <= 1.15**: Green "NORMAL" banner

## Styling code
```python
# Custom CSS for diagnosis banners
st.markdown("""
<style>
.diagnosis-high-risk {
    background-color: #ff4b4b;
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
}
.diagnosis-normal {
    background-color: #00cc66;
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    font-size: 24px;
    font-weight: bold;
}
</style>
""", unsafe_allow_html=True)
```

## Deliverables
- [ ] Diagnosis labels with color coding
- [ ] Enhanced metrics display
- [ ] Improved angle charts
- [ ] Professional report section
- [ ] Polished UI layout

## Timeline
Estimated: 4-6 hours
