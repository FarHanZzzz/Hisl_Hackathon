from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta, time
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, root_validator
from ..services.database import get_db

router = APIRouter(prefix="/api/v1/scheduling", tags=["scheduling"])

class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    available: bool

class ClinicianResponse(BaseModel):
    id: str
    display_name: str
    available_days: List[int]

class BookingRequest(BaseModel):
    patient_id: str
    clinician_id: str
    job_id: Optional[str] = None
    appointment_date: str
    start_time: str
    end_time: str

@router.get("/clinicians", response_model=List[ClinicianResponse])
def get_clinicians():
    """Get list of clinicians and their available days of week"""
    db = get_db()
    
    # Get all clinicians
    profiles_res = db.table("profiles").select("id, display_name").eq("role", "clinician").execute()
    clinicians = profiles_res.data
    
    # Get all availability
    avail_res = db.table("doctor_availability").select("clinician_id, day_of_week").eq("is_active", True).execute()
    avail_data = avail_res.data
    
    # Group availability by clinician
    clinician_days = {}
    for entry in avail_data:
        cid = entry["clinician_id"]
        clinician_days.setdefault(cid, set()).add(entry["day_of_week"])
        
    result = []
    for c in clinicians:
        days = list(clinician_days.get(c["id"], []))
        # Only return clinicians who have availability set up
        if days:
            result.append(ClinicianResponse(
                id=c["id"],
                display_name=c.get("display_name") or "Unknown Doctor",
                available_days=days
            ))
            
    return result

@router.get("/available-slots", response_model=List[TimeSlot])
def get_available_slots(doctor_id: str, date_str: str = Query(..., alias="date")):
    """Get 30-min time slots for a doctor on a specific date"""
    db = get_db()
    
    try:
        req_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    # JS getDay() mapping: 0=Sunday, 1=Monday... Postgres EXTRACT(DOW) is also 0-6 where 0=Sunday
    # Python weekday(): 0=Mon, 6=Sun. We map Python to JS/PG
    day_of_week = (req_date.weekday() + 1) % 7
    
    # Fetch doctor availability for this day of week
    avail_res = db.table("doctor_availability") \
        .select("start_time, end_time") \
        .eq("clinician_id", doctor_id) \
        .eq("day_of_week", day_of_week) \
        .eq("is_active", True) \
        .execute()
        
    if not avail_res.data:
        return [] # No working hours today
        
    # Simplify: Take the first active rule for the day
    start_time_str = avail_res.data[0]["start_time"]
    end_time_str = avail_res.data[0]["end_time"]
    
    # Convert "HH:MM:SS" to datetime representing today
    start_dt = datetime.strptime(start_time_str, "%H:%M:%S").time()
    end_dt = datetime.strptime(end_time_str, "%H:%M:%S").time()
    
    # Build complete datetime for iteration
    current_time = datetime.combine(req_date, start_dt)
    end_datetime = datetime.combine(req_date, end_dt)
    
    # Get existing appointments for this doctor on this day
    appts_res = db.table("appointments") \
        .select("start_time") \
        .eq("clinician_id", doctor_id) \
        .eq("appointment_date", date_str) \
        .neq("status", "cancelled") \
        .execute()
        
    booked_times = {a["start_time"] for a in appts_res.data}
    
    slots = []
    # Generate 30 min intervals
    while current_time + timedelta(minutes=30) <= end_datetime:
        slot_start_str = current_time.strftime("%H:%M:%S")
        slot_end_str = (current_time + timedelta(minutes=30)).strftime("%H:%M:%S")
        
        # Check if it overlaps (simplified: just matching exact slot start)
        is_available = slot_start_str not in booked_times
        
        # Also, check if slot is in the past!
        if datetime.combine(req_date, current_time.time()) <= datetime.now():
            is_available = False
            
        slots.append(TimeSlot(
            start_time=slot_start_str,
            end_time=slot_end_str,
            available=is_available
        ))
        current_time += timedelta(minutes=30)
        
    return slots

@router.post("/book")
def book_appointment(req: BookingRequest):
    db = get_db()
    
    # 1. Insert appointment
    try:
        res = db.table("appointments").insert({
            "patient_id": req.patient_id,
            "clinician_id": req.clinician_id,
            "job_id": req.job_id,
            "appointment_date": req.appointment_date,
            "start_time": req.start_time,
            "end_time": req.end_time,
            "status": "scheduled"
        }).execute()
        
        return {"message": "Appointment booked successfully", "appointment": res.data[0]}
        
    except Exception as e:
        error_str = str(e)
        if "no_double_booking" in error_str or "23505" in error_str:
            raise HTTPException(
                status_code=409, 
                detail="This time slot was just booked by someone else. Please select another."
            )
        raise HTTPException(status_code=500, detail=f"Booking failed: {error_str}")
