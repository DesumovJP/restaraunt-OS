/**
 * Scheduled Order Lifecycle Hooks
 * Logs actions for scheduled/planned orders (events, reservations, HoReCa)
 */

import { logAction } from '../../../../utils/action-logger';

export default {
  async beforeUpdate(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::scheduled-order.scheduled-order').findOne({
          documentId: where.documentId,
          populate: ['table', 'assignedCoordinator']
        });
        event.state = { original };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Get with relations
    const order = await strapi.documents('api::scheduled-order.scheduled-order').findOne({
      documentId: result.documentId,
      populate: ['table', 'assignedCoordinator']
    });

    const scheduledDate = new Date(result.scheduledFor).toLocaleDateString('uk-UA');
    const eventLabel = result.eventName || result.eventType || 'замовлення';

    await logAction(strapi, {
      action: 'create',
      entityType: 'scheduled_order',
      entityId: result.documentId,
      entityName: `${eventLabel} на ${scheduledDate}`,
      description: `Created scheduled order: ${eventLabel} for ${result.contactName || 'guest'} on ${scheduledDate}`,
      dataAfter: order || result,
      module: 'reservations',
      metadata: {
        eventType: result.eventType,
        eventName: result.eventName,
        scheduledFor: result.scheduledFor,
        guestCount: result.guestCount,
        contactName: result.contactName,
        contactPhone: result.contactPhone,
        tableNumber: order?.table?.number,
        seatingArea: result.seatingArea,
        menuPreset: result.menuPreset,
        totalAmount: result.totalAmount,
        coordinator: order?.assignedCoordinator?.username
      }
    });
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Get with relations
    const order = await strapi.documents('api::scheduled-order.scheduled-order').findOne({
      documentId: result.documentId,
      populate: ['table', 'assignedCoordinator']
    });

    // Determine action based on status change
    let action: 'update' | 'approve' | 'cancel' | 'complete' | 'start' = 'update';
    let severity: 'info' | 'warning' = 'info';

    if (result.status !== original?.status) {
      if (result.status === 'activated') {
        action = 'start';
      } else if (result.status === 'completed') {
        action = 'complete';
      } else if (result.status === 'cancelled') {
        action = 'cancel';
        severity = 'warning';
      }
    }

    // Check for confirmation
    if (result.confirmedAt && !original?.confirmedAt) {
      action = 'approve';
    }

    const scheduledDate = new Date(result.scheduledFor).toLocaleDateString('uk-UA');
    const eventLabel = result.eventName || result.eventType || 'замовлення';

    await logAction(strapi, {
      action,
      entityType: 'scheduled_order',
      entityId: result.documentId,
      entityName: `${eventLabel} на ${scheduledDate}`,
      description: `${action === 'approve' ? 'Confirmed' : action === 'cancel' ? 'Cancelled' : action === 'start' ? 'Activated' : action === 'complete' ? 'Completed' : 'Updated'} scheduled order for ${result.contactName || 'guest'}`,
      dataBefore: original,
      dataAfter: order || result,
      module: 'reservations',
      severity,
      metadata: {
        eventType: result.eventType,
        previousStatus: original?.status,
        newStatus: result.status,
        scheduledFor: result.scheduledFor,
        guestCount: result.guestCount,
        contactName: result.contactName,
        tableNumber: order?.table?.number,
        paymentStatus: result.paymentStatus,
        depositAmount: result.depositAmount,
        totalAmount: result.totalAmount
      }
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::scheduled-order.scheduled-order').findOne({
          documentId: where.documentId,
          populate: ['table']
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

    const scheduledDate = entity ? new Date(entity.scheduledFor).toLocaleDateString('uk-UA') : 'unknown';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'scheduled_order',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity ? `${entity.eventName || entity.eventType} на ${scheduledDate}` : undefined,
      description: `Deleted scheduled order for ${entity?.contactName || 'guest'} on ${scheduledDate}`,
      dataBefore: entity,
      module: 'reservations',
      severity: 'warning',
      metadata: {
        eventType: entity?.eventType,
        scheduledFor: entity?.scheduledFor,
        contactName: entity?.contactName,
        totalAmount: entity?.totalAmount
      }
    });
  }
};
