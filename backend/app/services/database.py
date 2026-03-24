"""
Supabase database service — CRUD operations for patients, jobs, results.

Tables (already exist in Supabase):
    patients: id(UUID PK), patient_id(TEXT UNIQUE), patient_name, age, notes, created_at
    jobs:     id(UUID PK), patient_ref(FK→patients), status, progress, video_filename, error_message, created_at, completed_at
    results:  id(UUID PK), job_id(FK→jobs UNIQUE), left_max_flexion, ..., left_angle_series(JSONB), right_angle_series(JSONB), created_at
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import re
from ..dependencies import get_supabase


class PatientService:
    """CRUD for the patients table."""
    
    def __init__(self):
        self.db = get_supabase()
        self.table = "patients"
    
    def generate_patient_id(self, patient_name: str) -> str:
        """Generate a sequential patient ID based on the patient's name."""
        if patient_name:
            safe_name = re.sub(r'[^a-zA-Z0-9]', '', patient_name)
            prefix = safe_name[:15] if safe_name else "Patient"
        else:
            prefix = "Patient"
            
        result = (self.db.table(self.table)
                  .select("patient_id")
                  .ilike("patient_id", f"{prefix}-%")
                  .execute())
                  
        max_num = 0
        if result.data:
            for row in result.data:
                pid = row.get("patient_id", "")
                parts = pid.rsplit("-", 1)
                if len(parts) == 2 and parts[1].isdigit():
                    num = int(parts[1])
                    if num > max_num:
                        max_num = num
                        
        next_num = max_num + 1
        return f"{prefix}-{next_num:03d}"
    
    def get_or_create(self, patient_id: str = None, patient_name: str = None, 
                      age: int = None, notes: str = None) -> Dict[str, Any]:
        """
        Find existing patient by patient_id, or create a new one.
        Returns the patient row as a dict.
        """
        if not patient_id:
            patient_id = self.generate_patient_id(patient_name)
            
        # Try to find existing
        result = (self.db.table(self.table)
                  .select("*")
                  .eq("patient_id", patient_id)
                  .execute())
        if result.data:
            return result.data[0]
        
        # Create new patient
        data = {"patient_id": patient_id}
        if patient_name:
            data["patient_name"] = patient_name
        if age is not None:
            data["age"] = age
        if notes:
            data["notes"] = notes
        
        return self.db.table(self.table).insert(data).execute().data[0]
    
    def get(self, patient_uuid: str) -> Optional[Dict[str, Any]]:
        """Get patient by UUID."""
        result = self.db.table(self.table).select("*").eq("id", patient_uuid).execute()
        return result.data[0] if result.data else None


class JobService:
    """CRUD for the jobs table."""
    
    def __init__(self):
        self.db = get_supabase()
        self.table = "jobs"
    
    def create(self, patient_ref: str, video_filename: str) -> Dict[str, Any]:
        """Create a new analysis job. Returns the created row."""
        return self.db.table(self.table).insert({
            "patient_ref": patient_ref,
            "video_filename": video_filename,
            "status": "queued",
            "progress": 0.0
        }).execute().data[0]
    
    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by UUID, including nested results if completed."""
        result = (self.db.table(self.table)
                  .select("*, results(*), patients!patient_ref(patient_id, patient_name, notes)")
                  .eq("id", job_id)
                  .execute())
        return result.data[0] if result.data else None
    
    def update(self, job_id: str, **kwargs) -> Dict[str, Any]:
        """
        Update job fields. Common updates:
            status="processing", progress=0.5
            status="completed", progress=1.0, completed_at=now
            status="failed", error_message="..."
        """
        if "status" in kwargs and kwargs["status"] == "completed":
            kwargs["completed_at"] = datetime.now(timezone.utc).isoformat()
        return (self.db.table(self.table)
                .update(kwargs)
                .eq("id", job_id)
                .execute().data[0])
    
    def list_all(self, status: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List jobs, optionally filtered by status, ordered by newest first."""
        query = (self.db.table(self.table)
                 .select("*, results(*), patients!patient_ref(patient_id, patient_name, notes)")
                 .order("created_at", desc=True)
                 .limit(limit))
        if status:
            query = query.eq("status", status)
        return query.execute().data
    
    def delete(self, job_id: str) -> None:
        """Delete a job by UUID. CASCADE deletes associated result."""
        self.db.table(self.table).delete().eq("id", job_id).execute()


class ResultService:
    """CRUD for the results table."""
    
    def __init__(self):
        self.db = get_supabase()
        self.table = "results"
    
    def create(self, job_id: str, **kwargs) -> Dict[str, Any]:
        """
        Save analysis results for a job.
        
        Expected kwargs:
            left_max_flexion, left_min_flexion, left_rom,
            right_max_flexion, right_min_flexion, right_rom,
            symmetry_index, asymmetry_percentage,
            diagnosis (str: "normal"|"high_risk"|"insufficient_data"),
            is_high_risk (bool), confidence (float),
            detection_rate, frames_processed, frames_detected,
            left_angle_series (list), right_angle_series (list)
        """
        data = {"job_id": job_id, **kwargs}
        return self.db.table(self.table).insert(data).execute().data[0]
    
    def get_by_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get result by job UUID."""
        result = self.db.table(self.table).select("*").eq("job_id", job_id).execute()
        return result.data[0] if result.data else None
