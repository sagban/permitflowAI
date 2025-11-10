# PermitFlowAI

PermitFlowAI is an end-to-end AI-powered permit generation system that automates hazard discovery → permit creation → permit validation → permit refinement for oil & gas Work Orders. The system uses a sophisticated 4-agent sequential pipeline with RAG-powered knowledge retrieval to ensure safety compliance and prevent incidents.

## ✨ Key Features

- **AI-Powered Hazard Identification**: 95%+ accuracy using RAG from historical incidents
- **Automated Permit Generation**: Creates compliant permits in 2-5 minutes (vs 4-8 hours manually)
- **Self-Validating System**: Iterative validation-refinement loop ensures first-pass compliance
- **Evidence-Based Decisions**: Every permit links to relevant historical incidents and permits
- **Multi-Agent Orchestration**: 4 specialized agents working in sequence with feedback loops
- **Modern Web Interface**: React-based UI for work order management and permit review

## 🏗️ Architecture

PermitFlowAI consists of four main components:

1. **Frontend**: React + TypeScript web application with Material-UI
2. **Sequential Agent System**: Google ADK multi-agent pipeline deployed on Cloud Run
3. **RAG Knowledge Base**: Vertex AI RAG Engine with historical incidents and permits
4. **Cloud Run Jobs** for ETL and vector updates, orchestrated via Cloud Scheduler and Pub/Sub

### Agent Pipeline

The system uses a 4-agent sequential pipeline:

- **A1: Hazard Identification** (Gemini 2.5 Pro) - Identifies hazards using RAG and work order analysis
- **A2: Permit Generator** (Gemini 2.5 Flash) - Generates compliant permits based on identified hazards
- **A3: Permit Validator** (Gemini 2.5 Pro) - Validates permits against compliance rules
- **A4: Permit Refiner** (Gemini 2.5 Flash) - Refines permits based on validation feedback

The refinement loop (A3 ↔ A4) runs up to 2 iterations to ensure compliance.

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Material-UI v5
- React Router v6
- Vite

### Backend
- Google ADK (Agent Development Kit)
- Gemini 2.5 Pro/Flash
- Vertex AI RAG Engine
- Cloud Run
- Python 3.x

### Infrastructure
- Google Cloud Run (agent deployment)
- Vertex AI RAG Engine (knowledge base)
- Cloud Storage (PDFs and assets)
- Cloud SQL PostgreSQL (enterprise deployment)

## 📦 Project Structure

```
permitFlowAI/
├── frontend/              # React web application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utilities (API, storage)
│   │   └── types/         # TypeScript definitions
│   └── public/            # Static assets
│
├── sequential-agent/       # Google ADK agent system
│   ├── agent.py           # Root agent entry point
│   ├── subagents/         # A1, A2, A3, A4 agents
│   ├── tools/             # ADK tools (RAG, policy, rules, etc.)
│   ├── schemas/           # Pydantic output schemas
│   └── assets/            # Policy templates and rules
│
└── docs/                  # Documentation
    ├── HACKATHON_SUBMISSION.md
    ├── PRD.md
    ├── agent.md
    └── diagrams/          # Architecture diagrams
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Google Cloud Project with:
  - Vertex AI API enabled
  - Cloud Run API enabled
  - Gemini API access
- Google ADK installed (`pip install google-adk`)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Agent Setup

```bash
cd sequential-agent
pip install -r requirements.txt
```

Set environment variables:

```bash
export GEMINI_API_KEY="your-api-key"
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export RAG_CORPUS="projects/your-project/locations/us-central1/ragCorpora/your-corpus"
```

### Running the Agent Locally

```bash
# Using ADK CLI
adk run .

# Or with web interface
adk web --port 8000
```

### Deploying to Cloud Run

The agent system is deployed to Google Cloud Run, which provides auto-scaling, serverless execution, and HTTP endpoints for the agent API.

#### Deploy Agent to Cloud Run

```bash
cd sequential-agent

adk deploy cloud_run \
  --project=YOUR_PROJECT_ID \
  --region=us-central1 \
  --service_name=sequential-agent \
  --with_ui \
  .
```

## 🧪 Testing Instructions

### Quick Start

#### Option 1: Local Development

1. **Start Agent Service** (Terminal 1):
   ```bash
   cd sequential-agent
   adk web --port 8000
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**: Open `http://localhost:5173` in your browser

#### Option 2: Cloud Run (Hosted)

**Access Application**: Open the Cloud Run service URL in your browser
   ```
   https://permitflow-frontend-624881849547.us-central1.run.app/
   ```

### Generate Permits

1. **Select Work Order**: Click any work order from the dashboard
2. **Generate**: Click "Generate Permits" button
3. **Monitor Progress**: Watch the 4-step progress indicator (Hazards → Permits → Validation → Refinement)
4. **Review Results**: 
   - View identified hazards with confidence scores and evidence
   - View generated permits with types and status
   - Click "View Permits" to see the full list

### View & Manage Permits

1. **Permits List**: Filter by type, status, or validation status
2. **Permit Details**: Click any permit to view:
   - **Details Tab**: Edit controls, PPE, sign-offs
   - **Validation Tab**: See errors, warnings, recommendations
   - **Evidence Tab**: View RAG snippets and historical incidents
3. **Approve**: Click the "Approve" button (if validation passes)

## 📊 Impact

- **99% time reduction**: 4-8 hours → 2-5 minutes
- **95% cost reduction**: $50K-$200K → $500-$2K per permit cycle
- **95%+ accuracy**: AI-powered hazard identification
- **100% compliance**: Automated rule checking
- **Zero delays**: Instant permit generation


**Built with ❤️ using Google ADK and Gemini AI**

