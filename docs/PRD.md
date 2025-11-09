# PermitFlowAI — Product Requirements Document (PRD)

## 1) Overview

PermitFlowAI automates **hazard discovery → permit creation → permit validation → permit refinement** for oil & gas Work Orders (WOs).
It consists of a **React + TypeScript** web app, a **Google ADK SequentialAgent** (4 sub-agents: A1→A2→[A3→A4 loop]), and two **Cloud Run Jobs** that refresh a RAG knowledge base from incidents and historical permits.

---

## 2) Scope (Hackathon)

* Ingest WOs from a **SAP/Maximo API**. (Use workOrder.json for demo purposes)
* Run a **sequential agent pipeline** using only the `workOrderId` as input.
* Store results, show status, and export PDFs.
* **No notifications**; **RAG jobs limited to incidents & historical permits**.

---

## 3) Frontend (React Web App - Demo Interface)

**Tech Stack:** React 18 + TypeScript + MUI v5 + React Router v6
**Purpose:** Demo interface for testing ADK agent deployment on Cloud Run
**Data Management:** 
- Work orders: Loaded from JSON file (`workOrders.json`) client-side
- Permits: Stored in browser localStorage after generation
- **API calls:** Two-step process to Google ADK agent:
  1. Create/update session: `POST /apps/{app_name}/users/{user_id}/sessions/{session_id}`
  2. Run agent: `POST /run_sse` with work order prompt

### 3.1 Design System

**Theme:** Modern minimalist design with clean, professional aesthetic suitable for industrial safety applications

