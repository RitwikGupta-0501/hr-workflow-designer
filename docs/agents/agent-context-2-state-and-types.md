# AI Agent Context: 2. State & Types

## Core Types (`src/types/index.ts`)
The application uses strict TypeScript discriminated unions to manage node payloads.

```typescript
export interface BaseNodeData {
    [key: string]: unknown;
    title: string;
}

export interface StartNodeData extends BaseNodeData { metadata?: Record<string, string>; }
export interface TaskNodeData extends BaseNodeData { description?: string; assignee?: string; dueDate?: string; customFields?: Record<string, string>; }
export interface ApprovalNodeData extends BaseNodeData { role: 'Manager' | 'HRBP' | 'Director' | ''; threshold?: number; }
export interface AutomatedNodeData extends BaseNodeData { actionId: string; actionParams?: Record<string, string>; }
export interface EndNodeData extends BaseNodeData { endMessage?: string; summaryFlag?: boolean; }

export type WorkflowNodeData =
    | StartNodeData
    | TaskNodeData
    | ApprovalNodeData
    | AutomatedNodeData
    | EndNodeData;

export interface SimulationLog {
    timestamp: string;
    level: 'info' | 'error' | 'warning';
    message: string;
}
```

## State Management (`src/store/useWorkflowStore.ts`)
The Zustand store handles the graph logic. Key state variables and methods:

- **State:** 
  - `nodes`, `edges`: The React Flow data objects.
  - `selectedNodeId`, `selectedEdgeId`: Currently focused elements in the Inspector.
  - `past`, `future`: Arrays containing node/edge snapshots for Undo/Redo.
  - `invalidNodes`: A dictionary mapping `nodeId` -> `string[]` of error messages.
  - `isSimulating`, `simulationLogs`, `executionSummary`: State for the simulation terminal.
  - `userTemplates`: Saved custom node configurations.

- **Key Methods:**
  - `onNodesChange`, `onEdgesChange`, `onConnect`: Standard React Flow event handlers.
  - `updateNodeData(id, newData)`: Deep merges new properties into a node's data payload.
  - `saveHistory()`: Pushes the current `nodes` and `edges` to the `past` array. Called *before* any mutation.
  - `validateWorkflow()`: Reactively assesses the DAG. Checks for orphan nodes, missing required fields (e.g., assignee on Task nodes), and ensures start/end nodes have correct connections. Populates `invalidNodes`.
  - `autoLayout()`: Uses `dagre` to mathematically reposition all nodes top-to-bottom.
  - `runSimulation()`: Performs validation. If valid, sends `POST /simulate` to the mock backend and sets `simulationLogs` from the response.
