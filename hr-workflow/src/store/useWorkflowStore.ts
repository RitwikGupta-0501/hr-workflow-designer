import { create } from 'zustand';
import {
    type Connection,
    type Edge,
    type EdgeChange,
    type Node,
    type NodeChange,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges
} from 'reactflow';
import type { WorkflowNodeData } from '../types';

// Define the shape of our store
interface WorkflowState {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;

    // React Flow synchronization handlers
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;

    // Custom business logic
    addNode: (type: string) => void;
    updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
    deleteNode: (id: string) => void;
    setSelectedNodeId: (id: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    // 1. Initial State
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

    // 2. React Flow Handlers (Standard boilerplate to make drag-and-drop work)
    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },
    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) });
    },

    // 3. Custom Mutations
    addNode: (type) => {
        const id = `${type}-${Date.now()}`;
        const newNode: Node<WorkflowNodeData> = {
            id,
            type,
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
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
    }
}));