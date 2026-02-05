# Pedi-Growth: AI-Powered Pediatric Gait Analysis

A clinical gait analysis tool for early detection of Cerebral Palsy and developmental delays in children. Uses computer vision (MediaPipe) to analyze walking patterns and compute symmetry metrics.

## Project Structure

```
cbh/
├── backend/                 # FastAPI REST API
│   ├── main.py             # API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile
├── frontend/               # Next.js Web UI
│   ├── pages/              # React pages
│   ├── styles/             # CSS styles
│   ├── package.json
│   └── Dockerfile
├── worker/                 # Background video processor
│   ├── processor.py        # GaitScanner + video processing
│   ├── requirements.txt
│   └── Dockerfile
├── shared/                 # Shared code
│   ├── schemas.py          # Pydantic schemas
│   └── utils.py            # Utility functions
├── Pedi-Growth/            # Original Streamlit prototype
│   ├── app.py              # Streamlit UI
│   ├── processor.py        # GaitScanner class
│   └── pose_landmarker_heavy.task
├── plan/                   # Implementation plan (5 phases)
│   ├── phase1_setup.md
│   ├── phase2_engine.md
│   ├── phase3_sam3_optimization.md
│   ├── phase4_dashboard.md
│   └── phase5_testing_deployment.md
├── models/                 # ML models (create this)
├── uploads/                # Uploaded videos (created at runtime)
├── results/                # Processed results (created at runtime)
├── docker-compose.yml      # Docker orchestration
├── ANALYSIS.md             # Full program analysis
└── README.md               # This file
```

## Quick Start

### Option 1: Run Streamlit Prototype (Simplest)

```bash
# Install dependencies
pip install -r Pedi-Growth/requirements.txt

# Run the app
cd Pedi-Growth
streamlit run app.py
```

Open http://localhost:8501

### Option 2: Run Production Stack (Docker)

```bash
# Build and start all services
docker-compose up --build

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Option 3: Run Services Individually

**Backend API:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Worker (for video processing):**
```bash
cd worker
pip install -r requirements.txt
python processor.py <video_path>
```

## Model Setup

The app requires the MediaPipe Pose Landmarker model file:

1. Download `pose_landmarker_heavy.task` from [MediaPipe Models](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models)
2. Place it in one of these locations:
   - `models/pose_landmarker_heavy.task`
   - `Pedi-Growth/pose_landmarker_heavy.task`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/v1/upload` | Upload video file |
| POST | `/api/v1/jobs` | Create analysis job |
| GET | `/api/v1/jobs/{id}` | Get job status/results |
| GET | `/api/v1/jobs` | List all jobs |
| DELETE | `/api/v1/jobs/{id}` | Delete a job |

## Key Metrics

- **Symmetry Index (SI)**: `SI = max(left_flexion) / max(right_flexion)`
  - Normal: 0.85 ≤ SI ≤ 1.15
  - High Risk: SI < 0.85 or SI > 1.15
- **Asymmetry %**: `|1 - SI| × 100`
- **Detection Rate**: Percentage of frames with successful pose detection
- **Range of Motion (ROM)**: max_angle - min_angle per leg

## Development

### Run Tests
```bash
cd Pedi-Growth
python -m pytest test_math.py -v
```

### Lint Code
```bash
pip install flake8
flake8 backend/ worker/ shared/
```

## Video Requirements

- **Format**: MP4, MOV, AVI
- **Duration**: 5-15 seconds of walking
- **Subject**: Full body visible (head to feet)
- **Background**: Clean, solid color preferred
- **View**: Frontal or sagittal plane

## Clinical Disclaimer

This tool is for **screening and triage purposes only**. Results should be reviewed by a qualified healthcare professional. It does not replace professional medical diagnosis.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Worker    │
│  (Next.js)  │     │  (FastAPI)  │     │ (MediaPipe) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    │   Uploads   │     │   Results   │
                    │   Storage   │     │   Storage   │
                    └─────────────┘     └─────────────┘
```

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for pose detection
- [Streamlit](https://streamlit.io/) for rapid prototyping
- [FastAPI](https://fastapi.tiangolo.com/) for backend API
- [Next.js](https://nextjs.org/) for frontend framework
