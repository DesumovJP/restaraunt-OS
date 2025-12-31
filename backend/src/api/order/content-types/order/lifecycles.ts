/**
 * Order Lifecycle Hooks
 * Validates status transitions according to FSM
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['in_kitchen', 'cancelled'],
  in_kitchen: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['paid'],
  cancelled: [],
  paid: []
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Only validate if status is being changed
    if (!data.status) return;

    const order = await strapi.documents('api::order.order').findOne({
      documentId: where.documentId
    });

    if (!order) return;

    const allowed = VALID_TRANSITIONS[order.status] || [];

    if (!allowed.includes(data.status)) {
      throw new Error(
        `Invalid order transition: ${order.status} -> ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
      );
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
  }
};
