# Phase 5: Testing & Deployment

> **LLM Execution Notes**: This phase adds tests and deployment configuration.
> Tests should work with or without a running Supabase connection (mocked for unit tests).
> Docker has been removed from scope — local dev uses uvicorn + npm run dev directly.
> All paths relative to `d:\Hisl_hackathon_project\`.

---

## Prerequisites (from Phases 1–4)
- [ ] All previous phases complete and functional
- [ ] Backend runs: `uvicorn backend.app.main:app --port 8000` → healthy
- [ ] Frontend runs: `cd frontend && npm run dev` → loads at :3000
- [ ] At least one successful end-to-end analysis has been run (to validate flow)

---

## Tasks

### 5.1 Create Test Directory Structure

```bash
mkdir -p tests
```

Files to create:
```
tests/
├── __init__.py
├── conftest.py            # Shared fixtures
├── test_analysis.py       # Unit tests for backend/app/engine/analysis.py
├── test_smoothing.py      # Unit tests for backend/app/engine/smoothing.py
├── test_video.py          # Unit tests for backend/app/engine/video.py
├── test_api.py            # API endpoint tests (mocked DB)
└── test_integration.py    # Full workflow test (requires running server)
```

### 5.2 Create `tests/conftest.py` — Shared Fixtures

**File**: `d:\Hisl_hackathon_project\tests\conftest.py`
```python
"""
Shared test fixtures for the Pedi-Growth test suite.

Usage:
    pytest tests/ -v                    # Run all tests
    pytest tests/test_analysis.py -v    # Run specific module
    pytest tests/ -k "not integration"  # Skip integration tests
"""
import pytest
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure project root is on sys.path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture
def sample_angles_left():
    """Realistic left knee angle data with some zeros (missed detections)."""
    return [0, 145.2, 148.3, 150.1, 0, 147.8, 146.5, 149.2, 151.0, 148.7,
            147.3, 0, 150.5, 152.1, 149.8, 148.2, 146.9, 150.3, 151.7, 149.1]


@pytest.fixture
def sample_angles_right():
    """Realistic right knee angle data — slightly different from left."""
    return [144.1, 146.8, 0, 148.5, 147.2, 145.9, 148.1, 149.3, 0, 147.6,
            146.2, 148.9, 150.1, 147.8, 146.5, 149.2, 150.8, 148.4, 147.1, 149.5]


@pytest.fixture
def clean_angles():
    """Clean angle series with no zeros or outliers."""
    return [145.0, 146.0, 148.0, 150.0, 149.0, 147.0, 146.0, 148.0, 150.0, 149.0]


@pytest.fixture
def test_video_path():
    """
    Path to a test video file.
    Create a tiny valid MP4 for testing (or skip if not available).
    """
    path = PROJECT_ROOT / "tests" / "fixtures" / "test_walk.mp4"
    if not path.exists():
        pytest.skip("Test video not found. Place a short video at tests/fixtures/test_walk.mp4")
    return str(path)


@pytest.fixture
def mock_supabase():
    """
    Mock Supabase client for unit tests.
    Patches get_supabase() to return a MagicMock.
    """
    with patch("backend.app.dependencies.get_supabase") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client
```

### 5.3 Create `tests/test_analysis.py` — Core Metrics Tests

**File**: `d:\Hisl_hackathon_project\tests\test_analysis.py`
```python
"""
Unit tests for backend/app/engine/analysis.py — gait metric calculations.

Run: pytest tests/test_analysis.py -v
"""
import pytest
from backend.app.engine.analysis import (
    calculate_rom,
    calculate_symmetry_index,
    calculate_asymmetry,
    calculate_confidence,
    get_diagnosis,
)
from backend.app.schemas import DiagnosisResult


