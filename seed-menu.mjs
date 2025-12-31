/**
 * Seed Menu with Ukrainian names and more items
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

// ========== UPDATE CATEGORIES WITH UKRAINIAN NAMES ==========
async function updateCategories() {
  console.log('📂 Updating categories...');

  const categoryUkNames = {
    'Hot Dishes': 'Гарячі страви',
    'Cold Appetizers': 'Холодні закуски',
    'Salads': 'Салати',
    'Soups': 'Супи',
    'Desserts': 'Десерти',
    'Drinks': 'Напої',
    'Side Dishes': 'Гарніри',
  };

  const data = await graphql(`{ menuCategories { documentId name } }`);
  if (!data) return;

  for (const cat of data.menuCategories) {
    const nameUk = categoryUkNames[cat.name];
    if (!nameUk) continue;

    await graphql(`
      mutation UpdateCategory($documentId: ID!, $data: MenuCategoryInput!) {
        updateMenuCategory(documentId: $documentId, data: $data) { documentId }
      }
    `, {
      documentId: cat.documentId,
      data: { nameUk },
    });
    console.log(`  ✓ ${cat.name} -> ${nameUk}`);
  }
}

// ========== UPDATE MENU ITEMS WITH UKRAINIAN NAMES ==========
async function updateMenuItems() {
  console.log('\n🍽️ Updating menu items...');

  const itemUkData = {
    'Caesar Salad': { nameUk: 'Салат Цезар', descriptionUk: 'Класичний салат з куркою, пармезаном та соусом Цезар' },
    'French Fries': { nameUk: 'Картопля фрі', descriptionUk: 'Хрустка картопля з соусом на вибір' },
    'Chicken Kyiv': { nameUk: 'Курка по-київськи', descriptionUk: 'Котлета з курки з вершковим маслом та травами' },
    'Pasta Carbonara': { nameUk: 'Паста Карбонара', descriptionUk: 'Спагеті з беконом, яйцем та пармезаном' },
  };

  const data = await graphql(`{ menuItems { documentId name } }`);
  if (!data) return;

  for (const item of data.menuItems) {
    const ukData = itemUkData[item.name];
    if (!ukData) continue;

    await graphql(`
      mutation UpdateMenuItem($documentId: ID!, $data: MenuItemInput!) {
        updateMenuItem(documentId: $documentId, data: $data) { documentId }
      }
    `, {
      documentId: item.documentId,
      data: ukData,
    });
    console.log(`  ✓ ${item.name} -> ${ukData.nameUk}`);
  }
}

// ========== ADD MORE MENU ITEMS ==========
async function addMoreMenuItems() {
  console.log('\n🍽️ Adding more menu items...');

  // Get categories
  const catData = await graphql(`{ menuCategories { documentId name } }`);
  if (!catData) return;

  const categories = {};
  catData.menuCategories.forEach(c => categories[c.name] = c.documentId);

  // Get existing items
  const itemData = await graphql(`{ menuItems { slug } }`);
  const existingSlugs = new Set(itemData?.menuItems.map(i => i.slug) || []);

  const newItems = [
    // Hot Dishes
    { name: 'Grilled Salmon', nameUk: 'Лосось гриль', slug: 'grilled-salmon', price: 385, categoryName: 'Hot Dishes', description: 'Fresh salmon with herbs', descriptionUk: 'Свіжий лосось з травами та овочами гриль', outputType: 'kitchen', prepTime: 20 },
    { name: 'Ribeye Steak', nameUk: 'Стейк Рібай', slug: 'ribeye-steak', price: 580, categoryName: 'Hot Dishes', description: 'Premium beef ribeye 300g', descriptionUk: 'Преміум яловичина 300г з соусом на вибір', outputType: 'kitchen', prepTime: 25 },
    { name: 'Pork Ribs', nameUk: 'Свинячі ребра', slug: 'pork-ribs', price: 345, categoryName: 'Hot Dishes', description: 'BBQ pork ribs', descriptionUk: 'Запечені ребра в BBQ соусі', outputType: 'kitchen', prepTime: 30 },
    { name: 'Duck Breast', nameUk: 'Качина грудка', slug: 'duck-breast', price: 425, categoryName: 'Hot Dishes', description: 'Roasted duck breast with berry sauce', descriptionUk: 'Запечена качка з ягідним соусом', outputType: 'kitchen', prepTime: 25 },

    // Salads
    { name: 'Greek Salad', nameUk: 'Грецький салат', slug: 'greek-salad', price: 165, categoryName: 'Salads', description: 'Fresh vegetables with feta', descriptionUk: 'Свіжі овочі з бринзою та оливками', outputType: 'cold', prepTime: 10 },
    { name: 'Caprese', nameUk: 'Капрезе', slug: 'caprese', price: 185, categoryName: 'Salads', description: 'Tomatoes with mozzarella and basil', descriptionUk: 'Помідори з моцарелою та базиліком', outputType: 'cold', prepTime: 8 },

    // Soups
    { name: 'Borsch', nameUk: 'Борщ', slug: 'borsch', price: 125, categoryName: 'Soups', description: 'Traditional Ukrainian beet soup', descriptionUk: 'Традиційний український борщ з пампушками', outputType: 'kitchen', prepTime: 10 },
    { name: 'Mushroom Cream Soup', nameUk: 'Грибний крем-суп', slug: 'mushroom-soup', price: 145, categoryName: 'Soups', description: 'Creamy mushroom soup', descriptionUk: 'Ніжний крем-суп з білих грибів', outputType: 'kitchen', prepTime: 12 },
    { name: 'Chicken Broth', nameUk: 'Курячий бульйон', slug: 'chicken-broth', price: 95, categoryName: 'Soups', description: 'Clear chicken broth with noodles', descriptionUk: 'Прозорий бульйон з локшиною', outputType: 'kitchen', prepTime: 8 },

    // Cold Appetizers
    { name: 'Bruschetta', nameUk: 'Брускета', slug: 'bruschetta', price: 135, categoryName: 'Cold Appetizers', description: 'Toasted bread with tomatoes', descriptionUk: 'Хрусткий хліб з томатами та базиліком', outputType: 'cold', prepTime: 8 },
    { name: 'Carpaccio', nameUk: 'Карпаччо з яловичини', slug: 'carpaccio', price: 225, categoryName: 'Cold Appetizers', description: 'Thin sliced raw beef', descriptionUk: 'Тонко нарізана яловичина з рукколою', outputType: 'cold', prepTime: 10 },
    { name: 'Cheese Plate', nameUk: 'Сирна тарілка', slug: 'cheese-plate', price: 295, categoryName: 'Cold Appetizers', description: 'Assorted cheeses with honey', descriptionUk: 'Асорті сирів з медом та горіхами', outputType: 'cold', prepTime: 5 },

    // Desserts
    { name: 'Tiramisu', nameUk: 'Тірамісу', slug: 'tiramisu', price: 145, categoryName: 'Desserts', description: 'Italian coffee dessert', descriptionUk: 'Італійський десерт з маскарпоне та кавою', outputType: 'pastry', prepTime: 5 },
    { name: 'Napoleon', nameUk: 'Наполеон', slug: 'napoleon', price: 125, categoryName: 'Desserts', description: 'Layered puff pastry cake', descriptionUk: 'Листковий торт з заварним кремом', outputType: 'pastry', prepTime: 5 },
    { name: 'Cheesecake', nameUk: 'Чізкейк', slug: 'cheesecake', price: 155, categoryName: 'Desserts', description: 'New York style cheesecake', descriptionUk: 'Класичний чізкейк з ягодами', outputType: 'pastry', prepTime: 5 },

    // Drinks
    { name: 'Fresh Orange Juice', nameUk: 'Свіжий апельсин', slug: 'orange-juice', price: 85, categoryName: 'Drinks', description: 'Freshly squeezed orange', descriptionUk: 'Фреш з апельсинів', outputType: 'bar', prepTime: 3 },
    { name: 'Lemonade', nameUk: 'Лимонад', slug: 'lemonade', price: 75, categoryName: 'Drinks', description: 'Homemade lemonade', descriptionUk: 'Домашній лимонад', outputType: 'bar', prepTime: 3 },
    { name: 'Espresso', nameUk: 'Еспресо', slug: 'espresso', price: 55, categoryName: 'Drinks', description: 'Double espresso', descriptionUk: 'Подвійний еспресо', outputType: 'bar', prepTime: 2 },
    { name: 'Cappuccino', nameUk: 'Капучино', slug: 'cappuccino', price: 75, categoryName: 'Drinks', description: 'Coffee with milk foam', descriptionUk: 'Кава з молочною пінкою', outputType: 'bar', prepTime: 3 },
    { name: 'Aperol Spritz', nameUk: 'Апероль Шпріц', slug: 'aperol-spritz', price: 175, categoryName: 'Drinks', description: 'Aperol with prosecco', descriptionUk: 'Апероль з просекко та содовою', outputType: 'bar', prepTime: 3 },

    // Side Dishes
    { name: 'Mashed Potatoes', nameUk: 'Картопляне пюре', slug: 'mashed-potatoes', price: 55, categoryName: 'Side Dishes', description: 'Creamy mashed potatoes', descriptionUk: 'Вершкове картопляне пюре', outputType: 'kitchen', prepTime: 5 },
    { name: 'Grilled Vegetables', nameUk: 'Овочі гриль', slug: 'grilled-vegetables', price: 75, categoryName: 'Side Dishes', description: 'Seasonal grilled vegetables', descriptionUk: 'Сезонні овочі на грилі', outputType: 'kitchen', prepTime: 10 },
    { name: 'Rice', nameUk: 'Рис', slug: 'rice', price: 45, categoryName: 'Side Dishes', description: 'Steamed rice', descriptionUk: 'Відварний рис', outputType: 'kitchen', prepTime: 5 },
  ];

  let created = 0;
  for (const item of newItems) {
    if (existingSlugs.has(item.slug)) {
      console.log(`  ⏭ ${item.nameUk} exists`);
      continue;
    }

    const categoryId = categories[item.categoryName];
    if (!categoryId) {
      console.log(`  ✗ ${item.nameUk} - category not found: ${item.categoryName}`);
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

  console.log(`  Created: ${created}`);
}

// ========== UPDATE RECIPES WITH UKRAINIAN NAMES ==========
async function updateRecipes() {
  console.log('\n📋 Updating recipes...');

  const recipeUkNames = {
    'Caesar Salad': 'Салат Цезар',
    'French Fries': 'Картопля фрі',
    'Chicken Kyiv': 'Курка по-київськи',
    'Pasta Carbonara': 'Паста Карбонара',
  };

  const data = await graphql(`{ recipes { documentId name } }`);
  if (!data) return;

  for (const recipe of data.recipes) {
    const nameUk = recipeUkNames[recipe.name];
    if (!nameUk) continue;

    await graphql(`
      mutation UpdateRecipe($documentId: ID!, $data: RecipeInput!) {
        updateRecipe(documentId: $documentId, data: $data) { documentId }
      }
    `, {
      documentId: recipe.documentId,
      data: { nameUk },
    });
    console.log(`  ✓ ${recipe.name} -> ${nameUk}`);
  }
}

// ========== MAIN ==========
async function main() {
  console.log('🍽️ Seeding Menu Data\n');

  await updateCategories();
  await updateMenuItems();
  await addMoreMenuItems();
  await updateRecipes();

  console.log('\n✅ Menu seed completed!');
}

main().catch(console.error);
