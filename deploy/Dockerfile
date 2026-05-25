# Use Google corporate base Python image
FROM gcr.io/google-appengine/python:latest

# Set active working directory
WORKDIR /app

# Copy dependency requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and modules
COPY src/ ./src/

# Set environment variables for GPC Spanner
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/credentials.json
ENV CLOUD_SPANNER_INSTANCE=gpeg-spanner-instance
ENV CLOUD_SPANNER_DATABASE=gpeg-camps-db

# Trigger execution on run
CMD ["python", "src/gpeg_ingestion_engine.py"]