class TestRangeOfMotion:
    def test_basic_rom(self):
        """ROM = max - min of angle series."""
        angles = [120.0, 140.0, 130.0, 150.0, 125.0]
        assert calculate_rom(angles) == 30.0  # 150 - 120

    def test_empty_returns_zero(self):
        assert calculate_rom([]) == 0.0

    def test_single_value(self):
        assert calculate_rom([130.0]) == 0.0

    def test_ignores_zeros(self):
        angles = [0, 120.0, 140.0, 0, 130.0]
        assert calculate_rom(angles) == 20.0  # 140 - 120


class TestSymmetryIndex:
    def test_perfect_symmetry(self):
        """SI = 1.0 when both ROMs are equal."""
        assert calculate_symmetry_index(10.0, 10.0) == 1.0

    def test_left_dominant(self):
        """SI > 1.0 when left ROM > right ROM."""
        si = calculate_symmetry_index(20.0, 10.0)
        assert si == 2.0
        assert si > 1.0  # Key: NEW formula preserves directionality

    def test_right_dominant(self):
        """SI < 1.0 when right ROM > left ROM."""
        si = calculate_symmetry_index(10.0, 20.0)
        assert si == 0.5
        assert si < 1.0

    def test_zero_right_returns_zero(self):
        """Avoids division by zero."""
        assert calculate_symmetry_index(10.0, 0.0) == 0.0

    def test_zero_left(self):
        """SI = 0 when left ROM is 0."""
        assert calculate_symmetry_index(0.0, 10.0) == 0.0


class TestAsymmetry:
    def test_perfect_symmetry(self):
        assert calculate_asymmetry(1.0) == 0.0

    def test_fifteen_percent(self):
        assert calculate_asymmetry(1.15) == 15.0

    def test_left_deviation(self):
        """SI > 1 → positive asymmetry."""
        assert calculate_asymmetry(1.20) == 20.0

    def test_right_deviation(self):
        """SI < 1 → positive asymmetry (absolute value)."""
        assert calculate_asymmetry(0.80) == 20.0


class TestConfidence:
    def test_high_quality_normal(self):
        """Good detection + low asymmetry → moderate-high confidence."""
        conf = calculate_confidence(95.0, 1.0)
        assert 0.6 <= conf <= 0.8

    def test_high_quality_abnormal(self):
        """Good detection + high asymmetry → very high confidence."""
        conf = calculate_confidence(95.0, 0.70)  # 30% asymmetry
        assert conf > 0.8

    def test_low_detection(self):
        """Poor detection → lower confidence regardless of SI."""
        conf = calculate_confidence(30.0, 1.0)
        assert conf < 0.4

    def test_bounds(self):
        """Confidence always between 0 and 1."""
        for dr in [0, 50, 100]:
            for si in [0.5, 1.0, 1.5]:
                conf = calculate_confidence(dr, si)
                assert 0.0 <= conf <= 1.0


class TestDiagnosis:
    def test_normal(self):
        """SI in [0.85, 1.15] with good detection → NORMAL."""
        diag = get_diagnosis(1.0, 90.0)
        assert diag.result == DiagnosisResult.NORMAL
        assert not diag.is_high_risk

    def test_high_risk_left(self):
        """SI > 1.15 → HIGH_RISK."""
        diag = get_diagnosis(1.30, 90.0)
        assert diag.result == DiagnosisResult.HIGH_RISK
        assert diag.is_high_risk
        assert "left-dominant" in diag.message

    def test_high_risk_right(self):
        """SI < 0.85 → HIGH_RISK."""
        diag = get_diagnosis(0.70, 90.0)
        assert diag.result == DiagnosisResult.HIGH_RISK
        assert diag.is_high_risk
        assert "right-dominant" in diag.message

    def test_insufficient_data(self):
        """Detection rate < 50% → INSUFFICIENT_DATA regardless of SI."""
        diag = get_diagnosis(1.0, 30.0)
        assert diag.result == DiagnosisResult.INSUFFICIENT_DATA
        assert not diag.is_high_risk

    def test_boundary_normal(self):
        """SI exactly at threshold boundary — should be NORMAL."""
        diag = get_diagnosis(0.85, 90.0)
        assert diag.result == DiagnosisResult.NORMAL

        diag = get_diagnosis(1.15, 90.0)
        assert diag.result == DiagnosisResult.NORMAL
