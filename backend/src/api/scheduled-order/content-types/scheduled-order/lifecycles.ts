/**
 * Scheduled Order Lifecycle Hooks
 * Logs actions for scheduled/planned orders (events, reservations, HoReCa)
 */

import { logAction } from '../../../../utils/action-logger';

// Ukrainian event type translations
const EVENT_TYPE_UK: Record<string, string> = {
  birthday: 'День народження',
  corporate: 'Корпоратив',
  wedding: 'Весілля',
  anniversary: 'Ювілей',
  banquet: 'Банкет',
  catering: 'Кейтеринг',
  other: 'Інше',
};

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
    const eventTypeUk = EVENT_TYPE_UK[result.eventType] || result.eventType || 'Захід';
    const tableInfo = order?.table?.number ? ` (Стіл ${order.table.number})` : '';

    await logAction(strapi, {
      action: 'create',
      entityType: 'scheduled_order',
      entityId: result.documentId,
      entityName: `${eventLabel} на ${scheduledDate}`,
      description: `Created scheduled order: ${eventLabel} for ${result.contactName || 'guest'} on ${scheduledDate}`,
      descriptionUk: `Нове замовлення: ${result.eventName || eventTypeUk} для ${result.contactName || 'гостя'}${tableInfo} на ${scheduledDate} (${result.guestCount || '?'} гостей)`,
      dataAfter: order || result,
      module: 'reservations',
      metadata: {
        eventType: result.eventType,
        eventTypeUk,
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
    const eventTypeUk = EVENT_TYPE_UK[result.eventType] || result.eventType || 'Захід';

    // Build Ukrainian description based on action
    let descriptionUk = `Оновлено замовлення: ${result.eventName || eventTypeUk} для ${result.contactName || 'гостя'}`;
    if (action === 'approve') {
      descriptionUk = `✓ Підтверджено: ${result.eventName || eventTypeUk} для ${result.contactName || 'гостя'} на ${scheduledDate}`;
    } else if (action === 'cancel') {
      descriptionUk = `Скасовано: ${result.eventName || eventTypeUk} для ${result.contactName || 'гостя'} на ${scheduledDate}`;
    } else if (action === 'start') {
      descriptionUk = `▶ Розпочато: ${result.eventName || eventTypeUk} (${result.guestCount || '?'} гостей)`;
    } else if (action === 'complete') {
      const totalStr = result.totalAmount ? ` - ${result.totalAmount}₴` : '';
      descriptionUk = `✓ Завершено: ${result.eventName || eventTypeUk}${totalStr}`;
    }

    await logAction(strapi, {
      action,
      entityType: 'scheduled_order',
      entityId: result.documentId,
      entityName: `${eventLabel} на ${scheduledDate}`,
      description: `${action === 'approve' ? 'Confirmed' : action === 'cancel' ? 'Cancelled' : action === 'start' ? 'Activated' : action === 'complete' ? 'Completed' : 'Updated'} scheduled order for ${result.contactName || 'guest'}`,
      descriptionUk,
      dataBefore: original,
      dataAfter: order || result,
      module: 'reservations',
      severity,
      metadata: {
        eventType: result.eventType,
        eventTypeUk,
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

    const scheduledDate = entity ? new Date(entity.scheduledFor).toLocaleDateString('uk-UA') : 'невідомо';
    const eventTypeUk = entity?.eventType ? (EVENT_TYPE_UK[entity.eventType] || entity.eventType) : 'Захід';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'scheduled_order',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity ? `${entity.eventName || entity.eventType} на ${scheduledDate}` : undefined,
      description: `Deleted scheduled order for ${entity?.contactName || 'guest'} on ${scheduledDate}`,
      descriptionUk: `Видалено замовлення: ${entity?.eventName || eventTypeUk} для ${entity?.contactName || 'гостя'} на ${scheduledDate}`,
      dataBefore: entity,
      module: 'reservations',
      severity: 'warning',
      metadata: {
        eventType: entity?.eventType,
        eventTypeUk,
        scheduledFor: entity?.scheduledFor,
        contactName: entity?.contactName,
        totalAmount: entity?.totalAmount
      }
    });
  }
};
