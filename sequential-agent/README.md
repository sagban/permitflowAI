# PermitFlowAI Sequential Agent

Google ADK-based sequential agent system for automated permit generation and validation.

## Architecture

The system consists of a root agent that orchestrates four sub-agents in a sequential pipeline with a refinement loop:
- **A1 (Hazard Identification)**: Identifies hazards using RAG knowledge base
- **A2 (Permit Generator)**: Generates required permits based on hazards
- **A3 (Permit Validator)**: Validates permits against compliance rules
- **A4 (Permit Refiner)**: Refines permits based on validation feedback

The root agent uses ADK's `SequentialAgent` and `LoopAgent` patterns:
- **A1 → A2** (sequential)
- **[A3 → A4]** (refinement loop, max 2 iterations)

Agents communicate via state management using `output_key` for structured outputs.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export GEMINI_API_KEY="your-api-key"
export WEATHER_API_KEY="your-google-maps-api-key"  # Optional: Google Maps Platform Weather API key
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"  # Region for Vertex AI RAG Engine
export RAG_CORPUS="projects/your-project/locations/us-central1/ragCorpora/your-corpus"  # Vertex AI RAG Corpus resource
export GCS_BUCKET="permitflowai"
export POLICY_VERSION="v1.0"
```

**Note:** The weather API key is optional. If not provided, the tool will use default values. Get a Google Maps Platform API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis). Enable the Weather API in your project.

## Local Development

Test the agent locally using ADK:
```bash
adk run .
```

Or use the ADK web interface:
```bash
adk web --port 8000
```

## Usage

The agent accepts input in the format:
```json
{
  "workOrderId": "WO-87231"
}
```

And returns:
```json
{
  "workOrderId": "WO-87231",
  "hazards": [...],
  "permits": [...],
  "validations": [...],
  "pdfLinks": [...],
  "runMeta": {
    "policyVersion": "v1.0",
    "ragSnapshot": "2025-11-03T10:00Z"
  }
}
```

## Deployment to Cloud Run

Deploy using ADK's built-in deployment command:

```bash
adk deploy cloud_run --project=gen-lang-client-0805018961 --region=us-central1 --allow_origins=https://permitflow-frontend-624881849547.us-central1.run.app ./sequential-agent
  .
```

This command will:
- Build the container image
- Deploy to Cloud Run
- Set up the HTTP endpoint automatically
- Provide a URL for accessing the agent

The agent will be accessible at the Cloud Run service URL. ADK handles all HTTP serving automatically.

## Project Structure

```
sequential-agent/
├── agent.py            # Root agent entry point (ADK expects this)
├── subagents/          # Sub-agent definitions
│   ├── a1_hazard_agent.py      # Hazard identification
│   ├── a2_permit_agent.py       # Permit generation
│   ├── a3_validator_agent.py    # Permit validation
│   └── a4_refiner_agent.py      # Permit refinement
├── tools/              # ADK tools
│   ├── workorders.py   # get_workorder_by_id
│   ├── rag.py          # search_rag (Vertex AI RAG)
│   ├── weather.py      # get_weather_data (Google Maps Weather API)
│   ├── policy.py       # load
│   ├── rules.py        # evaluate
│   ├── ids.py          # new_permit_id
│   └── pdf.py          # render
├── schemas/            # Pydantic output schemas
├── assets/             # Policy assets (rules, templates, workOrders.json)
├── config/             # Configuration (settings.py)
└── requirements.txt    # Python dependencies
```

## Notes

- The root agent (`agent.py`) exports the main agent for ADK deployment
- ADK automatically handles HTTP serving when deployed to Cloud Run
- No custom HTTP server is needed - ADK provides this functionality
- The workflow uses ADK's `SequentialAgent` for A1→A2 and `LoopAgent` for A3→A4 refinement
- Agents use `output_key` to store structured outputs in state for inter-agent communication
- State injection allows agents to access previous outputs (e.g., `{hazard_identification_output}`, `{permit_generator_output}`)
- The refinement loop runs up to 2 iterations or until A4 calls `exit_loop` when validation passes
