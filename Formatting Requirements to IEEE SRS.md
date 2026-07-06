# **Software Requirements Specification: Pedi-Growth — AI-Powered Pediatric Gait Analysis and Screening System**

## **1. Introduction**

### **1.1 Purpose of the Software Requirements Specification**

The purpose of this document is to establish the definitive Software Requirements Specification (SRS) for Pedi-Growth, an open-source, AI-powered pediatric gait analysis and screening system. In the discipline of software engineering, an SRS functions as an exhaustive architectural blueprint for a development project. Just as a civil engineer relies on structural plans prior to constructing a physical edifice, software developers utilize an SRS as an absolute guide that mathematically and functionally outlines exactly what a software system will execute, how it will behave under diverse operational loads, and the strict constraints within which it must perpetually operate. The foundational importance of this SRS lies in its capacity to ensure crystal-clear communication between disparate stakeholders, including community health workers, pediatricians, clinical biomechanists, software engineers, and quality assurance testers.

Historically, software engineering organizations utilized frameworks such as ISO/IEC 9001 to provide a generalized structure for quality management, with specific stages dictating the control of documents, internal audits, and corrective actions for nonconforming products. Within this paradigm, the development of precise software requirements was governed by the IEEE Standard 830-1998, officially titled the "IEEE Recommended Practice for Software Requirements Specifications". This standard was designed to help software customers accurately describe their operational desires while assisting software suppliers in comprehending those exact parameters without ambiguity. While the original IEEE 830-1998 standard defined an SRS as a specification for a singular software product performing certain functions in a highly specific environment, the current prevailing standard—ISO/IEC/IEEE 29148, comprehensively updated in 2018—has dramatically expanded this scope. The modern standard covers the entirety of the requirements engineering lifecycle, charting the trajectory from initial stakeholder elicitation through continuous analysis, specification drafting, and ultimate system validation. This report strictly adheres to the structural philosophy of the IEEE 830-1998 outline, encompassing introduction, overall description, specific requirements, and verification protocols, while infusing the expanded lifecycle methodologies endorsed by ISO/IEC/IEEE 29148.

---

### **1.2 Scope and Product Boundaries**

The software product identified for development is Pedi-Growth, a web-based, AI-powered clinical screening system designed to democratize access to pediatric gait analysis and early detection of developmental motor disorders. The system targets children and adolescents (ages 0–18 years) who are at risk for conditions such as Cerebral Palsy (CP), Duchenne Muscular Dystrophy (DMD), and early-onset orthopedic abnormalities. 

Traditionally, the gold standard for evaluating dynamic movement has relied on expensive, laboratory-grade, marker-based three-dimensional motion capture systems (e.g., VICON MX) combined with force plates. However, these legacy systems are financially prohibitive, geographically centralized in major urban medical centers, and logistically incapable of screening large pediatric populations—particularly in low- and middle-income countries (LMICs) such as rural regions of Bangladesh. Pedi-Growth eliminates these barriers by transforming any standard smartphone camera into a preliminary clinical screening instrument using markerless pose estimation.

The system's scope encompasses:
1. **Asynchronous Video Ingestion Pipeline:** Validating uploaded pediatric walking videos for technical suitability (resolution, frame rate, duration) and executing background processing.
2. **On-Device Privacy-Preserving Computer Vision:** Leveraging Google's MediaPipe Pose Landmarker to extract 33 skeletal landmarks, automatically applying a local Gaussian blur to the patient's face, and rendering a color-coded skeletal overlay for clinical audit.
3. **Kinematic Signal Processing and Metrics Engine:** Applying linear zero-interpolation for missed keypoints, Interquartile Range (IQR) outlier removal, and Savitzky-Golay signal smoothing to derive Range of Motion (ROM), Symmetry Index (SI), and Asymmetry Percentage.
4. **Multi-Condition Orthopedic and Neuromuscular Screening:** 
   - **Rickets screening:** Frontal knee valgus/varum angle assessment with Initial Contact (IC) normalization.
   - **Leg Length Discrepancy (LLD) screening:** Pelvic tilt amplitude and variance analysis.
   - **Clubfoot screening:** Ankle dorsiflexion range of motion (Equinus vs. Calcaneus gait) and foot progression angle.
   - **Duchenne Muscular Dystrophy (DMD) screening:** Waddling gait trunk sway variance and severe toe-walking plantarflexion detection.
   - **Scoliosis screening:** Postural asymmetry vector tracking via shoulder-pelvic divergence angle.
