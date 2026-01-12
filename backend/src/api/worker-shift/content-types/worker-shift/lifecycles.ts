/**
 * Worker Shift Lifecycle Hooks
 * Logs actions for shift changes
 */

import { logAction } from '../../../../utils/action-logger';

export default {
  async beforeUpdate(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::worker-shift.worker-shift').findOne({
          documentId: where.documentId,
          populate: ['worker']
        });
        event.state = { original };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;

    await logAction(strapi, {
      action: 'create',
      entityType: 'worker_performance',
      entityId: result.documentId,
      entityName: `Shift ${result.date}`,
      description: `Created shift for ${result.date}`,
      descriptionUk: `Створено зміну на ${result.date}`,
      dataAfter: result,
      module: 'admin',
    });
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Skip if logged by controller (clock-in/clock-out)
    if (result.status === 'started' || result.status === 'completed') {
      return;
    }

    let action: 'update' | 'cancel' = 'update';
    if (result.status === 'cancelled' && original?.status !== 'cancelled') {
      action = 'cancel';
    }

    await logAction(strapi, {
      action,
      entityType: 'worker_performance',
      entityId: result.documentId,
      entityName: `Shift ${result.date}`,
      description: action === 'cancel'
        ? `Cancelled shift for ${result.date}`
        : `Updated shift for ${result.date}`,
      descriptionUk: action === 'cancel'
        ? `Скасовано зміну на ${result.date}`
        : `Оновлено зміну на ${result.date}`,
      dataBefore: original,
      dataAfter: result,
      module: 'admin',
      severity: action === 'cancel' ? 'warning' : 'info',
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::worker-shift.worker-shift').findOne({
          documentId: where.documentId
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
      entityType: 'worker_performance',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity ? `Shift ${entity.date}` : undefined,
      description: `Deleted shift: ${entity?.date || params.where?.documentId}`,
      descriptionUk: `Видалено зміну: ${entity?.date || params.where?.documentId}`,
      dataBefore: entity,
      module: 'admin',
      severity: 'warning',
    });
  }
};
