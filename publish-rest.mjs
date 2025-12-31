/**
 * Publish categories and add items using REST API
 */

const STRAPI_URL = 'http://localhost:1337';

async function rest(method, endpoint, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  const result = await response.json();

  if (result.error) {
    console.error(`REST Error: ${result.error.message}`);
    return null;
  }
  return result;
}

// ========== PUBLISH ALL CATEGORIES ==========
async function publishCategories() {
  console.log('📂 Publishing categories via REST...\n');

  // Get all categories including drafts
  const result = await rest('GET', '/menu-categories?status=draft&pagination[limit]=50');
  if (!result?.data) return;

  for (const cat of result.data) {
    if (!cat.publishedAt) {
      // Publish by updating with publishedAt
      const pubResult = await rest('PUT', `/menu-categories/${cat.documentId}`, {
        data: { publishedAt: new Date().toISOString() }
      });
      if (pubResult) {
        console.log(`  ✓ Published: ${cat.nameUk || cat.name}`);
      }
    } else {
      console.log(`  ⏭ Already published: ${cat.nameUk || cat.name}`);
    }
  }
}

// ========== PUBLISH ALL MENU ITEMS ==========
async function publishMenuItems() {
  console.log('\n🍽️ Publishing menu items via REST...\n');

  const result = await rest('GET', '/menu-items?status=draft&pagination[limit]=200');
  if (!result?.data) return;

  let count = 0;
  for (const item of result.data) {
    if (!item.publishedAt) {
      await rest('PUT', `/menu-items/${item.documentId}`, {
        data: { publishedAt: new Date().toISOString() }
      });
      count++;
    }
  }
  console.log(`  Published ${count} items`);
}

