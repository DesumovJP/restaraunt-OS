import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DailyTask,
  TaskFilters,
  TaskStats,
  TaskStatus,
  GroupedTasks,
  groupTasksByStatus,
  isTaskOverdue,
} from '@/types/daily-tasks';

interface DailyTasksState {
  // Data
  tasks: DailyTask[];
  myTasks: DailyTask[];
  teamTasks: DailyTask[];

  // UI State
  filters: TaskFilters;
  selectedDate: string; // ISO date string
  isLoading: boolean;
  error: string | null;
  selectedTaskId: string | null;

  // Stats
  stats: TaskStats;

  // Actions - Data
  setTasks: (tasks: DailyTask[]) => void;
  setMyTasks: (tasks: DailyTask[]) => void;
  setTeamTasks: (tasks: DailyTask[]) => void;
  addTask: (task: DailyTask) => void;
  updateTask: (documentId: string, updates: Partial<DailyTask>) => void;
  removeTask: (documentId: string) => void;

  // Actions - UI
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  setSelectedDate: (date: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStats: (stats: TaskStats) => void;

  // Quick Actions (optimistic updates)
  startTask: (documentId: string) => void;
  completeTask: (documentId: string, actualMinutes?: number) => void;
  cancelTask: (documentId: string) => void;

  // Computed
  getFilteredTasks: () => DailyTask[];
  getGroupedTasks: () => GroupedTasks;
  getMyPendingCount: () => number;
  getOverdueTasks: () => DailyTask[];
  getTaskById: (documentId: string) => DailyTask | undefined;
}

const initialStats: TaskStats = {
  total: 0,
  completed: 0,
  pending: 0,
  inProgress: 0,
  cancelled: 0,
  overdue: 0,
  completionRate: 0,
  avgCompletionMinutes: 0,
};

export const useDailyTasksStore = create<DailyTasksState>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: [],
      myTasks: [],
      teamTasks: [],
      filters: {},
      selectedDate: new Date().toISOString().split('T')[0],
      isLoading: false,
      error: null,
      selectedTaskId: null,
      stats: initialStats,

      // Actions - Data
      setTasks: (tasks) => {
        set({ tasks });
        get().updateStatsFromTasks(tasks);
      },

      setMyTasks: (tasks) => {
        set({ myTasks: tasks });
      },

      setTeamTasks: (tasks) => {
        set({ teamTasks: tasks });
      },

      addTask: (task) => {
        set((state) => ({
          tasks: [task, ...state.tasks],
          myTasks: task.assignee.documentId === state.myTasks[0]?.assignee?.documentId
            ? [task, ...state.myTasks]
            : state.myTasks,
        }));
      },

      updateTask: (documentId, updates) => {
        const updateInList = (list: DailyTask[]) =>
          list.map((t) =>
            t.documentId === documentId ? { ...t, ...updates } : t
          );

        set((state) => ({
          tasks: updateInList(state.tasks),
          myTasks: updateInList(state.myTasks),
          teamTasks: updateInList(state.teamTasks),
        }));
      },

      removeTask: (documentId) => {
        const removeFromList = (list: DailyTask[]) =>
          list.filter((t) => t.documentId !== documentId);

        set((state) => ({
          tasks: removeFromList(state.tasks),
          myTasks: removeFromList(state.myTasks),
          teamTasks: removeFromList(state.teamTasks),
        }));
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

      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      setSelectedTaskId: (id) => {
        set({ selectedTaskId: id });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      setStats: (stats) => {
        set({ stats });
      },

      // Quick Actions
      startTask: (documentId) => {
        get().updateTask(documentId, {
          status: 'in_progress',
          startedAt: new Date().toISOString(),
        });
      },

      completeTask: (documentId, actualMinutes) => {
        get().updateTask(documentId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          actualMinutes,
        });
      },

      cancelTask: (documentId) => {
        get().updateTask(documentId, {
          status: 'cancelled',
        });
      },

      // Computed
      getFilteredTasks: () => {
        const { tasks, filters } = get();

        return tasks.filter((task) => {
          // Status filter
          if (filters.status?.length && !filters.status.includes(task.status)) {
            return false;
          }

          // Priority filter
          if (filters.priority?.length && !filters.priority.includes(task.priority)) {
            return false;
          }

          // Category filter
          if (filters.category?.length && !filters.category.includes(task.category)) {
            return false;
          }

          // Station filter
          if (filters.station?.length && task.station && !filters.station.includes(task.station)) {
            return false;
          }

          // Assignee filter
          if (filters.assigneeId && task.assignee?.documentId !== filters.assigneeId) {
            return false;
          }

          // Created by filter
          if (filters.createdById && task.createdByUser?.documentId !== filters.createdById) {
            return false;
          }

          // Date range filter
          if (filters.dateFrom && task.dueDate && task.dueDate < filters.dateFrom) {
            return false;
          }
          if (filters.dateTo && task.dueDate && task.dueDate > filters.dateTo) {
            return false;
          }

          // Recurring filter
          if (filters.isRecurring !== undefined && task.isRecurring !== filters.isRecurring) {
            return false;
          }

          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(searchLower);
            const matchesDescription = task.description?.toLowerCase().includes(searchLower);
            if (!matchesTitle && !matchesDescription) {
              return false;
            }
          }

          return true;
        });
      },

      getGroupedTasks: () => {
        const filteredTasks = get().getFilteredTasks();
        return groupTasksByStatus(filteredTasks);
      },

      getMyPendingCount: () => {
        const { myTasks } = get();
        return myTasks.filter(
          (t) => t.status === 'pending' || t.status === 'in_progress' || isTaskOverdue(t)
        ).length;
      },

      getOverdueTasks: () => {
        const { tasks } = get();
        return tasks.filter(isTaskOverdue);
      },

      getTaskById: (documentId) => {
        const { tasks, myTasks, teamTasks } = get();
        return (
          tasks.find((t) => t.documentId === documentId) ||
          myTasks.find((t) => t.documentId === documentId) ||
          teamTasks.find((t) => t.documentId === documentId)
        );
      },

      // Private helper
      updateStatsFromTasks: (tasks: DailyTask[]) => {
        const stats: TaskStats = {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === 'completed').length,
          pending: tasks.filter((t) => t.status === 'pending').length,
          inProgress: tasks.filter((t) => t.status === 'in_progress').length,
          cancelled: tasks.filter((t) => t.status === 'cancelled').length,
          overdue: tasks.filter(isTaskOverdue).length,
          completionRate: 0,
          avgCompletionMinutes: 0,
        };

        if (stats.total > 0) {
          stats.completionRate = Math.round((stats.completed / stats.total) * 100);
        }

        const completedWithTime = tasks.filter(
          (t) => t.status === 'completed' && t.actualMinutes
        );
        if (completedWithTime.length > 0) {
          const totalMinutes = completedWithTime.reduce(
            (sum, t) => sum + (t.actualMinutes || 0),
            0
          );
          stats.avgCompletionMinutes = Math.round(totalMinutes / completedWithTime.length);
        }

        set({ stats });
      },
    }),
    {
      name: 'daily-tasks-storage',
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        filters: state.filters,
      }),
    }
  )
);

// Selector hooks for performance
export const useMyPendingCount = () => useDailyTasksStore((state) => state.getMyPendingCount());
export const useOverdueTasks = () => useDailyTasksStore((state) => state.getOverdueTasks());
export const useTaskStats = () => useDailyTasksStore((state) => state.stats);
