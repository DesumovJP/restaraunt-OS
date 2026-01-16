/**
 * Reservation Lifecycle Hooks
 * Logs actions for reservation changes and manages table-reservation links
 */

import { logAction } from '../../../../utils/action-logger';

// Helper to get table documentId from result
function getTableDocumentId(table: any): string | null {
  if (!table) return null;
  if (typeof table === 'string') return table;
  return table.documentId || null;
}

// Helper to update table status based on reservation status
async function syncTableStatus(
  reservationStatus: string,
  tableDocumentId: string | null,
  reservationDocumentId: string,
  reservationData: { contactName?: string; guestCount?: number }
) {
  if (!tableDocumentId) return;

  try {
    const table = await (strapi as any)
      .documents('api::table.table')
      .findOne({ documentId: tableDocumentId });

    if (!table) return;

    const now = new Date().toISOString();

    switch (reservationStatus) {
      case 'confirmed':
        // Only reserve if table is currently free
        if (table.status === 'free') {
          await (strapi as any).documents('api::table.table').update({
            documentId: tableDocumentId,
            data: {
              status: 'reserved',
              reservedBy: reservationData.contactName,
              reservedAt: now,
              reservation: { documentId: reservationDocumentId },
            },
          });
        }
        break;

      case 'seated':
        // Mark table as occupied when guests arrive
        await (strapi as any).documents('api::table.table').update({
          documentId: tableDocumentId,
          data: {
            status: 'occupied',
            currentGuests: reservationData.guestCount || null,
            occupiedAt: now,
            reservedBy: null,
            reservedAt: null,
          },
        });
        break;

      case 'cancelled':
      case 'no_show':
        // Free the table if it was reserved for this reservation
        if (
          table.status === 'reserved' &&
          table.reservation?.documentId === reservationDocumentId
        ) {
          await (strapi as any).documents('api::table.table').update({
            documentId: tableDocumentId,
            data: {
              status: 'free',
              reservedBy: null,
              reservedAt: null,
              reservation: null,
            },
          });
        }
        break;

      case 'completed':
        // Clear reservation link but don't change status (table may still be occupied)
        if (table.reservation?.documentId === reservationDocumentId) {
          await (strapi as any).documents('api::table.table').update({
            documentId: tableDocumentId,
            data: {
              reservation: null,
            },
          });
        }
        break;
    }
  } catch (e) {
    console.error('[Reservation] Failed to sync table status:', e);
  }
}

