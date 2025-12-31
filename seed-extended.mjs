/**
 * Extended Seed Script
 * Adds missing categories and menu items
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

// ========== ADD MISSING CATEGORIES ==========
async function addCategories() {
  console.log('📂 Adding new categories...\n');

  const newCategories = [
    { name: 'Semi-finished', nameUk: 'Заготовки', slug: 'semi-finished', sortOrder: 8, icon: 'chef-hat' },
    { name: 'Breakfast', nameUk: 'Сніданки', slug: 'breakfast', sortOrder: 9, icon: 'sunrise' },
    { name: 'Kids Menu', nameUk: 'Дитяче меню', slug: 'kids-menu', sortOrder: 10, icon: 'baby' },
    { name: 'Alcohol', nameUk: 'Алкоголь', slug: 'alcohol', sortOrder: 11, icon: 'wine' },
    { name: 'Sauces', nameUk: 'Соуси', slug: 'sauces', sortOrder: 12, icon: 'droplet' },
    { name: 'Bread', nameUk: 'Хліб та випічка', slug: 'bread', sortOrder: 13, icon: 'croissant' },
  ];

  // Get existing categories
  const catData = await graphql(`{ menuCategories { slug } }`);
  const existingSlugs = new Set(catData?.menuCategories.map(c => c.slug) || []);

  let created = 0;
  for (const cat of newCategories) {
    if (existingSlugs.has(cat.slug)) {
      console.log(`  ⏭ ${cat.nameUk} exists`);
      continue;
    }

    const result = await graphql(`
      mutation CreateCategory($data: MenuCategoryInput!) {
        createMenuCategory(data: $data) { documentId }
      }
    `, {
      data: {
        name: cat.name,
        nameUk: cat.nameUk,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        icon: cat.icon,
        isActive: true,
      },
    });

    if (result?.createMenuCategory) {
      console.log(`  ✓ ${cat.nameUk}`);
      created++;
    } else {
      console.log(`  ✗ ${cat.nameUk} - failed`);
    }
  }

  console.log(`  Created: ${created}\n`);
}

// ========== ADD MENU ITEMS FOR NEW CATEGORIES ==========
async function addMenuItems() {
  console.log('🍽️ Adding menu items...\n');

  // Get all categories
  const catData = await graphql(`{ menuCategories { documentId name slug } }`);
  if (!catData) return;

  const categories = {};
  catData.menuCategories.forEach(c => categories[c.slug] = c.documentId);

  // Get existing items
  const itemData = await graphql(`{ menuItems { slug } }`);
  const existingSlugs = new Set(itemData?.menuItems.map(i => i.slug) || []);

  const newItems = [
    // ========== Заготовки (Semi-finished) ==========
    { name: 'Caesar Dressing', nameUk: 'Соус Цезар', slug: 'caesar-dressing', price: 25, categorySlug: 'semi-finished', description: 'House-made Caesar dressing', descriptionUk: 'Домашній соус Цезар (100 мл)', outputType: 'cold', prepTime: 5 },
    { name: 'Pesto', nameUk: 'Песто', slug: 'pesto', price: 35, categorySlug: 'semi-finished', description: 'Basil pesto sauce', descriptionUk: 'Класичний соус песто з базиліку (100 мл)', outputType: 'cold', prepTime: 5 },
    { name: 'Chicken Stock', nameUk: 'Курячий бульйон', slug: 'chicken-stock-prep', price: 45, categorySlug: 'semi-finished', description: '1 liter chicken stock', descriptionUk: 'Курячий бульйон (1л)', outputType: 'kitchen', prepTime: 5 },
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

    // ========== Дитяче меню (Kids Menu) ==========
    { name: 'Kids Pasta', nameUk: 'Дитяча паста', slug: 'kids-pasta', price: 95, categorySlug: 'kids-menu', description: 'Pasta with butter and cheese', descriptionUk: 'Макарони з маслом та сиром', outputType: 'kitchen', prepTime: 10 },
    { name: 'Kids Nuggets', nameUk: 'Нагетси', slug: 'kids-nuggets', price: 115, categorySlug: 'kids-menu', description: 'Chicken nuggets with fries', descriptionUk: 'Курячі нагетси з картоплею фрі', outputType: 'kitchen', prepTime: 12 },
    { name: 'Kids Pizza', nameUk: 'Дитяча піца', slug: 'kids-pizza', price: 125, categorySlug: 'kids-menu', description: 'Mini margherita pizza', descriptionUk: 'Маленька піца Маргарита', outputType: 'kitchen', prepTime: 15 },
    { name: 'Kids Soup', nameUk: 'Дитячий суп', slug: 'kids-soup', price: 75, categorySlug: 'kids-menu', description: 'Mild chicken soup', descriptionUk: 'М\'який курячий супчик з локшиною', outputType: 'kitchen', prepTime: 8 },
    { name: 'Kids Ice Cream', nameUk: 'Дитяче морозиво', slug: 'kids-ice-cream', price: 65, categorySlug: 'kids-menu', description: 'Vanilla ice cream with sauce', descriptionUk: 'Ванільне морозиво з сиропом', outputType: 'pastry', prepTime: 3 },

    // ========== Алкоголь (Alcohol) ==========
    { name: 'House Red Wine', nameUk: 'Домашнє червоне вино', slug: 'house-red-wine', price: 95, categorySlug: 'alcohol', description: 'Glass of house red', descriptionUk: 'Бокал червоного вина (150 мл)', outputType: 'bar', prepTime: 1 },
    { name: 'House White Wine', nameUk: 'Домашнє біле вино', slug: 'house-white-wine', price: 95, categorySlug: 'alcohol', description: 'Glass of house white', descriptionUk: 'Бокал білого вина (150 мл)', outputType: 'bar', prepTime: 1 },
    { name: 'Draft Beer', nameUk: 'Розливне пиво', slug: 'draft-beer', price: 75, categorySlug: 'alcohol', description: '0.5l draft beer', descriptionUk: 'Світле пиво 0,5л', outputType: 'bar', prepTime: 1 },
    { name: 'Mojito', nameUk: 'Мохіто', slug: 'mojito', price: 165, categorySlug: 'alcohol', description: 'Classic mojito cocktail', descriptionUk: 'Класичний коктейль Мохіто', outputType: 'bar', prepTime: 5 },
    { name: 'Margarita', nameUk: 'Маргарита', slug: 'margarita', price: 175, categorySlug: 'alcohol', description: 'Tequila lime cocktail', descriptionUk: 'Коктейль з текілою та лаймом', outputType: 'bar', prepTime: 5 },
    { name: 'Whiskey Sour', nameUk: 'Віскі Сауер', slug: 'whiskey-sour', price: 185, categorySlug: 'alcohol', description: 'Bourbon whiskey cocktail', descriptionUk: 'Коктейль з бурбоном та лимоном', outputType: 'bar', prepTime: 5 },

    // ========== Соуси (Sauces) ==========
    { name: 'BBQ Sauce', nameUk: 'BBQ соус', slug: 'bbq-sauce', price: 35, categorySlug: 'sauces', description: 'House BBQ sauce', descriptionUk: 'Домашній соус BBQ (50 мл)', outputType: 'cold', prepTime: 1 },
    { name: 'Garlic Sauce', nameUk: 'Часниковий соус', slug: 'garlic-sauce', price: 35, categorySlug: 'sauces', description: 'Creamy garlic sauce', descriptionUk: 'Вершковий соус з часником (50 мл)', outputType: 'cold', prepTime: 1 },
    { name: 'Honey Mustard', nameUk: 'Медово-гірчичний', slug: 'honey-mustard', price: 35, categorySlug: 'sauces', description: 'Sweet honey mustard', descriptionUk: 'Солодка медова гірчиця (50 мл)', outputType: 'cold', prepTime: 1 },
    { name: 'Tartar Sauce', nameUk: 'Тартар', slug: 'tartar-sauce', price: 35, categorySlug: 'sauces', description: 'Classic tartar sauce', descriptionUk: 'Класичний соус Тартар (50 мл)', outputType: 'cold', prepTime: 1 },
    { name: 'Sour Cream', nameUk: 'Сметана', slug: 'sour-cream', price: 25, categorySlug: 'sauces', description: 'Fresh sour cream', descriptionUk: 'Свіжа сметана (50 мл)', outputType: 'cold', prepTime: 1 },

    // ========== Хліб (Bread) ==========
    { name: 'Bread Basket', nameUk: 'Хлібний кошик', slug: 'bread-basket', price: 55, categorySlug: 'bread', description: 'Assorted bread basket', descriptionUk: 'Асорті хліба з маслом', outputType: 'cold', prepTime: 3 },
    { name: 'Focaccia', nameUk: 'Фокача', slug: 'focaccia', price: 45, categorySlug: 'bread', description: 'Italian herb focaccia', descriptionUk: 'Італійська фокача з травами', outputType: 'pastry', prepTime: 3 },
    { name: 'Garlic Bread', nameUk: 'Часникові грінки', slug: 'garlic-bread', price: 65, categorySlug: 'bread', description: 'Toasted garlic bread', descriptionUk: 'Підсмажений хліб з часниковим маслом', outputType: 'kitchen', prepTime: 5 },
    { name: 'Pampushky', nameUk: 'Пампушки', slug: 'pampushky', price: 45, categorySlug: 'bread', description: 'Ukrainian garlic buns', descriptionUk: 'Традиційні пампушки з часником', outputType: 'pastry', prepTime: 3 },
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
    } else {
      console.log(`  ✗ ${item.nameUk} - failed`);
    }
  }

  console.log(`\n  Created: ${created}`);
}

// ========== MAIN ==========
async function main() {
  console.log('🍽️ Extended Seed Script\n');
  console.log('=' .repeat(50) + '\n');

  await addCategories();
  await addMenuItems();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Extended seed completed!');
}

main().catch(console.error);
