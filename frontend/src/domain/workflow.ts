export type WorkflowNodeType =
    | 'startNode'
    | 'taskNode'
    | 'approvalNode'
    | 'automatedNode'
    | 'endNode';

export interface WorkflowNodePosition {
    x: number;
    y: number;
}

// Base structure every workflow node payload must follow.
export interface BaseNodeData {
    [key: string]: unknown;
    title: string;
}

export interface StartNodeData extends BaseNodeData {
    metadata?: Record<string, string>;
}

export interface TaskNodeData extends BaseNodeData {
    description?: string;
    assignee?: string;
    dueDate?: string;
    customFields?: Record<string, string>;
}

export interface ApprovalNodeData extends BaseNodeData {
    role: 'Manager' | 'HRBP' | 'Director' | '';
    threshold?: number;
}

export interface AutomatedNodeData extends BaseNodeData {
    actionId: string;
    actionParams?: Record<string, string>;
}

export interface EndNodeData extends BaseNodeData {
    endMessage?: string;
    summaryFlag?: boolean;
}

export type WorkflowNodeData =
    | StartNodeData
    | TaskNodeData
    | ApprovalNodeData
    | AutomatedNodeData
    | EndNodeData;

export interface WorkflowNodeDto<TData extends WorkflowNodeData = WorkflowNodeData> {
    id: string;
    type: WorkflowNodeType;
    position: WorkflowNodePosition;
    data: TData;
}

export interface WorkflowEdgeDto {
    id: string;
    source: string;
    target: string;
    label?: string;
    labelStyle?: {
        fill?: string;
        fontWeight?: number;
        fontSize?: number;
    };
    labelBgStyle?: {
        fill?: string;
        color?: string;
    };
    labelBgPadding?: [number, number];
    labelBgBorderRadius?: number;
}

export interface SimulationLog {
    timestamp: string;
    level: 'info' | 'error' | 'warning';
    message: string;
}

export interface AutomationAction {
    id: string;
    name: string;
    requiredParams: string[];
}

export interface WorkflowTemplateDto {
    id: string;
    name: string;
    type: WorkflowNodeType;
    data: Partial<WorkflowNodeData>;
}

export interface WorkflowDraftDto {
    workflowName: string;
    nodes: WorkflowNodeDto[];
    edges: WorkflowEdgeDto[];
    userTemplates: WorkflowTemplateDto[];
}

export interface EditorBootstrapResponse {
    draft: WorkflowDraftDto;
    automationActions: AutomationAction[];
}

export interface EditorSimulationRequest {
    workflowName: string;
    // Accept either full DTO types or xyflow Node/Edge types
    // The backend will accept both formats
    nodes: Array<{
        id: string;
        type: string;
        position?: { x: number; y: number };
        data: WorkflowNodeData;
        [key: string]: unknown;
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        label?: string;
        [key: string]: unknown;
    }>;
}

export interface EditorSimulationResponse {
    executionLog: SimulationLog[];
    status: 'success' | 'failed';
}
