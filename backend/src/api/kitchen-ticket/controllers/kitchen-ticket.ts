import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::kitchen-ticket.kitchen-ticket', ({ strapi }) => ({

  // Custom action: Start ticket (triggers inventory deduction)
  async start(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const result = await strapi.service('api::kitchen-ticket.start-ticket')
      .startTicket(documentId, user.documentId);

    if (!result.success) {
      return ctx.badRequest(result.error?.message, result.error);
    }

    return ctx.send(result);
  },

  // Custom action: Complete ticket
  async complete(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: ['orderItem', 'order']
    });

    if (!ticket) {
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'started' && ticket.status !== 'resumed') {
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

    // Update order item
    if (ticket.orderItem) {
      await strapi.documents('api::order-item.order-item').update({
        documentId: ticket.orderItem.documentId,
        data: {
          status: 'ready',
          statusChangedAt: new Date().toISOString()
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
      }
    }

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Pause ticket
  async pause(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId
    });

    if (!ticket) {
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'started' && ticket.status !== 'resumed') {
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

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Resume ticket
  async resume(ctx) {
    const { documentId } = ctx.params;
    const user = ctx.state.user;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId
    });

    if (!ticket) {
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status !== 'paused') {
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

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Cancel ticket (releases inventory)
  async cancel(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: ['orderItem']
    });

    if (!ticket) {
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status === 'cancelled' || ticket.status === 'ready') {
      return ctx.badRequest(`Cannot cancel ticket with status: ${ticket.status}`);
    }

    // Release inventory if locked
    if (ticket.inventoryLocked) {
      await strapi.service('api::kitchen-ticket.start-ticket')
        .releaseInventory(documentId, reason || 'Ticket cancelled', user?.documentId);
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

    return ctx.send({ success: true, ticket: updatedTicket });
  },

  // Custom action: Fail ticket (releases inventory)
  async fail(ctx) {
    const { documentId } = ctx.params;
    const { reason } = ctx.request.body || {};
    const user = ctx.state.user;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId,
      populate: ['orderItem']
    });

    if (!ticket) {
      return ctx.notFound('Ticket not found');
    }

    if (ticket.status === 'failed' || ticket.status === 'cancelled' || ticket.status === 'ready') {
      return ctx.badRequest(`Cannot fail ticket with status: ${ticket.status}`);
    }

    // Release inventory if locked
    if (ticket.inventoryLocked) {
      await strapi.service('api::kitchen-ticket.start-ticket')
        .releaseInventory(documentId, reason || 'Ticket failed', user?.documentId);
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

    return ctx.send({ success: true, ticket: updatedTicket });
  }
}));
