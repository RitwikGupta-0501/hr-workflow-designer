HR Workflow Designer - Tredence Case Study

An elite, production-ready prototype for visually architecting HR workflows. Built with a "zero-to-one" mindset as part of the Tredence Studio AI Agent Engineering Case Study.

🚀 Key Features

Visual Graph Interface: Interactive DAG (Directed Acyclic Graph) designer using React Flow.

Dynamic Configuration Engine: Context-aware property editor that adapts based on node type.

Simulation Sandbox: Built-in validation and execution simulator to test workflow logic.

Type-Safe Architecture: Full TypeScript-style integration for state and data models.

Modern Tech Stack: React, Zustand, Tailwind CSS, and Lucide Icons.

🛠 Architecture & Design Decisions

Centralized State (Zustand): Instead of fragmented prop-drilling, the entire graph is managed by a Zustand store. This ensures the canvas and the configuration sidebar are always in sync.

Modular Node Components: Each node type (Start, Task, Approval, Automated) is its own functional component, allowing for easy extensibility as the product scales.

Graph Validation Logic: Included a simulation layer that checks for structural errors (missing start nodes) and orphan components before "executing" the workflow.

Clean UI/UX: Leveraged Tailwind CSS for a premium, high-contrast look similar to enterprise SaaS tools (Retool, Zapier).

🐳 Deployment & CI/CD (Elite Skills Showcase)

Containerization: Provided a Dockerfile for easy local development and cloud deployment via Kubernetes.

Automation: Included a GitHub Actions workflow for linting, testing, and verifying build integrity.

🏃 How to Run

Ensure Node.js is installed.

npm install

npm run dev

Developed for Tredence Studio AI Agent Platforms.