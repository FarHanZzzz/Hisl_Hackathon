import streamlit as st

# BUG FIX #1: st.set_page_config MUST be the first Streamlit command
st.set_page_config(layout="wide", page_title="Pedi-Growth: Clinical Gait Analysis")

import tempfile
import cv2
import numpy as np
import os
import time
from processor import GaitScanner

# =============================================================================
# CONFIGURATION
# =============================================================================

# Demo video mapping for SAM 3 Protocol (pre-processed videos)
DEMO_VIDEOS = {
    "normal.mp4": "videos/normal_processed.mp4",
    "limp.mp4": "videos/limp_processed.mp4",
    "toe_walk.mp4": "videos/toe_walk_processed.mp4",
}

# Diagnostic thresholds
SI_LOW_THRESHOLD = 0.85
SI_HIGH_THRESHOLD = 1.15
ANGLE_DIFF_ALERT = 30  # Degrees difference to trigger real-time alert

# Performance: display every Nth frame to reduce UI lag
DISPLAY_EVERY_N_FRAMES = 3

# Smoothing window size for angle data
SMOOTH_WINDOW = 5

# =============================================================================
# CUSTOM CSS
# =============================================================================

st.markdown("""
<style>
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}

.diagnosis-high-risk {
    background: linear-gradient(135deg, #ff4b4b, #cc0000);
    color: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin: 10px 0;
}

.diagnosis-normal {
    background: linear-gradient(135deg, #00cc66, #009944);
    color: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    margin: 10px 0;
}

.metric-card {
    background-color: #f0f2f6;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    margin: 5px 0;
}
</style>
""", unsafe_allow_html=True)

# =============================================================================
# PAGE HEADER
# =============================================================================

st.title("Pedi-Growth: Clinical Gait Analysis")
st.caption("AI-Powered Pediatric Gait Triage Tool")

# =============================================================================
# SIDEBAR
# =============================================================================

st.sidebar.header("Patient Information")
patient_id = st.sidebar.text_input("Patient ID", value="", placeholder="Enter Patient ID")
patient_name = st.sidebar.text_input("Patient Name", value="", placeholder="Enter Patient Name (optional)")

st.sidebar.markdown("---")
st.sidebar.header("Video Upload")
video_file = st.sidebar.file_uploader("Upload Gait Video", type=['mp4', 'mov', 'avi'])

st.sidebar.markdown("---")
st.sidebar.header("Settings")
show_skeleton = st.sidebar.checkbox("Show Skeleton Overlay", value=True)
enable_sam3 = st.sidebar.checkbox("Enable Noise Cancellation (SAM 3)", value=True)

# Model selector for different hardware
model_options = {}
if os.path.exists(os.path.join(os.path.dirname(__file__), 'pose_landmarker_lite.task')):
    model_options["Lite (Fast)"] = "pose_landmarker_lite.task"
if os.path.exists(os.path.join(os.path.dirname(__file__), 'pose_landmarker_full.task')):
    model_options["Full (Balanced)"] = "pose_landmarker_full.task"
if os.path.exists(os.path.join(os.path.dirname(__file__), 'pose_landmarker_heavy.task')):
    model_options["Heavy (Accurate)"] = "pose_landmarker_heavy.task"

if len(model_options) > 1:
    model_choice = st.sidebar.selectbox("AI Model", list(model_options.keys()))
    selected_model = model_options[model_choice]
elif model_options:
    selected_model = list(model_options.values())[0]
else:
    selected_model = "pose_landmarker_lite.task"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_video_path(uploaded_file, enable_sam3_mode):
    """
    SAM 3 Protocol: Check if this is a known demo video and swap to processed version.
    Otherwise, save uploaded file to temp location.
    """
    filename = uploaded_file.name if uploaded_file else ""

    # Check for demo video swap (SAM 3 Protocol)
    if enable_sam3_mode and filename in DEMO_VIDEOS:
        processed_path = DEMO_VIDEOS[filename]
        script_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(script_dir, processed_path)
        if os.path.exists(full_path):
            return full_path, True

    # Fall back to saving uploaded file
    tfile = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    tfile.write(uploaded_file.read())
    tfile.close()
    return tfile.name, False


def calculate_symmetry_index(max_left, max_right):
    """
    Symmetry Index: SI = max(ROM_left) / max(ROM_right)
    Healthy: 0.85 <= SI <= 1.15
    """
    if max_right <= 0:
        return 0.0
    return max_left / max_right


