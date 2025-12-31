/**
 * Publish all drafts and add remaining menu items
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

// ========== PUBLISH ALL CATEGORIES ==========
async function publishCategories() {
  console.log('📂 Publishing categories...\n');

  const data = await graphql(`{ menuCategories(status: DRAFT) { documentId name } }`);
  if (!data) return;

  for (const cat of data.menuCategories) {
    await graphql(`
      mutation PublishCategory($documentId: ID!) {
        publishMenuCategory(documentId: $documentId) { documentId }
      }
    `, { documentId: cat.documentId });
    console.log(`  ✓ Published: ${cat.name}`);
  }
}

// ========== PUBLISH ALL MENU ITEMS ==========
async function publishMenuItems() {
  console.log('\n🍽️ Publishing menu items...\n');

  const data = await graphql(`{ menuItems(status: DRAFT, pagination: { limit: 200 }) { documentId name } }`);
  if (!data) return;

  for (const item of data.menuItems) {
    await graphql(`
      mutation PublishMenuItem($documentId: ID!) {
        publishMenuItem(documentId: $documentId) { documentId }
      }
    `, { documentId: item.documentId });
    console.log(`  ✓ Published: ${item.name}`);
  }
}

// ========== ADD REMAINING MENU ITEMS ==========
async function addRemainingItems() {
  console.log('\n🍽️ Adding remaining menu items...\n');

  // Get all categories (including just published ones)
  const catData = await graphql(`{ menuCategories { documentId slug } }`);
  if (!catData) return;

  const categories = {};
  catData.menuCategories.forEach(c => categories[c.slug] = c.documentId);
  console.log('  Categories found:', Object.keys(categories).join(', '));

  // Get existing items
  const itemData = await graphql(`{ menuItems(pagination: { limit: 200 }) { slug } }`);
  const existingSlugs = new Set(itemData?.menuItems.map(i => i.slug) || []);

  const newItems = [
    // ========== Заготовки (Semi-finished) ==========
    { name: 'Caesar Dressing', nameUk: 'Соус Цезар', slug: 'caesar-dressing', price: 25, categorySlug: 'semi-finished', description: 'House-made Caesar dressing', descriptionUk: 'Домашній соус Цезар (100 мл)', outputType: 'cold', prepTime: 5 },
    { name: 'Pesto', nameUk: 'Песто', slug: 'pesto', price: 35, categorySlug: 'semi-finished', description: 'Basil pesto sauce', descriptionUk: 'Класичний соус песто з базиліку (100 мл)', outputType: 'cold', prepTime: 5 },
    { name: 'Chicken Stock Prep', nameUk: 'Курячий бульйон (заготовка)', slug: 'chicken-stock-prep', price: 45, categorySlug: 'semi-finished', description: '1 liter chicken stock', descriptionUk: 'Курячий бульйон (1л)', outputType: 'kitchen', prepTime: 5 },
    { name: 'Mashed Base', nameUk: 'Основа для пюре', slug: 'mashed-base', price: 35, categorySlug: 'semi-finished', description: 'Pre-made mashed potato base', descriptionUk: 'Готова основа для пюре (500г)', outputType: 'kitchen', prepTime: 5 },
    { name: 'Marinated Chicken', nameUk: 'Мариноване куряче філе', slug: 'marinated-chicken', price: 85, categorySlug: 'semi-finished', description: 'Pre-marinated chicken fillet', descriptionUk: 'Замариноване куряче філе в спеціях (300г)', outputType: 'kitchen', prepTime: 5 },
    { name: 'Garlic Butter', nameUk: 'Часникове масло', slug: 'garlic-butter', price: 25, categorySlug: 'semi-finished', description: 'Compound garlic butter', descriptionUk: 'Масло з часником та травами (50г)', outputType: 'cold', prepTime: 3 },
    { name: 'Caramelized Onions', nameUk: 'Карамелізована цибуля', slug: 'caramelized-onions', price: 30, categorySlug: 'semi-finished', description: 'Slow-cooked caramelized onions', descriptionUk: 'Повільно обсмажена цибуля (150г)', outputType: 'kitchen', prepTime: 5 },
    { name: 'Tomato Sauce Base', nameUk: 'Томатний соус', slug: 'tomato-sauce-base', price: 35, categorySlug: 'semi-finished', description: 'House tomato sauce', descriptionUk: 'Домашній томатний соус (200 мл)', outputType: 'kitchen', prepTime: 5 },

    // ========== Сніданки (Breakfast) ==========
    { name: 'Eggs Benedict', nameUk: 'Яйця Бенедикт', slug: 'eggs-benedict', price: 175, categorySlug: 'breakfast', description: 'Poached eggs with hollandaise', descriptionUk: 'Яйця пашот з соусом голландез на тості', outputType: 'kitchen', prepTime: 15 },
    { name: 'Omelette with Cheese', nameUk: 'Омлет з сиром', slug: 'omelette-cheese', price: 125, categorySlug: 'breakfast', description: '3 eggs omelette with cheese', descriptionUk: 'Омлет з 3 яєць з сиром та травами', outputType: 'kitchen', prepTime: 10 },
    { name: 'Pancakes', nameUk: 'Панкейки', slug: 'pancakes', price: 145, categorySlug: 'breakfast', description: 'Fluffy pancakes with maple syrup', descriptionUk: 'Пухкі панкейки з кленовим сиропом', outputType: 'pastry', prepTime: 12 },
    { name: 'Granola Bowl', nameUk: 'Гранола', slug: 'granola-bowl', price: 135, categorySlug: 'breakfast', description: 'Granola with yogurt and berries', descriptionUk: 'Гранола з йогуртом та ягодами', outputType: 'cold', prepTime: 5 },
    { name: 'French Toast', nameUk: 'Французький тост', slug: 'french-toast', price: 155, categorySlug: 'breakfast', description: 'Cinnamon French toast', descriptionUk: 'Французькі тости з корицею та медом', outputType: 'kitchen', prepTime: 10 },
    { name: 'Scrambled Eggs', nameUk: 'Скрембл', slug: 'scrambled-eggs', price: 115, categorySlug: 'breakfast', description: 'Creamy scrambled eggs', descriptionUk: 'Вершкові яйця-скрембл з тостом', outputType: 'kitchen', prepTime: 8 },
    { name: 'Avocado Toast', nameUk: 'Тост з авокадо', slug: 'avocado-toast', price: 165, categorySlug: 'breakfast', description: 'Smashed avocado on sourdough', descriptionUk: 'Авокадо на тості з яйцем пашот', outputType: 'cold', prepTime: 8 },
    { name: 'Full English', nameUk: 'Англійський сніданок', slug: 'full-english', price: 245, categorySlug: 'breakfast', description: 'Traditional English breakfast', descriptionUk: 'Яйця, бекон, сосиски, квасоля, гриби', outputType: 'kitchen', prepTime: 20 },
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

    const result = await graphql(`
      mutation CreateMenuItem($data: MenuItemInput!) {
        createMenuItem(data: $data) { documentId }
      }
    `, {
      data: {
        name: item.name,
        nameUk: item.nameUk,
        slug: item.slug,
        price: item.price,
        description: item.description,
        descriptionUk: item.descriptionUk,
        outputType: item.outputType,
        preparationTime: item.prepTime,
        available: true,
        category: categoryId,
      },
    });

    if (result?.createMenuItem) {
      console.log(`  ✓ ${item.nameUk} (${item.price} грн)`);
      created++;

      // Also publish the item
      await graphql(`
        mutation PublishMenuItem($documentId: ID!) {
          publishMenuItem(documentId: $documentId) { documentId }
        }
      `, { documentId: result.createMenuItem.documentId });
    } else {
      console.log(`  ✗ ${item.nameUk} - failed`);
    }
  }

  console.log(`\n  Created: ${created}`);
}

// ========== MAIN ==========
async function main() {
  console.log('🍽️ Publish and Seed Script\n');
  console.log('=' .repeat(50) + '\n');

  await publishCategories();
  await publishMenuItems();
  await addRemainingItems();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ All done!');
}

main().catch(console.error);
