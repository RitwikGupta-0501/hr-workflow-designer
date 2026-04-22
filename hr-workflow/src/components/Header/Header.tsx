import { useRef } from 'react';
import { useWorkflowStore } from '../../store/useWorkflowStore';

export const Header = () => {
    const { runSimulation, isSimulating, exportWorkflow, importWorkflow } = useWorkflowStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Reset input so the same file can be uploaded again if needed
        if (event.target) event.target.value = '';
    };

    return (
        <header className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-3 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-200">

            {/* Hidden file input */}
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
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </button>
        </header>
    );
};