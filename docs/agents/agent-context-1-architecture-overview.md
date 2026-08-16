# AI Agent Context: 1. Architecture Overview

## Project: HR Workflow Designer
The HR Workflow Designer is an interactive orchestrator workspace built for visually architecting HR workflows. It allows users to build, validate, and simulate complex Directed Acyclic Graphs (DAGs) representing processes like onboarding, approvals, and automated tasks.

## Technology Stack
- **Frontend Framework:** React 19 via Vite
- **State Management:** Zustand (centralized store)
- **Graph/Canvas Engine:** React Flow (`@xyflow/react`)
- **Algorithmic Layout:** Dagre (top-to-bottom automatic layout of DAG)
- **Mock API Layer:** MSW (Mock Service Worker) to intercept `POST /simulate`
- **Styling:** Tailwind CSS

## Architectural Principles
1. **Centralized State:** The entire graph state (`nodes`, `edges`), validation results, and undo/redo stacks are managed in a single Zustand store (`useWorkflowStore`). Components are largely stateless subscribers.
2. **Native History Stack:** Undo/Redo is built directly into Zustand via the Memento pattern (saving snapshots of `nodes` and `edges` to `past` and `future` arrays before mutations).
3. **Reactive Validation:** The DAG is instantly validated on any node/edge change. Disconnected graphs or missing fields trigger kinetic pulsing UI errors.
4. **Unified Inspector:** All node configurations and edge label edits occur in a single slide-out Inspector Panel, not inline on the canvas.
5. **Decoupled Backend:** MSW catches network requests to simulate backend execution, meaning the frontend code requires zero changes when migrating to a real production engine.

## Directory Structure
```text
hr-workflow/
├── src/
│   ├── components/
│   │   ├── Canvas/          # React Flow instances & Custom Nodes
│   │   ├── Header/          # Global controls (Undo, Redo, Layout, Run Simulation)
│   │   ├── InspectorPanel/  # Unified side panel for editing nodes/edges
│   │   ├── Sidebar/         # Drag & Drop palette for new nodes
│   │   └── Simulation/      # LogTerminal for displaying mock execution results
│   ├── mocks/
│   │   ├── browser.ts       # MSW worker setup
│   │   └── handlers.ts      # MSW route interceptions (/simulate, /automations)
│   ├── store/
│   │   └── useWorkflowStore.ts # Centralized Zustand state
│   ├── types/
│   │   └── index.ts         # TypeScript definitions (Discriminated unions for node data)
│   ├── App.tsx              # Main layout wrapper
│   └── main.tsx             # React entry point
├── package.json
└── vite.config.ts
```
