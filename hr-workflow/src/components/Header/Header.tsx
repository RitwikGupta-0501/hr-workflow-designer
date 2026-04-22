import { useWorkflowStore } from '../../store/useWorkflowStore';

export const Header = () => {
    const { runSimulation, isSimulating } = useWorkflowStore();

    return (
        <header className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-4">
            <button
                onClick={runSimulation}
                disabled={isSimulating}
                className={`px-6 py-2.5 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 ${isSimulating
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                    }`}
            >
                {isSimulating ? (
                    <span className="animate-spin text-lg">⏳</span>
                ) : (
                    <span>▶</span>
                )}
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </button>
        </header>
    );
};