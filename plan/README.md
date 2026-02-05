# Pedi-Growth Implementation Plan

## Overview
This folder contains the phased implementation plan for Pedi-Growth, a pediatric gait analysis tool for early detection of Cerebral Palsy and developmental delays.

## Phases

| Phase | File | Objective | Estimated Time |
|-------|------|-----------|----------------|
| 1 | [phase1_setup.md](phase1_setup.md) | Environment setup and data acquisition | 2-4 hours |
| 2 | [phase2_engine.md](phase2_engine.md) | Core MVP with math logic | 4-6 hours |
| 3 | [phase3_sam3_optimization.md](phase3_sam3_optimization.md) | Demo optimization (SAM 3 hack) | 4-6 hours |
| 4 | [phase4_dashboard.md](phase4_dashboard.md) | UI polish and "Wow Factor" | 4-6 hours |
| 5 | [phase5_testing_deployment.md](phase5_testing_deployment.md) | Testing and deployment | 2-4 hours |

## Total estimated time: 16-26 hours

## Quick Start

### 1. Setup
```bash
cd cbh
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r Pedi-Growth/requirements.txt
```

### 2. Run
```bash
cd Pedi-Growth
streamlit run app.py
```

### 3. Access
Open http://localhost:8501 in your browser.

## Key Files

```
cbh/
├── plan/                    # This folder - implementation plan
│   ├── README.md
│   ├── phase1_setup.md
│   ├── phase2_engine.md
│   ├── phase3_sam3_optimization.md
│   ├── phase4_dashboard.md
│   └── phase5_testing_deployment.md
├── Pedi-Growth/             # Main application
│   ├── app.py               # Streamlit UI
│   ├── processor.py         # GaitScanner class
│   ├── utils.py             # Angle calculation
│   ├── requirements.txt     # Dependencies
│   ├── pose_landmarker_heavy.task  # MediaPipe model
│   └── videos/              # Demo videos (create this)
├── ANALYSIS.md              # Full program analysis
└── .venv/                   # Virtual environment (created by setup)
```

## Critical Success Factors

1. **Local-first**: No cloud dependencies
2. **Demo-ready**: Pre-processed videos for smooth presentation
3. **Simple UI**: Patient ID + video upload + diagnosis
4. **Clear metrics**: Symmetry Index with thresholds
5. **Visual impact**: Color-coded diagnosis banners

## Anti-Fail Rules

- No login screens (hardcode user)
- No live webcams (use pre-recorded videos)
- No cloud services (localhost only)
- One person owns main code (avoid merge conflicts)
- Have backup demo video ready
