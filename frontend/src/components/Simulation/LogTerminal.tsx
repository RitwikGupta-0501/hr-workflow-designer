import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useEffect, useRef } from 'react';
import type { SimulationLog } from '../../types';

export const LogTerminal = () => {
    const { simulationLogs, isSimulating, clearLogs, executionSummary } = useWorkflowStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [simulationLogs, executionSummary]);

    if (simulationLogs.length === 0 && !isSimulating) return null;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-30 font-mono flex flex-col max-h-64 animate-fade-in">
            {/* Header */}
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-xs text-slate-300 font-bold tracking-wider uppercase">Execution Log</span>
                </div>
                <button onClick={clearLogs} className="text-slate-500 hover:text-slate-300 text-xs transition-colors">Clear</button>
            </div>

            {/* Log Stream */}
            <div className="p-4 overflow-y-auto text-sm space-y-2">
                {simulationLogs.map((log: SimulationLog, i: number) => (
                    <div key={i} className={`flex gap-3 ${log.level === 'error' ? 'text-rose-400' : 'text-slate-300'}`}>
                        <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span>{log.message}</span>
                    </div>
                ))}

                {/* 2. THE SUMMARY DASHBOARD */}
                {executionSummary && !isSimulating && (
                    <div className="mt-6 p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-xl animate-fade-in">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-indigo-400">📊</span>
                            <h4 className="text-indigo-300 font-bold uppercase tracking-widest text-xs">Execution Summary</h4>
                        </div>

                        {executionSummary.endMessage && (
                            <div className="mb-4 text-indigo-100 text-sm italic border-l-2 border-indigo-500 pl-3">
                                "{executionSummary.endMessage}"
                            </div>
                        )}

                        <div className="grid grid-cols-4 gap-4 text-xs mt-4">
                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                <span className="text-slate-500 block mb-1">Total Steps</span>
                                <span className="text-slate-200 font-bold text-lg">{executionSummary.totalLogs}</span>
                            </div>
                            <div className="bg-blue-900/20 p-2 rounded-lg border border-blue-900/30">
                                <span className="text-blue-500 block mb-1 uppercase tracking-wider text-[10px]">Tasks</span>
                                <span className="text-blue-200 font-bold text-lg">{executionSummary.tasks}</span>
                            </div>
                            <div className="bg-amber-900/20 p-2 rounded-lg border border-amber-900/30">
                                <span className="text-amber-500 block mb-1 uppercase tracking-wider text-[10px]">Approvals</span>
                                <span className="text-amber-200 font-bold text-lg">{executionSummary.approvals}</span>
                            </div>
                            <div className="bg-purple-900/20 p-2 rounded-lg border border-purple-900/30">
                                <span className="text-purple-500 block mb-1 uppercase tracking-wider text-[10px]">Automated</span>
                                <span className="text-purple-200 font-bold text-lg">{executionSummary.automations}</span>
                            </div>
                        </div>
                    </div>
                )}

                {isSimulating && <div className="text-slate-500 animate-pulse">Running simulation...</div>}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};