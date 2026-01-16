import { factories } from '@strapi/strapi';
import { logAction } from '../../../utils/action-logger';

const LOG_PREFIX = '[Order]';

function logOrder(
  level: 'info' | 'success' | 'error' | 'warn',
  message: string,
  context?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const logData = { timestamp, ...context };
  switch (level) {
    case 'error':
      console.error(`${LOG_PREFIX} ${message}`, logData);
      break;
    case 'warn':
      console.warn(`${LOG_PREFIX} ${message}`, logData);
      break;
    default:
      console.log(`${LOG_PREFIX} ${message}`, logData);
  }
}

type Station = 'grill' | 'fry' | 'salad' | 'hot' | 'dessert' | 'bar' | 'pass' | 'prep';

// Station mapping based on menu item category or type
function determineStation(menuItem: any): Station {
  const category = menuItem?.category?.slug || menuItem?.categorySlug || '';
  const name = (menuItem?.name || '').toLowerCase();

  if (category.includes('drink') || category.includes('напо') || category.includes('bar')) {
    return 'bar';
  }
  if (category.includes('dessert') || category.includes('десерт')) {
    return 'dessert';
  }
  if (category.includes('salad') || category.includes('салат') || category.includes('cold')) {
    return 'salad';
  }
  if (category.includes('soup') || category.includes('суп')) {
    return 'hot';
  }
  if (name.includes('гриль') || name.includes('стейк') || name.includes('grill')) {
    return 'grill';
  }
  if (name.includes('фрі') || name.includes('картопл') || name.includes('fry')) {
    return 'fry';
  }
  return 'hot';
}

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  /**
   * Add items to existing order
   * POST /api/orders/:documentId/items
   */
  async addItems(ctx) {
    const { documentId } = ctx.params;
    const { items, version } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!Array.isArray(items) || items.length === 0) {
      return ctx.badRequest('items array is required');
    }

    logOrder('info', '→ ADD ITEMS to order requested', {
      orderId: documentId,
      itemsCount: items.length,
      user: user?.username || 'POS',
    });

    // Find order with full details
    const order = await strapi.documents('api::order.order').findOne({
      documentId,
      populate: {
        table: true,
        items: true,
        waiter: true,
      },
    });

    if (!order) {
      logOrder('error', '✗ ADD ITEMS failed: order not found', { orderId: documentId });
      return ctx.notFound('Order not found');
    }

    // Validate order status
    const allowedStatuses = ['new', 'confirmed', 'in_kitchen', 'ready'];
    if (!allowedStatuses.includes(order.status)) {
      return ctx.badRequest(
        `Неможливо додати страви до замовлення зі статусом "${order.status}"`
      );
    }

    // Optimistic locking check
    if (version !== undefined && order.version !== version) {
      logOrder('warn', '⚠ Version conflict detected', {
        orderId: documentId,
        expectedVersion: version,
        actualVersion: order.version,
      });
      return ctx.conflict(
        'Замовлення було змінено іншим користувачем. Перезавантажте дані.'
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Get max courseIndex from existing items
    const existingItems = order.items || [];
    let maxCourseIndex = existingItems.reduce(
      (max, item) => Math.max(max, item.courseIndex || 0),
      0
    );

    // Create order items and kitchen tickets
    const createdItems: any[] = [];
    const createdTickets: any[] = [];
    let addedTotal = 0;

    for (const itemData of items) {
      const { menuItemId, quantity, notes, courseType, modifiers } = itemData;

      if (!menuItemId) {
        continue;
      }

      // Find menu item
      const menuItem = await strapi.documents('api::menu-item.menu-item').findOne({
        documentId: menuItemId,
        populate: ['category'],
      });

      if (!menuItem) {
        logOrder('warn', `Menu item not found: ${menuItemId}`);
        continue;
      }

      const itemQuantity = quantity || 1;
      const unitPrice = menuItem.price || 0;
      const totalPrice = unitPrice * itemQuantity;
      addedTotal += totalPrice;

      maxCourseIndex++;

      // Create order item
      const orderItem = await strapi.documents('api::order-item.order-item').create({
        data: {
          order: { documentId },
          menuItem: { documentId: menuItemId },
          quantity: itemQuantity,
          unitPrice,
          totalPrice,
          status: 'queued',
          statusChangedAt: nowIso,
          courseType: courseType || 'main',
          courseIndex: maxCourseIndex,
          notes: notes || null,
          modifiers: modifiers || [],
        },
      });

      createdItems.push({
        documentId: orderItem.documentId,
        menuItemName: menuItem.name,
        quantity: itemQuantity,
        unitPrice,
        totalPrice,
      });

      // Generate ticket number
      const ticketCount = await strapi
        .documents('api::kitchen-ticket.kitchen-ticket')
        .count({});
      const ticketNumber = `T${String(ticketCount + 1).padStart(6, '0')}`;

      // Create kitchen ticket
      const station = determineStation(menuItem);
      const ticket = await strapi
        .documents('api::kitchen-ticket.kitchen-ticket')
        .create({
          data: {
            ticketNumber,
            order: { documentId },
            orderItem: { documentId: orderItem.documentId },
            status: 'queued',
            station,
            priority: 'normal',
            priorityScore: 0,
          },
        });

      createdTickets.push({
        documentId: ticket.documentId,
        ticketNumber,
        station,
      });
    }

    if (createdItems.length === 0) {
      return ctx.badRequest('No valid items to add');
    }

    // Update order total and version
    const newTotal = (order.totalAmount || 0) + addedTotal;
    const newVersion = (order.version || 1) + 1;

    // Update order status if it was 'new' or 'confirmed'
    let newStatus = order.status;
    if (['new', 'confirmed'].includes(order.status)) {
      newStatus = 'in_kitchen';
    }

    await strapi.documents('api::order.order').update({
      documentId,
      data: {
        totalAmount: newTotal,
        version: newVersion,
        status: newStatus,
      },
    });

    logOrder('success', '✓ ADD ITEMS completed', {
      orderId: documentId,
      orderNumber: order.orderNumber,
      itemsAdded: createdItems.length,
      addedTotal,
      newTotal,
    });

    // Log action
    await logAction(strapi, {
      action: 'add_items',
      entityType: 'order',
      entityId: documentId,
      entityName: order.orderNumber,
      description: `Items added to order: ${order.orderNumber}`,
      descriptionUk: `➕ Додано страви до замовлення ${order.orderNumber}: ${createdItems.map((i) => i.menuItemName).join(', ')} (+${addedTotal.toFixed(2)} ₴)`,
      dataBefore: {
        itemsCount: existingItems.length,
        totalAmount: order.totalAmount,
      },
      dataAfter: {
        itemsCount: existingItems.length + createdItems.length,
        totalAmount: newTotal,
        addedItems: createdItems,
      },
      metadata: {
        orderNumber: order.orderNumber,
        tableNumber: order.table?.number,
        itemsAdded: createdItems.length,
        ticketsCreated: createdTickets.length,
        addedTotal,
        previousTotal: order.totalAmount,
        newTotal,
        version: newVersion,
      },
      module: 'pos',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      items: createdItems,
      tickets: createdTickets,
      order: {
        documentId,
        orderNumber: order.orderNumber,
        totalAmount: newTotal,
        version: newVersion,
        status: newStatus,
      },
    });
  },
}));
