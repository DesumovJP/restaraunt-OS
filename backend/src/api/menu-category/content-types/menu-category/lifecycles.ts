/**
 * Menu Category Lifecycle Hooks
 * Logs actions for menu category changes
 */

import { createAdminLifecycles } from '../../../../utils/lifecycle-helpers';

export default createAdminLifecycles('menu_category', {
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
