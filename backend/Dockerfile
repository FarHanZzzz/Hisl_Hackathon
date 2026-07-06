# Use official lightweight Python image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV MEDIAPIPE_MODEL_PATH=/app/models/pose_landmarker_heavy.task

# Install system dependencies
# - ffmpeg: required for video encoding/processing
# - libgl1-mesa-glx & libglib2.0-0: required for OpenCV and MediaPipe
# - curl: to download the MediaPipe model
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgles2 \
    libegl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY . .

# Create directory for models and download the pose landmarker model
RUN mkdir -p /app/models && \
    curl -L -o /app/models/pose_landmarker_heavy.task \
    https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task

# Create uploads and results directories (Render Disk can be mounted here)
RUN mkdir -p /app/uploads /app/results

# Expose port
EXPOSE 8000

# Command to run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
