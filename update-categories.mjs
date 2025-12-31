/**
 * Update existing ingredients with proper subCategory values
 */

const STRAPI_URL = 'http://localhost:1337';

async function graphql(query, variables) {
  const response = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL Error:', result.errors[0].message);
    return null;
  }
  return result.data;
}

// Mapping slug -> subCategory
const categoryMap = {
  // Poultry
  'chicken-fillet': 'poultry',
  // Meat
  'pork-leg': 'meat',
  'beef-tenderloin': 'meat',
  // Seafood
  'salmon-fillet': 'seafood',
  // Vegetables
  'potato': 'vegetables',
  'carrot': 'vegetables',
  'onion': 'vegetables',
  'garlic': 'vegetables',
  'tomato': 'vegetables',
  'bell-pepper': 'vegetables',
  'iceberg-lettuce': 'vegetables',
  'arugula': 'vegetables',
  // Eggs
  'eggs': 'eggs',
  // Dairy
  'cream-33': 'cream',
  'parmesan': 'cheese',
  'butter': 'butter',
  // Dry goods
  'wheat-flour': 'flour',
  'rice': 'grains',
  'spaghetti': 'pasta',
  // Seasonings
  'salt': 'salt-pepper',
  // Oils
  'olive-oil': 'vegetable-oil',
  'sunflower-oil': 'vegetable-oil',
};

async function main() {
  console.log('🔄 Updating ingredient categories...\n');

  // Fetch all ingredients without subCategory
  const data = await graphql(`{
    ingredients(pagination: { limit: 200 }, filters: { subCategory: { null: true } }) {
      documentId
      slug
      nameUk
      mainCategory
    }
  }`);

  if (!data?.ingredients) {
    console.log('No ingredients to update');
    return;
  }

  console.log(`Found ${data.ingredients.length} ingredients without subCategory\n`);

  const updateMutation = `
    mutation UpdateIngredient($documentId: ID!, $data: IngredientInput!) {
      updateIngredient(documentId: $documentId, data: $data) { documentId subCategory }
    }
  `;

  let updated = 0;
  for (const ing of data.ingredients) {
    const subCategory = categoryMap[ing.slug];
    if (!subCategory) {
      console.log(`  ⏭ ${ing.nameUk} - no mapping found for slug: ${ing.slug}`);
      continue;
    }

    const result = await graphql(updateMutation, {
      documentId: ing.documentId,
      data: { subCategory },
    });

    if (result?.updateIngredient) {
      console.log(`  ✓ ${ing.nameUk} -> ${subCategory}`);
      updated++;
    } else {
      console.log(`  ✗ ${ing.nameUk} - failed to update`);
    }
  }

  console.log(`\n✅ Updated ${updated} ingredients`);
}

main().catch(console.error);
