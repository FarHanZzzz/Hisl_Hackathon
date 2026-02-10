# Pediatric Gait Norms for AI Screening

Biomechanical Reference Atlas for 
Pediatric Gait Analysis: Normative 
Standards, Pathological Classifications, 
and AI Implementation Framework 
1. Executive Summary 
The development of automated, video-based screening tools for pediatric neuromuscular 
disorders represents a transformative shift in global health diagnostics. This report serves as 
a comprehensive biomechanical reference document designed to underpin the development 
of the "Pedi-Growth AI" engine—a computer vision-based triage tool for identifying Cerebral 
Palsy (CP) and developmental delays in children aged 2–12. 
This research synthesizes data from historical and modern gait databases (Sutherland, 
Schwartz, UNB), clinical classification systems (Rodda, Edinburgh Visual Gait Score), and 
validated symmetry metrics to establish a robust "ground truth" for algorithmic development. 
The objective is to translate complex three-dimensional kinematic data into two-dimensional, 
actionable logic gates that can be processed by pose estimation libraries such as MediaPipe 
or OpenPose. 
Key Findings and Architectural Recommendations: 
The analysis of the provided research material indicates several critical factors for the 
successful deployment of an AI screening tool: 
●​ The Dynamics of Gait Maturation: The pediatric gait cycle is not static; it undergoes 
rapid and fundamental maturation between ages 2 and 4. AI models must utilize 
age-stratified normative thresholds rather than a single "pediatric" baseline. Applying 
adult or school-age norms to toddlers (ages 2-3) will result in unacceptably high 
false-positive rates, as healthy toddlers naturally exhibit wide-based, flexed-knee gait 
patterns that mimic pathology.1 
●​ The Knee as a Sentinel Joint: The sagittal plane knee angle (
) emerges as the most 
reliable kinematic marker for markerless tracking due to its high signal-to-noise ratio 
compared to rotational parameters (transverse plane) or frontal plane mechanics. The 
"double bump" of knee flexion—specifically the shock-absorbing flexion in stance and 
the clearance flexion in swing—is the primary discriminator between healthy gait and the 
stiff-knee or crouch gait patterns often seen in CP.4 
●​ Symmetry Index (SI) Calibration: While the theoretical ideal for the Symmetry Index is 
, clinical validation studies suggest that an asymmetry threshold of 15% (
 or 
) is more clinically relevant for screening than the stricter 
10% often cited in adult literature. This accounts for the natural extrinsic variability in 
developing neuromuscular systems and limb dominance in children.5 
●​ Diagnostic Classification Logic: The Rodda Classification system provides the 
necessary logic to distinguish between CP subtypes (e.g., True Equinus vs. Crouch Gait) 
based on the phase-specific coupling of knee and ankle angles. This classification can be 
algorithmically implemented by analyzing knee extension at terminal stance and knee 
flexion at initial contact.7 
●​ Sensitivity and Specificity: Current video-based markerless gait analysis tools 
demonstrate sensitivities ranging from 78% to 92% and specificities from 88% to 90% 
when screening for CP. These metrics support the use of such tools for triage and 
screening but highlight the necessity of "human-in-the-loop" confirmation for diagnosis.8 
This document provides the specific numerical thresholds, angular velocities, and logic trees 
required to program the Pedi-Growth AI engine, transforming clinical observations into a 
quantifiable, scalable diagnostic aid. 
2. Introduction: The Clinical and Technological Context 
2.1 The Burden of Late Diagnosis in Cerebral Palsy 
Cerebral Palsy (CP) is the most common cause of motor impairment leading to physical 
disability in children, affecting approximately 2 to 3 per 1,000 live births globally. It is a group 
of permanent disorders of the development of movement and posture, causing activity 
limitations attributed to non-progressive disturbances that occurred in the developing fetal or 
infant brain. The motor disorders of CP are often accompanied by disturbances of sensation, 
perception, cognition, communication, and behavior.7 
Early detection is critical. Neuroplasticity is highest in the first two years of life, making this 
the optimal window for therapeutic intervention. However, diagnosis is frequently delayed. 
While high-risk infants (e.g., those born preterm) are often monitored, many children, 
particularly in resource-constrained settings like Bangladesh (the target demographic for 
Pedi-Growth AI), may not receive a formal diagnosis until overt motor delays manifest at age 
2, 3, or later. By this time, maladaptive gait patterns and secondary musculoskeletal 
deformities (contractures, bony torsion) may already be established. 
The current "gold standard" for diagnosis involves clinical examination by a pediatric 
neurologist and, for gait specifically, 3D Instrumented Gait Analysis (IGA). IGA uses infrared 
cameras, reflective markers, and force plates to quantify movement with millimeter precision. 
However, IGA is expensive, requires specialized infrastructure, and is largely inaccessible to 
the majority of the global population. This creates a "diagnosis gap" that low-cost, 
video-based AI tools aim to fill. 
2.2 The Role of Computer Vision in Gait Analysis 
Recent advancements in computer vision, specifically pose estimation libraries like Google's 
MediaPipe and OpenPose, have democratized motion analysis. These systems can extract 2D 
or 3D skeletal keypoints from standard RGB video footage without the need for physical 
markers.11 
●​ MediaPipe Pose: Utilizes a top-down approach, detecting the person first and then 
estimating 33 3D landmarks. It is optimized for mobile devices and real-time processing, 
making it ideal for the "Local-First" architecture of the Pedi-Growth project. It has shown 
good agreement with Vicon systems for sagittal plane kinematics, particularly at the 
knee.12 
●​ OpenPose: A bottom-up approach that is highly robust but computationally heavier. 
While it may offer slightly higher accuracy in complex multi-person scenes, MediaPipe's 
efficiency on edge devices makes it the superior choice for a smartphone-based triage 
tool.13 
The challenge lies in the "Sim2Real" gap—translating the high-fidelity biomechanical norms 
derived from 3D IGA labs (Sutherland, Schwartz) into thresholds that hold true for 2D 
markerless video analysis. This report addresses that gap by defining norms not just as 
absolute degrees, but as patterns of movement and relative ratios (Symmetry Index) that are 
robust to the limitations of 2D video. 
3. Pediatric Gait Maturation: The Normative 
Foundation 
To accurately screen for pathology, the AI must first possess a rigorous definition of 
"normality." However, in pediatrics, normality is a moving target. The biomechanics of walking 
change fundamentally from the toddler years (2–3) to school age (7+), primarily driven by the 
maturation of the central nervous system (myelination), changes in anthropometry (mass 
distribution), and skeletal alignment (resolution of femoral anteversion and tibial torsion). 
If an AI applies the strict gait standards of a 7-year-old to a 2-year-old, it will generate a high 
volume of false positives, flagging normal developmental variations as pathological. 
Therefore, the Pedi-Growth engine must implement an Age-Stratified Normative 
Framework. 
3.1 The Evolution of Determinants of Gait (Ages 2–12) 
The "Determinants of Gait" refer to the mechanical optimizations the body uses to minimize 
the displacement of the center of mass (COM) and conserve energy. In children, these 
determinants evolve sequentially. 
3.1.1 The "Toddler Gait" (Ages 2–3) 
Children in this age bracket (specifically 12 to 36 months) exhibit a gait pattern primarily 
focused on stability rather than efficiency. 
●​ Base of Support: Toddlers walk with a wide base of support. The ratio of pelvic span to 
ankle spread is lower than in older children. This wide stance increases lateral stability 
but introduces a "waddling" appearance that can mimic gluteal weakness.3 
●​ Knee Kinematics (The Flexion Wave): The "knee flexion wave" (the small 
flexion-extension-flexion oscillation during stance) is present but often diminished in 
amplitude compared to adults. Toddlers frequently exhibit prolonged stance phase 
flexion. This "crouch-like" appearance is often physiological, resulting from weaker 
plantarflexors and a strategy to lower the COM for balance.14 
●​ Upper Extremities: While the "high guard" position (arms held high) typically resolves by 
18 months, reciprocal arm swing may not be fully established or symmetrical until age 
3-4. 
●​ Cadence and Velocity: Toddlers have a high cadence (steps/min) and lower single-limb 
stance duration (~32% of the gait cycle vs. the mature 38-40%). They spend less time on 
one leg because their single-limb balance is immature.3 
●​ Implication for AI Screening: Screening algorithms for this age group must relax the 
thresholds for "Crouch Gait" detection. A knee flexion of 10–15° at mid-stance should be 
considered within normal limits for a 2-year-old, whereas it would be flagged as 
pathological in an older child.14 
3.1.2 The Transition Period (Ages 3–5) 
By age 4, the fundamental inter-relationships between time-distance parameters become 
fixed. This is the critical window where normative data stabilizes and the "adult-like" pattern 
emerges. 
●​ Reciprocal Arm Swing: Present in 98% of typically developing (TD) children by age 3.5 
and 100% by age 4. The absence of reciprocal arm swing (or unilateral absence, where 
one arm swings and the other is fixed) at this age is a strong red flag for hemiplegic CP.2 
●​ Knee Maturation: The adult-like "knee flexion wave" becomes distinct. The second peak 
of vertical force on force plates (push-off) becomes prominent, indicating mature 
plantarflexor function and the ability to propel the body forward rather than just "falling" 
forward.1 
●​ Skeletal Alignment: Physiological genu valgum ("knock-knees") peaks around age 3-4 
before resolving toward the adult norm. The AI must distinguish this frontal plane 
alignment from the sagittal plane crouch.15 
3.1.3 Mature Gait (Ages 7–12) 
By age 7, gait kinematics in the sagittal plane are virtually indistinguishable from adults. 
●​ Stability: Duration of single-limb stance stabilizes at approximately 38–40% of the gait 
cycle.3 
●​ Joint Angles: Sagittal plane rotation curves for the hip, knee, and ankle match adult 
patterns. Any persistent toe-walking, knee flexion in stance, or significant asymmetry 
beyond this age is highly correlated with pathology and warrants immediate referral.14 
3.2 Age-Specific Normative Data Tables 
The following data, synthesized from the Sutherland (San Diego), Schwartz, and UNB 
databases, provides the quantitative reference standard for the "Pedi-Growth" AI. The AI 
should utilize these values to calculate Z-scores or deviation indices for each frame of the 
analyzed video. 
Table 1: Normative Knee Range of Motion (ROM) by Age Group 
Data synthesized from 17 
Parameter 
Age Group 
Mean (°) 
95% Confidence 
Interval / Range 
Passive Flexion 
Children (3-12) 
132.2° 
118.6° – 141.2° 
 
