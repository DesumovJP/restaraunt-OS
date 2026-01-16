/**
 * Action Logger Utility
 * Provides helper functions for logging actions to action-history
 */

import type { ActionType, Module } from './enums';

interface ActionLogParams {
  action: ActionType;
  entityType: string;
  entityId: string;
  entityName?: string;
  description: string;
  descriptionUk?: string;
  dataBefore?: object;
  dataAfter?: object;
  performedBy?: string;
  performedByName?: string;
  performedByRole?: string;
  module?: Module;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: object;
}

// Entity type to Ukrainian name mapping
const ENTITY_NAMES_UK: Record<string, string> = {
  order: 'Замовлення',
  order_item: 'Позиція замовлення',
  kitchen_ticket: 'Тікет кухні',
  menu_item: 'Страва меню',
  menu_category: 'Категорія меню',
  ingredient: 'Інгредієнт',
  stock_batch: 'Партія товару',
  inventory_movement: 'Рух інвентаря',
  recipe: 'Рецепт',
  table: 'Стіл',
  reservation: 'Бронювання',
  scheduled_order: 'Заплановане замовлення',
  daily_task: 'Щоденна задача',
  user: 'Користувач',
  supplier: 'Постачальник',
  worker_performance: 'Продуктивність працівника',
};

// Action to Ukrainian name mapping
const ACTION_NAMES_UK: Record<string, string> = {
  create: 'створено',
  update: 'оновлено',
  delete: 'видалено',
  start: 'розпочато',
  complete: 'завершено',
  cancel: 'скасовано',
  receive: 'отримано',
  write_off: 'списано',
  transfer: 'переміщено',
  login: 'вхід',
  logout: 'вихід',
  approve: 'схвалено',
  reject: 'відхилено',
  assign: 'призначено',
  unassign: 'знято призначення',
  // Table/Order specific actions
  emergency_close: 'екстрено закрито',
  merge: "об'єднано",
  unmerge: "роз'єднано",
  recall: 'відкликано',
  add_items: 'додано страви',
};

/**
 * Get changed fields between two objects
 */
function getChangedFields(before: object | null, after: object | null): string[] {
  const changed: string[] = [];
  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  for (const key of allKeys) {
    // Skip internal/meta fields
    if (key.startsWith('_') || ['createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy'].includes(key)) {
      continue;
    }

    const beforeVal = JSON.stringify((before as any)?.[key]);
    const afterVal = JSON.stringify((after as any)?.[key]);
    if (beforeVal !== afterVal) {
      changed.push(key);
    }
  }

  return changed;
}

/**
 * Format entity data for storage (remove sensitive fields, limit size)
 */
function formatEntityData(entity: object | null): object {
  if (!entity) return {};

  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'resetPasswordToken', 'confirmationToken'];
  const cleaned = { ...entity };

  for (const field of sensitiveFields) {
    if ((cleaned as any)[field]) {
      (cleaned as any)[field] = '[REDACTED]';
    }
  }

  // Limit JSON size
  const json = JSON.stringify(cleaned);
  if (json.length > 10000) {
    return { _truncated: true, _originalSize: json.length };
  }

  return cleaned;
}

/**
 * Generate Ukrainian description for action
 */
function generateDescriptionUk(action: string, entityType: string, entityName?: string): string {
  const actionUk = ACTION_NAMES_UK[action] || action;
  const entityUk = ENTITY_NAMES_UK[entityType] || entityType;

  if (entityName) {
    return `${entityUk} "${entityName}" ${actionUk}`;
  }
  return `${entityUk} ${actionUk}`;
}

/**
 * Log an action - to be called from lifecycle hooks
 */
export async function logAction(strapi: any, params: ActionLogParams): Promise<void> {
  try {
    const changedFields = params.dataBefore || params.dataAfter
      ? getChangedFields(params.dataBefore || {}, params.dataAfter || {})
      : undefined;

    const descriptionUk = params.descriptionUk ||
      generateDescriptionUk(params.action, params.entityType, params.entityName);

    await strapi.documents('api::action-history.action-history').create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        description: params.description,
        descriptionUk: descriptionUk,
        dataBefore: params.dataBefore ? formatEntityData(params.dataBefore) : null,
        dataAfter: params.dataAfter ? formatEntityData(params.dataAfter) : null,
        changedFields: changedFields,
        metadata: params.metadata,
        performedBy: params.performedBy,
        performedByName: params.performedByName,
        performedByRole: params.performedByRole,
        module: params.module || 'system',
        severity: params.severity || 'info',
      },
    });
  } catch (error) {
    // Log error but don't throw - action logging should not break main operations
    strapi.log.error('Failed to log action:', error);
  }
}

/**
 * Create lifecycle hooks for a content type
 */
export function createActionLoggerLifecycles(entityType: string, options?: {
  module?: 'pos' | 'kitchen' | 'storage' | 'admin' | 'reservations' | 'system';
  getEntityName?: (entity: any) => string;
  skipFields?: string[];
}) {
  const module = options?.module || 'system';
  const getEntityName = options?.getEntityName || ((e: any) => e.name || e.title || e.orderNumber || e.ticketNumber || null);

  return {
    async afterCreate(event: any) {
      const { result } = event;
      const strapi = (global as any).strapi;

      await logAction(strapi, {
        action: 'create',
        entityType,
        entityId: result.documentId,
        entityName: getEntityName(result),
        description: `Created ${entityType}: ${getEntityName(result) || result.documentId}`,
        dataAfter: result,
        module,
      });
    },

    async beforeUpdate(event: any) {
      const { params } = event;
      const strapi = (global as any).strapi;

      // Store original data for comparison
      if (params.where?.documentId) {
        try {
          const original = await strapi.documents(`api::${entityType}.${entityType}`).findOne({
            documentId: params.where.documentId,
          });
          event.state = { original };
        } catch (e) {
          // Ignore if entity not found
        }
      }
    },

    async afterUpdate(event: any) {
      const { result, state } = event;
      const strapi = (global as any).strapi;
      const original = state?.original;

      await logAction(strapi, {
        action: 'update',
        entityType,
        entityId: result.documentId,
        entityName: getEntityName(result),
        description: `Updated ${entityType}: ${getEntityName(result) || result.documentId}`,
        dataBefore: original,
        dataAfter: result,
        module,
      });
    },

    async beforeDelete(event: any) {
      const { params } = event;
      const strapi = (global as any).strapi;

      // Store entity data before deletion
      if (params.where?.documentId) {
        try {
          const entity = await strapi.documents(`api::${entityType}.${entityType}`).findOne({
            documentId: params.where.documentId,
          });
          event.state = { entity };
        } catch (e) {
          // Ignore if entity not found
        }
      }
    },

    async afterDelete(event: any) {
      const { state, params } = event;
      const strapi = (global as any).strapi;
      const entity = state?.entity;

      await logAction(strapi, {
        action: 'delete',
        entityType,
        entityId: params.where?.documentId || 'unknown',
        entityName: entity ? getEntityName(entity) : undefined,
        description: `Deleted ${entityType}: ${entity ? getEntityName(entity) : params.where?.documentId}`,
        dataBefore: entity,
        module,
        severity: 'warning',
      });
    },
  };
}

export default {
  logAction,
  createActionLoggerLifecycles,
  getChangedFields,
  formatEntityData,
  generateDescriptionUk,
  ENTITY_NAMES_UK,
  ACTION_NAMES_UK,
};