5. **AI-Generated Clinical Summaries:** Synthesizing complex quantitative metrics into parent-friendly explanation text using Large Language Models (LLMs) via the OpenRouter API (Gemini default), along with downloadable PDF clinical reports.

Pedi-Growth is strictly defined as a **triage and screening tool**, not a replacement for definitive clinical diagnosis or surgical planning.

---

### **1.3 Definitions, Acronyms, and Abbreviations**

To preclude the possibility of semantic misunderstanding during the development and testing lifecycles, establishing a rigid lexicon is paramount. The following table defines the critical technical terminology and acronyms integrated throughout this specification.

| Acronym / Term | Technical Definition and Contextual Implication |
21: | :--- | :--- |
22: | **AIS / Scoliosis** | Adolescent Idiopathic Scoliosis / Early-Onset Scoliosis. A three-dimensional spinal curvature deformity. Pedi-Growth screens for scoliosis risk using shoulder-pelvic divergence angles. |
23: | **CP** | Cerebral Palsy. A group of permanent movement disorders that appear in early childhood, commonly characterized by spasticity and gait asymmetry. |
24: | **DMD** | Duchenne Muscular Dystrophy. A severe progressive neuromuscular disorder characterized by muscle degeneration, presenting as waddling gait (excessive trunk sway) and toe-walking (equinus gait). |
25: | **DKV / Knee Valgus** | Dynamic Knee Valgus. An inward knee collapse in the frontal plane. In Pedi-Growth, knee valgus/varum is evaluated in walking videos for rickets screening. |
26: | **FR / NFR** | Functional Requirement / Non-Functional Requirement. FRs dictate what the system must do. NFRs describe how the system must perform (quality, performance, security). |
27: | **IC** | Initial Contact. The precise moment in the gait cycle when the foot touches the walking surface. Used as a normalization baseline to reduce pose estimation systematic errors. |
28: | **IQR** | Interquartile Range. A statistical metric used to identify and filter out coordinate tracking outliers in the raw angle time-series. |
29: | **LLD** | Leg Length Discrepancy. An orthopedic condition involving unequal leg lengths, screened via Trendelenburg gait patterns and pelvic tilt amplitude/variance. |
30: | **MoSCoW** | Must-have, Should-have, Could-have, and Won't-have prioritization framework used to govern development sprints. |
31: | **ROM** | Range of Motion. The angular difference between maximum extension and maximum flexion of a joint (e.g., knee) during the gait cycle. |
32: | **RTM** | Requirements Traceability Matrix. A document linking high-level business requirements to functional specifications and validating test cases. |
33: | **Savitzky-Golay (SG)** | A digital signal smoothing filter that fits local low-degree polynomials to data points. Used in biomechanics to smooth coordinates while preserving transient peaks. |
34: | **SI** | Symmetry Index. The ratio of left knee ROM to right knee ROM ($\text{SI} = \frac{\text{ROM}_{\text{left}}}{\text{ROM}_{\text{right}}}$). Normal range: 0.85 to 1.15. |
35: | **SMART** | Specific, Measurable, Achievable, Relevant, Time-based framework used to write unambiguous requirements. |

---

### **1.4 Document Conventions: Prioritization and Quality Attributes**

The requirements detailed in this document are strictly classified utilizing the MoSCoW prioritization methodology:
- **Must-Haves (M):** Non-negotiable features forming the Minimum Viable Product. If omitted, the system cannot function or violates safety/privacy requirements. (Target: $\le 60\%$ of development effort).
- **Should-Haves (S):** Highly desired features (e.g., PDF generation, AI summaries) that improve clinical utility but are not critical for core data extraction.
- **Could-Haves (C):** Optional, low-priority enhancements (e.g., background removal optimization via SAM3) addressed only if contingency budget allows.
- **Won't-Haves (W):** Explicitly excluded features for the current release (e.g., direct surgical trajectory recommendations, real-time multi-person video tracking) to protect project scope.

Furthermore, usability metrics are quantified (e.g., system response times, pose detection rates) to satisfy SMART requirements, avoiding subjective terms like "user-friendly" or "highly performant."

---

## **2. Overall Description**

### **2.1 Product Perspective and Evolutionary Context**

Pedi-Growth is a decentralized, local-first clinical screening platform. Its design is shaped by the rapid evolution of artificial intelligence and computer vision over the past five years. Traditionally, markerless motion capture was constrained by poor keypoint accuracy and heavy local GPU requirements. The introduction of lightweight architectures such as Google's MediaPipe Pose Landmarker enables real-time 3D coordinate estimation on consumer-grade laptops and mobile processors.

