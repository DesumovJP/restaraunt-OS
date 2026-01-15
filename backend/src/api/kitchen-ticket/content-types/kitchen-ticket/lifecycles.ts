/**
 * Kitchen Ticket Lifecycle Hooks
 * Validates status transitions according to FSM
 */

import { emitTicketCreated, emitTicketStatusChanged, isPusherEnabled } from '../../../../utils/pusher';

const VALID_TRANSITIONS: Record<string, string[]> = {
  queued: ['started', 'cancelled'],
  started: ['paused', 'ready', 'failed', 'cancelled'],
  paused: ['resumed', 'cancelled'],
  resumed: ['paused', 'ready', 'failed', 'cancelled'],
  ready: ['served'],
  served: [],
  failed: [],
  cancelled: []
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Store original for action logging
    if (where?.documentId) {
      try {
        const ticket = await strapi.documents('api::kitchen-ticket.kitchen-ticket').findOne({
          documentId: where.documentId
        });
        event.state = { original: ticket };

        if (!ticket) return;

        // Validate status transition if status is being changed
        if (data.status) {
          const allowed = VALID_TRANSITIONS[ticket.status] || [];
          if (!allowed.includes(data.status)) {
            throw new Error(
              `Invalid ticket transition: ${ticket.status} -> ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
            );
          }
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
      } catch (e: any) {
        if (e.message?.includes('Invalid ticket transition')) throw e;
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

    // Note: Kitchen ticket creation is NOT logged to action history
    // All ticket info is shown in the table session close log instead

    // Emit real-time event via Pusher
    if (isPusherEnabled()) {
      await emitTicketCreated({
        documentId: result.documentId,
        ticketNumber: result.ticketNumber,
        station: result.station,
        priority: result.priority,
      });
    }
  },

  async afterUpdate(event) {
    const { result, state } = event;
    const original = state?.original;

    // Emit real-time event via Pusher on status change
    if (original && original.status !== result.status && isPusherEnabled()) {
      await emitTicketStatusChanged({
        documentId: result.documentId,
        ticketNumber: result.ticketNumber,
        station: result.station,
        previousStatus: original.status,
        newStatus: result.status,
        elapsedSeconds: result.elapsedSeconds,
      });
    }
  },

  // Note: Kitchen ticket updates are NOT logged to action history
  // All timing/status info is captured in the table session close log
  // Cancel/fail are logged by the controller with more context
};
