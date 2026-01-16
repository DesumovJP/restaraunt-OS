/**
 * Recipe Lifecycle Hooks
 * Logs actions for recipe changes with cost tracking
 */

import {
  createAdminLifecycles,
  extractRecipeMetadata,
} from '../../../../utils/lifecycle-helpers';
import { logAction } from '../../../../utils/action-logger';

const baseLifecycles = createAdminLifecycles('recipe', {
  populate: ['ingredients', 'ingredients.ingredient', 'steps'],
  getMetadata: extractRecipeMetadata,
  getUpdateMetadata: (original, updated) => ({
    ...extractRecipeMetadata(updated),
    previousCostPerPortion: original?.costPerPortion,
  }),
});

// Helper to extract ingredient names for comparison
function getIngredientNames(ingredients: any[]): string[] {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.map(ing => ing.ingredient?.name || ing.ingredientName || 'Unknown').sort();
}

// Helper to compare ingredient lists
function getIngredientChanges(originalIngs: any[], newIngs: any[]): { added: string[], removed: string[], changed: boolean } {
  const originalNames = new Set(getIngredientNames(originalIngs));
  const newNames = new Set(getIngredientNames(newIngs));

  const added = [...newNames].filter(name => !originalNames.has(name));
  const removed = [...originalNames].filter(name => !newNames.has(name));

  return { added, removed, changed: added.length > 0 || removed.length > 0 };
}

export default {
  ...baseLifecycles,

  async afterCreate(event: any) {
    const { result } = event;
    if (!result) return;

    // Fetch with ingredients to get count
    let ingredientsCount = 0;
    try {
      const fullRecipe = await (strapi as any).documents('api::recipe.recipe').findOne({
        documentId: result.documentId,
        populate: ['ingredients'],
      });
      ingredientsCount = fullRecipe?.ingredients?.length || 0;
    } catch {
      // Ignore
    }

    await logAction(strapi, {
      action: 'create',
      entityType: 'recipe',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Created recipe: ${result.name}`,
      descriptionUk: `Новий рецепт: ${result.nameUk || result.name}${ingredientsCount ? ` (${ingredientsCount} інгредієнтів)` : ''}`,
      dataAfter: result,
      module: 'admin',
      metadata: {
        ...extractRecipeMetadata(result),
        ingredientsCount,
      },
    });
  },

  async afterUpdate(event: any) {
    const { result, state } = event;
    if (!result) return;

    const original = state?.original;

    // Fetch with ingredients to get full data
    let fullRecipe: any = null;
    let ingredientsCount = 0;
    try {
      fullRecipe = await (strapi as any).documents('api::recipe.recipe').findOne({
        documentId: result.documentId,
        populate: ['ingredients', 'ingredients.ingredient'],
      });
      ingredientsCount = fullRecipe?.ingredients?.length || 0;
    } catch {
      // Ignore
    }

    // Check for ingredient composition changes (important for recipe tracking)
    if (original && fullRecipe) {
      const originalIngredients = original.ingredients || [];
      const newIngredients = fullRecipe.ingredients || [];
      const { added, removed, changed } = getIngredientChanges(originalIngredients, newIngredients);

      if (changed) {
        let changeDesc = '';
        if (added.length > 0 && removed.length > 0) {
          changeDesc = `+${added.join(', ')}; -${removed.join(', ')}`;
        } else if (added.length > 0) {
          changeDesc = `+${added.join(', ')}`;
        } else {
          changeDesc = `-${removed.join(', ')}`;
        }

        await logAction(strapi, {
          action: 'update',
          entityType: 'recipe',
          entityId: result.documentId,
          entityName: result.name || result.nameUk,
          description: `Recipe ingredients changed: ${result.name}`,
          descriptionUk: `Зміна складу рецепту: ${result.nameUk || result.name} (${changeDesc})`,
          dataBefore: { ingredients: originalIngredients.length },
          dataAfter: { ingredients: newIngredients.length },
          module: 'admin',
          severity: 'info',
          metadata: {
            ...extractRecipeMetadata(result),
            ingredientsCount,
            ingredientChanges: {
              added,
              removed,
              previousCount: originalIngredients.length,
              newCount: newIngredients.length,
            },
          },
        });
        return;
      }
    }

    // Check for cost per portion change (important for food cost analysis)
    if (original && original.costPerPortion !== result.costPerPortion) {
      const costDiff = (result.costPerPortion || 0) - (original.costPerPortion || 0);
      const direction = costDiff > 0 ? '↑' : '↓';

      await logAction(strapi, {
        action: 'update',
        entityType: 'recipe',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Recipe cost changed: ${result.name}`,
        descriptionUk: `Зміна собівартості: ${result.nameUk || result.name} ${(original.costPerPortion || 0).toFixed(2)}₴ → ${(result.costPerPortion || 0).toFixed(2)}₴ (${direction}${Math.abs(costDiff).toFixed(2)}₴)`,
        dataBefore: original,
        dataAfter: result,
        module: 'admin',
        severity: 'info',
        metadata: {
          ...extractRecipeMetadata(result),
          ingredientsCount,
          costChange: {
            from: original.costPerPortion,
            to: result.costPerPortion,
            difference: costDiff,
          },
        },
      });
      return;
    }

    // Check for activation/deactivation
    if (original && original.isActive !== result.isActive) {
      const status = result.isActive ? 'активовано' : 'деактивовано';

      await logAction(strapi, {
        action: 'update',
        entityType: 'recipe',
        entityId: result.documentId,
        entityName: result.name || result.nameUk,
        description: `Recipe ${result.isActive ? 'activated' : 'deactivated'}: ${result.name}`,
        descriptionUk: `Рецепт "${result.nameUk || result.name}" ${status}`,
        dataBefore: original,
        dataAfter: result,
        module: 'admin',
        severity: result.isActive ? 'info' : 'warning',
        metadata: {
          ...extractRecipeMetadata(result),
          ingredientsCount,
        },
      });
      return;
    }

    // Default update
    await logAction(strapi, {
      action: 'update',
      entityType: 'recipe',
      entityId: result.documentId,
      entityName: result.name || result.nameUk,
      description: `Updated recipe: ${result.name}`,
      descriptionUk: `Оновлено рецепт: ${result.nameUk || result.name}`,
      dataBefore: original,
      dataAfter: result,
      module: 'admin',
      metadata: {
        ...extractRecipeMetadata(result),
        ingredientsCount,
      },
    });
  },

  async afterDelete(event: any) {
    const { state, params } = event;
    const entity = state?.entity;
    const documentId = params.where?.documentId || 'unknown';

    await logAction(strapi, {
      action: 'delete',
      entityType: 'recipe',
      entityId: documentId,
      entityName: entity?.name || entity?.nameUk,
      description: `Deleted recipe: ${entity?.name || documentId}`,
      descriptionUk: `Видалено рецепт: ${entity?.nameUk || entity?.name || documentId}`,
      dataBefore: entity,
      module: 'admin',
      severity: 'warning',
      metadata: entity ? extractRecipeMetadata(entity) : undefined,
    });
  },
};
