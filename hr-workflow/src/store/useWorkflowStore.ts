import { create } from 'zustand';
import {
    type Connection,
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

// Define the shape of our store
interface WorkflowState {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    selectedNodeId: string | null;

    // Use XYFlow's native handler types to satisfy the strict compiler
    onNodesChange: OnNodesChange<Node<WorkflowNodeData>>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    // Custom business logic
    addNode: (type: string, position: { x: number, y: number }) => void;
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
    }
}));