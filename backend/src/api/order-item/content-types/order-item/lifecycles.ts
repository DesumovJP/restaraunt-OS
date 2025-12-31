/**
 * Order Item Lifecycle Hooks
 * Validates status transitions according to FSM
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['queued', 'cancelled'],
  queued: ['pending', 'cancelled'],
  pending: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled', 'voided'],
  ready: ['served', 'returned'],
  served: ['returned'],
  returned: ['queued'], // Can be re-queued after return
  cancelled: [],
  voided: []
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Only validate if status is being changed
    if (!data.status) return;

    const orderItem = await strapi.documents('api::order-item.order-item').findOne({
      documentId: where.documentId
    });

    if (!orderItem) return;

    const allowed = VALID_TRANSITIONS[orderItem.status] || [];

    if (!allowed.includes(data.status)) {
      throw new Error(
        `Invalid order item transition: ${orderItem.status} -> ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    // Auto-set statusChangedAt
    if (data.status !== orderItem.status) {
      data.statusChangedAt = new Date().toISOString();
    }
  },

  async beforeCreate(event) {
    const { data } = event.params;

    // Calculate total price
    if (data.quantity && data.unitPrice) {
      data.totalPrice = data.quantity * data.unitPrice;
    }
  },

  async afterUpdate(event) {
    const { result } = event;

    // If item is served, update order status if all items are served
    if (result.status === 'served' && result.order) {
      const orderDocId = typeof result.order === 'string' ? result.order : result.order.documentId;

      const orderItems = await strapi.documents('api::order-item.order-item').findMany({
        filters: {
          order: { documentId: orderDocId }
        }
      });

      const allServed = orderItems.every(item =>
        item.status === 'served' || item.status === 'cancelled' || item.status === 'voided'
      );

      if (allServed) {
        const order = await strapi.documents('api::order.order').findOne({
          documentId: orderDocId
        });

        if (order && order.status === 'ready') {
          await strapi.documents('api::order.order').update({
            documentId: orderDocId,
            data: { status: 'served' }
          });
        }
      }
    }
  }
};
