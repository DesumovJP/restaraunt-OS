import { factories } from '@strapi/strapi';
import { logAction } from '../../../utils/action-logger';

const LOG_PREFIX = '[Table]';

function logTable(
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

type CloseReason =
  | 'normal'
  | 'mistaken_open'
  | 'no_show'
  | 'walkout'
  | 'emergency'
  | 'technical_error';

const CLOSE_REASON_UK: Record<CloseReason, string> = {
  normal: 'Звичайне закриття',
  mistaken_open: 'Помилково відкрито',
  no_show: 'Гість не прийшов',
  walkout: 'Пішов без оплати',
  emergency: 'Екстрене закриття',
  technical_error: 'Технічна помилка',
};

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
      },
    });
  },

  /**
   * Emergency close - closes table without payment, marks items as abandoned
   * POST /api/tables/:documentId/emergency-close
   */
  async emergencyClose(ctx) {
    const { documentId } = ctx.params;
    const { reason, comment } = ctx.request.body || {};
    const user = ctx.state?.user;
    const startTime = Date.now();

    const closeReason = (reason as CloseReason) || 'emergency';

    logTable('warn', '→ EMERGENCY CLOSE requested', {
      tableId: documentId,
      user: user?.username || 'POS',
      reason: closeReason,
    });

    // Find table
    const table = await strapi.documents('api::table.table').findOne({
      documentId,
    });

    if (!table) {
      logTable('error', '✗ EMERGENCY CLOSE failed: table not found', {
        tableId: documentId,
      });
      return ctx.notFound('Table not found');
    }

    if (table.status === 'free') {
      return ctx.badRequest('Стіл вже вільний');
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Find all active orders
    const activeOrders = await strapi.documents('api::order.order').findMany({
      filters: {
        table: { documentId },
        status: { $notIn: ['cancelled', 'paid'] },
      },
      populate: { items: true },
    });

    // Calculate session duration
    const sessionStartedAt = table.occupiedAt ? new Date(table.occupiedAt) : now;
    const sessionDurationMs = now.getTime() - sessionStartedAt.getTime();

    // Mark all unserved items as abandoned and cancel orders
    let abandonedItemsCount = 0;
    let totalLostRevenue = 0;

    for (const order of activeOrders) {
      if (order.items) {
        for (const item of order.items) {
          if (!['served', 'cancelled', 'voided'].includes(item.status)) {
            abandonedItemsCount++;
            totalLostRevenue += item.totalPrice || 0;

            await strapi.documents('api::order-item.order-item').update({
              documentId: item.documentId,
              data: {
                status: 'voided',
                statusChangedAt: nowIso,
                notes: `Abandoned: ${CLOSE_REASON_UK[closeReason]}`,
              },
            });
          }
        }
      }

      // Cancel the order
      await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: {
          status: 'cancelled',
          notes: `${CLOSE_REASON_UK[closeReason]}${comment ? `: ${comment}` : ''}`,
        },
      });
    }

    // Cancel any pending kitchen tickets
    const pendingTickets = await strapi
      .documents('api::kitchen-ticket.kitchen-ticket')
      .findMany({
        filters: {
          order: { table: { documentId } },
          status: { $in: ['queued', 'started', 'paused', 'resumed'] },
        },
      });

    for (const ticket of pendingTickets) {
      await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
        documentId: ticket.documentId,
        data: {
          status: 'cancelled',
          completedAt: nowIso,
        },
      });
    }

    // If this table was merged, unmerge all
    const mergedTableIds = (table.mergedWith as string[]) || [];
    for (const mergedId of mergedTableIds) {
      await strapi.documents('api::table.table').update({
        documentId: mergedId,
        data: {
          status: 'free',
          primaryTableId: null,
          currentGuests: null,
          occupiedAt: null,
          freedAt: nowIso,
        },
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
        lastSessionDurationMs: sessionDurationMs.toString(),
        lastCloseReason: closeReason,
        closeComment: comment || null,
        mergedWith: [],
        primaryTableId: null,
      },
    });

    const duration = Date.now() - startTime;

    logTable('warn', '⚠ EMERGENCY CLOSE completed', {
      tableId: documentId,
      tableNumber: table.number,
      duration,
      abandonedItems: abandonedItemsCount,
      lostRevenue: totalLostRevenue,
    });

    // Log action
    await logAction(strapi, {
      action: 'emergency_close',
      entityType: 'table',
      entityId: documentId,
      entityName: `Стіл №${table.number}`,
      description: `Emergency close: Table #${table.number} (${closeReason})`,
      descriptionUk: `⚠️ Екстрене закриття: Стіл №${table.number} - ${CLOSE_REASON_UK[closeReason]}${abandonedItemsCount > 0 ? ` (${abandonedItemsCount} страв втрачено)` : ''}`,
      dataBefore: {
        status: table.status,
        currentGuests: table.currentGuests,
        activeOrders: activeOrders.length,
      },
      dataAfter: {
        status: 'free',
        reason: closeReason,
        abandonedItems: abandonedItemsCount,
      },
      metadata: {
        tableNumber: table.number,
        zone: table.zone,
        reason: closeReason,
        reasonUk: CLOSE_REASON_UK[closeReason],
        comment: comment || null,
        abandonedItemsCount,
        totalLostRevenue,
        cancelledOrders: activeOrders.length,
        cancelledTickets: pendingTickets.length,
        unmergedTables: mergedTableIds.length,
        sessionDurationMs,
      },
      module: 'pos',
      severity: 'warning',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      table: updatedTable,
      summary: {
        tableNumber: table.number,
        reason: closeReason,
        reasonUk: CLOSE_REASON_UK[closeReason],
        abandonedItemsCount,
        totalLostRevenue,
        cancelledOrders: activeOrders.length,
        closedAt: nowIso,
      },
    });
  },

  /**
   * Merge tables - combines multiple tables into one
   * POST /api/tables/:documentId/merge
   */
  async merge(ctx) {
    const { documentId } = ctx.params;
    const { tableIds } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!Array.isArray(tableIds) || tableIds.length === 0) {
      return ctx.badRequest('tableIds is required');
    }

    logTable('info', '→ MERGE tables requested', {
      primaryTableId: documentId,
      mergeTableIds: tableIds,
      user: user?.username || 'POS',
    });

    // Find primary table
    const primaryTable = await strapi.documents('api::table.table').findOne({
      documentId,
    });

    if (!primaryTable) {
      return ctx.notFound('Primary table not found');
    }

    // Validate primary table status
    if (!['free', 'occupied'].includes(primaryTable.status)) {
      return ctx.badRequest(
        `Головний стіл має статус "${primaryTable.status}", об'єднання неможливе`
      );
    }

    // Find and validate all tables to merge
    const tablesToMerge: any[] = [];
    for (const tableId of tableIds) {
      if (tableId === documentId) continue; // Skip self

      const table = await strapi.documents('api::table.table').findOne({
        documentId: tableId,
      });

      if (!table) {
        return ctx.badRequest(`Стіл ${tableId} не знайдено`);
      }

      if (!['free', 'occupied'].includes(table.status)) {
        return ctx.badRequest(
          `Стіл №${table.number} має статус "${table.status}", об'єднання неможливе`
        );
      }

      if (table.primaryTableId) {
        return ctx.badRequest(
          `Стіл №${table.number} вже об'єднаний з іншим столом`
        );
      }

      tablesToMerge.push(table);
    }

    const now = new Date().toISOString();

    // Update secondary tables
    const mergedTableIds: string[] = [];
    const mergedTableNumbers: number[] = [];

    for (const table of tablesToMerge) {
      await strapi.documents('api::table.table').update({
        documentId: table.documentId,
        data: {
          status: 'occupied',
          primaryTableId: documentId,
          occupiedAt: table.occupiedAt || now,
        },
      });

      mergedTableIds.push(table.documentId);
      mergedTableNumbers.push(table.number);

      // Transfer any active orders from secondary tables to primary
      const secondaryOrders = await strapi
        .documents('api::order.order')
        .findMany({
          filters: {
            table: { documentId: table.documentId },
            status: { $notIn: ['cancelled', 'paid'] },
          },
        });

      for (const order of secondaryOrders) {
        await strapi.documents('api::order.order').update({
          documentId: order.documentId,
          data: {
            table: { documentId },
            notes: `${order.notes || ''}\n[Перенесено зі столу №${table.number}]`.trim(),
          },
        });
      }
    }

    // Calculate total capacity and guests
    const totalCapacity =
      primaryTable.capacity +
      tablesToMerge.reduce((sum, t) => sum + (t.capacity || 4), 0);
    const totalGuests =
      (primaryTable.currentGuests || 0) +
      tablesToMerge.reduce((sum, t) => sum + (t.currentGuests || 0), 0);

    // Update primary table
    const existingMerged = (primaryTable.mergedWith as string[]) || [];
    const updatedTable = await strapi.documents('api::table.table').update({
      documentId,
      data: {
        status: 'occupied',
        mergedWith: [...existingMerged, ...mergedTableIds],
        occupiedAt: primaryTable.occupiedAt || now,
        currentGuests: totalGuests || null,
      },
    });

    logTable('success', '✓ MERGE completed', {
      primaryTableId: documentId,
      primaryTableNumber: primaryTable.number,
      mergedTables: mergedTableNumbers,
      totalCapacity,
    });

    // Log action
    await logAction(strapi, {
      action: 'merge',
      entityType: 'table',
      entityId: documentId,
      entityName: `Стіл №${primaryTable.number}`,
      description: `Tables merged: #${primaryTable.number} + #${mergedTableNumbers.join(', #')}`,
      descriptionUk: `🔗 Столи об'єднано: №${primaryTable.number} + №${mergedTableNumbers.join(', №')} (місткість: ${totalCapacity})`,
      dataAfter: {
        primaryTable: primaryTable.number,
        mergedTables: mergedTableNumbers,
        totalCapacity,
      },
      metadata: {
        primaryTableNumber: primaryTable.number,
        mergedTableNumbers,
        mergedTableIds,
        totalCapacity,
        totalGuests,
      },
      module: 'pos',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      table: updatedTable,
      mergedTables: mergedTableNumbers,
      totalCapacity,
    });
  },

  /**
   * Unmerge tables - separates merged tables
   * DELETE /api/tables/:documentId/merge
   */
  async unmerge(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state?.user;

    logTable('info', '→ UNMERGE tables requested', {
      primaryTableId: documentId,
      user: user?.username || 'POS',
    });

    // Find primary table
    const primaryTable = await strapi.documents('api::table.table').findOne({
      documentId,
    });

    if (!primaryTable) {
      return ctx.notFound('Table not found');
    }

    const mergedTableIds = (primaryTable.mergedWith as string[]) || [];

    if (mergedTableIds.length === 0) {
      return ctx.badRequest('Стіл не має об\'єднаних столів');
    }

    const now = new Date().toISOString();
    const unmergedTableNumbers: number[] = [];

    // Free secondary tables
    for (const mergedId of mergedTableIds) {
      const mergedTable = await strapi.documents('api::table.table').findOne({
        documentId: mergedId,
      });

      if (mergedTable) {
        unmergedTableNumbers.push(mergedTable.number);

        await strapi.documents('api::table.table').update({
          documentId: mergedId,
          data: {
            status: 'free',
            primaryTableId: null,
            currentGuests: null,
            occupiedAt: null,
            freedAt: now,
          },
        });
      }
    }

    // Update primary table
    const updatedTable = await strapi.documents('api::table.table').update({
      documentId,
      data: {
        mergedWith: [],
      },
    });

    logTable('success', '✓ UNMERGE completed', {
      primaryTableId: documentId,
      primaryTableNumber: primaryTable.number,
      unmergedTables: unmergedTableNumbers,
    });

    // Log action
    await logAction(strapi, {
      action: 'unmerge',
      entityType: 'table',
      entityId: documentId,
      entityName: `Стіл №${primaryTable.number}`,
      description: `Tables unmerged: #${primaryTable.number} separated from #${unmergedTableNumbers.join(', #')}`,
      descriptionUk: `🔓 Столи роз'єднано: №${primaryTable.number} відокремлено від №${unmergedTableNumbers.join(', №')}`,
      dataBefore: {
        mergedWith: mergedTableIds,
      },
      dataAfter: {
        mergedWith: [],
      },
      metadata: {
        primaryTableNumber: primaryTable.number,
        unmergedTableNumbers,
        unmergedTableIds: mergedTableIds,
      },
      module: 'pos',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      table: updatedTable,
      unmergedTables: unmergedTableNumbers,
    });
  },

  /**
   * Transfer guests - moves guests and orders to another table
   * POST /api/tables/:documentId/transfer
   */
  async transfer(ctx) {
    const { documentId } = ctx.params;
    const { targetTableId } = ctx.request.body || {};
    const user = ctx.state?.user;

    if (!targetTableId) {
      return ctx.badRequest('targetTableId is required');
    }

    logTable('info', '→ TRANSFER guests requested', {
      sourceTableId: documentId,
      targetTableId,
      user: user?.username || 'POS',
    });

    // Find source table
    const sourceTable = await strapi.documents('api::table.table').findOne({
      documentId,
    });

    if (!sourceTable) {
      return ctx.notFound('Source table not found');
    }

    if (sourceTable.status === 'free') {
      return ctx.badRequest('Вихідний стіл вільний, нікого переміщувати');
    }

    // Find target table
    const targetTable = await strapi.documents('api::table.table').findOne({
      documentId: targetTableId,
    });

    if (!targetTable) {
      return ctx.notFound('Target table not found');
    }

    if (targetTable.status !== 'free') {
      return ctx.badRequest(
        `Цільовий стіл №${targetTable.number} не вільний (статус: ${targetTable.status})`
      );
    }

    const now = new Date().toISOString();

    // Find all active orders for source table
    const activeOrders = await strapi.documents('api::order.order').findMany({
      filters: {
        table: { documentId },
        status: { $notIn: ['cancelled', 'paid'] },
      },
    });

    // Transfer orders to target table
    for (const order of activeOrders) {
      await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: {
          table: { documentId: targetTableId },
          notes: `${order.notes || ''}\n[Перенесено зі столу №${sourceTable.number}]`.trim(),
        },
      });
    }

    // Update target table
    await strapi.documents('api::table.table').update({
      documentId: targetTableId,
      data: {
        status: 'occupied',
        currentGuests: sourceTable.currentGuests,
        occupiedAt: sourceTable.occupiedAt, // Preserve session start time
      },
    });

    // If source had merged tables, transfer them too
    const mergedTableIds = (sourceTable.mergedWith as string[]) || [];
    if (mergedTableIds.length > 0) {
      for (const mergedId of mergedTableIds) {
        await strapi.documents('api::table.table').update({
          documentId: mergedId,
          data: {
            primaryTableId: targetTableId,
          },
        });
      }

      await strapi.documents('api::table.table').update({
        documentId: targetTableId,
        data: {
          mergedWith: mergedTableIds,
        },
      });
    }

    // Free source table
    const updatedSourceTable = await strapi
      .documents('api::table.table')
      .update({
        documentId,
        data: {
          status: 'free',
          currentGuests: null,
          occupiedAt: null,
          freedAt: now,
          mergedWith: [],
        },
      });

    logTable('success', '✓ TRANSFER completed', {
      sourceTableNumber: sourceTable.number,
      targetTableNumber: targetTable.number,
      ordersTransferred: activeOrders.length,
      guestsTransferred: sourceTable.currentGuests,
    });

    // Log action
    await logAction(strapi, {
      action: 'transfer',
      entityType: 'table',
      entityId: documentId,
      entityName: `Стіл №${sourceTable.number}`,
      description: `Guests transferred: Table #${sourceTable.number} → #${targetTable.number}`,
      descriptionUk: `🔄 Гості перенесені: Стіл №${sourceTable.number} → №${targetTable.number} (${activeOrders.length} замовлень)`,
      dataBefore: {
        sourceTable: sourceTable.number,
        sourceStatus: sourceTable.status,
        targetTable: targetTable.number,
        targetStatus: targetTable.status,
      },
      dataAfter: {
        sourceStatus: 'free',
        targetStatus: 'occupied',
        ordersTransferred: activeOrders.length,
      },
      metadata: {
        sourceTableNumber: sourceTable.number,
        targetTableNumber: targetTable.number,
        guestsTransferred: sourceTable.currentGuests,
        ordersTransferred: activeOrders.length,
        mergedTablesTransferred: mergedTableIds.length,
      },
      module: 'pos',
      severity: 'info',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({
      success: true,
      sourceTable: updatedSourceTable,
      targetTableId,
      ordersTransferred: activeOrders.length,
      guestsTransferred: sourceTable.currentGuests,
    });
  },
}));