**Color Palette:**
- **Primary:** Deep Blue (#1565C0) - Trust, professionalism
- **Success:** Forest Green (#2E7D32) - Approved, safe
- **Error:** Coral Red (#D32F2F) - Critical issues, failures
- **Warning:** Amber (#FF9800) - Pending, caution
- **Neutral:** Charcoal (#424242) - Text, borders
- **Background:** Off-white (#FAFAFA) - Clean, spacious
- **Surface:** Pure White (#FFFFFF) - Cards, panels

**Typography:**
- **Font:** Inter (modern, readable sans-serif)
- **Scale:** 12px (caption), 14px (body), 16px (subheading), 20px (heading), 24px (title)
- **Weight:** Regular (400), Medium (500), Semi-bold (600)
- **Spacing:** 4px base unit (tight, modern spacing)

**Design Principles:**
- **Minimalism:** Clean layouts, ample whitespace, reduced visual clutter
- **Clarity:** High contrast, clear hierarchy, intuitive navigation
- **Consistency:** Uniform components, consistent spacing, predictable patterns
- **Accessibility:** WCAG AA compliance, readable fonts, sufficient color contrast

**Components:** Flat cards with subtle shadows, clean tables with minimal borders, outlined form inputs, compact badges, linear progress indicators, minimal snackbars

### 3.2 Pages

#### 3.2.1 Dashboard (`/workorders`)
**Table:** WO ID, Title, Site/Area, Status (Badge), Last Run, Actions
**Data Source:** `workOrders.json` file loaded on app start
**Features:** Search, Status filter (New/In-Progress/Completed), Pagination, Sortable columns
**Actions:** View Details, Generate Permits (New only)

#### 3.2.2 Work Order Detail (`/workorders/:id`)
**Cards:** Overview (description, location, equipment, time window), Crew Info, Job Plan, Hazards (post-generation), Permits (post-generation)
**Data Source:** Work order from JSON file; Hazards/Permits from localStorage after generation
**Actions:** Generate Permits (disabled if In-Progress/Completed), View Permits
**Progress:** 4-step indicator (Hazards → Permits → Validation → Refinement)
**API Calls:** 
1. `POST /apps/{app_name}/users/{user_id}/sessions/{session_id}` - Create/update session
2. `POST /run_sse` - Run agent with work order prompt

#### 3.2.3 Permits List (`/workorders/:id/permits`)
**Table:** Permit ID, Type (Badge), Status (Draft/Pending/Approved), Validation (Pass/Warn/Fail), Warnings count, PDF link, Actions
**Data Source:** localStorage (keyed by workOrderId)
**Filters:** Type dropdown, Status chips, Validation chips
**Actions:** Open (→ Permit Viewer)

#### 3.2.4 Permit Viewer (`/permits/:id`)
**Tabs:** 
1. **Details:** Basic info (read-only), Hazards linked, Controls/PPE/Sign-offs/Attachments (editable)
2. **Validation:** Status badge, Errors (red), Warnings (amber), Recommendations (blue), Detailed checks
3. **Evidence:** RAG snippets, historical incidents (if available)

**Data Source:** localStorage
**Actions:** Save Changes (updates localStorage), Approve (Pending Review only, disabled if Fail)
**Features:** Form validation, inline errors, confirmation dialog for approval

### 3.3 Data Flow

1. **Work Orders:** Load `workOrders.json` on app initialization → Display in Dashboard
2. **Permit Generation:** 
   - User clicks "Generate Permits" → Two-step API process:
     a. Create/update session: `POST /apps/{app_name}/users/{user_id}/sessions/{session_id}` with session metadata
     b. Run agent: `POST /run_sse` with prompt containing workOrderId
   - Agent returns execution events with structured data (hazards, permits, validations)
   - Parse events and extract structured response → Save to localStorage
   - Update work order status in memory/localStorage
3. **Permit Management:** All permit CRUD operations use localStorage (no backend API)

**Session Management:**
- `user_id`: Generated once per browser, stored in localStorage (`permitflow_user_id`)
- `session_id`: Generated per work order, stored in localStorage (`permitflow_session_{workOrderId}`)
- Session data includes: `preferred_language`, `visit_count`, `workOrderId`, `lastAccessed`

### 3.4 Key Components
- **DataTable:** Sortable, filterable, paginated tables
- **StatusChip:** Color-coded badges (New/In-Progress/Completed, Draft/Pending/Approved, Pass/Warn/Fail)
- **LoadingSpinner:** Progress indicators during agent execution
- **ErrorAlert:** Snackbar notifications

### 3.5 State Management
**Local State:** useState/useReducer for UI state, form inputs, filters
**Data Storage:** 
- Work orders: In-memory from JSON file
- Permits: localStorage (key: `permits_${workOrderId}`)
- Status tracking: localStorage (key: `wo_status_${workOrderId}`)
**API Integration:** Google ADK agent API with two-step process:
- Session management endpoint for state initialization
- Agent execution endpoint (`/run_sse`) for permit generation
- Environment variables: `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_AUTH_TOKEN` (optional)

---

## 4) Agentic System (Google ADK on Cloud Run)

**Service:** `sequential-agent` (Google ADK agent)
**API Pattern:** Two-step process following Google ADK agent API

### 4.1 Session Management

**Endpoint:** `POST /apps/{app_name}/users/{user_id}/sessions/{session_id}`

**Headers:**
- `Authorization: Bearer {token}` (if authentication required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "preferred_language": "English",
  "visit_count": 1,
  "workOrderId": "WO-87231",
  "lastAccessed": "2024-01-15T10:00:00Z"
}
```

**Purpose:** Initialize or update session state for user/work order combination.

### 4.2 Agent Execution

**Endpoint:** `POST /run_sse`

**Headers:**
- `Authorization: Bearer {token}` (if authentication required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "app_name": "sequential-agent",
  "user_id": "user_123",
  "session_id": "session_abc",
  "new_message": {
    "role": "user",
    "parts": [{
      "text": "Generate permits for work order WO-87231"
    }]
  },
  "streaming": false
}
```

**Response:** Array of agent execution events containing structured output:
```json
[
  {
    "type": "agent_response",
    "data": {
      "hazards": [...],
      "permits": [...],
      "validations": [...],
      "pdfLinks": [...],
      "runMeta": {
        "policyVersion": "v1.0",
        "ragSnapshot": "2024-01-15T10:00:00Z"
      }
    }
  }
]
```

**Output Structure:**
* `hazards[]` (name, confidence, rationale, suggestedControls, evidence)
* `permits[]` (permitId, type, controls, PPE, signOffRoles, validityHours, attachmentsRequired, hazardsLinked) - refined through validation loop
* `validations[]` (permitId, validationStatus, errors, warnings, recommendations, checks[]) - from final validation iteration
* `pdfLinks[]`
* `runMeta` (policyVersion, ragSnapshot)

**Notes:**
- Set `"streaming": true` to receive Server-Sent Events (SSE) for real-time updates
- All sub-agents use **structured output (output schema)** with state management via `output_key` for inter-agent communication
- Frontend parses execution events to extract structured response data

For more details refer `agent.md`

---

## 5) ETL / RAG Refresh (Cloud Run Jobs)

### Job 1 — `rag-etl-incidents-permits`

* **Schedule:** Every 12h (Cloud Scheduler)
* **Function:** Extract incidents + finalized historical permits (mock CSV/JSON) → normalize → write to `rag_raw` (GCS/staging table).

### Job 2 — `rag-embed-upsert`

* **Trigger:** Pub/Sub after Job 1
* **Function:** Chunk + embed (Gemini text-embedding) → upsert to vector store with namespaces **`incidents`** and **`historical_permits`**.
* **Output:** Update `ragSnapshot` timestamp recorded by SequentialAgent.

---

## 6) Data & Stores

**Agent System:**
* **RAG DB:** Vertex AI RAG Engine with namespaces `incidents`, `historical_permits`
* **Static Policy Assets (bundled in agent container):**
  * `permit_templates/` (per type)
  * `compliance_rules.json` (deterministic rulebook)
  * `workOrders.json` (demo data)

**React App (Demo):**
* **Work Orders:** Loaded from `workOrders.json` file (client-side)
* **Permits:** Stored in browser localStorage after agent generation
* **No backend database required** - all data management is client-side for demo purposes

---


## 8) Permit Types (MVP) & Core Checks

* **Hot Work** — Fire watch, extinguisher, PPE, gas test near confined spaces, validity ≤ 24h, Supervisor + HSE signoffs
* **Confined Space Entry** — Gas test, continuous monitoring, ventilation, rescue plan, attendant, validity ≤ 12h, Entry Supervisor + HSE signoffs
* **Excavation** — Utility clearance, shoring/barricades, soil check, HSE signoff
* **Electrical/LOTO** — LOTO certificates, isolation/grounding, insulated tools; Supervisor + HSE signoffs
* **Working at Height** — Harness + anchor, ladder/scaffold inspection; Supervisor signoff

---

## 9) Cloud Run Deployments

| Name                        | Type              | Image                            | Notes                                           |
| --------------------------- | ----------------- | -------------------------------- | ----------------------------------------------- |
| `sequential-agent`          | Cloud Run (HTTP)  | `gcr.io/<proj>/sequential-agent` | ADK SequentialAgent (A1→A2→[A3→A4 loop, max 2 iterations])      |
| `rag-etl-incidents-permits` | Cloud Run **Job** | `gcr.io/<proj>/rag-etl`          | Ingest/normalize incidents + historical permits |
| `rag-embed-upsert`          | Cloud Run **Job** | `gcr.io/<proj>/rag-embed`        | Chunk/embed/upsert vectors; namespaces set      |

**Build/CI:** Cloud Build pipelines per directory
**Config:** secrets via Secret Manager (DB URL, GCS bucket, vector store DSN)
**Scaling:** default autoscale (min=0; set min=1 for `sequential-agent` if needed for warm starts)

---
