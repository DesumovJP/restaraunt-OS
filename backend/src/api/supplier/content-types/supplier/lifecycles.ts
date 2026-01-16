/**
 * Supplier Lifecycle Hooks
 * Logs actions for supplier changes
 */

import {
  createStorageLifecycles,
  extractContactMetadata,
} from '../../../../utils/lifecycle-helpers';
import { logAction } from '../../../../utils/action-logger';

const baseLifecycles = createStorageLifecycles('supplier', {
  getMetadata: (entity) => ({
    ...extractContactMetadata(entity),
    taxId: entity.taxId,
  }),
  getUpdateMetadata: (original, updated) => ({
    ...extractContactMetadata(updated),
    wasActive: original?.isActive,
  }),
});

export default {
  ...baseLifecycles,

  async afterCreate(event: any) {
    const { result } = event;
    if (!result) return;

    await logAction(strapi, {
      action: 'create',
      entityType: 'supplier',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Created supplier: ${result.name}`,
      descriptionUk: `Новий постачальник: ${result.nameUk || result.name}`,
      dataAfter: result,
      module: 'storage',
      metadata: {
        name: result.name,
        nameUk: result.nameUk,
        phone: result.phone,
        email: result.email,
        taxId: result.taxId,
        isActive: result.isActive,
      },
    });
  },

  async afterUpdate(event: any) {
    const { result, state } = event;
    if (!result) return;

    const original = state?.original;

    // Check for activation/deactivation
    if (original && original.isActive !== result.isActive) {
      const status = result.isActive ? 'активовано' : 'деактивовано';

      await logAction(strapi, {
        action: 'update',
        entityType: 'supplier',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Supplier ${result.isActive ? 'activated' : 'deactivated'}: ${result.name}`,
        descriptionUk: `Постачальника "${result.nameUk || result.name}" ${status}`,
        dataBefore: original,
        dataAfter: result,
        module: 'storage',
        severity: result.isActive ? 'info' : 'warning',
        metadata: {
          name: result.name,
          nameUk: result.nameUk,
          isActive: result.isActive,
          wasActive: original.isActive,
        },
      });
      return;
    }

    // Default update
    await logAction(strapi, {
      action: 'update',
      entityType: 'supplier',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Updated supplier: ${result.name}`,
      descriptionUk: `Оновлено постачальника: ${result.nameUk || result.name}`,
      dataBefore: original,
      dataAfter: result,
      module: 'storage',
      metadata: {
        name: result.name,
        nameUk: result.nameUk,
        phone: result.phone,
        email: result.email,
      },
    });
  },

  async afterDelete(event: any) {
    const { state, params } = event;
    const entity = state?.entity;
    const documentId = params.where?.documentId || 'unknown';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'supplier',
      entityId: documentId,
      entityName: entity?.name || entity?.nameUk,
      description: `Deleted supplier: ${entity?.name || documentId}`,
      descriptionUk: `Видалено постачальника: ${entity?.nameUk || entity?.name || documentId}`,
      dataBefore: entity,
      module: 'storage',
      severity: 'warning',
      metadata: entity ? {
        name: entity.name,
        nameUk: entity.nameUk,
        taxId: entity.taxId,
      } : undefined,
    });
  },
};
