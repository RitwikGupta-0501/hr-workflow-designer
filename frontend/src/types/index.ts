// Base structure every node must follow
export interface BaseNodeData {
    [key: string]: unknown;
    title: string;
}

// Specific schemas for each Node Type
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

// A discriminated union to strongly type the node payloads across the app
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