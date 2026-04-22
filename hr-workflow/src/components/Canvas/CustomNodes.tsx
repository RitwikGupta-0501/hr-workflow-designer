import { Handle, Position } from '@xyflow/react';

// A reusable UI wrapper to ensure all nodes look like a cohesive SaaS product
const BaseNode = ({ title, color, children, hasTarget, hasSource }: any) => (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 w-48 overflow-hidden">
        {hasTarget && <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400 border-2 border-white" />}

        <div className={`h-2 w-full ${color}`} />
        <div className="p-3">
            <div className="text-xs font-bold text-slate-800 truncate mb-1">{title}</div>
            <div className="text-[10px] text-slate-500">{children}</div>
        </div>

        {hasSource && <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400 border-2 border-white" />}
    </div>
);

// The 5 specific nodes required by the case study
export const StartNode = ({ data }: any) => (
    <BaseNode title={data.title} color="bg-emerald-500" hasSource>
        Workflow Entry
    </BaseNode>
);

export const TaskNode = ({ data }: any) => (
    <BaseNode title={data.title} color="bg-blue-500" hasTarget hasSource>
        Assignee: {data.assignee || 'Unassigned'}
    </BaseNode>
);

export const ApprovalNode = ({ data }: any) => (
    <BaseNode title={data.title} color="bg-amber-500" hasTarget hasSource>
        Role: {data.role || 'Unassigned'}
    </BaseNode>
);

export const AutomatedNode = ({ data }: any) => (
    <BaseNode title={data.title} color="bg-purple-500" hasTarget hasSource>
        Action: {data.actionId || 'None selected'}
    </BaseNode>
);

export const EndNode = ({ data }: any) => (
    <BaseNode title={data.title} color="bg-rose-500" hasTarget>
        Workflow Complete
    </BaseNode>
);