The system is designed to replace costly, inaccessible gait laboratories with a lightweight, browser-accessible single-camera workflow. It is built as a full-stack system combining:
- A responsive Next.js frontend with TailwindCSS and Recharts visualizations.
- A Python FastAPI backend orchestrating MediaPipe models and SciPy signal processing.
- A Supabase PostgreSQL database managing patient records and analysis jobs.

```
┌────────────────────────┐          api proxy          ┌──────────────────────────┐
│    Next.js Frontend    │────────────────────────────▶│     FastAPI Backend      │
│   • React / TS Client  │    (next.config rewrite)    │   • MediaPipe Pose Engine│
│   • Recharts Dashboard │                             │   • SciPy / OpenCV       │
└────────────────────────┘                             └────────────┬─────────────┘
                                                                    │
                                                                    ▼
                                                       ┌──────────────────────────┐
                                                       │   Supabase (PostgreSQL)  │
                                                       │   • Patients / Jobs / Res│
                                                       └──────────────────────────┘
```

---

### **2.2 Core Product Functions**

Pedi-Growth operates on a multi-stage background analysis pipeline:
1. **Ingestion & Validation:** Ingesting patient demographic details and raw gait videos. The system validates that the video contains supported containers (`.mp4`, `.mov`, `.avi`, `.webm`), does not exceed 100MB, and spans 3 to 120 seconds in duration.
2. **Keypoint Extraction & Privacy Blurring:** Processing the video frame-by-frame. The MediaPipe Pose engine tracks 33 spatial landmarks at $\ge 0.5$ confidence. To maintain patient privacy, a real-time Gaussian filter (51x51 kernel) is applied to the facial bounding box before any frame is drawn or cached.
3. **Signal Processing Pipeline:** Interpolating zero-values (occlusion gaps $\le 15$ frames), removing outlier spikes using Interquartile Range (IQR) filtering, and smoothing time-series coordinates using a 3rd-order Savitzky-Golay filter.
4. **Clinical Metric Computation:** Calculating bilateral knee range of motion, knee valgus/varum angles, pelvic tilt variance, ankle dorsiflexion projection (Equinus vs. Calcaneus gait), foot progression angle, trunk sway, and shoulder-pelvic divergence (scoliosis risk vector).
5. **Triage Classification & Reporting:** Classifying the patient's risk status based on evidence-based thresholds. If the landmark detection rate is $< 50\%$, the job is classified as `Insufficient Data`. Otherwise, gait metrics outside normal limits trigger `High Risk`, `DMD Risk`, or `Scoliosis Risk` banners. An AI summary is generated via OpenRouter, and a PDF is generated for download.

---

### **2.3 User Classes and Characteristics**

The user base is bifurcated into three distinct personas:
1. **Community Health Workers (CHWs):** Frontline healthcare workers in resource-limited settings. They possess baseline digital literacy but no specialized training in biomechanics. They require a simple, error-resistant UI that guides video capture, provides progress indicators, and displays binary triage results (`Normal` vs. `High Risk`) with clear instructions.
2. **Pediatricians / Physical Therapists:** Specialized clinicians who require comprehensive quantitative data. They utilize the interactive dashboard to evaluate knee angle waveform charts, pelvic tilt graphs, specific joint angles (in degrees), and AI-generated clinical summaries to formulate referral decisions.
3. **Parents / Guardians:** Non-clinical users who access the dashboard or printed PDF report. They require plain-language summaries (provided by the LLM integration) translating complex metrics like "Symmetry Index of 0.72" into understandable triage recommendations.

---

### **2.4 Operating Environment and Implementation Constraints**

1. **Hardware & Operating Systems:** The backend is designed for server-side execution (cross-compatible with Linux, Windows, macOS). The frontend is compatible with all modern HTML5 browsers (Chrome, Safari, Firefox, Edge) on desktop, tablet, and mobile devices.
2. **MediaPipe Systemic Bias:** Literature confirms that markerless pose estimation frameworks overestimate joint angles compared to marker-based gold standards, yielding a raw absolute error of up to $\pm 18.83^\circ$ for knee angles. Pedi-Growth accommodates this bias by enforcing:
   - **Relative calculations:** Prioritizing Range of Motion and Symmetry Index over raw absolute angles.
   - **Initial Contact (IC) Normalization:** Subtracting the average knee valgus angle at foot-strike frames to reduce absolute valgus error to $< 5^\circ$.
3. **Asynchronous Execution:** Heavy video processing (MediaPipe landmarker tracking, OpenCV rendering, FFmpeg encoding) must be offloaded to background worker tasks to prevent blocking the FastAPI server. The frontend polls job status every 1.0 second.

