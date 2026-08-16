/**
 * Simulations API client
 * Handles workflow simulation execution
 */

import { httpClient } from './http';
import type { EditorSimulationRequest, EditorSimulationResponse } from '../domain/workflow';

export const simulationsApi = {
    /**
     * Run a workflow simulation with the given nodes and edges
     */
    async runSimulation(request: EditorSimulationRequest): Promise<EditorSimulationResponse> {
        return httpClient.post<EditorSimulationResponse>('/simulate', request);
    },
};
