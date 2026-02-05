# Phase 4: Dashboard UI Overhaul

## Objective
Make the Streamlit dashboard visually professional and clinically useful.

## UI Layout

### Sidebar
- Patient Information (ID, Name)
- Video Upload with format hint
- Settings (skeleton toggle, SAM3 toggle)

### Main Area (3 sections)

**Section 1: Live Analysis** (two columns)
- Left: Video feed with skeleton overlay
- Right: Real-time angle chart + progress bar + detection rate

**Section 2: Post-Analysis Report**
- Patient info header (ID, Name, Video, Timestamp)
- 4-column metric cards: Left Max Flexion, Right Max Flexion, SI, Asymmetry %
- 4-column detail cards: Left ROM, Right ROM, Detection Rate, Frames Analyzed
- Diagnosis banner (RED for high risk, GREEN for normal)
- Risk factor breakdown (which leg, how much asymmetry)

**Section 3: Help and Guides**
- Interpretation Guide expander
- Video Recording Tutorial expander

### Welcome Screen (no video uploaded)
- App title and description
- How to Use (4 steps)
- Video Recording Tutorial (expandable)
- Video Requirements summary
- Clinical disclaimer

## Custom CSS
```css
.diagnosis-high-risk {
    background: linear-gradient(135deg, #ff4b4b, #cc0000);
    color: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.diagnosis-normal {
    background: linear-gradient(135deg, #00cc66, #009944);
    color: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

## Color Coding
- Left leg: Green (#00cc66) in charts and overlay
- Right leg: Red (#ff4b4b) in charts and overlay
- Normal diagnosis: Green banner
- High risk diagnosis: Red banner
- Metrics: Neutral gray background

## Deliverables
- [ ] CSS upgraded with gradients and shadows
- [ ] Welcome screen with video tutorial
- [ ] Post-analysis layout polished
- [ ] Detection rate warning for poor videos
