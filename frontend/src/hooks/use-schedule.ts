/**
 * Schedule Management Hooks
 * Comprehensive hooks for worker shift scheduling with CRUD operations,
 * conflict detection, and worker schedule summary.
 */

import { useCallback, useMemo } from "react";
import { useQuery, useMutation, gql } from "urql";

// ==========================================
// GraphQL Operations
// ==========================================

const GET_TEAM_SCHEDULE = gql`
  query GetTeamSchedule($fromDate: Date!, $toDate: Date!, $department: String) {
    workerShifts(
      filters: {
        date: { gte: $fromDate, lte: $toDate }
        department: { eq: $department }
      }
      sort: ["date:asc", "startTime:asc"]
      pagination: { limit: 500 }
    ) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      department
      station
      scheduledMinutes
      actualMinutes
      notes
      worker {
        documentId
        username
        firstName
        lastName
        avatarUrl
        department
        station
        systemRole
      }
    }
  }
`;

const GET_WORKER_SHIFTS = gql`
  query GetWorkerShifts($workerId: ID!, $fromDate: Date!, $toDate: Date!) {
    workerShifts(
      filters: {
        worker: { documentId: { eq: $workerId } }
        date: { gte: $fromDate, lte: $toDate }
      }
      sort: ["date:asc", "startTime:asc"]
    ) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      actualStartTime
      actualEndTime
      scheduledMinutes
      actualMinutes
      overtimeMinutes
      breakMinutes
      department
      station
      notes
      isHoliday
      hourlyRate
      totalPay
      worker {
        documentId
        username
        firstName
        lastName
      }
    }
  }
`;

const GET_ALL_WORKERS = gql`
  query GetAllWorkers {
    usersPermissionsUsers(
      filters: { blocked: { eq: false } }
      sort: ["firstName:asc", "username:asc"]
      pagination: { limit: 100 }
    ) {
      documentId
      username
      firstName
      lastName
      email
      avatarUrl
      systemRole
      department
      station
      isActive
    }
  }
`;

const CREATE_WORKER_SHIFT = gql`
  mutation CreateWorkerShift($data: WorkerShiftInput!) {
    createWorkerShift(data: $data) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      department
      scheduledMinutes
    }
  }
`;

const UPDATE_WORKER_SHIFT = gql`
  mutation UpdateWorkerShift($documentId: ID!, $data: WorkerShiftInput!) {
    updateWorkerShift(documentId: $documentId, data: $data) {
      documentId
      date
      startTime
      endTime
      shiftType
      status
      department
      scheduledMinutes
      notes
    }
  }
`;

const DELETE_WORKER_SHIFT = gql`
  mutation DeleteWorkerShift($documentId: ID!) {
    deleteWorkerShift(documentId: $documentId) {
      documentId
    }
  }
`;

// ==========================================
// Types
// ==========================================

export interface Worker {
  documentId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  department?: string;
  station?: string;
  systemRole?: string;
  isActive?: boolean;
}

export interface WorkerShift {
  documentId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  department?: string;
  station?: string;
  scheduledMinutes?: number;
  actualMinutes?: number;
  overtimeMinutes?: number;
  breakMinutes?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
  isHoliday?: boolean;
  hourlyRate?: number;
  totalPay?: number;
  worker?: Worker;
}

export type ShiftType = "morning" | "afternoon" | "evening" | "night" | "split";
export type ShiftStatus = "scheduled" | "started" | "completed" | "missed" | "cancelled";

export interface ShiftInput {
  worker: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  department?: string;
  station?: string;
  scheduledMinutes?: number;
  notes?: string;
  status?: ShiftStatus;
}

export interface ShiftConflict {
  existingShift: WorkerShift;
  newShift: { startTime: string; endTime: string; date: string };
  type: "overlap" | "same_day_multiple";
}

// ==========================================
// Configuration
// ==========================================

export const SHIFT_TYPES = [
  { value: "morning" as const, label: "Ранкова", labelFull: "Ранкова (06:00-14:00)", start: "06:00", end: "14:00" },
  { value: "afternoon" as const, label: "Денна", labelFull: "Денна (10:00-18:00)", start: "10:00", end: "18:00" },
  { value: "evening" as const, label: "Вечірня", labelFull: "Вечірня (16:00-00:00)", start: "16:00", end: "00:00" },
  { value: "night" as const, label: "Нічна", labelFull: "Нічна (22:00-06:00)", start: "22:00", end: "06:00" },
  { value: "split" as const, label: "Розділена", labelFull: "Розділена", start: "10:00", end: "14:00" },
];

export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  morning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  afternoon: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  evening: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  night: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  split: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  scheduled: "border-l-blue-500",
  started: "border-l-amber-500",
  completed: "border-l-green-500",
  missed: "border-l-red-500",
  cancelled: "border-l-gray-400",
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  scheduled: "Заплановано",
  started: "Розпочато",
  completed: "Завершено",
  missed: "Пропущено",
  cancelled: "Скасовано",
};

