/**
 * Seed Stock Levels for Ingredients
 */

const STRAPI_URL = 'http://localhost:1337';

async function rest(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  return await response.json();
}

async function seedStock() {
  console.log('📦 Seeding ingredient stock levels...\n');

  // Get all ingredients
  const result = await rest('GET', '/ingredients?pagination[limit]=100');
  if (!result?.data) {
    console.error('Failed to fetch ingredients');
    return;
  }

  // Generate random stock for each ingredient
  let updated = 0;
  for (const ing of result.data) {
    // Skip if already has stock
    if (ing.currentStock > 0) {
      console.log(`  ⏭ ${ing.nameUk || ing.name} (${ing.currentStock} ${ing.unit})`);
      continue;
    }

    // Generate random stock based on unit type
    let stock;
    switch (ing.unit) {
      case 'pcs':
        stock = Math.floor(Math.random() * 50) + 10; // 10-60 pieces
        break;
      case 'l':
      case 'ml':
        stock = Math.floor(Math.random() * 20) + 5; // 5-25 liters
        break;
      case 'kg':
      case 'g':
      default:
        stock = Math.floor(Math.random() * 30) + 5; // 5-35 kg
        break;
    }

    // Update ingredient
    const updateResult = await rest('PUT', `/ingredients/${ing.documentId}`, {
      data: { currentStock: stock }
    });

    if (updateResult?.data) {
      console.log(`  ✓ ${ing.nameUk || ing.name}: ${stock} ${ing.unit}`);
      updated++;
    } else {
      console.log(`  ✗ ${ing.nameUk || ing.name} - failed`);
    }
  }

  console.log(`\n  Updated: ${updated} ingredients`);
}

async function main() {
  console.log('🍽️ Stock Seed Script\n');
  console.log('=' .repeat(50) + '\n');

  await seedStock();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Stock seed completed!');
}

main().catch(console.error);
