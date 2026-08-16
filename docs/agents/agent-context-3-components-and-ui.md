# AI Agent Context: 3. Components & UI

## 1. App Wrapper (`App.tsx`)
- Configures the MSW mock environment on load.
- Sets up the `ReactFlowProvider`.
- Manages the visual layout grid (Sidebar on left, Canvas in center, Inspector on right).

## 2. Canvas (`src/components/Canvas/`)
- **`WorkflowCanvas.tsx`**: Renders the `@xyflow/react` `<ReactFlow>` component. Subscribes to `nodes`, `edges`, `onNodesChange`, etc., from Zustand. Includes a `<Background>` and `<Controls>`. Handles drag-and-drop 'drop' events from the Sidebar.
- **`CustomNodes.tsx`**: Defines custom UI for each node type (e.g., displaying an avatar for Approval nodes, showing kinetic pulsing red borders if the node's ID exists in `useWorkflowStore.getState().invalidNodes`).

## 3. Sidebar (`src/components/Sidebar/`)
- Contains a palette of draggable node types (Start, Task, Approval, Automated, End).
- Contains saved User Templates.
- Uses HTML5 Drag and Drop API (`onDragStart`). It sets a custom data payload (`application/reactflow`) containing the `nodeType`.

## 4. Inspector Panel (`src/components/InspectorPanel/`)
- A slide-out panel that appears when `selectedNodeId` or `selectedEdgeId` is populated.
- **For Nodes**: Dynamically renders input fields based on the selected node's `type` (e.g., showing a Role dropdown only for `ApprovalNodeData`). Updates state via `updateNodeData`. Also displays active validation errors for that node.
- **For Edges**: Allows users to edit the edge label transition text.

## 5. Header (`src/components/Header/`)
- Top navigation bar.
- Contains global action buttons triggering Zustand functions: 
  - `Undo` / `Redo`
  - `Auto-Layout` (Dagre)
  - `Export / Import JSON`
  - `Run Simulation` (Play button)

## 6. Simulation (`src/components/Simulation/`)
- **`LogTerminal.tsx`**: A sliding drawer or modal that opens when `isSimulating` is true.
- Displays a retro-style terminal mapping over `simulationLogs` array.
- Shows a post-run `ExecutionSummary` dashboard if the End node was configured to request one.
