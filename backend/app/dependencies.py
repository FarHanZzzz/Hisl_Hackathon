"""
Dependency injection for the FastAPI application.
Supabase client singleton using @lru_cache.
"""
from functools import lru_cache
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Get a cached Supabase client instance.
    Uses @lru_cache to ensure only one client is created.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_KEY must be set in .env file"
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)
