import React, { useState, useEffect } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';

const KeyValueEditor = ({ label, pairs = [], onChange }: any) => {
    const addPair = () => onChange([...pairs, { key: '', value: '' }]);
    const updatePair = (index: number, field: 'key' | 'value', val: string) => {
        const newPairs = [...pairs];
        newPairs[index][field] = val;
        onChange(newPairs);
    };
    const removePair = (index: number) => onChange(pairs.filter((_: any, i: number) => i !== index));

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">{label}</label>
            {pairs.map((pair: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Key"
                        value={pair.key}
                        onChange={(e) => updatePair(i, 'key', e.target.value)}
                        className="w-1/2 p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        value={pair.value}
                        onChange={(e) => updatePair(i, 'value', e.target.value)}
                        className="w-1/2 p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => removePair(i)} className="text-slate-400 hover:text-rose-500 p-1">✕</button>
                </div>
            ))}
            <button
                onClick={addPair}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-1"
            >
                + Add Field
            </button>
        </div>
    );
};

// --- Node Specific Forms ---

const StartFields = ({ node, updateData }: any) => (
    <div className="space-y-4 pt-4 border-t border-slate-100">
        <KeyValueEditor
            label="Metadata (Key-Value Pairs)"
            pairs={node.data.metadata || []}
            onChange={(val: any) => updateData(node.id, { metadata: val })}
        />
    </div>
);

const TaskFields = ({ node, updateData }: any) => (
    <div className="space-y-4 pt-4 border-t border-slate-100">
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Description</label>
            <textarea
                placeholder="Enter task details..."
                value={node.data.description || ''}
                onChange={(e) => updateData(node.id, { description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
            />
        </div>
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

        <KeyValueEditor
            label="Custom Fields"
            pairs={node.data.customFields || []}
            onChange={(val: any) => updateData(node.id, { customFields: val })}
        />
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
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Auto-Approve Threshold ($)</label>
            <input
                type="number"
                placeholder="e.g. 500"
                value={node.data.threshold || ''}
                onChange={(e) => updateData(node.id, { threshold: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            />
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
    const actionParams = node.data.actionParams || {};

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
                        // Reset params when action changes
                        onChange={(e) => updateData(node.id, { actionId: e.target.value, actionParams: {} })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Select an action</option>
                        {actions.map((action) => (
                            <option key={action.id} value={action.id}>{action.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Dynamic Parameter Inputs based on Mock API definition */}
            {selectedAction && selectedAction.requiredParams.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3 mt-4">
                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">Action Parameters</p>
                    {selectedAction.requiredParams.map((param: string) => (
                        <div key={param}>
                            <label className="block text-xs font-semibold text-purple-600 mb-1 capitalize">{param}</label>
                            <input
                                type="text"
                                value={actionParams[param] || ''}
                                onChange={(e) => updateData(node.id, {
                                    actionParams: { ...actionParams, [param]: e.target.value }
                                })}
                                className="w-full p-2 text-sm bg-white border border-purple-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const EndFields = ({ node, updateData }: any) => (
    <div className="space-y-4 pt-4 border-t border-slate-100">
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">End Message</label>
            <textarea
                placeholder="Message to display on completion..."
                value={node.data.endMessage || ''}
                onChange={(e) => updateData(node.id, { endMessage: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 resize-none h-20"
            />
        </div>
        <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
                type="checkbox"
                id="summaryFlag"
                checked={node.data.summaryFlag || false}
                onChange={(e) => updateData(node.id, { summaryFlag: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
            />
            <label htmlFor="summaryFlag" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                Generate Execution Summary
            </label>
        </div>
    </div>
);

export const NodeEditor = () => {
    const {
        nodes, edges, selectedNodeId, selectedEdgeId,
        updateNodeData, updateEdgeLabel,
        setSelectedNodeId, setSelectedEdgeId,
        deleteNode, deleteEdge,
        saveNodeAsTemplate, invalidNodes
    } = useWorkflowStore();

    // Track a unified active item
    const [activeItem, setActiveItem] = useState<{ type: 'node' | 'edge', data: any } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');

    useEffect(() => {
        if (selectedNodeId) {
            const node = nodes.find((n) => n.id === selectedNodeId);
            if (node) setActiveItem({ type: 'node', data: node });
        } else if (selectedEdgeId) {
            const edge = edges.find((e) => e.id === selectedEdgeId);
            if (edge) setActiveItem({ type: 'edge', data: edge });
        }
    }, [selectedNodeId, selectedEdgeId, nodes, edges]);

    const isOpen = !!selectedNodeId || !!selectedEdgeId;
    const nodeErrors = activeItem?.type === 'node' ? invalidNodes[activeItem.data.id] : null;

    const handleClose = () => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
    };

    const handleSaveTemplateClick = () => {
        if (activeItem?.type !== 'node') return;

        setTemplateName(`${activeItem.data.data.title} Template`);
        setIsModalOpen(true);
    };

    const confirmSaveTemplate = () => {
        if (activeItem?.type !== 'node') return;

        if (templateName.trim() !== "") {
            saveNodeAsTemplate(activeItem.data.id, templateName.trim());
            setIsModalOpen(false);
            setTemplateName('');
        }
    };

    return (
        <>
            <aside
                className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-40 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-700 truncate">
                        {activeItem?.type === 'node' ? `Editing: ${activeItem.data.data.title} ` : 'Edit Connection'}
                    </h2>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                </div>

                <div className="p-6 flex flex-col overflow-y-auto h-[calc(100%-60px)]">

                    {/* NODE EDITING MODE */}
                    {activeItem?.type === 'node' && (
                        <>
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

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-tight">
                                    Node Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={activeItem.data.data.title || ''}
                                    onChange={(e) => updateNodeData(activeItem.data.id, { title: e.target.value })}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                />

                                {activeItem.data.type === 'startNode' && <StartFields node={activeItem.data} updateData={updateNodeData} />}
                                {activeItem.data.type === 'taskNode' && <TaskFields node={activeItem.data} updateData={updateNodeData} />}
                                {activeItem.data.type === 'approvalNode' && <ApprovalFields node={activeItem.data} updateData={updateNodeData} />}
                                {activeItem.data.type === 'automatedNode' && <AutomatedFields node={activeItem.data} updateData={updateNodeData} />}
                                {activeItem.data.type === 'endNode' && <EndFields node={activeItem.data} updateData={updateNodeData} />}
                            </div>

                            <div className="pt-8 mt-auto border-t border-slate-100 space-y-3">
                                {/* Save Template & Delete Node Buttons */}
                                <button
                                    onClick={handleSaveTemplateClick}
                                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>💾</span> Save as Template
                                </button>

                                <button
                                    onClick={() => {
                                        deleteNode(activeItem.data.id);
                                        handleClose();
                                    }}
                                    className="w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-semibold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>🗑️</span> Delete Node
                                </button>
                            </div>
                        </>
                    )}

                    {/* EDGE EDITING MODE */}
                    {activeItem?.type === 'edge' && (
                        <div className="flex flex-col h-full">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 tracking-tight">
                                Connection Label
                            </label>
                            <input
                                type="text"
                                value={activeItem.data.label || ''}
                                onChange={(e) => updateEdgeLabel(activeItem.data.id, e.target.value)}
                                placeholder="e.g. Approved, Rejected"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                            />

                            <div className="pt-8 mt-auto border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        deleteEdge(activeItem.data.id);
                                        handleClose();
                                    }}
                                    className="w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-semibold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>🗑️</span> Delete Connection
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {isModalOpen && (
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
            )}
        </>
    );
};