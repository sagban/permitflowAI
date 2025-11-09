# PermitFlowAI Frontend

React + TypeScript web application for PermitFlowAI permit management system.

## Tech Stack

- React 18
- TypeScript
- Material-UI v5
- React Router v6
- Vite

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `frontend/` directory (optional, defaults to `http://127.0.0.1:8000`):
```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_NAME=sequential-agent
VITE_AUTH_TOKEN=your-auth-token  # Optional, only if authentication is required
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/     # Reusable components (DataTable, StatusChip, etc.)
├── pages/         # Page components (Dashboard, WorkOrderDetail, etc.)
├── theme/         # MUI theme configuration
├── types/         # TypeScript type definitions
└── utils/         # Utility functions (storage, API, etc.)
```

## Features

- **Dashboard**: View and search work orders
- **Work Order Detail**: View work order details and generate permits
- **Permits List**: View all permits for a work order with filters
- **Permit Viewer**: View and edit permit details, validation, and evidence

## Data Management

- Work orders are loaded from `/public/workOrders.json`
- Permits, hazards, and validations are stored in browser localStorage
- User and session IDs are stored in localStorage for agent API calls
- API calls follow Google ADK agent API pattern:
  1. Create/update session: `POST /apps/{app_name}/users/{user_id}/sessions/{session_id}`
  2. Run agent: `POST /run_sse` with work order prompt

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the Cloud Run agent API (default: `http://127.0.0.1:8000`)
- `VITE_APP_NAME`: App name for the agent (default: `sequential-agent`)
- `VITE_AUTH_TOKEN`: Bearer token for authentication (optional, only if required by the API)

## API Integration

The app uses a two-step process to interact with the Google ADK agent:

1. **Session Management**: Creates or updates a session for the user/work order combination
2. **Agent Execution**: Sends a prompt to the agent and receives execution events with structured data

Session IDs are automatically generated and stored per work order. User IDs are generated once per browser session.

## CORS Configuration

During development, the Vite dev server includes a proxy configuration to avoid CORS issues. The proxy forwards requests from `http://localhost:5173` to `http://127.0.0.1:8000` for:
- `/apps/*` - Session management endpoints
- `/run_sse` - Agent execution endpoint

**Note:** If you change the proxy configuration in `vite.config.ts`, restart the dev server for changes to take effect.

For production builds, ensure your backend API has proper CORS headers configured, or use the same origin for both frontend and backend.

