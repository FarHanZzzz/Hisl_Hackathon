# Pedi-Growth: A Case Study in AI-Powered Pediatric Gait Analysis

## 1. The Core Problem

**The Inaccessibility of Early Diagnosis**
Motor developmental disorders—such as Cerebral Palsy, Duchenne Muscular Dystrophy (DMD), Clubfoot, and Early-Onset Scoliosis—affect millions of children worldwide. Early diagnosis is the single most important factor for long-term health, as early therapeutic interventions (ideally before age 2) drastically improve a child's cognitive and motor outcomes. 

However, accurately diagnosing gait (walking) abnormalities traditionally requires an **Instrumented Motion Capture Laboratory**. These facilities rely on expensive 3D force plates, electromyography, and highly trained biomechanical specialists. Establishing such a lab costs hundreds of thousands of dollars. 

For parents in resource-constrained settings, rural communities, or developing nations, access to these facilities is nearly non-existent. Consequently, subtle gait abnormalities are often missed during routine checkups, delaying life-altering treatment until irreversible damage has occurred.

---

## 2. Real-World Health System Challenges Addressed

Pedi-Growth sits at the intersection of several major health domain themes. Specifically, it directly addresses the following real-world health system challenges:

1. **Pediatric AI**
   Unlike general adult-focused AI models, this system is heavily targeted toward pediatric physiology. Since conditions like Duchenne Muscular Dystrophy (DMD) and Early-Onset Scoliosis emerge during vital developmental windows, the AI algorithms are explicitly calibrated for pediatric gait parameters. This dedicated focus ensures that children—often an underserved demographic in automated health tech—receive precise and early intervention strategies.

2. **Diagnostic Tools (Clinical Screening)**
   While not producing a definitive medical diagnosis, the tool acts as a powerful precursor in the diagnostic pipeline. By transforming a simple mathematical pose-estimation (MediaPipe) concept into a clinical screening instrument, it bridges the gap between observation and clinical diagnosis. It identifies microscopic asymmetries that human eyes cannot catch, providing practitioners with objective data instead of subjective parental anecdotes.

3. **Healthcare Workforce Shortages**
   There is a severe global shortage of pediatric neurologists and biokineticists. Getting an appointment can take months, and traveling to a specialized gait lab is impossible for much of the world. Pedi-Growth alleviates this choke-point. Because it is highly automated and uses standard smartphones, community health workers, nurses, or even parents can perform the preliminary screening. This effectively multiplies the reach of the limited specialist workforce.

4. **Preventive Health**
   Detecting a motor disorder at age 1 is vastly different from detecting it at age 6. Early neuroplasticity means that early physical therapy interventions can actually rewire and correct motor responses. Thus, this screening tool acts as preventative healthcare—catching physical degradation before it becomes permanent, thereby preserving a child’s long-term mobility and quality of life.

5. **Health Literacy**
   Medical jargon is notoriously isolating. Telling a parent "Your child has an abnormal 130-degree active dorsiflexion indicating equinus" causes panic and confusion. Pedi-Growth incorporates an LLM-driven Clinical Summary feature that translates these hyper-complex biomechanical calculations into clear, actionable, and empathetic plain language. This empowers parents to accurately understand their child's health status and advocate for proper care.

---

## 3. The Solution: Pedi-Growth

**Pedi-Growth** is an AI-powered clinical screening tool designed to democratize pediatric gait analysis. It acts as an accessible, rapid-triage system that bridges the gap between community-level health services and specialized pediatric care.

Instead of requiring expensive motion-capture labs, Pedi-Growth allows a pediatrician, a community health worker, or even a parent to simply record a short video of a child walking using any standard smartphone camera. The system processes the video to quantify biomechanical asymmetries and provides an immediate, easily understandable screening result.

**The primary goal is not to definitively diagnose, but to confidently screen and flag children who require an urgent specialist referral.**

---

## 3. How It Works (The User Experience)

1. **Upload:** The user uploads a 3 to 60-second video of the child walking, along with basic patient information.
2. **Analysis Context:** A background intelligent scanner analyzes the video frame by frame.
3. **Privacy First:** The child's face is automatically blurred in the system to ensure privacy, and no raw video leaves the local device unnecessarily.
4. **Visual Overlay:** The system overlays a color-coded "stick-figure" (skeleton map) onto the child to visually demonstrate how the AI tracks their body.
5. **The Result:** The dashboard generates simple, clear metrics, interactive charts, and a final screening status:
   - **NORMAL:** Gait symmetry falls within expected pediatric bounds.
   - **HIGH RISK / NEUROMUSCULAR RISK:** Significant asymmetry or specific disease profiles detected. Needs clinical referral.
   - **INSUFFICIENT DATA:** The video quality or angle was too poor to make a safe determination.

