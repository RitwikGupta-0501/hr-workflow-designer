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

export interface UserTemplate {
    id: string;
    name: string;
    type: string;
    data: Partial<WorkflowNodeData>;
}

export interface ExecutionSummary {
    totalLogs: number;
    tasks: number;
    approvals: number;
    automations: number;
    endMessage: string;
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
    workflowName: string;
    userTemplates: UserTemplate[];
    executionSummary: ExecutionSummary | null;
    selectedEdgeId: string | null;

    setSelectedEdgeId: (id: string | null) => void;
    updateEdgeLabel: (id: string, label: string) => void;
    deleteEdge: (id: string) => void;
    saveNodeAsTemplate: (nodeId: string, templateName: string) => void;
    deleteTemplate: (templateId: string) => void;
    onNodesChange: OnNodesChange<Node<WorkflowNodeData>>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    addNode: (type: string, position: { x: number, y: number }, templateData: Partial<WorkflowNodeData>) => void;
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
    setWorkflowName: (name: string) => void;
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
        workflowName: 'Untitled Workflow',
        userTemplates: [],
        executionSummary: null,
        selectedEdgeId: null,

        setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

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
                selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId
            });
            if (Object.keys(get().invalidNodes).length > 0) {
                get().validateWorkflow();
            }
        },

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

        setWorkflowName: (name: string) => {
            set({ workflowName: name });
        },

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

        deleteNode: (id) => {
            get().saveHistory();
            set({
                nodes: get().nodes.filter((node) => node.id !== id),
                edges: get().edges.filter((edge) => edge.source !== id && edge.target !== id),
                selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId
            });
            get().validateWorkflow();
        },

        setSelectedNodeId: (id) => {
            set({ selectedNodeId: id });
        },


        clearLogs: () => set({ simulationLogs: [], executionSummary: null }),

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

            get().autoLayout();

            const { nodes, edges } = get();
            set({ isSimulating: true, simulationLogs: [], executionSummary: null });

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

                const endNode = nodes.find(n => n.type === 'endNode');
                let summary = null;

                if (endNode && endNode.data.summaryFlag) {
                    summary = {
                        totalLogs: data.executionLog.length,
                        tasks: nodes.filter(n => n.type === 'taskNode').length,
                        approvals: nodes.filter(n => n.type === 'approvalNode').length,
                        automations: nodes.filter(n => n.type === 'automatedNode').length,
                        endMessage: endNode.data.endMessage || 'Workflow finished successfully.',
                    };
                }

                set({
                    simulationLogs: data.executionLog,
                    executionSummary: summary,
                    isSimulating: false
                });
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                set({
                    simulationLogs: [{
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: msg
                    }],
                    isSimulating: false
                });
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

        importWorkflow: (jsonString: string) => {
            try {
                const data = JSON.parse(jsonString);
                if (data.nodes && data.edges) {
                    set({
                        workflowName: data.workflowName || 'Imported Workflow',
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
    }),
        {
            name: 'hr-workflow-storage',
        }
    ));