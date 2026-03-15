# LLM Execution Prompts for Pedi-Growth Orthopedic Integration

These prompts are specifically designed for the **Pedi-Growth** codebase, which utilizes a **FastAPI** backend with a **MediaPipe Pose** engine (v0.10.x Python API) and a **Next.js + TypeScript** frontend.

To guarantee zero hallucination and perfect integration, initialize your AI session with the **System Context Prompt**, and then feed it the phased execution blocks strictly one by one.

---

## Initialization: System Context Prompt
*Provide this context to your LLM before giving it any tasks.*

**Prompt:**
```text
You are an Expert AI Software Architect working on "Pedi-Growth," a clinical pediatric gait analysis tool. 
Our tech stack is strictly defined as:
- **Backend:** Python 3.10+, FastAPI, `scipy`, and `mediapipe` (Pose Landmark Model v0.10.x). The backend engine is located in `backend/app/engine/`.
- **Frontend:** Next.js (Pages router), React, TypeScript, and `recharts` for data visualization. Located in the `frontend/` directory.

We are implementing a 6-Phase Orthopedic Features integration based on clinical research to detect Rickets (Genu Varum/Valgum), Leg Length Discrepancy (LLD), and Clubfoot (Talipes Equinovarus).

**Rules of Engagement:**
1. Do NOT hallucinate MediaPipe APIs. We use the updated `tasks.vision.PoseLandmarker` API.
2. Read the master architectural plan exactly via `view_file` at: `d:\Hisl_Hackathon\Orthopedicfeature\orthopedic_implementation_plan.md`.
3. Read the research extracted text at `d:\Hisl_Hackathon\Orthopedicfeature\pdf_text.txt` if you need clinical clarity.
4. When writing code, provide exact Python/TSX implementation blocks and clearly state which exact file paths you are targeting. Wait for my confirmation that you have read this context before we begin Phase 1.
```

---

## Phase 1: Core Biomechanical Engine & Signal Filtering
**Prompt:**
```text
Executing Phase 1: Core Biomechanical Engine Expansion.
Our current physics engine (`scanner.py` or equivalent in `backend/app/engine/`) extracts raw 3D landmarks (x, y, z) but lacks advanced filtering and 3D angle projection tools.

**Your Tasks:**
1. **Locate the Engine:** Use `list_dir` to explore `d:\Hisl_Hackathon\backend\app\engine\` to find where our math is currently done.
2. **Implement Butterworth Filter:** In `math_utils.py` (create it if missing), write a `apply_smoothing(data, cutoff=6, fs=30, order=4)` function using `scipy.signal.filtfilt`. This is a clinical necessity for MediaPipe jitter removal (Zero-phase 4th-order low-pass filter).
3. **Advanced 3D Geometry:** Write helper functions to calculate angles between two 3D vectors. Specifically, we need methods to project a 3D vector onto a 2D plane (Frontal plane: ignore Z, Sagittal plane: ignore X).
4. **Update Pydantic Models:** Explore `d:\Hisl_Hackathon\backend\app\schemas\`. Update `GaitMetrics` and `DiagnosisResult` schemas to type-safely accept three new fields: `knee_valgus_angle` (float), `pelvic_tilt` (float), and `foot_progression_angle` (float).

Write the exact Python implementation for these utilities and show me how they bind to our schemas.
```

---

## Phase 2: Rickets (Genu Varum and Valgum) Algorithm
**Prompt:**
```text
Executing Phase 2: Rickets Detection Algorithm.
We must detect bowlegs and knock-knees dynamically across the video frames.

**Your Tasks:**
1. In the main MediaPipe coordinate extraction loop (in `d:\Hisl_Hackathon\backend\app\engine\scanner.py`), identify Hip (23,24), Knee (25,26), and Ankle (27,28).
2. **The Math:** Extract ONLY the Frontal Plane (x,y) coordinates to remove depth ambiguity. Use our Phase 1 3D Geometry helpers.
3. Compute the internal Valgus angle at the knee. A perfectly straight mechanical axis is 180 degrees.
4. Add these framewise values to the `knee_valgus_angle` array in our processing state.
5. **Clinical Heuristics:** In our final diagnostic builder, classify the max deviation:
   - Significant outward bowing = "Genu Varum Detected"
   - Significant inward buckling = "Genu Valgum Detected"
   - Otherwise = "Normal Mechanical Axis"
6. Add this finding to the `DiagnosisResult` object.

Provide the exact Python modifications for `scanner.py`. Ensure you use our Pydantic schemas correctly.
```

---