Additionally, an AI-powered summary feature acts as a "digital doctor," translating complex biomechanical metrics into plain language that parents can easily understand.

---

## 4. What Are We Actually Calculating? (The Science & Math)

Behind the scenes, Pedi-Growth utilizes Google's **MediaPipe Pose Landmarker**—a sophisticated computer vision engine. MediaPipe identifies **33 3D body landmarks** (joints and body parts) on the child for every single frame of the video. 

From these coordinates, our engine calculates various clinical metrics:

### A. The Baseline: Knee Range of Motion (ROM) & Symmetry
- **Knee Flexion:** By measuring the angle formed by the Hip, Knee, and Ankle, we track how much the knees bend and straighten during the walk.
- **Symmetry Index (SI):** We compare the Range of Motion (ROM) of the left leg to the right leg. A healthy gait exhibits a natural symmetry (usually a ratio between 0.85 and 1.15). Values outside this represent an **Asymmetry** and immediately trigger a "High Risk" warning.

### B. Neuromuscular & Orthopedic Disease Profiles
Beyond basic symmetry, the system runs heuristics targeting specific condition profiles based on joint spatial relationships over time:

1. **Rickets / Bowlegs / Knock-Knees (Valgum/Varus)**
   - **Calculation:** We analyze the 3D angle of the leg from a frontal view (Knee Valgus).
   - **Innovation:** Because smartphone video angles can distort 3D tracking, we map the trajectory of the ankle entering the screen to pinpoint "Initial Contact" (when the foot strikes the ground). Normalizing the angle to this precise moment heavily removes video distortion, letting us detect abnormal knee bowing.

2. **Clubfoot (Equinus / Calcaneus)**
   - **Calculation:** Dorsiflexion Angle (the angle between the shin and the foot/heel). 
   - **Interpretation:** If a child is consistently walking on their tiptoes without ever dropping their heel, the angle remains obtuse (Equinus). If they never point their toes down, they walk purely on their heels (Calcaneus).

3. **Duchenne Muscular Dystrophy (DMD)**
   - **Calculation:** Trunk Sway Variance.
   - **Interpretation:** DMD often causes weak pelvic muscles. To compensate, a child will heavily throw their upper body to the left and right with every step to keep their balance. By tracking the horizontal shift of the shoulders relative to the hips over time, the system flags excessive "waddling" (Trunk Sway).

4. **Early-Onset Scoliosis**
   - **Calculation:** Shoulder Tilt.
   - **Interpretation:** By tracking the vertical difference between the left and right shoulder, the system identifies systematic, chronic slanting that points to spinal curvature.

5. **Leg Length Discrepancy (LLD)**
   - **Calculation:** Pelvic Tilt Variance.
   - **Interpretation:** If one leg is physically shorter than the other, the hips will violently drop on one side with every step. We measure the angle line drawn between the left and right hip to catch this drop.

---

## 5. Signal Processing: Turning Noise into Medicine

A key challenge when extracting medical data from phone videos is that the data is incredibly "noisy." A shaky hand, a baggy shirt, or bad lighting can make the joints jitter around on the screen.

Pedi-Growth solves this through robust signal processing techniques:
- **Interpolation:** If the system loses track of the knee for a fraction of a second, it mathematically bridges the gap.
- **Outlier Removal (IQR Filtering):** If an angle randomly spikes to an impossible degree because of video blur, it is statistically identified and discarded.
- **Savitzky-Golay Smoothing:** The raw, jagged data points are passed through a complex polynomial smoothing algorithm, taking a jagged heart-monitor-like line and turning it into a smooth, readable medical wave.

---

## 6. Summary of Impact

Pedi-Growth transforms standard digital media into a predictive medical triage tool. 
- **For the Healthcare System:** It dramatically lowers the barrier to entry for screening, potentially routing undiagnosed children into the medical pipeline much faster.
- **For the Patient:** It introduces an objective, non-invasive standard of measurement that doesn't rely on specialized geography or wealth. 
- **For AI in Healthcare:** It demonstrates that while LLMs are amazing communicators, integrating deep-learning computer vision with grounded mathematical smoothing algorithms provides real-world, clinical utility that pure text models cannot.
