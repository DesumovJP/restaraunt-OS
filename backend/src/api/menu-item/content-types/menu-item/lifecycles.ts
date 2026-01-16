/**
 * Menu Item Lifecycle Hooks
 * Logs actions for menu item changes with price tracking
 */

import {
  createAdminLifecycles,
  extractMenuItemMetadata,
} from '../../../../utils/lifecycle-helpers';
import { logAction } from '../../../../utils/action-logger';

const baseLifecycles = createAdminLifecycles('menu_item', {
  apiName: 'menu-item',
  getMetadata: extractMenuItemMetadata,
  getUpdateMetadata: (original, updated) => {
    const metadata: Record<string, unknown> = {
      ...extractMenuItemMetadata(updated),
    };

    // Track price changes specifically (important for audit)
    if (original?.price !== updated.price) {
      metadata.priceChange = {
        from: original?.price,
        to: updated.price,
        difference: ((updated.price as number) || 0) - ((original?.price as number) || 0),
      };
    }

    // Track availability changes
    if (original?.isAvailable !== updated.isAvailable) {
      metadata.availabilityChange = {
        from: original?.isAvailable,
        to: updated.isAvailable,
      };
    }

    return metadata;
  },
});

// Override afterUpdate to add Ukrainian description for price changes
export default {
  ...baseLifecycles,

  async afterUpdate(event: any) {
    const { result, state } = event;
    if (!result) return;

    const original = state?.original;

    // Check for price change - use custom logging
    if (original && original.price !== result.price) {
      const priceDiff = (result.price || 0) - (original.price || 0);
      const direction = priceDiff > 0 ? '↑' : '↓';

      await logAction(strapi, {
        action: 'update',
        entityType: 'menu_item',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Price changed for menu item: ${result.name}`,
        descriptionUk: `Зміна ціни: ${result.nameUk || result.name} ${original.price}₴ → ${result.price}₴ (${direction}${Math.abs(priceDiff)}₴)`,
        dataBefore: original,
        dataAfter: result,
        module: 'admin',
        severity: 'info',
        metadata: {
          ...extractMenuItemMetadata(result),
          priceChange: {
            from: original.price,
            to: result.price,
            difference: priceDiff,
          },
        },
      });
      return;
    }

    // Check for availability change
    if (original && original.isAvailable !== result.isAvailable) {
      const status = result.isAvailable ? 'активовано' : 'деактивовано';

      await logAction(strapi, {
        action: 'update',
        entityType: 'menu_item',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Menu item ${result.isAvailable ? 'activated' : 'deactivated'}: ${result.name}`,
        descriptionUk: `${result.nameUk || result.name} - ${status}`,
        dataBefore: original,
        dataAfter: result,
        module: 'admin',
        severity: result.isAvailable ? 'info' : 'warning',
        metadata: {
          ...extractMenuItemMetadata(result),
          availabilityChange: {
            from: original.isAvailable,
            to: result.isAvailable,
          },
        },
      });
      return;
    }

    // For other updates, use base lifecycle
    await baseLifecycles.afterUpdate(event);
  },
};