Adolescents (13+) 
130.8° 
119.9° – 139.3° 
Active Flexion 
Children (3-12) 
130.2° 
119.5° – 137.8° 
 
Adolescents (13+) 
128.6° 
121.5° – 137.4° 
Passive Extension 
Children (3-12) 
2.3° 
(Hyperextension) 
-0.5° – 3.9° 
 
Adolescents (13+) 
2.2° 
-1.1° – 5.4° 
Active Extension 
Children (3-12) 
1.3° 
-3.8° – 5.2° 
 
Adolescents (13+) 
1.0° 
-4.3° – 6.8° 
Note on Interpretation: Positive extension values in this table denote hyperextension 
(recurvatum). This is extremely common and normal in young children due to generalized 
ligamentous laxity. The AI must be programmed not to flag knee hyperextension of < 5-10° as 
pathological in children under 6 years old, as this is a normal developmental variant.19 
Pathological hyperextension (recurvatum) is typically abrupt, forceful, or asymmetrical. 
4. Kinematic Reference Atlas: The Knee in the Sagittal 
Plane 
The knee joint is the primary engine of gait efficiency and the most frequent site of pathology 
in CP. For the AI to function as a screening tool, it must analyze the knee's trajectory through 
the phases of the gait cycle. This analysis requires breaking the cycle down into specific 
events and evaluating the angle at those discrete points. 
4.1 Phase-Specific Biomechanical Markers and Logic 
The gait cycle is traditionally divided into Stance Phase (60%) and Swing Phase (40%). The 
Pedi-Growth AI should analyze the knee angle at the following critical checkpoints. 
Table 2: Sagittal Plane Knee Angles Across the Gait Cycle 
Data derived from 4 
Gait Phase 
% Cycle 
Descriptio
n 
Normative 
Angle 
(Mean) 
Pathologic
al Flag 
(Approx.) 
Biomechan
ical 
Significanc
e 
Initial 
Contact 
(IC) 
0% 
Heel strike 
5° Flexion 
(Range 
0-10°) 
> 20° 
Flexion 
(Crouch/Ju
mp) 
Knee must 
be 
extended to 
maximize 
stride 
length. 
Flexion 
here 
suggests 
hamstring 
tightness. 
Loading 
Response 
(LR) 
0-12% 
Weight 
acceptance 
15-20° 
Flexion 
> 30° 
Flexion OR 
< 5° (Stiff) 
"Shock 
absorption" 
phase. Lack 
of flexion 
creates a 
jarring, stiff 
gait; excess 
flexion 
indicates 
weakness. 
Mid-Stanc
e (MSt) 
12-31% 
Single limb 
support 
0-5° 
Flexion 
(Extending) 
> 15° 
Flexion 
(Crouch) 
Knee must 
extend to 
support 
body 
weight 
efficiently. 
Persistent 
flexion is 
the 
hallmark of 
Crouch 
Gait. 
Terminal 
Stance 
(TSt) 
31-50% 
Heel rise 
0-5° 
Extension 
(Max Ext) 
> 20° 
Flexion 
(Crouch) 
Peak 
extension. 
Body rolls 
over the 
forefoot 
(forefoot 
rocker). 
Pre-Swing 
(PSw) 
50-60% 
Toe off 
preparation 
30-40° 
Flexion 
< 20° (Stiff 
Knee) 
Rapid 
flexion 
begins to 
prepare for 
clearance. 
Initial 
Swing 
60-75% 
Acceleratio
n 
60-65° 
Flexion 
< 45° (Stiff 
Knee) 
CRITICAL 
MARKER. 
Peak flexion 
(ISw) 
(Peak) 
is required 
for foot 
clearance. 
Mid-Swing 
(MSw) 
75-87% 
Clearance 
25-30° 
Flexion 
(Extending) 
- 
Tibia 
becomes 
vertical. 
Terminal 
Swing 
(TSw) 
87-100% 
Deceleratio
n 
0-5° 
Flexion 
> 15° 
Flexion 
Hamstrings 
decelerate 
the limb. 
Tightness 
prevents 
full 
extension 
before next 
heel strike. 
4.1.1 Weight Acceptance (0–12%) 
●​ Mechanism: Upon Initial Contact (IC), the knee must be near full extension to maximize 
step length. Immediately following IC, the knee must flex to 15–20° (Loading Response) 
to absorb the impact forces. This flexion is controlled eccentrically by the quadriceps. 
●​ CP Deviation: Children with CP often fail to extend at IC (landing in flexion due to 
hamstring tightness) or fail to flex during loading (due to spastic quadriceps or "stiff 
knee" pathology), leading to a rigid, inefficient gait. 
●​ AI Logic:​
IF Knee_Angle_IC > 20° THEN Flag = "Crouch/Flexed Landing" 
4.1.2 Single Limb Support (12–50%) 
●​ Mechanism: During Mid-Stance (MSt) and Terminal Stance (TSt), the knee extends again 
to approximately 0° to provide a stable pillar for the body to pass over. This extension 
reduces the demand on the quadriceps (the "plantar flexion-knee extension couple"), 
conserving energy. 
●​ CP Deviation: "Crouch Gait" is defined by the failure to achieve this extension. The knee 
remains flexed (>20°) throughout stance, which dramatically increases the internal knee 
extensor moment and energy expenditure. Conversely, "Recurvatum" (hyperextension) 
may occur if the soleus is spastic, pulling the tibia backward. 
●​ AI Logic:​
IF Min_Knee_Angle_Stance > 15° THEN Flag = "Possible Crouch"​
IF Min_Knee_Angle_Stance < -10° THEN Flag = "Hyperextension" 
4.1.3 Swing Limb Advancement (50–100%) 
●​ Mechanism: Pre-Swing (PSw) and Initial Swing (ISw) require rapid flexion to 
approximately 60° to clear the foot from the ground. 
●​ CP Deviation: "Stiff Knee Gait" is characterized by a reduced peak flexion in swing (< 
45°) and delayed timing of this peak. This insufficient flexion leads to tripping or 
necessitates compensatory movements like circumduction (swinging the leg out) or hip 
hiking (lifting the pelvis). 
●​ AI Logic: IF Max_Knee_Angle_Swing < 50° THEN Flag = "Stiff Knee / Low Clearance".22 
4.2 Mathematical Definition of the Knee Angle ( ) 
To ensure consistency with the normative data provided, the AI must calculate the knee angle 
using the vector subtraction method. Based on standard biomechanical conventions and the 
Pedi-Growth Hackathon Plan 6, the calculation is: 
 
Where: 
●​
 = Hip Keypoint (MediaPipe Landmark 23 for Left, 24 for Right) 
●​
 = Knee Keypoint (MediaPipe Landmark 25 for Left, 26 for Right) 
●​
 = Ankle Keypoint (MediaPipe Landmark 27 for Left, 28 for Right) 
Normalization and Correction Factor: 
Raw vector calculations often yield 
 for a fully extended leg (a straight line). However, 
clinical normative tables (like Table 2 above) typically report full extension as 
 and flexion 
as positive degrees (e.g., 
 flexion). 
●​ The AI must normalize the output: 
 
●​ If 
 indicates hyperextension (e.g., the vectors cross past 180), the result should be 
signed as negative to align with clinical norms (e.g., -5° represents 5° of 
recurvatum/hyperextension).23 
5. Pathological Deviations: Cerebral Palsy Screening 
Markers 
Screening for CP requires more than just identifying "abnormal" angles; it requires classifying 
the pattern of abnormality. This allows the system to offer specific insights rather than generic 
alerts. The "Pedi-Growth" AI should implement the logic of two major clinical frameworks: the 
Rodda Classification and the Edinburgh Visual Gait Score (EVGS). 
5.1 The Rodda Classification System 
Proposed by Rodda and Graham (2001), this system classifies sagittal plane gait deviations in 
spastic CP into four distinct types. This is considered the "gold standard" for linking gait 
kinematics to clinical management.7 The AI can implement this via a decision tree based on 
stance phase kinematics. 
Type I: True Equinus 
●​ Marker: Ankle plantarflexion (toe-walking) with Knee Extended (or hyperextended) and 
Hip Extended. 
●​ Demographic: Common in younger children and those with hemiplegia. 
●​ Pathology: The calf muscles (gastroc/soleus) are spastic, but the hamstrings and hip 
flexors are relatively spared. 
●​ AI Logic: 
○​ Stance_Ankle > 10° Plantarflexion (Toe walking detected) 
○​ Stance_Knee < 5° Flexion (Knee is straight or hyperextended) 
Type II: Jump Gait 
●​ Marker: Ankle plantarflexion (toe-walking) with Knee Flexed and Hip Flexed. 
●​ Mechanism: The "jump" appearance comes from the hip and knee flexion in early 
stance, followed by a bounce into extension in late stance (but never reaching full 
extension). 
●​ Pathology: Multilevel spasticity involving the calf, hamstrings, and hip flexors. 
●​ AI Logic: 
○​ Stance_Ankle > 10° Plantarflexion 
○​ Initial_Contact_Knee > 20° Flexion (Landing in flexion) 
○​ Mid_Stance_Knee > 15° Flexion (Remains flexed) 
Type III: Apparent Equinus 
●​ Marker: The child looks like they are toe-walking, but the ankle is actually Neutral 
(plantigrade, ~0°). The heel is off the ground solely because the knee and hip are 
excessively flexed. 
●​ Clinical Trap: This is often misdiagnosed as toe-walking. Treating the calf (heel cord 
lengthening) in these patients is disastrous; the issue lies proximally with the hamstrings 
and psoas. Distinguishing Type II from Type III is a high-value capability for the AI.7 
●​ AI Logic: 
○​ Stance_Ankle ≈ 0° (Normal range dorsiflexion) 
○​ Stance_Knee > 25° Flexion (Significant flexion) 
○​ Visual_Heel_Height > 0 (Detected via toe kinematics relative to ground) 
Type IV: Crouch Gait 
●​ Marker: Excessive ankle dorsiflexion (calcaneus gait) with Severe Knee and Hip 
Flexion. 
●​ Demographic: Common in older children (8-12) as a progression from Jump Gait if 
untreated, or following iatrogenic over-lengthening of the Achilles tendon. 
●​ Pathology: Severe hamstring/hip flexor spasticity and weakness of the "anti-gravity" 
muscles (quadriceps/calf). 
●​ AI Logic: 
○​ Stance_Ankle > 10° Dorsiflexion 
○​ Stance_Knee > 30° Flexion 
5.2 The Edinburgh Visual Gait Score (EVGS) 
The EVGS is a validated observational tool comprising 17 parameters. For a 2D video AI 
analyzing a sagittal view, we focus on the knee parameters, which have demonstrated high 
reliability and accuracy in automated systems.26 
The AI should assign a "severity score" (0, 1, 2) based on the following degree thresholds 
derived from Read et al. (2003) and subsequent validation studies.22 
Table 3: Automated EVGS Scoring Rubric for Knee Parameters 
Parameter 
Phase 
Score 0 
(Normal) 
Score 1 
(Moderate) 
Score 2 
(Severe) 
Peak Knee 
Ext in Stance 
Terminal 
Stance 
0° to 15° 
Flexion 
16° to 25° 
Flexion 
> 25° Flexion 
 
 
 
OR 
Hyperextensio
n -10° to 0° 
OR 
Hyperextensio
n < -10° 
Peak Knee 
Flex in Swing 
Initial/Mid 
Swing 
50° to 70° 
35° to 49° 
(Reduced) 
< 35° (Severely 
Reduced) 
 
 
 
OR 71° to 85° 
(Increased) 
OR > 85° 
(Severely 
Increased) 
Knee Ext at 
Terminal 
Swing 
Terminal Swing 
0° to 10° 
Flexion 
11° to 20° 
Flexion 
> 20° Flexion 
Implementation Note: The AI dashboard can sum these scores. A knee sub-score of > 2 on a 
single limb is a strong quantitative indicator of pathology. 
6. Quantifying Asymmetry: The Symmetry Index (SI) 
Hemiplegic CP (involving one side of the body) is a common form of the disorder. Detecting 
asymmetry is often easier and more robust for AI than detecting bilateral deviations, as the 
child serves as their own control. This mitigates errors related to camera angles, clothing, or 
calibration, as these factors typically affect both limbs equally.6 
6.1 The Symmetry Index Formula 
The "Pedi-Growth" project utilizes a Range of Motion (ROM)-based Symmetry Index. While 
various formulas exist (e.g., Robinson SI, Normalized SI), the ratio-based calculation is 
computationally efficient and sufficient for screening: 
 
●​ Healthy Range: 
 
●​ Pathological: Significant deviation from 1.0. 
6.2 Defining the Thresholds: The "15% Rule" 
The hackathon plan sets the pathological threshold at asymmetry > 15% (
 or 
). This threshold is strongly supported by the biomechanical literature for the 
following reasons: 
●​ Natural Asymmetry: Healthy children exhibit natural gait asymmetry of up to 4-10%. 
This "functional asymmetry" is attributed to limb dominance (e.g., a dominant leg for 
propulsion vs. a non-dominant leg for stability) and the inherent variability of a 
developing neuromuscular system.29 
●​ Avoiding False Positives: Setting a strict threshold (e.g., 5% or 10%) would result in high 
false-positive rates, flagging healthy children as pathological. Research indicates that a 
15% threshold is robust for distinguishing true pathological asymmetry (often >20-30% 
in hemiplegic CP) from natural variance.5 
●​ CP Markers: Children with hemiplegic CP often exhibit asymmetry values well beyond 
this threshold, particularly in specific phase parameters like single support time and knee 
flexion ROM.29 
High-Risk Logic: 
To increase specificity, the AI should trigger the "DIAGNOSIS: HIGH RISK" red flag only if 
kinematic asymmetry is corroborated by temporal asymmetry: 
1.​
 or 
 (Kinematic Asymmetry)​
AND 
2.​
 or 
 (Temporal Asymmetry - i.e., a Limp).31 
7. Computer Vision Translation: From Clinic to Code 
Implementing biomechanical norms using MediaPipe (a 2D pose estimation library) requires 
specific adjustments to account for the technical limitations of markerless tracking. 
7.1 The "Projected Angle" Reality 
Clinical gait norms (like Sutherland's) are often based on 3D Euler angles calculated from 
complex marker sets. MediaPipe, however, produces 2D projected angles from a single 
camera view. 
●​ Insight: A comparison study of the UNB database 4 found that Projected Angles (2D) 
derived from sagittal video are actually more consistent with historical norms than 3D 
Euler angles in many contexts. 
●​ Implication: Complex 3D reconstruction algorithms are not strictly necessary for basic 
screening. The 2D projection from a sagittal video (side view) is a valid proxy for 
screening purposes, provided the camera is orthogonal (perpendicular) to the walking 
path. The AI must enforce this camera angle (e.g., via a UI guide requesting a side profile 
view). 
7.2 Managing "Stiff Knee" False Positives 
MediaPipe applies temporal smoothing (filtering) to landmark detection to reduce jitter. 
However, rapid movements—such as the rapid knee flexion in Pre-Swing—are high-frequency 
events. 
●​ Risk: Aggressive smoothing may "cut off" the peak of the knee flexion curve, leading to 
an underestimation of the maximum angle. This could cause the AI to falsely flag a 
healthy child as having "Stiff Knee Gait" (low peak flexion). 
●​ Solution: The AI pipeline should use a lower smoothing factor (or raw data) specifically 
for the swing phase analysis to ensure the true peak flexion is captured. 
7.3 Handling the "Double Bump" 
A healthy knee angle plot is characterized by two distinct flexion peaks: 
1.​ Loading Response (~15°) 
2.​ Swing Phase (~60°)​
Between these peaks, the knee extends. 
●​ AI Check: The algorithm should count the local maxima in the knee angle signal for one 
gait cycle. 
○​ 2 Peaks: Pattern is likely Normal. 
○​ 1 Peak (Plateau): Pattern is likely Pathological (Crouch or Stiff Knee). 
○​ Loss of 1st Peak: Common in CP due to a lack of shock absorption or quadriceps 
spasticity.1 
7.4 Sensitivity and Specificity Expectations 
Video-based markerless gait analysis for CP screening has shown promising accuracy in 
literature: 
●​ Sensitivity: Approximately 78% to 92%.8 
●​ Specificity: Approximately 88% to 90%.8 
●​ Context: These statistics support the use of the tool for triage (screening) but 
underscore that it is not a replacement for diagnosis. A 10-15% false-positive rate is 
acceptable for a screening tool designed to cast a wide net and refer high-risk children 
to scarce specialists.33 
8. Diagnostic Algorithms and Decision Logic 
Based on the synthesis of the biomechanical data above, the following pseudocode logic is 
recommended for the "Pedi-Growth" engine. 
8.1 The "Pedi-Growth" Screening Algorithm 
Step 1: Data Extraction 
●​ Extract Hip, Knee, Ankle vectors for every frame. 
●​ Compute Knee Angle (
) frame-by-frame. 
●​ Identify Gait Cycles (Heel Strike to Heel Strike) using ankle velocity or vertical 
displacement. 
Step 2: Metric Calculation 
●​ Calculate 
 and 
 for the full cycle. 
●​ Calculate 
. 
●​ Extract phase-specific values: 
 (Initial Contact), 
 (Mid-Stance), 
 
(Max Swing). 
Step 3: Sequential Logic Gate (The "Red Flags") 
1.​ Check Asymmetry: 
○​ IF SI > 1.15 OR SI < 0.85: FLAG: ASYMMETRY (Hemiplegia Risk) 
2.​ Check Rodda Patterns (Bilateral or Unilateral): 
○​ True Equinus Check: IF Ankle_Stance = Plantarflexed AND Knee_Stance = Extended: 
FLAG: TYPE I GAIT 
○​ Crouch Check: IF Knee_MSt > 20°: FLAG: CROUCH GAIT 
○​ Stiff Knee Check: IF Knee_PeakSwing < 45°: FLAG: STIFF KNEE 
3.​ Check Age-Appropriateness (The "Toddler Filter"): 
○​ IF Age < 3 AND Flag == "Crouch Gait": IGNORE (Likely physiological toddler gait). 
○​ IF Age < 3 AND Flag == "Hyperextension < 10°": IGNORE (Ligamentous laxity). 
Step 4: Final Output Generation 
●​ Green: SI < 1.15 AND No Rodda Flags. 
●​ Amber: SI > 1.15 OR Minor Deviation (e.g., mild Hyperextension). 
●​ Red: SI > 1.15 AND (Crouch OR Stiff Knee OR Equinus Pattern detected). 
9. Conclusion 
The "Pedi-Growth AI" project is grounded in a substantial body of biomechanical literature. By 
anchoring the AI's logic in the validated Sutherland and Schwartz normative datasets, 
utilizing the Rodda Classification for pattern recognition, and adhering to the clinically 
validated 15% Symmetry Index threshold, the tool can achieve a high standard of screening 
accuracy. 
Critically, the system's success will depend on its ability to differentiate between the 
physiological gait immaturity of a 2-year-old and the pathological deviations of a child with 
CP. Implementing the age-stratified thresholds detailed in this report—specifically relaxing 
knee flexion constraints for toddlers—will be the defining feature that prevents false positives 
and builds trust with clinical users. This framework transforms the project from a simple 
geometric calculator into a clinically grounded diagnostic triage instrument. 
Works cited 
1.​ The Developement of Mature Gait | PDF | Anatomical Terms Of Motion - Scribd, 
accessed February 10, 2026, 
https://www.scribd.com/document/554944110/The-Developement-of-Mature-G
ait 
2.​ Little Steps: Understanding Gait Development in Young Children, accessed 
February 10, 2026, 
https://pediatricorthopedics.com/little-steps-understanding-gait-development-in
-young-children/ 
3.​ Changes in the gait pattern across the lifespan, accessed February 10, 2026, 
https://ouhsc.edu/bserdac/dthompso/web/gait/matgait/matgait.htm 
4.​ Comparison of two normative paediatric gait databases - PMC - PubMed 
Central, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC1947956/ 
5.​ Assessing functional load symmetry: A case for a 15 % threshold in healthy young 
adults, accessed February 10, 2026, https://pubmed.ncbi.nlm.nih.gov/41422617/ 
6.​ Hackathon Plan: Pedi-Growth AI, 
https://drive.google.com/open?id=1b9csfC3z2QYjb5CXECzVq2JBACU2YZcKWTb
FTDAAUHA 
7.​ Feasibility and usefulness of video-based markerless two-dimensional automated 
gait analysis, in providing objective quantification of gait and complementing the 
evaluation of gait in children with cerebral palsy - PMC, accessed February 10, 
2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC11406781/ 
8.​ The Pediatric Temporal-spatial Deviation Index: quantifying gait ..., accessed 
February 10, 2026, https://pubmed.ncbi.nlm.nih.gov/31206183/ 
9.​ Machine Learning of Infant Spontaneous Movements for the Early Prediction of 
Cerebral Palsy: A Multi-Site Cohort Study - MDPI, accessed February 10, 2026, 
https://www.mdpi.com/2077-0383/9/1/5 
10.​The Magnitude of Temporal–Spatial Gait Asymmetry Is Related to the Proficiency 
of Dynamic Balance Control in Children with Hemiplegic Cerebral Palsy: An 
Analytical Inquiry - MDPI, accessed February 10, 2026, 
https://www.mdpi.com/2073-8994/16/10/1274 
11.​Video‐Based Data‐Driven Models for Diagnosing Movement Disorders: Review 
and Future Directions - PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC12553998/ 
12.​Automated Gait Analysis Based on a Marker-Free Pose Estimation Model - MDPI, 
accessed February 10, 2026, https://www.mdpi.com/1424-8220/23/14/6489 
13.​Automated Gait Analysis Based on a Marker-Free Pose Estimation Model - PMC, 
accessed February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC10384445/ 
14.​The development of mature gait - Análise de Marcha, accessed February 10, 
2026, 
http://www.analisedemarcha.com/papers/historia/The%20development%20of%2
0mature%20gait%20-%201980.pdf 
15.​The Q angle and Kids: The Basics - The Gait Guys, accessed February 10, 2026, 
https://www.thegaitguys.com/thedailyblog/2017/5/1/the-q-angle-and-kids-the-ba
sics 
16.​Normal Gait, accessed February 10, 2026, 
https://www.medicine.missouri.edu/sites/default/files/Normal-Gait-ilovepdf-comp
ressed.pdf 
17.​Normative Knee Range of Motion for Children - PMC - NIH, accessed February 
10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC12298373/ 
18.​Normative Knee Range of Motion for Children - MDPI, accessed February 10, 
2026, https://www.mdpi.com/2075-1729/15/7/1000 
19.​PEDIATRIC RANGE of MOTION | Musculoskeletal Key, accessed February 10, 
2026, https://musculoskeletalkey.com/pediatric-range-of-motion/ 
20.​Knee joint sagittal plane movement in cerebral palsy: a comparative study of 
2-dimensional markerless video and 3-dimensional gait analysis - PMC, accessed 
February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC6300740/ 
21.​Comparison of sagittal plane gait characteristics between the overground and 
treadmill approach for gait analysis in typically developing children - PMC, 
accessed February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC9310770/ 
22.​EVGS B Reference Guide - Guia Edinburg | PDF | Anatomical Terms ..., accessed 
February 10, 2026, 
https://www.scribd.com/document/758779149/EVGS-b-Reference-Guide-Guia-E
dinburg 
23.​Developing Normative Gait Cycle Parameters for Clinical Analysis Using Human 
Pose Estimation - arXiv, accessed February 10, 2026, 
https://arxiv.org/html/2411.13716v1 
24.​Gait analysis in children with cerebral palsy in - EFORT Open Reviews - 
Bioscientifica, accessed February 10, 2026, 
https://eor.bioscientifica.com/view/journals/eor/1/12/2058-5241.1.000052.xml 
25.​Classification of gait patterns in spastic hemiplegia and spastic diplegia: a basis 
for a management algorithm - PubMed, accessed February 10, 2026, 
https://pubmed.ncbi.nlm.nih.gov/11851738/ 
26.​Automated Implementation of the Edinburgh Visual Gait Score (EVGS) - PMC - 
NIH, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC12115766/ 
27.​Usability and Reliability of the Edinburgh Visual Gait Score in Children with Spastic 
Cerebral Palsy Using Smartphone Slow-Motion Video Technology and a Motion 
Analysis Application: A Pilot Study - PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC8192632/ 
28.​Edinburgh Visual Gait Score (EVGS): Reference Guide - Novi AMS, accessed 
February 10, 2026, 
https://assets.noviams.com/novi-file-uploads/aaop/pdfs-and-documents/How-To
-Videos/EVGS.pdf 
29.​EMG Based Analysis of Gait Symmetry in Healthy Children - PMC, accessed 
February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC8434681/ 
30.​Reliability of timed walking tests and temporo-spatial gait parameters in youths 
with neurological gait disorders - PMC - PubMed Central, accessed February 10, 
2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC4736644/ 
31.​Comparison of gait characteristics between clinical and daily life settings in 
children with cerebral palsy - PMC - NIH, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC7005861/ 
32.​Establishing an early identification score system for cerebral palsy based on 
detailed assessment of general movements - PMC - NIH, accessed February 10, 
2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC7140202/ 
33.​Are overreferrals on developmental screening tests really a problem? - PubMed, 
accessed February 10, 2026, https://pubmed.ncbi.nlm.nih.gov/11177063/ 
