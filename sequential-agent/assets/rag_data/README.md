# RAG Data for PermitFlowAI

This directory contains the data files for the Vertex AI RAG Engine corpus.

## Files

- **incidents.json**: Historical safety incidents organized by site and area
- **historical_permits.json**: Previously approved permits with their outcomes

## Data Structure

### Incidents
Each incident includes:
- Site and area location
- Severity and date
- Summary and detailed description
- Identified hazards
- Root cause analysis
- Lessons learned
- Tags for searchability

### Historical Permits
Each permit includes:
- Site and area location
- Permit type and status
- Associated work order ID
- Summary and description
- Hazards addressed
- Controls implemented
- PPE requirements
- Sign-off roles
- Outcome/result

## Namespaces

The RAG corpus uses two namespaces:
- **incidents**: For safety incident data
- **historical_permits**: For historical permit data

## Setup

To set up the RAG corpus in Vertex AI:

1. Ensure you have the Vertex AI RAG Engine API enabled
2. Run the setup script (or manually create corpus in Console):
   ```bash
   python scripts/setup_rag_corpus.py
   ```
3. The script will create the corpus and import documents
4. Configure namespaces in the Vertex AI RAG Engine console

## Manual Setup

If using the Google Cloud Console:

1. Go to Vertex AI > RAG in Google Cloud Console
2. Create a new RAG Corpus
3. Import documents from this directory
4. Configure namespaces: `incidents` and `historical_permits`
5. Set up the RAG Engine
6. Update `RAG_RESOURCE_NAME` environment variable with the resource path

