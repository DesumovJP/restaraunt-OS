import type { Schema, Struct } from '@strapi/strapi';

export interface RecipeRecipeIngredient extends Struct.ComponentSchema {
  collectionName: 'components_recipe_ingredients';
  info: {
    displayName: 'Recipe Ingredient';
    icon: 'leaf';
  };
  attributes: {
    ingredient: Schema.Attribute.Relation<
      'oneToOne',
      'api::ingredient.ingredient'
    >;
    isOptional: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    processChain: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<['cleaning']>;
    quantity: Schema.Attribute.Decimal & Schema.Attribute.Required;
    unit: Schema.Attribute.Enumeration<
      ['kg', 'g', 'l', 'ml', 'pcs', 'portion']
    >;
    wasteAllowancePercent: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<5>;
  };
}

export interface RecipeRecipeStep extends Struct.ComponentSchema {
  collectionName: 'components_recipe_steps';
  info: {
    displayName: 'Recipe Step';
    icon: 'list-ordered';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    estimatedTimeMinutes: Schema.Attribute.Integer;
    processType: Schema.Attribute.Enumeration<
      [
        'cleaning',
        'boiling',
        'frying',
        'rendering',
        'baking',
        'grilling',
        'portioning',
      ]
    >;
    station: Schema.Attribute.Enumeration<
      ['grill', 'fry', 'salad', 'hot', 'dessert', 'bar', 'pass', 'prep']
    >;
    stepNumber: Schema.Attribute.Integer & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'recipe.recipe-ingredient': RecipeRecipeIngredient;
      'recipe.recipe-step': RecipeRecipeStep;
    }
  }
}
