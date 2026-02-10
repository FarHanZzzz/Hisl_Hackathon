# MediaPipe Pose Gait Analysis Accuracy

Validating Google MediaPipe Pose 
(Heavy) for Pediatric Gait Analysis: A 
Technical and Clinical Review 
1. Introduction and Architectural Framework 
The paradigm of clinical gait analysis is currently undergoing a radical transformation, shifting 
from expensive, laboratory-confined optoelectronic marker systems to accessible, markerless 
computer vision solutions. At the forefront of this shift is Google’s MediaPipe Pose, a machine 
learning solution capable of inferring 33 3D landmarks on the human body from a single RGB 
video input. For pediatric populations, specifically those with neurodevelopmental disorders 
such as Cerebral Palsy (CP) or Duchenne Muscular Dystrophy (DMD), the removal of physical 
markers represents a significant leap in feasibility. Markers are often intrusive, require lengthy 
setup times that test the patience of young children, and can alter natural movement patterns 
due to sensory discomfort. 
However, the adoption of "black box" neural networks in clinical biomechanics requires 
rigorous validation. The user’s specific implementation—utilizing the MediaPipe Pose 
Landmarker (Heavy model) for extracting body joint positions to analyze pediatric 
gait—places the project at the intersection of advanced computer vision and clinical 
kinesiology. This report provides an exhaustive, evidence-based analysis of the system's 
accuracy, limitations, and optimal configuration, synthesizing data from comparative studies 
against "gold standard" systems like Vicon and OptiTrack. 
1.1 The BlazePose Architecture: Implications for Biomechanics 
To understand the accuracy limitations of MediaPipe in gait analysis, one must first 
understand its underlying architecture, known as BlazePose. Unlike "bottom-up" approaches 
(e.g., OpenPose) which detect all potential keypoints in a frame and then assemble them into 
skeletons using Part Affinity Fields, MediaPipe employs a top-down methodology. 
1.​ Person Detection: The pipeline first employs a lightweight detector to locate the region 
of interest (ROI) containing the human subject. In video mode, this detector runs only on 
the first frame or when tracking is lost, relying on the previous frame's landmarks to 
predict the ROI for the subsequent frame. This temporal coherence is crucial for 
maintaining high frame rates but can lead to "drift" if the subject moves erratically—a 
common trait in pediatric gait.1 
2.​ Landmark Regression: Within the cropped ROI, the model predicts 33 3D landmarks. 
The topology is derived from the GHUM (Google HUman Model), a statistical 3D body 
model trained on thousands of human scans. 
3.​ The "Heavy" Model Variant: The "Heavy" model (approx. 30MB) utilizes a deeper 
convolutional neural network (CNN) backbone with more layers and attention 
mechanisms compared to the "Lite" or "Full" versions. 
○​ Advantages: It offers superior accuracy in detecting partially occluded points (e.g., 
the hip joint during arm swing) and is more robust to complex backgrounds.1 
○​ The 3D Uplifting Paradox: Recent investigations indicate that while the Heavy 
model is superior for 2D reprojection (placing dots on the image), its 3D 
reconstruction (estimating depth/z-axis) can sometimes suffer from "artificial 
asymmetries." The model attempts to hallucinate depth information based on learned 
priors from the adult-dominated GHUM dataset. When applied to children, whose 
anthropometric ratios (e.g., head-to-torso size) differ significantly from adults, this 
uplifting process can introduce systematic bias.5 
1.2 Defining the Coordinate Space 
MediaPipe outputs three distinct sets of coordinates, each with different implications for gait 
analysis accuracy: 
●​ Normalized Image Coordinates (x, y): These are strictly 2D coordinates normalized to 
[0.0, 1.0] relative to the image width and height. These are the most accurate outputs as 
they are direct observations from the pixel data. 
●​ World Coordinates (x, y, z): These represent the 3D position in meters, with the origin 
located at the midpoint of the hips. Crucially, the z-coordinate here is not measured 
but inferred. It represents the estimated depth relative to the hip center. In monocular 
video (single camera), this depth is a prediction based on statistical likelihood, not 
geometric triangulation. This fundamental limitation renders the "World Z" coordinate 
highly susceptible to error in pediatric subjects whose limb lengths do not match the 
training distribution.6 
2. Accuracy Assessment: MediaPipe vs. Marker-Based 
Motion Capture 
The central question for clinical adoption is concurrent validity: distinct agreement with 
optoelectronic systems (Vicon, OptiTrack) that track retroreflective markers. The analysis 
below breaks down accuracy by kinematic plane and joint, specifically focusing on the Root 
Mean Square Error (RMSE) and Mean Absolute Error (MAE). 
2.1 Sagittal Plane Kinematics: The "Sweet Spot" 
The sagittal plane (viewed from the side) captures flexion and extension movements, which 
constitute the primary component of forward gait. 
Knee Flexion/Extension Accuracy 
The knee joint demonstrates the highest reliability in MediaPipe analysis due to its large range 
of motion (ROM) and definition by two long, rigid segments (femur and tibia). 
●​ RMSE and MAE: Studies comparing MediaPipe (Heavy) against Vicon/OptiTrack report 
RMSE values for knee flexion generally between 5° and 15°, with MAE values often 
clustering around 5.88°.8 
●​ Correlation: The temporal correlation (waveform shape) is remarkably high, with Pearson 
correlation coefficients (
) and Intraclass Correlation Coefficients (ICC) consistently 
exceeding 0.90.9 This indicates that while there may be a constant offset (bias) in the 
absolute angle—often due to differences in how "knee center" is defined—the system 
captures the change in angle (ROM) and the timing of peak flexion very accurately. 
●​ Pediatric Validation: In toddlers and children with CP, MediaPipe maintains this high 
correlation for sagittal knee angles. However, the absolute error can increase if the child 
has significant soft tissue deformation or loose clothing, which obscures the precise 
location of the femoral epicondyle and lateral malleolus.10 
Table 1: Comparative Accuracy of Knee Kinematics (MediaPipe vs. Gold Standard) 
 
