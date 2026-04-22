import { create } from 'zustand';
import {
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import type { WorkflowNodeData, SimulationLog } from '../types';
import { persist } from 'zustand/middleware';
import dagre from 'dagre';

interface HistorySnapshot {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
}

interface WorkflowState {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;
    isSimulating: boolean;
    simulationLogs: SimulationLog[];
    past: HistorySnapshot[];
    future: HistorySnapshot[];
    invalidNodes: Record<string, string[]>;


    onNodesChange: OnNodesChange<Node<WorkflowNodeData>>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (type: string, position: { x: number, y: number }) => void;
    updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
    deleteNode: (id: string) => void;
    setSelectedNodeId: (id: string | null) => void;
    runSimulation: () => Promise<void>;
    clearLogs: () => void;
    exportWorkflow: () => void;
    importWorkflow: (jsonString: string) => void;
    saveHistory: () => void;
    undo: () => void;
    redo: () => void;
    validateWorkflow: () => boolean;
    autoLayout: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
    persist((set, get) => ({
        nodes: [
            {
                id: 'start-1',
                type: 'startNode',
                position: { x: 250, y: 50 },
                data: { title: 'Workflow Entry Point' }
            }
        ],
        edges: [],
        selectedNodeId: null,
        past: [],
        future: [],
        invalidNodes: {},
        isSimulating: false,
        simulationLogs: [],

        saveHistory: () => {
            const { nodes, edges, past } = get();
            const newPast = [...past, { nodes, edges }].slice(-50);
            set({ past: newPast, future: [] });
        },

        undo: () => {
            const { past, future, nodes, edges } = get();
            if (past.length === 0) return;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);

            set({
                past: newPast,
                future: [{ nodes, edges }, ...future],
                nodes: previous.nodes,
                edges: previous.edges,
                selectedNodeId: null
            });
        },

        redo: () => {
            const { past, future, nodes, edges } = get();
            if (future.length === 0) return;

            const next = future[0];
            const newFuture = future.slice(1);

            set({
                past: [...past, { nodes, edges }],
                future: newFuture,
                nodes: next.nodes,
                edges: next.edges,
                selectedNodeId: null
            });
        },

        validateWorkflow: () => {
            const { nodes, edges } = get();
            const errors: Record<string, string[]> = {};

            nodes.forEach(node => {
                const nodeErrors: string[] = [];

                // 1. Connection Checks
                const hasIncoming = edges.some(e => e.target === node.id);
                const hasOutgoing = edges.some(e => e.source === node.id);

                if (node.type === 'startNode' && !hasOutgoing) nodeErrors.push('Missing outgoing connection.');
                if (node.type === 'endNode' && !hasIncoming) nodeErrors.push('Missing incoming connection.');
                if (['taskNode', 'approvalNode', 'automatedNode'].includes(node.type || '') && (!hasIncoming || !hasOutgoing)) {
                    nodeErrors.push('Must be connected on both sides.');
                }

                // 2. Data Checks
                if (node.type === 'taskNode') {
                    if (!node.data.assignee) nodeErrors.push('Assignee is required.');
                    if (!node.data.dueDate) nodeErrors.push('Due date is required.');
                }
                if (node.type === 'approvalNode' && !node.data.role) nodeErrors.push('Approval role is required.');
                if (node.type === 'automatedNode' && !node.data.actionId) nodeErrors.push('Automation action must be selected.');

                if (nodeErrors.length > 0) {
                    errors[node.id] = nodeErrors;
                }
            });

            set({ invalidNodes: errors });
            return Object.keys(errors).length === 0;
        },

        onNodesChange: (changes) => {
            set({ nodes: applyNodeChanges(changes, get().nodes) });
            if (Object.keys(get().invalidNodes).length > 0) {
                get().validateWorkflow();
            }
        },

        onEdgesChange: (changes) => {
            set({ edges: applyEdgeChanges(changes, get().edges) });
            if (Object.keys(get().invalidNodes).length > 0) {
                get().validateWorkflow();
            }
        },

        updateNodeData: (id, newData) => {
            get().saveHistory();
            set({
                nodes: get().nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, ...newData } } : node),
            });
            if (Object.keys(get().invalidNodes).length > 0) {
                get().validateWorkflow();
            }
        },

        onConnect: (connection) => {
            set({ edges: addEdge(connection, get().edges) });
            if (Object.keys(get().invalidNodes).length > 0) {
                get().validateWorkflow();
            }
        },

        addNode: (type, position) => {
            get().saveHistory();
            const id = `${type}-${Date.now()}`;
            const newNode: Node<WorkflowNodeData> = {
                id,
                type,
                position,
                data: { title: `New ${type.replace('Node', '')}` }
            };
            set({ nodes: [...get().nodes, newNode] });
        },

        deleteNode: (id) => {
            get().saveHistory();
            set({
                nodes: get().nodes.filter((node) => node.id !== id),
                edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
                selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
            });
        },

        setSelectedNodeId: (id) => {
            set({ selectedNodeId: id });
        },


        clearLogs: () => set({ simulationLogs: [] }),

        runSimulation: async () => {
            const isValid = get().validateWorkflow();

            if (!isValid) {
                set({
                    simulationLogs: [{
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: 'Simulation aborted: Workflow contains invalid or disconnected nodes.'
                    }]
                });
                return;
            }

            const { nodes, edges } = get();
            set({ isSimulating: true, simulationLogs: [] });

            try {
                const response = await fetch('/simulate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nodes, edges }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Simulation failed');
                }

                set({
                    simulationLogs: data.executionLog,
                    isSimulating: false
                });
            } catch (error: any) {
                set({
                    simulationLogs: [{
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: error.message
                    }],
                    isSimulating: false
                });
            }
        },
        exportWorkflow: () => {
            const { nodes, edges } = get();
            const exportData = JSON.stringify({ nodes, edges }, null, 2);

            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hr-workflow-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        importWorkflow: (jsonString: string) => {
            try {
                const data = JSON.parse(jsonString);
                if (data.nodes && data.edges) {
                    set({
                        nodes: data.nodes,
                        edges: data.edges,
                        selectedNodeId: null,
                        simulationLogs: []
                    });
                } else {
                    throw new Error("Invalid file structure");
                }
            } catch (error) {
                console.error("Failed to import workflow:", error);
                alert("Invalid workflow file.");
            }
        },

        // ... existing store methods

        autoLayout: () => {
            get().saveHistory(); // Save state so the user can 'Undo' the auto-layout!

            const { nodes, edges } = get();

            // 1. Initialize Dagre graph engine
            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));

            // Set the direction to Left-to-Right ('LR'). You can change to 'TB' (Top-Bottom) if you prefer.
            dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

            // 2. We need to tell Dagre roughly how big your nodes are. 
            // Your Tailwind w-48 is 192px wide. We'll use 200x100 for breathing room.
            const nodeWidth = 200;
            const nodeHeight = 100;

            // 3. Feed the nodes to Dagre
            nodes.forEach((node) => {
                dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
            });

            // 4. Feed the connections to Dagre
            edges.forEach((edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            // 5. Run the layout mathematics
            dagre.layout(dagreGraph);

            // 6. Update our React Flow nodes with the calculated coordinates
            const layoutedNodes = nodes.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);

                // Dagre calculates from the center, but React Flow positions from the top-left.
                // We subtract half the width/height to center them perfectly.
                return {
                    ...node,
                    position: {
                        x: nodeWithPosition.x - nodeWidth / 2,
                        y: nodeWithPosition.y - nodeHeight / 2,
                    },
                };
            });

            // 7. Update the state
            set({ nodes: layoutedNodes });
        },
    }),
        {
            name: 'hr-workflow-storage',
        }
    ));