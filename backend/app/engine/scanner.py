"""
MediaPipe-based gait scanner for pose detection and angle calculation.
Migrated from worker/processor.py — GaitScanner class + process_video function.
"""

import cv2
import numpy as np
import subprocess
import tempfile
from pathlib import Path
from typing import Tuple, Optional, Callable
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from backend.app.utils import calculate_angle
from backend.app.schemas import (
    AnalysisMetrics,
    AngleData,
    DiagnosisInfo,
    AnalysisResult,
    PatientInfo,
)
from .video import validate_video
from .smoothing import smooth_angles
from .math_utils import (
    calculate_angle_3d_projected,
    calculate_pelvic_tilt,
    apply_smoothing,
    calculate_dorsiflexion_angle,
    calculate_foot_progression_angle,
    calculate_shoulder_tilt,
    calculate_trunk_sway,
    calculate_ic_normalized_valgus
)
from .analysis import (
    calculate_rom,
    calculate_symmetry_index,
    calculate_asymmetry,
    calculate_confidence,
    get_diagnosis,
)


class GaitScanner:
    """
    MediaPipe-based gait scanner for pose detection and angle calculation.
    """

    def __init__(self, model_path: str = None):
        """
        Initialize the GaitScanner with MediaPipe Pose Landmarker.

        Args:
            model_path: Path to the pose_landmarker.task model file.
                       If None, looks in standard locations.
        """
        if model_path is None:
            # Look for model in standard locations (from project root)
            project_root = Path(__file__).resolve().parent.parent.parent.parent
            possible_paths = [
                project_root / "models" / "pose_landmarker_heavy.task",
                project_root / "models" / "pose_landmarker_lite.task",
            ]
            for p in possible_paths:
                if p.exists():
                    model_path = str(p)
                    break
            else:
                raise FileNotFoundError(
                    "pose_landmarker_heavy.task not found. "
                    "Please place it in the models/ directory."
                )

        # Initialize Pose Landmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_segmentation_masks=False,
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)

    def process_frame(self, image: np.ndarray) -> Tuple[np.ndarray, Tuple[float, float], Tuple[float, float], float, Tuple[float, float], Tuple[float, float], float, float, Tuple[float, float, float, float]]:
        """
        Process a single frame to detect pose and calculate knee angles.

        Args:
            image: BGR image from OpenCV

        Returns:
            Tuple of (annotated_image, (left_angle, right_angle), (left_valgus, right_valgus), 
            pelvic_tilt, (l_prog, r_prog), (l_dorsi, r_dorsi), shoulder_tilt, trunk_sway, 
            (left_ankle_y, right_ankle_y, left_knee_y, right_knee_y))
        """
        try:
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Create MP Image
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

            # Detect
            detection_result = self.landmarker.detect(mp_image)

            # If no landmarks detected
            if not detection_result.pose_landmarks:
                return image, (0, 0), (0, 0), 0.0, (0, 0), (0, 0), 0.0, 0.0, (0.0, 0.0, 0.0, 0.0)

            # Get first pose
            landmarks = detection_result.pose_landmarks[0]

            # Helper to get coords
            def get_coords(idx):
                return [landmarks[idx].x, landmarks[idx].y]
                
            def get_coords_3d(idx):
                return np.array([landmarks[idx].x, landmarks[idx].y, landmarks[idx].z])

            # Extract Landmarks
            # Left Leg
            left_hip = get_coords(23)
            left_knee = get_coords(25)
            left_ankle = get_coords(27)
            
            left_hip_3d = get_coords_3d(23)
            left_knee_3d = get_coords_3d(25)
            left_ankle_3d = get_coords_3d(27)
            left_heel_3d = get_coords_3d(29)
            left_toe_3d = get_coords_3d(31)

            # Right Leg
            right_hip = get_coords(24)
            right_knee = get_coords(26)
            right_ankle = get_coords(28)
            
            right_hip_3d = get_coords_3d(24)
            right_knee_3d = get_coords_3d(26)
            right_ankle_3d = get_coords_3d(28)
            right_heel_3d = get_coords_3d(30)
            right_toe_3d = get_coords_3d(32)

            # Face Privacy (Blur)
            face_indices = list(range(11))  # 0 to 10
            face_coords_norm = [get_coords(i) for i in face_indices]

            h, w, c = image.shape

            # Convert to pixel coords
            face_coords_pix = [(int(pt[0] * w), int(pt[1] * h)) for pt in face_coords_norm]

            if face_coords_pix:
                xs = [pt[0] for pt in face_coords_pix]
                ys = [pt[1] for pt in face_coords_pix]

                # Bounding Box with Padding
                pad = 30
                min_x, max_x = max(0, min(xs) - pad), min(w, max(xs) + pad)
                min_y, max_y = max(0, min(ys) - pad), min(h, max(ys) + pad)

                # Apply Blur
                if max_x > min_x and max_y > min_y:
                    face_roi = image[min_y:max_y, min_x:max_x]
                    blurred_face = cv2.GaussianBlur(face_roi, (51, 51), 30)
                    image[min_y:max_y, min_x:max_x] = blurred_face

            # Calculate Angles
            left_angle = calculate_angle(left_hip, left_knee, left_ankle)
            right_angle = calculate_angle(right_hip, right_knee, right_ankle)

            # Phase 2: Rickets (Valgus Angle) on Frontal Plane
            left_valgus = calculate_angle_3d_projected(left_hip_3d, left_knee_3d, left_ankle_3d, "frontal")
            right_valgus = calculate_angle_3d_projected(right_hip_3d, right_knee_3d, right_ankle_3d, "frontal")

            # Phase 3: Leg Length Discrepancy (Pelvic Tilt)
            p_tilt = calculate_pelvic_tilt(np.array(left_hip), np.array(right_hip))

            # Phase 4: Clubfoot Kinematics
            l_dorsi = calculate_dorsiflexion_angle(left_knee_3d, left_ankle_3d, left_heel_3d, left_toe_3d)
            r_dorsi = calculate_dorsiflexion_angle(right_knee_3d, right_ankle_3d, right_heel_3d, right_toe_3d)

            l_prog = calculate_foot_progression_angle(left_heel_3d, left_toe_3d)
            r_prog = calculate_foot_progression_angle(right_heel_3d, right_toe_3d)

            # Phase 7: Neuromuscular Features
            left_shoulder = get_coords(11)
            right_shoulder = get_coords(12)

            s_tilt = calculate_shoulder_tilt(np.array(left_shoulder), np.array(right_shoulder))
            t_sway = calculate_trunk_sway(np.array(left_shoulder), np.array(right_shoulder), np.array(left_hip), np.array(right_hip))

            # Return ankle Y-coordinates for IC detection (for improved valgus accuracy)
            # Ankle Y position is used to detect initial contact frames
            left_ankle_y = left_ankle[1]  # Normalized Y coordinate (0-1)
            right_ankle_y = right_ankle[1]
            left_knee_y_val = left_knee[1]
            right_knee_y_val = right_knee[1]

            # Draw skeleton
            h, w, c = image.shape

            def to_pix(norm_coords):
                return (int(norm_coords[0] * w), int(norm_coords[1] * h))

            # Draw Connections
            # Left Leg (Green)
            cv2.line(image, to_pix(left_hip), to_pix(left_knee), (0, 255, 0), 2)
            cv2.line(image, to_pix(left_knee), to_pix(left_ankle), (0, 255, 0), 2)
            # Right Leg (Red)
            cv2.line(image, to_pix(right_hip), to_pix(right_knee), (0, 0, 255), 2)
            cv2.line(image, to_pix(right_knee), to_pix(right_ankle), (0, 0, 255), 2)
            # Hips (White)
            cv2.line(image, to_pix(left_hip), to_pix(right_hip), (255, 255, 255), 2)

            # Draw Joints
            for pt in [left_hip, left_knee, left_ankle, right_hip, right_knee, right_ankle]:
                cv2.circle(image, to_pix(pt), 5, (255, 255, 255), -1)

            # Asymmetry Check
            if left_angle is not None and right_angle is not None:
                if abs(left_angle - right_angle) > 30:
                    cv2.putText(
                        image,
                        "ASYMMETRY ALERT",
                        (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 0, 255),
                        2,
                        cv2.LINE_AA,
                    )

            return image, (left_angle or 0, right_angle or 0), (left_valgus or 0, right_valgus or 0), p_tilt or 0.0, (l_prog or 0, r_prog or 0), (l_dorsi or 0, r_dorsi or 0), s_tilt or 0.0, t_sway or 0.0, (left_ankle_y, right_ankle_y, left_knee_y_val, right_knee_y_val)

        except Exception as e:
            print(f"Error processing frame: {e}")
            return image, (0, 0), (0, 0), 0.0, (0, 0), (0, 0), 0.0, 0.0, (0.0, 0.0, 0.0, 0.0)


