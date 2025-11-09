"""Environment configuration for PermitFlowAI sequential agent."""

import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# GCP Configuration
GCP_PROJECT_ID: Optional[str] = os.getenv("GCP_PROJECT_ID")
GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")

# Vector Store Configuration
VECTOR_STORE_DSN: Optional[str] = os.getenv("VECTOR_STORE_DSN")
VECTOR_STORE_TYPE: str = os.getenv("VECTOR_STORE_TYPE", "chroma")  # chroma, pgvector, vertex

# GCS Configuration
GCS_BUCKET: Optional[str] = os.getenv("GCS_BUCKET", "permitflowai")
GCS_PDF_PREFIX: str = os.getenv("GCS_PDF_PREFIX", "permits")

# Policy Configuration
POLICY_VERSION: str = os.getenv("POLICY_VERSION", "v1.0")
ASSETS_PATH: str = os.getenv("ASSETS_PATH", "/app/assets")

# RAG Configuration
RAG_SNAPSHOT: Optional[str] = os.getenv("RAG_SNAPSHOT")  # Set by RAG job
RAG_CORPUS: Optional[str] = os.getenv("RAG_CORPUS")  # Vertex AI RAG Corpus resource name (projects/{project}/locations/{location}/ragCorpora/{corpus})

# Gemini API
GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Database Configuration (optional for now)
DB_URL: Optional[str] = os.getenv("DB_URL")

# Weather API Configuration (Google Maps Platform Weather API)
WEATHER_API_KEY: Optional[str] = os.getenv("WEATHER_API_KEY") or os.getenv("GOOGLE_MAPS_API_KEY")

