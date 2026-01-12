/**
 * Recipe Lifecycle Hooks
 * Logs actions for recipe changes
 */

import {
  createAdminLifecycles,
  extractRecipeMetadata,
} from '../../../../utils/lifecycle-helpers';

export default createAdminLifecycles('recipe', {
  populate: ['ingredients', 'steps'],
  getMetadata: extractRecipeMetadata,
  getUpdateMetadata: (original, updated) => ({
    ...extractRecipeMetadata(updated),
    previousCostPerPortion: original?.costPerPortion,
  }),
});
