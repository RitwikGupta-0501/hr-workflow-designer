# AI Agent Context: 4. Mock API (MSW)

## Backend Simulation Context
To maintain strict separation of concerns, the frontend application does not contain mock execution logic (e.g., `setTimeout` chains or mock logs in Zustand). Instead, it assumes a fully functioning backend engine exists.

The `Mock Service Worker` (MSW) intercepts these requests at the network layer.

## Setup
Located in `src/mocks/handlers.ts`. The worker is initialized in `App.tsx` conditionally (if in development mode) before rendering the React tree.

## Defined Endpoints

### 1. `GET /automations`
- **Purpose**: Returns a list of available automated actions that the workflow can trigger.
- **Usage**: The Inspector Panel calls this to populate the dropdown for an `AutomatedNode`.
- **Mock Response**:
  ```json
  [
    { "id": "send_email", "name": "Send Email", "requiredParams": ["recipient", "subject"] },
    { "id": "slack_notification", "name": "Slack Notification", "requiredParams": ["channel", "message"] }
  ]
  ```

### 2. `POST /simulate`
- **Purpose**: Receives the exact serialized graph (`nodes` and `edges`) and pretends to execute the workflow on a backend engine.
- **Usage**: Called by `runSimulation` in the Zustand store.
- **Mock Logic**:
  - Validates that at least one `StartNode` exists in the payload; returns HTTP 400 if missing.
  - Generates a sequential array of `SimulationLog` objects (`timestamp`, `level`, `message`).
  - Returns HTTP 200 with the execution log array.
- **Mock Response Structure**:
  ```json
  {
    "status": "success",
    "executionLog": [
      { "timestamp": "...", "level": "info", "message": "Simulation started." },
      { "timestamp": "...", "level": "info", "message": "Total nodes processed: 5." }
    ]
  }
  ```
