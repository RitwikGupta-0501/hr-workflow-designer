import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';


const TaskFields = ({ node, updateData }: any) => (
    <div className="space-y-4 pt-4 border-t border-slate-100">
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Assignee</label>
            <input
                type="text"
                placeholder="e.g. John Doe"
                value={node.data.assignee || ''}
                onChange={(e) => updateData(node.id, { assignee: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Due Date</label>
            <input
                type="date"
                value={node.data.dueDate || ''}
                onChange={(e) => updateData(node.id, { dueDate: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    </div>
);

const ApprovalFields = ({ node, updateData }: any) => (
    <div className="space-y-4 pt-4 border-t border-slate-100">
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Approval Role</label>
            <select
                value={node.data.role || ''}
                onChange={(e) => updateData(node.id, { role: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            >
                <option value="">Select Role</option>
                <option value="Manager">Manager</option>
                <option value="HRBP">HRBP</option>
                <option value="Director">Director</option>
            </select>
        </div>
    </div>
);

const AutomatedFields = ({ node, updateData }: any) => {
    const [actions, setActions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch('/automations')
            .then((res) => res.json())
            .then((data) => {
                setActions(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const selectedAction = actions.find(a => a.id === node.data.actionId);

    return (
        <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    Automated Action
                </label>
                {loading ? (
                    <div className="animate-pulse h-10 bg-slate-100 rounded-lg" />
                ) : (
                    <select
                        value={node.data.actionId || ''}
                        onChange={(e) => updateData(node.id, { actionId: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Select an action</option>
                        {actions.map((action) => (
                            <option key={action.id} value={action.id}>{action.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {selectedAction && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                    <p className="text-[10px] font-bold text-purple-700 uppercase mb-2">Required Parameters:</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedAction.requiredParams.map((param: string) => (
                            <span key={param} className="px-2 py-1 bg-white text-purple-600 text-[10px] rounded border border-purple-200 font-mono">
                                {param}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const NodeEditor = () => {
    const { nodes, selectedNodeId, updateNodeData, setSelectedNodeId, deleteNode, invalidNodes, saveNodeAsTemplate } = useWorkflowStore();

    const [activeNode, setActiveNode] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');

    useEffect(() => {
        const selectedNode = nodes.find((n) => n.id === selectedNodeId);
        if (selectedNode) {
            setActiveNode(selectedNode);
        }
    }, [selectedNodeId, nodes]);
    const isOpen = !!selectedNodeId;

    if (!activeNode) return null;
    const nodeErrors = invalidNodes[activeNode.id];

    const handleSaveTemplateClick = () => {
        if (!activeNode) return;
        setTemplateName(`${activeNode.data.title} Template`); // Pre-fill with a smart default
        setIsModalOpen(true);
    };

    const confirmSaveTemplate = () => {
        if (templateName.trim() !== "") {
            saveNodeAsTemplate(activeNode.id, templateName.trim());
            setIsModalOpen(false);
            setTemplateName(''); // Reset for next time
        }
    };

    return (
        <>
            <aside
                className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-700 truncate">
                        {activeNode ? `Editing: ${activeNode.data.title} ` : 'Settings'}
                    </h2>
                    <button
                        onClick={() => setSelectedNodeId(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >✕</button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-60px)]">
                    {/* --- THE ERROR BANNER --- */}
                    {nodeErrors && nodeErrors.length > 0 && (
                        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-fade-in">
                            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-1">
                                <span>⚠️</span> Validation Errors
                            </div>
                            <ul className="list-disc list-inside text-xs text-rose-600 space-y-1">
                                {nodeErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* We use activeNode here so the inputs stay populated during the slide-out */}
                    {activeNode && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-tight">
                                Node Title
                            </label>
                            <input
                                type="text"
                                value={activeNode.data.title}
                                onChange={(e) => updateNodeData(activeNode.id, { title: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                            />
                            {/* Inside the NodeEditor return block, below the Title input */}
                            {activeNode.type === 'taskNode' && (
                                <TaskFields node={activeNode} updateData={updateNodeData} />
                            )}
                            {activeNode.type === 'approvalNode' && (
                                <ApprovalFields node={activeNode} updateData={updateNodeData} />
                            )}
                            {activeNode.type === 'automatedNode' && (
                                <AutomatedFields node={activeNode} updateData={updateNodeData} />
                            )}
                        </div>
                    )}<div className="pt-8 mt-6 border-t border-slate-100">
                        <button
                            onClick={() => {
                                deleteNode(activeNode.id);
                                setSelectedNodeId(null);
                            }}
                            className="w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-semibold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>🗑️</span> Delete Node
                        </button>
                    </div>

                    {/* Push this button to the bottom using mt-auto */}
                    <div className="mt-auto pt-6 border-t border-slate-200">
                        <button
                            onClick={handleSaveTemplateClick}
                            className="w-full py-2 px-4 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-sm rounded-xl transition-colors border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-2"
                        >
                            <span>💾</span> Save as Template
                        </button>
                    </div>
                </div>
            </aside>

            {/* 4. THE CUSTOM MODAL */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    💾
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Save Template</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-5 ml-11">
                                Name your custom configuration to reuse it later from the sidebar.
                            </p>

                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && confirmSaveTemplate()}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all mb-6 text-sm font-semibold text-slate-700"
                                placeholder="e.g. HR Email Alert"
                                autoFocus
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSaveTemplate}
                                    disabled={!templateName.trim()}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};