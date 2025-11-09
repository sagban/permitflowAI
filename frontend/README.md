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

2. Create a `.env` file (optional, defaults to `http://localhost:8080`):
```bash
VITE_API_BASE_URL=http://your-cloud-run-url
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
- API calls are made to the Cloud Run agent endpoint (`POST /sequential/execute`)

## Environment Variables

- `VITE_API_BASE_URL`: Base URL for the Cloud Run agent API (default: `http://localhost:8080`)