export default {
  async beforeUpdate(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi
          .documents('api::reservation.reservation')
          .findOne({
            documentId: where.documentId,
            populate: ['table'],
          });
        event.state = { original };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Fetch table info for better logging
    let tableNumber = null;
    const tableDocumentId = getTableDocumentId(result.table);

    if (tableDocumentId) {
      try {
        const table = await strapi.documents('api::table.table').findOne({
          documentId: tableDocumentId,
        });
        tableNumber = table?.number;

        // Link reservation to table
        await strapi.documents('api::table.table').update({
          documentId: tableDocumentId,
          data: {
            reservation: { documentId: result.documentId },
          },
        });

        // If reservation is already confirmed, reserve the table
        if (result.status === 'confirmed') {
          await syncTableStatus('confirmed', tableDocumentId, result.documentId, {
            contactName: result.contactName,
            guestCount: result.guestCount,
          });
        }
      } catch (e) {
        // Ignore
      }
    }

    const dateStr = result.date
      ? new Date(result.date).toLocaleDateString('uk-UA')
      : '';
    const timeStr = result.startTime ? result.startTime.slice(0, 5) : '';

    await logAction(strapi, {
      action: 'create',
      entityType: 'reservation',
      entityId: result.documentId,
      entityName: result.contactName,
      description: `Created reservation for: ${result.contactName}`,
      descriptionUk: `Нове бронювання: ${result.contactName}${tableNumber ? ` (Стіл ${tableNumber})` : ''} на ${dateStr} ${timeStr}`,
      dataAfter: result,
      module: 'reservations',
      metadata: {
        tableNumber,
        date: result.date,
        time: result.startTime,
        guestCount: result.guestCount,
        contactPhone: result.contactPhone,
        confirmationCode: result.confirmationCode,
      },
    });
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Sync table status if status changed
    const tableDocumentId = getTableDocumentId(result.table);
    if (tableDocumentId && original?.status !== result.status) {
      await syncTableStatus(result.status, tableDocumentId, result.documentId, {
        contactName: result.contactName,
        guestCount: result.guestCount,
      });
    }

    // Determine action type based on status
    let action: 'update' | 'cancel' | 'approve' | 'start' | 'complete' = 'update';
    let descriptionUk = `Оновлено бронювання: ${result.contactName}`;
    let severity: 'info' | 'warning' = 'info';

    if (result.status === 'cancelled' && original?.status !== 'cancelled') {
      action = 'cancel';
      descriptionUk = `Скасовано бронювання: ${result.contactName}`;
      severity = 'warning';
    } else if (result.status === 'confirmed' && original?.status === 'pending') {
      action = 'approve';
      descriptionUk = `Підтверджено бронювання: ${result.contactName}`;
    } else if (result.status === 'seated' && original?.status !== 'seated') {
      action = 'start';
      descriptionUk = `Гості прибули: ${result.contactName}`;
    } else if (result.status === 'completed' && original?.status !== 'completed') {
      action = 'complete';
      descriptionUk = `Завершено бронювання: ${result.contactName}`;
    } else if (result.status === 'no_show' && original?.status !== 'no_show') {
      action = 'cancel';
      descriptionUk = `Гості не прийшли: ${result.contactName}`;
      severity = 'warning';
    }

    // Fetch table number for metadata
    let tableNumber = null;
    if (tableDocumentId) {
      try {
        const table = await strapi.documents('api::table.table').findOne({
          documentId: tableDocumentId,
        });
        tableNumber = table?.number;
      } catch (e) {
        // Ignore
      }
    }

    await logAction(strapi, {
      action,
      entityType: 'reservation',
      entityId: result.documentId,
      entityName: result.contactName,
      description:
        action === 'cancel'
          ? `Cancelled reservation for: ${result.contactName}`
          : action === 'approve'
            ? `Confirmed reservation for: ${result.contactName}`
            : `Updated reservation for: ${result.contactName}`,
      descriptionUk,
      dataBefore: original,
      dataAfter: result,
      module: 'reservations',
      severity,
      metadata: {
        tableNumber,
        date: result.date,
        time: result.startTime,
        guestCount: result.guestCount,
        status: result.status,
        previousStatus: original?.status,
      },
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi
          .documents('api::reservation.reservation')
          .findOne({
            documentId: where.documentId,
            populate: ['table'],
          });
        event.state = { entity };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterDelete(event) {
    const { state, params } = event;
    const entity = state?.entity;
    const reservationDocumentId = params.where?.documentId || 'unknown';

    // Clear table reservation link if needed
    const tableDocumentId = getTableDocumentId(entity?.table);
    if (tableDocumentId) {
      try {
        const table = await strapi.documents('api::table.table').findOne({
          documentId: tableDocumentId,
          populate: ['reservation'],
        });

        if (table?.reservation?.documentId === reservationDocumentId) {
          // Clear table reservation and free if it was reserved
          const updateData: any = {
            reservation: null,
          };

          if (table.status === 'reserved') {
            updateData.status = 'free';
            updateData.reservedBy = null;
            updateData.reservedAt = null;
          }

          await strapi.documents('api::table.table').update({
            documentId: tableDocumentId,
            data: updateData,
          });
        }
      } catch (e) {
        console.error('[Reservation] Failed to clear table on delete:', e);
      }
    }

    await logAction(strapi, {
      action: 'delete',
      entityType: 'reservation',
      entityId: reservationDocumentId,
      entityName: entity?.contactName,
      description: `Deleted reservation for: ${entity?.contactName || reservationDocumentId}`,
      dataBefore: entity,
      module: 'reservations',
      severity: 'warning',
    });
  },
};
