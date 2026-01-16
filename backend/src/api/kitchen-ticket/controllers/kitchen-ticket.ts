import { factories } from '@strapi/strapi';
import { logAction } from '../../../utils/action-logger';

// ============================================
// LOGGING UTILITIES
// ============================================

const LOG_PREFIX = '[KitchenTicket]';

interface LogContext {
  ticketId?: string;
  ticketNumber?: string;
  action?: string;
  user?: string;
  duration?: number;
  status?: string;
  error?: string;
  [key: string]: unknown;
}

function logTicket(level: 'info' | 'success' | 'error' | 'warn', message: string, context?: LogContext) {
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

export default factories.createCoreController('api::kitchen-ticket.kitchen-ticket', ({ strapi }) => ({

  // Custom action: Start ticket (triggers inventory deduction)
  async start(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ START ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
    });

    // TODO: Re-enable auth check when login is implemented
    // if (!user) {
    //   logTicket('error', '✗ START failed: unauthorized', { ticketId: documentId });
    //   return ctx.unauthorized('Authentication required');
    // }

    const result = await strapi.service('api::kitchen-ticket.start-ticket')
      .startTicket(documentId, user?.documentId || 'anonymous');

    const duration = Date.now() - startTime;

    if (!result.success) {
      logTicket('error', '✗ START failed', {
        ticketId: documentId,
        duration,
        error: result.error?.message,
        errorCode: result.error?.code,
      });
      return ctx.badRequest(result.error?.message, result.error);
    }

    logTicket('success', '✓ START completed', {
      ticketId: documentId,
      ticketNumber: result.ticket?.ticketNumber,
      duration,
      consumedBatches: result.consumedBatches?.length || 0,
      totalCost: result.consumedBatches?.reduce((sum, b) => sum + b.cost, 0) || 0,
    });

    return ctx.send(result);
  },

  // Custom action: Complete ticket
  async complete(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ COMPLETE ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
    });

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: ['orderItem', 'order']
    });

    if (!ticket) {
      logTicket('error', '✗ COMPLETE failed: ticket not found', { ticketId: documentId });
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'started' && ticket.status !== 'resumed') {
      logTicket('error', '✗ COMPLETE failed: invalid status', {
        ticketId: documentId,
        currentStatus: ticket.status,
      });
      return ctx.badRequest(`Cannot complete ticket with status: ${ticket.status}`);
    }

    const startedAt = ticket.startedAt ? new Date(ticket.startedAt) : new Date();
    const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);

    const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId,
      data: {
        status: 'ready',
        completedAt: new Date().toISOString(),
        elapsedSeconds
      }
    });

    // Update order item with readyAt timestamp
    const nowIso = new Date().toISOString();
    if (ticket.orderItem) {
      const prepElapsedMs = elapsedSeconds * 1000;
      await strapi.documents('api::order-item.order-item').update({
        documentId: ticket.orderItem.documentId,
        data: {
          status: 'ready',
          statusChangedAt: nowIso,
          readyAt: nowIso,
          prepElapsedMs: prepElapsedMs.toString() // biginteger requires string
        }
      });
    }

    // Create event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: documentId,
        eventType: 'completed',
        previousStatus: ticket.status,
        newStatus: 'ready',
        actor: user?.documentId,
        metadata: { elapsedSeconds }
      }
    });

    // Check if all items in order are ready
    let orderReady = false;
    if (ticket.order) {
      const orderTickets = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findMany({
        filters: {
          order: { documentId: ticket.order.documentId }
        }
      });

      const allReady = orderTickets.every(t =>
        t.status === 'ready' || t.status === 'cancelled' || t.status === 'failed'
      );

      if (allReady) {
        await strapi.documents('api::order.order').update({
          documentId: ticket.order.documentId,
          data: { status: 'ready' }
        });
        orderReady = true;

        // Log "order ready" for waiter visibility - this is an important moment!
        const orderNumber = (ticket as any).order?.orderNumber;
        const tableNumber = (ticket as any).order?.table?.number;

        await logAction(strapi, {
          action: 'complete',
          entityType: 'order',
          entityId: ticket.order.documentId,
          entityName: orderNumber,
          description: `Order ready for pickup: ${orderNumber}`,
          descriptionUk: `🔔 Замовлення готове: ${orderNumber}${tableNumber ? ` (Стіл ${tableNumber})` : ''}`,
          metadata: {
            orderNumber,
            tableNumber,
            ticketsCount: orderTickets.length,
            lastTicketNumber: ticket.ticketNumber,
          },
          module: 'kitchen',
          severity: 'info',
        });
      }
    }

    const duration = Date.now() - startTime;
    logTicket('success', '✓ COMPLETE success', {
      ticketId: documentId,
      ticketNumber: ticket.ticketNumber,
      duration,
      elapsedSeconds,
      orderReady,
    });

    // Note: Individual ticket completion is NOT logged to action history
    // But "order ready" IS logged when all tickets complete (important for waiters)

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Pause ticket
  async pause(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ PAUSE ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
      reason,
    });

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId
    });

    if (!ticket) {
      logTicket('error', '✗ PAUSE failed: ticket not found', { ticketId: documentId });
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'started' && ticket.status !== 'resumed') {
      logTicket('error', '✗ PAUSE failed: invalid status', {
        ticketId: documentId,
        currentStatus: ticket.status,
      });
      return ctx.badRequest(`Cannot pause ticket with status: ${ticket.status}`);
    }

    const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId,
      data: {
        status: 'paused'
      }
    });

    // Create event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: documentId,
        eventType: 'paused',
        previousStatus: ticket.status,
        newStatus: 'paused',
        actor: user?.documentId,
        reason
      }
    });

    const duration = Date.now() - startTime;
    logTicket('success', '✓ PAUSE success', {
      ticketId: documentId,
      ticketNumber: ticket.ticketNumber,
      duration,
      reason,
    });

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Resume ticket
  async resume(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ RESUME ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
    });

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId
    });

    if (!ticket) {
      logTicket('error', '✗ RESUME failed: ticket not found', { ticketId: documentId });
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'paused') {
      logTicket('error', '✗ RESUME failed: invalid status', {
        ticketId: documentId,
        currentStatus: ticket.status,
      });
      return ctx.badRequest(`Cannot resume ticket with status: ${ticket.status}`);
    }

    const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId,
      data: {
        status: 'resumed'
      }
    });

    // Create event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: documentId,
        eventType: 'resumed',
        previousStatus: 'paused',
        newStatus: 'resumed',
        actor: user?.documentId
      }
    });

    const duration = Date.now() - startTime;
    logTicket('success', '✓ RESUME success', {
      ticketId: documentId,
      ticketNumber: ticket.ticketNumber,
      duration,
    });

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Cancel ticket (releases inventory)
  async cancel(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ CANCEL ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
      reason,
    });

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: ['orderItem']
    });

    if (!ticket) {
      logTicket('error', '✗ CANCEL failed: ticket not found', { ticketId: documentId });
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status === 'cancelled' || ticket.status === 'ready') {
      logTicket('error', '✗ CANCEL failed: invalid status', {
        ticketId: documentId,
        currentStatus: ticket.status,
      });
      return ctx.badRequest(`Cannot cancel ticket with status: ${ticket.status}`);
    }

    // Release inventory if locked
    let inventoryReleased = false;
    if (ticket.inventoryLocked) {
      logTicket('info', '  Releasing locked inventory...', { ticketId: documentId });
      await strapi.service('api::kitchen-ticket.start-ticket')
        .releaseInventory(documentId, reason || 'Ticket cancelled', user?.documentId);
      inventoryReleased = true;
    }

    const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId,
      data: {
        status: 'cancelled',
        inventoryLocked: false
      }
    });

    // Update order item
    if (ticket.orderItem) {
      await strapi.documents('api::order-item.order-item').update({
        documentId: ticket.orderItem.documentId,
        data: {
          status: 'cancelled',
          statusChangedAt: new Date().toISOString()
        }
      });
    }

    // Create event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: documentId,
        eventType: 'cancelled',
        previousStatus: ticket.status,
        newStatus: 'cancelled',
        actor: user?.documentId,
        reason
      }
    });

    const duration = Date.now() - startTime;
    logTicket('success', '✓ CANCEL success', {
      ticketId: documentId,
      ticketNumber: ticket.ticketNumber,
      duration,
      inventoryReleased,
      reason,
    });

    // Log comprehensive action history
    await logAction(strapi, {
      action: 'cancel',
      entityType: 'kitchen_ticket',
      entityId: documentId,
      entityName: ticket.ticketNumber,
      description: `Cancelled ticket: ${ticket.orderItem?.menuItem?.name || 'Unknown dish'}`,
      descriptionUk: `Скасовано тікет: ${ticket.orderItem?.menuItem?.name || 'Невідома страва'}`,
      dataBefore: {
        ticketStatus: ticket.status,
        inventoryLocked: ticket.inventoryLocked,
      },
      dataAfter: {
        ticketStatus: 'cancelled',
        inventoryLocked: false,
      },
      metadata: {
        ticketNumber: ticket.ticketNumber,
        menuItemName: ticket.orderItem?.menuItem?.name,
        orderNumber: (ticket as any).order?.orderNumber,
        reason: reason || 'No reason provided',
        inventoryReleased,
        previousStatus: ticket.status,
        processingTimeMs: duration,
      },
      module: 'kitchen',
      severity: 'warning',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Fail ticket (releases inventory)
  async fail(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ FAIL ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
      reason,
    });

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: ['orderItem']
    });

    if (!ticket) {
      logTicket('error', '✗ FAIL failed: ticket not found', { ticketId: documentId });
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status === 'failed' || ticket.status === 'cancelled' || ticket.status === 'ready') {
      logTicket('error', '✗ FAIL failed: invalid status', {
        ticketId: documentId,
        currentStatus: ticket.status,
      });
      return ctx.badRequest(`Cannot fail ticket with status: ${ticket.status}`);
    }

    // Release inventory if locked
    let inventoryReleased = false;
    if (ticket.inventoryLocked) {
      logTicket('info', '  Releasing locked inventory...', { ticketId: documentId });
      await strapi.service('api::kitchen-ticket.start-ticket')
        .releaseInventory(documentId, reason || 'Ticket failed', user?.documentId);
      inventoryReleased = true;
    }

    const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId,
      data: {
        status: 'failed',
        inventoryLocked: false
      }
    });

    // Create event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: documentId,
        eventType: 'failed',
        previousStatus: ticket.status,
        newStatus: 'failed',
        actor: user?.documentId,
        reason
      }
    });

    const duration = Date.now() - startTime;
    logTicket('warn', '⚠ FAIL recorded', {
      ticketId: documentId,
      ticketNumber: ticket.ticketNumber,
      duration,
      inventoryReleased,
      reason,
    });

    // Log comprehensive action history
    await logAction(strapi, {
      action: 'cancel',
      entityType: 'kitchen_ticket',
      entityId: documentId,
      entityName: ticket.ticketNumber,
      description: `Failed ticket: ${ticket.orderItem?.menuItem?.name || 'Unknown dish'}`,
      descriptionUk: `Провалено тікет: ${ticket.orderItem?.menuItem?.name || 'Невідома страва'}`,
      dataBefore: {
        ticketStatus: ticket.status,
        inventoryLocked: ticket.inventoryLocked,
      },
      dataAfter: {
        ticketStatus: 'failed',
        inventoryLocked: false,
      },
      metadata: {
        ticketNumber: ticket.ticketNumber,
        menuItemName: ticket.orderItem?.menuItem?.name,
        orderNumber: (ticket as any).order?.orderNumber,
        reason: reason || 'No reason provided',
        inventoryReleased,
        previousStatus: ticket.status,
        processingTimeMs: duration,
        isFailed: true,
      },
      module: 'kitchen',
      severity: 'critical',
      performedBy: user?.documentId,
      performedByName: user?.username,
    });

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Serve ticket (dish picked up by waiter)
  async serve(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;
    const startTime = Date.now();

    logTicket('info', '→ SERVE ticket requested', {
      ticketId: documentId,
      user: user?.username || 'anonymous',
    });

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: {
        orderItem: {
          populate: ['menuItem']
        },
        order: {
          populate: ['table']
        }
      }
    });

    if (!ticket) {
      logTicket('error', '✗ SERVE failed: ticket not found', { ticketId: documentId });
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'ready') {
      logTicket('error', '✗ SERVE failed: invalid status', {
        ticketId: documentId,
        currentStatus: ticket.status,
      });
      return ctx.badRequest(`Cannot serve ticket with status: ${ticket.status}. Must be 'ready'.`);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Calculate pickup wait time
    const completedAt = ticket.completedAt ? new Date(ticket.completedAt) : now;
    const pickupWaitSeconds = Math.floor((now.getTime() - completedAt.getTime()) / 1000);
    const pickupWaitMs = pickupWaitSeconds * 1000;

    // Update ticket with servedAt and status
    const updatedTicket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').update({
      documentId,
      data: {
        status: 'served',
        servedAt: nowIso,
        pickupWaitSeconds
      }
    });

    // Update order item
    if (ticket.orderItem) {
      await strapi.documents('api::order-item.order-item').update({
        documentId: ticket.orderItem.documentId,
        data: {
          status: 'served',
          statusChangedAt: nowIso,
          servedAt: nowIso,
          pickupWaitMs: pickupWaitMs.toString() // biginteger requires string
        }
      });
    }

    // Create event for history/analytics
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: documentId,
        eventType: 'served',
        previousStatus: ticket.status,
        newStatus: 'served',
        actor: user?.documentId,
        metadata: {
          pickupWaitSeconds,
          totalElapsedSeconds: ticket.elapsedSeconds,
          menuItemName: ticket.orderItem?.menuItem?.name,
          tableNumber: ticket.order?.table?.number,
        }
      }
    });

    // Check if all items in order are served
    let orderServed = false;
    if (ticket.order) {
      const orderItems = await strapi.documents('api::order-item.order-item').findMany({
        filters: {
          order: { documentId: ticket.order.documentId }
        }
      });

      const allServed = orderItems.every(item =>
        item.status === 'served' || item.status === 'cancelled' || item.status === 'voided'
      );

      if (allServed) {
        await strapi.documents('api::order.order').update({
          documentId: ticket.order.documentId,
          data: { status: 'served' }
        });
        orderServed = true;

        // Log "order served" - waiter completed serving all items
        const orderNumber = (ticket as any).order?.orderNumber;
        const tableNumber = ticket.order?.table?.number;

        await logAction(strapi, {
          action: 'complete',
          entityType: 'order',
          entityId: ticket.order.documentId,
          entityName: orderNumber,
          description: `Order fully served: ${orderNumber}`,
          descriptionUk: `✓ Замовлення подано: ${orderNumber}${tableNumber ? ` (Стіл ${tableNumber})` : ''}`,
          metadata: {
            orderNumber,
            tableNumber,
            itemsCount: orderItems.length,
          },
          module: 'pos',
          severity: 'info',
        });
      }
    }

    const duration = Date.now() - startTime;
    logTicket('success', '✓ SERVE success', {
      ticketId: documentId,
      ticketNumber: ticket.ticketNumber,
      duration,
      pickupWaitSeconds,
      orderServed,
    });

    // Note: Individual ticket serve is NOT logged to action history
    // But "order served" IS logged when all items served (confirms delivery)

    return ctx.send({
      success: true,
      ticket: updatedTicket,
      pickupWaitSeconds,
      orderServed
    });
  }
}));
