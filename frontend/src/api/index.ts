/**
 * API client module
 * Exports all API client functions
 */

export { httpClient, type ApiError } from './http';
export { simulationsApi } from './simulations';
export { automationsApi } from './automations';
export { workflowsApi, type WorkflowResponse } from './workflows';
