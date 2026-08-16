/**
 * Workflow Draft Store - Graph editing state
 * Handles nodes, edges, history, validation
 * Does NOT handle server persistence (that's workflowService)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import type { WorkflowNodeData } from '../types';
import dagre from 'dagre';

export interface UserTemplate {
    id: string;
    name: string;
    type: string;
    data: Partial<WorkflowNodeData>;
}

interface HistorySnapshot {
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
}

export interface WorkflowDraftState {
    workflowName: string;
    nodes: Node<WorkflowNodeData>[];
    edges: Edge[];
    past: HistorySnapshot[];
    future: HistorySnapshot[];
    invalidNodes: Record<string, string[]>;
    userTemplates: UserTemplate[];

    // Graph Operations
    onNodesChange: OnNodesChange<Node<WorkflowNodeData>>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (type: string, position: { x: number; y: number }, templateData: Partial<WorkflowNodeData>) => void;
    updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
    deleteNode: (id: string) => void;
    setSelectedEdgeId: (id: string | null) => void;
    updateEdgeLabel: (id: string, label: string) => void;
    deleteEdge: (id: string) => void;

    // Template Management
    saveNodeAsTemplate: (nodeId: string, templateName: string) => void;
    deleteTemplate: (templateId: string) => void;

    // Workflow Metadata
    setWorkflowName: (name: string) => void;

    // History & Undo/Redo
    saveHistory: () => void;
    undo: () => void;
    redo: () => void;

    // Validation
    validateWorkflow: () => boolean;

    // Layout
    autoLayout: () => void;

    // Import/Export
    importWorkflow: (jsonString: string) => void;
    exportWorkflow: () => void;
}

export const useWorkflowDraftStore = create<WorkflowDraftState>()(
    persist(
        (set, get) => ({
            workflowName: 'Untitled Workflow',
            nodes: [
                {
                    id: 'start-1',
                    type: 'startNode',
                    position: { x: 250, y: 50 },
                    data: { title: 'Workflow Entry Point' }
                }
            ],
            edges: [],
            past: [],
            future: [],
            invalidNodes: {},
            userTemplates: [],

            // Graph Operations
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

            onConnect: (connection) => {
                get().saveHistory();
                const newEdge = {
                    ...connection,
                    label: 'Transition',
                    labelStyle: { fill: '#475569', fontWeight: 700, fontSize: 12 },
                    labelBgStyle: { fill: '#f8fafc', color: '#f8fafc' },
                    labelBgPadding: [8, 4] as [number, number],
                    labelBgBorderRadius: 4,
                };
                set({ edges: addEdge(newEdge, get().edges) });

                if (Object.keys(get().invalidNodes).length > 0) {
                    get().validateWorkflow();
                }
            },

            addNode: (type, position, initialData) => {
                get().saveHistory();
                const id = `${type}-${Date.now()}`;

                const newNode: Node<WorkflowNodeData> = {
                    id,
                    type,
                    position,
                    data: {
                        title: `New ${type.replace('Node', '')}`,
                        ...initialData
                    }
                };

                set({ nodes: [...get().nodes, newNode] });
            },

            updateNodeData: (id, newData) => {
                get().saveHistory();
                set({
                    nodes: get().nodes.map((node) =>
                        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
                    ),
                });
                if (Object.keys(get().invalidNodes).length > 0) {
                    get().validateWorkflow();
                }
            },

            deleteNode: (id) => {
                get().saveHistory();
                set({
                    nodes: get().nodes.filter((node) => node.id !== id),
                    edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
                });
                get().validateWorkflow();
            },

            setSelectedEdgeId: () => {
                // This is handled by editor store now, but kept for compatibility
                // Could be removed in final cleanup
            },

            updateEdgeLabel: (id, label) => {
                get().saveHistory();
                set({
                    edges: get().edges.map((edge) => {
                        if (edge.id === id) {
                            return {
                                ...edge,
                                label,
                                labelStyle: edge.labelStyle || { fill: '#475569', fontWeight: 700, fontSize: 12 },
                                labelBgStyle: edge.labelBgStyle || { fill: '#f8fafc', color: '#f8fafc' },
                                labelBgPadding: edge.labelBgPadding || [8, 4],
                                labelBgBorderRadius: edge.labelBgBorderRadius || 4,
                            };
                        }
                        return edge;
                    })
                });
            },

            deleteEdge: (id) => {
                get().saveHistory();
                set({
                    edges: get().edges.filter(e => e.id !== id),
                });
                if (Object.keys(get().invalidNodes).length > 0) {
                    get().validateWorkflow();
                }
            },

            // Template Management
            saveNodeAsTemplate: (nodeId, templateName) => {
                const node = get().nodes.find(n => n.id === nodeId);
                if (!node) return;

                const newTemplate: UserTemplate = {
                    id: `template-${Date.now()}`,
                    name: templateName,
                    type: node.type || 'taskNode',
                    data: { ...node.data }
                };

                set({ userTemplates: [...get().userTemplates, newTemplate] });
            },

            deleteTemplate: (templateId) => {
                set({ userTemplates: get().userTemplates.filter(t => t.id !== templateId) });
            },

            // Workflow Metadata
            setWorkflowName: (name: string) => {
                set({ workflowName: name });
            },

            // History & Undo/Redo
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
                });
            },

            // Validation
            validateWorkflow: () => {
                const { nodes, edges } = get();
                const errors: Record<string, string[]> = {};

                nodes.forEach(node => {
                    const nodeErrors: string[] = [];

                    const hasIncoming = edges.some(e => e.target === node.id);
                    const hasOutgoing = edges.some(e => e.source === node.id);

                    if (node.type === 'startNode' && !hasOutgoing) nodeErrors.push('Missing outgoing connection.');
                    if (node.type === 'endNode' && !hasIncoming) nodeErrors.push('Missing incoming connection.');
                    if (['taskNode', 'approvalNode', 'automatedNode'].includes(node.type || '') && (!hasIncoming || !hasOutgoing)) {
                        nodeErrors.push('Must be connected on both sides.');
                    }

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

            // Layout
            autoLayout: () => {
                get().saveHistory();

                const { nodes, edges } = get();

                const dagreGraph = new dagre.graphlib.Graph();
                dagreGraph.setDefaultEdgeLabel(() => ({}));

                dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 80 });

                const nodeWidth = 200;
                const nodeHeight = 100;

                nodes.forEach((node) => {
                    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
                });

                edges.forEach((edge) => {
                    dagreGraph.setEdge(edge.source, edge.target);
                });

                dagre.layout(dagreGraph);

                const layoutedNodes = nodes.map((node) => {
                    const nodeWithPosition = dagreGraph.node(node.id);

                    return {
                        ...node,
                        position: {
                            x: nodeWithPosition.x - nodeWidth / 2,
                            y: nodeWithPosition.y - nodeHeight / 2,
                        },
                    };
                });

                set({ nodes: layoutedNodes });
            },

            // Import/Export
            importWorkflow: (jsonString: string) => {
                try {
                    const data = JSON.parse(jsonString);
                    if (data.nodes && data.edges) {
                        set({
                            workflowName: data.workflowName || 'Imported Workflow',
                            nodes: data.nodes,
                            edges: data.edges,
                        });
                    } else {
                        throw new Error("Invalid file structure");
                    }
                } catch (error) {
                    console.error("Failed to import workflow:", error);
                    alert("Invalid workflow file.");
                }
            },

            exportWorkflow: () => {
                const { nodes, edges, workflowName } = get();
                const exportData = JSON.stringify({ nodes, edges }, null, 2);

                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const safeName = workflowName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                link.href = url;
                link.download = `${safeName || 'workflow'}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            },
        }),
        {
            name: 'hr-workflow-draft-storage',
        }
    )
);
