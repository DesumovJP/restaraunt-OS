import { factories } from '@strapi/strapi';

// Role hierarchy for task assignment permissions
const ROLE_LEVELS = {
  admin: 100,
  manager: 80,
  chef: 60,
  cook: 40,
  waiter: 40,
  bartender: 40,
  host: 30,
  cashier: 35,
  viewer: 10
};

// Who can assign tasks to whom
const ASSIGNMENT_PERMISSIONS = {
  admin: ['admin', 'manager', 'chef', 'cook', 'waiter', 'bartender', 'host', 'cashier'],
  manager: ['manager', 'chef', 'cook', 'waiter', 'bartender', 'host', 'cashier'],
  chef: ['chef', 'cook'],
  cook: ['cook'],
  waiter: ['waiter'],
  bartender: ['bartender'],
  host: ['host'],
  cashier: ['cashier'],
  viewer: []
};

function canAssignTo(actorRole: string, targetRole: string): boolean {
  const allowedRoles = ASSIGNMENT_PERMISSIONS[actorRole] || [];
  return allowedRoles.includes(targetRole);
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default factories.createCoreController('api::daily-task.daily-task', ({ strapi }) => ({

  // Override create to check assignment permissions
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { data } = ctx.request.body;
    const assigneeId = data.assignee;

    // If assigning to someone else, check permissions
    if (assigneeId && assigneeId !== user.documentId) {
      const assignee = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: assigneeId,
        populate: ['role']
      });

      if (!assignee) {
        return ctx.badRequest('Assignee not found');
      }

      const userRole = user.role?.type || user.systemRole || 'viewer';
      const assigneeRole = assignee.role?.type || assignee.systemRole || 'viewer';

      if (!canAssignTo(userRole, assigneeRole)) {
        return ctx.forbidden(`You cannot assign tasks to ${assigneeRole} role`);
      }
    }

    // Set createdByUser
    ctx.request.body.data.createdByUser = user.documentId;

    // If no assignee specified, assign to self
    if (!assigneeId) {
      ctx.request.body.data.assignee = user.documentId;
    }

    const result = await super.create(ctx);
    return result;
  },

  // Override update to check permissions
  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { documentId } = ctx.params;

    const task = await strapi.documents('api::daily-task.daily-task').findOne({
      documentId,
      populate: ['assignee', 'createdByUser']
    });

    if (!task) {
      return ctx.notFound('Task not found');
    }

    const userRole = user.role?.type || user.systemRole || 'viewer';
    const isAdmin = userRole === 'admin';
    const isManager = userRole === 'manager';
    const isOwner = task.createdByUser?.documentId === user.documentId;
    const isAssignee = task.assignee?.documentId === user.documentId;

    // Admin can edit anything
    // Manager can edit non-admin tasks
    // Creator can edit their own tasks
    // Assignee can only update status and notes
    if (!isAdmin && !isManager && !isOwner && !isAssignee) {
      return ctx.forbidden('You cannot edit this task');
    }

    // If only assignee (not owner), restrict fields
    if (isAssignee && !isOwner && !isAdmin && !isManager) {
      const allowedFields = ['status', 'notes', 'actualMinutes', 'completedAt', 'startedAt'];
      const updateData = ctx.request.body.data;

      for (const key of Object.keys(updateData)) {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      }
    }

    return super.update(ctx);
  },

  // Start task
  async start(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const task = await strapi.documents('api::daily-task.daily-task').findOne({
      documentId,
      populate: ['assignee']
    });

    if (!task) {
      return ctx.notFound('Task not found');
    }

    // Only assignee can start the task
    if (task.assignee?.documentId !== user.documentId) {
      return ctx.forbidden('Only the assignee can start this task');
    }

    if (task.status !== 'pending') {
      return ctx.badRequest(`Cannot start task with status: ${task.status}`);
    }

    const updatedTask = await strapi.documents('api::daily-task.daily-task').update({
      documentId,
      data: {
        status: 'in_progress',
        startedAt: new Date().toISOString()
      }
    });

    return ctx.send({ success: true, task: updatedTask });
  },

  // Complete task
  async complete(ctx) {
    const { documentId } = ctx.params;
    const { notes, actualMinutes } = ctx.request.body || {};
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const task = await strapi.documents('api::daily-task.daily-task').findOne({
      documentId,
      populate: ['assignee']
    });

    if (!task) {
      return ctx.notFound('Task not found');
    }

    // Only assignee can complete the task
    if (task.assignee?.documentId !== user.documentId) {
      return ctx.forbidden('Only the assignee can complete this task');
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      return ctx.badRequest(`Cannot complete task with status: ${task.status}`);
    }

    // Calculate actual minutes if started
    let calculatedMinutes = actualMinutes;
    if (!calculatedMinutes && task.startedAt) {
      const startTime = new Date(task.startedAt).getTime();
      calculatedMinutes = Math.round((Date.now() - startTime) / 60000);
    }

    const updatedTask = await strapi.documents('api::daily-task.daily-task').update({
      documentId,
      data: {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedByUser: user.documentId,
        actualMinutes: calculatedMinutes,
        notes: notes || task.notes
      }
    });

    return ctx.send({ success: true, task: updatedTask });
  },

  // Cancel task
  async cancel(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const task = await strapi.documents('api::daily-task.daily-task').findOne({
      documentId,
      populate: ['assignee', 'createdByUser']
    });

    if (!task) {
      return ctx.notFound('Task not found');
    }

    const userRole = user.role?.type || user.systemRole || 'viewer';
    const isAdmin = userRole === 'admin';
    const isManager = userRole === 'manager';
    const isOwner = task.createdByUser?.documentId === user.documentId;

    // Only admin, manager, or task creator can cancel
    if (!isAdmin && !isManager && !isOwner) {
      return ctx.forbidden('Only admin, manager, or task creator can cancel this task');
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      return ctx.badRequest(`Cannot cancel task with status: ${task.status}`);
    }

    const updatedTask = await strapi.documents('api::daily-task.daily-task').update({
      documentId,
      data: {
        status: 'cancelled',
        notes: reason ? `${task.notes || ''}\n[Cancelled]: ${reason}`.trim() : task.notes
      }
    });

    return ctx.send({ success: true, task: updatedTask });
  },

  // Get my tasks for today
  async myToday(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const today = new Date();
    const startOfDay = getStartOfDay(today).toISOString().split('T')[0];

    const tasks = await strapi.documents('api::daily-task.daily-task').findMany({
      filters: {
        assignee: { documentId: { $eq: user.documentId } },
        $or: [
          { dueDate: { $eq: startOfDay } },
          { dueDate: { $null: true }, isRecurring: true },
          { status: { $in: ['pending', 'in_progress'] } }
        ]
      },
      populate: ['assignee', 'createdByUser', 'subtasks'],
      sort: [{ priority: 'desc' }, { dueTime: 'asc' }, { createdAt: 'asc' }]
    });

    return ctx.send({ data: tasks });
  },

  // Get team tasks (for managers/admins)
  async teamTasks(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const userRole = user.role?.type || user.systemRole || 'viewer';

    // Only admin, manager, chef can see team tasks
    if (!['admin', 'manager', 'chef'].includes(userRole)) {
      return ctx.forbidden('Only admin, manager, or chef can view team tasks');
    }

    const { date, department, status } = ctx.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const filters: any = {
      $or: [
        { dueDate: { $eq: targetDate } },
        { status: { $in: ['pending', 'in_progress'] } }
      ]
    };

    if (status) {
      filters.status = { $in: Array.isArray(status) ? status : [status] };
    }

    // Chef can only see kitchen tasks
    if (userRole === 'chef') {
      filters.station = { $in: ['grill', 'fry', 'salad', 'hot', 'dessert', 'prep', 'pass'] };
    }

    const tasks = await strapi.documents('api::daily-task.daily-task').findMany({
      filters,
      populate: ['assignee', 'createdByUser'],
      sort: [{ priority: 'desc' }, { dueTime: 'asc' }]
    });

    return ctx.send({ data: tasks });
  },

  // Get task statistics
  async stats(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { userId, dateFrom, dateTo } = ctx.query;
    const targetUserId = userId || user.documentId;

    const userRole = user.role?.type || user.systemRole || 'viewer';

    // Users can only see their own stats unless admin/manager
    if (targetUserId !== user.documentId && !['admin', 'manager'].includes(userRole)) {
      return ctx.forbidden('You can only view your own statistics');
    }

    const today = new Date();
    const startDate = (dateFrom || new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0]) as string;
    const endDate = (dateTo || new Date().toISOString().split('T')[0]) as string;

    const tasks = await strapi.documents('api::daily-task.daily-task').findMany({
      filters: {
        assignee: { documentId: { $eq: targetUserId } },
        createdAt: { $gte: startDate, $lte: endDate } as any
      }
    });

    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      completionRate: 0,
      avgCompletionMinutes: 0
    };

    if (stats.total > 0) {
      stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    const completedWithTime = tasks.filter(t => t.status === 'completed' && t.actualMinutes);
    if (completedWithTime.length > 0) {
      const totalMinutes = completedWithTime.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
      stats.avgCompletionMinutes = Math.round(totalMinutes / completedWithTime.length);
    }

    return ctx.send({ data: stats });
  },

  // Generate recurring tasks (called by cron job or manually)
  async generateRecurring(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const userRole = user.role?.type || user.systemRole || 'viewer';

    // Only admin or manager can generate recurring tasks
    if (!['admin', 'manager'].includes(userRole)) {
      return ctx.forbidden('Only admin or manager can generate recurring tasks');
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const dayOfMonth = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    // Find all recurring task templates
    const recurringTasks = await strapi.documents('api::daily-task.daily-task').findMany({
      filters: {
        isRecurring: true,
        status: { $ne: 'cancelled' }
      },
      populate: ['assignee', 'createdByUser']
    });

    let generatedCount = 0;

    for (const template of recurringTasks) {
      // Check if we should generate today based on pattern
      let shouldGenerate = false;

      switch (template.recurringPattern) {
        case 'daily':
          shouldGenerate = true;
          break;
        case 'weekdays':
          shouldGenerate = dayOfWeek >= 1 && dayOfWeek <= 5;
          break;
        case 'weekly':
          // Generate on same day of week as original
          const originalDay = template.dueDate ? new Date(template.dueDate).getDay() : 1;
          shouldGenerate = dayOfWeek === originalDay;
          break;
        case 'monthly':
          // Generate on same day of month as original
          const originalDayOfMonth = template.dueDate ? new Date(template.dueDate).getDate() : 1;
          shouldGenerate = dayOfMonth === originalDayOfMonth;
          break;
      }

      if (!shouldGenerate) continue;

      // Check if task for today already exists
      const existing = await strapi.documents('api::daily-task.daily-task').findMany({
        filters: {
          parentTask: { documentId: { $eq: template.documentId } },
          dueDate: { $eq: todayStr }
        }
      });

      if (existing.length > 0) continue;

      // Create new task for today
      await strapi.documents('api::daily-task.daily-task').create({
        data: {
          title: template.title,
          description: template.description,
          priority: template.priority,
          category: template.category,
          dueDate: todayStr,
          dueTime: template.dueTime,
          station: template.station,
          estimatedMinutes: template.estimatedMinutes,
          assignee: template.assignee?.documentId,
          createdByUser: template.createdByUser?.documentId,
          parentTask: template.documentId,
          isRecurring: false,
          status: 'pending'
        }
      });

      generatedCount++;
    }

    return ctx.send({
      success: true,
      message: `Generated ${generatedCount} recurring tasks for ${todayStr}`,
      count: generatedCount
    });
  }
}));
