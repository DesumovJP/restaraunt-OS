/**
 * Order Lifecycle Hooks
 * Validates status transitions according to FSM
 */

import { logAction } from '../../../../utils/action-logger';

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['in_kitchen', 'cancelled'],
  in_kitchen: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['paid'],
  cancelled: [],
  paid: []
};

// Ukrainian status descriptions for action log
const STATUS_DESCRIPTIONS_UK: Record<string, string> = {
  confirmed: 'підтверджено',
  in_kitchen: 'передано на кухню',
  ready: 'готове до видачі',
  served: 'подано',
  paid: 'оплачено',
  cancelled: 'скасовано',
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Store original for action logging
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::order.order').findOne({
          documentId: where.documentId
        });
        event.state = { original };

        // Validate status transition
        if (data.status && original) {
          const allowed = VALID_TRANSITIONS[original.status] || [];
          if (!allowed.includes(data.status)) {
            throw new Error(
              `Invalid order transition: ${original.status} -> ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
            );
          }
        }
      } catch (e: any) {
        if (e.message?.includes('Invalid order transition')) throw e;
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Generate order number if not set
    if (!result.orderNumber) {
      const date = new Date();
      const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

      await strapi.documents('api::order.order').update({
        documentId: result.documentId,
        data: {
          orderNumber: `${prefix}-${random}`
        }
      });
    }

    // Note: Order creation is NOT logged to action history
    // All order info is shown in the table session close log instead
  },

  async afterUpdate(event) {
    const { result } = event;

    // If order is marked as served, update table status
    if (result.status === 'served' && result.table) {
      const table = await strapi.documents('api::table.table').findOne({
        documentId: typeof result.table === 'string' ? result.table : result.table.documentId
      });

      if (table && table.status === 'occupied') {
        // Check if there are other active orders for this table
        const activeOrders = await strapi.documents('api::order.order').findMany({
          filters: {
            table: { documentId: table.documentId },
            status: { $notIn: ['served', 'cancelled', 'paid'] }
          }
        });

        if (activeOrders.length === 0) {
          // All orders served, table can be marked for billing
          // Don't auto-free yet, wait for payment
        }
      }
    }

    // If order is paid, free the table
    if (result.status === 'paid' && result.table) {
      const tableDocId = typeof result.table === 'string' ? result.table : result.table.documentId;

      // Check for other unpaid orders at this table
      const unpaidOrders = await strapi.documents('api::order.order').findMany({
        filters: {
          table: { documentId: tableDocId },
          status: { $notIn: ['cancelled', 'paid'] }
        }
      });

      if (unpaidOrders.length === 0) {
        await strapi.documents('api::table.table').update({
          documentId: tableDocId,
          data: {
            status: 'free',
            currentGuests: null,
            occupiedAt: null
          }
        });
      }
    }

    // Note: Order status changes are NOT logged to action history individually
    // All order info is shown in the table session close log instead
    // Only log cancellations as they are important operational events
    const original = event.state?.original;
    const statusChanged = original && original.status !== result.status;

    if (statusChanged && result.status === 'cancelled') {
      await logAction(strapi, {
        action: 'cancel',
        entityType: 'order',
        entityId: result.documentId,
        entityName: result.orderNumber,
        description: `Order ${result.orderNumber} cancelled`,
        descriptionUk: `Замовлення ${result.orderNumber} скасовано`,
        dataBefore: { status: original.status },
        dataAfter: { status: result.status },
        metadata: {
          orderNumber: result.orderNumber,
          tableNumber: result.table?.number,
        },
        module: 'pos',
        severity: 'warning',
      });
    }
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::order.order').findOne({
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
      entityType: 'order',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity?.orderNumber,
      description: `Deleted order: ${entity?.orderNumber || params.where?.documentId}`,
      dataBefore: entity,
      module: 'pos',
      severity: 'warning',
    });
  }
};
