/**
 * Order Item Lifecycle Hooks
 * - Validates status transitions according to FSM
 * - Auto-creates KitchenTicket when order item is created
 * - Logs actions to action-history
 */

import { logAction } from '../../../../utils/action-logger';

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

// Kitchen station type from Strapi schema
type KitchenStation = 'bar' | 'fry' | 'prep' | 'salad' | 'grill' | 'hot' | 'pass' | 'dessert';

// Map outputType to station
const OUTPUT_TO_STATION: Record<string, KitchenStation> = {
  kitchen: 'hot',
  bar: 'bar',
  pastry: 'dessert',
  cold: 'salad',
};

// Valid stations for validation
const VALID_STATIONS: KitchenStation[] = ['bar', 'fry', 'prep', 'salad', 'grill', 'hot', 'pass', 'dessert'];

/**
 * Generate unique ticket number
 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TKT-${timestamp}-${random}`;
}

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Fetch original data for action logging
    const orderItem = await strapi.documents('api::order-item.order-item').findOne({
      documentId: where.documentId,
      populate: ['menuItem']
    });

    if (!orderItem) return;

    // Store original for action logging
    event.state = { original: orderItem };

    // Only validate if status is being changed
    if (data.status) {
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
    }
  },

  async beforeCreate(event) {
    const { data } = event.params;

    // Calculate total price
    if (data.quantity && data.unitPrice) {
      data.totalPrice = data.quantity * data.unitPrice;
    }

    // Set default status
    if (!data.status) {
      data.status = 'queued';
    }
  },

  /**
   * After order item is created, automatically create a kitchen ticket
   */
  async afterCreate(event) {
    const { result } = event;

    try {
      // Get menu item to determine station
      const orderItem = await strapi.documents('api::order-item.order-item').findOne({
        documentId: result.documentId,
        populate: ['menuItem', 'order']
      });

      if (!orderItem?.menuItem || !orderItem?.order) {
        console.log('[OrderItem] Missing menuItem or order, skipping ticket creation');
        return;
      }

      const menuItem = orderItem.menuItem;
      const order = orderItem.order;

      // Note: Order item creation is NOT logged to action history
      // All items are shown in the table session close log instead

      // Determine station from outputType or primaryStation
      let stationValue = menuItem.primaryStation || OUTPUT_TO_STATION[menuItem.outputType] || 'hot';

      // Validate station is one of allowed values
      const station: KitchenStation = VALID_STATIONS.includes(stationValue as KitchenStation)
        ? (stationValue as KitchenStation)
        : 'hot';

      // Calculate priority score
      const priorityScore = 50; // normal
      // VIP tables or rush orders would have higher priority
      // This can be extended based on order.priority field

      // Create kitchen ticket
      const ticketData: {
        ticketNumber: string;
        order: string;
        orderItem: string;
        status: 'queued';
        station: KitchenStation;
        priority: 'vip' | 'normal' | 'rush';
        priorityScore: number;
        inventoryLocked: boolean;
      } = {
        ticketNumber: generateTicketNumber(),
        order: order.documentId,
        orderItem: result.documentId,
        status: 'queued',
        station,
        priority: 'normal',
        priorityScore,
        inventoryLocked: false,
      };

      const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').create({
        data: ticketData
      });

      console.log(`[OrderItem] Created kitchen ticket: ${ticket.ticketNumber} for ${menuItem.name}`);

      // Create initial ticket event (for internal tracking, not action log)
      await strapi.documents('api::ticket-event.ticket-event').create({
        data: {
          kitchenTicket: ticket.documentId,
          eventType: 'created',
          previousStatus: null,
          newStatus: 'queued',
          metadata: {
            station: station,
            priority: 'normal',
            menuItemName: menuItem.name,
            quantity: orderItem.quantity,
          }
        }
      });

      // Note: Order item creation is NOT logged to action history
      // All items are shown in the table session close log instead

    } catch (error) {
      // Log but don't throw - ticket creation failure should not block order
      console.error('[OrderItem] Failed to create kitchen ticket:', error);
    }
  },

  async afterUpdate(event) {
    const { result, state } = event;
    const original = state?.original;

    // Only log cancellations/voids - other status changes are tracked via kitchen tickets
    // This prevents duplicate logs for each cooking step
    const isCancellation = result.status === 'cancelled' || result.status === 'voided';

    if (isCancellation && original?.status !== result.status) {
      const orderItem = await strapi.documents('api::order-item.order-item').findOne({
        documentId: result.documentId,
        populate: ['menuItem', 'order']
      });

      const menuItemName = orderItem?.menuItem?.name || original?.menuItem?.name || 'Unknown';

      await logAction(strapi, {
        action: 'cancel',
        entityType: 'order_item',
        entityId: result.documentId,
        entityName: `${menuItemName} x${result.quantity || original?.quantity}`,
        description: `Cancelled order item: ${menuItemName}`,
        descriptionUk: `Позицію скасовано: ${menuItemName}`,
        dataBefore: { status: original?.status },
        dataAfter: { status: result.status },
        module: 'pos',
        severity: 'warning',
        metadata: {
          menuItemName,
          quantity: result.quantity,
          orderNumber: orderItem?.order?.orderNumber,
          reason: result.status === 'voided' ? 'Анульовано' : 'Скасовано клієнтом',
        }
      });
    }

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
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::order-item.order-item').findOne({
          documentId: where.documentId,
          populate: ['menuItem', 'order']
        });
        event.state = { entity };
      } catch (e) {
        // Ignore if entity not found
      }
    }
  },

  async afterDelete(event) {
    const { state, params } = event;
    const entity = state?.entity;

    const menuItemName = entity?.menuItem?.name || 'Unknown';
    await logAction(strapi, {
      action: 'delete',
      entityType: 'order_item',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity ? `${menuItemName} x${entity.quantity}` : undefined,
      description: `Deleted order item: ${menuItemName}${entity?.order?.orderNumber ? ` from order ${entity.order.orderNumber}` : ''}`,
      dataBefore: entity,
      module: 'pos',
      severity: 'warning',
      metadata: {
        menuItemName,
        quantity: entity?.quantity,
        orderId: entity?.order?.documentId,
        orderNumber: entity?.order?.orderNumber
      }
    });
  }
};
