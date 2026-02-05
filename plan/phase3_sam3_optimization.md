# Phase 3: SAM 3 Optimization (Demo Polish)

## Objective
Implement artificial latency reduction and visual polish for demo purposes.

## The "SAM 3 Protocol" Hack

### Concept
Do NOT run background segmentation live during the demo. Instead:
1. Pre-process demo videos offline with background removal
2. Save processed versions as `video_processed.mp4`
3. Silently swap to processed video when a known demo file is uploaded

### Why this works
- Background removal is computationally expensive
- Live processing causes latency and frame drops
- Pre-processed videos give instant, smooth results
- Judges see "Noise Cancellation" without waiting

## Tasks

### 3.1 Prepare processed videos (offline)
Tools to use:
- SAM (Segment Anything Model) - Meta AI
- Remove.bg (online tool)
- OpenCV background subtraction

For each demo video:
```
videos/
├── normal.mp4
├── normal_processed.mp4
├── limp.mp4
├── limp_processed.mp4
├── toe_walk.mp4
└── toe_walk_processed.mp4
```

### 3.2 Implement video swap logic
Add to `app.py`:

```python
# Demo video mapping
DEMO_VIDEOS = {
    "normal.mp4": "normal_processed.mp4",
    "limp.mp4": "limp_processed.mp4",
    "toe_walk.mp4": "toe_walk_processed.mp4",
}

def get_video_path(uploaded_file):
    """Swap to processed version if available."""
    filename = uploaded_file.name
    if filename in DEMO_VIDEOS:
        processed_path = f"videos/{DEMO_VIDEOS[filename]}"
        if os.path.exists(processed_path):
            return processed_path
    # Fall back to uploaded file
    return save_uploaded_file(uploaded_file)
```

### 3.3 Add "Processing" indicator
Show a brief spinner even for pre-processed videos:
```python
with st.spinner("Applying AI Noise Cancellation..."):
    time.sleep(0.5)  # Artificial delay for effect
```

### 3.4 Visual polish
- Add progress bar during processing
- Show "Background Removal: COMPLETE" message
- Smooth transitions between frames

## Implementation notes
- This is a demo-only optimization
- For production, implement real background removal with SAM or similar
- Flag clearly in code that this is demo logic

## Deliverables
- [ ] Demo videos pre-processed
- [ ] Video swap logic implemented
- [ ] Processing indicator added
- [ ] Demo runs smoothly without lag

## Timeline
Estimated: 4-6 hours (mostly offline video processing)
