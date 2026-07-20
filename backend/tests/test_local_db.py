import pytest
import os
import tempfile
from pathlib import Path
from app.local_db import MockSupabaseClient, init_sqlite_db

@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_sqlite_db(path)
    yield path
    try:
        os.unlink(path)
    except OSError:
        pass

def test_patient_crud(temp_db):
    client = MockSupabaseClient(temp_db)
    
    # 1. Insert patient
    insert_res = client.table("patients").insert({
        "id": "test-uuid-1",
        "patient_id": "PAT-001",
        "patient_name": "Alice Johnson",
        "age": 8,
        "notes": "Test notes"
    }).execute()
    
    patient = insert_res.data[0] if isinstance(insert_res.data, list) else insert_res.data
    assert patient["patient_id"] == "PAT-001"
    assert patient["patient_name"] == "Alice Johnson"
    assert patient["age"] == 8
    
    # 2. Select patient
    select_res = client.table("patients").select("*").eq("patient_id", "PAT-001").execute()
    assert len(select_res.data) == 1
    assert select_res.data[0]["patient_name"] == "Alice Johnson"
    
    # 3. Update patient
    update_res = client.table("patients").update({
        "patient_name": "Alice J. Smith",
        "age": 9
    }).eq("id", "test-uuid-1").execute()
    
    assert len(update_res.data) == 1
    assert update_res.data[0]["patient_name"] == "Alice J. Smith"
    assert update_res.data[0]["age"] == 9
    
    # 4. Delete patient
    client.table("patients").delete().eq("id", "test-uuid-1").execute()
    select_after_del = client.table("patients").select("*").eq("id", "test-uuid-1").execute()
    assert len(select_after_del.data) == 0

def test_jobs_with_joins(temp_db):
    client = MockSupabaseClient(temp_db)
    
    # Insert patient
    client.table("patients").insert({
        "id": "pat-1",
        "patient_id": "P-001",
        "patient_name": "Bob",
        "age": 5
    }).execute()
    
    # Insert job
    client.table("jobs").insert({
        "id": "job-1",
        "patient_ref": "pat-1",
        "video_filename": "walk.mp4",
        "status": "queued"
    }).execute()
    
    # Insert result
    client.table("results").insert({
        "id": "res-1",
        "job_id": "job-1",
        "left_rom": 45.5,
        "right_rom": 46.2,
        "left_angle_series": [10, 20, 30]
    }).execute()
    
    # Select with join
    select_res = client.table("jobs").select("*, results(*), patients!patient_ref(*)").eq("id", "job-1").execute()
    assert len(select_res.data) == 1
    job = select_res.data[0]
    
    assert job["video_filename"] == "walk.mp4"
    assert job["results"] is not None
    assert job["results"]["left_rom"] == 45.5
    assert job["results"]["left_angle_series"] == [10, 20, 30]
    
    assert job["patients"] is not None
    assert job["patients"]["patient_name"] == "Bob"

def test_auth_simulation(temp_db):
    client = MockSupabaseClient(temp_db)
    
    # Sign up
    res = client.auth.sign_up({"email": "test@example.com", "password": "password123"})
    assert res.user.email == "test@example.com"
    token = res.session.access_token
    assert token.startswith("mock-jwt-token-")
    
    # Get user
    user_res = client.auth.get_user(token)
    assert user_res.user.email == "test@example.com"
    
    # Sign in
    login_res = client.auth.sign_in_with_password({"email": "test@example.com", "password": "password123"})
    assert login_res.user.email == "test@example.com"
