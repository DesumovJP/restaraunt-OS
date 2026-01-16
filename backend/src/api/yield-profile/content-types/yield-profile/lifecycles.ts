/**
 * Yield Profile Lifecycle Hooks
 * Logs actions for yield profile changes (affects food cost calculations)
 */

import { logAction } from '../../../../utils/action-logger';

export default {
  async beforeUpdate(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const original = await strapi.documents('api::yield-profile.yield-profile').findOne({
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
    if (!result) return;

    await logAction(strapi, {
      action: 'create',
      entityType: 'yield_profile',
      entityId: result.documentId,
      entityName: result.name,
      description: `Created yield profile: ${result.name}`,
      descriptionUk: `Новий профіль виходу: ${result.name} (${((result.baseYieldRatio || 1) * 100).toFixed(0)}%)`,
      dataAfter: result,
      module: 'admin',
      metadata: {
        name: result.name,
        slug: result.slug,
        baseYieldRatio: result.baseYieldRatio,
        processYieldsCount: Array.isArray(result.processYields) ? result.processYields.length : 0,
      },
    });
  },

  async afterUpdate(event) {
    const { result, state } = event;
    if (!result) return;

    const original = state?.original;

    // Check for yield ratio change (important for cost calculations)
    if (original && original.baseYieldRatio !== result.baseYieldRatio) {
      const oldPercent = ((original.baseYieldRatio || 1) * 100).toFixed(0);
      const newPercent = ((result.baseYieldRatio || 1) * 100).toFixed(0);
      const direction = result.baseYieldRatio > original.baseYieldRatio ? '↑' : '↓';

      await logAction(strapi, {
        action: 'update',
        entityType: 'yield_profile',
        entityId: result.documentId,
        entityName: result.name,
        description: `Yield profile ratio changed: ${result.name}`,
        descriptionUk: `Зміна виходу: ${result.name} ${oldPercent}% → ${newPercent}% (${direction})`,
        dataBefore: original,
        dataAfter: result,
        module: 'admin',
        severity: 'info',
        metadata: {
          name: result.name,
          previousYieldRatio: original.baseYieldRatio,
          newYieldRatio: result.baseYieldRatio,
          changeDirection: direction,
        },
      });
      return;
    }

    // Default update
    await logAction(strapi, {
      action: 'update',
      entityType: 'yield_profile',
      entityId: result.documentId,
      entityName: result.name,
      description: `Updated yield profile: ${result.name}`,
      descriptionUk: `Оновлено профіль виходу: ${result.name}`,
      dataBefore: original,
      dataAfter: result,
      module: 'admin',
      metadata: {
        name: result.name,
        baseYieldRatio: result.baseYieldRatio,
      },
    });
  },

  async beforeDelete(event) {
    const { where } = event.params;
    if (where?.documentId) {
      try {
        const entity = await strapi.documents('api::yield-profile.yield-profile').findOne({
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
    const documentId = params.where?.documentId || 'unknown';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'yield_profile',
      entityId: documentId,
      entityName: entity?.name,
      description: `Deleted yield profile: ${entity?.name || documentId}`,
      descriptionUk: `Видалено профіль виходу: ${entity?.name || documentId}`,
      dataBefore: entity,
      module: 'admin',
      severity: 'warning',
      metadata: entity
        ? {
            name: entity.name,
            baseYieldRatio: entity.baseYieldRatio,
          }
        : undefined,
    });
  },
};
