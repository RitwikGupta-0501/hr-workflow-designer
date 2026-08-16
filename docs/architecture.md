# HR Workflow Designer - Architectural Decisions Document

## 1. Project Overview
The HR Workflow Designer is an elite, production-ready prototype built for visually architecting HR workflows. It serves as an interactive orchestrator workspace where users can build, validate, and simulate complex Directed Acyclic Graphs (DAGs) representing HR processes (e.g., onboarding, approvals).

This document outlines the core architectural decisions made during development, the reasoning behind them, and how they contribute to a robust, scalable, and maintainable application.

---

## 2. Core Architecture & Technology Stack

The application is built with a strict separation of concerns, heavily prioritizing state predictability and performance.

*   **Frontend Framework:** React 19 via Vite (for fast HMR and optimized builds).
*   **State Management:** Zustand (centralized, unopinionated state container).
*   **Graph/Canvas Engine:** React Flow (`@xyflow/react`) (for rendering the interactive node-based UI).
*   **Algorithmic Layout:** Dagre (for mathematical calculation of node positioning).
*   **Network/API Layer:** MSW (Mock Service Worker) (for intercepting network requests and simulating a decoupled backend).
*   **Styling:** Tailwind CSS (for utility-first, rapid UI styling).

---

## 3. Detailed Architectural Decisions & Rationale

### Decision 1: Centralized State Management (Zustand) over Prop-Drilling or React Context
*   **How it works:** The entire graph state (`nodes`, `edges`), validation results, history stack, and UI states (like `selectedNodeId`) are lifted into a single Zustand store (`src/store/useWorkflowStore.ts`).
*   **Why we did it:** 
    *   **Predictability:** It acts as a single source of truth. 
    *   **Performance:** Avoids the re-rendering overhead common with React Context when deeply nested components need to access state. 
    *   **Synchronization:** Ensures the canvas, validation engine, and configuration sidebar remain perfectly synchronized without complex event bubbling.

### Decision 2: Native History Stack (Memento Pattern) over Third-Party Libraries
*   **How it works:** The Zustand store contains `past` and `future` arrays. Before any state mutation (e.g., adding a node, moving a node, updating an edge), a complete snapshot of the `nodes` and `edges` is pushed to the `past` array (`saveHistory()`).
*   **Why we did it:** 
    *   **Lightweight:** Avoids the bloat of relying on heavy third-party history/undo-redo libraries.
    *   **Control:** By building it directly into the state lifecycle, we capture snapshots strictly before specific intentional mutations occur, giving us fine-grained control over what constitutes an "undoable" action.

### Decision 3: Reactive Real-Time Validation Engine
*   **How it works:** The `validateWorkflow` function runs reactively whenever the graph changes (e.g., via `onNodesChange` or `onEdgesChange`). It checks for disconnected graphs, missing required data (like missing assignees on Task nodes), and orphan nodes, storing errors in the `invalidNodes` object.
*   **Why we did it:** 
    *   **Immediate Feedback:** Users receive instant visual feedback (e.g., kinetic pulsing on nodes) if their workflow is invalid.
    *   **Accuracy:** Errors do not blindly disappear when a user simply clicks a node; they only clear the exact millisecond the root cause is fundamentally fixed in the data model.

### Decision 4: Unified Inspector Panel over Inline Canvas Editors
*   **How it works:** Rather than building separate, complex inline editors for each node type or edge, all data mutations are routed through a single slide-out Inspector Panel (`src/components/InspectorPanel`).
*   **Why we did it:** 
    *   **Clean Canvas:** Keeps the visual representation clean and uncluttered.
    *   **Professional UX:** Mimics the behavior of professional IDEs and 3D modeling software, providing a consistent place for users to configure properties, validations, and edge transition labels.

### Decision 5: Mathematical Auto-Layout (Dagre)
*   **How it works:** We integrate `dagre` to process the node and edge connections and calculate a non-overlapping, hierarchical tree structure (top-to-bottom layout).
*   **Why we did it:** 
    *   **Separation of Concerns:** Dagre handles the complex coordinate math completely independently of the React rendering cycle. The result is then applied to the React Flow node positions, keeping the UI highly responsive while solving a complex layout problem algorithmically.

### Decision 6: Network-Level Backend Simulation (MSW)
*   **How it works:** Mock Service Worker (MSW) intercepts `POST /simulate` and `GET /automations` requests. It processes the actual JSON payload of the workflow and returns mock execution logs.
*   **Why we did it:** 
    *   **Decoupling:** It simulates a real decoupled backend execution environment without littering the frontend React code with `setTimeout` or mock data logic.
    *   **Zero-Friction Migration:** When a real backend engine is built, the frontend code requires absolutely zero changes; we simply turn off the MSW worker.

### Decision 7: Strict Discriminated Unions for Data Payloads
*   **How it works:** In `src/types/index.ts`, `WorkflowNodeData` is defined as a discriminated union of strictly typed interfaces (`StartNodeData | TaskNodeData | ApprovalNodeData | ...`).
*   **Why we did it:** 
    *   **Type Safety:** Ensures that when updating a node, the application enforces the correct schema (e.g., an `ApprovalNode` must have a `role`, a `TaskNode` must have an `assignee`). This drastically reduces runtime errors and makes the codebase highly resilient.

---

## 4. Future Architecture Considerations for Enterprise Scale

While the current architecture is robust for a prototype and standard use cases, scaling to a true enterprise production environment would require the following shifts:

1.  **True Backend Engine Integration:** The MSW layer should be replaced with a dedicated execution engine (e.g., temporal.io or a custom state machine) capable of processing the DAG, executing automated scripts, and handling long-polling for asynchronous nodes (like human approvals).
2.  **Database Persistence:** Transition from Zustand's `localStorage` middleware to a robust backend architecture (PostgreSQL for relational workflow definitions, Redis for fast execution state) to securely save workflows and audit logs.
3.  **Canvas Virtualization:** For massive enterprise workflows containing hundreds or thousands of nodes, viewport virtualization must be implemented to only render nodes visible on the screen, maintaining a strict 60FPS rendering cycle.
4.  **Real-Time Collaboration:** Introduce CRDTs (Conflict-free Replicated Data Types) via Yjs or a WebSocket layer. This would allow multiple HR administrators to architect and modify the same workflow simultaneously without merge conflicts, similar to Figma or Google Docs.