// ========== ADD REMAINING ITEMS VIA REST ==========
async function addRemainingItems() {
  console.log('\n🍽️ Adding remaining menu items via REST...\n');

  // Get all categories
  const catResult = await rest('GET', '/menu-categories?pagination[limit]=50');
  if (!catResult?.data) return;

  const categories = {};
  catResult.data.forEach(c => {
    categories[c.slug] = c.documentId;
  });

  console.log('  Categories:', Object.keys(categories).join(', '));

  // Get existing items
  const itemResult = await rest('GET', '/menu-items?pagination[limit]=200');
  const existingSlugs = new Set(itemResult?.data?.map(i => i.slug) || []);

  const newItems = [
    // ========== Заготовки (Semi-finished) ==========
    { name: 'Caesar Dressing', nameUk: 'Соус Цезар', slug: 'caesar-dressing', price: 25, categorySlug: 'semi-finished', description: 'House-made Caesar dressing', descriptionUk: 'Домашній соус Цезар (100 мл)', outputType: 'cold', preparationTime: 5 },
    { name: 'Pesto Sauce', nameUk: 'Песто', slug: 'pesto-sauce', price: 35, categorySlug: 'semi-finished', description: 'Basil pesto sauce', descriptionUk: 'Класичний соус песто з базиліку (100 мл)', outputType: 'cold', preparationTime: 5 },
    { name: 'Chicken Stock Prep', nameUk: 'Курячий бульйон (заготовка)', slug: 'chicken-stock-prep', price: 45, categorySlug: 'semi-finished', description: '1 liter chicken stock', descriptionUk: 'Курячий бульйон (1л)', outputType: 'kitchen', preparationTime: 5 },
    { name: 'Mashed Base', nameUk: 'Основа для пюре', slug: 'mashed-base', price: 35, categorySlug: 'semi-finished', description: 'Pre-made mashed potato base', descriptionUk: 'Готова основа для пюре (500г)', outputType: 'kitchen', preparationTime: 5 },
    { name: 'Marinated Chicken', nameUk: 'Мариноване куряче філе', slug: 'marinated-chicken', price: 85, categorySlug: 'semi-finished', description: 'Pre-marinated chicken fillet', descriptionUk: 'Замариноване куряче філе в спеціях (300г)', outputType: 'kitchen', preparationTime: 5 },
    { name: 'Garlic Butter', nameUk: 'Часникове масло', slug: 'garlic-butter', price: 25, categorySlug: 'semi-finished', description: 'Compound garlic butter', descriptionUk: 'Масло з часником та травами (50г)', outputType: 'cold', preparationTime: 3 },
    { name: 'Caramelized Onions', nameUk: 'Карамелізована цибуля', slug: 'caramelized-onions', price: 30, categorySlug: 'semi-finished', description: 'Slow-cooked caramelized onions', descriptionUk: 'Повільно обсмажена цибуля (150г)', outputType: 'kitchen', preparationTime: 5 },
    { name: 'Tomato Sauce Base', nameUk: 'Томатний соус', slug: 'tomato-sauce-base', price: 35, categorySlug: 'semi-finished', description: 'House tomato sauce', descriptionUk: 'Домашній томатний соус (200 мл)', outputType: 'kitchen', preparationTime: 5 },

    // ========== Сніданки (Breakfast) ==========
    { name: 'Eggs Benedict', nameUk: 'Яйця Бенедикт', slug: 'eggs-benedict', price: 175, categorySlug: 'breakfast', description: 'Poached eggs with hollandaise', descriptionUk: 'Яйця пашот з соусом голландез на тості', outputType: 'kitchen', preparationTime: 15 },
    { name: 'Omelette with Cheese', nameUk: 'Омлет з сиром', slug: 'omelette-cheese', price: 125, categorySlug: 'breakfast', description: '3 eggs omelette with cheese', descriptionUk: 'Омлет з 3 яєць з сиром та травами', outputType: 'kitchen', preparationTime: 10 },
    { name: 'Pancakes', nameUk: 'Панкейки', slug: 'pancakes', price: 145, categorySlug: 'breakfast', description: 'Fluffy pancakes with maple syrup', descriptionUk: 'Пухкі панкейки з кленовим сиропом', outputType: 'pastry', preparationTime: 12 },
    { name: 'Granola Bowl', nameUk: 'Гранола', slug: 'granola-bowl', price: 135, categorySlug: 'breakfast', description: 'Granola with yogurt and berries', descriptionUk: 'Гранола з йогуртом та ягодами', outputType: 'cold', preparationTime: 5 },
    { name: 'French Toast', nameUk: 'Французький тост', slug: 'french-toast', price: 155, categorySlug: 'breakfast', description: 'Cinnamon French toast', descriptionUk: 'Французькі тости з корицею та медом', outputType: 'kitchen', preparationTime: 10 },
    { name: 'Scrambled Eggs', nameUk: 'Скрембл', slug: 'scrambled-eggs', price: 115, categorySlug: 'breakfast', description: 'Creamy scrambled eggs', descriptionUk: 'Вершкові яйця-скрембл з тостом', outputType: 'kitchen', preparationTime: 8 },
    { name: 'Avocado Toast', nameUk: 'Тост з авокадо', slug: 'avocado-toast', price: 165, categorySlug: 'breakfast', description: 'Smashed avocado on sourdough', descriptionUk: 'Авокадо на тості з яйцем пашот', outputType: 'cold', preparationTime: 8 },
    { name: 'Full English', nameUk: 'Англійський сніданок', slug: 'full-english', price: 245, categorySlug: 'breakfast', description: 'Traditional English breakfast', descriptionUk: 'Яйця, бекон, сосиски, квасоля, гриби', outputType: 'kitchen', preparationTime: 20 },
  ];

  let created = 0;
  for (const item of newItems) {
    if (existingSlugs.has(item.slug)) {
      console.log(`  ⏭ ${item.nameUk} exists`);
      continue;
    }

    const categoryId = categories[item.categorySlug];
    if (!categoryId) {
      console.log(`  ✗ ${item.nameUk} - category not found: ${item.categorySlug}`);
      continue;
    }

    const result = await rest('POST', '/menu-items', {
      data: {
        name: item.name,
        nameUk: item.nameUk,
        slug: item.slug,
        price: item.price,
        description: item.description,
        descriptionUk: item.descriptionUk,
        outputType: item.outputType,
        preparationTime: item.preparationTime,
        available: true,
        category: categoryId,
        publishedAt: new Date().toISOString(),
      },
    });

    if (result?.data) {
      console.log(`  ✓ ${item.nameUk} (${item.price} грн)`);
      created++;
    } else {
      console.log(`  ✗ ${item.nameUk} - failed`);
    }
  }

  console.log(`\n  Created: ${created}`);
}

// ========== MAIN ==========
async function main() {
  console.log('🍽️ Publish and Seed via REST\n');
  console.log('=' .repeat(50) + '\n');

  await publishCategories();
  await publishMenuItems();
  await addRemainingItems();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ All done!');
}

main().catch(console.error);
