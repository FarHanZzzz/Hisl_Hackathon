"""
Environment configuration for Pedi-Growth backend.
Loads from .env file at project root.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env", override=True)

# =============================================================================
# DIRECTORIES
# =============================================================================

UPLOAD_DIR = PROJECT_ROOT / "uploads"
RESULTS_DIR = PROJECT_ROOT / "results"
MODELS_DIR = PROJECT_ROOT / "models"

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
]

# =============================================================================
# FILE UPLOAD
# =============================================================================

ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"]
MAX_FILE_SIZE_MB = 100
