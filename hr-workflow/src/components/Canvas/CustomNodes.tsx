import { Handle, Position } from '@xyflow/react';
import { useWorkflowStore } from '../../store/useWorkflowStore';


const BaseNode = ({ id, title, color, children, hasTarget, hasSource, selected }: any) => {
    const isInvalid = useWorkflowStore(state => state.invalidNodes.includes(id));

    return (
        <div className={`bg-white rounded-xl w-48 overflow-hidden transition-all duration-200 border-2 ${isInvalid
            ? 'border-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)] animate-pulse' // The error state
            : selected
                ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.15)] scale-[1.02]'
                : 'border-slate-200 shadow-md hover:border-slate-300'
            }`}>
            {hasTarget && <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400 border-2 border-white" />}

            <div className={`h-2 w-full ${color}`} />
            <div className="p-3">
                <div className="text-xs font-bold text-slate-800 truncate mb-1">{title}</div>
                <div className="text-[10px] text-slate-500">{children}</div>
            </div>

            {hasSource && <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400 border-2 border-white" />}
        </div>
    );
}

export const StartNode = ({ id, data, selected }: any) => (
    <BaseNode id={id} title={data.title} color="bg-emerald-500" hasSource selected={selected}>
        Workflow Entry
    </BaseNode>
);
export const TaskNode = ({ id, data, selected }: any) => (
    <BaseNode id={id} title={data.title} color="bg-blue-500" hasTarget hasSource selected={selected}>
        Assignee: {data.assignee || 'Unassigned'}
    </BaseNode>
);

export const ApprovalNode = ({ id, data, selected }: any) => (
    <BaseNode id={id} title={data.title} color="bg-amber-500" hasTarget hasSource selected={selected}>
        Role: {data.role || 'Unassigned'}
    </BaseNode>
);

export const AutomatedNode = ({ id, data, selected }: any) => (
    <BaseNode id={id} title={data.title} color="bg-purple-500" hasTarget hasSource selected={selected}>
        Action: {data.actionId || 'None selected'}
    </BaseNode>
);

export const EndNode = ({ id, data, selected }: any) => (
    <BaseNode id={id} title={data.title} color="bg-rose-500" hasTarget selected={selected}>
        Workflow Complete
    </BaseNode>
);