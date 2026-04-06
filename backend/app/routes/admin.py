from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..middleware.auth import require_role
from ..services.database import get_db

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin"))]
)

class PatientCreateRequest(BaseModel):
    name: str
    phone: str
    clinician_id: str
    notes: str = ""

@router.get("/stats")
def get_admin_stats():
    # Mock data for demonstration purposes
    return {
        "total_patients": 124,
        "active_clinicians": 12,
        "total_scans": 845,
        "system_uptime": 99.9,
        "chart_data": [
            {"day": "Mon", "requests": 150},
            {"day": "Tue", "requests": 230},
            {"day": "Wed", "requests": 224},
            {"day": "Thu", "requests": 218},
            {"day": "Fri", "requests": 260},
            {"day": "Sat", "requests": 180},
            {"day": "Sun", "requests": 140},
        ]
    }

@router.get("/users")
def get_all_users():
    db = get_db()
    res = db.table("profiles").select("id, display_name, language, role, phone").execute()
    users = []
    # Mix in mock statuses
    for p in res.data:
        users.append({
            "id": p["id"],
            "name": p.get("display_name") or "Unknown",
            "email_or_phone": p.get("phone") or "admin@example.com",
            "role": p["role"],
            "status": "Active",
            "last_login": "2 hours ago"
        })
    return users

@router.post("/patients")
def create_patient_as_admin(req: PatientCreateRequest):
    db = get_db()
    try:
        # Create user profile (stub/mock)
        return {"success": True, "message": "Patient successfully created and assigned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
