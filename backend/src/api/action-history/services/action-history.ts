import { factories } from '@strapi/strapi';

type ActionType = 'create' | 'update' | 'delete' | 'start' | 'complete' | 'cancel' | 'receive' | 'write_off' | 'transfer' | 'login' | 'logout' | 'approve' | 'reject' | 'assign' | 'unassign';
type EntityType = 'order' | 'order_item' | 'kitchen_ticket' | 'menu_item' | 'menu_category' | 'ingredient' | 'stock_batch' | 'inventory_movement' | 'recipe' | 'table' | 'reservation' | 'scheduled_order' | 'daily_task' | 'user' | 'supplier' | 'worker_performance';
type ModuleType = 'pos' | 'kitchen' | 'storage' | 'admin' | 'reservations' | 'system';
type SeverityType = 'info' | 'warning' | 'critical';

export default factories.createCoreService('api::action-history.action-history', ({ strapi }) => ({
  /**
   * Log an action to action history
   */
  async logAction(data: {
    action: ActionType;
    entityType: EntityType;
    entityId: string;
    entityName?: string;
    description: string;
    descriptionUk?: string;
    dataBefore?: object;
    dataAfter?: object;
    changedFields?: string[];
    metadata?: object;
    performedBy?: string;
    performedByName?: string;
    performedByRole?: string;
    ipAddress?: string;
    userAgent?: string;
    module?: ModuleType;
    severity?: SeverityType;
  }) {
    try {
      return await strapi.documents('api::action-history.action-history').create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          description: data.description,
          descriptionUk: data.descriptionUk,
          dataBefore: data.dataBefore as any,
          dataAfter: data.dataAfter as any,
          changedFields: data.changedFields as any,
          metadata: data.metadata as any,
          performedBy: data.performedBy,
          performedByName: data.performedByName,
          performedByRole: data.performedByRole,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          module: data.module || 'system',
          severity: data.severity || 'info',
        },
      });
    } catch (error) {
      strapi.log.error('Failed to log action:', error);
      // Don't throw - logging should not break main operations
    }
  },

  /**
   * Get changed fields between two objects
   */
  getChangedFields(before: object, after: object): string[] {
    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

    for (const key of allKeys) {
      const beforeVal = JSON.stringify((before as any)?.[key]);
      const afterVal = JSON.stringify((after as any)?.[key]);
      if (beforeVal !== afterVal) {
        changed.push(key);
      }
    }

    return changed;
  },

  /**
   * Format entity for storage (remove sensitive fields, limit size)
   */
  formatEntityData(entity: object): object {
    if (!entity) return {};

    const sensitiveFields = ['password', 'token', 'secret', 'api_key'];
    const cleaned = { ...entity };

    for (const field of sensitiveFields) {
      if ((cleaned as any)[field]) {
        (cleaned as any)[field] = '[REDACTED]';
      }
    }

    // Limit JSON size
    const json = JSON.stringify(cleaned);
    if (json.length > 10000) {
      return { _truncated: true, _size: json.length };
    }

    return cleaned;
  },
}));
