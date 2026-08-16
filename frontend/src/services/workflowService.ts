/**
 * Workflow Service - API-backed workflow operations
 * Handles server-facing concerns like save, load, versioning
 */

import { workflowsApi } from '../api/workflows';
import type { WorkflowDraftDto } from '../domain/workflow';

export interface WorkflowState {
    id: string;
    name: string;
    draft: WorkflowDraftDto;
    lastSaved: Date;
    isDirty: boolean;
}

class WorkflowService {
    /**
     * Save a workflow to the backend
     * Returns the saved workflow with server-assigned ID
     */
    async saveWorkflow(
        name: string,
        draft: WorkflowDraftDto,
        workflowId?: string
    ): Promise<WorkflowState> {
        try {
            if (workflowId) {
                // Update existing workflow
                const response = await workflowsApi.update(workflowId, {
                    name,
                    draft,
                });
                return {
                    id: response.id,
                    name: response.name,
                    draft: response.draft,
                    lastSaved: new Date(response.updatedAt),
                    isDirty: false,
                };
            } else {
                // Create new workflow
                const response = await workflowsApi.create({
                    name,
                    draft,
                });
                return {
                    id: response.id,
                    name: response.name,
                    draft: response.draft,
                    lastSaved: new Date(response.createdAt),
                    isDirty: false,
                };
            }
        } catch (error) {
            throw new Error(`Failed to save workflow: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Load a workflow from the backend
     */
    async loadWorkflow(workflowId: string): Promise<WorkflowState> {
        try {
            const response = await workflowsApi.getById(workflowId);
            return {
                id: response.id,
                name: response.name,
                draft: response.draft,
                lastSaved: new Date(response.updatedAt),
                isDirty: false,
            };
        } catch (error) {
            throw new Error(`Failed to load workflow: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List all workflows (for workflow switcher)
     */
    async listWorkflows(): Promise<WorkflowState[]> {
        try {
            const responses = await workflowsApi.list();
            return responses.map((response) => ({
                id: response.id,
                name: response.name,
                draft: response.draft,
                lastSaved: new Date(response.updatedAt),
                isDirty: false,
            }));
        } catch (error) {
            throw new Error(`Failed to list workflows: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Delete a workflow from the backend
     */
    async deleteWorkflow(workflowId: string): Promise<void> {
        try {
            await workflowsApi.delete(workflowId);
        } catch (error) {
            throw new Error(`Failed to delete workflow: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Export singleton instance
export const workflowService = new WorkflowService();
