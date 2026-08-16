/**
 * Automations API client
 * Handles automation actions lookup
 */

import { httpClient } from './http';
import type { AutomationAction } from '../domain/workflow';

export const automationsApi = {
    /**
     * Fetch the list of available automation actions
     */
    async getActions(): Promise<AutomationAction[]> {
        return httpClient.get<AutomationAction[]>('/automations');
    },
};
