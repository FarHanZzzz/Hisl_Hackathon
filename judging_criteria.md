# Pedi-Growth: Judging Criteria & Pitch Defense

This document maps the **Pedi-Growth** project against standard hackathon and startup evaluation metrics. Use this as a guide to structure your pitch, prepare your submission, and defend your project during the Q&A session.

---

## 1. Challenge Relevance
**Criteria:** *Does the solution directly address a significant, real-world health challenge? Is the impact measurable and meaningful?*

**How Pedi-Growth Meets This:**
- **Extreme Relevance:** We directly address five massive healthcare bottlenecks: Pediatric AI, Diagnostic Tools, Healthcare Workforce Shortages, Preventive Health, and Health Literacy.
- **The Core Problem:** Accessing an instrumented 3D motion-capture gait lab costs hundreds of thousands of dollars and requires specialists. This means millions of children in rural or low-resource settings with conditions like Cerebral Palsy, DMD, or Scoliosis go undiagnosed until irreversible damage occurs.
- **The Impact:** By transforming a standard smartphone into a clinical screening triage tool, we decentralize diagnostics. We empower parents and community health workers to flag high-risk cases instantly, ensuring the limited supply of pediatric neurologists triage the children who desperately need them most.

---

## 2. Innovation & Technical Feasibility
**Criteria:** *Is the approach novel? Can the technology realistically be built, deployed, and scaled?*

**How Pedi-Growth Meets This:**
- **Innovation:** Rather than relying on hardware (wearable sensors, force plates), we leverage state-of-the-art **Markerless Pose Estimation** (Google MediaPipe). We innovated specifically by applying **Initial Contact (IC) normalization** and advanced signal processing (Savitzky-Golay smoothing, IQR filtering) to turn "shaky smartphone video data" into a clean, mathematically sound medical signal.
- **Feasibility:** 
  - **It is already built and working.** The product features a fully functional Next.js frontend, a FastAPI Python backend, and a Supabase PostgreSQL database. 
  - **Compute Efficiency:** The computer vision engine runs asynchronous background processing and uses FFmpeg to optimize the video, ensuring that cheap, low-end devices can simply upload an MP4 without needing local heavy processing power.

---

## 3. Implementation Plan
**Criteria:** *Does the team have a realistic roadmap for taking this from a hackathon prototype to a real-world deployed solution?*

**How Pedi-Growth Meets This:**
- **Phase 1: Validation (Current)**
  - Prototype complete. Cross-referencing our angle calculations against established clinical datasets. (e.g., matching IC-normalized valgus angles with clinical tolerances).
- **Phase 2: Clinical Pilot (Months 1–3)**
  - Partnering with local pediatric physical therapists and rural clinics (e.g., in communities in Bangladesh) to run side-by-side screenings: our app vs. traditional physical examinations. 
- **Phase 3: Community Deployment (Months 3–6)**
  - Rollout to community health workers. Training module deployment. Translating the LLM-driven Clinical Summaries to native, local languages for maximum health literacy impact.
- **Phase 4: Regulatory & Scale (Months 6–12)**
  - Gather clinical efficacy data to apply for medical software screening classifications (e.g., FDA/CE triage software exemptions) while scaling server infrastructure to handle widespread community use.

---

## 4. Team Skills & Diversity
**Criteria:** *Does the team possess the cross-functional skills necessary to execute this vision?*

**How Pedi-Growth Meets This:**
*(Note: Customize this section with your actual team details)*
- **Technical Execution:** Strong full-stack development capability (React/Next.js, Python FastAPI) combined with deep-learning computer vision expertise (putting MediaPipe into production).
- **Design & Empathy:** UI/UX focus that ensures a complex medical tool feels accessible, empathetic, and simple for a panicked parent or an overworked nurse to use.
- **Domain Understanding:** A deep integration of actual biomechanical logic (Range of Motion, Symmetry Index, Dorsiflexion, Trunk Sway) indicating secondary research and subject-matter expertise beyond just writing code. Our diversity in technical architecture and clinical empathy makes us uniquely suited to deploy this.

---

## 5. Pitch Delivery
**Criteria:** *Is the presentation clear, engaging, and persuasive? Does it tell a compelling story?*

**The Pedi-Growth Pitch Structure:**
1. **The Hook (Empathy & Urgency):** Start with a story. "Imagine noticing your two-year-old walking differently. You live four hours from a specialist, and the waitlist is six months. During that time, the window for neuroplastic preventative care closes."
2. **The Reveal:** Introduce Pedi-Growth. Show a smartphone capturing a quick video.
3. **The Magic (Demo):** Show the product in action. Emphasize the automated tracking skeleton, the exact calculation of the Symmetry Index, and the AI providing a parent-friendly summary.
4. **The Impact (Why it Matters):** Connect the tech back to the judging themes (Workforce shortages, Pediatric AI). It's not just a cool app; it's a scalable triage system for the developing world. 
5. **The Ask / Future Vision:** Conclude with the implementation plan to bring it out of the hackathon and into actual clinics.

---

## 6. Q&A Defense
**Criteria:** *Can the team defend their technical and clinical decisions against expert scrutiny?*

**Anticipated Questions & Strong Answers:**

* **Q: "How accurate is a smartphone camera compared to a real gait lab?"**
  * **Defense:** A smartphone camera is *not* a replacement for a $200k motion capture lab like VICON. MediaPipe has a known absolute error margin of ±6–19 degrees. However, we mitigate this by relying on **relative measurements**—like the Symmetry Index (comparing the left leg to the right leg) and Range of Motion. Research shows relative symmetry calculations using MediaPipe have an excellent Intraclass Correlation Coefficient (ICC > 0.80). We are building a *screening tool to flag high risk*, not a diagnostic tool for surgery.

* **Q: "What happens if the child is wearing baggy clothes or terrible lighting?"**
  * **Defense:** Our engine calculates a **Detection Rate**. If the pose landmarks fall in confidence due to baggy clothes or lighting, and the detection rate drops below 50%, the system automatically flags the result as `INSUFFICIENT DATA` rather than giving a false positive. We prioritize safety over a forced result.

* **Q: "How are you handling patient privacy?"**
  * **Defense:** Privacy is baked into the pipeline. Step one of our OpenCV frame extraction is detecting the facial bounding box and applying an automated Gaussian blur. Furthermore, raw videos never leave our secure server ecosystem and can be set to auto-delete after the mathematical vectors are extracted.

* **Q: "Is it safe to rely on AI to give medical advice to parents?"**
  * **Defense:** Our LLM integration does not output definitive diagnoses. It acts as a translator for Health Literacy. It takes objective biomechanical data (e.g., "SI = 0.75") and converts it into understandable, actionable triage advice (e.g., "We noticed a significant asymmetry pulling to the left; we highly recommend showing this baseline report to a physical therapist"). It always defaults to recommending professional clinical referral.