## Phase 3: Leg Length Discrepancy (LLD) Algorithm
**Prompt:**
```text
Executing Phase 3: Leg Length Discrepancy (LLD) tracking.
LLD manifests as compensatory pelvic tilt and spatiotemporal asymmetry.

**Your Tasks:**
1. In `scanner.py`, inside the MediaPipe loop, track the spatial relationship between the Left Hip (23) and Right Hip (24).
2. **The Math:** Calculate the dynamic Pelvic Tilt (the horizontal angle of the line connecting landmarks 23 and 24).
3. **Critical Step:** Pass this raw pelvic tilt array through the Phase 1 `apply_smoothing` (Butterworth filter) before deriving conclusions, as hip tracked bounding boxes are noisy.
4. **Clinical Heuristics:** Calculate the variance and max amplitude of the tilt. High variance or a persistent drop on one side indicates LLD compensation (e.g., severe Trendelenburg gait).
5. Append the filtered `pelvic_tilt` array and the heuristic flag to the output metadata.

Provide the exact Python logic to integrate this into the processing loop.
```

---

## Phase 4: Clubfoot (Talipes Equinovarus) Algorithm
**Prompt:**
```text
Executing Phase 4: Clubfoot Kinematics tracking.
We need to track foot inversion and progression angles for pediatric post-casting monitoring.

**Your Tasks:**
1. In `scanner.py`, define the 3D Tibial Vector (Knee 25/26 to Ankle 27/28) and the 3D Foot Vector (Heel 29/30 to Toe 31/32).
2. **The Math:** 
   - Sagittal View: Project vectors onto (Y, Z) to calculate Ankle dorsiflexion/plantarflexion.
   - Transverse View: Project vectors onto (X, Z) to extract Foot Progression Angle (Inversion/Eversion).
3. **Clinical Signal:** Apply the Butterworth filter to these arrays. 
4. **Clinical Heuristics:** Flag "Equinus Gait" if dorsiflexion is severely limited during the stance phase, or "Calcaneus Gait" if dorsiflexion is excessive.
5. Save `foot_progression_angle` array to the result schema.

Write out the exact Python functions and matrix operations required for these vector calculations.
```

---

## Phase 5: Frontend Data Binding (Next.js & TypeScript)
**Prompt:**
```text
Executing Phase 5: Frontend Data Binding.
Our backend is now calculating Valgus, Pelvic Tilt, and progression angles. We need to catch this data in our Next.js UI safely.

**Your Tasks:**
1. Read `d:\Hisl_Hackathon\frontend\src\types\index.ts` using `view_file`.
2. Update the `AnalysisResult` and `GaitMetrics` exported TypeScript interfaces to perfectly mirror the new Pydantic fields (`knee_valgus_angle`, `pelvic_tilt`, etc.) from Phase 1.
3. Open `d:\Hisl_Hackathon\frontend\pages\results\[id].tsx`. Ensure that when `job.result` is loaded from the Supabase API, these new data arrays are passed safely into standard React state or constant variables so they are accessible by child components.
4. Do NOT build the UI charts yet. Just ensure the data layer is tightly bound and type-safe.

Provide the updated `index.ts` and the data-fetching adjustments in `[id].tsx`.
```

---

## Phase 6: Stitch MCP UI Generation for Medical Dashboards
**Prompt:**
```text
Executing Phase 6: Final Medical UI Generation using Stitch.
We have highly granular biological data ready in the Next.js state. It's time to generate visually striking clinical components.

**Your Tasks:**
1. You have access to the **Stitch MCP Server** tools (`mcp_stitch_get_project`, `mcp_stitch_generate_screen_from_text`, etc.). Read their definitions.
2. In your mind, map out two new React components:
   - `<OrthopedicSummaryCard />`: To cleanly display the "Genu Varum/Valgum", "LLD", and "Equinus" heuristic badges.
   - `<OrthopedicGraphArea />`: To display three beautiful `Recharts` LineCharts plotting the Valgus, Pelvic Tilt, and Dorsiflexion arrays over time.
3. Construct a Highly Detailed Prompt to feed into `mcp_stitch_generate_screen_from_text`. Tell Stitch:
   "Generate premium, responsive Next.js components for a clinical dashboard. It features three smooth line charts for pediatric joint angles using Recharts. Include medical status badges with soft glassmorphism, high contrast for readability, and a modern 'inter' or 'outfit' typography. Utilize robust color coding (e.g., soft red for severity, cool blue for normal ranges)."
4. Once Stitch completes generation and returns the beautiful TSX code, carefully merge those specific chart areas and diagnostic badges into the main `frontend/pages/results/[id].tsx` layout so that it matches the overall Pedi-Growth aesthetic perfectly.

Execute the Stitch generation now, and guide me through the merging process.
```
