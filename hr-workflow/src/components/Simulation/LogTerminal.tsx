import { useWorkflowStore } from '../../store/useWorkflowStore';

export const LogTerminal = () => {
    const { simulationLogs, clearLogs, selectedNodeId } = useWorkflowStore();

    // Only show if there are logs to display
    const isOpen = simulationLogs.length > 0;
    const isEditorOpen = !!selectedNodeId;

    return (
        <div
            className={`fixed bottom-0 left-64 right-80 bg-slate-900 text-slate-300 font-mono text-xs transition-transform duration-500 ease-in-out z-40 shadow-2xl rounded-t-xl border-t border-slate-700 ${isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
            style={{
                height: '200px',
                left: '272px',
                right: isEditorOpen ? '336px' : '16px'
            }}
        >
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-slate-900/50 rounded-t-xl sticky top-0">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">
                    Simulation Output
                </span>
                <button
                    onClick={clearLogs}
                    className="hover:text-white transition-colors"
                >✕</button>
            </div>

            <div className="p-4 overflow-y-auto h-[160px] space-y-1">
                {simulationLogs.map((log, i) => (
                    <div key={i} className="flex gap-3 border-b border-slate-800/50 pb-1">
                        <span className="text-slate-500 whitespace-nowrap">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className={`font-bold w-12 ${log.level === 'error' ? 'text-rose-500' :
                            log.level === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {log.level.toUpperCase()}
                        </span>
                        <span className="text-slate-200">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};