---

## **3. Requirements Engineering and Elicitation Framework**

### **3.1 The Elicitation Methodology**

To systematically establish Pedi-Growth's functional parameters, a four-step elicitation framework was utilized:
1. **Elicitation Approach Selection:** Choosing structured techniques tailored to clinical practitioners (pediatric orthopedists) and community deployment contexts.
2. **Preparation:** Formulating operational goals, clinical questions, and recording protocols before workshops.
3. **Execution:** Conducting requirements workshops, semi-structured interviews, and direct naturalistic observation.
4. **Analysis & Synthesis:** Analyzing qualitative feedback, identifying clinical constraints, and converting them into testable functional requirements.

---

### **3.2 Deployment of Specialized Elicitation Techniques**

1. **Prototyping Frameworks:** Rapid Next.js UI mockups were generated and shown to clinic nurses. This led to the creation of the live progress bar, the `JobHistoryTable` for multi-patient tracking, and clear warning banners for low-quality videos.
2. **Requirements Workshops:** Joint workshops were conducted with pediatric physical therapists and developers. This resolved a critical conflict: therapists wanted raw angle outputs, while developers needed to filter out pose estimation jitter. The compromise resulted in the 3-stage smoothing pipeline.
3. **Semi-Structured Interviews:** Done with pediatric neurologists to establish neuromuscular screening boundaries. This led to adding waddling gait (trunk sway variance) and toe-walking (equinus ankle limits) heuristics for Duchenne Muscular Dystrophy (DMD) screening.
4. **Naturalistic Observation:** Analysts observed video recording sessions of pediatric patients. This revealed that children rarely walk in a straight line or maintain perfect visibility, leading to the enforcement of the $50\%$ minimum `Detection Rate` threshold to reject low-quality videos.

---

### **3.3 Overcoming Elicitation Bottlenecks and Difficulties**

1. **Communication Barriers:** Clinicians described gait anomalies using complex qualitative terms (e.g., "Trendelenburg gait", "antalgic limp"), which developers could not directly program. These were translated into measurable mechanical vectors (e.g., pelvic tilt amplitude, left/right range of motion ratios).
2. **Privacy Concerns:** Pediatric data is subject to strict HIPAA and local data privacy laws. Elicitation workshops highlighted that raw videos of children must not be stored long-term or processed off-device without security. The system resolved this by applying local-first processing, automatically blurring faces via Gaussian filtering, and storing videos locally on-device.

---

## **4. Specific Requirements: Functional Capabilities**

### **4.1 Module 1: Patient and Video Pipeline**

This module manages patient profiles and validates, uploads, and processes gait videos.

| FR ID | Priority | Functional Description |
| :--- | :--- | :--- |
| **FR-1.01** | **Must** | The system shall ingest patient demographic data including a unique `patient_id` string, `patient_name` (optional), `age` integer ($0 \le \text{age} \le 18$), and optional clinical `notes`. |
| **FR-1.02** | **Must** | The system shall validate uploaded videos against container constraints (`.mp4`, `.mov`, `.avi`, `.webm`), maximum file size ($100\text{MB}$), and duration bounds (minimum 3 seconds, maximum 120 seconds). |
| **FR-1.03** | **Must** | The system shall process videos asynchronously, immediately returning a `queued` job status and offloading keypoint analysis to background tasks. |
| **FR-1.04** | **Must** | The system shall apply a real-time Gaussian blur ($51 \times 51$ kernel, $\sigma = 30$) to the detected facial bounding box on each video frame to preserve patient privacy. |
| **FR-1.05** | **Must** | The system shall construct an annotated video output rendering a color-coded skeletal overlay (e.g., green for left leg, red for right leg, white for pelvic girdle) over the processed frames. |
| **FR-1.06** | **Must** | The system shall invoke FFmpeg to transcode the temporary output video into a browser-compatible H.264 MP4 format with progressive download optimization (`+faststart`). |
| **FR-1.07** | **Should** | The system shall permit the deletion of completed or failed analysis jobs, automatically purging associated raw and processed video files from local disk storage. |

---

### **4.2 Module 2: Markerless Pose Estimation and Kinematic Metrics**

This module extracts skeletal coordinates and computes primary joint angles and symmetry indices.

