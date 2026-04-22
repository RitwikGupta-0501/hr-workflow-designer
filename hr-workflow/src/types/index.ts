// Base structure every node must follow
export interface BaseNodeData {
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
    autoApproveThreshold?: number;
}

export interface AutomatedNodeData extends BaseNodeData {
    actionId: string;
    actionParameters?: Record<string, any>;
}

export interface EndNodeData extends BaseNodeData {
    message?: string;
    isSummary?: boolean;
}

// A discriminated union to strongly type the node payloads across the app
export type WorkflowNodeData =
    | StartNodeData
    | TaskNodeData
    | ApprovalNodeData
    | AutomatedNodeData
    | EndNodeData;