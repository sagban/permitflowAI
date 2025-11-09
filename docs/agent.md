
# PermitFlow AI — Google ADK SequentialAgent Build Spec (Hackathon)

## 0 Single Public Endpoint

**Service:** `sequential-agent` (Cloud Run)
**Endpoint:** `POST /sequential/execute`
**Input:**

```json
{ "workOrderId": "WO-87231" }
```

**Pipeline (ADK graph):** **A1 Hazard Identification → A2 Permit Generator → [A3 Permit Validator → A4 Permit Refiner] (Loop, max 2 iterations)**
**Output:**

```json
{
  "workOrderId": "WO-87231",
  "hazards": [...],
  "permits": [...],
  "validations": [...],
  "pdfLinks": [...],
  "runMeta": { "policyVersion": "v1.0", "ragSnapshot": "2025-11-03T10:00Z" }
}
```

> All sub-agents emit **structured JSON** via ADK **output schema** with state management using `output_key`.

---

## 1 Shared ADK Tools

1. **`workorders.get_workorder_by_id`**

   * **In:** `{ "id": "WO-87231" }`
   * **Out:** normalized WO JSON (id, title, description, location/site, equipment, time window, job plan text, latitude, longitude).
   * **Backed by:** JSON file (`assets/workOrders.json`).

2. **`rag.search_rag`**

   * **Namespaces:** `incidents`, `historical_permits`.
   * **In:** `{ "query":"welding near tank", "namespace":"incidents", "top_k":5, "filters":{ "site":"Plant-A" } }`
   * **Out:** `{ "results": [ { "id", "title", "snippet", "score", "meta": {...} } ], "query", "namespace", "total" }`.
   * **Backed by:** Vertex AI RAG Engine (with fallback to mock data if not configured).

3. **`weather.get_weather_data`** *(optional for A1 demo polish)*

   * **In:** `{ "lat": 28.6139, "lon": 77.2090 }`
   * **Out:** `{ "windKph": 38, "tempC": 32, "precipChance": 10, "conditions": "Clear", "humidity": 60, "coordinates": {...}, "timestamp": "..." }`.
   * **Backed by:** Google Maps Platform Weather API (with fallback to default values if API key not configured).

4. **`policy.load`**

   * **In:** `{ "permitType":"Hot Work" }`
   * **Out:** template & rule block (controls, PPE, signoffs, validity max).

5. **`rules.evaluate`**

   * **In:** `{ "permit": {...}, "rulesetVersion":"v1.0" }`
   * **Out:** `{ "errors":[], "warnings":[], "checks":[{check,result,details}] }`.

6. **`ids.newPermitId`** → returns unique `PERM-<TYPE>-NNNN`.

7. **`pdf.render`**

   * **In:** `{ "permit": {...}, "validation": {...} }`
   * **Out:** `{ "pdfUrl":"gs://.../PERM-HW-0001.pdf" }`.

---

## 2 Sub-Agent Definitions

### A1 — Hazard Identification Agent

**Goal:** derive hazards for the WO using RAG + conditions.
**LLM:** **Gemini 2.5 Pro** (temperature 0; **output schema enforced**).
**Tools:** `workorders.get_workorder_by_id`, `rag.search_rag` (namespaces: incidents, historical_permits), `weather.get_weather_data` (optional).
**Knowledge:** incidents, historical permits, lessons inlined within those two corpora.
**Output Key:** `hazard_identification_output` (stored in agent state for use by A2).
**Output schema:**

```json
{
  "type":"object",
  "properties":{
    "hazards":{"type":"array","items":{
      "type":"object",
      "properties":{
        "name":{"type":"string"},
        "confidence":{"type":"number"},
        "rationale":{"type":"string"},
        "suggestedControls":{"type":"array","items":{"type":"string"}}
      },
      "required":["name","confidence"]
    }},
    "evidence":{"type":"array","items":{"type":"object","properties":{
      "sourceId":{"type":"string"},
      "snippet":{"type":"string"}
    }}} },
  "required":["hazards"]
}
```

---

### A2 — Permit Generator Agent

**Goal:** map hazards + WO → required permits, pre-filled.
**LLM:** **Gemini 2.5 Flash** (temperature 0.1; **output schema enforced**).
**Tools:** `workorders.get_workorder_by_id`, `policy.load`, `ids.newPermitId`.
**Knowledge:** `permit_templates` + company policy blocks per type.
**Input:** Accesses `{hazard_identification_output}` from A1 via state injection.
**Output Key:** `permit_generator_output` (stored in agent state for use by A3 and A4).
**Output schema:**

```json
{
  "type":"object",
  "properties":{
    "permits":{"type":"array","items":{
      "type":"object",
      "properties":{
        "permitId":{"type":"string"},
        "type":{"type":"string"},
        "hazardsLinked":{"type":"array","items":{"type":"string"}},
        "controls":{"type":"array","items":{"type":"string"}},
        "ppe":{"type":"array","items":{"type":"string"}},
        "signOffRoles":{"type":"array","items":{"type":"string"}},
        "validityHours":{"type":"integer"},
        "attachmentsRequired":{"type":"array","items":{"type":"string"}}
      },
      "required":["permitId","type","controls","signOffRoles","validityHours"]
    }}},
  "required":["permits"]
}
```

**Permit types included (templates + rules):**
**Hot Work, Confined Space Entry, Excavation, Electrical/LOTO, Working at Height**
*(additional: Cold Work, Lifting, Radiography, Vehicle Entry — backlog)*

---

### A3 — Permit Validator Agent

