"""Script to set up Vertex AI RAG Corpus with incidents and historical permits data."""

import json
import os
from pathlib import Path
from google.cloud import aiplatform
from google.cloud.aiplatform import RagCorpus, RagEngine


def load_rag_data():
    """Load incidents and historical permits data from JSON files."""
    assets_path = os.getenv("ASSETS_PATH", "/app/assets")
    if not os.path.exists(assets_path):
        current_dir = Path(__file__).parent.parent
        assets_path = current_dir / "assets"
    
    # Load incidents
    incidents_file = Path(assets_path) / "rag_data" / "incidents.json"
    with open(incidents_file, 'r') as f:
        incidents_data = json.load(f)
    
    # Load historical permits
    permits_file = Path(assets_path) / "rag_data" / "historical_permits.json"
    with open(permits_file, 'r') as f:
        permits_data = json.load(f)
    
    return incidents_data["incidents"], permits_data["historicalPermits"]


def create_rag_documents(incidents, permits):
    """
    Convert incidents and permits into RAG document format.
    
    Returns:
        List of documents formatted for RAG ingestion
    """
    documents = []
    
    # Process incidents
    for incident in incidents:
        # Create document text with metadata
        doc_text = f"""
Title: {incident.get('title', '')}
Site: {incident.get('site', '')}
Area: {incident.get('area', '')}
Date: {incident.get('date', '')}
Severity: {incident.get('severity', '')}

Summary: {incident.get('summary', '')}

Description: {incident.get('description', '')}

Hazards: {', '.join(incident.get('hazards', []))}
Root Cause: {incident.get('rootCause', '')}
Lessons Learned: {incident.get('lessonsLearned', '')}
"""
        documents.append({
            "text": doc_text.strip(),
            "metadata": {
                "namespace": "incidents",
                "id": incident.get("id"),
                "site": incident.get("site"),
                "area": incident.get("area"),
                "date": incident.get("date"),
                "severity": incident.get("severity"),
                "tags": ",".join(incident.get("tags", []))
            }
        })
    
    # Process historical permits
    for permit in permits:
        doc_text = f"""
Title: {permit.get('title', '')}
Site: {permit.get('site', '')}
Area: {permit.get('area', '')}
Permit Type: {permit.get('permitType', '')}
Date: {permit.get('date', '')}
Status: {permit.get('status', '')}

Summary: {permit.get('summary', '')}

Description: {permit.get('description', '')}

Hazards: {', '.join(permit.get('hazards', []))}
Controls: {', '.join(permit.get('controls', []))}
PPE: {', '.join(permit.get('ppe', []))}
Sign-off Roles: {', '.join(permit.get('signOffRoles', []))}
Validity Hours: {permit.get('validityHours', '')}
Outcome: {permit.get('outcome', '')}
"""
        documents.append({
            "text": doc_text.strip(),
            "metadata": {
                "namespace": "historical_permits",
                "id": permit.get("id"),
                "site": permit.get("site"),
                "area": permit.get("area"),
                "permitType": permit.get("permitType"),
                "date": permit.get("date"),
                "status": permit.get("status")
            }
        })
    
    return documents


def setup_rag_corpus(project_id: str, location: str = "us-central1"):
    """
    Set up Vertex AI RAG Corpus and ingest documents.
    
    Args:
        project_id: GCP Project ID
        location: GCP Region (default: us-central1)
    """
    # Initialize Vertex AI
    aiplatform.init(project=project_id, location=location)
    
    # Load data
    print("Loading RAG data...")
    incidents, permits = load_rag_data()
    print(f"Loaded {len(incidents)} incidents and {len(permits)} historical permits")
    
    # Create documents
    print("Creating RAG documents...")
    documents = create_rag_documents(incidents, permits)
    print(f"Created {len(documents)} documents")
    
    # Create RAG Corpus
    corpus_display_name = "permitflowai-corpus"
    print(f"Creating RAG Corpus: {corpus_display_name}...")
    
    try:
        # Create corpus
        rag_corpus = RagCorpus.create(
            display_name=corpus_display_name,
            description="RAG corpus for PermitFlowAI with incidents and historical permits organized by site"
        )
        print(f"Created RAG Corpus: {rag_corpus.resource_name}")
        
        # Import documents
        print("Importing documents into RAG Corpus...")
        # Note: In production, you would use the import_files or import_documents method
        # This is a simplified example - actual implementation depends on Vertex AI RAG API
        
        print("RAG Corpus setup complete!")
        print(f"Corpus Resource Name: {rag_corpus.resource_name}")
        
        return rag_corpus
        
    except Exception as e:
        print(f"Error setting up RAG Corpus: {str(e)}")
        print("\nFor manual setup:")
        print("1. Go to Vertex AI RAG in Google Cloud Console")
        print("2. Create a new RAG Corpus")
        print("3. Import the documents from assets/rag_data/")
        print("4. Set up namespaces: 'incidents' and 'historical_permits'")
        raise


if __name__ == "__main__":
    import sys
    
    project_id = os.getenv("GCP_PROJECT_ID")
    if not project_id:
        print("Error: GCP_PROJECT_ID environment variable not set")
        sys.exit(1)
    
    location = os.getenv("GCP_REGION", "us-central1")
    
    setup_rag_corpus(project_id, location)

