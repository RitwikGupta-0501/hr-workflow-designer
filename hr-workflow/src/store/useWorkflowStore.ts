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

interface WorkflowState {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;
    isSimulating: boolean;
    simulationLogs: SimulationLog[];


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

        onNodesChange: (changes) => {
            set({ nodes: applyNodeChanges(changes, get().nodes) });
        },
        onEdgesChange: (changes) => {
            set({ edges: applyEdgeChanges(changes, get().edges) });
        },
        onConnect: (connection) => {
            set({ edges: addEdge(connection, get().edges) });
        },

        addNode: (type, position) => {
            const id = `${type}-${Date.now()}`;
            const newNode: Node<WorkflowNodeData> = {
                id,
                type,
                position,
                data: { title: `New ${type.replace('Node', '')}` }
            };
            set({ nodes: [...get().nodes, newNode] });
        },

        updateNodeData: (id, newData) => {
            set({
                nodes: get().nodes.map((node) => {
                    if (node.id === id) {
                        return { ...node, data: { ...node.data, ...newData } };
                    }
                    return node;
                })
            });
        },

        deleteNode: (id) => {
            set({
                nodes: get().nodes.filter((node) => node.id !== id),
                edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
                selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
            });
        },

        setSelectedNodeId: (id) => {
            set({ selectedNodeId: id });
        },

        isSimulating: false,

        simulationLogs: [],

        clearLogs: () => set({ simulationLogs: [] }),

        runSimulation: async () => {
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

            // Create a blob and trigger a download
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
                        simulationLogs: [] // Reset logs on new import
                    });
                } else {
                    throw new Error("Invalid file structure");
                }
            } catch (error) {
                console.error("Failed to import workflow:", error);
                alert("Invalid workflow file.");
            }
        },
    }),
        {
            name: 'hr-workflow-storage', // 3. Unique name for the key in LocalStorage
        }
    ));