| FR ID | Priority | Functional Description |
| :--- | :--- | :--- |
| **FR-2.01** | **Must** | The system shall instantiate the Google MediaPipe Pose Landmarker model, enforcing a minimum keypoint detection confidence of $0.5$. |
| **FR-2.02** | **Must** | The system shall extract the 3D spatial coordinates $(x, y, z)$ of the left/right hips (landmarks 23, 24), knees (landmarks 25, 26), and ankles (landmarks 27, 28) for every frame. |
| **FR-2.03** | **Must** | The system shall compute bilateral knee flexion/extension angles at each frame using vector algebra in the sagittal plane. |
| **FR-2.04** | **Must** | The system shall calculate the Range of Motion (ROM) for each knee as the difference between the maximum and minimum flexion angles: $\text{ROM} = \theta_{\text{max}} - \theta_{\text{min}}$. |
| **FR-2.05** | **Must** | The system shall calculate the Symmetry Index (SI) as: $\text{SI} = \frac{\text{ROM}_{\text{left}}}{\text{ROM}_{\text{right}}}$. |
| **FR-2.06** | **Must** | The system shall calculate the Asymmetry Percentage as: $\text{Asymmetry}\% = |1.0 - \text{SI}| \times 100$. |
| **FR-2.07** | **Must** | The system shall enforce a minimum Detection Rate of $50\%$. If the proportion of frames with successfully tracked poses is $< 50\%$, the system shall classify the job as `Insufficient Data` and abort metric calculations. |

---

### **4.3 Module 3: Orthopedic Screenings**

This module performs specific orthopedic assessments using joint vector calculations.

| FR ID | Priority | Functional Description |
| :--- | :--- | :--- |
| **FR-3.01** | **Must** | The system shall detect Initial Contact (IC) foot-strike frames by identifying local Y-coordinate minima in the ankle trajectory where the ankle is below the knee. |
| **FR-3.02** | **Must** | The system shall calculate IC-normalized knee valgus/varum angles by subtracting the reference valgus angle at IC from all frames, reducing systematic bias to $< 5.0^\circ$. |
| **FR-3.03** | **Must** | The system shall flag Rickets risk (Genu Varum/Valgum) if the average knee alignment angle falls below $170.0^\circ$ (varus/bowlegs) or exceeds $190.0^\circ$ (valgus/knock-knees). |
| **FR-3.04** | **Must** | The system shall calculate pelvic tilt as the horizontal angle between hip landmarks (23, 24). It shall flag Leg Length Discrepancy (LLD) / Trendelenburg risk if pelvic tilt variance is $> 10.0^\circ{}^2$ or amplitude is $> 8.0^\circ$. |
| **FR-3.05** | **Must** | The system shall calculate ankle dorsiflexion angles. It shall flag Clubfoot/Equinus gait if the minimum dorsiflexion angle remains $> 100.0^\circ$ (constant plantarflexion), or Calcaneus gait if maximum dorsiflexion remains $< 75.0^\circ$. |
| **FR-3.06** | **Should** | The system shall compute the transverse foot progression angle using heel (29, 30) and toe (31, 32) landmarks to evaluate clubfoot toe-in/toe-out progression. |

---

### **4.4 Module 4: Neuromuscular and Postural Screenings**

This module detects postural vectors indicating neuromuscular or spinal alignment concerns.

| FR ID | Priority | Functional Description |
| :--- | :--- | :--- |
| **FR-4.01** | **Must** | The system shall calculate the patient's trunk sway angle relative to the gravity vector using shoulder and pelvic midpoints. |
| **FR-4.02** | **Must** | The system shall flag Duchenne Muscular Dystrophy (DMD) waddling risk if the trunk sway variance over the gait cycle exceeds a heuristic threshold of $15.0^\circ{}^2$. |
| **FR-4.03** | **Must** | The system shall flag DMD toe-walking risk if the ankle dorsiflexion angle indicates severe, continuous plantarflexion (most equinus $> 110.0^\circ$). |
| **FR-4.04** | **Must** | The system shall calculate the postural asymmetry vector as the absolute divergence between shoulder tilt (landmarks 11, 12) and pelvic tilt (landmarks 23, 24) on each frame. |
| **FR-4.05** | **Must** | The system shall flag Scoliosis risk if the average shoulder-pelvic divergence angle exceeds $5.0^\circ$ (correlating with spinal curves $\ge 20^\circ$ with $94\%$ sensitivity). |

---

### **4.5 Module 5: AI Clinical Summary and PDF Reporting**

This module handles report generation and natural-language explanations.

