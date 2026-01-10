/**
 * Storage UI Store
 *
 * Manages UI state for Smart Storage: view modes, preview panel,
 * sorting, and selection state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ViewMode,
  StorageUIState,
  StorageUIActions,
} from "@/types/storage-ui";
import { DEFAULT_UI_STATE } from "@/types/storage-ui";

type StorageUIStore = StorageUIState & StorageUIActions;

export const useStorageUIStore = create<StorageUIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...DEFAULT_UI_STATE,

      // View mode
      setViewMode: (viewMode: ViewMode) => set({ viewMode }),

      // Preview panel
      openPreview: (productId: string) => set({ previewProductId: productId }),
      closePreview: () => set({ previewProductId: null }),

      // Alerts
      dismissAlerts: () => set({ alertsDismissed: true }),
      resetAlerts: () => set({ alertsDismissed: false }),

      // Sorting
      setSortBy: (sortBy) => {
        const current = get().sortBy;
        if (current === sortBy) {
          // Toggle order if clicking same field
          set((state) => ({
            sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
          }));
        } else {
          set({ sortBy, sortOrder: "asc" });
        }
      },
      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
        })),

      // Selection
      selectProduct: (id: string) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds
            : [...state.selectedIds, id],
        })),
      deselectProduct: (id: string) =>
        set((state) => ({
          selectedIds: state.selectedIds.filter((i) => i !== id),
        })),
      selectAll: (ids: string[]) => set({ selectedIds: ids }),
      deselectAll: () => set({ selectedIds: [] }),
    }),
    {
      name: "storage-ui-preferences",
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

// ==========================================
// SELECTOR HOOKS
// ==========================================

export const useViewMode = () => useStorageUIStore((state) => state.viewMode);
export const useSetViewMode = () =>
  useStorageUIStore((state) => state.setViewMode);

export const usePreviewProductId = () =>
  useStorageUIStore((state) => state.previewProductId);
export const usePreviewActions = () =>
  useStorageUIStore((state) => ({
    open: state.openPreview,
    close: state.closePreview,
  }));

export const useAlertsDismissed = () =>
  useStorageUIStore((state) => state.alertsDismissed);
export const useAlertActions = () =>
  useStorageUIStore((state) => ({
    dismiss: state.dismissAlerts,
    reset: state.resetAlerts,
  }));

export const useSorting = () =>
  useStorageUIStore((state) => ({
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    setSortBy: state.setSortBy,
    toggle: state.toggleSortOrder,
  }));

export const useSelection = () =>
  useStorageUIStore((state) => ({
    selectedIds: state.selectedIds,
    select: state.selectProduct,
    deselect: state.deselectProduct,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    isSelected: (id: string) => state.selectedIds.includes(id),
    count: state.selectedIds.length,
  }));
