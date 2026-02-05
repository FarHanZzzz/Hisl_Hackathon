# Worker Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY worker/requirements.txt ./worker/
COPY shared/ ./shared/

# Install Python dependencies
RUN pip install --no-cache-dir -r worker/requirements.txt

# Copy application code
COPY worker/ ./worker/

# Create directories
RUN mkdir -p uploads results models

# Run the worker (in production, use Celery)
CMD ["python", "-m", "worker.processor"]
