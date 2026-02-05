# Phase 3: Video Recording Tutorial

## Objective
Provide a clear, step-by-step guide for recording gait videos that produce reliable AI results. This tutorial is embedded directly in the app UI so users always have access to it.

## Why Video Quality Matters
MediaPipe pose detection requires clear visibility of all body landmarks. Poor video quality leads to:
- Failed pose detection (0 angles returned)
- Inaccurate angle calculations
- False positives/negatives in diagnosis

## Video Recording Guide

### Camera Setup
- **Device**: Any smartphone camera (720p minimum, 1080p preferred)
- **Orientation**: LANDSCAPE mode (horizontal, NOT portrait)
- **Position**: Tripod or steady surface at waist height (~80-100cm)
- **Distance**: 2-3 meters from the walking path
- **Angle**: Side view (sagittal plane) -- camera sees the child walking left-to-right

### Environment
- **Background**: Plain solid wall (white or light color)
- **Lighting**: Well-lit room, no strong backlighting or shadows
- **Floor**: Clear walking path, no obstacles (3-4 meters long)
- **People**: ONLY the child in frame, no other people visible

### Recording Instructions
1. Place camera on tripod at waist height, 2-3m from walking path
2. Start recording BEFORE the child begins walking
3. Child walks naturally across the frame (left to right or right to left)
4. Ensure full body is visible at all times: head, arms, legs, feet
5. Record at least 4-6 full walking steps (8-15 seconds)
6. Stop recording AFTER the child has left the frame

### What to Avoid
- Portrait (vertical) orientation
- Camera movement or shaking
- Partial body visibility (legs cut off)
- Multiple people in frame
- Dark or backlit environments
- Loose/baggy clothing that hides leg movement
- Running or non-natural movement

### Ideal Video Specifications
| Property | Requirement |
|----------|------------|
| Format | MP4, MOV, or AVI |
| Resolution | 720p or higher |
| Duration | 8-15 seconds |
| Orientation | Landscape (horizontal) |
| Frame rate | 24-30 FPS |
| File size | Under 50MB |
| View angle | Side view (sagittal) |

### Example: Good vs Bad Videos

**GOOD video checklist:**
- Full body visible from head to feet
- Side view (sagittal plane)
- Clean, well-lit background
- Steady camera (tripod)
- Child walks naturally, 4-6 steps
- Only one person in frame

**BAD video signs:**
- Feet or head cut off
- Front-facing camera (less accurate for knee angles)
- Dark room or strong shadows
- Shaky handheld footage
- Multiple people visible
- Child running or jumping

## Integration in App
This guide is displayed as:
1. An expandable section on the welcome screen (before video upload)
2. A help tooltip next to the video upload button
3. A warning if the detection rate drops below 60% after processing

## Deliverables
- [ ] Tutorial content written
- [ ] Embedded in app.py welcome screen as expandable section
- [ ] Low detection rate warning added to post-analysis
