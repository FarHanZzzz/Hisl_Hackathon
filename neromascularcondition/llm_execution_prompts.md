# LLM Execution Prompts for Neuromuscular Integration

These prompts are designed with LLM best-practices (system framing, specific constraints, and sequential tasks) to ensure the AI acts as an Expert Architect and perfectly executes the Neuromuscular Implementation Plan.

---

## Prompt 1: Phase 1 & 2 - Engine Extension and DMD Detection
**Role & Context:**
You are an Expert AI Software Architect working on "Pedi-Growth," a clinical pediatric gait analysis tool. 
Our stack is Python 3.10+, FastAPI, `scipy`, and `mediapipe` (Pose Landmark Model v0.10.x). 
You are executing Phase 1 and 2 of the Neuromuscular Integration.

**Rules of Engagement:**
1. Do NOT hallucinate MediaPipe APIs or break existing functionality.
2. Read `d:\Hisl_Hackathon\neromascularcondition\neuromuscular_implementation_plan.md` to understand the roadmap.
3. If necessary, wait for the user to upload the specific PDFs inside the `neromascularcondition` folder before finalizing clinical angle thresholds.

**Tasks:**
1. **Engine Updates (NON-DESTRUCTIVE):** In `backend/app/engine/math_utils.py`, add `calculate_shoulder_tilt` (using 3D vector projection logic onto Frontal plane X,Y) and `calculate_trunk_sway` (angle between shoulder midpoint and hip midpoint from vertical). **DO NOT modify existing functions.**
2. **Scanner Updates (ISOLATED PATH):** In `scanner.py`, extract the shoulder coordinates and calculate the trunk sway and shoulder tilt arrays dynamically. Pass them through our standard Butterworth filter (`apply_smoothing`). **Ensure all existing Orthopedic arrays (valgus, pelvic tilt, dorsiflexion) continue extracting exactly as before. Do not interrupt their flow.**
3. **DMD Logic:** In `analysis.py`, write the logic for Waddling (variance of trunk sway) and Toe-Walking (extreme continuous plantarflexion using our existing `ankle_dorsiflexion` arrays). Append these warnings to the `diagnosis` string.
Provide the exact Python modifications.

---

## Prompt 2: Phase 3 & 4 - Scoliosis Screening and DB Sync
**Context:**
Continuing from Phase 2, we are executing Phase 3 and 4 of the Neuromuscular Integration.

**Tasks:**
1. **Scoliosis Screen:** In `analysis.py`, implement the "Postural Asymmetry Vector" logic. Compare the smoothed `shoulder_tilt_array` against the `pelvic_tilt_array`. Consistently opposing tilts suggest spinal curvature compensation. Append a `scoliosis_risk` flag to the diagnosis.
2. **Pydantic Updates:** Update `backend/app/schemas.py` to include `trunk_sway_array`, `shoulder_tilt_array`, and the new diagnostic string flags (`dmd_risk`, `scoliosis_risk`). 
3. **Database Migration (Crucial Step):** Create `backend/sql/003_neuromuscular_features.sql` to add these arrays and floats to the `results` table without breaking existing data. **You MUST explicitly instruct the user to open their Supabase dashboard and manually execute this SQL script before proceeding, otherwise the database writes will fail silently.**
4. **TS Types:** Update `frontend/src/types/index.ts` to reflect the new Pydantic schema precisely.
Provide the exact SQL limits, Pydantic, and TS code.

---

## Prompt 3: Phase 5 - Stitch UI Generation
**Context:**
The core math and database states are completely wired for Neuromuscular Conditions. You will utilize the Stitch MCP server to design an outstanding UI/UX without breaking our existing dashboard.

**Tasks:**
1. You have access to the **Stitch MCP Server** tools (`mcp_stitch_get_project`, `mcp_stitch_generate_screen_from_text`, etc.). 
2. In your mind, map out two new React components:
   - `<NeuromuscularSummaryCard />`: To elegantly display the "DMD Status", "Trunk Sway", and "Scoliosis Risk" heuristic badges.
   - `<NeuromuscularGraphArea />`: To display two beautiful `Recharts` LineCharts plotting the Trunk Sway and Shoulder Tilt vs Pelvic Tilt array over time.
3. Construct a Highly Detailed Prompt to feed into `mcp_stitch_generate_screen_from_text`. Tell Stitch:
   "Generate premium, responsive Next.js components for a clinical Neuromuscular tracking dashboard. Features smooth line charts using Recharts style logic. Include medical status badges with soft glassmorphism, high contrast for readability, and modern 'Inter' typography. Utilize robust color coding (e.g., deep purples and warning ambers) to differentiate from the Orthopedic section. It must seamlessly insert below the current video layout."
4. Generate the screens via the tool.
5. Provide instructions and exact TSX injection points to put the Stitch components into `frontend/pages/results/[id].tsx` below the `<OrthopedicGraphArea />` component. Ensure no existing states or functionalities break.
