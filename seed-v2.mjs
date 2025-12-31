/**
 * Restaurant OS Seed Script v2
 * - Fetches existing data first
 * - Only creates missing items
 * - Uses existing documentIds for relationships
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
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

const ids = { menuCategories: {}, suppliers: {}, yieldProfiles: {}, ingredients: {}, tables: {} };

// ========== FETCH EXISTING DATA ==========
async function fetchExisting() {
  console.log('📥 Fetching existing data...');

  const data = await graphql(`{
    menuCategories(pagination: { limit: 50 }) { documentId slug }
    suppliers(pagination: { limit: 50 }) { documentId name }
    yieldProfiles(pagination: { limit: 50 }) { documentId name }
    ingredients(pagination: { limit: 100 }) { documentId slug }
    tables(pagination: { limit: 50 }) { documentId number }
  }`);

  data.menuCategories.forEach(c => ids.menuCategories[c.slug] = c.documentId);
  data.suppliers.forEach(s => ids.suppliers[s.name] = s.documentId);
  data.yieldProfiles.forEach(y => ids.yieldProfiles[y.name] = y.documentId);
  data.ingredients.forEach(i => ids.ingredients[i.slug] = i.documentId);
  data.tables.forEach(t => ids.tables[`table-${t.number}`] = t.documentId);

  console.log(`  Categories: ${data.menuCategories.length}, Suppliers: ${data.suppliers.length}, YieldProfiles: ${data.yieldProfiles.length}, Ingredients: ${data.ingredients.length}, Tables: ${data.tables.length}`);
}

// ========== SEED DATA ==========
const yieldProfiles = [
  { name: 'Vegetables Standard', baseYieldRatio: 0.85, processYields: [{ processType: 'cleaning', yieldRatio: 0.90 }, { processType: 'peeling', yieldRatio: 0.80 }, { processType: 'cutting', yieldRatio: 0.95 }], wasteBreakdown: [] },
  { name: 'Meat Standard', baseYieldRatio: 0.80, processYields: [{ processType: 'cleaning', yieldRatio: 0.95 }, { processType: 'trimming', yieldRatio: 0.85 }, { processType: 'grilling', yieldRatio: 0.75 }], wasteBreakdown: [] },
  { name: 'Fish Standard', baseYieldRatio: 0.55, processYields: [{ processType: 'cleaning', yieldRatio: 0.60 }, { processType: 'grilling', yieldRatio: 0.80 }], wasteBreakdown: [] },
  { name: 'Greens', baseYieldRatio: 0.70, processYields: [{ processType: 'cleaning', yieldRatio: 0.80 }], wasteBreakdown: [] },
  { name: 'No Loss', baseYieldRatio: 1.0, processYields: [], wasteBreakdown: [] },
];

const ingredients = [
  { name: 'Chicken Fillet', nameUk: 'Куряче філе', slug: 'chicken-fillet', unit: 'kg', minStock: 5, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Meat Standard' },
  { name: 'Pork Leg', nameUk: 'Свинина', slug: 'pork-leg', unit: 'kg', minStock: 3, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Meat Standard' },
  { name: 'Beef Tenderloin', nameUk: 'Яловичина', slug: 'beef-tenderloin', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Meat Standard' },
  { name: 'Salmon Fillet', nameUk: 'Лосось філе', slug: 'salmon-fillet', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Fish Standard' },
  { name: 'Potato', nameUk: 'Картопля', slug: 'potato', unit: 'kg', minStock: 20, mainCategory: 'raw', storageCondition: 'dry_cool', yieldProfileName: 'Vegetables Standard' },
  { name: 'Carrot', nameUk: 'Морква', slug: 'carrot', unit: 'kg', minStock: 10, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Vegetables Standard' },
  { name: 'Onion', nameUk: 'Цибуля', slug: 'onion', unit: 'kg', minStock: 10, mainCategory: 'raw', storageCondition: 'dry_cool', yieldProfileName: 'Vegetables Standard' },
  { name: 'Garlic', nameUk: 'Часник', slug: 'garlic', unit: 'kg', minStock: 2, mainCategory: 'raw', storageCondition: 'dry_cool', yieldProfileName: 'Vegetables Standard' },
  { name: 'Tomato', nameUk: 'Помідори', slug: 'tomato', unit: 'kg', minStock: 5, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Vegetables Standard' },
  { name: 'Bell Pepper', nameUk: 'Перець', slug: 'bell-pepper', unit: 'kg', minStock: 3, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Vegetables Standard' },
  { name: 'Iceberg Lettuce', nameUk: 'Салат Айсберг', slug: 'iceberg-lettuce', unit: 'kg', minStock: 3, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Greens' },
  { name: 'Arugula', nameUk: 'Руккола', slug: 'arugula', unit: 'kg', minStock: 1, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'Greens' },
  { name: 'Heavy Cream 33%', nameUk: 'Вершки 33%', slug: 'cream-33', unit: 'l', minStock: 5, mainCategory: 'dairy', storageCondition: 'refrigerated', yieldProfileName: 'No Loss' },
  { name: 'Parmesan', nameUk: 'Пармезан', slug: 'parmesan', unit: 'kg', minStock: 2, mainCategory: 'dairy', storageCondition: 'refrigerated', yieldProfileName: 'No Loss' },
  { name: 'Butter', nameUk: 'Масло вершкове', slug: 'butter', unit: 'kg', minStock: 3, mainCategory: 'dairy', storageCondition: 'refrigerated', yieldProfileName: 'No Loss' },
  { name: 'Wheat Flour', nameUk: 'Борошно', slug: 'wheat-flour', unit: 'kg', minStock: 10, mainCategory: 'dry_goods', storageCondition: 'dry_cool', yieldProfileName: 'No Loss' },
  { name: 'Rice', nameUk: 'Рис', slug: 'rice', unit: 'kg', minStock: 10, mainCategory: 'dry_goods', storageCondition: 'dry_cool', yieldProfileName: 'No Loss' },
  { name: 'Spaghetti', nameUk: 'Спагеті', slug: 'spaghetti', unit: 'kg', minStock: 5, mainCategory: 'dry_goods', storageCondition: 'dry_cool', yieldProfileName: 'No Loss' },
  { name: 'Salt', nameUk: 'Сіль', slug: 'salt', unit: 'kg', minStock: 5, mainCategory: 'seasonings', storageCondition: 'dry_cool', yieldProfileName: 'No Loss' },
  { name: 'Olive Oil', nameUk: 'Олія оливкова', slug: 'olive-oil', unit: 'l', minStock: 5, mainCategory: 'oils_fats', storageCondition: 'dry_cool', yieldProfileName: 'No Loss' },
  { name: 'Sunflower Oil', nameUk: 'Олія соняшникова', slug: 'sunflower-oil', unit: 'l', minStock: 10, mainCategory: 'oils_fats', storageCondition: 'dry_cool', yieldProfileName: 'No Loss' },
  { name: 'Eggs', nameUk: 'Яйця', slug: 'eggs', unit: 'pcs', minStock: 60, mainCategory: 'raw', storageCondition: 'refrigerated', yieldProfileName: 'No Loss' },
];

const tables = [
  { number: 1, capacity: 2, zone: 'main_hall', status: 'free', isActive: true },
  { number: 2, capacity: 2, zone: 'main_hall', status: 'free', isActive: true },
  { number: 3, capacity: 4, zone: 'main_hall', status: 'free', isActive: true },
  { number: 4, capacity: 4, zone: 'main_hall', status: 'free', isActive: true },
  { number: 5, capacity: 6, zone: 'main_hall', status: 'free', isActive: true },
  { number: 6, capacity: 6, zone: 'main_hall', status: 'free', isActive: true },
  { number: 7, capacity: 8, zone: 'main_hall', status: 'free', isActive: true },
  { number: 8, capacity: 4, zone: 'terrace', status: 'free', isActive: true },
  { number: 9, capacity: 4, zone: 'terrace', status: 'free', isActive: true },
  { number: 10, capacity: 6, zone: 'terrace', status: 'free', isActive: true },
];

// ========== SEED FUNCTIONS ==========
async function seedYieldProfiles() {
  console.log('\n📊 Seeding Yield Profiles...');
  for (const yp of yieldProfiles) {
    if (ids.yieldProfiles[yp.name]) {
      console.log(`  ⏭ ${yp.name} exists`);
      continue;
    }
    try {
      const result = await graphql(`mutation($data: YieldProfileInput!) { createYieldProfile(data: $data) { documentId name } }`, { data: yp });
      ids.yieldProfiles[yp.name] = result.createYieldProfile.documentId;
      console.log(`  ✓ ${yp.name}`);
    } catch (e) {
      console.log(`  ✗ ${yp.name}: ${e.message}`);
    }
  }
}

async function seedIngredients() {
  console.log('\n🥕 Seeding Ingredients...');
  for (const ing of ingredients) {
    if (ids.ingredients[ing.slug]) {
      console.log(`  ⏭ ${ing.nameUk} exists`);
      continue;
    }
    const yieldProfileId = ids.yieldProfiles[ing.yieldProfileName];
    const data = { name: ing.name, nameUk: ing.nameUk, slug: ing.slug, unit: ing.unit, minStock: ing.minStock, mainCategory: ing.mainCategory, storageCondition: ing.storageCondition, isActive: true, currentStock: 0, yieldProfile: yieldProfileId };
    try {
      const result = await graphql(`mutation($data: IngredientInput!) { createIngredient(data: $data) { documentId slug } }`, { data });
      ids.ingredients[ing.slug] = result.createIngredient.documentId;
      console.log(`  ✓ ${ing.nameUk}`);
    } catch (e) {
      console.log(`  ✗ ${ing.nameUk}: ${e.message}`);
    }
  }
}

async function seedTables() {
  console.log('\n🪑 Seeding Tables...');
  for (const tbl of tables) {
    if (ids.tables[`table-${tbl.number}`]) {
      console.log(`  ⏭ Table #${tbl.number} exists`);
      continue;
    }
    try {
      const result = await graphql(`mutation($data: TableInput!) { createTable(data: $data) { documentId number } }`, { data: tbl });
      ids.tables[`table-${tbl.number}`] = result.createTable.documentId;
      console.log(`  ✓ Стіл #${tbl.number}`);
    } catch (e) {
      console.log(`  ✗ Table #${tbl.number}: ${e.message}`);
    }
  }
}

async function seedRecipesAndMenuItems() {
  console.log('\n📖 Seeding Recipes and Menu Items...');

  const recipes = [
    {
      name: 'Chicken Kyiv', nameUk: 'Курка по-київськи', slug: 'chicken-kyiv', category: 'hot-dishes',
      price: 285, descriptionUk: 'Класична курка по-київськи',
      prepTimeMinutes: 25, cookTimeMinutes: 15, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'fry',
      ingredients: [
        { slug: 'chicken-fillet', quantity: 0.2, unit: 'kg', processChain: ['cleaning'], wasteAllowancePercent: 5 },
        { slug: 'butter', quantity: 0.03, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
        { slug: 'eggs', quantity: 2, unit: 'pcs', processChain: [], wasteAllowancePercent: 0 },
        { slug: 'sunflower-oil', quantity: 0.1, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
      ],
      steps: [{ stepNumber: 1, description: 'Prepare and fry', station: 'fry', estimatedTimeMinutes: 15, processType: 'frying' }],
    },
    {
      name: 'Caesar Salad', nameUk: 'Салат Цезар', slug: 'caesar-salad', category: 'salads',
      price: 195, descriptionUk: 'Класичний Цезар з куркою',
      prepTimeMinutes: 15, cookTimeMinutes: 10, outputType: 'cold', servingCourse: 'starter', primaryStation: 'salad',
      ingredients: [
        { slug: 'chicken-fillet', quantity: 0.15, unit: 'kg', processChain: ['cleaning'], wasteAllowancePercent: 5 },
        { slug: 'iceberg-lettuce', quantity: 0.1, unit: 'kg', processChain: ['cleaning'], wasteAllowancePercent: 10 },
        { slug: 'parmesan', quantity: 0.03, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
      ],
      steps: [{ stepNumber: 1, description: 'Assemble salad', station: 'salad', estimatedTimeMinutes: 5, processType: 'portioning' }],
    },
    {
      name: 'Pasta Carbonara', nameUk: 'Паста Карбонара', slug: 'pasta-carbonara', category: 'hot-dishes',
      price: 175, descriptionUk: 'Італійська паста з беконом',
      prepTimeMinutes: 10, cookTimeMinutes: 15, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'hot',
      ingredients: [
        { slug: 'spaghetti', quantity: 0.15, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
        { slug: 'pork-leg', quantity: 0.08, unit: 'kg', processChain: ['cutting'], wasteAllowancePercent: 5 },
        { slug: 'cream-33', quantity: 0.1, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
        { slug: 'eggs', quantity: 2, unit: 'pcs', processChain: [], wasteAllowancePercent: 0 },
      ],
      steps: [{ stepNumber: 1, description: 'Cook and combine', station: 'hot', estimatedTimeMinutes: 15, processType: 'boiling' }],
    },
    {
      name: 'French Fries', nameUk: 'Картопля фрі', slug: 'french-fries', category: 'sides',
      price: 65, descriptionUk: 'Хрустка картопля фрі',
      prepTimeMinutes: 10, cookTimeMinutes: 8, outputType: 'kitchen', servingCourse: 'main', primaryStation: 'fry',
      ingredients: [
        { slug: 'potato', quantity: 0.25, unit: 'kg', processChain: ['peeling'], wasteAllowancePercent: 25 },
        { slug: 'sunflower-oil', quantity: 0.15, unit: 'l', processChain: [], wasteAllowancePercent: 0 },
        { slug: 'salt', quantity: 0.005, unit: 'kg', processChain: [], wasteAllowancePercent: 0 },
      ],
      steps: [{ stepNumber: 1, description: 'Fry potatoes', station: 'fry', estimatedTimeMinutes: 8, processType: 'frying' }],
    },
  ];

  for (const recipe of recipes) {
    // Check all ingredients exist
    const missingIng = recipe.ingredients.filter(i => !ids.ingredients[i.slug]);
    if (missingIng.length > 0) {
      console.log(`  ⏭ ${recipe.nameUk} - missing ingredients: ${missingIng.map(i => i.slug).join(', ')}`);
      continue;
    }

    const recipeData = {
      name: recipe.name, nameUk: recipe.nameUk, slug: recipe.slug, instructions: recipe.descriptionUk,
      portionYield: 1, prepTimeMinutes: recipe.prepTimeMinutes, cookTimeMinutes: recipe.cookTimeMinutes, isActive: true,
      ingredients: recipe.ingredients.map(ing => ({ ingredient: ids.ingredients[ing.slug], quantity: ing.quantity, unit: ing.unit, processChain: ing.processChain, wasteAllowancePercent: ing.wasteAllowancePercent, isOptional: false })),
      steps: recipe.steps,
    };

    try {
      const recipeResult = await graphql(`mutation($data: RecipeInput!) { createRecipe(data: $data) { documentId name } }`, { data: recipeData });
      console.log(`  ✓ Recipe: ${recipe.nameUk}`);

      const menuItemData = {
        name: recipe.name, nameUk: recipe.nameUk, slug: recipe.slug,
        description: recipe.descriptionUk, descriptionUk: recipe.descriptionUk,
        price: recipe.price, available: true,
        recipe: recipeResult.createRecipe.documentId,
        category: ids.menuCategories[recipe.category],
        outputType: recipe.outputType, servingCourse: recipe.servingCourse, primaryStation: recipe.primaryStation,
        preparationTime: recipe.prepTimeMinutes + recipe.cookTimeMinutes,
      };
      await graphql(`mutation($data: MenuItemInput!) { createMenuItem(data: $data) { documentId name } }`, { data: menuItemData });
      console.log(`  ✓ MenuItem: ${recipe.nameUk} - ${recipe.price} грн`);
    } catch (e) {
      console.log(`  ✗ ${recipe.nameUk}: ${e.message}`);
    }
  }
}

async function seedStockBatches() {
  console.log('\n📦 Seeding Stock Batches...');

  const batches = [
    { ingredient: 'chicken-fillet', grossIn: 10, unitCost: 120, daysUntilExpiry: 5 },
    { ingredient: 'pork-leg', grossIn: 8, unitCost: 150, daysUntilExpiry: 6 },
    { ingredient: 'beef-tenderloin', grossIn: 5, unitCost: 280, daysUntilExpiry: 5 },
    { ingredient: 'salmon-fillet', grossIn: 4, unitCost: 450, daysUntilExpiry: 3 },
    { ingredient: 'potato', grossIn: 50, unitCost: 15, daysUntilExpiry: 30 },
    { ingredient: 'carrot', grossIn: 20, unitCost: 18, daysUntilExpiry: 21 },
    { ingredient: 'onion', grossIn: 25, unitCost: 12, daysUntilExpiry: 45 },
    { ingredient: 'tomato', grossIn: 15, unitCost: 45, daysUntilExpiry: 7 },
    { ingredient: 'iceberg-lettuce', grossIn: 8, unitCost: 55, daysUntilExpiry: 5 },
    { ingredient: 'cream-33', grossIn: 15, unitCost: 95, daysUntilExpiry: 14 },
    { ingredient: 'parmesan', grossIn: 5, unitCost: 650, daysUntilExpiry: 90 },
    { ingredient: 'butter', grossIn: 10, unitCost: 180, daysUntilExpiry: 30 },
    { ingredient: 'wheat-flour', grossIn: 25, unitCost: 28, daysUntilExpiry: 180 },
    { ingredient: 'rice', grossIn: 20, unitCost: 42, daysUntilExpiry: 365 },
    { ingredient: 'spaghetti', grossIn: 15, unitCost: 55, daysUntilExpiry: 365 },
    { ingredient: 'olive-oil', grossIn: 10, unitCost: 220, daysUntilExpiry: 365 },
    { ingredient: 'sunflower-oil', grossIn: 20, unitCost: 65, daysUntilExpiry: 365 },
    { ingredient: 'eggs', grossIn: 120, unitCost: 4.5, daysUntilExpiry: 21 },
  ];

  const now = new Date();
  for (const batch of batches) {
    const ingredientId = ids.ingredients[batch.ingredient];
    if (!ingredientId) {
      console.log(`  ⏭ ${batch.ingredient} - ingredient not found`);
      continue;
    }

    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + batch.daysUntilExpiry);

    const data = {
      ingredient: ingredientId,
      batchNumber: `BTH-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      receivedAt: now.toISOString(),
      expiryDate: expiryDate.toISOString().split('T')[0],
      grossIn: batch.grossIn,
      netAvailable: batch.grossIn,
      usedAmount: 0,
      wastedAmount: 0,
      unitCost: batch.unitCost,
      totalCost: batch.grossIn * batch.unitCost,
      status: 'available',
      isLocked: false,
      processes: [],
    };

    try {
      await graphql(`mutation($data: StockBatchInput!) { createStockBatch(data: $data) { documentId } }`, { data });
      console.log(`  ✓ ${batch.ingredient}: ${batch.grossIn} од.`);
    } catch (e) {
      console.log(`  ✗ ${batch.ingredient}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Restaurant OS Seed v2\n');

  try {
    await fetchExisting();
    await seedYieldProfiles();
    await seedIngredients();
    await seedTables();
    await seedRecipesAndMenuItems();
    await seedStockBatches();

    console.log('\n✅ Seed completed!');
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

main();
