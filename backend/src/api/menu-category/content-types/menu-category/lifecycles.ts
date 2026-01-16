/**
 * Menu Category Lifecycle Hooks
 * Logs actions for menu category changes
 */

import { createAdminLifecycles } from '../../../../utils/lifecycle-helpers';
import { logAction } from '../../../../utils/action-logger';

const baseLifecycles = createAdminLifecycles('menu_category', {
  apiName: 'menu-category',
  getMetadata: (entity) => ({
    name: entity.name,
    nameUk: entity.nameUk,
    slug: entity.slug,
    icon: entity.icon,
    sortOrder: entity.sortOrder,
    isActive: entity.isActive,
  }),
  getUpdateMetadata: (original, updated) => ({
    name: updated.name,
    nameUk: updated.nameUk,
    isActive: updated.isActive,
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
      entityType: 'menu_category',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Created menu category: ${result.name}`,
      descriptionUk: `Нова категорія меню: ${result.nameUk || result.name}`,
      dataAfter: result,
      module: 'admin',
      metadata: {
        name: result.name,
        nameUk: result.nameUk,
        slug: result.slug,
        icon: result.icon,
        sortOrder: result.sortOrder,
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
        entityType: 'menu_category',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Menu category ${result.isActive ? 'activated' : 'deactivated'}: ${result.name}`,
        descriptionUk: `Категорію "${result.nameUk || result.name}" ${status}`,
        dataBefore: original,
        dataAfter: result,
        module: 'admin',
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
      entityType: 'menu_category',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Updated menu category: ${result.name}`,
      descriptionUk: `Оновлено категорію: ${result.nameUk || result.name}`,
      dataBefore: original,
      dataAfter: result,
      module: 'admin',
      metadata: {
        name: result.name,
        nameUk: result.nameUk,
        isActive: result.isActive,
      },
    });
  },

  async afterDelete(event: any) {
    const { state, params } = event;
    const entity = state?.entity;
    const documentId = params.where?.documentId || 'unknown';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'menu_category',
      entityId: documentId,
      entityName: entity?.name || entity?.nameUk,
      description: `Deleted menu category: ${entity?.name || documentId}`,
      descriptionUk: `Видалено категорію: ${entity?.nameUk || entity?.name || documentId}`,
      dataBefore: entity,
      module: 'admin',
      severity: 'warning',
      metadata: entity ? {
        name: entity.name,
        nameUk: entity.nameUk,
        slug: entity.slug,
      } : undefined,
    });
  },
};
