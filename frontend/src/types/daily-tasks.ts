import { SystemRole } from '@/lib/rbac';

// ==========================================
// ENUMS & CONSTANTS
// ==========================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskCategory = 'prep' | 'cleaning' | 'inventory' | 'maintenance' | 'training' | 'admin' | 'service' | 'other';
export type RecurringPattern = 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type Station = 'grill' | 'fry' | 'salad' | 'hot' | 'dessert' | 'bar' | 'pass' | 'prep' | 'front' | 'back';
export type Department = 'management' | 'kitchen' | 'service' | 'bar' | 'none';

export const TASK_STATUS_ORDER: TaskStatus[] = ['overdue', 'in_progress', 'pending', 'completed', 'cancelled'];

export const TASK_STATUS_LABELS: Record<TaskStatus, { en: string; uk: string }> = {
  pending: { en: 'Pending', uk: 'В очікуванні' },
  in_progress: { en: 'In Progress', uk: 'В роботі' },
  completed: { en: 'Completed', uk: 'Виконано' },
  cancelled: { en: 'Cancelled', uk: 'Скасовано' },
  overdue: { en: 'Overdue', uk: 'Прострочено' },
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, { en: string; uk: string }> = {
  low: { en: 'Low', uk: 'Низький' },
  normal: { en: 'Normal', uk: 'Звичайний' },
  high: { en: 'High', uk: 'Високий' },
  urgent: { en: 'Urgent', uk: 'Терміново' },
};

export const TASK_PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'normal', 'low'];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, { en: string; uk: string; icon: string }> = {
  prep: { en: 'Preparation', uk: 'Підготовка', icon: '🍳' },
  cleaning: { en: 'Cleaning', uk: 'Прибирання', icon: '🧹' },
  inventory: { en: 'Inventory', uk: 'Інвентаризація', icon: '📦' },
  maintenance: { en: 'Maintenance', uk: 'Обслуговування', icon: '🔧' },
  training: { en: 'Training', uk: 'Навчання', icon: '📚' },
  admin: { en: 'Admin', uk: 'Адміністрування', icon: '📋' },
  service: { en: 'Service', uk: 'Сервіс', icon: '🍽️' },
  other: { en: 'Other', uk: 'Інше', icon: '📌' },
};

export const STATION_LABELS: Record<Station, { en: string; uk: string }> = {
  grill: { en: 'Grill', uk: 'Гриль' },
  fry: { en: 'Fry', uk: 'Фритюр' },
  salad: { en: 'Salad', uk: 'Салати' },
  hot: { en: 'Hot', uk: 'Гаряче' },
  dessert: { en: 'Dessert', uk: 'Десерти' },
  bar: { en: 'Bar', uk: 'Бар' },
  pass: { en: 'Pass', uk: 'Видача' },
  prep: { en: 'Prep', uk: 'Підготовка' },
  front: { en: 'Front', uk: 'Зал' },
  back: { en: 'Back', uk: 'Підсобка' },
};

export const DEPARTMENT_LABELS: Record<Department, { en: string; uk: string }> = {
  management: { en: 'Management', uk: 'Керівництво' },
  kitchen: { en: 'Kitchen', uk: 'Кухня' },
  service: { en: 'Service', uk: 'Сервіс' },
  bar: { en: 'Bar', uk: 'Бар' },
  none: { en: 'None', uk: 'Не вказано' },
};

// ==========================================
// USER TYPES
// ==========================================

export interface TaskUser {
  id: string;
  documentId: string;
  username: string;
  email: string;
  systemRole: SystemRole;
  department: Department;
  station?: Station;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

// ==========================================
// TASK TYPES
// ==========================================

export interface DailyTask {
  id: string;
  documentId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  dueTime?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  assignee: TaskUser;
  createdByUser: TaskUser;
  completedAt?: string;
  completedByUser?: TaskUser;
  startedAt?: string;
  notes?: string;
  station?: Station;
  estimatedMinutes?: number;
  actualMinutes?: number;
  parentTask?: { documentId: string };
  subtasks?: DailyTask[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// INPUT TYPES
// ==========================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string;
  dueTime?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  assignee: string; // documentId
  station?: Station;
  estimatedMinutes?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string;
  dueTime?: string;
  notes?: string;
  actualMinutes?: number;
  station?: Station;
}

// ==========================================
// FILTER TYPES
// ==========================================

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assigneeId?: string;
  createdById?: string;
  station?: Station[];
  dateFrom?: string;
  dateTo?: string;
  isRecurring?: boolean;
  search?: string;
}

// ==========================================
// STATISTICS TYPES
// ==========================================

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  cancelled: number;
  overdue: number;
  completionRate: number;
  avgCompletionMinutes: number;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface TasksResponse {
  data: DailyTask[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface TaskResponse {
  data: DailyTask;
}

export interface TaskActionResponse {
  success: boolean;
  task: DailyTask;
  message?: string;
}

export interface TaskStatsResponse {
  data: TaskStats;
}

// ==========================================
// GROUPED TASKS
// ==========================================

export interface GroupedTasks {
  overdue: DailyTask[];
  inProgress: DailyTask[];
  pending: DailyTask[];
  completed: DailyTask[];
  cancelled: DailyTask[];
}

export function groupTasksByStatus(tasks: DailyTask[]): GroupedTasks {
  const now = new Date();

  return tasks.reduce<GroupedTasks>(
    (acc, task) => {
      // Check if overdue
      if (
        task.status !== 'completed' &&
        task.status !== 'cancelled' &&
        task.dueDate &&
        new Date(task.dueDate) < now
      ) {
        acc.overdue.push(task);
        return acc;
      }

      switch (task.status) {
        case 'in_progress':
          acc.inProgress.push(task);
          break;
        case 'pending':
          acc.pending.push(task);
          break;
        case 'completed':
          acc.completed.push(task);
          break;
        case 'cancelled':
          acc.cancelled.push(task);
          break;
        default:
          acc.pending.push(task);
      }
      return acc;
    },
    { overdue: [], inProgress: [], pending: [], completed: [], cancelled: [] }
  );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function isTaskOverdue(task: DailyTask): boolean {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return false;
  }
  if (!task.dueDate) {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
  } else {
    dueDate.setHours(23, 59, 59, 999);
  }

  return dueDate < new Date();
}

export function getTaskDueLabel(task: DailyTask): string {
  if (!task.dueDate) return '';

  const dueDate = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return task.dueTime ? `Сьогодні о ${task.dueTime}` : 'Сьогодні';
  } else if (diffDays === 1) {
    return task.dueTime ? `Завтра о ${task.dueTime}` : 'Завтра';
  } else if (diffDays === -1) {
    return task.dueTime ? `Вчора о ${task.dueTime}` : 'Вчора';
  } else if (diffDays < 0) {
    return `${Math.abs(diffDays)} днів тому`;
  } else {
    return dueDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  }
}

export function formatTaskTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} хв`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} год ${mins} хв` : `${hours} год`;
}
