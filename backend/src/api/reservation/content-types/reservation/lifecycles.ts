/**
 * Reservation Lifecycle Hooks
 * Logs actions for reservation changes
 */

import { logAction } from '../../../../utils/action-logger';

export default {
  async beforeUpdate(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::reservation.reservation').findOne({
          documentId: where.documentId
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
      entityType: 'reservation',
      entityId: result.documentId,
      entityName: result.guestName,
      description: `Created reservation for: ${result.guestName}`,
      dataAfter: result,
      module: 'reservations',
    });
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Determine action type based on status
    let action: 'update' | 'cancel' | 'approve' = 'update';
    if (result.status === 'cancelled' && original?.status !== 'cancelled') {
      action = 'cancel';
    } else if (result.status === 'confirmed' && original?.status === 'pending') {
      action = 'approve';
    }

    await logAction(strapi, {
      action,
      entityType: 'reservation',
      entityId: result.documentId,
      entityName: result.guestName,
      description: action === 'cancel'
        ? `Cancelled reservation for: ${result.guestName}`
        : action === 'approve'
        ? `Confirmed reservation for: ${result.guestName}`
        : `Updated reservation for: ${result.guestName}`,
      dataBefore: original,
      dataAfter: result,
      module: 'reservations',
      severity: action === 'cancel' ? 'warning' : 'info',
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::reservation.reservation').findOne({
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
      entityType: 'reservation',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity?.guestName,
      description: `Deleted reservation for: ${entity?.guestName || params.where?.documentId}`,
      dataBefore: entity,
      module: 'reservations',
      severity: 'warning',
    });
  }
};
