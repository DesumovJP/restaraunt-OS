/**
 * Kitchen Ticket Lifecycle Hooks
 * Validates status transitions according to FSM
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ['started', 'cancelled'],
  started: ['paused', 'ready', 'failed', 'cancelled'],
  paused: ['resumed', 'cancelled'],
  resumed: ['paused', 'ready', 'failed', 'cancelled'],
  ready: [],
  failed: [],
  cancelled: []
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Only validate if status is being changed
    if (!data.status) return;

    const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
      documentId: where.documentId
    });

    if (!ticket) return;

    const allowed = VALID_TRANSITIONS[ticket.status] || [];

    if (!allowed.includes(data.status)) {
      throw new Error(
        `Invalid ticket transition: ${ticket.status} -> ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
      );
    }

    // Auto-set timestamps based on status
    if (data.status === 'started' && !data.startedAt) {
      data.startedAt = new Date().toISOString();
    }

    if (data.status === 'ready' && !data.completedAt) {
      data.completedAt = new Date().toISOString();

      // Calculate elapsed seconds
      if (ticket.startedAt) {
        const startedAt = new Date(ticket.startedAt);
        data.elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      }
    }
  },

  async beforeCreate(event) {
    const { data } = event.params;

    // Generate ticket number
    if (!data.ticketNumber) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      data.ticketNumber = `TKT-${timestamp}-${random}`;
    }

    // Set default status
    if (!data.status) {
      data.status = 'queued';
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Create initial event
    await strapi.documents('api::ticket-event.ticket-event').create({
      data: {
        kitchenTicket: result.documentId,
        eventType: 'created',
        previousStatus: null,
        newStatus: result.status,
        metadata: {
          station: result.station,
          priority: result.priority
        }
      }
    });
  }
};
