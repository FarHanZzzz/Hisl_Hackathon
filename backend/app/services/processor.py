"""
Background processing bridge between FastAPI and engine module.

Called by BackgroundTasks when a new job is created.
Runs the video through the gait analysis pipeline and saves results to Supabase.
"""
import traceback
from pathlib import Path
from ..config import UPLOAD_DIR, RESULTS_DIR
from .database import JobService, ResultService


def process_job_async(job_id: str) -> None:
    """
    Process a gait analysis job in the background.
    
    Steps:
        1. Update job status to "processing"
        2. Import and run engine.scanner.process_video()
        3. Save results to Supabase results table
        4. Update job status to "completed"
        5. On error: update job status to "failed" with error message
    
    IMPORTANT: This function runs in a background thread, NOT an async context.
    Do not use await. All Supabase calls are synchronous via httpx.
    """
    job_svc = JobService()
    result_svc = ResultService()
    
    try:
        # Get job details
        job = job_svc.get(job_id)
        if not job:
            return
        
        video_path = UPLOAD_DIR / job["video_filename"]
        if not video_path.exists():
            job_svc.update(job_id, status="failed", 
                          error_message=f"Video file not found: {job['video_filename']}")
            return
        
        # Update status
        job_svc.update(job_id, status="processing", progress=0.0)
        
        # Import engine (deferred to avoid circular imports + MediaPipe startup cost)
        from backend.app.engine.scanner import process_video
        from backend.app.schemas import PatientInfo
        
        # Define progress callback
        def on_progress(fraction: float):
            """Called by process_video with progress 0.0 → 1.0"""
            try:
                job_svc.update(job_id, progress=min(fraction, 0.99))
            except Exception:
                pass  # Don't fail processing due to progress update errors
        
        # Build patient info for process_video
        patient = PatientInfo(patient_id=job_id[:8])
        
        # Run analysis
        analysis_result = process_video(
            video_path=str(video_path),
            patient=patient,
            job_id=job_id,
            output_dir=RESULTS_DIR,
            progress_callback=on_progress
        )
        
        # Save result to Supabase
        result_data = {}
        if analysis_result.metrics:
            m = analysis_result.metrics
            result_data.update(
                left_max_flexion=m.left_knee.max_flexion,
                left_min_flexion=m.left_knee.min_flexion,
                left_rom=m.left_knee.range_of_motion,
                right_max_flexion=m.right_knee.max_flexion,
                right_min_flexion=m.right_knee.min_flexion,
                right_rom=m.right_knee.range_of_motion,
                symmetry_index=m.symmetry_index,
                asymmetry_percentage=m.asymmetry_percentage,
                detection_rate=m.detection_rate,
                frames_processed=m.frames_processed,
                frames_detected=m.frames_detected,
                left_angle_series=m.left_knee.values,
                right_angle_series=m.right_knee.values,
                # --- Orthopedic Features ---
                knee_valgus_angle=m.knee_valgus_angle,
                knee_valgus_angle_array=m.knee_valgus_angle_array,
                pelvic_tilt=m.pelvic_tilt,
                pelvic_tilt_array=m.pelvic_tilt_array,
                foot_progression_angle=m.foot_progression_angle,
                foot_progression_angle_array=m.foot_progression_angle_array,
                ankle_dorsiflexion=m.ankle_dorsiflexion,
                ankle_dorsiflexion_array=m.ankle_dorsiflexion_array,
            )
        if analysis_result.diagnosis:
            d = analysis_result.diagnosis
            result_data.update(
                diagnosis=d.result.value,
                is_high_risk=d.is_high_risk,
                confidence=d.confidence,
            )
        
        result_svc.create(job_id=job_id, **result_data)
        
        # Mark complete
        job_svc.update(job_id, status="completed", progress=1.0)
        
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        try:
            job_svc.update(job_id, status="failed", error_message=error_msg[:2000])
        except Exception:
            pass  # Last resort: can't even update the status
