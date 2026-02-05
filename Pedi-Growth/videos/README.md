# Demo Videos Directory

This folder should contain demo videos for the Pedi-Growth application.

## Required Files for SAM 3 Protocol

To enable the "SAM 3 Protocol" demo optimization, place the following files here:

### Raw Videos (for upload simulation)
- `normal.mp4` - Normal gait video
- `limp.mp4` - Hemiplegic/limping gait video
- `toe_walk.mp4` - Toe-walking gait video

### Pre-processed Videos (background removed)
- `normal_processed.mp4` - Normal gait with background removed
- `limp_processed.mp4` - Limping gait with background removed
- `toe_walk_processed.mp4` - Toe-walking with background removed

## How SAM 3 Protocol Works

1. Record demo videos with a clean background
2. Process each video offline using background removal tools:
   - SAM (Segment Anything Model) - Meta AI
   - Remove.bg (online tool)
   - OpenCV background subtraction
3. Save processed versions with `_processed` suffix
4. When the app detects a known demo video, it silently swaps to the processed version

## Video Requirements

- **Format**: MP4, MOV, or AVI
- **Resolution**: 720p or higher recommended
- **Duration**: 5-15 seconds of walking
- **Subject**: Full body visible (head to feet)
- **Background**: Solid color or clean wall
- **View**: Frontal or sagittal plane

## Creating Processed Videos

### Option 1: SAM (Segment Anything Model)
```python
# Use Meta's SAM model for automatic segmentation
# See: https://github.com/facebookresearch/segment-anything
```

### Option 2: Online Tools
- Remove.bg (https://www.remove.bg/) - works with video
- Unscreen.com (https://www.unscreen.com/)

### Option 3: OpenCV
```python
import cv2

# Use background subtraction
bg_subtractor = cv2.createBackgroundSubtractorMOG2()
# Apply to each frame
mask = bg_subtractor.apply(frame)
```

## Note

The SAM 3 Protocol is a **demo optimization only**. For production use, implement
real-time background segmentation with proper model inference.
