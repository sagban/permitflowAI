# PermitFlowAI - Hackathon Submission

## Inspiration

Industrial safety in oil & gas operations is critical, yet permit-to-work processes are often manual, time-consuming, and error-prone. Traditional permit generation requires safety engineers to manually review work orders, identify hazards, cross-reference compliance rules, and create permits—a process that can take hours or days. This delay not only impacts operational efficiency but also increases the risk of human error in identifying critical safety hazards.

We were inspired to leverage Google's Agent Development Kit (ADK) and Gemini AI to automate this entire workflow. By combining structured agent orchestration with Retrieval-Augmented Generation (RAG) from historical incidents and permits, we can transform a multi-hour manual process into an automated, intelligent system that generates compliant permits in minutes while learning from past safety data.

## What it does

PermitFlowAI is an end-to-end AI-powered permit generation system that automates the complete permit-to-work workflow for oil & gas operations. Given just a work order ID, the system:

1. **Identifies Hazards**: Uses RAG to search historical incidents and permits, analyzes work order details, and considers environmental conditions (weather) to identify potential hazards with confidence scores and evidence.

2. **Generates Permits**: Automatically creates compliant permits (Hot Work, Confined Space Entry, Excavation, Electrical/LOTO, Working at Height) with pre-filled controls, PPE requirements, sign-off roles, and validity periods based on identified hazards.

3. **Validates Compliance**: Validates each permit against deterministic compliance rules and policy templates, checking for required controls, sign-offs, validity limits, and site-specific requirements.

4. **Refines Iteratively**: Uses a validation-refinement loop that automatically improves permits based on validation feedback, ensuring they meet all compliance requirements before finalization.

5. **Provides Evidence**: Links each permit to relevant RAG snippets from historical incidents and permits, providing transparency and traceability for safety decisions.

The system includes a modern React web interface where users can view work orders, trigger permit generation, review generated permits with validation results, and export PDFs. All permits are stored with full audit trails and evidence links.

## How we built it

### Architecture Overview

PermitFlowAI consists of three main components:

1. **Frontend (React + TypeScript)**: Modern web application with Material-UI
2. **Sequential Agent System (Google ADK)**: Multi-agent pipeline deployed on Cloud Run
3. **RAG Knowledge Base**: Vertex AI RAG Engine with historical incidents and permits

### Agent Pipeline

We built a sophisticated 4-agent sequential pipeline using Google ADK:

**A1 - Hazard Identification Agent** (Gemini 2.5 Pro)
- Tools: `workorders.get_workorder_by_id`, `rag.search_rag`, `weather.get_weather_data`
- Searches RAG knowledge base (incidents + historical permits) for relevant safety information
- Analyzes work order details and environmental conditions
- Outputs structured hazards with confidence scores, rationale, suggested controls, and evidence snippets

**A2 - Permit Generator Agent** (Gemini 2.5 Flash)
- Tools: `workorders.get_workorder_by_id`, `policy.load`, `ids.newPermitId`
- Maps identified hazards to required permit types
- Loads permit templates and policy rules
- Generates structured permits with controls, PPE, sign-offs, validity periods, and hazard linkages

**A3 - Permit Validator Agent** (Gemini 2.5 Pro)
- Tools: `rules.evaluate`, `rag.search_rag`, `workorders.get_workorder_by_id`
- Validates permits against deterministic compliance rules (`compliance_rules.json`)
- Checks required controls, sign-offs, validity limits, and site-specific requirements
- Outputs validation status (Pass/Warn/Fail) with detailed errors, warnings, and recommendations

**A4 - Permit Refiner Agent** (Gemini 2.5 Flash)
- Refines permits based on validation feedback
- Updates permit details to address errors and warnings
- Terminates loop when validation passes or max iterations (2) reached

**Orchestration**: Uses ADK's `SequentialAgent` for A1→A2 and `LoopAgent` for the A3→A4 refinement loop. Agents communicate via state management using `output_key` for structured outputs.

### Frontend Implementation

- **Tech Stack**: React 18, TypeScript, Material-UI v5, React Router v6, Vite
- **Pages**: Dashboard (work orders list), Work Order Detail (generation interface), Permits List (filterable table), Permit Viewer (details, validation, evidence)
- **State Management**: localStorage for permits and work order status
- **API Integration**: Two-step process following Google ADK agent API pattern (session management + agent execution)
- **Design**: Modern minimalist design with professional color palette optimized for industrial safety applications

### RAG Knowledge Base

- **Data Sources**: Historical incidents and finalized permits (namespaced in Vertex AI RAG Engine)
- **ETL Pipeline**: Two Cloud Run Jobs that refresh the knowledge base every 12 hours
  - Job 1: Extract and normalize incidents + historical permits
  - Job 2: Chunk, embed (Gemini text-embedding), and upsert to vector store
- **Search**: Contextual retrieval with namespace filtering and site-specific filters

### Tools & Infrastructure

**ADK Tools**:
- `workorders.get_workorder_by_id`: Fetches work order details from JSON file
- `rag.search_rag`: Searches Vertex AI RAG Engine with namespace filtering
- `weather.get_weather_data`: Fetches weather conditions via Google Maps Platform Weather API
- `policy.load`: Loads permit templates and policy rules
- `rules.evaluate`: Evaluates permits against deterministic compliance rules
- `ids.newPermitId`: Generates unique permit IDs
- `pdf.render`: Generates PDF documents for permits

**Deployment**:
- Agent system deployed to Cloud Run using ADK's built-in deployment
- Frontend can be deployed to Cloud Run, App Engine, or any static hosting
- RAG refresh jobs run as Cloud Run Jobs triggered by Cloud Scheduler

### Structured Output & State Management