export const DEPARTMENTS = [
  { value: "all", label: "Всі відділи" },
  { value: "management", label: "Менеджмент" },
  { value: "kitchen", label: "Кухня" },
  { value: "service", label: "Обслуговування" },
  { value: "bar", label: "Бар" },
  { value: "cleaning", label: "Клінінг" },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Адмін",
  manager: "Менеджер",
  chef: "Шеф-кухар",
  cook: "Кухар",
  waiter: "Офіціант",
  host: "Хостес",
  bartender: "Бармен",
  cashier: "Касир",
  viewer: "Гість",
};

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  chef: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  cook: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  waiter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  host: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  bartender: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  cashier: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  management: "Менеджмент",
  kitchen: "Кухня",
  service: "Зал",
  bar: "Бар",
  cleaning: "Клінінг",
};

// ==========================================
// Utility Functions
// ==========================================

/**
 * Format time string for Strapi (HH:mm:ss.SSS)
 */
export function formatTimeForStrapi(time: string): string {
  const parts = time.split(":");
  if (parts.length === 2) {
    return `${parts[0]}:${parts[1]}:00.000`;
  }
  return time;
}

/**
 * Format time for display (HH:mm)
 */
export function formatTimeDisplay(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

/**
 * Calculate scheduled minutes from start and end time
 */
export function calculateScheduledMinutes(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let minutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (minutes < 0) minutes += 24 * 60; // Handle overnight shifts
  return minutes;
}

/**
 * Convert minutes to hours and minutes string
 */
export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}г`;
  return `${hours}г ${mins}хв`;
}

/**
 * Get week dates starting from Monday
 */
export function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  start.setDate(diff);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d);
  }
  return week;
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if two time ranges overlap
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  let s1 = toMinutes(start1);
  let e1 = toMinutes(end1);
  let s2 = toMinutes(start2);
  let e2 = toMinutes(end2);

  // Handle overnight shifts
  if (e1 < s1) e1 += 24 * 60;
  if (e2 < s2) e2 += 24 * 60;

  return s1 < e2 && s2 < e1;
}

// ==========================================
// Hooks
// ==========================================

/**
 * Hook to fetch team schedule for a date range
 */
export function useTeamSchedule(
  fromDate: string,
  toDate: string,
  department?: string
) {
  const [result, refetch] = useQuery({
    query: GET_TEAM_SCHEDULE,
    variables: {
      fromDate,
      toDate,
      department: department === "all" ? undefined : department,
    },
  });

  const shifts: WorkerShift[] = result.data?.workerShifts || [];

  return {
    shifts,
    fetching: result.fetching,
    error: result.error,
    refetch: () => refetch({ requestPolicy: "network-only" }),
  };
}

/**
 * Hook to fetch individual worker's shifts
 */
export function useWorkerShifts(
  workerId: string | null,
  fromDate: string,
  toDate: string
) {
  const [result, refetch] = useQuery({
    query: GET_WORKER_SHIFTS,
    variables: { workerId, fromDate, toDate },
    pause: !workerId,
  });

  const shifts: WorkerShift[] = result.data?.workerShifts || [];

  return {
    shifts,
    fetching: result.fetching,
    error: result.error,
    refetch: () => refetch({ requestPolicy: "network-only" }),
  };
}

/**
 * Hook to fetch all workers
 */
export function useAllWorkers() {
  const [result, refetch] = useQuery({
    query: GET_ALL_WORKERS,
  });

  const workers: Worker[] = result.data?.usersPermissionsUsers || [];

  return {
    workers,
    fetching: result.fetching,
    error: result.error,
    refetch: () => refetch({ requestPolicy: "network-only" }),
  };
}

/**
 * Hook for shift mutations (create, update, delete)
 */
export function useShiftMutations() {
  const [, createMutation] = useMutation(CREATE_WORKER_SHIFT);
  const [, updateMutation] = useMutation(UPDATE_WORKER_SHIFT);
  const [, deleteMutation] = useMutation(DELETE_WORKER_SHIFT);

  const createShift = useCallback(async (input: ShiftInput) => {
    const startTime = formatTimeForStrapi(input.startTime);
    const endTime = formatTimeForStrapi(input.endTime);
    const scheduledMinutes = calculateScheduledMinutes(input.startTime, input.endTime);

    const result = await createMutation({
      data: {
        worker: input.worker,
        date: input.date,
        startTime,
        endTime,
        shiftType: input.shiftType,
        department: input.department,
        station: input.station,
        scheduledMinutes,
        notes: input.notes,
        status: input.status || "scheduled",
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.createWorkerShift;
  }, [createMutation]);

  const updateShift = useCallback(async (
    documentId: string,
    input: Partial<ShiftInput>
  ) => {
    const data: Record<string, unknown> = {};

    if (input.worker) data.worker = input.worker;
    if (input.date) data.date = input.date;
    if (input.startTime) {
      data.startTime = formatTimeForStrapi(input.startTime);
    }
    if (input.endTime) {
      data.endTime = formatTimeForStrapi(input.endTime);
    }
    if (input.startTime && input.endTime) {
      data.scheduledMinutes = calculateScheduledMinutes(input.startTime, input.endTime);
    }
    if (input.shiftType) data.shiftType = input.shiftType;
    if (input.department) data.department = input.department;
    if (input.station) data.station = input.station;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.status) data.status = input.status;

    const result = await updateMutation({
      documentId,
      data,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.updateWorkerShift;
  }, [updateMutation]);

  const deleteShift = useCallback(async (documentId: string) => {
    const result = await deleteMutation({ documentId });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.deleteWorkerShift;
  }, [deleteMutation]);

  return { createShift, updateShift, deleteShift };
}

/**
 * Hook to detect shift conflicts
 */
export function useShiftConflictDetection(shifts: WorkerShift[]) {
  const checkConflict = useCallback((
    workerId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeShiftId?: string
  ): ShiftConflict | null => {
    const workerShiftsOnDate = shifts.filter(
      s => s.worker?.documentId === workerId &&
           s.date === date &&
           s.documentId !== excludeShiftId
    );

    for (const existingShift of workerShiftsOnDate) {
      if (doTimesOverlap(startTime, endTime, existingShift.startTime, existingShift.endTime)) {
        return {
          existingShift,
          newShift: { startTime, endTime, date },
          type: "overlap",
        };
      }
    }

    // Check for multiple shifts on the same day (optional warning)
    if (workerShiftsOnDate.length > 0) {
      return {
        existingShift: workerShiftsOnDate[0],
        newShift: { startTime, endTime, date },
        type: "same_day_multiple",
      };
    }

    return null;
  }, [shifts]);

  return { checkConflict };
}

/**
 * Hook to calculate worker schedule summary
 */
export function useWorkerScheduleSummary(shifts: WorkerShift[]) {
  const summaryByWorker = useMemo(() => {
    const summary: Record<string, {
      worker: Worker;
      totalShifts: number;
      totalMinutes: number;
      byStatus: Record<ShiftStatus, number>;
      byType: Record<ShiftType, number>;
      shifts: WorkerShift[];
    }> = {};

    for (const shift of shifts) {
      if (!shift.worker) continue;
      const workerId = shift.worker.documentId;

      if (!summary[workerId]) {
        summary[workerId] = {
          worker: shift.worker,
          totalShifts: 0,
          totalMinutes: 0,
          byStatus: { scheduled: 0, started: 0, completed: 0, missed: 0, cancelled: 0 },
          byType: { morning: 0, afternoon: 0, evening: 0, night: 0, split: 0 },
          shifts: [],
        };
      }

      summary[workerId].totalShifts++;
      summary[workerId].totalMinutes += shift.scheduledMinutes || 0;
      summary[workerId].byStatus[shift.status]++;
      summary[workerId].byType[shift.shiftType]++;
      summary[workerId].shifts.push(shift);
    }

    return summary;
  }, [shifts]);

  return { summaryByWorker };
}

/**
 * Combined schedule management hook
 */
export function useScheduleManagement(
  weekDates: Date[],
  department: string = "all"
) {
  const fromDate = weekDates[0]?.toISOString().split("T")[0] || "";
  const toDate = weekDates[6]?.toISOString().split("T")[0] || "";

  const { shifts, fetching, error, refetch } = useTeamSchedule(fromDate, toDate, department);
  const { workers, fetching: workersFetching } = useAllWorkers();
  const mutations = useShiftMutations();
  const { checkConflict } = useShiftConflictDetection(shifts);
  const { summaryByWorker } = useWorkerScheduleSummary(shifts);

  // Group shifts by date and worker
  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Record<string, WorkerShift[]>> = {};

    for (const date of weekDates) {
      const dateStr = date.toISOString().split("T")[0];
      grid[dateStr] = {};
    }

    for (const shift of shifts) {
      if (!grid[shift.date]) continue;
      const workerId = shift.worker?.documentId || "unknown";
      if (!grid[shift.date][workerId]) {
        grid[shift.date][workerId] = [];
      }
      grid[shift.date][workerId].push(shift);
    }

    return grid;
  }, [shifts, weekDates]);

  // Filter workers by department
  const filteredWorkers = useMemo(() => {
    let filtered = workers.filter(w => w.isActive !== false);

    if (department !== "all") {
      filtered = filtered.filter(w => w.department === department);
    }

    // Sort by department, then by role importance, then by name
    const roleOrder = ["chef", "cook", "bartender", "waiter", "host", "cashier", "manager", "admin", "viewer"];
    return filtered.sort((a, b) => {
      if (a.department !== b.department) {
        return (a.department || "").localeCompare(b.department || "");
      }
      const roleA = roleOrder.indexOf(a.systemRole || "viewer");
      const roleB = roleOrder.indexOf(b.systemRole || "viewer");
      if (roleA !== roleB) return roleA - roleB;
      return (a.firstName || a.username || "").localeCompare(b.firstName || b.username || "");
    });
  }, [workers, department]);

  return {
    shifts,
    workers,
    filteredWorkers,
    scheduleGrid,
    summaryByWorker,
    fetching: fetching || workersFetching,
    error,
    refetch,
    checkConflict,
    ...mutations,
  };
}
