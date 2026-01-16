/**
 * Schedule Store
 * Zustand store for managing worker shift schedule state.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Worker, WorkerShift, ShiftType, ShiftStatus, ShiftConflict } from "@/hooks/use-schedule";

// ==========================================
// Types
// ==========================================

export interface ScheduleFilters {
  department?: string;
  status?: ShiftStatus[];
  shiftType?: ShiftType[];
  workerId?: string;
  search?: string;
}

export interface ScheduleStats {
  totalShifts: number;
  totalMinutes: number;
  byStatus: Record<ShiftStatus, number>;
  byDepartment: Record<string, number>;
  workerCount: number;
}

export interface EditingShift {
  shift: WorkerShift;
  mode: "edit" | "view";
}

export interface ScheduleState {
  // Data
  shifts: WorkerShift[];
  workers: Worker[];

  // Week navigation
  currentWeekStart: Date;

  // UI State
  filters: ScheduleFilters;
  selectedDepartment: string;
  isLoading: boolean;
  error: string | null;

  // Dialogs
  showAddDialog: boolean;
  showEditDialog: boolean;
  showDeleteConfirm: boolean;
  showWorkerDetails: boolean;

  // Selected items
  selectedDate: string | null;
  selectedWorkerId: string | null;
  editingShift: EditingShift | null;
  deleteTargetShiftId: string | null;

  // Stats
  stats: ScheduleStats;

  // Actions - Data
  setShifts: (shifts: WorkerShift[]) => void;
  setWorkers: (workers: Worker[]) => void;
  addShift: (shift: WorkerShift) => void;
  updateShift: (documentId: string, updates: Partial<WorkerShift>) => void;
  removeShift: (documentId: string) => void;

  // Actions - Navigation
  setCurrentWeekStart: (date: Date) => void;
  navigatePrevWeek: () => void;
  navigateNextWeek: () => void;
  goToCurrentWeek: () => void;

  // Actions - UI
  setFilters: (filters: Partial<ScheduleFilters>) => void;
  clearFilters: () => void;
  setSelectedDepartment: (department: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Dialogs
  openAddDialog: (date?: string, workerId?: string) => void;
  closeAddDialog: () => void;
  openEditDialog: (shift: WorkerShift) => void;
  closeEditDialog: () => void;
  openDeleteConfirm: (shiftId: string) => void;
  closeDeleteConfirm: () => void;
  openWorkerDetails: (workerId: string) => void;
  closeWorkerDetails: () => void;

  // Actions - Selection
  setSelectedDate: (date: string | null) => void;
  setSelectedWorkerId: (workerId: string | null) => void;

  // Computed
  getFilteredShifts: () => WorkerShift[];
  getShiftsByDate: (date: string) => WorkerShift[];
  getShiftsByWorker: (workerId: string) => WorkerShift[];
  getWorkerById: (workerId: string) => Worker | undefined;
  getSelectedWorker: () => Worker | undefined;
  getWeekDates: () => Date[];

  // Stats
  updateStats: () => void;
}

// ==========================================
// Helpers
// ==========================================

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDatesFromStart(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const initialStats: ScheduleStats = {
  totalShifts: 0,
  totalMinutes: 0,
  byStatus: { scheduled: 0, started: 0, completed: 0, missed: 0, cancelled: 0 },
  byDepartment: {},
  workerCount: 0,
};

// ==========================================
// Store
// ==========================================

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      // Initial State
      shifts: [],
      workers: [],
      currentWeekStart: getMonday(new Date()),
      filters: {},
      selectedDepartment: "all",
      isLoading: false,
      error: null,
      showAddDialog: false,
      showEditDialog: false,
      showDeleteConfirm: false,
      showWorkerDetails: false,
      selectedDate: null,
      selectedWorkerId: null,
      editingShift: null,
      deleteTargetShiftId: null,
      stats: initialStats,

      // Actions - Data
      setShifts: (shifts) => {
        set({ shifts });
        get().updateStats();
      },

      setWorkers: (workers) => {
        set({ workers });
      },

      addShift: (shift) => {
        set((state) => ({
          shifts: [...state.shifts, shift],
        }));
        get().updateStats();
      },

      updateShift: (documentId, updates) => {
        set((state) => ({
          shifts: state.shifts.map((s) =>
            s.documentId === documentId ? { ...s, ...updates } : s
          ),
        }));
        get().updateStats();
      },

      removeShift: (documentId) => {
        set((state) => ({
          shifts: state.shifts.filter((s) => s.documentId !== documentId),
        }));
        get().updateStats();
      },

      // Actions - Navigation
      setCurrentWeekStart: (date) => {
        set({ currentWeekStart: getMonday(date) });
      },

      navigatePrevWeek: () => {
        set((state) => {
          const newStart = new Date(state.currentWeekStart);
          newStart.setDate(newStart.getDate() - 7);
          return { currentWeekStart: newStart };
        });
      },

      navigateNextWeek: () => {
        set((state) => {
          const newStart = new Date(state.currentWeekStart);
          newStart.setDate(newStart.getDate() + 7);
          return { currentWeekStart: newStart };
        });
      },

      goToCurrentWeek: () => {
        set({ currentWeekStart: getMonday(new Date()) });
      },

      // Actions - UI
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      setSelectedDepartment: (department) => {
        set({ selectedDepartment: department });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      // Actions - Dialogs
      openAddDialog: (date, workerId) => {
        set({
          showAddDialog: true,
          selectedDate: date || new Date().toISOString().split("T")[0],
          selectedWorkerId: workerId || null,
        });
      },

      closeAddDialog: () => {
        set({
          showAddDialog: false,
          selectedDate: null,
        });
      },

      openEditDialog: (shift) => {
        set({
          showEditDialog: true,
          editingShift: { shift, mode: "edit" },
        });
      },

      closeEditDialog: () => {
        set({
          showEditDialog: false,
          editingShift: null,
        });
      },

      openDeleteConfirm: (shiftId) => {
        set({
          showDeleteConfirm: true,
          deleteTargetShiftId: shiftId,
        });
      },

      closeDeleteConfirm: () => {
        set({
          showDeleteConfirm: false,
          deleteTargetShiftId: null,
        });
      },

      openWorkerDetails: (workerId) => {
        set({
          showWorkerDetails: true,
          selectedWorkerId: workerId,
        });
      },

      closeWorkerDetails: () => {
        set({
          showWorkerDetails: false,
          selectedWorkerId: null,
        });
      },

      // Actions - Selection
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      setSelectedWorkerId: (workerId) => {
        set({ selectedWorkerId: workerId });
      },

      // Computed
      getFilteredShifts: () => {
        const { shifts, filters, selectedDepartment } = get();

        return shifts.filter((shift) => {
          // Department filter
          if (selectedDepartment !== "all" && shift.department !== selectedDepartment) {
            return false;
          }

          // Status filter
          if (filters.status?.length && !filters.status.includes(shift.status)) {
            return false;
          }

          // Shift type filter
          if (filters.shiftType?.length && !filters.shiftType.includes(shift.shiftType)) {
            return false;
          }

          // Worker filter
          if (filters.workerId && shift.worker?.documentId !== filters.workerId) {
            return false;
          }

          // Search filter (by worker name)
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const workerName = `${shift.worker?.firstName || ""} ${shift.worker?.lastName || ""} ${shift.worker?.username || ""}`.toLowerCase();
            if (!workerName.includes(searchLower)) {
              return false;
            }
          }

          return true;
        });
      },

      getShiftsByDate: (date) => {
        const { shifts, selectedDepartment } = get();
        return shifts.filter((s) => {
          if (s.date !== date) return false;
          if (selectedDepartment !== "all" && s.department !== selectedDepartment) return false;
          return true;
        });
      },

      getShiftsByWorker: (workerId) => {
        const { shifts } = get();
        return shifts.filter((s) => s.worker?.documentId === workerId);
      },

      getWorkerById: (workerId) => {
        const { workers } = get();
        return workers.find((w) => w.documentId === workerId);
      },

      getSelectedWorker: () => {
        const { workers, selectedWorkerId } = get();
        if (!selectedWorkerId) return undefined;
        return workers.find((w) => w.documentId === selectedWorkerId);
      },

      getWeekDates: () => {
        const { currentWeekStart } = get();
        return getWeekDatesFromStart(currentWeekStart);
      },

      // Stats
      updateStats: () => {
        const { shifts } = get();

        const stats: ScheduleStats = {
          totalShifts: shifts.length,
          totalMinutes: shifts.reduce((sum, s) => sum + (s.scheduledMinutes || 0), 0),
          byStatus: { scheduled: 0, started: 0, completed: 0, missed: 0, cancelled: 0 },
          byDepartment: {},
          workerCount: new Set(shifts.map((s) => s.worker?.documentId).filter(Boolean)).size,
        };

        for (const shift of shifts) {
          // By status
          if (stats.byStatus[shift.status] !== undefined) {
            stats.byStatus[shift.status]++;
          }

          // By department
          const dept = shift.department || "unknown";
          stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
        }

        set({ stats });
      },
    }),
    {
      name: "schedule-storage",
      partialize: (state) => ({
        selectedDepartment: state.selectedDepartment,
        filters: state.filters,
      }),
    }
  )
);

// ==========================================
// Selector Hooks
// ==========================================

export const useScheduleStats = () => useScheduleStore((state) => state.stats);
export const useScheduleFilters = () => useScheduleStore((state) => state.filters);
export const useSelectedDepartment = () => useScheduleStore((state) => state.selectedDepartment);
export const useWeekDates = () => useScheduleStore((state) => state.getWeekDates());
export const useCurrentWeekStart = () => useScheduleStore((state) => state.currentWeekStart);
