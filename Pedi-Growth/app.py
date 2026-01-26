import streamlit as st
import tempfile
import cv2
import numpy as np
from processor import GaitScanner

# Page Configuration
st.set_page_config(layout="wide", page_title="Pedi-Growth: Clinical Gait Analysis")
st.title("Pedi-Growth: Clinical Gait Analysis")

# Sidebar
st.sidebar.header("Configuration")
video_file = st.sidebar.file_uploader("Upload Video", type=['mp4', 'mov'])

# Hide Streamlit Branding
st.markdown('<style>#MainMenu {visibility: hidden;} footer {visibility: hidden;}</style>', unsafe_allow_html=True)

# Initialize Scanner
with st.spinner('Initializing AI Engine...'):
    scanner = GaitScanner()

if video_file:
    # Save uploaded file to a temporary file
    tfile = tempfile.NamedTemporaryFile(delete=False)
    tfile.write(video_file.read())
    
    cap = cv2.VideoCapture(tfile.name)
    
    # Layout using Columns
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Live Analysis Feed")
        video_placeholder = st.empty()
        
    with col2:
        st.subheader("Joint Angles (Degrees)")
        chart_placeholder = st.empty()
        
    left_angles = []
    right_angles = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Process Frame
        processed_frame, (left, right) = scanner.process_frame(frame)
        
        # Convert BGR to RGB for Streamlit display
        processed_frame_rgb = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)
        
        # Update Video Feed
        video_placeholder.image(processed_frame_rgb, channels="RGB", use_container_width=True)
        
        # Update Data Lists
        left_angles.append(left)
        right_angles.append(right)
        
        # Update Charts
        chart_data = {"Left Knee": left_angles, "Right Knee": right_angles}
        chart_placeholder.line_chart(chart_data)
        
    cap.release()
    
    # --- Phase 4: Medical Brain (Post-Analysis Report) ---
    st.markdown("---")
    st.header("Post-Analysis Report")
    
    if left_angles and right_angles:
        # Filter None/0 values
        left_clean = [x for x in left_angles if x is not None and x > 0]
        right_clean = [x for x in right_angles if x is not None and x > 0]
        
        max_left_flexion = np.max(left_clean) if left_clean else 0
        max_right_flexion = np.max(right_clean) if right_clean else 0
        
        # Avoid division by zero
        max_val = max(max_left_flexion, max_right_flexion)
        symmetry_score = 0.0
        if max_val > 0:
            symmetry_score = min(max_left_flexion, max_right_flexion) / max_val
            
        # UI Metrics
        c1, c2, c3 = st.columns(3)
        c1.metric("Left Max Flexion", f"{max_left_flexion:.1f}°")
        c2.metric("Right Max Flexion", f"{max_right_flexion:.1f}°")
        c3.metric("Symmetry Score", f"{symmetry_score:.2f}")
        
        # The Verdict
        if symmetry_score < 0.85:
            st.error("HIGH RISK: Significant Asymmetry Detected. Please consult a specialist.")
        else:
            st.success("NORMAL: Gait symmetry within clinical limits.")
    else:
        st.warning("Insufficient data collected for analysis.")
