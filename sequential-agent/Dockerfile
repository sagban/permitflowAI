FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ASSETS_PATH=/app/assets

# Expose port (Cloud Run sets PORT env var)
EXPOSE 8080

# ADK will handle the entry point when deployed via 'adk deploy cloud_run'
# No CMD needed - ADK manages the serving layer

