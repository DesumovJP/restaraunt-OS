/**
 * Ingredient Lifecycle Hooks
 * Logs actions and emits low stock alerts via Pusher
 */

import { logAction } from '../../../../utils/action-logger';
import { emitLowStock, isPusherEnabled } from '../../../../utils/pusher';

// Threshold for low stock warning (percentage of minStock)
const LOW_STOCK_THRESHOLD = 1.2; // Alert when stock is at or below 120% of minStock

export default {
  async beforeUpdate(event) {
    const { where } = event.params;

    // Store original for comparison
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::ingredient.ingredient').findOne({
          documentId: where.documentId,
        });
        event.state = { original };
      } catch {
        // Ignore
      }
    }
  },

  async afterCreate(event) {
    const { result } = event;

    await logAction(strapi, {
      action: 'create',
      entityType: 'ingredient',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Created ingredient: ${result.name}`,
      descriptionUk: `Новий інгредієнт: ${result.nameUk || result.name}`,
      dataAfter: result,
      module: 'storage',
      metadata: {
        name: result.name,
        nameUk: result.nameUk,
        unit: result.unit,
        currentStock: result.currentStock,
        minStock: result.minStock,
      },
    });

    // Check if newly created ingredient is low stock
    if (isPusherEnabled() && result.minStock && result.currentStock !== undefined) {
      if (result.currentStock <= result.minStock * LOW_STOCK_THRESHOLD) {
        await emitLowStock({
          documentId: result.documentId,
          name: result.name || result.nameUk,
          currentStock: result.currentStock,
          minStock: result.minStock,
          unit: result.unit || 'од',
        });
      }
    }
  },

  async afterUpdate(event) {
    const { result, state } = event;
    const original = state?.original;

    // Check for low stock alert
    const hitLowStock = result.minStock && result.currentStock !== undefined &&
      result.currentStock <= result.minStock &&
      original?.currentStock > result.minStock;

    if (hitLowStock) {
      await logAction(strapi, {
        action: 'update',
        entityType: 'ingredient',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Low stock alert: ${result.name}`,
        descriptionUk: `⚠️ Низький запас: ${result.nameUk || result.name} (${result.currentStock} ${result.unit || 'од.'} - нижче мінімуму ${result.minStock})`,
        dataBefore: original,
        dataAfter: result,
        module: 'storage',
        severity: 'warning',
        metadata: {
          name: result.name,
          nameUk: result.nameUk,
          unit: result.unit,
          currentStock: result.currentStock,
          minStock: result.minStock,
          previousStock: original?.currentStock,
        },
      });
      return;
    }

    // Check for stock replenishment
    const wasLow = original?.minStock && original?.currentStock <= original.minStock;
    const isNowOk = result.minStock && result.currentStock > result.minStock;

    if (wasLow && isNowOk) {
      await logAction(strapi, {
        action: 'update',
        entityType: 'ingredient',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Stock replenished: ${result.name}`,
        descriptionUk: `✓ Запас поповнено: ${result.nameUk || result.name} (${result.currentStock} ${result.unit || 'од.'})`,
        dataBefore: original,
        dataAfter: result,
        module: 'storage',
        metadata: {
          name: result.name,
          nameUk: result.nameUk,
          unit: result.unit,
          currentStock: result.currentStock,
          previousStock: original?.currentStock,
        },
      });
      return;
    }

    // Default update
    await logAction(strapi, {
      action: 'update',
      entityType: 'ingredient',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Updated ingredient: ${result.name}`,
      descriptionUk: `Оновлено інгредієнт: ${result.nameUk || result.name}`,
      dataBefore: original,
      dataAfter: result,
      module: 'storage',
      metadata: {
        name: result.name,
        nameUk: result.nameUk,
        unit: result.unit,
        currentStock: result.currentStock,
      },
    });

    // Check if stock dropped below threshold
    if (isPusherEnabled() && result.minStock && result.currentStock !== undefined) {
      const wasAboveThreshold = original?.currentStock > result.minStock * LOW_STOCK_THRESHOLD;
      const isNowBelowThreshold = result.currentStock <= result.minStock * LOW_STOCK_THRESHOLD;

      // Emit alert if stock just dropped below threshold
      if (wasAboveThreshold && isNowBelowThreshold) {
        await emitLowStock({
          documentId: result.documentId,
          name: result.name || result.nameUk,
          currentStock: result.currentStock,
          minStock: result.minStock,
          unit: result.unit || 'од',
        });
      }

      // Also emit if stock hit zero (critical)
      if (original?.currentStock > 0 && result.currentStock === 0) {
        await emitLowStock({
          documentId: result.documentId,
          name: result.name || result.nameUk,
          currentStock: 0,
          minStock: result.minStock,
          unit: result.unit || 'од',
        });
      }
    }
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::ingredient.ingredient').findOne({
          documentId: where.documentId,
        });
        event.state = { entity };
      } catch {
        // Ignore
      }
    }
  },

  async afterDelete(event) {
    const { state, params } = event;
    const entity = state?.entity;

    await logAction(strapi, {
      action: 'delete',
      entityType: 'ingredient',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity?.name || entity?.nameUk,
      description: `Deleted ingredient: ${entity?.name || params.where?.documentId}`,
      descriptionUk: `Видалено інгредієнт: ${entity?.nameUk || entity?.name || params.where?.documentId}`,
      dataBefore: entity,
      module: 'storage',
      severity: 'warning',
      metadata: entity ? {
        name: entity.name,
        nameUk: entity.nameUk,
        unit: entity.unit,
      } : undefined,
    });
  },
};
