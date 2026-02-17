// Mi Negocio AVEMARÍA — UI Store (Zustand)

import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
    closeSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: false,
    sidebarCollapsed: false,

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    collapseSidebar: () => set({ sidebarCollapsed: true }),
    expandSidebar: () => set({ sidebarCollapsed: false }),
    closeSidebar: () => set({ sidebarOpen: false }),
}));
