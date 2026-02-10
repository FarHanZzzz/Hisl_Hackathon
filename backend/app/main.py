"""
Pedi-Growth Backend API
FastAPI application for video upload, job management, and results retrieval.

Run: uvicorn backend.app.main:app --reload --port 8000
(from project root: d:\\\\Hisl_hackathon_project)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import UPLOAD_DIR, RESULTS_DIR, CORS_ORIGINS
from backend.app.routes import health_router, upload_router, jobs_router

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Pedi-Growth API",
    description="AI-Powered Pediatric Gait Analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads and results
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")

# =============================================================================
# REGISTER ROUTERS
# =============================================================================

app.include_router(health_router)
app.include_router(upload_router)
app.include_router(jobs_router)

# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
