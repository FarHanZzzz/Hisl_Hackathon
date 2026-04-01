# Phase 0B: Backend Authentication

## Goal
Add JWT-based authentication middleware to FastAPI so that every API request knows WHO is making it and WHAT role they have.

## Dependencies
- Phase 0A (database tables must exist)

## What Gets Created

### File 1: `backend/app/middleware/auth.py`
JWT extraction and role verification middleware.

```python
# Pseudo-structure:

async def get_current_user(request) -> Profile:
    """Extract JWT from Authorization header, validate with Supabase, return user profile."""
    # 1. Extract Bearer token from header
    # 2. Verify JWT with Supabase Auth
    # 3. Fetch profile from profiles table
    # 4. Return profile (id, role, display_name, language)

def require_role(*roles):
    """Decorator/dependency that restricts endpoint to specific roles."""
    # Usage: @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
```

**Why:** Every protected endpoint will call `get_current_user()` as a FastAPI dependency. If the JWT is missing or invalid, the request is rejected with 401.

---

### File 2: `backend/app/routes/auth.py`
New auth endpoints.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Create account (email for clinician, phone for patient) |
| `POST` | `/api/v1/auth/login` | Public | Email/password login → returns JWT |
| `POST` | `/api/v1/auth/send-otp` | Public | Send SMS OTP to phone number |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify OTP → returns JWT |
| `GET` | `/api/v1/me` | Authenticated | Get current user profile |
| `PATCH` | `/api/v1/me` | Authenticated | Update profile (display_name, language) |

**Registration Flow (Clinician):**
```
1. POST /auth/register { email, password, display_name, role: "clinician" }
2. Supabase creates auth.users entry
3. Trigger creates profiles entry with role="clinician"
4. Return JWT
```

**Registration Flow (Patient):**
```
1. POST /auth/send-otp { phone: "+8801XXXXXXXXX" }
2. Supabase sends SMS OTP
3. POST /auth/verify-otp { phone, otp_code }
4. If first time: create profile with role="patient"
5. Return JWT
```

---

### File 3: Modify `backend/app/services/database.py`
Add new service classes.

```python
class ProfileService:
    """CRUD for the profiles table."""
    def get_by_id(self, user_id: str) -> dict
    def create(self, user_id: str, role: str, display_name: str) -> dict
    def update(self, user_id: str, **kwargs) -> dict

class SessionService:
    """CRUD for the sessions table."""
    def create(self, patient_id: str, clinician_id: str, title: str) -> dict
    def list_by_patient(self, patient_id: str) -> list
    def get(self, session_id: str) -> dict
```

---

### File 4: Modify existing routes (WITH BACKWARDS COMPATIBILITY)
Scope endpoints by user, but **DO NOT BREAK public uploads**.

**Auth Dependencies:**
```python
# Use for strictly protected routes (e.g., clinician dashboard):
user = Depends(get_current_user)

# Use for public-facing MVP routes (e.g., upload video):
user = Depends(get_current_user_optional)
```

**Route Update Example:**
```python
@router.post("/upload")
async def upload_video(file: UploadFile, user=Depends(get_current_user_optional)):
    # If user is None, patient_id is NULL. The MVP flow survives!
    patient_id = user["id"] if user else None
    return await process_upload(file, patient_id)
```

---

### File 5: Modify `backend/app/schemas.py`
Add auth-related Pydantic models.

```python
class RegisterRequest(BaseModel):
    email: Optional[str]
    password: Optional[str]
    phone: Optional[str]
    display_name: str
    role: Literal["clinician", "patient"]

class LoginRequest(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    otp_code: str

class ProfileResponse(BaseModel):
    id: str
    role: str
    display_name: str
    language: str
```

---

## Verification
- [ ] `POST /auth/register` with clinician role creates user + profile
- [ ] `POST /auth/login` returns valid JWT
- [ ] `GET /me` returns correct profile with JWT
- [ ] `GET /api/v1/jobs` returns only jobs belonging to the authenticated user
- [ ] Unauthenticated requests to protected endpoints return 401

## Exit Criteria
All API endpoints are protected. Auth endpoints work. User context is available in every route handler.
