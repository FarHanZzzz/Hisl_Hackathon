"""Health check endpoint."""
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "pedi-growth-api",
        "timestamp": datetime.utcnow().isoformat(),
    }
