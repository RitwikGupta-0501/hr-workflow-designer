import React, { useState } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import type { WorkflowNodeData } from '../../types';

export const Sidebar = () => {
    const nodes = useWorkflowStore((state) => state.nodes);
    const hasStartNode = nodes.some((n) => n.type === 'startNode');

    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'palette' | 'templates'>('palette');

    const userTemplates = useWorkflowStore((state) => state.userTemplates);
    const deleteTemplate = useWorkflowStore((state) => state.deleteTemplate);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteTemplate(id);
    };

    const onDragStart = (event: React.DragEvent, nodeType: string, templateData?: WorkflowNodeData) => {
        event.dataTransfer.setData('application/reactflow', nodeType);

        // Pass template data if we are dragging a template
        if (templateData) {
            event.dataTransfer.setData('application/template-data', JSON.stringify(templateData));
        }
        event.dataTransfer.effectAllowed = 'move';

        // Create a slick "Ghost" element for the cursor
        const ghost = document.createElement('div');
        ghost.className = 'px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-xl border-2 border-white pointer-events-none absolute -top-[1000px]';
        ghost.innerHTML = `Adding ${nodeType.replace('Node', '')}...`;
        document.body.appendChild(ghost);

        event.dataTransfer.setDragImage(ghost, 50, 20);

        // Cleanup ghost after a short delay
        setTimeout(() => document.body.removeChild(ghost), 100);
    };

    return (
        <div className={`relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shadow-lg z-20`}>

            {/* The Toggle Button (Floats on the edge) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-4 top-6 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-indigo-600 z-50 transition-transform hover:scale-110"
            >
                {isOpen ? '◀' : '▶'}
            </button>

            {/* Sidebar Content (Hidden when collapsed) */}
            <div className={`flex flex-col h-full w-64 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 mt-2">
                    <button
                        onClick={() => setActiveTab('palette')}
                        className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'palette' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Palette
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'templates' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Templates
                    </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto">
                    {activeTab === 'palette' ? (
                        <>
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

                            <div className="p-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl cursor-grab hover:shadow-md hover:scale-[1.02] text-sm font-bold flex items-center gap-3 transition-all" onDragStart={(event) => onDragStart(event, 'taskNode')} draggable>
                                <div className="w-3 h-3 rounded-full bg-blue-500" /> Task Node
                            </div>

                            <div
                                className="p-3 border-2 border-amber-200 bg-amber-50 text-amber-700 rounded-xl cursor-grab hover:shadow-md hover:scale-[1.02] text-sm font-bold flex items-center gap-3 transition-all"
                                onDragStart={(e) => onDragStart(e, 'approvalNode')} draggable
                            >
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                Approval Node
                            </div>

                            <div
                                className="p-3 border-2 border-puple-200 bg-purple-50 text-purple-700 rounded-xl cursor-grab hover:shadow-md hover:scale-[1.02] text-sm font-bold flex items-center gap-3 transition-all"
                                onDragStart={(e) => onDragStart(e, 'automatedNode')} draggable
                            >
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                                Automated Step
                            </div>

                            <div
                                className="p-3 border-2 border-rose-200 bg-rose-50 text-rose-700 rounded-xl cursor-grab hover:shadow-md hover:scale-[1.02] text-sm font-bold flex items-center gap-3 transition-all"
                                onDragStart={(e) => onDragStart(e, 'endNode')} draggable
                            >
                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                End Node
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                                My Saved Templates
                            </div>

                            {userTemplates.length === 0 ? (
                                <div className="text-xs text-slate-400 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                                    No templates yet. Configure a node and click "Save as Template".
                                </div>
                            ) : (
                                userTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="p-3 bg-white border-2 border-slate-200 text-slate-800 rounded-xl cursor-grab hover:shadow-md hover:border-indigo-400 text-sm font-bold transition-all relative group"
                                        onDragStart={(event) => onDragStart(event, template.type, template.data)}
                                        draggable
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                            {template.name}
                                        </div>
                                        <div className="text-[10px] font-normal text-slate-500 truncate">
                                            Type: {template.type.replace('Node', '')}
                                        </div>

                                        {/* Subtle delete button that appears on hover */}
                                        <button
                                            onClick={(e) => handleDelete(e, template.id)}
                                            className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete template"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};