```

### 5.4 Create `tests/test_smoothing.py`

**File**: `d:\Hisl_hackathon_project\tests\test_smoothing.py`
```python
"""
Unit tests for backend/app/engine/smoothing.py — signal processing.

Run: pytest tests/test_smoothing.py -v
"""
import pytest
from backend.app.engine.smoothing import (
    interpolate_zeros,
    remove_outliers_iqr,
    moving_average,
    savitzky_golay,
    smooth_angles,
)


class TestInterpolateZeros:
    def test_replaces_zeros(self):
        data = [0, 10.0, 0, 20.0, 0]
        result = interpolate_zeros(data)
        assert result[0] != 0  # First zero interpolated
        assert result[2] != 0  # Middle zero interpolated

    def test_no_zeros_unchanged(self):
        data = [10.0, 20.0, 30.0]
        assert interpolate_zeros(data) == data

    def test_all_zeros_unchanged(self):
        data = [0, 0, 0]
        assert interpolate_zeros(data) == data

    def test_empty_list(self):
        assert interpolate_zeros([]) == []


class TestRemoveOutliers:
    def test_removes_extreme_values(self):
        data = [10.0, 12.0, 11.0, 500.0, 10.5, 11.5]
        result = remove_outliers_iqr(data)
        assert max(result) < 500  # Extreme value removed

    def test_normal_data_unchanged(self):
        data = [10.0, 11.0, 10.5, 11.5, 10.8]
        result = remove_outliers_iqr(data)
        assert len(result) == len(data)

    def test_short_data(self):
        data = [10.0, 20.0]
        assert remove_outliers_iqr(data) == data


class TestMovingAverage:
    def test_smooths_data(self):
        data = [10.0, 20.0, 10.0, 20.0, 10.0, 20.0, 10.0, 20.0]
        result = moving_average(data, window=3)
        # Smoothed values should vary less than original
        assert max(result) - min(result) < max(data) - min(data)

    def test_preserves_length(self):
        data = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = moving_average(data, window=3)
        assert len(result) == len(data)

    def test_short_data_unchanged(self):
        data = [1.0, 2.0]
        assert moving_average(data, window=5) == data


class TestSmoothAngles:
    def test_full_pipeline(self, sample_angles_left):
        result = smooth_angles(sample_angles_left)
        assert len(result) > 0
        assert 0 not in result  # Zeros should be interpolated

    def test_empty_list(self):
        assert smooth_angles([]) == []

    def test_short_list(self):
        assert smooth_angles([1.0]) == [1.0]
