/**
 * Inventory Movement Lifecycle Hooks
 * Logs actions for inventory movements
 */

import { logAction } from '../../../../utils/action-logger';

// Ukrainian descriptions for movement types
const MOVEMENT_TYPE_UK: Record<string, string> = {
  receive: 'Надходження',
  consume: 'Витрата',
  write_off: 'Списання',
  transfer: 'Переміщення',
  adjustment: 'Коригування',
};

export default {
  async afterCreate(event) {
    const { result } = event;

    // Get movement with relations
    const movement = await strapi.documents('api::inventory-movement.inventory-movement').findOne({
      documentId: result.documentId,
      populate: ['ingredient', 'stockBatch', 'operator']
    }) as any;

    // Map movement type to action
    const actionMap: Record<string, string> = {
      receive: 'receive',
      consume: 'update',
      write_off: 'write_off',
      transfer: 'transfer',
      adjustment: 'update',
    };

    const action = actionMap[result.movementType] || 'create';
    const ingredientName = movement?.ingredient?.name || 'Unknown';
    const ingredientNameUk = movement?.ingredient?.nameUk || ingredientName;
    const unit = movement?.ingredient?.unit || 'од.';
    const movementTypeUk = MOVEMENT_TYPE_UK[result.movementType] || result.movementType;

    await logAction(strapi, {
      action: action as any,
      entityType: 'inventory_movement',
      entityId: result.documentId,
      entityName: `${result.movementType} - ${ingredientName} (${result.quantity})`,
      description: `Inventory ${result.movementType}: ${ingredientName} - ${result.quantity} ${unit}`,
      descriptionUk: `${movementTypeUk}: ${ingredientNameUk} - ${result.quantity} ${unit}${result.reason ? ` (${result.reason})` : ''}`,
      dataAfter: movement || result,
      module: 'storage',
      severity: result.movementType === 'write_off' ? 'warning' : 'info',
      metadata: {
        movementType: result.movementType,
        ingredientId: movement?.ingredient?.documentId,
        ingredientName,
        ingredientNameUk,
        quantity: result.quantity,
        unit,
        reason: result.reason,
        batchNumber: movement?.stockBatch?.batchNumber,
        performedBy: movement?.operator?.username
      }
    });
  },

  async beforeUpdate(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::inventory-movement.inventory-movement').findOne({
          documentId: where.documentId,
          populate: ['ingredient', 'stockBatch']
        }) as any;
        event.state = { original };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterUpdate(event) {
    const { result } = event;
    const original = event.state?.original;

    // Get updated movement with relations
    const movement = await strapi.documents('api::inventory-movement.inventory-movement').findOne({
      documentId: result.documentId,
      populate: ['ingredient', 'stockBatch']
    }) as any;

    const ingredientName = movement?.ingredient?.name || original?.ingredient?.name || 'Unknown';
    const ingredientNameUk = movement?.ingredient?.nameUk || ingredientName;
    const unit = movement?.ingredient?.unit || 'од.';
    const movementTypeUk = MOVEMENT_TYPE_UK[result.movementType] || result.movementType;

    await logAction(strapi, {
      action: 'update',
      entityType: 'inventory_movement',
      entityId: result.documentId,
      entityName: `${result.movementType} - ${ingredientName}`,
      description: `Updated inventory movement: ${result.movementType} - ${ingredientName}`,
      descriptionUk: `Оновлено рух: ${movementTypeUk} ${ingredientNameUk} - ${result.quantity} ${unit}`,
      dataBefore: original,
      dataAfter: movement || result,
      module: 'storage',
      metadata: {
        movementType: result.movementType,
        ingredientName,
        ingredientNameUk,
        quantity: result.quantity,
        previousQuantity: original?.quantity,
        unit,
        reason: result.reason
      }
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::inventory-movement.inventory-movement').findOne({
          documentId: where.documentId,
          populate: ['ingredient', 'stockBatch']
        }) as any;
        event.state = { entity };
      } catch (e) {
        // Ignore
      }
    }
  },

  async afterDelete(event) {
    const { state, params } = event;
    const entity = state?.entity;

    const ingredientName = entity?.ingredient?.name || 'Unknown';
    const ingredientNameUk = entity?.ingredient?.nameUk || ingredientName;
    const movementTypeUk = entity?.movementType ? (MOVEMENT_TYPE_UK[entity.movementType] || entity.movementType) : '';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'inventory_movement',
      entityId: params.where?.documentId || 'unknown',
      entityName: entity ? `${entity.movementType} - ${ingredientName}` : undefined,
      description: `Deleted inventory movement: ${entity?.movementType} - ${ingredientName}`,
      descriptionUk: `Видалено рух: ${movementTypeUk} ${ingredientNameUk}`,
      dataBefore: entity,
      module: 'storage',
      severity: 'warning',
      metadata: {
        movementType: entity?.movementType,
        ingredientName,
        ingredientNameUk,
        quantity: entity?.quantity,
        reason: entity?.reason
      }
    });
  }
};
