import os
import sqlite3
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

def init_sqlite_db(db_path: str):
    """Initialize the local SQLite database schema if tables do not exist."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Patients table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        patient_id TEXT UNIQUE NOT NULL,
        patient_name TEXT,
        age INTEGER,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. Jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        patient_ref TEXT REFERENCES patients(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'queued',
        progress REAL DEFAULT 0.0,
        video_filename TEXT NOT NULL,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
    )
    """)
    
    # 3. Results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        job_id TEXT UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
        left_max_flexion REAL DEFAULT 0,
        left_min_flexion REAL DEFAULT 0,
        left_rom REAL DEFAULT 0,
        right_max_flexion REAL DEFAULT 0,
        right_min_flexion REAL DEFAULT 0,
        right_rom REAL DEFAULT 0,
        symmetry_index REAL DEFAULT 0,
        asymmetry_percentage REAL DEFAULT 0,
        diagnosis TEXT DEFAULT 'insufficient_data',
        is_high_risk INTEGER DEFAULT 0,
        confidence REAL DEFAULT 0,
        detection_rate REAL DEFAULT 0,
        frames_processed INTEGER DEFAULT 0,
        frames_detected INTEGER DEFAULT 0,
        left_angle_series TEXT DEFAULT '[]',
        right_angle_series TEXT DEFAULT '[]',
        knee_valgus_angle REAL DEFAULT 0,
        knee_valgus_angle_array TEXT DEFAULT '[]',
        pelvic_tilt REAL DEFAULT 0,
        pelvic_tilt_array TEXT DEFAULT '[]',
        foot_progression_angle REAL DEFAULT 0,
        foot_progression_angle_array TEXT DEFAULT '[]',
        ankle_dorsiflexion REAL DEFAULT 0,
        ankle_dorsiflexion_array TEXT DEFAULT '[]',
        trunk_sway_array TEXT DEFAULT '[]',
        shoulder_tilt_array TEXT DEFAULT '[]',
        message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 4. Profiles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'patient',
        language TEXT DEFAULT 'en',
        display_name TEXT,
        phone TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 5. Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        clinician_id TEXT,
        title TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 6. Doctor availability table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctor_availability (
        id TEXT PRIMARY KEY,
        clinician_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    )
    """)

    # 7. Appointments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        clinician_id TEXT,
        job_id TEXT,
        appointment_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT DEFAULT 'scheduled'
    )
    """)

    # 8. Simulated Auth users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT
    )
    """)

    # Seed default data if empty
    cursor.execute("SELECT COUNT(*) FROM profiles")
    if cursor.fetchone()[0] == 0:
        logger.info("Seeding default clinician and availability data in local SQLite database...")
        # Create a default clinician profile
        cursor.execute("INSERT OR REPLACE INTO profiles (id, role, display_name, language) VALUES (?, ?, ?, ?)",
                       ("clinician-123", "clinician", "Dr. Sarah Jenkins", "en"))
        
        # Create availability for Dr. Jenkins: Mon (1) to Fri (5), 9:00 AM to 5:00 PM
        for day in range(1, 6):
            cursor.execute("INSERT OR REPLACE INTO doctor_availability (id, clinician_id, day_of_week, start_time, end_time, is_active) VALUES (?, ?, ?, ?, ?, ?)",
                           (f"avail-{day}", "clinician-123", day, "09:00:00", "17:00:00", 1))

    conn.commit()
    conn.close()


class SQLitePostgrestBuilder:
    """Emulates Supabase / Postgrest query builder by compiling chains to SQLite queries."""
    
    def __init__(self, db_path: str, table_name: str):
        self.db_path = db_path
        self.table_name = table_name
        self.columns = "*"
        self.filters = []  # List of tuples: (col, op, val)
        self.order_col = None
        self.order_desc = False
        self.limit_val = None
        self.action = "select"  # select, insert, update, delete
        self.payload = None

    def select(self, columns: str = "*"):
        self.columns = columns
        return self

    def eq(self, column: str, value: any):
        self.filters.append((column, "=", value))
        return self

    def neq(self, column: str, value: any):
        self.filters.append((column, "!=", value))
        return self

    def ilike(self, column: str, value: str):
        self.filters.append((column, "ilike", value))
        return self

    def order(self, column: str, desc: bool = False):
        self.order_col = column
        self.order_desc = desc
        return self

    def limit(self, val: int):
        self.limit_val = val
        return self

    def insert(self, data: dict):
        self.action = "insert"
        self.payload = data
        return self

    def update(self, data: dict):
        self.action = "update"
        self.payload = data
        return self

    def delete(self):
        self.action = "delete"
        return self

    def execute(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            if self.action == "select":
                # Construct query
                sql = f"SELECT * FROM {self.table_name}"
                where_clauses = []
                params = []
                
                for col, op, val in self.filters:
                    if op == "ilike":
                        where_clauses.append(f"{col} LIKE ?")
                        params.append(val)
                    else:
                        where_clauses.append(f"{col} {op} ?")
                        params.append(val)
                        
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)
                    
                if self.order_col:
                    direction = "DESC" if self.order_desc else "ASC"
                    sql += f" ORDER BY {self.order_col} {direction}"
                    
                if self.limit_val is not None:
                    sql += f" LIMIT {self.limit_val}"
                    
                cursor.execute(sql, params)
                rows = cursor.fetchall()
                
                data_list = []
                for row in rows:
                    row_dict = dict(row)
                    
                    # Convert boolean/integer fields
                    if "is_high_risk" in row_dict:
                        row_dict["is_high_risk"] = bool(row_dict["is_high_risk"])
                    if "is_active" in row_dict:
                        row_dict["is_active"] = bool(row_dict["is_active"])
                        
                    # Deserialize JSON structures
                    for key, val in list(row_dict.items()):
                        if (key.endswith("_array") or key.endswith("_series")) and isinstance(val, str):
                            try:
                                row_dict[key] = json.loads(val)
                            except Exception:
                                pass
                                
                    # Programmatic Join: results(*)
                    if "results" in self.columns:
                        cursor.execute("SELECT * FROM results WHERE job_id = ?", (row_dict["id"],))
                        res_row = cursor.fetchone()
                        if res_row:
                            res_dict = dict(res_row)
                            res_dict["is_high_risk"] = bool(res_dict["is_high_risk"])
                            for r_key, r_val in list(res_dict.items()):
                                if (r_key.endswith("_array") or r_key.endswith("_series")) and isinstance(r_val, str):
                                    try:
                                        res_dict[r_key] = json.loads(r_val)
                                    except Exception:
                                        pass
                            row_dict["results"] = res_dict
                        else:
                            row_dict["results"] = None
                            
                    # Programmatic Join: patients!patient_ref(...)
                    if "patients" in self.columns:
                        patient_ref = row_dict.get("patient_ref")
                        if patient_ref:
                            cursor.execute("SELECT id, patient_id, patient_name, notes FROM patients WHERE id = ?", (patient_ref,))
                            pat_row = cursor.fetchone()
                            if pat_row:
                                row_dict["patients"] = dict(pat_row)
                            else:
                                row_dict["patients"] = None
                        else:
                            row_dict["patients"] = None
                            
                    data_list.append(row_dict)
                    
                class MockResult:
                    def __init__(self, data):
                        self.data = data
                return MockResult(data_list)
                
            elif self.action == "insert":
                data = dict(self.payload)
                if "id" not in data:
                    data["id"] = str(uuid.uuid4())
                    
                # Serialize arrays and booleans
                for key, val in list(data.items()):
                    if (key.endswith("_array") or key.endswith("_series")) and not isinstance(val, str):
                        data[key] = json.dumps(val)
                    elif isinstance(val, bool):
                        data[key] = 1 if val else 0
                        
                keys = list(data.keys())
                placeholders = ", ".join(["?"] * len(keys))
                sql = f"INSERT INTO {self.table_name} ({', '.join(keys)}) VALUES ({placeholders})"
                
                cursor.execute(sql, [data[k] for k in keys])
                conn.commit()
                
                # Fetch inserted row
                cursor.execute(f"SELECT * FROM {self.table_name} WHERE id = ?", (data["id"],))
                inserted_row = cursor.fetchone()
                row_dict = dict(inserted_row) if inserted_row else data
                
                if "is_high_risk" in row_dict:
                    row_dict["is_high_risk"] = bool(row_dict["is_high_risk"])
                for r_key, r_val in list(row_dict.items()):
                    if (r_key.endswith("_array") or r_key.endswith("_series")) and isinstance(r_val, str):
                        try:
                            row_dict[r_key] = json.loads(r_val)
                        except Exception:
                            pass
                            
                class MockResult:
                    def __init__(self, data):
                        self.data = [data]
                return MockResult(row_dict)
                
            elif self.action == "update":
                data = dict(self.payload)
                
                for key, val in list(data.items()):
                    if (key.endswith("_array") or key.endswith("_series")) and not isinstance(val, str):
                        data[key] = json.dumps(val)
                    elif isinstance(val, bool):
                        data[key] = 1 if val else 0
                        
                update_clauses = []
                params = []
                for k, v in data.items():
                    update_clauses.append(f"{k} = ?")
                    params.append(v)
                    
                where_clauses = []
                for col, op, val in self.filters:
                    where_clauses.append(f"{col} {op} ?")
                    params.append(val)
                    
                sql = f"UPDATE {self.table_name} SET {', '.join(update_clauses)}"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)
                    
                cursor.execute(sql, params)
                conn.commit()
                
                # Fetch matching row(s)
                select_sql = f"SELECT * FROM {self.table_name}"
                where_sql = ""
                select_params = []
                for col, op, val in self.filters:
                    where_sql += f"{col} {op} ?"
                    select_params.append(val)
                if where_sql:
                    select_sql += f" WHERE {where_sql}"
                    
                cursor.execute(select_sql, select_params)
                updated_rows = cursor.fetchall()
                
                data_list = []
                for row in updated_rows:
                    row_dict = dict(row)
                    if "is_high_risk" in row_dict:
                        row_dict["is_high_risk"] = bool(row_dict["is_high_risk"])
                    for r_key, r_val in list(row_dict.items()):
                        if (r_key.endswith("_array") or r_key.endswith("_series")) and isinstance(r_val, str):
                            try:
                                row_dict[r_key] = json.loads(r_val)
                            except Exception:
                                pass
                    data_list.append(row_dict)
                    
                class MockResult:
                    def __init__(self, data):
                        self.data = data
                return MockResult(data_list)
                
            elif self.action == "delete":
                where_clauses = []
                params = []
                for col, op, val in self.filters:
                    where_clauses.append(f"{col} {op} ?")
                    params.append(val)
                    
                sql = f"DELETE FROM {self.table_name}"
                if where_clauses:
                    sql += " WHERE " + " AND ".join(where_clauses)
                    
                cursor.execute(sql, params)
                conn.commit()
                
                class MockResult:
                    def __init__(self, data):
                        self.data = []
                return MockResult([])
                
        finally:
            conn.close()


class MockSupabaseAuth:
    """Emulates Supabase Auth locally."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path

    def sign_up(self, credentials: dict):
        email = credentials.get("email")
        password = credentials.get("password")
        user_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO auth_users (id, email, password) VALUES (?, ?, ?)", (user_id, email, password))
        conn.commit()
        conn.close()
        
        class MockUser:
            def __init__(self, uid, em):
                self.id = uid
                self.email = em
                
        class MockSession:
            def __init__(self):
                self.access_token = f"mock-jwt-token-{user_id}"
                self.refresh_token = f"mock-refresh-token-{user_id}"
                
        class MockAuthResponse:
            def __init__(self):
                self.user = MockUser(user_id, email)
                self.session = MockSession()
                
        return MockAuthResponse()

    def sign_in_with_password(self, credentials: dict):
        email = credentials.get("email")
        password = credentials.get("password")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM auth_users WHERE email = ? AND password = ?", (email, password))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            from supabase_auth.errors import AuthApiError
            raise AuthApiError("Invalid email or password", status=401)
            
        user_id = row[0]
        
        class MockUser:
            def __init__(self, uid, em):
                self.id = uid
                self.email = em
                
        class MockSession:
            def __init__(self):
                self.access_token = f"mock-jwt-token-{user_id}"
                self.refresh_token = f"mock-refresh-token-{user_id}"
                
        class MockAuthResponse:
            def __init__(self):
                self.user = MockUser(user_id, email)
                self.session = MockSession()
                
        return MockAuthResponse()

    def sign_in_with_otp(self, credentials: dict):
        phone = credentials.get("phone")
        logger.info(f"[MOCK OTP] Sent code '123456' to: {phone}")
        return True

    def verify_otp(self, credentials: dict):
        phone = credentials.get("phone")
        token = credentials.get("token")
        
        if token != "123456":
            from supabase_auth.errors import AuthApiError
            raise AuthApiError("Invalid or expired OTP", status=401)
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM auth_users WHERE phone = ?", (phone,))
        row = cursor.fetchone()
        
        if row:
            user_id = row[0]
        else:
            user_id = str(uuid.uuid4())
            cursor.execute("INSERT INTO auth_users (id, phone) VALUES (?, ?)", (user_id, phone))
            conn.commit()
            
        conn.close()
        
        class MockUser:
            def __init__(self, uid, ph):
                self.id = uid
                self.phone = ph
                self.email = None
                
        class MockSession:
            def __init__(self):
                self.access_token = f"mock-jwt-token-{user_id}"
                self.refresh_token = f"mock-refresh-token-{user_id}"
                
        class MockAuthResponse:
            def __init__(self):
                self.user = MockUser(user_id, phone)
                self.session = MockSession()
                
        return MockAuthResponse()

    def get_user(self, token: str):
        if not token.startswith("mock-jwt-token-"):
            from supabase_auth.errors import AuthApiError
            raise AuthApiError("Invalid or expired token", status=401)
            
        user_id = token.replace("mock-jwt-token-", "")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT email, phone FROM auth_users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            from supabase_auth.errors import AuthApiError
            raise AuthApiError("User not found", status=401)
            
        email, phone = row
        
        class MockUser:
            def __init__(self, uid, em, ph):
                self.id = uid
                self.email = em
                self.phone = ph
                
        class MockUserResponse:
            def __init__(self):
                self.user = MockUser(user_id, email, phone)
                
        return MockUserResponse()


class MockSupabaseClient:
    """Mock Supabase Client wrapper targeting local SQLite database."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.auth = MockSupabaseAuth(db_path)
        
    def table(self, table_name: str) -> SQLitePostgrestBuilder:
        return SQLitePostgrestBuilder(self.db_path, table_name)


_client = None

def get_local_supabase_client() -> MockSupabaseClient:
    """Returns a singleton local mock client instance."""
    global _client
    if _client is None:
        db_path = str(Path(__file__).resolve().parent.parent.parent / "pedi_growth.db")
        init_sqlite_db(db_path)
        _client = MockSupabaseClient(db_path)
    return _client