Metric 
Value (Approx.) 
Clinical 
Interpretation 
Sources 
Correlation (r) 
> 0.94 
Excellent. The 
shape of the gait 
cycle is preserved. 
9 
MAE (Flexion) 
~5.88° - 12° 
Acceptable for 
monitoring trends; 
borderline for 
surgical planning. 
9 
RMSE (Flexion) 
< 20° 
"Adequate" for 
general 
assessment; 
inferior to 
marker-based 
(<2°). 
8 
Range of Motion 
± 5-8° Error 
Good agreement; 
slight 
underestimation of 
peak flexion is 
11 
common. 
2.2 Frontal Plane Kinematics: The "Danger Zone" 
In contrast to the sagittal plane, frontal plane analysis (viewed from the front/back) attempts 
to measure Knee Valgus/Varus (abduction/adduction). 
●​ The Depth Problem: Valgus angles rely heavily on depth perception to distinguish 
between the knee bending inward versus the leg simply rotating. Since MediaPipe infers 
depth, it frequently misinterprets 2D foreshortening as valgus angulation. 
●​ Error Magnitude: Studies report errors in knee valgus calculation ranging from 18.8° to 
19.7°, which is statistically significant and clinically unacceptable.13 A 20° error could lead 
a clinician to misdiagnose a knock-kneed (valgus) gait where none exists. 
●​ Clinical Recommendation: MediaPipe should not be used for quantitative frontal plane 
knee alignment (Q-angle) in a monocular setup. The noise-to-signal ratio is too high. If 
frontal plane data is required, a multi-camera setup with epipolar fusion is mandatory.7 
2.3 3D Positional Accuracy 
For full 3D skeleton reconstruction (World Coordinates): 
●​ Monocular (Single Camera): RMSE for joint positions averages ~56 mm (5.6 cm). This 
error is largely driven by the z-axis (depth) uncertainty.7 
●​ Stereo/Epipolar Fusion (Two Cameras): When combining two MediaPipe instances 
(e.g., front and side views) using epipolar geometry, the RMSE drops significantly to ~30 
mm (3 cm).7 This approaches the accuracy required for more advanced biomechanical 
modeling but introduces significant complexity in synchronization and calibration. 
3. Known Limitations for Pediatric Subjects 
Applying a model trained primarily on adult data (GHUM) to pediatric subjects introduces 
specific biomechanical and algorithmic friction points. 
3.1 Anthropometric Scaling and "Small Body" Bias 
The "Heavy" model's 3D lifting network has learned the statistical regularities of adult bodies 
(e.g., the ratio of femur length to tibia length, or head size to shoulder width). Children, 
particularly toddlers, violate these priors: 
●​ Head-to-Body Ratio: Toddlers have proportionally larger heads. MediaPipe relies 
heavily on face detection to orient the rest of the body skeleton. The disproportionate 
head size can skew the estimated depth of the torso, affecting the hip joint center 
estimation.14 
●​ Segment Length Violation: In 3D reconstruction, studies have shown systematic 
underestimation of limb lengths in markerless systems. For adults, this error is 1.3–9.0 
cm.5 In children, where total limb length is shorter, a 2 cm error represents a much larger 
percentage of the total segment, causing significant angular errors in inverse kinematics 
calculations. 
3.2 High Cadence and Motion Blur 
Children walk with a higher cadence (steps per minute) than adults. 
●​ Temporal Aliasing: A standard 30 fps camera captures a frame every 33 ms. A child's 
stance phase might last only 300-400 ms. This means the stance phase is represented 
by only ~10-12 frames. This low sampling rate acts as a low-pass filter, "cutting off" the 
peaks of rapid movements. Peak knee flexion during swing may be underestimated simply 
because the camera did not capture the frame at the exact instant of maximum flexion.10 
●​ Motion Blur: The "Heavy" model requires sharp edges to accurately regress landmarks. 
The rapid angular velocity of pediatric limbs can cause motion blur in standard lighting, 
leading to "jitter" where the landmark jumps between frames as the model struggles to 
find the blurred ankle center.16 
3.3 The "Flat-Foot" Strike 
Standard gait analysis algorithms often detect Heel Strike (HS) by looking for the heel 
landmark's lowest vertical position or a spike in vertical deceleration. 
●​ Pediatric Mechanics: Toddlers often exhibit a "flat-foot" or even forefoot initial contact, 
lacking the distinct heel-first impact of adult gait. This absence of a clear kinematic 
"impact" event can confuse standard HS detection algorithms, requiring adapted logic 
(see Section 5).10 
3.4 Clothing and Diapers 
MediaPipe uses visual contours to estimate joint centers. 
●​ Diaper Effect: In toddlers, bulky diapers obscure the anatomical hip center (greater 
trochanter). MediaPipe will often estimate the "hip" joint as the center of the visual bulk 
of the diaper, placing the joint center several centimeters lateral and posterior to its true 
anatomical location. This artificially reduces the computed hip extension angle.18 
●​ Recommendation: Prioritize the knee and ankle angles for reliability; treat hip kinematic 
data with caution in diapered subjects. 
4. Signal Processing Recommendations 
Raw data exported from MediaPipe is inherently noisy, containing high-frequency jitter 
(stochastic noise from frame-to-frame estimation) and outliers. Clinical validity requires a 
robust signal processing pipeline. 
4.1 The Butterworth Filter: Industry Standard 
Biomechanical data is typically smoothed using a Butterworth Low-Pass Filter. The goal is 
to attenuate high-frequency noise (jitter) while preserving the true signal of human motion. 
●​ Filter Type: 4th-Order Butterworth Filter. 
○​ Why 4th Order? A 2nd order filter provides a slow rolloff, potentially leaving some 
noise. A 4th order (achieved by applying a 2nd order filter forwards and backwards) 
provides a sharp cutoff without phase shift.7 
○​ Zero-Lag Implementation: It is critical to apply the filter bidirectionally (e.g., 
scipy.signal.filtfilt). Standard forward filtering introduces a phase lag, making the joint 
angles appear to happen later in time than they actually did. Zero-lag filtering 
cancels this delay.21 
●​ Cutoff Frequency: 
○​ General Kinematics: 6 Hz is the consensus "sweet spot" for walking gait. Human 
gait rarely contains significant voluntary movement energy above 5-6 Hz. Setting the 
cutoff at 6 Hz removes the "jitter" from the 30-60 Hz video noise while keeping the 
gait signal intact.20 
○​ Event Detection (Heel Strike): For detecting specific events, a lower cutoff of 3 Hz 
is sometimes used to smooth out the velocity curve and isolate the major peaks, 
preventing false positives from minor bumps.25 However, 3 Hz is too aggressive for 
angle calculation and will blunt the peak knee flexion. 
○​ High-Speed Motion: If capturing running or using high-frame-rate video (>60fps), 
the cutoff can be increased to 10-12 Hz to capture impact transients.3 
Table 2: Recommended Filtering Parameters 
Parameter 
Recommendation 
Reason 
Filter Type 
Low-pass Butterworth 
Standard for biomechanical 
signals; maximally flat 
passband. 
Order 
4th Order (Zero-lag) 
Steep rolloff; filtfilt removes 
phase shift delay. 
Cutoff Frequency 
6 Hz (Kinematics) 
 
