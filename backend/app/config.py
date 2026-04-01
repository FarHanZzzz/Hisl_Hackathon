"""
Environment configuration for Pedi-Growth backend.
Loads from .env file at project root.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env — try project root first (local dev), then backend dir (Render)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

env_path = PROJECT_ROOT / ".env"
if not env_path.exists():
    env_path = BACKEND_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

# =============================================================================
# DIRECTORIES
# =============================================================================

# Use BACKEND_DIR as base for uploads/results on Render
_base = BACKEND_DIR if not (PROJECT_ROOT / "frontend").exists() else PROJECT_ROOT
UPLOAD_DIR = _base / "uploads"
RESULTS_DIR = _base / "results"
MODELS_DIR = _base / "models"

# Ensure dirs exist
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)

# =============================================================================
# SUPABASE
# =============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# =============================================================================
# AI (OpenRouter)
# =============================================================================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-3.1-pro-preview")

# =============================================================================
# APP
# =============================================================================

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://hisl-hackathon.onrender.com",
]

# Add any Vercel deployment URLs (they change per deploy)
_extra = os.getenv("CORS_EXTRA_ORIGINS", "")
if _extra:
    CORS_ORIGINS.extend([o.strip() for o in _extra.split(",") if o.strip()])

# Also allow all .vercel.app subdomains
CORS_ORIGINS.append("*")  # For hackathon; tighten in production

# =============================================================================
# FILE UPLOAD
# =============================================================================

ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"]
MAX_FILE_SIZE_MB = 100
