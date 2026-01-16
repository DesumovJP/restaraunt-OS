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

    // Fetch table info for better logging
    let tableNumber = null;
    if (result.table) {
      try {
        const table = await strapi.documents('api::table.table').findOne({
          documentId: typeof result.table === 'string' ? result.table : result.table.documentId
        });
        tableNumber = table?.number;
      } catch (e) {
        // Ignore
      }
    }

    const dateStr = result.date ? new Date(result.date).toLocaleDateString('uk-UA') : '';
    const timeStr = result.startTime ? result.startTime.slice(0, 5) : '';

    await logAction(strapi, {
      action: 'create',
      entityType: 'reservation',
      entityId: result.documentId,
      entityName: result.contactName,
      description: `Created reservation for: ${result.contactName}`,
      descriptionUk: `Нове бронювання: ${result.contactName}${tableNumber ? ` (Стіл ${tableNumber})` : ''} на ${dateStr} ${timeStr}`,
      dataAfter: result,
      module: 'reservations',
      metadata: {
        tableNumber,
        date: result.date,
        time: result.startTime,
        guestCount: result.guestCount,
        contactPhone: result.contactPhone,
        confirmationCode: result.confirmationCode,
      },
    });
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Determine action type based on status
    let action: 'update' | 'cancel' | 'approve' | 'start' | 'complete' = 'update';
    let descriptionUk = `Оновлено бронювання: ${result.contactName}`;
    let severity: 'info' | 'warning' = 'info';

    if (result.status === 'cancelled' && original?.status !== 'cancelled') {
      action = 'cancel';
      descriptionUk = `Скасовано бронювання: ${result.contactName}`;
      severity = 'warning';
    } else if (result.status === 'confirmed' && original?.status === 'pending') {
      action = 'approve';
      descriptionUk = `Підтверджено бронювання: ${result.contactName}`;
    } else if (result.status === 'seated' && original?.status !== 'seated') {
      action = 'start';
      descriptionUk = `Гості прибули: ${result.contactName}`;
    } else if (result.status === 'completed' && original?.status !== 'completed') {
      action = 'complete';
      descriptionUk = `Завершено бронювання: ${result.contactName}`;
    } else if (result.status === 'no_show' && original?.status !== 'no_show') {
      action = 'cancel';
      descriptionUk = `Гості не прийшли: ${result.contactName}`;
      severity = 'warning';
    }

    await logAction(strapi, {
      action,
      entityType: 'reservation',
      entityId: result.documentId,
      entityName: result.contactName,
      description: action === 'cancel'
        ? `Cancelled reservation for: ${result.contactName}`
        : action === 'approve'
        ? `Confirmed reservation for: ${result.contactName}`
        : `Updated reservation for: ${result.contactName}`,
      descriptionUk,
      dataBefore: original,
      dataAfter: result,
      module: 'reservations',
      severity,
      metadata: {
        tableNumber: result.table?.number,
        date: result.date,
        time: result.startTime,
        guestCount: result.guestCount,
        status: result.status,
        previousStatus: original?.status,
      },
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
      entityName: entity?.contactName,
      description: `Deleted reservation for: ${entity?.contactName || params.where?.documentId}`,
      dataBefore: entity,
      module: 'reservations',
      severity: 'warning',
    });
  }
};
