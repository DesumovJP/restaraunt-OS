/**
 * Stock Batch Lifecycle Hooks
 * Validates status transitions and manages batch lifecycle
 */

import { logAction } from '../../../../utils/action-logger';

const VALID_TRANSITIONS: Record<string, string[]> = {
  received: ['inspecting', 'available', 'quarantine'],
  inspecting: ['available', 'quarantine', 'written_off'],
  processing: ['available'],
  available: ['processing', 'reserved', 'depleted', 'expired', 'quarantine', 'written_off'],
  reserved: ['available', 'depleted'],
  depleted: [],
  expired: ['written_off'],
  quarantine: ['available', 'written_off'],
  written_off: []
};

export default {
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Store original for action logging
    if (where?.documentId) {
      try {
        const batch = await strapi.documents('api::stock-batch.stock-batch').findOne({
          documentId: where.documentId
        });
        event.state = { original: batch };

        if (!batch) return;

        // Validate status transition if status is being changed
        if (data.status && batch.status !== data.status) {
          const allowed = VALID_TRANSITIONS[batch.status] || [];
          if (!allowed.includes(data.status)) {
            throw new Error(
              `Invalid batch transition: ${batch.status} -> ${data.status}. Allowed: ${allowed.join(', ') || 'none'}`
            );
          }
        }

        // Auto-deplete if netAvailable reaches 0
        if (data.netAvailable !== undefined && data.netAvailable <= 0 && batch.status !== 'depleted') {
          data.status = 'depleted';
        }
      } catch (e: any) {
        if (e.message?.includes('Invalid batch transition')) throw e;
      }
    }
  },

  async beforeCreate(event) {
    const { data } = event.params;

    // Generate batch number if not provided
    if (!data.batchNumber) {
      const date = new Date();
      const prefix = `BTH-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      data.batchNumber = `${prefix}-${random}`;
    }

    // Calculate total cost
    if (data.grossIn && data.unitCost) {
      data.totalCost = data.grossIn * data.unitCost;
    }

    // Set netAvailable to grossIn if not specified
    if (data.grossIn && !data.netAvailable) {
      data.netAvailable = data.grossIn;
    }

    // Set receivedAt if not specified
    if (!data.receivedAt) {
      data.receivedAt = new Date().toISOString();
    }
  },

  async afterCreate(event) {
    const { result } = event;

    // Update ingredient's current stock
    if (result.ingredient) {
      const ingredientDocId = typeof result.ingredient === 'string'
        ? result.ingredient
        : result.ingredient.documentId;

      const ingredient = await strapi.documents('api::ingredient.ingredient').findOne({
        documentId: ingredientDocId
      });

      if (ingredient) {
        await strapi.documents('api::ingredient.ingredient').update({
          documentId: ingredientDocId,
          data: {
            currentStock: (ingredient.currentStock || 0) + (result.netAvailable || result.grossIn || 0)
          }
        });
      }

      // Create receiving inventory movement
      await strapi.documents('api::inventory-movement.inventory-movement').create({
        data: {
          ingredient: ingredientDocId,
          stockBatch: result.documentId,
          movementType: 'receive',
          quantity: result.grossIn,
          unit: ingredient?.unit || 'kg',
          grossQuantity: result.grossIn,
          netQuantity: result.netAvailable || result.grossIn,
          unitCost: result.unitCost,
          totalCost: result.totalCost,
          reason: 'Batch received',
          reasonCode: 'BATCH_RECEIVE'
        }
      });
    }

    // Log action
    await logAction(strapi, {
      action: 'receive',
      entityType: 'stock_batch',
      entityId: result.documentId,
      entityName: result.batchNumber,
      description: `Received batch: ${result.batchNumber}`,
      dataAfter: result,
      module: 'storage',
    });
  },

  async afterUpdate(event) {
    const { result } = event;

    // Check for expiry
    if (result.expiryDate && result.status === 'available') {
      const expiryDate = new Date(result.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        await strapi.documents('api::stock-batch.stock-batch').update({
          documentId: result.documentId,
          data: { status: 'expired' }
        });
      }
    }

    // Log action - determine action type based on status
    const original = event.state?.original;
    let action: 'update' | 'write_off' = 'update';
    if (result.status === 'written_off' && original?.status !== 'written_off') {
      action = 'write_off';
    }

    await logAction(strapi, {
      action,
      entityType: 'stock_batch',
      entityId: result.documentId,
      entityName: result.batchNumber,
      description: action === 'write_off'
        ? `Wrote off batch: ${result.batchNumber}`
        : `Updated batch: ${result.batchNumber}`,
      dataBefore: original,
      dataAfter: result,
      module: 'storage',
      severity: action === 'write_off' ? 'warning' : 'info',
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::stock-batch.stock-batch').findOne({
          documentId: where.documentId
        });
        event.state = { ...event.state, entity };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterDelete(event) {
    const { state, params } = event;
    const entity = state?.entity;

    await logAction(strapi, {
      action: 'delete',
      entityType: 'stock_batch',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity?.batchNumber,
      description: `Deleted batch: ${entity?.batchNumber || params.where?.documentId}`,
      dataBefore: entity,
      module: 'storage',
      severity: 'warning',
    });
  }
};
