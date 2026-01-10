import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'urql';
import { useAuthStore, authFetch } from '@/stores/auth-store';
import { useDailyTasksStore } from '@/stores/daily-tasks-store';
import {
  GET_DAILY_TASKS,
  GET_MY_TASKS_TODAY,
  GET_TEAM_TASKS,
  GET_TASK_BY_ID,
  DELETE_DAILY_TASK,
} from '@/graphql/daily-tasks';
import {
  DailyTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskActionResponse,
} from '@/types/daily-tasks';
import { fetchWithRetry } from '@/lib/fetch-with-retry';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// ==========================================
// QUERY HOOKS
// ==========================================

/**
 * Fetch tasks with filters
 *
 * @param filters - TaskFilters object
 * @returns { tasks, loading, error, refetch }
 *
 * Example response:
 * {
 *   tasks: [{ documentId: "abc", title: "Clean grill", status: "pending", ... }],
 *   loading: false,
 *   error: null
 * }
 */
export function useDailyTasks(filters?: TaskFilters) {
  const { setTasks, setLoading, setError } = useDailyTasksStore();

  const [result, reexecute] = useQuery({
    query: GET_DAILY_TASKS,
    variables: {
      filters: buildGraphQLFilters(filters),
      sort: ['priority:desc', 'dueTime:asc', 'createdAt:asc'],
      pagination: { limit: 100 },
    },
  });

  useEffect(() => {
    setLoading(result.fetching);
    if (result.error) {
      setError(result.error.message);
    } else if (result.data?.dailyTasks) {
      setTasks(result.data.dailyTasks);
      setError(null);
    }
  }, [result, setTasks, setLoading, setError]);

  return {
    tasks: result.data?.dailyTasks || [],
    loading: result.fetching,
    error: result.error?.message || null,
    refetch: reexecute,
  };
}

/**
 * Fetch current user's tasks for today
 *
 * @returns { tasks, loading, error, refetch }
 */
export function useMyTasks() {
  const user = useAuthStore((state) => state.user);
  const { setMyTasks, setLoading, setError } = useDailyTasksStore();

  const today = new Date().toISOString().split('T')[0];

  const [result, reexecute] = useQuery({
    query: GET_MY_TASKS_TODAY,
    variables: {
      userId: user?.documentId,
      today,
    },
    pause: !user?.documentId,
  });

  useEffect(() => {
    setLoading(result.fetching);
    if (result.error) {
      setError(result.error.message);
    } else if (result.data?.dailyTasks) {
      setMyTasks(result.data.dailyTasks);
      setError(null);
    }
  }, [result, setMyTasks, setLoading, setError]);

  return {
    tasks: result.data?.dailyTasks || [],
    loading: result.fetching,
    error: result.error?.message || null,
    refetch: reexecute,
  };
}

/**
 * Fetch team tasks (for managers/chefs)
 *
 * @param date - Date string (YYYY-MM-DD)
 * @param stations - Array of station strings to filter
 * @returns { tasks, loading, error, refetch }
 */
export function useTeamTasks(date?: string, stations?: string[]) {
  const { setTeamTasks, setLoading, setError } = useDailyTasksStore();

  const targetDate = date || new Date().toISOString().split('T')[0];

  const [result, reexecute] = useQuery({
    query: GET_TEAM_TASKS,
    variables: {
      date: targetDate,
      station: stations,
    },
  });

  useEffect(() => {
    setLoading(result.fetching);
    if (result.error) {
      setError(result.error.message);
    } else if (result.data?.dailyTasks) {
      setTeamTasks(result.data.dailyTasks);
      setError(null);
    }
  }, [result, setTeamTasks, setLoading, setError]);

  return {
    tasks: result.data?.dailyTasks || [],
    loading: result.fetching,
    error: result.error?.message || null,
    refetch: reexecute,
  };
}

/**
 * Fetch single task by ID
 *
 * @param documentId - Task document ID
 * @returns { task, loading, error }
 */
export function useTask(documentId: string | null) {
  const [result] = useQuery({
    query: GET_TASK_BY_ID,
    variables: { documentId },
    pause: !documentId,
  });

  return {
    task: result.data?.dailyTask as DailyTask | null,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}

// ==========================================
// MUTATION HOOKS
// ==========================================

/**
 * Create a new task
 * Uses REST API for reliable task creation with proper relation handling
 *
 * @returns { createTask, loading, error }
 */
export function useCreateTask() {
  const { addTask } = useDailyTasksStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<DailyTask | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithRetry(
          () => authFetch(`${STRAPI_URL}/api/daily-tasks`, {
            method: 'POST',
            body: JSON.stringify({ data: input }),
          }),
          { maxRetries: 3 }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Помилка при створенні завдання');
        }

        const result = await response.json();
        const task = result.data;

        if (task) {
          addTask(task);
        }

        return task;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Помилка при створенні завдання';
        console.error('Failed to create task:', err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addTask]
  );

  return {
    createTask,
    loading,
    error,
  };
}

/**
 * Update an existing task
 * Uses REST API for reliable task updates
 *
 * @returns { updateTask, loading, error }
 */