def process_video(
    video_path: str,
    patient: PatientInfo,
    job_id: str,
    output_dir: Path = None,
    progress_callback: Callable[[float], None] = None,
) -> AnalysisResult:
    """
    Process a complete video and generate analysis results.

    Args:
        video_path: Path to the input video file
        patient: Patient information
        job_id: Unique job identifier
        output_dir: Directory to save processed video and frames
        progress_callback: Optional callback for progress updates

    Returns:
        AnalysisResult with metrics and diagnosis
    """
    from datetime import datetime

    # Step 0: Validate video
    validation = validate_video(video_path)
    if not validation["valid"]:
        raise ValueError(f"Invalid video: {', '.join(validation['errors'])}")

    # Initialize scanner
    scanner = GaitScanner()

    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Setup output video writer (optional)
    output_video_path = None
    video_writer = None
    temp_video_path = None
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        # Write to a temporary AVI file first (OpenCV is reliable with raw AVI)
        # We'll convert to browser-compatible MP4 with ffmpeg afterwards
        temp_video_path = output_dir / f"{job_id}_temp.avi"
        output_video_path = output_dir / f"{job_id}_processed.mp4"
        fourcc = cv2.VideoWriter_fourcc(*"MJPG")
        video_writer = cv2.VideoWriter(str(temp_video_path), fourcc, fps, (width, height))

    # Data collection
    left_angles = []
    right_angles = []
    left_valgus_angles = []
    right_valgus_angles = []
    pelvic_tilts = []
    left_progression_angles = []
    right_progression_angles = []
    left_dorsiflexion_angles = []
    right_dorsiflexion_angles = []
    shoulder_tilts = []
    trunk_sways = []
    # For IC normalization (improves knee valgus accuracy from ±19° to <5°)
    left_ankle_y_coords = []
    right_ankle_y_coords = []
    left_knee_y_coords = []
    right_knee_y_coords = []
    frames_processed = 0
    frames_detected = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frames_processed += 1

            # Process frame
            processed_frame, (left, right), (l_valgus, r_valgus), p_tilt, (l_prog, r_prog), (l_dorsi, r_dorsi), s_tilt, t_sway, (l_ankle_y, r_ankle_y, l_knee_y, r_knee_y) = scanner.process_frame(frame)

            # Track detection rate
            if left > 0 or right > 0:
                frames_detected += 1

            # Store angles
            left_angles.append(left)
            right_angles.append(right)
            left_valgus_angles.append(l_valgus)
            right_valgus_angles.append(r_valgus)
            pelvic_tilts.append(p_tilt)
            left_progression_angles.append(l_prog)
            right_progression_angles.append(r_prog)
            left_dorsiflexion_angles.append(l_dorsi)
            right_dorsiflexion_angles.append(r_dorsi)
            shoulder_tilts.append(s_tilt)
            trunk_sways.append(t_sway)
            
            # Store ankle/knee Y-coordinates for IC detection
            left_ankle_y_coords.append(l_ankle_y)
            right_ankle_y_coords.append(r_ankle_y)
            left_knee_y_coords.append(l_knee_y)
            right_knee_y_coords.append(r_knee_y)

            # Write processed frame
            if video_writer:
                video_writer.write(processed_frame)

            # Progress callback
            if progress_callback and total_frames > 0:
                progress = frames_processed / total_frames
                progress_callback(progress)

    finally:
        cap.release()
        if video_writer:
            video_writer.release()

    # Post-process: Convert temp AVI to browser-compatible MP4 using ffmpeg
    if temp_video_path and temp_video_path.exists():
        try:
            ffmpeg_cmd = [
                "ffmpeg", "-y",
                "-i", str(temp_video_path),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",  # Enables progressive download in browser
                "-an",  # No audio
                str(output_video_path),
            ]
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True, timeout=300)
            # Remove the temporary AVI file
            temp_video_path.unlink(missing_ok=True)
            # Also remove any old .webm file for this job
            old_webm = output_dir / f"{job_id}_processed.webm"
            old_webm.unlink(missing_ok=True)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
            print(f"Warning: ffmpeg post-processing failed: {e}")
            # Fallback: rename the AVI as-is (won't play in browser but won't crash)
            if temp_video_path.exists() and not output_video_path.exists():
                temp_video_path.rename(output_video_path)

    # Step 1: Smooth raw angle arrays
    left_smooth = smooth_angles(left_angles)
    right_smooth = smooth_angles(right_angles)

    # Step 2: Calculate ROM from smoothed data
    left_rom = calculate_rom(left_smooth)
    right_rom = calculate_rom(right_smooth)

    # Step 3: Calculate metrics with NEW directional SI formula
    si = calculate_symmetry_index(left_rom, right_rom)
    asymmetry_pct = calculate_asymmetry(si)
    detection_rate = (frames_detected / frames_processed * 100) if frames_processed > 0 else 0

    # Step 4: Get diagnosis

    # Phase 2: Rickets heuristics - Using IC-normalization for improved accuracy
    # Research: PMC11399566 (2024) shows IC-normalization reduces MediaPipe error from ±18.83° to <5°
    
    # Calculate IC-normalized knee valgus angles
    avg_l_valgus, avg_r_valgus, left_valgus_normalized, right_valgus_normalized = calculate_ic_normalized_valgus(
        left_valgus_angles,
        right_valgus_angles,
        left_ankle_y_coords,
        right_ankle_y_coords,
        left_knee_y_coords,
        right_knee_y_coords,
        fps
    )
    
    # Fallback to non-normalized if IC detection failed
    if avg_l_valgus == 0.0 and avg_r_valgus == 0.0:
        # Use traditional averaging as fallback
        left_v_valid = [v for v in left_valgus_angles if v > 0]
        right_v_valid = [v for v in right_valgus_angles if v > 0]
        avg_l_valgus = sum(left_v_valid) / len(left_v_valid) if left_v_valid else 0.0
        avg_r_valgus = sum(right_v_valid) / len(right_v_valid) if right_v_valid else 0.0
        # Note: Using raw angles, thresholds account for ±19° error margin
    
    # The mechanical axis interior angle. < 170° typically varum (bowleg), > 190° typically valgum (knock-knee)
    # Using the worst case angle out of both legs
    max_deviation = 0.0

    # Simple heuristic to find most deviant leg from 180 degrees
    # With IC-normalization, this now represents deviation from neutral alignment at initial contact
    l_dev = avg_l_valgus - 180.0
    r_dev = avg_r_valgus - 180.0
    most_deviant = l_dev if abs(l_dev) > abs(r_dev) else r_dev
    max_deviation = 180.0 + most_deviant
    
    # Phase 3: Pelvic Tilt LLD heuristics
    # Apply Butterworth filter to smooth bounding box jitter
    smoothed_pelvic_tilts = apply_smoothing(pelvic_tilts).tolist() if len(pelvic_tilts) > 0 else []
    
    if len(smoothed_pelvic_tilts) > 0:
        tilt_variance = float(np.var(smoothed_pelvic_tilts))
        max_tilt_amplitude = float(max(abs(t) for t in smoothed_pelvic_tilts))
    else:
        tilt_variance = 0.0
        max_tilt_amplitude = 0.0
        
    # Phase 4: Clubfoot heuristics
    left_dorsi_smooth = apply_smoothing(left_dorsiflexion_angles).tolist() if left_dorsiflexion_angles else []
    right_dorsi_smooth = apply_smoothing(right_dorsiflexion_angles).tolist() if right_dorsiflexion_angles else []
    left_prog_smooth = apply_smoothing(left_progression_angles).tolist() if left_progression_angles else []
    
    # Analyze max/min dorsiflexion for Equinus/Calcaneus gait
    max_dorsi_left = max(left_dorsi_smooth) if left_dorsi_smooth else 90.0
    min_dorsi_left = min(left_dorsi_smooth) if left_dorsi_smooth else 90.0
    max_dorsi_right = max(right_dorsi_smooth) if right_dorsi_smooth else 90.0
    min_dorsi_right = min(right_dorsi_smooth) if right_dorsi_smooth else 90.0
    
    # A perfectly flat foot makes a 90 deg projection angle.
    # Toes pointed DOWN = plantarflexion = angle > 90
    # Toes pointed UP = dorsiflexion = angle < 90
    
    # We want to find if they are always on their toes (Equinus) or always on their heels (Calcaneus)
    # Get the minimum dorsiflexion ever reached (the smallest angle, meaning maximum toes-up).
    # If this minimum is still > 100 degrees, they never got their heel down (Equinus).
    most_equinus = max(min_dorsi_left, min_dorsi_right) # Max of the mins, so the worst-case lack of dorsiflexion
    
    # If the maximum angle ever reached is < 80 degrees, they never pointed their toes down (Calcaneus).
    most_calcaneus = min(max_dorsi_left, max_dorsi_right)
    
    # Foot progression averaging
    avg_foot_progression = sum(left_prog_smooth) / len(left_prog_smooth) if left_prog_smooth else 0.0
    
    # Get base diagnosis
    # Pass Neuromuscular metrics (trunk_sway_variance, smoothed arrays) to the updated get_diagnosis later
    # We will compute them here for Phase 7
    smoothed_shoulder_tilts = apply_smoothing(shoulder_tilts).tolist() if len(shoulder_tilts) > 0 else []
    smoothed_trunk_sways = apply_smoothing(trunk_sways).tolist() if len(trunk_sways) > 0 else []
    
    if len(smoothed_trunk_sways) > 0:
        trunk_sway_variance = float(np.var(smoothed_trunk_sways))
    else:
        trunk_sway_variance = 0.0
        
    diagnosis = get_diagnosis(si, detection_rate, max_deviation, tilt_variance, max_tilt_amplitude, most_equinus, most_calcaneus, trunk_sway_variance, smoothed_shoulder_tilts, smoothed_pelvic_tilts)

    # Derive max/min from smoothed data for AngleData
    left_valid = [a for a in left_smooth if a > 0]
    right_valid = [a for a in right_smooth if a > 0]
    left_max = max(left_valid) if left_valid else 0.0
    left_min = min(left_valid) if left_valid else 0.0
    right_max = max(right_valid) if right_valid else 0.0
    right_min = min(right_valid) if right_valid else 0.0

    # Build result
    metrics = AnalysisMetrics(
        left_knee=AngleData(
            values=left_smooth,
            max_flexion=left_max,
            min_flexion=left_min,
            range_of_motion=left_rom,
        ),
        right_knee=AngleData(
            values=right_smooth,
            max_flexion=right_max,
            min_flexion=right_min,
            range_of_motion=right_rom,
        ),
        symmetry_index=si,
        asymmetry_percentage=asymmetry_pct,
        frames_processed=frames_processed,
        frames_detected=frames_detected,
        detection_rate=detection_rate,
        knee_valgus_angle=max_deviation,
        knee_valgus_angle_array=left_valgus_angles,  # Storing left side for charts as example
        pelvic_tilt=max_tilt_amplitude,
        pelvic_tilt_array=smoothed_pelvic_tilts,
        foot_progression_angle=avg_foot_progression,
        foot_progression_angle_array=left_prog_smooth,
        ankle_dorsiflexion=most_equinus,
        ankle_dorsiflexion_array=left_dorsi_smooth,
        # --- Neuromuscular Features ---
        trunk_sway_array=smoothed_trunk_sways,
        shoulder_tilt_array=smoothed_shoulder_tilts,
    )

    result = AnalysisResult(
        job_id=job_id,
        patient=patient,
        metrics=metrics,
        diagnosis=diagnosis,
        video_filename=Path(video_path).name,
        processed_video_url=f"/results/{job_id}_processed.mp4" if output_video_path else None,
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
    )

    return result


if __name__ == "__main__":
    # Test the processor
    import sys

    if len(sys.argv) < 2:
        print("Usage: python -m backend.app.engine.scanner <video_path>")
        sys.exit(1)

    video_path = sys.argv[1]

    patient = PatientInfo(patient_id="TEST001", patient_name="Test Patient")
    job_id = "test-job-001"

    print(f"Processing video: {video_path}")

    def progress_cb(p):
        print(f"Progress: {p*100:.1f}%")

    result = process_video(
        video_path=video_path,
        patient=patient,
        job_id=job_id,
        progress_callback=progress_cb,
    )

    print(f"\nResults:")
    print(f"  Frames processed: {result.metrics.frames_processed}")
    print(f"  Detection rate: {result.metrics.detection_rate:.1f}%")
    print(f"  Left max flexion: {result.metrics.left_knee.max_flexion:.1f}°")
    print(f"  Right max flexion: {result.metrics.right_knee.max_flexion:.1f}°")
    print(f"  Symmetry Index: {result.metrics.symmetry_index:.2f}")
    print(f"  Diagnosis: {result.diagnosis.result.value}")
    print(f"  Message: {result.diagnosis.message}")