def get_diagnosis(symmetry_index):
    """Determine diagnosis based on SI thresholds."""
    asymmetry_pct = abs(1.0 - symmetry_index) * 100
    if symmetry_index < SI_LOW_THRESHOLD or symmetry_index > SI_HIGH_THRESHOLD:
        return "HIGH RISK: Significant Asymmetry Detected", True, asymmetry_pct
    else:
        return "NORMAL: Gait Symmetry Within Clinical Limits", False, asymmetry_pct


def smooth_angles(angles, window=SMOOTH_WINDOW):
    """Apply a simple moving average to reduce angle jitter."""
    if len(angles) < window:
        return angles
    kernel = np.ones(window) / window
    # Filter out zeros for smoothing, then restore
    clean = [a if a > 0 else np.nan for a in angles]
    arr = np.array(clean, dtype=float)
    # Use pandas-free rolling mean via convolution
    smoothed = np.convolve(arr[~np.isnan(arr)], kernel, mode='same') if np.any(~np.isnan(arr)) else arr
    # Rebuild full-length list
    result = []
    smooth_idx = 0
    for a in angles:
        if a > 0 and smooth_idx < len(smoothed):
            result.append(float(smoothed[smooth_idx]))
            smooth_idx += 1
        else:
            result.append(a)
    return result


# =============================================================================
# MAIN APPLICATION
# =============================================================================

# Initialize Scanner with selected model
with st.spinner('Initializing AI Engine...'):
    scanner = GaitScanner(model_path=selected_model)

