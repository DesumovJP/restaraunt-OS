/**
 * Daily Task Lifecycle Hooks
 * - Manages task status timestamps
 * - Logs actions to action-history
 */

import { logAction } from '../../../../utils/action-logger';

// Ukrainian priority translations
const PRIORITY_UK: Record<string, string> = {
  low: 'низький',
  normal: 'звичайний',
  high: 'високий',
  urgent: 'терміновий',
};

// Ukrainian category translations
const CATEGORY_UK: Record<string, string> = {
  cleaning: 'Прибирання',
  prep: 'Підготовка',
  inventory: 'Інвентаризація',
  maintenance: 'Обслуговування',
  admin: 'Адміністрування',
  other: 'Інше',
};

export default {
  async beforeCreate(event) {
    const { data } = event.params;

    // Set default status if not provided
    if (!data.status) {
      data.status = 'pending';
    }

    // Set default priority if not provided
    if (!data.priority) {
      data.priority = 'normal';
    }
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Fetch original for action logging
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::daily-task.daily-task').findOne({
          documentId: where.documentId,
          populate: ['assignee']
        });
        event.state = { original };
      } catch (e) {
        // Ignore
      }
    }

    // If status is being changed to completed, set completedAt
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
    }

    // If status is being changed to in_progress, set startedAt
    if (data.status === 'in_progress' && !data.startedAt) {
      data.startedAt = new Date().toISOString();
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Get task with relations
    const task = await strapi.documents('api::daily-task.daily-task').findOne({
      documentId: result.documentId,
      populate: ['assignee']
    });

    const priorityUk = PRIORITY_UK[result.priority] || result.priority;
    const categoryUk = CATEGORY_UK[result.category] || result.category;
    const assigneeStr = task?.assignee?.username ? ` → ${task.assignee.username}` : '';
    const urgentPrefix = result.priority === 'urgent' ? '🔴 ' : result.priority === 'high' ? '🟠 ' : '';

    await logAction(strapi, {
      action: 'create',
      entityType: 'daily_task',
      entityId: result.documentId,
      entityName: result.title,
      description: `Created daily task: ${result.title}`,
      descriptionUk: `${urgentPrefix}Нове завдання: ${result.title}${assigneeStr} (${categoryUk}, ${priorityUk})`,
      dataAfter: task || result,
      module: 'admin',
      metadata: {
        title: result.title,
        priority: result.priority,
        priorityUk,
        category: result.category,
        categoryUk,
        dueDate: result.dueDate,
        assignee: task?.assignee?.username
      }
    });
  },

  async afterUpdate(event) {
    const { result, state } = event;
    const original = state?.original;

    // Get updated task with relations
    const task = await strapi.documents('api::daily-task.daily-task').findOne({
      documentId: result.documentId,
      populate: ['assignee']
    });

    // Determine action based on status
    let action: 'update' | 'complete' | 'start' | 'cancel' = 'update';
    if (result.status === 'completed' && original?.status !== 'completed') {
      action = 'complete';
    } else if (result.status === 'in_progress' && original?.status !== 'in_progress') {
      action = 'start';
    } else if (result.status === 'cancelled' && original?.status !== 'cancelled') {
      action = 'cancel';
    }

    const assigneeStr = task?.assignee?.username ? ` (${task.assignee.username})` : '';

    // Build Ukrainian description based on action
    let descriptionUk = `Оновлено завдання: ${result.title}`;
    if (action === 'complete') {
      descriptionUk = `✓ Виконано: ${result.title}${assigneeStr}`;
    } else if (action === 'start') {
      descriptionUk = `▶ Розпочато: ${result.title}${assigneeStr}`;
    } else if (action === 'cancel') {
      descriptionUk = `Скасовано: ${result.title}`;
    }

    await logAction(strapi, {
      action,
      entityType: 'daily_task',
      entityId: result.documentId,
      entityName: result.title,
      description: `${action === 'complete' ? 'Completed' : action === 'start' ? 'Started' : action === 'cancel' ? 'Cancelled' : 'Updated'} daily task: ${result.title}`,
      descriptionUk,
      dataBefore: original,
      dataAfter: task || result,
      module: 'admin',
      severity: action === 'cancel' ? 'warning' : 'info',
      metadata: {
        title: result.title,
        previousStatus: original?.status,
        newStatus: result.status,
        priority: result.priority,
        priorityUk: PRIORITY_UK[result.priority] || result.priority,
        category: result.category,
        categoryUk: CATEGORY_UK[result.category] || result.category,
        assignee: task?.assignee?.username,
        completedAt: result.completedAt,
        startedAt: result.startedAt
      }
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::daily-task.daily-task').findOne({
          documentId: where.documentId,
          populate: ['assignee']
        });
        event.state = { entity };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterDelete(event) {
    const { state, params } = event;
    const entity = state?.entity;

    await logAction(strapi, {
      action: 'delete',
      entityType: 'daily_task',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity?.title,
      description: `Deleted daily task: ${entity?.title || params.where?.documentId}`,
      descriptionUk: `Видалено завдання: ${entity?.title || params.where?.documentId}`,
      dataBefore: entity,
      module: 'admin',
      severity: 'warning',
      metadata: {
        title: entity?.title,
        status: entity?.status,
        priority: entity?.priority,
        priorityUk: entity?.priority ? (PRIORITY_UK[entity.priority] || entity.priority) : undefined,
        category: entity?.category,
        categoryUk: entity?.category ? (CATEGORY_UK[entity.category] || entity.category) : undefined,
      }
    });
  }
};
