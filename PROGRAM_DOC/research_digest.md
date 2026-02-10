# Pedi-Growth — Research Digest

> **Synthesized from 3 research PDFs** (2,367 lines total). This is the single reference for all
> clinical thresholds, technical constraints, and regulatory guardrails driving implementation.

---

## 1. Pediatric Gait Norms

*Source: "Pediatric Gait Norms for AI Screening" (766 lines)*

### 1.1 Age-Stratified Knee ROM (Sagittal)

| Age Group | Knee Flexion at IC | Loading Response | Mid-Stance Extension | Max Swing Flexion |
|---|---|---|---|---|
| **Toddlers (2-3 yr)** | 15-20° | 20-30° | 5-15° | 55-65° |
| **Children (4-7 yr)** | 5-10° | 15-20° | 0-5° | 60-65° |
| **Adolescents (8-18 yr)** | 0-5° | 10-15° | 0-3° | 60-65° |

> [!IMPORTANT]
> Toddlers naturally have greater knee flexion at Initial Contact and wider stance width.
> **Do not flag toddler gait as pathological without age-adjusted thresholds.**

### 1.2 Symmetry Index (SI) Threshold

| SI Value | Interpretation |
|---|---|
| 0.85 – 1.15 | **Normal** — within physiological limits |
| < 0.85 | **Right-dominant asymmetry** — clinically significant |
| > 1.15 | **Left-dominant asymmetry** — clinically significant |
| 0 or undefined | Insufficient data (division by zero) |

**Formula**: `SI = ROM_left / ROM_right` (preserves directionality)

**Clinical basis**: The 15% deviation threshold (`|1 - SI| > 0.15`) is validated in published pediatric gait literature as the boundary between physiological and pathological asymmetry.

### 1.3 Rodda Classification (CP Subtypes)

| Type | Pattern | Key AI Markers |
|---|---|---|
| **I — True Equinus** | Toe-walking, no knee recurvatum | IC angle > 15° (plantarflexion), knee normal |
| **II — Jump Gait** | Toe-walking + excessive knee flexion | IC angle > 15° + knee > 20° at all phases |
| **III — Apparent Equinus** | Toe-walking + knee flexion + hip flexion | Same as II + hip flexion > 20° |
| **IV — Crouch Gait** | Excessive knee flexion throughout cycle | Knee > 25° at mid-stance (never extends) |

### 1.4 Edinburgh Visual Gait Score (EVGS) — Knee

| Score | Criterion |
|---|---|
| **0** | Normal range for age |
| **1** | Mild deviation (5-15° outside norm) |
| **2** | Moderate-severe (>15° outside norm) |

### 1.5 Screening Algorithm (Pseudocode)

```
FUNCTION screen_gait(left_angles, right_angles, age_years):
    # Step 1: Symmetry check
    SI = ROM(left) / ROM(right)
    IF SI < 0.85 OR SI > 1.15:
        RETURN "ASYMMETRY_DETECTED", SI

    # Step 2: Rodda classification
    IF IC_angle > 15° AND knee_midstance > 25°:
        RETURN "CROUCH_GAIT_PATTERN"
    IF IC_angle > 15° AND knee_normal:
        RETURN "EQUINUS_PATTERN"

    # Step 3: Age-appropriate check
    IF age_years <= 3:
        thresholds = TODDLER_NORMS
    ELSE:
        thresholds = CHILD_NORMS
    
    IF any_angle OUTSIDE thresholds:
        RETURN "DEVIATION_DETECTED"

    RETURN "WITHIN_NORMAL_LIMITS"
```

---

## 2. MediaPipe Accuracy & Signal Processing

*Source: "MediaPipe Pose Gait Analysis Accuracy" (446 lines)*

### 2.1 Accuracy Summary

| Plane | Metric | Result |
|---|---|---|
| **Sagittal (side view)** | Knee RMSE | **5-15°** |
| **Sagittal** | Correlation with motion capture | **r > 0.90** |
| **Frontal (front view)** | Valgus/varus RMSE | **20-40°** (unreliable) |
| **3D monocular** | Positional RMSE | ~56 mm |
| **3D stereo** | Positional RMSE | ~30 mm |

> [!CAUTION]
> **Frontal plane analysis is NOT reliable** for quantitative gait metrics with MediaPipe.
> Always use sagittal (side profile) video capture for knee angle measurement.

### 2.2 Recommended Signal Processing

| Step | Method | Parameters |
|---|---|---|
| **1. Gap filling** | Cubic spline interpolation | For frames with confidence < 0.5 |
| **2. Smoothing** | 4th-order Butterworth low-pass | **6 Hz cutoff** for kinematics |
| **3. Event detection** | 4th-order Butterworth low-pass | **3 Hz cutoff** for gait events |
| **4. Implementation** | Zero-lag (`filtfilt`) | Prevents phase shift |
| **5. Confidence filter** | Drop landmarks below threshold | **Visibility > 0.5** |

### 2.3 Gait Cycle Detection (Kinematic-Based)