**Goal:** ensure each permit meets policy + standards; produce pass/fail & findings.
**LLM:** **Gemini 2.5 Pro** (temperature 0; **output schema enforced**).
**Tools:** `rules.evaluate`, `rag.search_rag` (namespaces: incidents, historical_permits for supporting evidence), `workorders.get_workorder_by_id`.
**Knowledge:** `compliance_rules.json` (deterministic), plus any relevant RAG snippets returned for justification.
**Input:** Accesses `{permit_generator_output}` from A2 via state injection.
**Output Key:** `permit_validation_output` (stored in agent state for use by A4).
**Output schema:**

```json
{
  "type":"object",
  "properties":{
    "permitId":{"type":"string"},
    "validationStatus":{"type":"string","enum":["Pass","PassWithWarnings","Fail"]},
    "errors":{"type":"array","items":{"type":"string"}},
    "warnings":{"type":"array","items":{"type":"string"}},
    "recommendations":{"type":"array","items":{"type":"string"}},
    "checks":{"type":"array","items":{"type":"object","properties":{
      "check":{"type":"string"},
      "result":{"type":"string","enum":["ok","warn","error"]},
      "details":{"type":"string"}
    }}} },
  "required":["permitId","validationStatus","errors"]
}
```

> Pattern: let tools run first inside the sub-agent turn, then emit the schema-constrained JSON.

---

### A4 — Permit Refiner Agent

**Goal:** refine permits based on validation results and recommendations; iterate until validation passes or max iterations reached.
**LLM:** **Gemini 2.5 Flash** (temperature 0; **output schema enforced**).
**Tools:** `workorders.get_workorder_by_id`.
**Knowledge:** Uses validation feedback to improve permit quality.
**Input:** Accesses both `{permit_generator_output}` and `{permit_validation_output}` from A3 via state injection.
**Output Key:** `permit_generator_output` (updates the permit in state, which A3 will re-validate in the next loop iteration).
**Behavior:** If validation indicates completion (Pass status), calls `exit_loop` to terminate the refinement loop.

---

## 2.1 Agent Orchestration

The pipeline uses ADK's `SequentialAgent` and `LoopAgent` patterns:

1. **A1 (Hazard Identification)** → runs once, outputs `hazard_identification_output`
2. **A2 (Permit Generator)** → runs once, uses A1 output, outputs `permit_generator_output`
3. **Refinement Loop** (max 2 iterations):
   - **A3 (Permit Validator)** → validates `permit_generator_output`, outputs `permit_validation_output`
   - **A4 (Permit Refiner)** → refines `permit_generator_output` based on `permit_validation_output`
   - Loop continues until A4 calls `exit_loop` or max iterations (2) reached

**State Management:** Agents use `output_key` to store structured outputs in agent state, enabling downstream agents to access previous outputs via state injection (e.g., `{hazard_identification_output}`, `{permit_generator_output}`, `{permit_validation_output}`).

---

## 3 Rulebook & Policy Assets (ship in repo or GCS)

* **`compliance_rules.json` (deterministic):**

  * per permit: `required_controls`, `required_signoffs`, `validity_hours_max`, `environment_rules` (e.g., “Tank Farm → requires Gas test”).
* **`permit_templates/` (YAML/JSON):** default sections, PPE, controls, sign-off roles.
* **`policyVersion`:** `v1.0` (recorded in `runMeta`).

---

## 4 Cloud Run Jobs — RAG Refresh (only these two)

### Job 1 — **`rag-etl-incidents-permits`**

* **Trigger:** Cloud Scheduler (e.g., every 12h)
* **Input Sources:** mocked endpoints/CSV/JSON for **incidents** and **finalized historical permits**
* **Steps:**

  1. Fetch latest rows since last watermark.
  2. Normalize into docs: `{ id, site, area, activity, summary, tags, date }`.
  3. Write normalized docs to `rag_raw` (GCS or a staging table).
* **Output:** staged corpus for embedding.

### Job 2 — **`rag-embed-upsert`**

* **Trigger:** Pub/Sub from Job 1 completion
* **Steps:**

  1. Create text chunks; generate embeddings (Gemini text-embedding or similar).
  2. Upsert vectors + metadata to the vector store with **namespaces:** `incidents`, `historical_permits`.
  3. Emit `ragSnapshot` timestamp for the SequentialAgent to include in `runMeta`.

**Service Accounts & Access**

* Each job runs under its own SA with least-privilege to GCS + vector DB.

---

## 5 Storage

* **Permit DB** (Postgres): `work_orders`, `hazards`, `permits`, `validations`, `pdfs`, `runs`.
* **RAG DB**: vector store with namespaces **`incidents`** and **`historical_permits`** only.
* **Blobs:** PDFs in GCS (`gs://…/permits/<id>.pdf`).
* **Config:** `policyVersion`, `ragSnapshot` persisted with each run.

---

## 6 Permit Type Essentials (in rulebook)

| Permit                   | Core checks (deterministic)                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Hot Work**             | Fire watch, extinguisher, PPE, gas test near confined spaces, validity ≤ 24h, sign-offs: Supervisor + HSE               |
| **Confined Space Entry** | Gas test, continuous monitoring, ventilation, rescue plan, attendant, validity ≤ 12h, sign-offs: Entry Supervisor + HSE |
| **Excavation**           | Utility clearance, shoring/barricades, soil check, HSE sign-off                                                         |
| **Electrical/LOTO**      | LOTO certificates, isolation/grounding, insulated tools; sign-offs: Supervisor + HSE                                    |
| **Working at Height**    | Harness & anchor point, ladder/scaffold inspection; Supervisor sign-off                                                 |

---
