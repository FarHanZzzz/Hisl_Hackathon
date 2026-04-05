"""
JWT authentication middleware for Pedi-Growth API.

Provides:
    - get_current_user: Strict auth — raises 401 if no valid token
    - get_current_user_optional: Lenient auth — returns None for anonymous access
    - require_role(*roles): Authorization dependency — raises 403 if wrong role
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import Depends, HTTPException, Request
from supabase_auth.errors import AuthApiError

from ..dependencies import get_supabase

logger = logging.getLogger(__name__)


def _extract_token(request: Request) -> Optional[str]:
    """Extract Bearer token from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def _verify_and_get_profile(token: str) -> dict:
    """
    Verify a JWT with Supabase Auth and fetch the corresponding profile.

    Returns:
        dict with keys: id, role, display_name, language
    Raises:
        HTTPException(401) on any auth failure
    """
    sb = get_supabase()

    # 1. Verify the JWT and get the Supabase user object
    try:
        user_response = sb.auth.get_user(token)
        user = user_response.user
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    except AuthApiError as exc:
        logger.warning("Auth token verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as exc:
        logger.error("Unexpected auth error: %s", exc)
        raise HTTPException(status_code=401, detail="Authentication failed")

    user_id = user.id

    # 2. Fetch the profile row
    try:
        result = (
            sb.table("profiles")
            .select("id, role, display_name, language")
            .eq("id", str(user_id))
            .execute()
        )
    except Exception as exc:
        logger.error("Failed to fetch profile for user %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="Could not load user profile")

    if not result.data:
        # User exists in auth.users but has no profile row yet.
        # This should not happen if registration inserts a profile,
        # but handle gracefully.
        raise HTTPException(
            status_code=401,
            detail="User profile not found. Please complete registration.",
        )

    profile = result.data[0]
    return {
        "id": profile["id"],
        "role": profile["role"],
        "display_name": profile.get("display_name"),
        "language": profile.get("language", "en"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Dependencies
# ─────────────────────────────────────────────────────────────────────────────


async def get_current_user(request: Request) -> dict:
    """
    **Strict** auth dependency.

    Usage:
        @router.get("/protected")
        async def my_route(user: dict = Depends(get_current_user)):
            ...

    Raises HTTPException(401) if the request has no valid Bearer token.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Provide a Bearer token.",
        )
    return _verify_and_get_profile(token)


async def get_current_user_optional(request: Request) -> Optional[dict]:
    """
    **Lenient** auth dependency — returns ``None`` for anonymous requests.

    Use this on public routes that *optionally* benefit from knowing who
    the caller is (e.g. video upload, results retrieval).
    """
    token = _extract_token(request)
    if not token:
        return None
    try:
        return _verify_and_get_profile(token)
    except HTTPException:
        # Token was provided but invalid — still allow anonymous access
        return None


def require_role(*allowed_roles: str):
    """
    Factory that returns a FastAPI dependency enforcing role-based access.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
        async def admin_route():
            ...

    Or inject the user at the same time:
        async def admin_route(user=Depends(require_role("admin", "clinician"))):
            ...
    """

    async def _role_checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}. "
                       f"Your role: {user['role']}.",
            )
        return user

    return _role_checker
