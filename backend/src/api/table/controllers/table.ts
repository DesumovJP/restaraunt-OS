import { factories } from '@strapi/strapi';
import { logAction } from '../../../utils/action-logger';

const LOG_PREFIX = '[Table]';

function logTable(level: 'info' | 'success' | 'error' | 'warn', message: string, context?: Record<string, unknown>) {
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

export default factories.createCoreController('api::table.table', ({ strapi }) => ({
  /**
   * Close table - finalizes all orders, marks table as free, logs analytics
   * POST /api/tables/:documentId/close
   */
  async close(ctx) {
    const { documentId } = ctx.params;
    const { paymentMethod, tipAmount, notes } = ctx.request.body || {};
    const user = ctx.state?.user; // User is optional (auth: false)
    const startTime = Date.now();

    logTable('info', '→ CLOSE table requested', {
      tableId: documentId,
      user: user?.username || 'POS',
      paymentMethod,
      tipAmount,
    });

    // Find table with current data
    const table = await strapi.documents('api::table.table').findOne({
      documentId,
    });

    if (!table) {
      logTable('error', '✗ CLOSE failed: table not found', { tableId: documentId });
      return ctx.notFound('Table not found');
    }

    // Allow closing free tables if they have active orders (edge case)
    // This handles cases where table status wasn't properly synced
    if (table.status === 'reserved') {
      logTable('warn', '⚠ Closing reserved table', {
        tableId: documentId,
        currentStatus: table.status,
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Find all active orders for this table with full details
    const activeOrders = await strapi.documents('api::order.order').findMany({
      filters: {
        table: { documentId },
        status: { $notIn: ['cancelled', 'paid'] }
      },
      populate: {
        items: {
          populate: {
            menuItem: true,
          }
        },
        waiter: true,
      }
    });

    // Get kitchen tickets for timing info
    const kitchenTickets = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findMany({
      filters: {
        order: {
          table: { documentId }
        },
        status: { $in: ['ready', 'served'] }
      },
      populate: {
        orderItem: {
          populate: { menuItem: true }
        }
      }
    });

    // Build ticket lookup by orderItem documentId
    const ticketByOrderItem: Record<string, any> = {};
    for (const ticket of kitchenTickets) {
      if (ticket.orderItem?.documentId) {
        ticketByOrderItem[ticket.orderItem.documentId] = ticket;
      }
    }

    logTable('info', `  Found ${activeOrders.length} active orders to close`, {
      tableId: documentId,
      orderIds: activeOrders.map(o => o.documentId),
    });

    // Calculate session start time - use table.occupiedAt or earliest order createdAt
    let sessionStartedAt: Date;
    if (table.occupiedAt) {
      sessionStartedAt = new Date(table.occupiedAt);
    } else if (activeOrders.length > 0) {
      // Find earliest order creation time
      const orderDates = activeOrders.map(o => new Date(o.createdAt as any));
      sessionStartedAt = new Date(Math.min(...orderDates.map(d => d.getTime())));
    } else {
      sessionStartedAt = now;
    }
    const sessionDurationMs = now.getTime() - sessionStartedAt.getTime();
    const sessionDurationMinutes = Math.floor(sessionDurationMs / 60000);

    // If no active orders and table is already free, just return success
    if (activeOrders.length === 0 && table.status === 'free') {
      logTable('info', '  Table already free with no active orders', { tableId: documentId });
      return ctx.send({
        success: true,
        table,
        summary: {
          tableNumber: table.number,
          sessionDurationMs: 0,
          sessionDurationMinutes: 0,
          ordersCount: 0,
          totalRevenue: 0,
          totalItems: 0,
          paymentMethod: paymentMethod || 'cash',
          tipAmount: tipAmount || 0,
          closedAt: nowIso,
          orders: [],
          message: 'Столик вже вільний, немає активних замовлень',
        }
      });
    }

    // Finalize each order and collect detailed summaries
    let totalRevenue = 0;
    let totalItems = 0;
    const orderSummaries: Array<{
      orderNumber: string;
      createdAt: string;
      totalAmount: number;
      waiter: string | null;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        portion: string | null;
        comment: string | null;
        cookingTimeSeconds: number | null;
        waitTimeSeconds: number | null;
      }>;
    }> = [];

    for (const order of activeOrders) {
      // Calculate order total if not set
      let orderTotal = order.totalAmount || 0;
      const itemCount = order.items?.length || 0;

      // Build detailed item list
      const itemDetails: Array<{
        name: string;
        quantity: number;
        price: number;
        portion: string | null;
        comment: string | null;
        cookingTimeSeconds: number | null;
        waitTimeSeconds: number | null;
      }> = [];

      if (order.items) {
        for (const item of order.items) {
          const itemPrice = (item.totalPrice || item.unitPrice * item.quantity) || 0;
          if (!order.totalAmount) {
            orderTotal += itemPrice;
          }

          // Get timing from kitchen ticket
          const ticket = ticketByOrderItem[item.documentId];
          const cookingTimeSeconds = ticket?.elapsedSeconds || null;
          const waitTimeSeconds = ticket?.pickupWaitSeconds || null;

          // Format portion info
          const menuItem = item.menuItem;
          const portionSize = menuItem?.portionSize;
          const portionUnit = menuItem?.portionUnit || 'g';
          const portion = portionSize ? `${portionSize} ${portionUnit}` : null;

          itemDetails.push({
            name: menuItem?.name || 'Невідома страва',
            quantity: item.quantity || 1,
            price: itemPrice,
            portion,
            comment: (item.comment as string) || (item.notes as string) || null,
            cookingTimeSeconds,
            waitTimeSeconds,
          });

          // Update item to served if not already
          if (item.status !== 'served' && item.status !== 'cancelled' && item.status !== 'voided') {
            await strapi.documents('api::order-item.order-item').update({
              documentId: item.documentId,
              data: {
                status: 'served',
                statusChangedAt: nowIso,
                servedAt: item.servedAt || nowIso,
              }
            });
          }
        }
      }

      totalRevenue += orderTotal;
      totalItems += itemCount;

      // Update order to paid
      await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: {
          status: 'paid',
          paidAt: nowIso,
          paymentMethod: paymentMethod || order.paymentMethod || 'cash',
          tipAmount: tipAmount || 0,
        }
      });

      orderSummaries.push({
        orderNumber: order.orderNumber,
        createdAt: typeof order.createdAt === 'string' ? order.createdAt : new Date(order.createdAt as any).toISOString(),
        totalAmount: orderTotal,
        waiter: order.waiter?.username || order.waiter?.firstName || null,
        items: itemDetails,
      });
    }

    // Update table to free
    const updatedTable = await strapi.documents('api::table.table').update({
      documentId,
      data: {
        status: 'free',
        currentGuests: null,
        occupiedAt: null,
        freedAt: nowIso,
        lastSessionDurationMs: sessionDurationMs.toString(), // biginteger requires string
      }
    });

    const duration = Date.now() - startTime;

    logTable('success', '✓ CLOSE completed', {
      tableId: documentId,
      tableNumber: table.number,
      duration,
      sessionDurationMinutes,
      ordersCount: activeOrders.length,
      totalRevenue,
      totalItems,
    });

    // Log comprehensive table close action
    await logAction(strapi, {
      action: 'complete',
      entityType: 'table',
      entityId: documentId,
      entityName: `Стіл №${table.number}`,
      description: `Table #${table.number} closed after ${sessionDurationMinutes}m, revenue: ${totalRevenue.toFixed(2)} ₴`,
      descriptionUk: `Стіл №${table.number} закрито після ${sessionDurationMinutes} хв, виручка: ${totalRevenue.toFixed(2)} ₴`,
      dataBefore: {
        status: 'occupied',
        currentGuests: table.currentGuests,
        occupiedAt: table.occupiedAt,
      },
      dataAfter: {
        status: 'free',
        freedAt: nowIso,
        lastSessionDurationMs: sessionDurationMs,
      },
      metadata: {
        tableNumber: table.number,
        zone: table.zone,
        capacity: table.capacity,

        // Session analytics
        session: {
          startedAt: sessionStartedAt.toISOString(),
          endedAt: nowIso,
          durationMs: sessionDurationMs,
          durationMinutes: sessionDurationMinutes,
          durationFormatted: sessionDurationMinutes >= 60
            ? `${Math.floor(sessionDurationMinutes / 60)}г ${sessionDurationMinutes % 60}хв`
            : `${sessionDurationMinutes} хв`,
          guestCount: table.currentGuests || 0,
        },

        // Revenue analytics
        revenue: {
          total: totalRevenue,
          ordersCount: activeOrders.length,
          itemsCount: totalItems,
          averageOrderValue: activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0,
          revenuePerMinute: sessionDurationMinutes > 0 ? totalRevenue / sessionDurationMinutes : 0,
          tipAmount: tipAmount || 0,
        },

        // Payment info
        payment: {
          method: paymentMethod || 'cash',
          processedAt: nowIso,
        },

        // Orders summary
        orders: orderSummaries,

        // Staff
        closedBy: user?.username || 'POS',
        notes: notes || null,

        processingTimeMs: duration,
      },
      module: 'pos',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      table: updatedTable,
      summary: {
        tableNumber: table.number,
        sessionDurationMs,
        sessionDurationMinutes,
        ordersCount: activeOrders.length,
        totalRevenue,
        totalItems,
        paymentMethod: paymentMethod || 'cash',
        tipAmount: tipAmount || 0,
        closedAt: nowIso,
        orders: orderSummaries,
      }
    });
  },
}));
