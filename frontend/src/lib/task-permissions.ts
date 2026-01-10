import { SystemRole, ROLES } from './rbac';
import { DailyTask } from '@/types/daily-tasks';

// ==========================================
// TYPES
// ==========================================

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

// ==========================================
// ASSIGNMENT PERMISSIONS
// ==========================================

/**
 * Map of which roles can assign tasks to which other roles
 */
const ASSIGNMENT_MATRIX: Record<SystemRole, SystemRole[]> = {
  admin: ['admin', 'manager', 'chef', 'cook', 'waiter', 'bartender', 'host', 'cashier', 'viewer'],
  manager: ['manager', 'chef', 'cook', 'waiter', 'bartender', 'host', 'cashier'],
  chef: ['chef', 'cook'],
  cook: ['cook'],
  waiter: ['waiter'],
  bartender: ['bartender'],
  host: ['host'],
  cashier: ['cashier'],
  viewer: [],
};

/**
 * Check if a user with actorRole can assign a task to a user with targetRole
 *
 * @param actorRole - Role of the user creating/assigning the task
 * @param targetRole - Role of the user being assigned the task
 * @returns PermissionResult with allowed boolean and optional reason
 *
 * @example
 * canAssignTaskTo('chef', 'cook') // { allowed: true }
 * canAssignTaskTo('waiter', 'cook') // { allowed: false, reason: "..." }
 */
export function canAssignTaskTo(
  actorRole: SystemRole,
  targetRole: SystemRole
): PermissionResult {
  const allowedRoles = ASSIGNMENT_MATRIX[actorRole] || [];

  if (allowedRoles.includes(targetRole)) {
    return { allowed: true };
  }

  // Generate helpful error message
  const actorName = ROLES[actorRole]?.nameUk || actorRole;
  const targetName = ROLES[targetRole]?.nameUk || targetRole;

  return {
    allowed: false,
    reason: `${actorName} не може призначати завдання ролі ${targetName}`,
  };
}

/**
 * Get list of roles that a user can assign tasks to
 *
 * @param actorRole - Role of the user
 * @returns Array of roles that can be assigned tasks
 */
export function getAssignableRoles(actorRole: SystemRole): SystemRole[] {
  return ASSIGNMENT_MATRIX[actorRole] || [];
}

/**
 * Check if a user can assign tasks to anyone other than themselves
 *
 * @param actorRole - Role of the user
 * @returns true if can assign to others
 */
export function canAssignToOthers(actorRole: SystemRole): boolean {
  const assignable = ASSIGNMENT_MATRIX[actorRole] || [];
  // Can assign to others if can assign to more than just own role
  return assignable.length > 1 || (assignable.length === 1 && assignable[0] !== actorRole);
}

// ==========================================
// EDIT PERMISSIONS
// ==========================================

interface TaskContext {
  createdById: string;
  assigneeId: string;
  assigneeRole: SystemRole;
}

/**
 * Check if a user can edit a task
 *
 * Rules:
 * - Admin can edit any task
 * - Manager can edit non-admin tasks
 * - Chef can edit kitchen tasks
 * - Creator can edit their own tasks
 * - Assignee can only edit status/notes
 *
 * @param actorId - Document ID of the user attempting to edit
 * @param actorRole - Role of the user
 * @param task - Task context with IDs and roles
 * @returns PermissionResult
 */
export function canEditTask(
  actorId: string,
  actorRole: SystemRole,
  task: TaskContext
): PermissionResult {
  // Admin can edit anything
  if (actorRole === 'admin') {
    return { allowed: true };
  }

  // Creator can always edit their own tasks
  if (task.createdById === actorId) {
    return { allowed: true };
  }

  // Manager can edit non-admin tasks
  if (actorRole === 'manager' && task.assigneeRole !== 'admin') {
    return { allowed: true };
  }

  // Chef can edit kitchen tasks
  if (actorRole === 'chef' && ['chef', 'cook'].includes(task.assigneeRole)) {
    return { allowed: true };
  }

  // Assignee can edit (with field restrictions applied in backend)
  if (task.assigneeId === actorId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Немає прав на редагування цього завдання',
  };
}

/**
 * Check if a user can delete a task
 *
 * Rules:
 * - Admin can delete any task
 * - Manager can delete non-admin tasks
 * - Creator can delete their own tasks
 *
 * @param actorId - Document ID of the user
 * @param actorRole - Role of the user
 * @param task - Task context
 * @returns PermissionResult
 */
export function canDeleteTask(
  actorId: string,
  actorRole: SystemRole,
  task: TaskContext
): PermissionResult {
  // Admin can delete anything
  if (actorRole === 'admin') {
    return { allowed: true };
  }

  // Manager can delete non-admin tasks
  if (actorRole === 'manager' && task.assigneeRole !== 'admin') {
    return { allowed: true };
  }

  // Creator can delete their own tasks
  if (task.createdById === actorId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Тільки адмін, менеджер або автор може видалити завдання',
  };
}

/**
 * Check if a user can cancel a task
 *
 * Same rules as delete
 */
export function canCancelTask(
  actorId: string,
  actorRole: SystemRole,
  task: TaskContext
): PermissionResult {
  return canDeleteTask(actorId, actorRole, task);
}

// ==========================================
// STATUS CHANGE PERMISSIONS
// ==========================================

/**
 * Check if a user can start a task (change to in_progress)
 *
 * Only the assignee can start their own task
 */
export function canStartTask(
  actorId: string,
  task: { assigneeId: string }
): PermissionResult {
  if (task.assigneeId === actorId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Тільки виконавець може почати роботу над завданням',
  };
}

/**
 * Check if a user can complete a task
 *
 * Only the assignee can complete their own task
 */
export function canCompleteTask(
  actorId: string,
  task: { assigneeId: string }
): PermissionResult {
  if (task.assigneeId === actorId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Тільки виконавець може завершити завдання',
  };
}

// ==========================================
// VIEW PERMISSIONS
// ==========================================

/**
 * Check if a user can view team tasks
 *
 * Only admin, manager, chef can view team tasks
 */
export function canViewTeamTasks(actorRole: SystemRole): boolean {
  return ['admin', 'manager', 'chef'].includes(actorRole);
}

/**
 * Check if a user can view task statistics
 *
 * Users can view their own, admin/manager can view all
 */
export function canViewStats(
  actorRole: SystemRole,
  targetUserId: string,
  actorId: string
): boolean {
  // Own stats always visible
  if (targetUserId === actorId) {
    return true;
  }

  // Admin/manager can view all
  return ['admin', 'manager'].includes(actorRole);
}

// ==========================================
// HELPER: Extract task context from DailyTask
// ==========================================

export function getTaskContext(task: DailyTask): TaskContext {
  return {
    createdById: task.createdByUser?.documentId || '',
    assigneeId: task.assignee?.documentId || '',
    assigneeRole: (task.assignee?.systemRole as SystemRole) || 'viewer',
  };
}

/**
 * Full permission check for a task
 */
export function getTaskPermissions(
  actorId: string,
  actorRole: SystemRole,
  task: DailyTask
) {
  const context = getTaskContext(task);

  return {
    canEdit: canEditTask(actorId, actorRole, context).allowed,
    canDelete: canDeleteTask(actorId, actorRole, context).allowed,
    canCancel: canCancelTask(actorId, actorRole, context).allowed,
    canStart: canStartTask(actorId, context).allowed,
    canComplete: canCompleteTask(actorId, context).allowed,
    isOwner: context.createdById === actorId,
    isAssignee: context.assigneeId === actorId,
  };
}