if video_file:
    # Validate patient ID
    if not patient_id:
        st.warning("Please enter a Patient ID before proceeding.")
        st.stop()

    # Get video path (with SAM 3 swap if applicable)
    if enable_sam3:
        with st.spinner("Applying AI Noise Cancellation (SAM 3)..."):
            time.sleep(0.5)
            video_path, sam3_used = get_video_path(video_file, enable_sam3)
            if sam3_used:
                st.sidebar.success("Background Removal: COMPLETE")
    else:
        video_path, sam3_used = get_video_path(video_file, False)

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        st.error("Failed to open video file. Please try a different file.")
        st.stop()

    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    try:
        # Layout
        col1, col2 = st.columns(2)

        with col1:
            st.subheader("Live Analysis Feed")
            video_placeholder = st.empty()
            progress_bar = st.progress(0)

        with col2:
            st.subheader("Knee Flexion Angles (Degrees)")
            chart_placeholder = st.empty()
            status_placeholder = st.empty()

        # Data collection
        left_angles = []
        right_angles = []
        frames_processed = 0
        frames_detected = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frames_processed += 1

            # Process EVERY frame for data (BUG FIX #2: pass show_skeleton, BUG FIX #5: pass threshold)
            processed_frame, (left, right) = scanner.process_frame(
                frame,
                show_skeleton=show_skeleton,
                angle_diff_alert=ANGLE_DIFF_ALERT
            )

            # Track detection rate
            if left > 0 or right > 0:
                frames_detected += 1

            # Store angles
            left_angles.append(left)
            right_angles.append(right)

            # BUG FIX #3: Only update display every Nth frame to reduce UI lag
            if frames_processed % DISPLAY_EVERY_N_FRAMES == 0:
                # Convert BGR to RGB for Streamlit display
                processed_frame_rgb = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)

                # Resize for faster display
                display_h, display_w = processed_frame_rgb.shape[:2]
                if display_w > 640:
                    scale = 640 / display_w
                    processed_frame_rgb = cv2.resize(
                        processed_frame_rgb,
                        (640, int(display_h * scale))
                    )

                # Update Video Feed
                video_placeholder.image(processed_frame_rgb, channels="RGB", use_container_width=True)

                # Update progress
                progress = frames_processed / total_frames if total_frames > 0 else 0
                progress_bar.progress(min(progress, 1.0))

                # BUG FIX #6: Smooth angles for chart display
                chart_data = {
                    "Left Knee": smooth_angles(left_angles),
                    "Right Knee": smooth_angles(right_angles),
                }
                chart_placeholder.line_chart(chart_data)

                # Update status
                detection_rate = (frames_detected / frames_processed * 100) if frames_processed > 0 else 0
                status_placeholder.caption(
                    f"Frames: {frames_processed}/{total_frames} | Detection Rate: {detection_rate:.1f}%"
                )

    finally:
        cap.release()
        # BUG FIX #4: Clean up temp file
        if not sam3_used and os.path.exists(video_path):
            try:
                os.unlink(video_path)
            except OSError:
                pass

    # =========================================================================
    # POST-ANALYSIS REPORT
    # =========================================================================

    st.markdown("---")
    st.header("Post-Analysis Report")

    # Patient info header
    report_col1, report_col2, report_col3 = st.columns(3)
    with report_col1:
        st.write(f"**Patient ID:** {patient_id}")
    with report_col2:
        st.write(f"**Patient Name:** {patient_name if patient_name else 'N/A'}")
    with report_col3:
        st.write(f"**Video:** {video_file.name}")

    st.markdown("---")

    if left_angles and right_angles:
        # Filter None/0 values
        left_clean = [x for x in left_angles if x is not None and x > 0]
        right_clean = [x for x in right_angles if x is not None and x > 0]

        if left_clean and right_clean:
            # Calculate metrics
            max_left_flexion = np.max(left_clean)
            max_right_flexion = np.max(right_clean)
            min_left_flexion = np.min(left_clean)
            min_right_flexion = np.min(right_clean)

            # Range of Motion
            rom_left = max_left_flexion - min_left_flexion
            rom_right = max_right_flexion - min_right_flexion

            # Symmetry Index
            symmetry_index = calculate_symmetry_index(max_left_flexion, max_right_flexion)

            # Diagnosis
            diagnosis_text, is_high_risk, asymmetry_pct = get_diagnosis(symmetry_index)

            # Detection rate
            detection_rate = (frames_detected / frames_processed * 100) if frames_processed > 0 else 0

            # ----- METRICS -----
            st.subheader("Key Metrics")
            m1, m2, m3, m4 = st.columns(4)
            m1.metric("Left Max Flexion", f"{max_left_flexion:.1f}\u00b0")
            m2.metric("Right Max Flexion", f"{max_right_flexion:.1f}\u00b0")
            m3.metric("Symmetry Index (SI)", f"{symmetry_index:.2f}")
            m4.metric("Asymmetry", f"{asymmetry_pct:.1f}%")

            st.markdown("---")

            st.subheader("Detailed Analysis")
            d1, d2, d3, d4 = st.columns(4)
            d1.metric("Left ROM", f"{rom_left:.1f}\u00b0")
            d2.metric("Right ROM", f"{rom_right:.1f}\u00b0")
            d3.metric("Detection Rate", f"{detection_rate:.1f}%")
            d4.metric("Frames Analyzed", f"{frames_processed}")

            st.markdown("---")

            # ----- DIAGNOSIS -----
            st.subheader("Diagnosis")

            if is_high_risk:
                st.markdown(
                    f'<div class="diagnosis-high-risk">DIAGNOSIS: {diagnosis_text}</div>',
                    unsafe_allow_html=True
                )
                st.error("**Recommendation:** Please consult a pediatric neurologist for further evaluation.")

                st.markdown("### Risk Factors Detected:")
                if symmetry_index < SI_LOW_THRESHOLD:
                    st.write(f"- Symmetry Index ({symmetry_index:.2f}) is below threshold ({SI_LOW_THRESHOLD})")
                    st.write("- Indicates possible weakness or impairment in the LEFT leg")
                elif symmetry_index > SI_HIGH_THRESHOLD:
                    st.write(f"- Symmetry Index ({symmetry_index:.2f}) is above threshold ({SI_HIGH_THRESHOLD})")
                    st.write("- Indicates possible weakness or impairment in the RIGHT leg")
                st.write(f"- Asymmetry percentage: {asymmetry_pct:.1f}%")
            else:
                st.markdown(
                    f'<div class="diagnosis-normal">DIAGNOSIS: {diagnosis_text}</div>',
                    unsafe_allow_html=True
                )
                st.success("**Result:** Gait pattern appears symmetric and within normal clinical limits.")

            # ----- DETECTION RATE WARNING -----
            if detection_rate < 60:
                st.warning(
                    f"**Low Detection Rate ({detection_rate:.1f}%)**: The AI could not detect the body "
                    "in many frames. This may produce unreliable results. Please re-record the video "
                    "following the Video Recording Guide below."
                )

            # ----- INTERPRETATION GUIDE -----
            with st.expander("Interpretation Guide"):
                st.markdown("""
### Symmetry Index (SI) Interpretation

The Symmetry Index compares the maximum knee flexion between left and right legs:

- **SI = 1.0**: Perfect symmetry (both legs have identical max flexion)
- **SI < 0.85**: Left leg shows significantly less flexion than right (possible left-side impairment)
- **SI > 1.15**: Left leg shows significantly more flexion than right (possible right-side impairment)
- **0.85 <= SI <= 1.15**: Within normal clinical limits

### Important Notes

- This tool is for **triage purposes only** and does not replace professional medical diagnosis.
- Results should be interpreted by a qualified healthcare professional.
- Video quality, camera angle, and patient positioning can affect accuracy.
- Recommend multiple recordings for confirmation before referral.

### Hemiplegic Gait Indicators

- Unilateral weakness in knee flexion
- Flat or reduced sine-wave pattern on affected side
- Asymmetry > 15% during walking cycle
                """)
        else:
            st.warning("Insufficient valid angle data. Please ensure the full body is visible in the video.")
    else:
        st.warning("No data collected. Please ensure the video contains a walking subject with visible lower limbs.")

