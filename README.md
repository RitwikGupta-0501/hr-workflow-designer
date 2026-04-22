# HR Workflow Designer - Tredence Case Study

An elite, production-ready prototype for visually architecting HR workflows. Built with a "zero-to-one" mindset as part of the Tredence Studio AI Agent Engineering Case Study.

## 🚀 What Was Completed

This prototype goes beyond a simple visualizer to deliver a fully functional, browser-based orchestrator workspace:

* **Interactive DAG Designer:** Drag-and-drop canvas using React Flow with dynamic node types (Start, Task, Approval, Automated, End).
* **High-Performance History Engine:** Native Undo/Redo stack utilizing the Memento pattern directly within the state layer.
* **Real-Time Validation Engine:** Instant visual feedback (kinetic pulsing) identifying disconnected graphs, missing data, and orphan nodes.
* **Algorithmic Auto-Layout:** Integration with Dagre to automatically calculate and render non-overlapping, hierarchical tree structures.
* **Simulation & Execution Sandbox:** Integrated execution terminal with animated logs and a post-run metrics summary dashboard.
* **Universal Inspector Panel:** A unified, context-aware sidebar for editing both node configurations and edge transition labels.
* **Persistent User Templates:** Ability to save custom node configurations directly to local storage for rapid reuse.
* **Data Portability:** Full JSON serialization for exporting and importing graph states.

## 🛠 Architecture

The application is built with a strict separation of concerns, heavily prioritizing state predictability:

* **State Layer (Zustand):** Acts as the single source of truth. The graph state (`nodes`, `edges`), validation arrays, and history stacks are centrally managed and persisted. 
* **UI/Presentation Layer (React + Tailwind):** Stateless functional components that subscribe to the Zustand store. React Flow handles the canvas rendering, while custom wrappers manage visual state.
* **Algorithmic Layer (Dagre):** Handles complex coordinate math for auto-layout independently of the rendering cycle.
* **Network/API Layer (MSW):** Mock Service Worker intercepts `POST /simulate` and `GET /automations` requests at the network level, simulating a real decoupled backend execution environment without littering the frontend with mock logic.

## 🧠 Design Decisions

* **Centralized State Over Prop-Drilling:** By lifting the entire graph into a Zustand store, the canvas, validation engine, and configuration sidebar remain perfectly synchronized without complex event bubbling.
* **Native History Stack:** Instead of relying on heavy third-party history libraries, the Undo/Redo functionality is built directly into the state lifecycle, capturing snapshots strictly before mutations occur.
* **Smart Re-validation:** The validation engine runs reactively. Errors do not blindly disappear when a user clicks a node; they only clear the exact millisecond the root cause (e.g., missing data, broken connection) is fixed.
* **Unified Inspector Pattern:** Rather than building separate inline editors for edges or complex SVG modals, all data mutations are routed through a single slide-out Inspector Panel, mimicking professional IDEs.

## 🔮 What I Would Add With More Time

While the frontend orchestrator is robust, moving this to a true production environment would require focusing on infrastructure and scale:

1. **True Backend Engine Integration:** Replace the MSW layer with a dedicated backend execution engine to process the DAG, execute the automated scripts, and handle long-polling for asynchronous approval nodes.
2. **Database Persistence:** Transition from local storage persistence to a PostgreSQL/Redis architecture to save workflow definitions and execution logs securely.
3. **Canvas Virtualization:** For massive enterprise workflows containing hundreds of nodes, implement viewport virtualization to maintain a strict 60FPS rendering cycle.
4. **Real-Time Collaboration:** Introduce CRDTs (Conflict-free Replicated Data Types) via Yjs or a WebSocket layer to allow multiple HR admins to architect a workflow simultaneously.

## 🐳 Deployment & CI/CD

* **Containerization:** Provided a Dockerfile for easy local development and cloud deployment via Kubernetes.
* **Automation:** Included a GitHub Actions workflow for linting, testing, and verifying build integrity.

## 🏃 How to Run

Ensure Node.js is installed.

```bash
# Clone the repository
# Navigate to the project directory

# Install dependencies
npm install

# Start the development server
npm run dev

Developed for Tredence Studio AI Agent Platforms.