/**
 * Editor Store - UI state management
 * Handles canvas interaction state, selection, panel toggles
 * Does NOT own durable business data
 */

import { create } from 'zustand';

export interface EditorUIState {
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    isSidebarOpen: boolean;
    isInspectorOpen: boolean;
    isPanelOpen: boolean;
    panelTab: 'simulation' | 'templates' | 'inspector';

    // Actions
    setSelectedNodeId: (id: string | null) => void;
    setSelectedEdgeId: (id: string | null) => void;
    toggleSidebar: () => void;
    toggleInspector: () => void;
    togglePanel: () => void;
    setPanelTab: (tab: 'simulation' | 'templates' | 'inspector') => void;
    resetSelection: () => void;
}

export const useEditorStore = create<EditorUIState>((set) => ({
    selectedNodeId: null,
    selectedEdgeId: null,
    isSidebarOpen: true,
    isInspectorOpen: true,
    isPanelOpen: true,
    panelTab: 'inspector',

    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
    togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

    setPanelTab: (tab) => set({ panelTab: tab }),

    resetSelection: () => set({
        selectedNodeId: null,
        selectedEdgeId: null,
    }),
}));
