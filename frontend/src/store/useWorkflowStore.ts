/**
 * DEPRECATED: This store is kept for backward compatibility.
 * Prefer using the new split stores:
 * - useWorkflowDraftStore: for graph editing
 * - useSimulationStore: for simulation execution
 * - useEditorStore: for UI state
 * 
 * This is a facade that delegates to the new stores.
 */

import { create } from 'zustand';
import type {
    Edge,
    Node,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from '@xyflow/react';
import type { WorkflowNodeData, SimulationLog } from '../types';
import { useWorkflowDraftStore } from './useWorkflowDraftStore';
import { useSimulationStore } from './useSimulationStore';
import { useEditorStore } from './useEditorStore';

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

export const useWorkflowStore = create<WorkflowState>(() => {
    // Subscribe to the child stores
    const getDraftState = () => useWorkflowDraftStore.getState();
    const getSimulationState = () => useSimulationStore.getState();
    const getEditorState = () => useEditorStore.getState();

    return {
        // Delegates to child stores
        get nodes() { return getDraftState().nodes; },
        get edges() { return getDraftState().edges; },
        get selectedNodeId() { return getEditorState().selectedNodeId; },
        get isSimulating() { return getSimulationState().isSimulating; },
        get simulationLogs() { return getSimulationState().simulationLogs; },
        get past() { return getDraftState().past; },
        get future() { return getDraftState().future; },
        get invalidNodes() { return getDraftState().invalidNodes; },
        get workflowName() { return getDraftState().workflowName; },
        get userTemplates() { return getDraftState().userTemplates; },
        get executionSummary() { return getSimulationState().executionSummary; },
        get selectedEdgeId() { return getEditorState().selectedEdgeId; },

        setSelectedEdgeId: (id) => getEditorState().setSelectedEdgeId(id),
        updateEdgeLabel: (id, label) => getDraftState().updateEdgeLabel(id, label),
        deleteEdge: (id) => getDraftState().deleteEdge(id),
        saveNodeAsTemplate: (nodeId, templateName) => getDraftState().saveNodeAsTemplate(nodeId, templateName),
        deleteTemplate: (templateId) => getDraftState().deleteTemplate(templateId),
        onNodesChange: (changes) => getDraftState().onNodesChange(changes),
        onEdgesChange: (changes) => getDraftState().onEdgesChange(changes),
        onConnect: (connection) => getDraftState().onConnect(connection),
        addNode: (type, position, templateData) => getDraftState().addNode(type, position, templateData),
        updateNodeData: (id, data) => getDraftState().updateNodeData(id, data),
        deleteNode: (id) => getDraftState().deleteNode(id),
        setSelectedNodeId: (id) => getEditorState().setSelectedNodeId(id),
        clearLogs: () => getSimulationState().clearLogs(),
        exportWorkflow: () => getDraftState().exportWorkflow(),
        importWorkflow: (jsonString) => getDraftState().importWorkflow(jsonString),
        saveHistory: () => getDraftState().saveHistory(),
        undo: () => getDraftState().undo(),
        redo: () => getDraftState().redo(),
        validateWorkflow: () => getDraftState().validateWorkflow(),
        autoLayout: () => getDraftState().autoLayout(),
        setWorkflowName: (name) => getDraftState().setWorkflowName(name),

        runSimulation: async () => {
            const isValid = getDraftState().validateWorkflow();

            if (!isValid) {
                useSimulationStore.setState({
                    simulationLogs: [{
                        timestamp: new Date().toISOString(),
                        level: 'error',
                        message: 'Simulation aborted: Workflow contains invalid or disconnected nodes.'
                    }]
                });
                return;
            }

            getDraftState().autoLayout();
            const { nodes, edges } = getDraftState();
            const { workflowName } = getDraftState();

            await getSimulationState().runSimulation(nodes, edges, workflowName);
        },
    };
});