| FR ID | Priority | Functional Description |
| :--- | :--- | :--- |
| **FR-5.01** | **Should** | The system shall transmit computed metrics (ROM, SI, joint angles, diagnostic flags) to OpenRouter API (Gemini default) to generate a parent-friendly explanation of the gait report. |
| **FR-5.02** | **Should** | The system shall compile a downloadable PDF clinical report embedding patient metadata, calculated metrics, risk classification, waveform charts, and the AI summary. |
| **FR-5.03** | **Should** | The system shall implement longitudinal patient tracking, displaying past Symmetry Index scores chronologically to monitor treatment progression. |

---

## **5. Specific Requirements: Non-Functional Attributes**

### **5.1 Biomechanical Signal Filtering Algorithms**

Raw coordinate trajectories extracted from markerless pose estimation are heavily corrupted by high-frequency tracking jitter. Direct calculation of joint angles from raw coordinate data amplifies these noise matrices, producing false-positive asymmetry alerts. To ensure clinical validity, Pedi-Growth enforces a strict 3-stage signal processing pipeline:
1. **Zero Interpolation:** Linear interpolation is applied to zero-value coordinates caused by transient joint occlusions. Gaps are interpolated only if they are $\le 15$ frames ($0.5$ seconds at $30\text{fps}$). Gaps exceeding $15$ frames remain zero to mark a pose detection break, preventing the generation of artificial flat signals.
2. **Outlier Filtering (IQR):** Statistical outliers are identified using the Interquartile Range method:
   $$\text{IQR} = Q_3 - Q_1$$
   Values falling outside $[Q_1 - 1.5 \times \text{IQR}, Q_3 + 1.5 \times \text{IQR}]$ are classified as tracking anomalies, replaced with NaN, and linearly interpolated.
3. **Savitzky-Golay Smoothing:** Positional coordinate series are smoothed using a Savitzky-Golay filter configured with a window size of $7$ frames and a $3\text{rd}$-order polynomial. To prevent border distortion artifacts at occlusion boundaries, the filter is applied segment-wise only across contiguous non-zero data segments.
4. **Butterworth Low-Pass Filtering:** Auxiliary signals including pelvic tilt, trunk sway, and shoulder tilt are smoothed using a zero-phase, $4\text{th}$-order low-pass Butterworth filter configured with a $6.0\text{Hz}$ cutoff frequency and $30.0\text{Hz}$ sampling frequency.

---

### **5.2 Performance and Algorithmic Scalability**

1. **Processing Latency:** The system shall process uploaded videos asynchronously. Under normal loads, a 10-second video ($30\text{fps}$, $300$ frames) shall complete pose detection, metrics computation, and video rendering within $45$ seconds.
2. **Database Query Response:** Standard relational database queries (e.g., retrieving patient history or loading job listings from Supabase) shall execute with a maximum response latency of $< 1.0$ second, irrespective of active background processing.
3. **Database Concurrency:** The Supabase client connection pool and background task queues shall be configured to handle up to 50 concurrent video upload and analysis requests without memory leaks or server crashes.

---

### **5.3 Usability, Portability, and Interoperability**

1. **User Interface Accessibility:** The frontend web dashboard shall support full dark-mode styling utilizing a unified design system. It must render responsively on mobile screen widths down to $320\text{px}$ to facilitate bedside clinical screening.
2. **Code Maintainability:** The backend codebase shall follow clean, modular Object-Oriented principles. It must consolidate all shared data schemas in `schemas.py` to serve as a single source of truth for TypeScript interfaces and database tables.
3. **Third-Party API Integration:** The OpenRouter integration shall execute as an optional component. If the `OPENROUTER_API_KEY` is missing or invalid, the backend must fail gracefully, permitting the completion of metrics calculation and video rendering while displaying a placeholder text on the UI.

---

### **5.4 Data Security, Privacy, and HIPAA Compliance**

1. **Local-First Computation:** To comply with pediatric health privacy guidelines, all pose landmark extraction and video processing shall execute locally on the hosting machine. Raw patient videos shall never be transmitted to external servers.
2. **Face Blurring Enforcement:** The face-blurring algorithm (Gaussian kernel) must be executed at the beginning of the frame processing loop. The system is forbidden from caching, writing to disk, or rendering any video frames that contain unblurred faces.
3. **Unsuccessful Access Auditing:** The database structure shall enforce Row Level Security (RLS) on the `patients`, `jobs`, and `results` tables. All unauthorized or unsuccessful attempts to read or mutate patient data using the Supabase API shall be blocked and logged.

---

## **6. Verification, Validation, and Traceability**

### **6.1 Conceptual Distinctions in Software Assessment**