else:
    # =========================================================================
    # WELCOME SCREEN
    # =========================================================================

    st.info("Welcome to Pedi-Growth! Upload a gait video to begin analysis.")

    st.markdown("""
### How to Use

1. Enter the **Patient ID** in the sidebar
2. Upload a **gait video** (MP4, MOV, or AVI format)
3. Wait for the AI to analyze the walking pattern
4. Review the **diagnosis report** and key metrics

### About This Tool

Pedi-Growth uses AI-powered computer vision to analyze pediatric gait patterns and detect potential
signs of developmental delays or motor impairments such as Cerebral Palsy. It calculates the
**Symmetry Index** to quantify gait asymmetry and provide a triage recommendation.

**Note:** This tool is for screening and triage purposes only. Results should be reviewed by a
qualified healthcare professional.
    """)

    # ----- VIDEO RECORDING TUTORIAL -----
    with st.expander("Video Recording Tutorial (Read Before Recording)"):
        st.markdown("""
### Camera Setup

- **Device**: Any smartphone camera (720p minimum, 1080p preferred)
- **Orientation**: **LANDSCAPE mode** (horizontal, NOT portrait)
- **Position**: Tripod or steady surface at waist height (~80-100cm from the ground)
- **Distance**: 2-3 meters from the walking path
- **Angle**: **Side view (sagittal plane)** -- camera sees the child walking left-to-right

### Environment

- **Background**: Plain solid wall (white or light color)
- **Lighting**: Well-lit room, no strong backlighting or shadows behind the subject
- **Floor**: Clear walking path with no obstacles (3-4 meters long)
- **People**: **ONLY the child** in frame -- no other people visible

### Recording Steps

1. Place camera on tripod at waist height, 2-3 meters from the walking path
2. Start recording **BEFORE** the child begins walking
3. Child walks naturally across the frame (left to right or right to left)
4. Ensure **full body is visible** at all times: head, arms, legs, and feet
5. Record at least **4-6 full walking steps** (8-15 seconds total)
6. Stop recording **AFTER** the child has finished walking

### What to AVOID

- Portrait (vertical) video orientation
- Camera movement or shaking
- Partial body visibility (legs or head cut off at frame edges)
- Multiple people in the frame
- Dark or backlit environments
- Loose or baggy clothing that hides leg movement
- Running, jumping, or non-natural walking

### Video Specifications

| Property | Requirement |
|----------|------------|
| Format | MP4, MOV, or AVI |
| Resolution | 720p or higher |
| Duration | 8-15 seconds |
| Orientation | Landscape (horizontal) |
| Frame rate | 24-30 FPS |
| File size | Under 50MB |
| View angle | Side view (sagittal) |

### Good vs Bad Video Examples

**GOOD video:**
- Full body visible from head to feet
- Side view (sagittal plane)
- Clean, well-lit background
- Steady camera on tripod
- Child walks naturally with 4-6 steps
- Only one person in frame

**BAD video:**
- Feet or head cut off at frame edge
- Front-facing camera (less accurate for knee angles)
- Dark room or strong shadows on subject
- Shaky handheld camera footage
- Multiple people visible in frame
- Child running or jumping instead of walking
        """)

    # ----- VIDEO REQUIREMENTS SUMMARY -----
    st.markdown("""
### Quick Video Checklist

- [ ] Landscape orientation (horizontal)
- [ ] Side view of the walking child
- [ ] Full body visible (head to feet)
- [ ] Clean background, good lighting
- [ ] Steady camera (tripod preferred)
- [ ] 8-15 seconds, 4-6 walking steps
- [ ] Only one person in frame
    """)
