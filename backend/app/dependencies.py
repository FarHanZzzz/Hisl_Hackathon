import socket
import logging
from urllib.parse import urlparse
from functools import lru_cache
from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Get a cached Supabase client instance.
    Uses @lru_cache to ensure only one client is created.
    """
    use_fallback = False
    reason = ""
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        use_fallback = True
        reason = "Supabase URL or Key is missing"
    elif "your-project-id" in SUPABASE_URL:
        use_fallback = True
        reason = "Supabase URL is set to default placeholder"
        
    if not use_fallback:
        try:
            parsed_url = urlparse(SUPABASE_URL)
            hostname = parsed_url.hostname
            if hostname:
                socket.setdefaulttimeout(3.0)
                socket.getaddrinfo(hostname, None)
        except Exception as e:
            use_fallback = True
            reason = f"Supabase host is unreachable: {e}"

    if use_fallback:
        logger.info(f"Database Fallback: {reason}. Falling back to local SQLite database mode.")
        from .local_db import get_local_supabase_client
        return get_local_supabase_client()

    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.warning(f"Failed to create Supabase client ({e}). Falling back to local SQLite database.")
        from .local_db import get_local_supabase_client
        return get_local_supabase_client()

