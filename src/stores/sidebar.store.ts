import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleCollapse: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isCollapsed: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
    }),
    {
      name: 'sidebar-collapsed',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    },
  ),
);