| Event | Detection Method |
|---|---|
| **Heel Strike** | Local maxima of Heel-Hip horizontal distance |
| **Toe-Off** | Positive zero-crossing of Toe vertical velocity |

### 2.4 Pediatric-Specific Limitations

| Issue | Impact | Mitigation |
|---|---|---|
| **Small body bias** | Anthropometric scaling errors | Age-specific normalization |
| **High cadence** | Motion blur at typical 30 fps | Use **≥ 60 fps** minimum |
| **Flat-foot IC** | Heel strike detection fails | Use knee angle instead of heel position |
| **Diapers/clothing** | Occlude hip landmarks | Note in capture protocol |

### 2.5 Video Capture Best Practices

| Parameter | Requirement |
|---|---|
| View angle | **Strict sagittal** (90° profile view) |
| Camera height | **Hip height** of the child |
| Frame rate | **≥ 60 fps** (120 fps preferred) |
| Resolution | **≥ 1080p** |
| Lighting | Well-lit, no backlighting |
| Background | Plain, contrasting with subject |
| Clothing | Tight-fitting (shorts + t-shirt), barefoot |
| Walking distance | **Minimum 6 meters** flat surface |
| Repetitions | **3+ passes** for reliability |

---

## 3. Regulatory & Privacy Framework

*Source: "AI Pediatric Gait Tool Regulations" (678 lines)*

### 3.1 FDA Regulatory Path (US)

| Category | Viability for MVP | Why |
|---|---|---|
| **General Wellness** | ✅ **Best path** | "Tracking" and "visualization" claims only |
| **CDS Exemption (21st Century Cures)** | ❌ Fails | Medical signal processing, lacks explainability |
| **510(k) (Product Code LXC)** | ⚠️ Future | For "measurement" claims — requires predicate |
| **De Novo (like Cognoa)** | ❌ Not MVP | Full clinical trials required |

### 3.2 Forbidden vs. Permitted Language

| ❌ Forbidden | ✅ Permitted |
|---|---|
| "Diagnoses cerebral palsy" | "Tracks movement patterns" |
| "Screens for gait disorders" | "Visualizes walking symmetry" |
| "AI-based medical diagnostic" | "Educational motor journal" |
| "High risk detected" | "Deviation from typical range observed" |

### 3.3 Mandatory Disclaimers (MVP)

```
1. "This tool does not provide medical diagnoses. Consult a healthcare 
   professional for clinical assessment."

2. "Movement measurements are approximate and should not replace 
   professional gait analysis."

3. "This application is for educational and informational purposes only."
```

### 3.4 Privacy Architecture

| Regulation | Key Requirement | MVP Implementation |
|---|---|---|
| **HIPAA** (US) | De-identify PHI in video | Face blur + no long-term video storage |
| **COPPA** (US, < 13 yr) | Verifiable Parental Consent | "Email Plus" method (email + confirmation) |
| **GDPR** Art 9 (EU) | Explicit consent for biometric data | Consent checkbox + data processing agreement |
| **All** | Right to erasure | Delete all data on request |

### 3.5 Recommended Privacy Stack

```
📱 Video Capture
    ↓
🧠 Edge AI Processing (local/on-device)
    ↓ Extract skeletal data only
🗑️ Immediate video deletion after extraction
    ↓
💾 Store: skeletal JSON + anonymized metrics only
    ↓
📊 Display results (no raw video)
```

> [!WARNING]
> **Never store raw video long-term.** Extract skeletal data, compute metrics,
> then delete the video. This dramatically reduces HIPAA/GDPR liability.

### 3.6 EU MDR Classification

Under **Rule 11** of the EU Medical Device Regulation, software providing diagnostic or therapeutic information is classified as **Class IIa**, requiring Notified Body approval (not self-certification). This rules out EU distribution for MVP unless claims are restricted to General Wellness.

---

## Implementation Priority (For Engine Development)

| Priority | Item | Phase | Source |
|---|---|---|---|
| 🔴 P0 | SI threshold 0.85–1.15 | Phase 2 | Gait Norms |
| 🔴 P0 | Sagittal-only capture enforcement | Phase 2 | MediaPipe |
| 🔴 P0 | Face blur + video deletion | Phase 2 | Regulations |
| 🔴 P0 | 3 mandatory disclaimers | Phase 4 | Regulations |
| 🟡 P1 | Butterworth 6Hz filter (replace moving avg) | Phase 2 | MediaPipe |
| 🟡 P1 | Age-stratified thresholds | Phase 2 | Gait Norms |
| 🟡 P1 | EVGS scoring (0-1-2) | Phase 2 | Gait Norms |
| 🟡 P1 | Capture protocol guidance in UI | Phase 4 | MediaPipe |
| 🟢 P2 | Rodda type classification | Phase 2 | Gait Norms |
| 🟢 P2 | Gait cycle detection (heel strike / toe-off) | Phase 2 | MediaPipe |
| 🟢 P2 | COPPA Email Plus consent flow | Phase 4 | Regulations |
| 🟢 P2 | Edge AI / on-device processing | Post-MVP | Regulations |
