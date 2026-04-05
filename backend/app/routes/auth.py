"""
Authentication routes for Pedi-Growth API.

Endpoints:
    POST /api/v1/auth/register   — Email+password registration
    POST /api/v1/auth/login      — Email+password login
    POST /api/v1/auth/send-otp   — Send SMS OTP (phone auth)
    POST /api/v1/auth/verify-otp — Verify SMS OTP
    GET  /api/v1/me              — Get current user profile
    PATCH /api/v1/me             — Update current user profile
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from supabase_auth.errors import AuthApiError
from pydantic import BaseModel, Field

from ..dependencies import get_supabase
from ..middleware.auth import get_current_user
from ..services.database import ProfileService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    display_name: Optional[str] = Field(None, description="Display name")
    role: str = Field("patient", description="Role: clinician, patient, or admin")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="Password")


class OTPSendRequest(BaseModel):
    phone: str = Field(..., description="Phone number in E.164 format (e.g. +8801XXXXXXXXX)")


class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., description="Phone number in E.164 format")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class ProfileUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    language: Optional[str] = Field(None, pattern=r"^(en|bn)$")


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


class ProfileResponse(BaseModel):
    id: str
    role: str
    display_name: Optional[str] = None
    language: str = "en"


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────


@router.post("/api/v1/auth/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    """
    Register a new user with email + password.
    Creates both a Supabase Auth user and a profiles row.
    """
    if body.role not in ("clinician", "patient", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be: clinician, patient, or admin.")

    sb = get_supabase()

    # 1. Create the auth user
    try:
        auth_response = sb.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
    except AuthApiError as exc:
        logger.warning("Registration failed: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected registration error: %s", exc)
        raise HTTPException(status_code=500, detail="Registration failed")

    user = auth_response.user
    session = auth_response.session

    if user is None:
        raise HTTPException(status_code=400, detail="Failed to create user account")

    # 2. Create the profile row
    try:
        profile_svc = ProfileService()
        profile_svc.create(
            user_id=str(user.id),
            role=body.role,
            display_name=body.display_name,
        )
    except Exception as exc:
        logger.error("Failed to create profile for user %s: %s", user.id, exc)
        # Auth user was created but profile failed — not ideal but recoverable
        # The profile can be created on next login via a fallback

    return AuthResponse(
        access_token=session.access_token if session else "",
        refresh_token=session.refresh_token if session else "",
        user={
            "id": str(user.id),
            "email": user.email,
            "role": body.role,
            "display_name": body.display_name,
        },
    )


@router.post("/api/v1/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Authenticate with email + password and return JWT tokens."""
    sb = get_supabase()

    try:
        auth_response = sb.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
    except AuthApiError as exc:
        logger.warning("Login failed for %s: %s", body.email, exc)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    except Exception as exc:
        logger.error("Unexpected login error: %s", exc)
        raise HTTPException(status_code=500, detail="Login failed")

    user = auth_response.user
    session = auth_response.session

    if user is None or session is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Fetch profile for role info
    profile_svc = ProfileService()
    profile = profile_svc.get_by_id(str(user.id))

    role = profile["role"] if profile else "patient"
    display_name = profile.get("display_name") if profile else None

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user={
            "id": str(user.id),
            "email": user.email,
            "role": role,
            "display_name": display_name,
        },
    )


@router.post("/api/v1/auth/send-otp")
async def send_otp(body: OTPSendRequest):
    """Send an SMS OTP to the given phone number."""
    sb = get_supabase()

    try:
        sb.auth.sign_in_with_otp({
            "phone": body.phone,
        })
    except AuthApiError as exc:
        logger.warning("OTP send failed for %s: %s", body.phone, exc)
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected OTP error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to send OTP")

    return {"message": "OTP sent successfully", "phone": body.phone}


@router.post("/api/v1/auth/verify-otp", response_model=AuthResponse)
async def verify_otp(body: OTPVerifyRequest):
    """Verify SMS OTP and return JWT tokens. Creates a patient profile if first-time."""
    sb = get_supabase()

    try:
        auth_response = sb.auth.verify_otp({
            "phone": body.phone,
            "token": body.otp_code,
            "type": "sms",
        })
    except AuthApiError as exc:
        logger.warning("OTP verification failed for %s: %s", body.phone, exc)
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    except Exception as exc:
        logger.error("Unexpected OTP verify error: %s", exc)
        raise HTTPException(status_code=500, detail="OTP verification failed")

    user = auth_response.user
    session = auth_response.session

    if user is None or session is None:
        raise HTTPException(status_code=401, detail="OTP verification failed")

    # Ensure profile exists (create if first-time phone login)
    profile_svc = ProfileService()
    profile = profile_svc.get_by_id(str(user.id))

    if not profile:
        try:
            profile = profile_svc.create(
                user_id=str(user.id),
                role="patient",
                phone=body.phone,
            )
        except Exception as exc:
            logger.error("Failed to create patient profile: %s", exc)

    role = profile["role"] if profile else "patient"
    display_name = profile.get("display_name") if profile else None

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user={
            "id": str(user.id),
            "phone": body.phone,
            "role": role,
            "display_name": display_name,
        },
    )


@router.get("/api/v1/me", response_model=ProfileResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return ProfileResponse(
        id=user["id"],
        role=user["role"],
        display_name=user.get("display_name"),
        language=user.get("language", "en"),
    )


@router.patch("/api/v1/me", response_model=ProfileResponse)
async def update_me(
    body: ProfileUpdateRequest,
    user: dict = Depends(get_current_user),
):
    """Update the authenticated user's display name and/or language."""
    updates = {}
    if body.display_name is not None:
        updates["display_name"] = body.display_name
    if body.language is not None:
        updates["language"] = body.language

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    profile_svc = ProfileService()
    updated = profile_svc.update(user["id"], **updates)

    return ProfileResponse(
        id=updated["id"],
        role=updated["role"],
        display_name=updated.get("display_name"),
        language=updated.get("language", "en"),
    )
