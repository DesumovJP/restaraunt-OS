/**
 * Table Lifecycle Hooks
 * Logs actions for table changes and status transitions
 */

import { logAction } from '../../../../utils/action-logger';

export default {
  async beforeUpdate(event) {
    const { where, data } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::table.table').findOne({
          documentId: where.documentId
        });
        event.state = { original };

        // Auto-set occupiedAt when table becomes occupied
        if (data.status === 'occupied' && original?.status !== 'occupied') {
          event.params.data.occupiedAt = new Date().toISOString();
        }

        // Clear occupiedAt when table becomes free
        if (data.status === 'free' && original?.status !== 'free') {
          event.params.data.occupiedAt = null;
          event.params.data.currentGuests = null;
        }
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;

    await logAction(strapi, {
      action: 'create',
      entityType: 'table',
      entityId: result.documentId,
      entityName: `Стіл №${result.number}`,
      description: `Created table: #${result.number}`,
      dataAfter: result,
      module: 'admin',
      metadata: {
        number: result.number,
        capacity: result.capacity,
        zone: result.zone,
        status: result.status
      }
    });
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Skip logging if no actual status change - reduces spam
    // Also skip 'free' status change as it's logged by the close controller with more details
    if (!original || original.status === result.status) {
      return;
    }

    // Skip logging when table is freed - this is handled by the /close endpoint with full analytics
    if (result.status === 'free') {
      return;
    }

    // Only log meaningful status transitions
    let descriptionUk = `Стіл №${result.number} оновлено`;

    if (result.status === 'occupied') {
      descriptionUk = `Стіл №${result.number} зайнято (${result.currentGuests || '?'} гостей)`;
    } else if (result.status === 'reserved') {
      descriptionUk = `Стіл №${result.number} заброньовано для ${result.reservedBy || 'гостя'}`;
    }

    await logAction(strapi, {
      action: 'update',
      entityType: 'table',
      entityId: result.documentId,
      entityName: `Стіл №${result.number}`,
      description: `Table #${result.number} status: ${original.status} → ${result.status}`,
      descriptionUk,
      module: 'pos',
      severity: 'info',
      metadata: {
        tableNumber: result.number,
        zone: result.zone,
        guestCount: result.currentGuests,
      }
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::table.table').findOne({
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
      entityType: 'table',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity ? `Стіл №${entity.number}` : undefined,
      description: `Deleted table: #${entity?.number || params.where?.documentId}`,
      dataBefore: entity,
      module: 'admin',
      severity: 'warning',
      metadata: {
        number: entity?.number,
        capacity: entity?.capacity,
        zone: entity?.zone
      }
    });
  }
};