export function useUpdateTask() {
  const { updateTask: updateInStore } = useDailyTasksStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = useCallback(
    async (documentId: string, input: UpdateTaskInput): Promise<DailyTask | null> => {
      setLoading(true);
      setError(null);

      // Optimistic update
      updateInStore(documentId, input);

      try {
        const response = await fetchWithRetry(
          () => authFetch(`${STRAPI_URL}/api/daily-tasks/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify({ data: input }),
          }),
          { maxRetries: 3 }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Помилка при оновленні завдання');
        }

        const result = await response.json();
        const task = result.data;

        if (task) {
          updateInStore(documentId, task);
        }

        return task;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Помилка при оновленні завдання';
        console.error('Failed to update task:', err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [updateInStore]
  );

  return {
    updateTask,
    loading,
    error,
  };
}

/**
 * Delete a task
 *
 * @returns { deleteTask, loading, error }
 */
export function useDeleteTask() {
  const { removeTask } = useDailyTasksStore();
  const [result, executeMutation] = useMutation(DELETE_DAILY_TASK);

  const deleteTask = useCallback(
    async (documentId: string): Promise<boolean> => {
      const response = await executeMutation({ documentId });

      if (response.error) {
        console.error('Failed to delete task:', response.error);
        return false;
      }

      removeTask(documentId);
      return true;
    },
    [executeMutation, removeTask]
  );

  return {
    deleteTask,
    loading: result.fetching,
    error: result.error?.message || null,
  };
}

// ==========================================
// QUICK ACTION HOOKS (REST API)
// ==========================================

/**
 * Start a task (change status to in_progress)
 * Uses REST API for custom endpoint
 */
export function useStartTask() {
  const { startTask: optimisticStart, updateTask } = useDailyTasksStore();

  const startTask = useCallback(
    async (documentId: string): Promise<TaskActionResponse | null> => {
      // Optimistic update
      optimisticStart(documentId);

      try {
        const response = await fetchWithRetry(
          () => authFetch(`${STRAPI_URL}/api/daily-tasks/${documentId}/start`, {
            method: 'POST',
          }),
          { maxRetries: 3 }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to start task');
        }

        const result = await response.json();

        if (result.task) {
          updateTask(documentId, result.task);
        }

        return result;
      } catch (error) {
        console.error('Failed to start task:', error);
        // Rollback - refetch would be better
        return null;
      }
    },
    [optimisticStart, updateTask]
  );

  return { startTask };
}

/**
 * Complete a task (change status to completed)
 */
export function useCompleteTask() {
  const { completeTask: optimisticComplete, updateTask } = useDailyTasksStore();

  const completeTask = useCallback(
    async (
      documentId: string,
      options?: { notes?: string; actualMinutes?: number }
    ): Promise<TaskActionResponse | null> => {
      // Optimistic update
      optimisticComplete(documentId, options?.actualMinutes);

      try {
        const response = await fetchWithRetry(
          () => authFetch(`${STRAPI_URL}/api/daily-tasks/${documentId}/complete`, {
            method: 'POST',
            body: JSON.stringify(options),
          }),
          { maxRetries: 3 }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to complete task');
        }

        const result = await response.json();

        if (result.task) {
          updateTask(documentId, result.task);
        }

        return result;
      } catch (error) {
        console.error('Failed to complete task:', error);
        return null;
      }
    },
    [optimisticComplete, updateTask]
  );

  return { completeTask };
}

/**
 * Cancel a task
 */
export function useCancelTask() {
  const { cancelTask: optimisticCancel, updateTask } = useDailyTasksStore();

  const cancelTask = useCallback(
    async (documentId: string, reason?: string): Promise<TaskActionResponse | null> => {
      // Optimistic update
      optimisticCancel(documentId);

      try {
        const response = await fetchWithRetry(
          () => authFetch(`${STRAPI_URL}/api/daily-tasks/${documentId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
          }),
          { maxRetries: 3 }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to cancel task');
        }

        const result = await response.json();

        if (result.task) {
          updateTask(documentId, result.task);
        }

        return result;
      } catch (error) {
        console.error('Failed to cancel task:', error);
        return null;
      }
    },
    [optimisticCancel, updateTask]
  );

  return { cancelTask };
}

/**
 * Fetch task statistics
 */
export function useTaskStats(userId?: string) {
  const user = useAuthStore((state) => state.user);
  const { setStats } = useDailyTasksStore();

  const fetchStats = useCallback(async () => {
    try {
      const targetUserId = userId || user?.documentId;
      const response = await authFetch(
        `${STRAPI_URL}/api/daily-tasks/stats?userId=${targetUserId}`
      );

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    return null;
  }, [userId, user, setStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { fetchStats };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function buildGraphQLFilters(filters?: TaskFilters) {
  if (!filters) return undefined;

  const graphqlFilters: Record<string, unknown> = {};

  if (filters.status?.length) {
    graphqlFilters.status = { in: filters.status };
  }

  if (filters.priority?.length) {
    graphqlFilters.priority = { in: filters.priority };
  }

  if (filters.category?.length) {
    graphqlFilters.category = { in: filters.category };
  }

  if (filters.station?.length) {
    graphqlFilters.station = { in: filters.station };
  }

  if (filters.assigneeId) {
    graphqlFilters.assignee = { documentId: { eq: filters.assigneeId } };
  }

  if (filters.createdById) {
    graphqlFilters.createdByUser = { documentId: { eq: filters.createdById } };
  }

  if (filters.dateFrom) {
    graphqlFilters.dueDate = { ...graphqlFilters.dueDate as object, gte: filters.dateFrom };
  }

  if (filters.dateTo) {
    graphqlFilters.dueDate = { ...graphqlFilters.dueDate as object, lte: filters.dateTo };
  }

  if (filters.isRecurring !== undefined) {
    graphqlFilters.isRecurring = { eq: filters.isRecurring };
  }

  if (filters.search) {
    graphqlFilters.or = [
      { title: { containsi: filters.search } },
      { description: { containsi: filters.search } },
    ];
  }

  return Object.keys(graphqlFilters).length > 0 ? graphqlFilters : undefined;
}
