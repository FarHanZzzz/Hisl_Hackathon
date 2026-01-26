import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from utils import calculate_angle

class GaitScanner:
    def __init__(self, model_path='pose_landmarker_heavy.task'):
        # Initialize Pose Landmarker
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5,
            output_segmentation_masks=False
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)

    def process_frame(self, image):
        """
        Processes a single frame using Mediapipe Tasks API.
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
            # Landmarks 0-10 are face. 
            face_indices = list(range(11)) # 0 to 10
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
            
            # Custom Drawing (since mp.solutions is missing)
            h, w, c = image.shape
            
            # Convert normalized coords to pixel coords
            def to_pix(norm_coords):
                return (int(norm_coords[0] * w), int(norm_coords[1] * h))

            # Draw Connections
            # Left Leg
            cv2.line(image, to_pix(left_hip), to_pix(left_knee), (0, 255, 0), 2)
            cv2.line(image, to_pix(left_knee), to_pix(left_ankle), (0, 255, 0), 2)
            # Right Leg
            cv2.line(image, to_pix(right_hip), to_pix(right_knee), (0, 0, 255), 2)
            cv2.line(image, to_pix(right_knee), to_pix(right_ankle), (0, 0, 255), 2)
            # Hips
            cv2.line(image, to_pix(left_hip), to_pix(right_hip), (255, 255, 255), 2)
            
            # Draw Joints
            for pt in [left_hip, left_knee, left_ankle, right_hip, right_knee, right_ankle]:
                cv2.circle(image, to_pix(pt), 5, (255, 255, 255), -1)

            # Asymmetry Check
            if left_angle is not None and right_angle is not None:
                if abs(left_angle - right_angle) > 30:
                    cv2.putText(image, 'ASYMMETRY ALERT', (50, 50), 
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
            
            return image, (left_angle, right_angle)

        except Exception as e:
            print(f"Error processing frame: {e}")
            return image, (0, 0)
