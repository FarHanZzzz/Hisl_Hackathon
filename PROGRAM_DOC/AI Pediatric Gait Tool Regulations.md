# AI Pediatric Gait Tool Regulations

Regulatory and Ethical Architectures for 
Pediatric AI Gait Analysis: A 
Comprehensive Framework for MVP 
Development 
1. The Intersection of Pediatric Motion Analysis and 
Digital Health Regulation 
The development of artificial intelligence (AI) tools for pediatric healthcare operates within a 
high-stakes ecosystem defined by the convergence of three rigorously controlled domains: 
medical device regulation, child data privacy protection, and algorithmic ethics. For a 
developer tasked with building an AI-powered pediatric gait screening tool—whether 
intended as a Minimum Viable Product (MVP) for a hackathon or a prototype for future 
commercialization—the regulatory landscape is not merely a compliance checklist but the 
fundamental architectural constraint of the system. The distinction between an unregulated 
educational resource and a Class II medical device requiring premarket clearance often rests 
on semantic nuances in the "Intended Use" statement, the specificity of the algorithmic 
output, and the degree of autonomy granted to the user. 
Pediatric gait analysis serves as a particularly sensitive focal point for these regulations. Gait 
anomalies in children can be indicative of a wide spectrum of conditions, ranging from benign, 
self-correcting developmental phases to serious neurological disorders such as Cerebral 
Palsy (CP), Duchenne Muscular Dystrophy (DMD), or Autism Spectrum Disorder (ASD). 
Consequently, an AI tool that claims to "screen," "detect," or "analyze" these patterns is 
engaging in a medical activity that regulators scrutinize heavily to prevent false positives 
(which cause unnecessary parental anxiety and healthcare resource strain) and false 
negatives (which delay critical early intervention). 
This report provides an exhaustive analysis of the regulatory frameworks in the United States 
(FDA) and the European Union (EU MDR), the data privacy obligations under HIPAA, COPPA, 
and GDPR, and the ethical imperatives required to design a safe, compliant, and trustworthy 
system. The central thesis of this analysis is that for an MVP, the safest pathway is to strictly 
limit the tool's scope to "quantitative movement tracking" or "educational visualization," 
avoiding all diagnostic claims until a robust Quality Management System (QMS) and clinical 
evidence base can be established. 
2. The United States Regulatory Framework: FDA 
Oversight of Software as a Medical Device (SaMD) 
In the United States, the Food and Drug Administration (FDA), specifically the Center for 
Devices and Radiological Health (CDRH), holds jurisdiction over Software as a Medical Device 
(SaMD). The regulatory classification of a software product is determined not by its code or its 
accuracy, but by its Intended Use—the objective intent of the persons legally responsible for 
the labeling of the device. 
2.1 The 21st Century Cures Act and Clinical Decision Support (CDS) 
The enactment of the 21st Century Cures Act significantly amended the Federal Food, Drug, 
and Cosmetic Act (FD&C Act) to provide clarity on what software functions are excluded from 
the definition of a medical device. This is the primary legal mechanism a developer can use to 
exempt an MVP from regulation. 
2.1.1 The Four Criteria for CDS Exemption 
The FDA’s final guidance on Clinical Decision Support Software (September 2022) establishes 
a four-part test. To be considered "Non-Device CDS" and thus exempt from regulation, the 
software must meet all four of the following criteria 1: 
1.​ Criterion 1: Not Medical Image or Signal Processing. The software must not acquire, 
process, or analyze a medical image or a signal from an in vitro diagnostic device or a 
pattern/signal acquisition system. 
○​ Analysis for Gait Tool: This is the immediate hurdle for any computer vision-based 
gait analysis. The FDA typically interprets video analysis of movement as processing 
a "signal" or "pattern" analogous to a medical image. If the AI ingests raw video or 
accelerometer data and processes it to extract clinical features, it likely fails this 
criterion, pushing it into the regulated device category.2 
2.​ Criterion 2: Display and Analysis of Medical Information. The software must display, 
analyze, or print medical information about a patient or other medical information (like 
peer-reviewed guidelines). 
○​ Analysis: This criterion is generally easy to meet if the tool displays the gait data 
alongside standard growth charts or developmental milestones. 
3.​ Criterion 3: Recommendations vs. Directives. The software must provide 
recommendations to a healthcare professional (HCP), rather than a specific diagnosis or 
treatment directive. It must not be intended to replace the HCP's judgment. 
○​ Analysis: If the AI outputs a specific probability score (e.g., "85% probability of 
pathology"), the FDA views this as a "specific diagnostic output" that fails Criterion 3. 
The agency is concerned with "automation bias," where a user accepts a 
high-precision number as fact without scrutiny. To pass this, the output must be 
presented as a list of options or a visualization of data, not a conclusion.2 
4.​ Criterion 4: Independent Review. The software must enable the HCP to independently 
review the basis for the recommendation so that they do not rely solely on the software. 
○​ Analysis: The "Black Box" nature of Deep Learning models often fails this. If the AI 
says "Abnormal Gait" based on a neural network's processing of video frames, and 
the doctor cannot see why (e.g., "knee flexion angle < 10 degrees"), it fails Criterion 
4. Explainable AI (XAI) is therefore a regulatory requirement for exemption; the tool 
must visualize the specific biomechanical markers (e.g., overlaid angles on the video) 
that led to the recommendation.2 
Strategic Implication: A gait analysis tool that uses computer vision to "flag" autism or CP 
fails Criteria 1 (signal processing) and 3 (specific diagnostic output). It is a regulated medical 
device. 
2.2 The "General Wellness" Policy 
For an MVP or hackathon project, the "General Wellness" policy provides a safer harbor than 
the CDS exemption. The FDA does not enforce regulations on low-risk products that relate to: 
1.​ General Health: Maintaining or encouraging a general state of health (e.g., weight 
management, physical fitness, relaxation). 
2.​ Healthy Lifestyle Association: Reducing the risk of or living well with certain chronic 
diseases, where the role of a healthy lifestyle is well understood.3 
Application to Gait Analysis: 
●​ Regulated Claim: "Detects gait asymmetry associated with hemiplegic cerebral palsy." 
(Links specific measurement to specific disease). 
●​ Wellness Claim: "Tracks running form symmetry to help improve athletic performance 
and posture." (Links measurement to general fitness). 
●​ Gray Area: "Monitors motor milestones." While "milestones" implies development, if 
phrased as "tracking growth" similar to a height chart, it often falls under enforcement 
discretion, provided no red flags or alarms are triggered for specific disorders. 
2.3 Product Codes and Predicate Devices 
Understanding where the tool fits in the FDA's coding system is essential for regulatory 
strategy. If the tool is regulated, it will be classified under a specific "Product Code." 
2.3.1 LXC and OZZ: The Measurement Class 
●​ Product Code LXC (System, Optical Position/Movement Recording): This code 
covers systems that quantify movement, such as force plates or motion capture systems 
used in clinics.4 These are generally Class I (Exempt) devices. 
○​ Nuance: The exemption applies to tools that measure (e.g., "Knee angle is 45 
degrees") but do not interpret (e.g., "Knee angle suggests pathology"). If the MVP 
strictly outputs raw angles and symmetry graphs without a "Normal/Abnormal" label, 
it may fit this Class I Exempt category.5 
●​ Product Code OZZ (Automated Radiological Image Processing Software): While 
typically for radiology, this code represents the logic applied to image analysis. Software 
that automates the detection of abnormalities is often Class II.4 
2.3.2 The Cognoa Precedent (DEN200069) 
The most relevant precedent for AI-based pediatric screening is the Cognoa ASD Diagnosis 
Aid (Canvas Dx). Cognoa received FDA marketing authorization via the De Novo pathway 
(Class II) in 2021.7 
Key Regulatory Characteristics of Cognoa: 
●​ Intended Use: An "aid in the diagnosis" of Autism Spectrum Disorder (ASD) for patients 
ages 18-72 months. 
●​ User: Healthcare Providers (HCPs), not parents directly (though parents upload data). 
●​ Input: Video of the child uploaded by parents, analyzed by remote analysts and AI. 
●​ Output: "Positive for ASD," "Negative for ASD," or "No Result." 
●​ Clinical Data: Required a multi-site, prospective, double-blinded study with 425 subjects 
to prove safety and efficacy. 
●​ Limitations: The FDA label explicitly states it is "not for use as a stand-alone diagnostic 
device" and lists exclusion criteria (e.g., no deafness, blindness, or physical impairments) 
where the device is unreliable.7 
Lesson for the MVP: If the hackathon project claims to "screen for autism using gait," it is 
effectively claiming substantial equivalence to Cognoa. Without a comparable clinical trial, 
this claim is illegal. The MVP must avoid "Diagnostic Aid" claims entirely. 
2.4 Summary of US Regulatory Strategy for MVP 
To avoid the need for 510(k) clearance or De Novo submission, the MVP must be positioned as 
a "Quantitative Movement Tracker" or "Educational Motor Journal." 
Feature 
Regulated Medical 
Device (Avoid) 
General Wellness / 
Educational (Target) 
Labeling 
"Screening," "Diagnosis," 
"Detection," "Risk 
Assessment." 
"Tracking," "Visualization," 
"Journaling," "Comparison." 
Output 
"High Risk of CP," 
"Abnormal Gait," "Refer to 
Doctor." 
"Symmetry Index: 85%," 
"Step Count," "Knee Angle 
Graphs." 
User 
"For use by pediatricians to 
diagnose..." 
"For parents to track gross 
motor progress." 
Algorithm 
"AI Diagnostic Engine." 
"Pattern Recognition 
Software." 
3. The European Regulatory Framework: MDR Rule 11 
and the "Symptom Checker" Trap 
The regulatory environment in Europe has shifted dramatically with the transition from the 
Medical Device Directive (MDD) to the Medical Device Regulation (MDR) (EU) 2017/745. 
This framework is currently more stringent regarding software than the US system. 
3.1 Rule 11: The End of Self-Certification 
Under the old MDD, many health apps were Class I, allowing developers to "self-certify" by 
affixing a CE mark without an external audit. The MDR introduced Rule 11 in Annex VIII, which 
specifically targets software.9 
Rule 11(a) States: 
"Software intended to provide information which is used to take decisions with diagnosis or 
therapeutic purposes is classified as Class IIa, except if such decisions have an impact that 
may cause death or an irreversible deterioration of a person's state of health, in which case it 
is in Class III." 
Implication for Gait Screening: 
●​ If the software provides information (e.g., "Gait asymmetry detected") that a parent or 
doctor uses to decide "this child needs therapy," it falls under Rule 11(a). 
●​ Class IIa Requirement: This classification requires a Notified Body (an external auditing 
organization) to review the Technical File and Quality Management System (ISO 13485). 
This is a high barrier to entry (costing €20k-€50k+ and 12+ months).13 
3.2 The "Symptom Checker" Interpretation 
Many developers attempt to label their tools as "Symptom Checkers" or "Triage Tools" to 
avoid regulation. However, the Medical Device Coordination Group (MDCG) guidance clarifies 
that if a symptom checker provides a recommendation that influences the course of action 
(e.g., "See a doctor immediately" vs. "Monitor at home"), it is providing information for a 
diagnostic decision.12 
Class I Exceptions (MDCG 2019-11): 
Only software that strictly performs administrative tasks, simple storage, or general fitness 
tracking remains Class I. 
●​ Example: An app that records video and allows the user to draw lines on it (without AI 
interpretation) might be Class I or non-device. 
●​ Example: An app that uses AI to say "Your form is 90% similar to an elite runner" is likely 
Class I (Sport/Wellness). 
●​ Example: An app that uses AI to say "Your form shows signs of hip dysplasia" is Class IIa 
or higher.12 
4. Data Privacy and the Protection of Minors (United 
States) 
Pediatric video data is considered "toxic" in the cybersecurity sense—its mishandling carries 
the highest legal and reputational penalties. Video data is particularly sensitive because it 
inherently contains biometric identifiers (face geometry, gait) and environmental data 
(home interiors, background audio). 
4.1 HIPAA (Health Insurance Portability and Accountability Act) 
If the app is used by "Covered Entities" (hospitals, clinics, doctors) or Business Associates 
(vendors serving them), it must comply with HIPAA. Even if the MVP is a Direct-to-Consumer 
(DTC) app (where HIPAA technically may not apply), adhering to HIPAA standards is the 
industry benchmark for liability protection. 
4.1.1 Protected Health Information (PHI) in Gait Video 
HIPAA identifies 18 specific identifiers that must be removed to de-identify data.16 For a 
video-based gait tool, the relevant identifiers are: 
1.​ Full-face photographic images and any comparable images: Raw video of a child 
walking almost always captures the face. 
2.​ Biometric identifiers, including finger and voice prints: Gait itself can be a biometric 
identifier if the resolution is high enough to be unique. 
3.​ Dates (except year): Birth dates are often collected to calculate "developmental age." 
4.​ Geographic data: GPS metadata often embedded in video files from smartphones. 
The "Actual Knowledge" Clause: Even if the 18 identifiers are removed, data is not 
de-identified if the entity has "actual knowledge" that the remaining information could be 
used to identify the individual (e.g., a video of a child with a very rare, visibly distinctive 
physical deformity).18 
4.1.2 Record Retention Requirements (State Laws) 
While HIPAA does not set a uniform retention period for medical records (deferring to state 
law), pediatric records often have exceptionally long retention tails. 
●​ Nevada: Records for minors must be retained until the patient reaches 23 years of 
age.19 
●​ North Carolina: Records for minors must be retained until the patient reaches 30 years 
of age.19 
●​ Implication: If the MVP stores data ("cloud storage"), the developer may be legally liable 
for maintaining that data for decades. This strongly argues for a "local storage only" 
architecture or immediate deletion after processing. 
4.2 COPPA (Children’s Online Privacy Protection Act) 
COPPA applies to any commercial website or online service (including apps) directed to 
children under 13 that collects personal information. 
4.2.1 "Directed to Children" vs. "General Audience" 
The FTC determines if an app is "directed to children" based on visual content (cartoons, 
bright colors), subject matter, and music. If the gait tool uses gamification (e.g., "Walk like a 
dinosaur to win points!") to encourage the child to move, it is likely "directed to children".20 
●​ Strict Liability: If the app is directed to children, the "Actual Knowledge" standard is 
waived; the developer is presumed to know they are collecting child data. 
4.2.2 Verifiable Parental Consent (VPC) 
Collecting personal info (video, persistent identifiers, voice) from a child <13 requires 
Verifiable Parental Consent (VPC) before collection. 
●​ Standard VPC Methods: Credit card transaction ($0.50 charge), signed form 
(scan/email), video call with trained personnel, or government ID verification.20 These 
methods introduce high friction, which kills user acquisition for an MVP. 
4.2.3 The "Email Plus" Mechanism (The MVP Loophole) 
The "Email Plus" method is a lower-friction VPC option allowed only if the operator does not 
disclose the data to third parties (including advertisers) and uses it solely for internal 
purposes.20 
How "Email Plus" Works: 
1.​ Direct Notice: The parent enters their email. 
2.​ Initial Contact: The app sends an email to the parent detailing the information practices 
and requesting consent. 
3.​ Consent Action: The parent clicks a link or replies to the email to grant consent. 
4.​ Confirmation (The "Plus"): The app sends a second email confirming the consent and 
providing a method to revoke it (e.g., a dashboard link). 
Strategic Fit: This is the most viable path for a hackathon project that claims to use data only 
to "analyze the gait" and "improve the internal model" without sharing it. 
4.2.4 Direct Notice Requirements 
The email sent to parents must include specific disclosures 20: 
●​ That the operator has collected the parent's contact info to obtain consent. 
●​ That consent is required for the collection of the child's data. 
●​ That the operator will not collect/use the data if consent is not given. 
●​ A link to the Privacy Policy. 
●​ A statement that the parent can review/delete the child's data at any time. 
5. Data Privacy and the Protection of Minors 
(European Union) 
The General Data Protection Regulation (GDPR) imposes stricter requirements than US law 
regarding "Biometric Data" and "Data Concerning Health." 
5.1 Article 9: Special Categories of Data 
Processing "Special Categories" of data (Health, Biometric, Genetic) is prohibited under 
Article 9(1) unless an exception applies.23 
●​ Biometric Data Definition: GDPR defines biometric data as data resulting from specific 
technical processing relating to physical characteristics (e.g., gait) which allows for 
unique identification. 
○​ Nuance: If the gait tool uses the skeleton to identify the user (e.g., "Welcome back, 
[Name], I recognize your walk"), it is biometric data. If it uses it to analyze movement 
health, it is health data. 
●​ The Exception (Article 9(2)(a)): Explicit Consent. The parent must give "explicit 
consent" for the processing of health/biometric data. This cannot be buried in a Terms of 
Service; it must be a separate, affirmative "tick box" or signature. 
5.2 Article 8: Digital Age of Consent 
While the GDPR sets the default age for digital consent at 16, Member States can lower it to 
13. 
●​ 13 Years: UK, Denmark, Sweden, Belgium. 
●​ 14 Years: Germany, Italy, Austria. 
●​ 15 Years: France, Czech Republic. 
●​ 16 Years: Netherlands, Hungary, Default EU. 
●​ Implication: The app must implement a robust Age Gate (e.g., "Enter your Date of 
Birth") and, for users under the limit, obtain consent from the "holder of parental 
responsibility".25 
5.3 The "Right to Erasure" (Right to be Forgotten) 
Article 17 of the GDPR gives data subjects (and parents of minors) the right to have their data 
erased. For an AI tool, this poses a technical challenge: Machine Unlearning. If a parent 
requests deletion, the developer must delete the video and the structured data. However, if 
the data was used to train the model, removing the influence of that data from the model is 
technically difficult. 
●​ Ethical/Legal Best Practice: For an MVP, explicitly state in the Privacy Policy that "Data 
used to train the aggregated model cannot be extracted, but source data will be deleted 
upon request.".27 
6. Technical Implementation for Compliance 
Compliance is not just legal documentation; it is software architecture. The design of the MVP 
can mitigate regulatory risk by minimizing data exposure. 
6.1 Edge Computing and Data Minimization 
The most effective privacy strategy is the "No-Cloud" / Edge AI approach. 
●​ Architecture: Perform the computer vision inference (pose estimation/skeletal 
extraction) locally on the user's device (e.g., using TensorFlow Lite or CoreML). 
●​ Benefit: If the raw video never leaves the phone, the developer is not "collecting" the 
video in the cloud. This significantly reduces liability under COPPA/GDPR, as the 
"collection" is minimized to the metadata (angles, step count) rather than the PHI 
(video).28 
6.2 Skeletal Extraction Pipeline (If Cloud is Necessary) 
If cloud processing is required (e.g., for heavy computational models), implement a strict 
pipeline to separate PHI from analysis data. 
1.​ Ingestion: Video is uploaded via TLS 1.3 encrypted stream. 
2.​ Extraction: Server immediately runs the pose estimation model to extract coordinate 
data (JSON/CSV). 
3.​ Destruction: The raw video file is permanently deleted immediately after extraction. 
4.​ Storage: Only the anonymous skeletal data is stored. 
●​ Regulatory Impact: This satisfies the GDPR principle of "Data Minimization" and 
arguably converts the data from "Identifiable Video" to "De-identified Skeletal Data" 
(though re-identification from gait is theoretically possible, the risk is significantly 
lower).29 
6.3 Automated Face Blurring 
If video must be stored (e.g., for the user to playback and see the analysis overlay), implement 
automated face blurring. 
●​ Technique: Use a lightweight face detection model (e.g., Haar cascades, MTCNN, or 
RetinaFace) immediately upon ingestion to blur facial regions. 
●​ Safe Harbor: Blurring faces removes one of the primary HIPAA identifiers (Full-face 
photographs), supporting the argument that the data is de-identified.18 
6.4 Security Standards 
●​ Encryption: Data at rest (AES-256) and in transit (TLS 1.2+). 
●​ Access Control: Strict role-based access control (RBAC). Only the automated system 
should access raw video; developers should only access anonymized logs. 
●​ Audit Logs: Maintain logs of who accessed what data and when (HIPAA requirement).19 
7. Ethical Design in Pediatric AI 
Compliance is the legal floor; ethics is the ceiling. Pediatric AI requires a higher ethical 
standard because children cannot advocate for themselves and the consequences of errors 
are lifelong. 
7.1 Algorithmic Bias and Fairness 
Gait datasets are notoriously biased. 
●​ Demographic Bias: Most public datasets feature adults or healthy children. Data on 
children with disabilities often comes from clinical settings (white, affluent populations). 
●​ Environmental Bias: Clinical data is captured in well-lit, uncluttered labs. An MVP used in 
a cluttered, dimly lit home may fail or produce erratic results. 
●​ Ethical Obligation: The system must be transparent about its training data limitations. It 
is unethical to present a "probability score" for a minority child if the model was trained 
exclusively on white children, as gait mechanics can vary with anthropometry.32 
7.2 The "Worried Well" and False Positives 
A screening tool that produces false positives generates immense parental anxiety 
("neuroticism") and burdens the healthcare system with unnecessary referrals. 
●​ Design Choice: Avoid "red alert" UI patterns. Instead of a flashing red "ABNORMAL" sign, 
use neutral language like "Consult a professional for further evaluation" or "Deviation 
from average detected." 
●​ Contextualization: Always present the margin of error. "This tool is 85% accurate in 
controlled settings; home results may vary." 
7.3 Child Assent 
While legally parents provide consent, ethically, children (especially older ones, e.g., 7+) 
should provide assent. 
●​ Kid Mode: The app should have a simplified explanation for the child: "We are going to 
take a video of your walking to see how strong your legs are. Is that okay?".33 
8. Practical Guide to Disclaimers and Labeling 
To mitigate liability and regulatory risk, the app must be heavily papered with specific legal 
language. These disclaimers operate on the theory that the user is fully informed of the tool's 
non-medical nature. 
8.1 The "Not a Medical Device" Disclaimer (Splash Screen) 
This must be prominent—on the splash screen, in the footer, and on results pages. 
Draft Disclaimer Text: "This application is for educational and informational 
purposes only. It is not a medical device and is not intended to diagnose, treat, 
cure, or prevent any disease, disorder, or health condition, including but not 
limited to cerebral palsy, autism spectrum disorder, or musculoskeletal injuries. 
The insights provided by this tool regarding gait patterns and movement 
symmetry are based on statistical analysis and should not be used as a substitute 
for professional medical advice, diagnosis, or treatment. Always seek the advice 
of your physician or other qualified health provider with any questions you may 
have regarding a medical condition. Never disregard professional medical advice 
or delay in seeking it because of something you have read or viewed on this 
application. If you think you may have a medical emergency, call your doctor or 
emergency services immediately.".34 
8.2 Accuracy and AI Limitations Disclaimer (Results Page) 
Draft Text: "The gait analysis performed by this system utilizes artificial 
intelligence algorithms that may not be 100% accurate. Results can be influenced 
by lighting, camera angle, clothing, and environmental factors. This tool has not 
been cleared or approved by the FDA. The 'Symmetry Score' is a mathematical 
representation of movement patterns and is not a clinical diagnosis.".35 
8.3 Privacy and Data Usage Disclaimer (Privacy Policy Summary) 
Draft Text: 
"Video data processed by this app is used solely to generate movement analysis. 
We do not store raw video of your child’s face unless explicitly authorized. All 
processing is performed [locally on your device / via secure encrypted cloud]. We 
comply with COPPA and GDPR standards to protect your child's privacy. You may 
request the deletion of your data at any time." 
9. Strategic Roadmap for MVP Development 
Phase 1: The "Unregulated" MVP (Hackathon Safe Mode) 
●​ Regulatory Status: General Wellness / Educational Tool. 
●​ Claims: "Track your child's walking progress." "Visualize movement." 
●​ Forbidden Words: Diagnose, Screen, Detect, Autism, CP, Disorder, Risk. 
●​ Data Handling: Local-only processing (Edge AI) or immediate deletion of video after 
skeletal extraction. 
●​ Consent: "Email Plus" verification. Terms of Service require user to be 18+. 
●​ Risk Profile: Low. 
Phase 2: The "Enforcement Discretion" Tool (Beta Launch) 
●​ Regulatory Status: FDA Class I (Exempt) or Enforcement Discretion. 
●​ Claims: "Encourage gait symmetry." "Monitor rehabilitation exercises" (if prescribed by a 
doc). 
●​ Data Handling: Cloud storage of skeletal data for longitudinal tracking. Automated face 
blurring. 
●​ Consent: Full COPPA compliance with parental dashboard. GDPR consent management 
platform (CMP). 
●​ Risk Profile: Medium. Requires careful drafting of "Intended Use" to avoid diagnostic 
claims. 
Phase 3: The "Diagnostic Aid" (Commercial Product - Requires 
Funding) 
●​ Regulatory Status: FDA Class II (De Novo / 510(k)) / EU MDR Class IIa. 
●​ Claims: "Screen for developmental delays." "Assess fall risk." "Adjunct to diagnosis." 
●​ Requirements: Clinical trials (like Cognoa), Quality Management System (ISO 13485), 
HIPAA audit, full Verifiable Parental Consent (ID check). 
●​ Risk Profile: High. This is the "Cognoa" path—expensive, slow, but clinically valuable. 
10. Summary Data Tables 
Table 1: Regulatory Classification Matrix (FDA vs. EU) 
Feature 
FDA (USA) - 21 CFR 
EU MDR (Europe) - Rule 
11 
Gait Analysis 
(Measurement) 
Class I (Exempt) 
 
Code LXC: Optical Position 
Recording. 
 
If tool only measures 
angles/distance. 
Class I 
 
Rule 13. 
 
If tool only measures and 
does not interpret. 
Gait Analysis (Wellness) 
Enforcement Discretion 
 
If unrelated to disease 
(e.g., "improve running 
form"). 
Class I 
 
If strictly for 
fitness/wellness with no 
medical purpose. 
Gait Screening 
(Condition) 
Class II (De Novo / 510(k)) 
 
Code DEN200069 (e.g., 
Cognoa). 
 
If tool flags "risk of autism" 
or "developmental delay." 
Class IIa 
 
Rule 11(a). 
 
"Providing information used 
to take decisions with 
diagnosis or therapeutic 
purposes." 
Clinical Decision Support 
(CDS) 
Exempt (Non-Device) 
 
IF user can independently 
review the basis (e.g., show 
the video + angles) AND no 
specific disease diagnosis 
is made. 
Class IIa 
 
Most CDS is regulated 
under MDR Rule 11 if it 
influences patient 
management. 
Table 2: The 18 HIPAA Safe Harbor Identifiers (Relevant to Video/Gait) 
Identifier 
Relevance to Gait 
Action Required for MVP 
Analysis App 
Names 
User profiles, account 
names. 
Pseudonymize (use User 
IDs). 
Geographic Data 
GPS metadata in video 
files. 
Strip EXIF metadata upon 
upload. 
Dates 
Birth dates (critical for 
norms). 
Store ONLY year or "Age in 
Months." 
Phone/Email 
Account registration. 
Encrypt and segregate 
from health data. 
Biometric Identifiers 
Fingerprints, Voice prints, 
Retina. 
Strip audio track from 
video. 
Full-face Photos 
Video frames. 
Blur faces or extract 
skeleton and delete video. 
Any unique number 
Device IDs, IP addresses. 
Do not use Device ID as 
patient ID. 
Table 3: Comparative Retention Requirements for Pediatric Records 
Jurisdiction 
Requirement 
Implication for MVP 
Storage 
HIPAA (Federal) 
No specific limit (defers to 
state). 
Must follow strictest state 
law where user resides. 
Nevada 
Retain until patient is 23 
years old. 
Massive long-term storage 
liability. 
North Carolina 
Retain until patient is 30 
years old. 
Extreme long-term liability. 
Arkansas 
10 years after discharge. 
Standard long-term liability. 
Recommendation 
Data Minimization. 
Do not store data 
long-term. Allow users to 
download results and 
delete cloud copies. 
11. Conclusion 
The "Regulatory Cliff" for pediatric AI is steep. Stepping over the line from "educational 
movement tracking" to "diagnostic screening" triggers a compliance burden that is 
insurmountable for a hackathon timeline. 
Final Recommendations for the Developer: 
1.​ Language is Liability: Scrub the words diagnose, screen, detect, assess, risk, and 
disorder from your pitch deck and UI. Use track, visualize, measure, symmetry, and 
pattern. 
2.​ Video is Toxic: Do not store raw video of children. Extract the skeleton, delete the video. 
This single architectural decision solves 80% of privacy risks. 
3.​ Consent is King: Implement a "Neutral Age Gate" and "Email Plus" verification. Be 
transparent about what the AI can and cannot do. 
4.​ Disclaim Heavily: Use the provided disclaimer templates to explicitly disavow medical 
intent. 
By strictly adhering to the "General Wellness" / "Class I Measurement" lane and implementing 
robust privacy-by-design (Edge AI, Email Plus), the project can demonstrate technical 
innovation without incurring the wrath of regulators or endangering the privacy of children. 
Works cited 
1.​ Clinical Decision Support Software | FDA, accessed February 10, 2026, 
https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clin
ical-decision-support-software 
2.​ FDA Releases Significantly Revised Final Clinical Decision Support ..., accessed 
February 10, 2026, 
https://www.arnoldporter.com/en/perspectives/advisories/2022/10/fda-releases-s
ignificantly-revised-final-clinical 
3.​ Mobile Health App Interactive Tool | Federal Trade Commission, accessed 
February 10, 2026, 
https://www.ftc.gov/business-guidance/resources/mobile-health-apps-interactive
-tool 
4.​ Product Classification - FDA, accessed February 10, 2026, 
https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpcd/classification.cfm?star
t_search=1&productcode=LXC 
5.​ 510(k) Premarket Notification - FDA, accessed February 10, 2026, 
https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K813486 
6.​ Qualisys AB Nils Betzler, PhD Product Owner Kvarnbergsgatan 2 Göteborg, 411 05 
Se Re: K171547 Trade/Device Name - accessdata.fda.gov, accessed February 10, 
2026, https://www.accessdata.fda.gov/cdrh_docs/pdf17/K171547.pdf 
7.​ Cognoa ASD Diagnosis Aid - accessdata.fda.gov, accessed February 10, 2026, 
https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN200069.pdf 
8.​ FDA-authorized software as a medical device in mental health: a perspective on 
evidence, device lineage, and regulatory challenges - PMC, accessed February 
10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC12657867/ 
9.​ EU MDR and IVDR: Classifying Medical Device Software (MDSW) - NAMSA, 
accessed February 10, 2026, 
https://namsa.com/resources/blog/eu-mdr-and-ivdr-classifying-medical-device-
software-mdsw/ 
10.​MDCG 2021-24 Guidance on classification of medical devices - European Union, 
accessed February 10, 2026, 
https://health.ec.europa.eu/system/files/2021-10/mdcg_2021-24_en_0.pdf 
11.​Guidance on Qualification and Classification of ... - European Union, accessed 
February 10, 2026, 
https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a
4d37f12b_en 
12.​MDR Classification Rule 11: The classification nightmare?, accessed February 10, 
2026, https://blog.johner-institute.com/regulatory-affairs/mdr-rule-11/ 
13.​Deciphering Rule 11: New guidance on the classification of software medical 
devices under the EU MDR - Bristows, accessed February 10, 2026, 
https://www.bristows.com/news/deciphering-rule-11-new-guidance-on-the-class
ification-of-software-medical-devices-under-the-eu-mdr/ 
14.​Best-practice guidance for the in-house manufacture of medical devices and 
non-medical devices, including software in both cases, for use within the same 
health institution - IPEM, accessed February 10, 2026, 
https://www.ipem.ac.uk/media/vp0ewy01/ipembe-1.pdf 
15.​Artificial intelligence in cancer: applications, challenges, and future ..., accessed 
February 10, 2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC12574039/ 
16.​18 HIPAA Identifiers for PHI De-Identification | Censinet, Inc., accessed February 
10, 2026, 
https://censinet.com/perspectives/18-hipaa-identifiers-for-phi-de-identification 
17.​Guide to HIPAA Identifiers Removal for De-Identification - Accountable HQ, 
accessed February 10, 2026, 
https://www.accountablehq.com/post/guide-to-hipaa-identifiers-removal-for-de
-identification 
18.​Guidance Regarding Methods for De-identification of Protected Health 
Information in Accordance with the Health Insurance Portability and 
Accountability Act (HIPAA) Privacy Rule | HHS.gov, accessed February 10, 2026, 
https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/inde
x.html 
19.​HIPAA Retention Requirements - 2026 Update - The HIPAA Journal, accessed 
February 10, 2026, https://www.hipaajournal.com/hipaa-retention-requirements/ 
20.​Complying with COPPA: Frequently Asked Questions | Federal Trade Commission, 
accessed February 10, 2026, 
https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-a
sked-questions 
21.​How Do I Make My App Compliant With Children's Privacy Laws?, accessed 
February 10, 2026, 
https://thisisglance.com/learning-centre/how-do-i-make-my-app-compliant-with
-childrens-privacy-laws 
22.​Collecting Verifiable Parental Consent: Cliff Notes for COPPA Compliance - CGL 
LLP, accessed February 10, 2026, 
https://cgl-llp.com/insights/collecting-verifiable-parental-consent-coppa/ 
23.​Processing biometric data? Be careful, under the GDPR - IAPP, accessed February 
10, 2026, 
https://iapp.org/news/a/processing-biometric-data-be-careful-under-the-gdpr 
24.​Art. 8 GDPR – Conditions applicable to child's consent in relation to ..., accessed 
February 10, 2026, https://gdpr-info.eu/art-8-gdpr/ 
25.​Are there any specific safeguards for data about children? - European 
Commission, accessed February 10, 2026, 
https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-
organisations/legal-grounds-processing-data/are-there-any-specific-safeguards
-data-about-children_en 
26.​Consent for processing children's personal data in the EU: following in US 
footsteps?, accessed February 10, 2026, 
https://www.tandfonline.com/doi/full/10.1080/13600834.2017.1321096 
27.​Children's Privacy - Epic.org, accessed February 10, 2026, 
https://epic.org/issues/data-protection/childrens-privacy/ 
28.​Musculoskeletal Digital Therapeutics and Digital Health Rehabilitation: A Global 
Paradigm Shift in Orthopedic Care - PMC, accessed February 10, 2026, 
https://pmc.ncbi.nlm.nih.gov/articles/PMC12693369/ 
29.​NeurIPS Poster Don't call it privacy-preserving or human-centric pose estimation 
if you don't measure privacy, accessed February 10, 2026, 
https://neurips.cc/virtual/2025/poster/121920 
30.​Don't call it privacy-preserving or human-centric pose estimation... - 
OpenReview, accessed February 10, 2026, 
https://openreview.net/forum?id=upugtLPOxC 
31.​De-identifying Health Data: Compliance and Privacy Practices - Facit Data 
Systems, accessed February 10, 2026, 
https://facit.ai/insights/de-identifying-health-data-compliance-privacy-practices 
32.​The Role of Informed Consent in Medical AI: Balancing Innovative Advancements 
With Patient Rights | The Cooperative of American Physicians, accessed February 
10, 2026, 
https://www.capphysicians.com/articles/role-informed-consent-medical-ai-balan
cing-innovative-advancements-patient-rights 
33.​AI-assisted consent in paediatric medicine: ethical implications of using large 
language models to support decision-making - PMC, accessed February 10, 
2026, https://pmc.ncbi.nlm.nih.gov/articles/PMC7618262/ 
34.​Website & Social Media Disclaimer - TidalHealth, accessed February 10, 2026, 
https://www.tidalhealth.org/about-us/website-social-media-disclaimer 
35.​Our terms and privacy policy | Saaga Health, accessed February 10, 2026, 
https://www.saagahealth.com/our-terms-and-privacy-policy 
36.​Medical Disclaimer Examples - Termly, accessed February 10, 2026, 
https://termly.io/resources/articles/medical-disclaimer-examples/ 
37.​ASTHMAXCel Privacy Policy, accessed February 10, 2026, 
https://www.asthmaxcel.net/privacy.html 