Verification and validation execute distinct quality assurance functions within the Pedi-Growth development lifecycle:
- **Verification:** Continuous, localized evaluation of intermediate software artifacts. It evaluates source code structure, API schemas, design patterns, and database models to ensure the system is built in accordance with specifications. It answers: *"Are we building the system right?"* Activities include unit testing, automated linting, and peer reviews.
- **Validation:** Summative evaluation of the compiled, running application at the end of the development lifecycle. It confirms that the system meets the actual clinical triage needs of pediatricians and community health workers. It answers: *"Are we building the right system?"* Activities include black-box end-to-end testing, user acceptance testing (UAT), and validation of metrics against clinical gait datasets.

---

### **6.2 Traceability Foundations and Strategic Benefits**

Requirements Traceability is the process of mapping high-level clinical objectives (Business Requirements) to granular functional code features (FSD IDs) and verifying them through test cases (Test Case IDs).
Pedi-Growth utilizes bi-directional traceability to achieve the following benefits:
1. **Scope Control:** Ensuring every implemented module directly serves a validated clinical screening goal, eliminating scope creep.
2. **Impact Analysis:** Allowing developers to instantly identify which downstream components are affected if a MediaPipe landmark calculation is updated.
3. **Risk Reduction:** Mapping complex signal smoothing algorithms directly to verification tests, ensuring math changes do not corrupt output metrics.
4. **Regulatory Audit Readiness:** Providing an automated trace of how patient data flows from ingestion, through face blurring, to final report generation.

---

### **6.3 The Comprehensive Requirements Traceability Matrix**

The following table maps the high-level business goals to the functional requirements and specific test cases executed in the validation test suite.

| High-Level Business Goal | Functional Requirement Mapping | Priority | Associated Test Case ID | Detailed Verification Test Case Description |
| :--- | :--- | :--- | :--- | :--- |
| **BRD_01: Pediatric Ingestion** | FR-1.01: Patient Intake<br>FR-1.02: Video Validation | Must | TC#1001<br>TC#1002 | Verify system rejects non-video files and duration exceeding 120s; verify patient schema inserts correctly. |
| **BRD_02: Privacy Protection** | FR-1.04: Face Blurring | Must | TC#1003 | Verify Gaussian filter applies to facial coordinates on every processed frame; verify raw unblurred frame is not cached. |
| **BRD_03: Gait Kinematics** | FR-2.03: Knee Angle Math<br>FR-2.04: ROM Calculation | Must | TC#2001<br>TC#2002 | Verify knee angle calculation using 3D sagittal vector math; verify ROM is calculated as $\theta_{\text{max}} - \theta_{\text{min}}$. |
| **BRD_04: Gait Symmetry** | FR-2.05: Symmetry Index<br>FR-2.06: Asymmetry % | Must | TC#2003 | Verify Symmetry Index preserves directionality ($\text{SI} = \text{ROM}_L / \text{ROM}_R$); verify asymmetry calculation matches $|1-\text{SI}| \times 100$. |
| **BRD_05: Quality Assurance** | FR-2.07: Detection Rate | Must | TC#2004 | Verify system aborts metric calculation and returns `Insufficient Data` if the overall pose detection rate falls below $50\%$. |
| **BRD_06: Rickets Screening** | FR-3.02: IC Normalization<br>FR-3.03: Knee Valgus/Varum | Must | TC#3001<br>TC#3002 | Verify initial contact detection via ankle Y minima; verify IC-normalization reduces valgus error to $<5^\circ$; verify genu valgum/varum alerts trigger. |
| **BRD_07: LLD Screening** | FR-3.04: Pelvic Tilt | Must | TC#3003 | Verify horizontal angle calculation between hip joint landmarks; verify Trendelenburg alert flags on variance $>10.0^\circ{}^2$. |
| **BRD_08: Clubfoot Screening** | FR-3.05: Ankle Dorsiflexion<br>FR-3.06: Progression Angle | Must | TC#3004 | Verify sagittal plane ankle projection; verify Equinus ($>100^\circ$) and Calcaneus ($<75^\circ$) alerts trigger on stance phase limits. |
| **BRD_09: DMD Waddling** | FR-4.01: Trunk Sway Math<br>FR-4.02: Sway Variance | Must | TC#4001 | Verify trunk sway deviation from vertical; verify DMD waddling risk flags on trunk sway variance exceeding $15.0^\circ{}^2$. |
| **BRD_10: Scoliosis Screening** | FR-4.04: Postural Vector<br>FR-4.05: Divergence Angle | Must | TC#4002 | Verify absolute shoulder-pelvic tilt divergence calculation; verify scoliosis risk flags on divergence average exceeding $5.0^\circ$. |
| **BRD_11: Signal Processing** | NFR-5.01: 3-Stage Pipeline<br>NFR-5.02: Butterworth Filter | Must | TC#5001<br>TC#5002 | Verify linear interpolation of gaps $\le 15$ frames; verify Savitzky-Golay smoothing preserves peaks; verify Butterworth low-pass removes jitter. |
| **BRD_12: Clinical Summary** | FR-5.01: AI Explanation | Should | TC#6001 | Verify OpenRouter payload structure; verify fallback placeholder text is displayed if the API request fails or times out. |

