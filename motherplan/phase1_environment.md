# Phase 1: Environment Setup

## Objective
Set up the local development environment, install all dependencies, and download the correct AI model for the target hardware.

## 1.1 Hardware Requirements

### Minimum Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | Dual-core x86_64, SSE4.1 support | Quad-core (i5 or better) |
| RAM | 8 GB | 16 GB |
| Storage | 500 MB free | 2 GB free |
| GPU | Not required (MediaPipe uses CPU) | Any (unused by MediaPipe) |
| OS | Windows 10 / Ubuntu 20.04 / macOS 12 | Latest stable |
| Python | 3.9 | 3.11 |

### Current Target System
- **CPU**: Intel Core i3 7th Generation (Kaby Lake)
- **GPU**: NVIDIA GT 1030 (not used by MediaPipe -- runs entirely on CPU via TFLite XNNPACK)
- **RAM**: 16 GB DDR4
- **OS**: Windows 10

### Important Note on GPU
MediaPipe Pose Landmarker does **NOT** use the GPU. It runs inference on CPU using TFLite with XNNPACK delegate. The GT 1030 will not accelerate processing. Model choice (lite/full/heavy) directly determines FPS on your CPU.

---

## 1.2 Create Virtual Environment

### Windows (PowerShell / CMD)
```bash
cd h:\Hisl_hackathon_project
python -m venv .venv
.venv\Scripts\activate
```

### Linux / macOS
```bash
cd ~/Hisl_hackathon_project
python3 -m venv .venv
source .venv/bin/activate
```

---

## 1.3 Install Dependencies

### Windows
```bash
pip install -r Pedi-Growth/requirements.txt
```

### Linux / macOS
```bash
pip3 install -r Pedi-Growth/requirements.txt
```

### Linux Additional System Dependencies
On Ubuntu/Debian, OpenCV requires these system packages:
```bash
sudo apt-get update
sudo apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    python3-pip \
    python3-venv
```

On Fedora/RHEL:
```bash
sudo dnf install -y \
    mesa-libGL \
    glib2 \
    python3-pip \
    python3-devel
```

### Pinned `requirements.txt`
```
streamlit>=1.30.0
mediapipe>=0.10.9
opencv-python>=4.8.0
numpy>=1.24.0
matplotlib>=3.7.0
scipy>=1.11.0
```

The `scipy` package provides smoothing filters for reducing jitter in angle data.

---

## 1.4 Download the Correct AI Model

### Model Comparison

| Model | File | Size | FPS on i3-7th | FPS on i5-10th | Accuracy | Recommendation |
|-------|------|------|---------------|----------------|----------|----------------|
| Lite | `pose_landmarker_lite.task` | ~6 MB | 15-20 | 25-35 | Good | **Use this for i3** |
| Full | `pose_landmarker_full.task` | ~12 MB | 8-12 | 15-25 | Better | Backup option |
| Heavy | `pose_landmarker_heavy.task` | ~25 MB | 3-5 | 10-15 | Best | Only for fast CPUs |

**For your i3 7th gen: Use `pose_landmarker_lite.task`**

### Download: Windows (CMD)
```cmd
curl -L -o Pedi-Growth\pose_landmarker_lite.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task
```

### Download: Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task" -OutFile "Pedi-Growth\pose_landmarker_lite.task"
```

### Download: Linux / macOS
```bash
curl -L -o Pedi-Growth/pose_landmarker_lite.task \
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
```

Or using `wget`:
```bash
wget -O Pedi-Growth/pose_landmarker_lite.task \
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
```

### Download Other Models (Optional)

**Full model** (if you want higher accuracy and have a faster CPU):
```bash
# Linux / macOS
curl -L -o Pedi-Growth/pose_landmarker_full.task \
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"

# Windows CMD
curl -L -o Pedi-Growth\pose_landmarker_full.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task
```

**Heavy model** (only for high-end CPUs like i7/i9/Ryzen 7):
```bash
# Linux / macOS
curl -L -o Pedi-Growth/pose_landmarker_heavy.task \
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"

# Windows CMD
curl -L -o Pedi-Growth\pose_landmarker_heavy.task https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
```

### Manual Download
If `curl`/`wget` are not available, download directly from:
https://developers.google.com/mediapipe/solutions/vision/pose_landmarker#models

Place the downloaded `.task` file into: `Pedi-Growth/`

### Verify Model File
```bash
# Check file exists and size is correct (~5.7 MB for lite)
# Windows
dir Pedi-Growth\pose_landmarker_lite.task

# Linux / macOS
ls -lh Pedi-Growth/pose_landmarker_lite.task
```

Expected size: approximately 5,777,746 bytes (~5.7 MB) for the lite model.

---

## 1.5 Verify Setup

### Windows
```bash
cd Pedi-Growth
python -c "from processor import GaitScanner; s = GaitScanner(); print('GaitScanner initialized OK')"
```

### Linux / macOS
```bash
cd Pedi-Growth
python3 -c "from processor import GaitScanner; s = GaitScanner(); print('GaitScanner initialized OK')"
```

Expected output:
```
INFO: Created TensorFlow Lite XNNPACK delegate for CPU.
GaitScanner initialized OK
```

The `W0000` warning lines about "inference_feedback_manager" are harmless and can be ignored.

---

## 1.6 Run the App

### Windows
```bash
cd Pedi-Growth
python -m streamlit run app.py
```

### Linux / macOS
```bash
cd Pedi-Growth
python3 -m streamlit run app.py
```

Open http://localhost:8501 in your browser.

---

## Deliverables
- [ ] Hardware meets minimum requirements
- [ ] Virtual environment created and activated
- [ ] All dependencies installed (including scipy)
- [ ] System packages installed (Linux only)
- [ ] `pose_landmarker_lite.task` downloaded to `Pedi-Growth/` (~5.7 MB)
- [ ] GaitScanner initializes without errors
- [ ] App starts and welcome screen loads
