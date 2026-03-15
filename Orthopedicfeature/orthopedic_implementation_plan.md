# Orthopedic Features Implementation Plan

Based on the research synthesis provided in "Open Source Gait Analysis Research.pdf", the integration of Rickets, Leg Length Discrepancy (LLD), and Clubfoot detection is highly feasible using our existing MediaPipe Pose framework. 

To ensure stability and clinical accuracy, the implementation is broken down into 4 core subphases.

---

## Phase 1: Core Biomechanical Engine & Signal Filtering
**Objective:** Prepare the backend to mathematically process new complex angles and smooth out MediaPipe's high-frequency jitter, which is critical for clinical-grade measurements.
**Research Context:** The paper specifically mandates a 4th-order zero-phase Butterworth filter with a 5-6 Hz cutoff frequency to prevent temporal shifts in the data.

**Tasks:**
1.  **Introduce Filtering Module:** Create a new utility function in `backend/app/engine/math_utils.py` (or similar) implementing `scipy.signal.filtfilt`.
2.  **3D Vector Math Expansion:** Add dot-product and cross-product functions to calculate angles between 3D vectors (e.g., $\cos\theta = \frac{\vec{u} \cdot \vec{v}}{|\vec{u}| |\vec{v}|}$) projected onto specific anatomical planes (Frontal vs. Sagittal).
3.  **Update Data Structures:** Expand the `GaitMetrics` and `DiagnosisResult` Pydantic schemas in `backend/app/schemas/` to hold the new specific metrics (Knee Valgus Angle, Pelvic Tilt, Foot Progression Angle).

---

## Phase 2: Rickets (Genu Varum and Valgum)
**Objective:** Detect bowlegs and knock-knees by analyzing the frontal plane mechanical axis.
**Research Context:** The paper notes that frontal plane excursion must be calculated. MediaPipe provides the Hip (23,24), Knee (25,26), and Ankle (27,28). 

**Tasks:**
1.  **Frontal Plane Projection:** Isolate the (x, y) coordinates of the Hip, Knee, and Ankle to ignore depth (z) noise when facing the camera.
2.  **Calculate Valgus/Varus Angle:** Compute the interior angle at the knee joint. A perfectly straight leg is 180 degrees. Significant deviation inward defines Valgum; deviation outward defines Varum.
3.  **Heuristics:** Add logic to categorize the severity of the deviation based on standard pediatric orthopedic ranges.

---

## Phase 3: Leg Length Discrepancy (LLD)
**Objective:** Identify compensatory gait mechanisms like pelvic tilt and spatiotemporal asymmetries.
**Research Context:** Markerless systems can track the medial-lateral and vertical trajectories of hip landmarks to derive pelvic orientation. 

**Tasks:**
1.  **Dynamic Pelvic Tilt:** Calculate the horizontal angle between the Left Hip (23) and Right Hip (24) across the gait cycle. A persistent severe tilt or high variance during the stance phase indicates compensation for a shorter limb.
2.  **Spatiotemporal Tracking (Optional for V1):** Track the stride distance by monitoring the lowest vertical position of the Heel/Ankle landmarks to detect unequal step lengths.

---

## Phase 4: Clubfoot (Talipes Equinovarus) tracking
**Objective:** Track the rigid foot segment's inversion, eversion, and progression angle for post-casting monitoring.
**Research Context:** Assessing the "foot progression angle" and checking for "calcaneus gait" (excessive dorsiflexion) or "equinus" (limited dorsiflexion).

**Tasks:**
1.  **Define Foot Vector:** Use the Heel (29, 30) and Foot Index/Toe (31, 32) landmarks to create a 3D foot orientation vector.
2.  **Define Tibial Vector:** Use the Knee (25,26) and Ankle (27,28) to create the shin vector.
3.  **Calculate Ankle Kinematics:** Compute the angle between the Tibial and Foot vectors in the Sagittal plane (for dorsi/plantar flexion) and the Transverse plane (for foot progression/inversion).
4.  **Detect Abnormalities:** Flag restricted dorsiflexion (equinus) or extreme internal rotation (pigeon-toed progression).

---

## Phase 5: Frontend Dashboard Data Binding
**Objective:** Display the new biometric data to the clinicians.
**Tasks:**
1.  **Update API Types:** Sync the TypeScript interfaces in the frontend with the new Python Pydantic schemas.
2.  **New Charts:** Add new Recharts components on the `Results` page to plot:
    *   Frontal Knee Angle over time (Rickets)
    *   Pelvic Tilt Angle over time (LLD)
    *   Ankle Flexion over time (Clubfoot)
3.  **Diagnosis Badges:** Update the summary cards to highlight these specific structural deformities if detected.

---

## Phase 6: Stitch MCP UI Generation
**Objective:** Leverage the Stitch MCP server to generate a beautiful, modern UI that seamlessly blends the new Orthopedic graphs and badges into the existing dashboard.
**Research Context:** Visual clarity is paramount for clinical dashboards. Stitch can generate cohesive React components that match the existing beautiful design language of Pedi-Growth.

**Tasks:**
1.  **Capture Context:** Use the Stitch MCP Server to ingest the current `Results` UI and the new data structures created in Phase 5.
2.  **Generate UI Components:** Prompt Stitch to create specific, beautiful `OrthopedicSummaryCard` and `OrthopedicGraphArea` components. Specify requirements for modern typography, soft gradients, and high contrast for medical data.
3.  **Merge and Refine:** Integrate the Stitch-generated components back into `frontend/pages/results/[id].tsx`, ensuring the layout remains responsive and premium.