3 Hz (Event Detection) 
6 Hz preserves joint ROM; 3 
Hz isolates gait cycles. 
Gap Filling 
Cubic Spline Interpolation 
Fills missing frames 
(occlusions) before 
filtering. 
4.2 Handling Outliers 
Before filtering, "gross" outliers must be removed. 
●​ Confidence Threshold: Discard landmarks with a MediaPipe visibility or presence score 
< 0.5 (conservative) or < 0.7 (strict). 
●​ Trajectory Continuity: If a joint moves more than a physiologically possible distance in 
one frame (e.g., >10cm in 33ms), it is likely a detection error (e.g., swapping left/right 
legs). Remove these points and interpolate.28 
5. Algorithmic Gait Cycle Detection 
To calculate spatiotemporal parameters (step length, stance time), the continuous stream of 
coordinates must be partitioned into individual gait cycles defined by Heel Strike (HS) and 
Toe-Off (TO). 
5.1 The Coordinate-Based Approach (Zeno-Validated) 
Since MediaPipe does not provide force plate data, gait events are detected kinematically 
using the trajectories of the Heel (Landmark 29/30) and Toe (Landmark 31/32).17 
Step 1: Heel Strike (Initial Contact) Detection 
In healthy adult gait, HS occurs when the heel is at its maximum anterior excursion (furthest 
forward). 
●​ Algorithm: 
1.​ Calculate the anterior-posterior (x-axis) distance between the Heel landmark and 
the Hip Center landmark. 
2.​ Find the Local Maxima of this distance signal. 
3.​ Pediatric Adjustment: For toddlers who may toe-strike, use the Ankle landmark 
(27/28) instead of the heel to determine maximum forward reach. This is more robust 
to variable foot contact patterns.10 
Step 2: Toe-Off Detection 
TO occurs when the foot leaves the ground to begin the swing phase. 
●​ Algorithm: 
1.​ Calculate the vertical (y-axis) velocity of the Toe landmark. 
2.​ Identify the moment the velocity crosses a positive threshold (moving upwards) after 
the stance phase. 
3.​ Alternative: Find the Local Minimum of the Toe's vertical position immediately 
preceding the rapid forward movement of the swing.30 
Step 3: Gait Phases 
●​ Stance Phase: Time from HS to TO. 
●​ Swing Phase: Time from TO to next HS. 
●​ Step Time: Time between HS of one foot and HS of the contralateral foot. 
Accuracy Note: Using this kinematic method with MediaPipe has shown excellent correlation 
(
) for step times in pediatric subjects when compared to pressure-sensitive 
walkways (Zeno Walkway).10 
6. Best Practices for Video Capture 
To minimize the "Heavy" model's computational load and maximize accuracy, the capture 
environment must be optimized. 
6.1 Camera Setup and Specifications 
●​ Perspective: Strictly Sagittal (90° Profile). The camera must be placed perpendicular 
to the plane of motion. Any deviation (e.g., filming from 45°) introduces perspective 
distortion that MediaPipe’s 2D-to-3D lifting cannot fully correct, artificially shortening 
limbs and skewing angles.7 
●​ Height: Hip Height (~0.8m - 1.0m for children). Placing the camera too high (looking 
down) compresses the vertical axis, making knee flexion appear reduced. 
●​ Frame Rate: 60 fps Minimum. 
○​ While MediaPipe can run on 30 fps video, this is suboptimal for pediatric gait. 
Upsampling (interpolating) 30 fps to 60 or 100 Hz before processing can improve the 
smoothness of derivatives but cannot recover missing data peaks. If hardware allows 
(e.g., iPhone Slow-Mo mode at 120/240 fps), use it to reduce motion blur.15 
●​ Resolution: 1080p (1920x1080). 720p is often sufficient if it allows for a higher frame 
rate. 4K is generally unnecessary and slows down processing speed without improving 
landmark accuracy, as the model resizes input images to a smaller square (e.g., 256x256 
or 512x512) regardless of input resolution.6 
6.2 Environmental Controls 
●​ Background: Use a plain, high-contrast background. Cluttered environments (e.g., 
busy clinic walls, patterned carpets) increase the risk of the model detecting furniture 
legs as human limbs. 
●​ Lighting: Bright, diffuse lighting is non-negotiable. It forces the camera to use a faster 
shutter speed, reducing the motion blur that plagues pediatric analysis. 
●​ Distance: The subject must be fully visible (Head to Toe) with a margin. For a child, a 
distance of 3-4 meters usually yields a Field of View (FOV) wide enough to capture 2-3 
full gait cycles. 
6.3 Subject Preparation 
●​ Clothing: Tight-fitting, contrasting colors. Avoid black clothes on a dark background. 
For toddlers, a onesie or swim-style outfit is superior to loose shorts and t-shirts to 
minimize the "clothing drift" error on hip landmarks.18 
●​ Barefoot: Assessments should be performed barefoot (unless testing orthotics) to allow 
the model to detect the true toe and heel position without shoe bulk interference. 
7. Conclusion 
For the specific use case of pediatric gait analysis, the Google MediaPipe Pose Landmarker 
(Heavy) represents a viable, cost-effective screening tool, provided its limitations are 
aggressively managed. 
The Verdict: 
●​ Validated For: Sagittal plane knee flexion/extension trends, temporal parameters 
(cadence, step time), and gross motor progress monitoring. 
●​ Not Validated For: Frontal plane mechanics (knee valgus/varus), absolute joint positions 
(surgical planning), or "black box" automated diagnosis without clinician oversight. 
Final Integration Strategy: 
1.​ Capture: 1080p @ 60fps+, sagittal view, hip height. 
2.​ Model: MediaPipe Pose Heavy (for robustness against occlusion). 
3.​ Process: 
○​ Map 2D coordinates (x, y) to biomechanical angles (ignoring z-depth). 
○​ Clean data (confidence > 0.5). 
○​ Filter (Butterworth 4th order, 6 Hz). 
○​ Detect events (Local Maxima of Heel-Hip distance). 
4.​ Interpret: Focus on changes over time (e.g., pre- vs. post-therapy) rather than 
absolute values, acknowledging a potential ±5-10° systematic bias compared to X-ray or 
Vicon data. 
By strictly adhering to this protocol, the researcher can extract clinically meaningful insights 
from 2D video, democratizing access to gait analysis for pediatric populations where 
traditional methods are often inaccessible. 
Works cited 
1.​ mediapipe/docs/solutions/pose.md at master - GitHub, accessed February 10, 
2026, 
https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.m
d 
2.​ Pose estimation using MediaPipe - Kaggle, accessed February 10, 2026, 
https://www.kaggle.com/code/nizdarlaila/pose-estimation-using-mediapipe 
3.​ Quantitative Performance Assessment of Knee Injury Prevention Exercises for 
Female Football Players Using Pose Estimation - Diva-portal.org, accessed 
February 10, 2026, 
http://www.diva-portal.org/smash/get/diva2:1890080/FULLTEXT01.pdf 
4.​ Comparison of different pose estimation models for lower-body kinematics: A 
validation study - ResearchGate, accessed February 10, 2026, 
https://www.researchgate.net/publication/398521136_Comparison_of_different_p
ose_estimation_models_for_lower-body_kinematics_A_validation_study 
5.​ (PDF) A Deep Dive Into MediaPipe Pose for Postural Assessment: A Comparative 
Investigation - ResearchGate, accessed February 10, 2026, 
https://www.researchgate.net/publication/398607117_A_Deep_Dive_into_MediaPi
pe_Pose_for_Postural_Assessment_A_Comparative_Investigation 
6.​ Pose landmark detection guide | Google AI Edge, accessed February 10, 2026, 
https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker 
7.​ Accuracy Evaluation of 3D Pose Reconstruction Algorithms Through Stereo 
Camera Information Fusion for Physical Exercises with MediaPipe Pose - MDPI, 
accessed February 10, 2026, https://www.mdpi.com/1424-8220/24/23/7772 
8.​ Commercial vision sensors and AI-based pose estimation frameworks for 
markerless motion analysis in sports and exercises: a mini review - Frontiers, 
accessed February 10, 2026, 
https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2025.16493
30/full 
9.​ (PDF) Knee Flexion/Extension Angle Measurement for Gait Analysis Using 
Machine Learning Solution “MediaPipe Pose” and Its Comparison with Kinovea ® - 
ResearchGate, accessed February 10, 2026, 
https://www.researchgate.net/publication/369058814_Knee_FlexionExtension_An
gle_Measurement_for_Gait_Analysis_Using_Machine_Learning_Solution_MediaPi
pe_Pose_and_Its_Comparison_with_Kinovea_R 
10.​Validation of markerless video-based gait analysis using ... - Frontiers, accessed 
February 10, 2026, 
https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2025.154
2012/full 
11.​Comparing the Accuracy of Markerless Motion Analysis and Optoelectronic 
System for Measuring Gait Kinematics of Lower Limb - PMC, accessed February 
10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC12025091/ 
12.​Accuracy and Reliability of Markerless Human Pose Estimation for Upper Limb 
Kinematic Analysis Across Full and Partial Range of Motion Tasks - MDPI, 
accessed February 10, 2026, https://www.mdpi.com/2076-3417/16/3/1202 
13.​Reliability and validity of knee valgus angle calculation at single-leg drop landing 
by posture estimation using machine learning - PMC, accessed February 10, 
2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC11399566/ 
14.​The effect of camera location on observation-based posture estimation - 
ResearchGate, accessed February 10, 2026, 
https://www.researchgate.net/publication/225281383_The_effect_of_camera_loca
tion_on_observation-based_posture_estimation 
15.​Improving Gait Analysis Techniques with Markerless Pose Estimation Based on 
Smartphone Location - PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC10886083/ 
16.​Evaluation of Commercial Camera-Based Solutions for Tracking Hand Kinematics 
- PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC12473350/ 
17.​Comparability of Methods for Remotely Assessing Gait Quality - PMC, accessed 
February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC12197211/ 
18.​AI-Powered Gait Analysis For Early Detection of Mental Stress Using Mobile Video 
- IJSART, accessed February 10, 2026, 
http://ijsart.com/public/storage/paper/pdf/IJSARTV11I6103764.pdf 
19.​A Bidirectional Siamese Recurrent Neural Network for Accurate Gait Recognition 
Using Body Landmarks - arXiv, accessed February 10, 2026, 
https://arxiv.org/html/2412.03498v1 
20.​markerless video-based estimation of 3d approach velocity in the javelin throw - 
NMU Commons, accessed February 10, 2026, 
https://commons.nmu.edu/cgi/viewcontent.cgi?article=2410&context=isbs 
21.​Estimate of the optimum cutoff frequency for the Butterworth low-pass digital 
filter, accessed February 10, 2026, 
https://mayoclinic.elsevierpure.com/en/publications/estimate-of-the-optimum-cu
toff-frequency-for-the-butterworth-low- 
22.​Accuracy of Video-Based Gait Analysis Using Pose Estimation During Treadmill 
Walking Versus Overground Walking in Persons After Stroke - NIH, accessed 
February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC12142495/ 
23.​Feasibility of Smartphone-Based Markerless Motion Capture for Quantitative Gait 
Assessment in Pediatric Guillain–Barré Syndrome: A Two-Case Proof-of-Concept 
Study - PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC12837180/ 
24.​(PDF) Validity and reliability of monocular 3D markerless gait analysis in simulated 
pathological gait: A comparative study with OpenCap - ResearchGate, accessed 
February 10, 2026, 
https://www.researchgate.net/publication/396030456_Validity_and_reliability_of_
monocular_3D_markerless_gait_analysis_in_simulated_pathological_gait_A_comp
arative_study_with_OpenCap 
25.​Validity of a Convolutional Neural Network-Based, Markerless Pose Estimation 
System Compared to a Marker-Based 3D Motion Analysis System for Gait 
Assessment—A Pilot Study - MDPI, accessed February 10, 2026, 
https://www.mdpi.com/1424-8220/25/21/6551 
26.​Markerless Human Motion Analysis - IRIS UniGe, accessed February 10, 2026, 
https://unige.iris.cineca.it/retrieve/e268c4ce-ea03-a6b7-e053-3a05fe0adea1/phd
unige_3903881.pdf 
27.​Automated Gait Analysis Based on a Marker-Free Pose Estimation Model - PMC, 
accessed February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC10384445/ 
28.​Gait stability prediction through synthetic time-series and vision-based data - 
PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC12380704/ 
29.​Fall risk prediction using temporal gait features and machine learning approaches, 
accessed February 10, 2026, 
https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.202
4.1425713/full 
30.​Design of an experimental platform for gait analysis with ActiSense and StereoPi - 
ORBilu, accessed February 10, 2026, 
https://orbilu.uni.lu/bitstream/10993/52540/1/or_submission_452_9_1.pdf 
31.​A Contactless Computer Vision System for Underwater Walking and Jogging Gait 
Analysis Using YOLO-Pose and Multi-CNN BiLSTM - UiTM Institutional Repository, 
accessed February 10, 2026, https://ir.uitm.edu.my/id/eprint/128990/1/128990.pdf 
32.​Validation of markerless video-based gait analysis using pose estimation in 
toddlers with and without neurodevelopmental disorders - PMC, accessed 
February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC11893606/ 
33.​Automated Gait Analysis Based on a Marker-Free Pose Estimation Model - MDPI, 
accessed February 10, 2026, https://www.mdpi.com/1424-8220/23/14/6489 
