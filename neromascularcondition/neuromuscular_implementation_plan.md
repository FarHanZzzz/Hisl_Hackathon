# Neuromuscular Integration Implementation Plan

## Objective
Extend the Pedi-Growth biomechanical engine to support Clinical Analysis of Neuromuscular Pathologies, specifically Duchenne Muscular Dystrophy (DMD) and Early-Onset Scoliosis, using validated 2D pose estimation techniques.

## Strict Rule of Engagement: Total System Isolation
**CRITICAL MANDATE:** The integration of these Neuromuscular features MUST be entirely additive and non-destructive.
1.  **Backend Integrity:** Existing Orthopedic features (Valgus, LLD, Clubfoot) must not be altered, delayed, or broken. The new arrays must be calculated in parallel.
2.  **Database Integrity:** The database migration must only use `ALTER TABLE ... ADD COLUMN` safely. No existing columns or records may be mutated or deleted.
3.  **Frontend Integrity:** The Next.js dashboard must gracefully handle cases where this new data is missing (e.g., old patient records). The new components MUST be completely isolated React nodes.

## Reference Materials
*   **Paper 1:** Human Pose Estimation for Clinical Analysis of Gait Pathologies (Bioinformatics and Biology Insights, 2024) - Focus: DMD gait impairments (waddling, toe-walking).
*   **Paper 2:** Validation of markerless video-based gait analysis... (Frontiers in Digital Health, 2025) - Focus: Toddlers and neurodevelopmental disorders via smartphone.
*   **Paper 3:** Pose as Clinical Prior: Learning Dual Representations for Scoliosis Screening (MICCAI, 2024/2025) - Focus: Postural Asymmetry Vectors from shoulder, midline, and hip deviations.

## Sub-phased Execution

### Phase 1: Postural Biomechanical Engine Extension
*   **Goal:** Calculate the new foundational vectors required for Neuromuscular tracking (Trunk Sway and Shoulder Tilt).
*   **Actionable Steps:**
    1.  **Math Engine:** Update `backend/app/engine/math_utils.py`.
    2.  **Shoulder Tilt:** Implement `calculate_shoulder_tilt_angle` (using medial shoulder landmarks 11, 12). Project these 3D coordinates onto the Frontal (X, Y) plane to determine the horizontal deviation.
    3.  **Trunk Sway:** Implement `calculate_trunk_sway`. This measures the angle between the vertical axis and the line connecting the midpoint of the shoulders to the midpoint of the hips.
    4.  **Signal Integration:** Extract these raw arrays frame-by-frame in the MediaPipe loop within `scanner.py`.
    5.  **Smoothing:** Apply our zero-phase Butterworth filter (`apply_smoothing`) to these raw arrays to remove clinical jitter before downstream analysis.

### Phase 2: Duchenne Muscular Dystrophy (DMD) Detection
*   **Goal:** Quantify specific DMD impairments (Waddling and Toe-Walking) targeting the 97% accuracy benchmarked in the 2024 studies.
*   **Actionable Steps:**
    1.  **Waddling Detection:** In `analysis.py`, evaluate the variance and maximum amplitude of the newly smoothed `trunk_sway_array` combined with the existing `pelvic_tilt_array`. High variance indicates a compensatory Trendelenburg-like waddle.
    2.  **Toe-Walking Detection:** In `analysis.py`, evaluate the existing `ankle_dorsiflexion_array`. We will flag a "DMD Toe-Walking Risk" if there is severe, continuous plantarflexion (lack of a distinct heel strike) during the expected stance phase of the gait cycle.
    3.  **Flagging:** Append specific string warnings (e.g., "DMD Waddling Profile Detected") to the final diagnostic result string.

### Phase 3: Early-Onset Scoliosis Screening
*   **Goal:** Extract "Postural Asymmetry Vectors" and screen for adolescent/early-onset scoliosis using walking videos rather than static X-rays.
*   **Actionable Steps:**
    1.  **Dual Representation Analysis:** In `analysis.py`, calculate the dynamic divergence between the `shoulder_tilt_array` and the `pelvic_tilt_array` across the entire video.
    2.  **Curve Detection:** A consistently high difference in angles (e.g., shoulders severely tilted left while the pelvis is severely tilted right) indicates a sustained C-curve or S-curve spinal compensation.
    3.  **Risk Assessment:** Flag this specific mechanical divergence as "Scoliosis Risk Protocol Recommended".

### Phase 4: Database & State Integration (⚠️ REQUIRES MANUAL SQL UPDATE)
*   **Goal:** Safely persist the new neuromuscular data arrays to the cloud without breaking existing orthogonal functionality.
*   **Actionable Steps:**
    1.  **Backend Schemas:** Update `backend/app/schemas.py` to include `trunk_sway_array`, `shoulder_tilt_array`, and the specific clinical string flags (`dmd_risk`, `scoliosis_risk`).
    2.  **SQL Generation:** The AI will write a new SQL migration script (`sql/003_neuromuscular_features.sql`) containing the `ALTER TABLE` commands for Supabase.
    3.  🚨 **USER ACTION REQUIRED:** **You must open your Supabase SQL Editor and manually run `003_neuromuscular_features.sql` before predicting any new videos. If you skip this, the database will silently drop the new arrays.** 🚨
    4.  **TypeScript Alignment:** Update the frontend types (`frontend/src/types/index.ts`) so React expects the new arrays.
    5.  **State Binding:** Update the `job.results` loader in `frontend/pages/results/[id].tsx` to gracefully extract these new arrays into standard React constants.

### Phase 5: Outstanding UI/UX Generation (Stitch MCP)
*   **Goal:** Generate a world-class, premium clinical panel specifically for Neuromuscular Conditions without disrupting the existing Orthopedic charts.
*   **Actionable Steps:**
    1.  **Stitch Setup:** Utilize the **Stitch MCP Server** via the `mcp_stitch_generate_screen_from_text` tool.
    2.  **Prompt Engineering:** Provide an incredibly dense execution prompt requesting a modular `<NeuromuscularSummaryCard />` and a `<NeuromuscularGraphArea />` layout.
    3.  **Aesthetic Enforcement:** Require the exact same soft glassmorphism, high contrast typography ('Inter' or 'Outfit'), and intelligent Recharts configuration used in Phase 6 of the Orthopedic integration.
    4.  **Final Merge:** Carefully merge the AI-generated TSX code safely underneath the Orthopedic components inside `[id].tsx`, ensuring perfectly isolated, scrollable clinical views.
