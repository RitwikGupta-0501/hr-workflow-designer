/**
 * Simulation Store - Simulation execution state
 * Handles simulation logs, execution summaries
 */

import { create } from 'zustand';
import type { SimulationLog } from '../types';
import { simulationsApi } from '../api/simulations';

export interface ExecutionSummary {
    totalLogs: number;
    tasks: number;
    approvals: number;
    automations: number;
    endMessage: string;
}

export interface SimulationState {
    isSimulating: boolean;
    simulationLogs: SimulationLog[];
    executionSummary: ExecutionSummary | null;

    clearLogs: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    runSimulation: (nodes: any[], edges: any[], workflowName: string) => Promise<void>;
}

export const useSimulationStore = create<SimulationState>((set) => ({
    isSimulating: false,
    simulationLogs: [],
    executionSummary: null,

    clearLogs: () => set({ simulationLogs: [], executionSummary: null }),

    runSimulation: async (nodes, edges, workflowName) => {
        set({ isSimulating: true, simulationLogs: [], executionSummary: null });

        try {
            const response = await simulationsApi.runSimulation({
                workflowName,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nodes: nodes as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                edges: edges as any,
            });

            const endNode = nodes.find(n => n.type === 'endNode');
            let summary = null;

            if (endNode) {
                const endData = endNode.data as import('../types').EndNodeData;
                if (endData.summaryFlag) {
                    summary = {
                        totalLogs: response.executionLog.length,
                        tasks: nodes.filter(n => n.type === 'taskNode').length,
                        approvals: nodes.filter(n => n.type === 'approvalNode').length,
                        automations: nodes.filter(n => n.type === 'automatedNode').length,
                        endMessage: endData.endMessage || 'Workflow finished successfully.',
                    };
                }
            }

            set({
                simulationLogs: response.executionLog,
                executionSummary: summary,
                isSimulating: false
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            set({
                simulationLogs: [{
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: msg
                }],
                isSimulating: false
            });
        }
    },
}));