```

### 5.5 Create `tests/test_api.py` — Endpoint Tests

**File**: `d:\Hisl_hackathon_project\tests\test_api.py`
```python
"""
API endpoint tests using FastAPI TestClient.
Database is mocked — these tests do NOT require Supabase connection.

Run: pytest tests/test_api.py -v
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def client(mock_supabase):
    """Create test client with mocked Supabase."""
    from backend.app.main import app
    return TestClient(app)


class TestHealthEndpoint:
    def test_returns_200(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_has_service_name(self, client):
        response = client.get("/health")
        assert response.json()["service"] == "pedi-growth-api"


class TestUploadEndpoint:
    def test_accepts_mp4(self, client):
        response = client.post(
            "/api/v1/upload",
            files={"file": ("test.mp4", b"fake video content", "video/mp4")}
        )
        assert response.status_code == 200
        assert "filename" in response.json()
        assert response.json()["filename"].endswith("test.mp4")

    def test_rejects_txt(self, client):
        response = client.post(
            "/api/v1/upload",
            files={"file": ("test.txt", b"not a video", "text/plain")}
        )
        assert response.status_code == 400
        assert "Invalid format" in response.json()["detail"]

    def test_rejects_exe(self, client):
        response = client.post(
            "/api/v1/upload",
            files={"file": ("malware.exe", b"bad content", "application/octet-stream")}
        )
        assert response.status_code == 400


class TestJobEndpoints:
    @patch("backend.app.routes.jobs.PatientService")
    @patch("backend.app.routes.jobs.JobService")
    def test_create_job(self, MockJobSvc, MockPatientSvc, client):
        MockPatientSvc.return_value.get_or_create.return_value = {
            "id": "patient-uuid-123"
        }
        MockJobSvc.return_value.create.return_value = {
            "id": "job-uuid-456",
            "status": "queued"
        }

        response = client.post("/api/v1/jobs", json={
            "patient": {"patient_id": "TEST001"},
            "video_filename": "test.mp4"
        })
        assert response.status_code == 200
        assert response.json()["job_id"] == "job-uuid-456"
        assert response.json()["status"] == "queued"

    @patch("backend.app.routes.jobs.JobService")
    def test_get_nonexistent_job(self, MockJobSvc, client):
        MockJobSvc.return_value.get.return_value = None
        response = client.get("/api/v1/jobs/nonexistent-id")
        assert response.status_code == 404
```

### 5.6 Create `tests/__init__.py`

**File**: `d:\Hisl_hackathon_project\tests\__init__.py`
```python
# Test package
```

### 5.7 Update `backend/requirements.txt` with Test Dependencies

Add to the END of `d:\Hisl_hackathon_project\backend\requirements.txt`:
```
# Testing (install with: pip install -r backend/requirements.txt)
pytest>=7.0.0
pytest-asyncio>=0.21.0
httpx>=0.24.0
```

Or create a separate `d:\Hisl_hackathon_project\requirements-dev.txt`:
```
-r backend/requirements.txt
pytest>=7.0.0
pytest-asyncio>=0.21.0
httpx>=0.24.0
```

### 5.8 Local Development (No Docker)

> **Note**: Docker has been intentionally removed from the MVP scope.
> Supabase handles the database (cloud), and local dev uses uvicorn + npm run dev directly.
> Docker may be reintroduced in a future production deployment phase.

**Backend**:
```bash
# From project root
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend**:
```bash
cd frontend && npm install && npm run dev
```

### 5.9 Vercel Deployment (Frontend)

**File**: `d:\Hisl_hackathon_project\frontend\vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Deployment steps** (manual):
1. Push `frontend/` to GitHub
2. Connect repo to Vercel at https://vercel.com/new
3. Set root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL` = your backend URL
5. Deploy

### 5.10 CI/CD Pipeline

**File**: `d:\Hisl_hackathon_project\.github\workflows\test.yml`
```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
          pip install pytest pytest-asyncio httpx

      - name: Run unit tests
        run: pytest tests/ -v -k "not integration"
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Type check
        working-directory: ./frontend
        run: npx tsc --noEmit

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000
```

---

## Verification Checklist

### Unit Tests
| Check | Command | Expected |
|-------|---------|----------|
| Analysis tests | `pytest tests/test_analysis.py -v` | All pass |
| Smoothing tests | `pytest tests/test_smoothing.py -v` | All pass |
| API tests | `pytest tests/test_api.py -v` | All pass |
| All unit tests | `pytest tests/ -v -k "not integration"` | All pass |

### Local Dev
| Check | Command | Expected |
|-------|---------|----------|
| Backend starts | `uvicorn backend.app.main:app --port 8000` | Server running |
| Health check | `curl http://localhost:8000/health` | `{"status":"healthy"}` |
| Frontend starts | `cd frontend && npm run dev` | Page loads at :3000 |

### Deployment
| Check | Action | Expected |
|-------|--------|----------|
| Vercel deploys | Push to GitHub, Vercel auto-builds | Frontend accessible |
| API connected | From deployed frontend, submit analysis | Backend responds |

---

## Outputs of This Phase
New files:
```
tests/__init__.py
tests/conftest.py
tests/test_analysis.py
tests/test_smoothing.py
tests/test_video.py            (optional, for video validation tests)
tests/test_api.py
frontend/vercel.json
.github/workflows/test.yml
```
Modified files:
```
backend/requirements.txt       (added test dependencies)
```
