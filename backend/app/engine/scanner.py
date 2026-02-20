"""
MediaPipe-based gait scanner for pose detection and angle calculation.
Migrated from worker/processor.py — GaitScanner class + process_video function.
"""

import cv2
import numpy as np
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

    def process_frame(self, image: np.ndarray) -> Tuple[np.ndarray, Tuple[float, float]]:
        """
        Process a single frame to detect pose and calculate knee angles.

        Args:
            image: BGR image from OpenCV

        Returns:
            Tuple of (annotated_image, (left_angle, right_angle))
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
                return image, (0, 0)

            # Get first pose
            landmarks = detection_result.pose_landmarks[0]

            # Helper to get coords
            def get_coords(idx):
                return [landmarks[idx].x, landmarks[idx].y]

            # Extract Landmarks
            # Left Leg
            left_hip = get_coords(23)
            left_knee = get_coords(25)
            left_ankle = get_coords(27)

            # Right Leg
            right_hip = get_coords(24)
            right_knee = get_coords(26)
            right_ankle = get_coords(28)

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

            return image, (left_angle or 0, right_angle or 0)

        except Exception as e:
            print(f"Error processing frame: {e}")
            return image, (0, 0)


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
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        output_video_path = output_dir / f"{job_id}_processed.webm"
        fourcc = cv2.VideoWriter_fourcc(*"vp09")
        video_writer = cv2.VideoWriter(str(output_video_path), fourcc, fps, (width, height))

    # Data collection
    left_angles = []
    right_angles = []
    frames_processed = 0
    frames_detected = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frames_processed += 1

            # Process frame
            processed_frame, (left, right) = scanner.process_frame(frame)

            # Track detection rate
            if left > 0 or right > 0:
                frames_detected += 1

            # Store angles
            left_angles.append(left)
            right_angles.append(right)

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
    diagnosis = get_diagnosis(si, detection_rate)

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
    )

    result = AnalysisResult(
        job_id=job_id,
        patient=patient,
        metrics=metrics,
        diagnosis=diagnosis,
        video_filename=Path(video_path).name,
        processed_video_url=f"/results/{job_id}_processed.webm" if output_video_path else None,
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
