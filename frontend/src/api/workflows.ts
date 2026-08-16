/**
 * Workflows API client
 * Handles workflow CRUD operations
 */

import { httpClient } from './http';
import type { WorkflowDraftDto } from '../domain/workflow';

export interface WorkflowResponse {
    id: string;
    name: string;
    draft: WorkflowDraftDto;
    createdAt: string;
    updatedAt: string;
}

export const workflowsApi = {
    /**
     * Save a new workflow
     */
    async create(workflow: Omit<WorkflowResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowResponse> {
        return httpClient.post<WorkflowResponse>('/workflows', workflow);
    },

    /**
     * Get a workflow by ID
     */
    async getById(id: string): Promise<WorkflowResponse> {
        return httpClient.get<WorkflowResponse>(`/workflows/${id}`);
    },

    /**
     * Update a workflow
     */
    async update(id: string, workflow: Partial<Omit<WorkflowResponse, 'id' | 'createdAt' | 'updatedAt'>>): Promise<WorkflowResponse> {
        return httpClient.put<WorkflowResponse>(`/workflows/${id}`, workflow);
    },

    /**
     * Delete a workflow
     */
    async delete(id: string): Promise<void> {
        return httpClient.delete<void>(`/workflows/${id}`);
    },

    /**
     * List all workflows
     */
    async list(): Promise<WorkflowResponse[]> {
        return httpClient.get<WorkflowResponse[]>('/workflows');
    },
};