All agents use Pydantic output schemas enforced by ADK, ensuring structured, validated JSON outputs. Agents share state via `output_key` mechanism, allowing downstream agents to access previous outputs (e.g., `{hazard_identification_output}`, `{permit_generator_output}`).

## Challenges we ran into

1. **Agent State Management**: Initially struggled with passing structured data between agents. We solved this by leveraging ADK's `output_key` mechanism and state injection, allowing agents to access previous outputs via template variables like `{hazard_identification_output}`.

2. **Validation-Refinement Loop**: Implementing the iterative refinement loop required careful orchestration to ensure A3 and A4 could access both the current permit state and validation results. We used ADK's `LoopAgent` with proper state management to enable the feedback loop.

3. **RAG Integration**: Setting up Vertex AI RAG Engine with proper namespacing and fallback mechanisms was challenging. We implemented graceful fallbacks to mock data when RAG isn't configured, ensuring the system works in demo mode.

4. **Structured Output Consistency**: Ensuring all agents output consistent, validated JSON structures required careful schema design. We used Pydantic models with strict validation and enforced output schemas in ADK to guarantee structure.

5. **Frontend-Backend Integration**: The Google ADK agent API pattern required a two-step process (session management + agent execution). We had to implement proper session ID generation and management in the frontend to match the expected API pattern.

6. **PDF Generation**: Generating compliant PDFs with proper formatting and including validation results required careful template design and integration with Google Cloud Storage.

## Accomplishments that we're proud of

1. **End-to-End Automation**: Successfully automated the entire permit-to-work workflow from work order ingestion to compliant permit generation, reducing a multi-hour manual process to minutes.

2. **Intelligent Hazard Identification**: Built a sophisticated RAG-powered hazard identification system that learns from historical incidents and permits, providing evidence-backed hazard assessments with confidence scores.

3. **Self-Validating System**: Implemented an iterative validation-refinement loop that automatically improves permit quality until compliance is achieved, ensuring generated permits meet all regulatory requirements.

4. **Production-Ready Architecture**: Designed a scalable, cloud-native architecture using Google Cloud Run, Vertex AI RAG Engine, and ADK that can handle real-world workloads with proper error handling and fallbacks.

5. **Modern User Experience**: Created a clean, professional web interface that makes complex permit management intuitive, with real-time progress tracking, detailed validation feedback, and evidence links.

6. **Comprehensive Permit Support**: Implemented support for 5 critical permit types (Hot Work, Confined Space Entry, Excavation, Electrical/LOTO, Working at Height) with type-specific compliance rules and templates.

7. **Evidence-Based Decisions**: Every permit includes links to relevant RAG snippets from historical incidents and permits, providing transparency and traceability for safety-critical decisions.

8. **Structured Agent Pipeline**: Successfully orchestrated 4 specialized agents using Google ADK's SequentialAgent and LoopAgent patterns, demonstrating advanced agentic AI capabilities.

## What we learned

1. **Agent Orchestration**: Learned how to effectively orchestrate multiple specialized agents using Google ADK, including sequential execution and iterative loops with state management.

2. **RAG for Safety-Critical Applications**: Discovered how RAG can be leveraged for safety-critical applications by providing evidence-backed recommendations from historical data, improving both accuracy and transparency.

3. **Structured Output with LLMs**: Gained deep understanding of enforcing structured outputs using Pydantic schemas and ADK's output schema mechanism, ensuring reliable data flow between agents.

4. **Iterative Refinement Patterns**: Learned how to implement self-improving systems using validation-refinement loops, where agents can iteratively improve their outputs based on feedback.

5. **Cloud-Native AI Deployment**: Understood the complexities of deploying AI agents to production using Cloud Run, including session management, state handling, and API design.

6. **Deterministic + LLM Hybrid Approach**: Discovered the importance of combining deterministic rule-based validation with LLM-powered generation, ensuring both flexibility and compliance.

7. **State Management in Multi-Agent Systems**: Learned how to effectively share state between agents using output keys and state injection, enabling complex multi-step workflows.

8. **Industrial Safety Domain**: Gained insights into oil & gas permit-to-work processes, compliance requirements, and the critical importance of safety documentation in industrial operations.

## What's next for PermitFlow AI

1. **Expanded Permit Types**: Add support for additional permit types (Cold Work, Lifting, Radiography, Vehicle Entry) with their specific compliance rules and templates.

2. **Real-Time Integration**: Integrate with real SAP/Maximo APIs for work order ingestion instead of JSON files, enabling production deployment.

3. **Advanced RAG**: Enhance RAG knowledge base with more data sources (safety bulletins, regulatory updates, equipment manuals) and implement semantic search improvements.

4. **Multi-Language Support**: Add support for multiple languages in permit generation and validation, making the system accessible to international operations.

5. **Mobile Application**: Develop a mobile app for field workers to view permits, complete sign-offs, and upload evidence photos directly from job sites.

6. **Analytics Dashboard**: Build analytics dashboard showing permit generation trends, common hazards, validation failure patterns, and safety insights.

7. **Notification System**: Implement real-time notifications for permit approvals, expirations, and critical safety alerts.

8. **Machine Learning Enhancements**: Train custom models on historical permit data to improve hazard prediction accuracy and identify patterns in safety incidents.

9. **Integration Ecosystem**: Build integrations with other safety systems (incident reporting, training management, equipment maintenance) for a comprehensive safety platform.

10. **Regulatory Compliance Updates**: Implement automated updates to compliance rules based on regulatory changes, ensuring permits always meet current requirements.

11. **Collaborative Review**: Add features for multiple stakeholders to review and comment on permits before approval, with version control and audit trails.

12. **AI Explainability**: Enhance evidence presentation with more detailed explanations of why specific hazards were identified and why certain controls were recommended.

