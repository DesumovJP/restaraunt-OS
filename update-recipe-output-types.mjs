/**
 * Update Recipe Output Types
 * Sets proper outputType for all existing recipes based on their category/name
 */

const STRAPI_URL = 'http://localhost:1337';

// Mapping of recipe slugs to their outputType
// bar: drinks and cocktails
// pastry: desserts
// cold: cold appetizers and salads
// kitchen: hot dishes (default)

const OUTPUT_TYPE_MAP = {
  // BAR (drinks, cocktails, coffee)
  'recipe-espresso': 'bar',
  'recipe-cappuccino': 'bar',
  'recipe-lemonade': 'bar',
  'recipe-orange-juice': 'bar',
  'recipe-aperol-spritz': 'bar',
  'recipe-mojito': 'bar',
  'recipe-margarita': 'bar',
  'recipe-negroni': 'bar',
  'recipe-cosmopolitan': 'bar',
  'recipe-americano': 'bar',
  'recipe-latte': 'bar',
  'recipe-green-tea': 'bar',
  'recipe-hot-chocolate': 'bar',

  // PASTRY (desserts, cakes, sweets)
  'recipe-tiramisu': 'pastry',
  'recipe-napoleon': 'pastry',
  'recipe-cheesecake': 'pastry',
  'recipe-chocolate-fondant': 'pastry',
  'recipe-panna-cotta': 'pastry',
  'recipe-creme-brulee': 'pastry',
  'recipe-ice-cream': 'pastry',
  'recipe-fruit-salad': 'pastry',
  'recipe-macarons': 'pastry',
  'recipe-eclair': 'pastry',

  // COLD (cold appetizers, salads)
  'recipe-caesar-salad': 'cold',
  'recipe-greek-salad': 'cold',
  'recipe-caprese': 'cold',
  'recipe-bruschetta': 'cold',
  'recipe-carpaccio': 'cold',
  'recipe-cheese-plate': 'cold',
  'recipe-tartare': 'cold',
  'recipe-salmon-tartare': 'cold',
  'recipe-tuna-tartare': 'cold',
  'recipe-vitello-tonnato': 'cold',
  'recipe-gazpacho': 'cold',
  'recipe-ceviche': 'cold',

  // KITCHEN (everything else - hot dishes, soups, etc.)
  // These will use default 'kitchen'
};

async function graphql(query, variables = {}) {
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

async function rest(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  return await response.json();
}

async function main() {
  console.log('🍽️  Updating Recipe Output Types\n');
  console.log('='.repeat(50) + '\n');

  // Fetch all recipes
  const data = await graphql(`
    query GetRecipes {
      recipes(pagination: { limit: 200 }) {
        documentId
        name
        nameUk
        slug
        outputType
      }
    }
  `);

  if (!data?.recipes) {
    console.error('Failed to fetch recipes');
    return;
  }

  console.log(`Found ${data.recipes.length} recipes\n`);

  let updated = 0;
  let skipped = 0;

  const stats = {
    kitchen: 0,
    bar: 0,
    pastry: 0,
    cold: 0,
  };

  for (const recipe of data.recipes) {
    // Determine outputType from mapping or default to 'kitchen'
    const targetOutputType = OUTPUT_TYPE_MAP[recipe.slug] || 'kitchen';
    stats[targetOutputType]++;

    // Skip if already correct
    if (recipe.outputType === targetOutputType) {
      console.log(`  ⏭  ${recipe.nameUk || recipe.name} - already ${targetOutputType}`);
      skipped++;
      continue;
    }

    // Update via REST API (GraphQL mutations can be problematic for enums)
    const result = await rest('PUT', `/recipes/${recipe.documentId}`, {
      data: {
        outputType: targetOutputType,
      },
    });

    if (result?.data) {
      console.log(`  ✓  ${recipe.nameUk || recipe.name} → ${targetOutputType}`);
      updated++;
    } else {
      console.log(`  ✗  ${recipe.nameUk || recipe.name} - failed to update`);
      if (result?.error) {
        console.log(`      Error: ${result.error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:\n');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`\n📍 Distribution:`);
  console.log(`  Kitchen:    ${stats.kitchen}`);
  console.log(`  Bar:        ${stats.bar}`);
  console.log(`  Pastry:     ${stats.pastry}`);
  console.log(`  Cold:       ${stats.cold}`);
  console.log('\n✅ Done!');
}

main().catch(console.error);