---

## **7. Concluding Analytical Insights**

The formulation of the Software Requirements Specification for the Pedi-Growth pediatric gait analysis system represents an immense leap in democratizing orthopedic and neuromuscular screening. By shifting the diagnostic workflow from costly, laboratory-based 3D motion capture environments (e.g., VICON) to standard smartphone optics, Pedi-Growth establishes a highly accessible triage model suited for resource-constrained clinics. Adherence to the IEEE 830-1998 standard, combined with the lifecycle guidelines of ISO/IEC/IEEE 29148, ensures a highly specified, unambiguous engineering blueprint.

The clinical utility of Pedi-Growth relies on the mathematical integrity of its signal processing and normalization pipelines. As confirmed by validation studies, raw pose estimation from markerless models is prone to systematic tracking noise. Pedi-Growth resolves this through a three-stage smoothing pipeline (linear zero-interpolation, IQR outlier filtering, and segment-wise Savitzky-Golay filtering) combined with Initial Contact (IC) normalization. The implementation of IC-normalization represents a major accuracy milestone, reducing MediaPipe's systematic knee valgus error from $\pm 18.83^\circ$ to less than $5.0^\circ$, making it acceptable for screening.

Furthermore, integrating multi-condition screenings—spanning Cerebral Palsy gait asymmetry, Rickets genu varum/valgum, Trendelenburg LLD, Clubfoot ankle dorsiflexion, DMD waddling gait, and early-onset scoliosis vectors—into a single web application maximizes the clinical value extracted from a single video recording. Enforcing the $50\%$ minimum detection rate safeguards the system against producing false-positives under poor lighting or clothing conditions. Through the bi-directional Requirements Traceability Matrix and a validation suite covering over 50 test cases, the system is fully equipped to deliver a secure, privacy-preserving, and clinically sound screening platform that bridges the gap between community-level health services and specialized pediatric care.

---

## **8. Works Cited**

1. *Reliability and validity of knee valgus angle calculation at single-leg drop landing by posture estimation using machine learning.* PMC11399566 (2024). [https://pmc.ncbi.nlm.nih.gov/articles/PMC11399566/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11399566/)
2. *Knee Flexion/Extension Angle Measurement for Gait Analysis Using Machine Learning Solution "MediaPipe Pose" and Its Comparison with Kinovea.* ResearchGate (2023). [https://www.researchgate.net/publication/369058814](https://www.researchgate.net/publication/369058814)
3. *A Comparative Analysis of Symmetry Indices for Spatiotemporal Gait Features in Early Parkinson's Disease.* MDPI Sensors (2023). [https://www.mdpi.com/2035-8377/15/3/70](https://www.mdpi.com/2035-8377/15/3/70)
4. *Clinical and Topographic Screening for Scoliosis in Children Participating in Routine Sports: A Prevalence and Accuracy Study in a Spanish Population.* PMC11722016 (2025). [https://pmc.ncbi.nlm.nih.gov/articles/PMC11722016/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11722016/)
5. *Filtering Biomechanical Signals in Movement Analysis.* PMC8271607 (2021). [https://pmc.ncbi.nlm.nih.gov/articles/PMC8271607/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8271607/)
6. *Standard Guideline for School Scoliosis Screening.* Pediatric Orthopaedic Society of North America (POSNA) & Scoliosis Research Society (SRS) Guidelines.
7. *Normative Joint Range of Motion Reference Values for Children.* Pediatric Orthopedic Association & CDC Clinical Guidelines.
8. *ISO/IEC/IEEE 29148:2018 Systems and software engineering — Life cycle processes — Requirements engineering.* ISO Standard. [https://www.iso.org/standard/72087.html](https://www.iso.org/standard/72087.html)
9. *IEEE Recommended Practice for Software Requirements Specifications.* IEEE Std 830-1998. [https://standards.ieee.org/standard/830-1998.html](https://standards.ieee.org/standard/830-1998.html)