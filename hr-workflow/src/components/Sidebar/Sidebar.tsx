import React from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export const Sidebar = () => {
    const nodes = useWorkflowStore((state) => state.nodes);

    const hasStartNode = nodes.some((n) => n.type === 'startNode');
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 p-4 shadow-sm flex flex-col z-10">
            <h2 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Node Palette</h2>
            <div className="space-y-3">
                <div className="text-xs text-slate-500 mb-2">Drag to add:</div>

                <div
                    className={`p-3 rounded-xl border-2 text-sm font-bold flex items-center gap-3 transition-all ${hasStartNode
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-grab hover:shadow-md hover:scale-[1.02]'
                        }`}
                    onDragStart={(event) => !hasStartNode && onDragStart(event, 'startNode')}
                    draggable={!hasStartNode}
                >
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    {hasStartNode ? 'Start Node (Active)' : 'Start Node'}
                </div>

                <div
                    className="p-3 border-2 border-blue-200 bg-blue-50 text-blue-700 rounded cursor-grab font-medium text-sm"
                    onDragStart={(e) => onDragStart(e, 'taskNode')} draggable
                >
                    Task Node
                </div>

                <div
                    className="p-3 border-2 border-amber-200 bg-amber-50 text-amber-700 rounded cursor-grab font-medium text-sm"
                    onDragStart={(e) => onDragStart(e, 'approvalNode')} draggable
                >
                    Approval Node
                </div>

                <div
                    className="p-3 border-2 border-purple-200 bg-purple-50 text-purple-700 rounded cursor-grab font-medium text-sm"
                    onDragStart={(e) => onDragStart(e, 'automatedNode')} draggable
                >
                    Automated Step
                </div>

                <div
                    className="p-3 border-2 border-rose-200 bg-rose-50 text-rose-700 rounded cursor-grab font-medium text-sm"
                    onDragStart={(e) => onDragStart(e, 'endNode')} draggable
                >
                    End Node
                </div>
            </div>
        </aside>
    );
};