import { useRef } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export const Header = () => {
    const { runSimulation, isSimulating, exportWorkflow, importWorkflow, undo,
        redo,
        past,
        future,
        autoLayout,
        workflowName,
        setWorkflowName
    } = useWorkflowStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (content) importWorkflow(content);
            };
            reader.readAsText(file);
        }
        if (event.target) event.target.value = '';
    };

    return (
        <header className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-3 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200">
            {/* Workflow Name Input */}
            <div className="flex items-center px-2">
                <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 outline-none w-40 focus:border-b-2 focus:border-indigo-500 transition-all placeholder-slate-400"
                    placeholder="Name your workflow..."
                />
            </div>

            {/* History Controls */}
            <div className="flex gap-1">
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors ${canUndo
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 cursor-not-allowed'
                        }`}
                    title="Undo (Ctrl+Z)"
                >
                    <span>↩</span>
                </button>

                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors ${canRedo
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 cursor-not-allowed'
                        }`}
                    title="Redo (Ctrl+Y)"
                >
                    <span>↪</span>
                </button>

                {/* Auto Layout Button */}
                <button
                    onClick={autoLayout}
                    className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-colors text-slate-700 hover:bg-slate-100 hover:text-indigo-600"
                    title="Auto-organize Workflow"
                >
                    <span>✨</span>
                </button>
            </div>

            <div className="w-px h-8 bg-slate-200 mx-1 self-center" />

            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
                📥 Import
            </button>

            <button
                onClick={exportWorkflow}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
                📤 Export
            </button>

            <div className="w-px h-8 bg-slate-200 mx-1 self-center" />

            <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`px-6 py-2 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 ${isSimulating
                    ? 'bg-slate-400 cursor-not-allowed text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                    }`}
            >
                {isSimulating ? <span className="animate-spin">⏳</span> : <span>▶</span>}
            </button>
        </header>
    );
};