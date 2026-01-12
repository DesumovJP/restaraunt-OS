/**
 * Supplier Lifecycle Hooks
 * Logs actions for supplier changes
 */

import {
  createStorageLifecycles,
  extractContactMetadata,
} from '../../../../utils/lifecycle-helpers';

export default createStorageLifecycles('supplier', {
  getMetadata: (entity) => ({
    ...extractContactMetadata(entity),
    taxId: entity.taxId,
  }),
  getUpdateMetadata: (original, updated) => ({
    ...extractContactMetadata(updated),
    wasActive: original?.isActive,
  }),
});
